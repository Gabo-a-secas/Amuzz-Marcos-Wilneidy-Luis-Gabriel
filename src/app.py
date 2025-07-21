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
CORS(app)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

with app.app_context():
    db.init_app(app)
    db.create_all()
    print("Base de datos creada")
    setup_commands(app)

app.register_blueprint(api, url_prefix='/api')

# Manejo de errores
@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# Ruta raíz
@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Auth API"})

# Obtener usuarios
@app.route('/users', methods=['GET'])
def get_users():
    users = db.session.execute(db.select(User)).scalars().all()
    return jsonify([user.serialize() for user in users]), 200

# Registro de usuario
@app.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()

        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if not full_name or not email or not password or not confirm_password:
            return jsonify({"message": "Todos los campos son obligatorios"}), 400

        if password != confirm_password:
            return jsonify({"message": "Las contraseñas no coinciden"}), 400

        existing_user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if existing_user:
            return jsonify({"message": "Este correo ya está registrado"}), 409

        hashed_password = generate_password_hash(password)
        new_user = User(full_name=full_name, email=email, password_hash=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "Usuario registrado correctamente"}), 201

    except Exception as e:
        db.session.rollback()
        print(f'Error durante el registro: {e}')
        return jsonify({"message": "Ocurrió un error durante el registro"}), 500

# Login de usuario
@app.route('/token', methods=['POST'])
def login_user():
    try:
        data = request.get_json()

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"message": "Correo y contraseña requeridos"}), 400

        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Credenciales inválidas"}), 401

        token = create_access_token(identity={"id": user.id, "email": user.email})
        expires_in = int(app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds())

        return jsonify({
            "message": "Login exitoso",
            "token": token,
            "token_type": "bearer",
            "expires_in": expires_in,
            "expires_at": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()
        }), 200

    except Exception as e:
        print(f'Error durante el login: {e}')
        return jsonify({"message": "Ocurrió un error durante el login"}), 500
    

# Ruta protegida
@app.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    identity = get_jwt_identity()
    return jsonify({"message": f"Hola, {identity['email']}"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=3001)
