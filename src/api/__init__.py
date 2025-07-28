from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from api.routes import api
from api.stripe import stripe_bp  # 👈 importa aquí tu blueprint
from api.models import db

def create_app():
    app = Flask(__name__)

    app.config["JWT_SECRET_KEY"] = "super-secret"
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    JWTManager(app)
    CORS(app)

    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(stripe_bp)  # 👈 REGISTRA stripe_bp

    return app
