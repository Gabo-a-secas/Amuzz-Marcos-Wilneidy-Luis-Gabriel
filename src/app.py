from flask import Flask, request, jsonify
from sqlalchemy import select
from flask_migrate import Migrate
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_swagger import swagger
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from api.utils import APIException, generate_sitemap
from api.models import db, User
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands

app = Flask(__name__)

# Configuración CORS detallada
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://glorious-fortnight-v6rxqj4rxwxxh6wr-3000.app.github.dev",
            "http://localhost:3000",
            "http://localhost:5173"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": [
            "Content-Type",
            "Authorization",
            "Access-Control-Allow-Origin"
        ],
        "supports_credentials": True,
        "expose_headers": [
            "Content-Type",
            "Authorization"
        ]
    }
})

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

# Inicializar base de datos
db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()
    print("Base de datos creada")
    setup_admin(app)
    setup_commands(app)

# Registrar blueprints
app.register_blueprint(api, url_prefix='/api')

@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

@app.route('/')
def home():
    return generate_sitemap(app)

@app.route('/health')
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/api/users', methods=['GET'])
def get_users():
    users = db.session.execute(db.select(User)).scalars().all()
    return jsonify([user.serialize() for user in users]), 200

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register_user():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.get_json()

        full_name = data.get("full_name")
        username = data.get("username")
        email = data.get("email")
        date_of_birth = data.get("date_of_birth")
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if not all([full_name, username, email, password, confirm_password]):
            return jsonify({"message": "Todos los campos son obligatorios"}), 400

        if password != confirm_password:
            return jsonify({"message": "Las contraseñas no coinciden"}), 400

        existing_user_email = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if existing_user_email:
            return jsonify({"message": "Este correo ya está registrado"}), 409

        existing_user_username = db.session.execute(
            db.select(User).filter_by(username=username)
        ).scalar_one_or_none()

        if existing_user_username:
            return jsonify({"message": "Este username ya está en uso"}), 409

        hashed_password = generate_password_hash(password)
        new_user = User(
            full_name=full_name,
            username=username,
            email=email,
            date_of_birth=datetime.strptime(date_of_birth, '%Y-%m-%d').date(),
            password_hash=hashed_password
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Usuario registrado correctamente"}), 201

    except ValueError as e:
        return jsonify({"message": f"Error en el formato de fecha: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        print(f'Error durante el registro: {e}')
        return jsonify({"message": "Ocurrió un error durante el registro"}), 500

@app.route('/api/token', methods=['POST', 'OPTIONS'])
def login_user():
    if request.method == 'OPTIONS':
        return jsonify({}), 200

    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        print(f"Login attempt with email: {email}")

        if not email or not password:
            return jsonify({"message": "Correo y contraseña requeridos"}), 400

        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if not user:
            print(f"User not found with email: {email}")
            return jsonify({"message": "Credenciales inválidas"}), 401

        if not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Credenciales inválidas"}), 401

        token = create_access_token(
            identity={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name
            }
        )
        expires_in = int(app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds())

        return jsonify({
            "message": "Login exitoso",
            "token": token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name
            }
        }), 200

    except Exception as e:
        print(f'Error durante el login: {e}')
        return jsonify({"message": "Ocurrió un error durante el login"}), 500

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    identity = get_jwt_identity()
    return jsonify({"message": f"Hola, {identity['email']}"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=3001, host='0.0.0.0')
