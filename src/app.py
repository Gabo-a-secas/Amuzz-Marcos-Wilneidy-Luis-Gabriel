from flask import Flask, request, jsonify
from sqlalchemy import select
from flask_migrate import Migrate
from datetime import datetime, timedelta, timezone
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_swagger import swagger
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from api.utils import APIException, generate_sitemap
from api.models import db, User, Playlist, PlaylistSong
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from api.stripe import stripe_bp
from flask_mail import Mail, Message
import secrets
from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 2525))
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAIL_USE_TLS'] = os.getenv(
    'MAIL_USE_TLS', 'True').lower() == 'true'
app.config['MAIL_USE_SSL'] = os.getenv(
    'MAIL_USE_SSL', 'False').lower() == 'true'
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')

mail = Mail(app)

CORS(app, resources={
    r"/*": {
        "origins": [
            "https://legendary-eureka-975rxjgrgp6v3xjrr-3000.app.github.dev",
            "https://*.github.dev",
            "http://localhost:*",
            "http://localhost:5173"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
        "supports_credentials": True,
        "expose_headers": ["Content-Type", "Authorization"]
    }
})

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["JWT_SECRET_KEY"] = "super-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
jwt = JWTManager(app)

db.init_app(app)
migrate = Migrate(app, db)

with app.app_context():
    db.create_all()
    print("Base de datos creada")
    setup_commands(app)

app.register_blueprint(api, url_prefix='/api')
app.register_blueprint(stripe_bp)


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Auth API"})


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
            date_of_birth=datetime.strptime(
                date_of_birth, '%Y-%m-%d').date() if date_of_birth else None,
            password_hash=hashed_password,
            email_verified=False
        )
        db.session.add(new_user)
        db.session.commit()

        from api.email_service import send_verification_email

        email_sent = False
        try:
            email_sent = send_verification_email(new_user)
            print(f"✅ Email enviado: {email_sent}")
            print(f"📧 Email destinatario: {new_user.email}")
            print(f"🔑 Token generado: {new_user.verification_token}")
        except Exception as e:
            print(f"❌ Error enviando email: {e}")

        if email_sent:
            return jsonify({
                "message": "Usuario registrado correctamente. Por favor verifica tu email.",
                "email": new_user.email,
                "requires_verification": True
            }), 201
        else:
            return jsonify({
                "message": "Usuario registrado pero no pudimos enviar el email de verificación. Por favor intenta reenviar.",
                "email": new_user.email,
                "requires_verification": True
            }), 201

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

        print(f"User found: {user.email}, checking password...")

        if not check_password_hash(user.password_hash, password):
            print("Password verification failed")
            return jsonify({"message": "Credenciales inválidas"}), 401

        if not user.email_verified:
            return jsonify({
                "message": "Por favor verifica tu email antes de iniciar sesión",
                "email_verified": False,
                "email": user.email,
                "requires_verification": True
            }), 403

        token = create_access_token(
            identity={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "full_name": user.full_name
            }
        )
        expires_in = int(
            app.config['JWT_ACCESS_TOKEN_EXPIRES'].total_seconds())
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
                "full_name": user.full_name,
                "email_verified": user.email_verified
            }
        }), 200
    except Exception as e:
        print(f'Error durante el login: {e}')
        return jsonify({"message": "Ocurrió un error durante el login"}), 500


@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(id=user_id)
    ).scalar_one_or_none()
    email = user.email if user else "Usuario"
    return jsonify({"message": f"Hola, {email}"}), 200


if __name__ == '__main__':
    app.run(debug=True, port=3001, host='0.0.0.0')
