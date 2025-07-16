"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Blueprint, request, jsonify
import requests
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)
CORS(api)

# Ruta de prueba
@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    return jsonify({
        "message": "Hello! I'm a message that came from the backend."
    }), 200

# Ruta solo para admin (ejemplo: usuarios activos)
@api.route('/admin-zone', methods=['GET'])
@jwt_required()
def admin_zone():
    user = get_jwt_identity()
    user_from_db = User.query.get(user['id'])

    if not user_from_db:
        return jsonify({"msg": "Acceso denegado"}), 403

    return jsonify({"msg": f"Bienvenido, admin {user['email']}"}), 200

# JAMENDO API - obtener música por estado de ánimo
JAMENDO_CLIENT_ID = "64b5cce9"

@api.route('/music/mood/<string:mood>', methods=['GET'])
def get_music_by_mood(mood):
    try:
        url = "https://api.jamendo.com/v3.0/tracks"
        params = {
            "client_id": JAMENDO_CLIENT_ID,
            "format": "json",
            "limit": 10,
            "audioformat": "mp31",
            "include": "musicinfo",
            "tags": mood,
            "audiodownload_allowed": "true"
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            raise APIException("Error al conectar con Jamendo", 500)

        tracks = response.json().get("results", [])
        simplified = [
            {
                "id": track["id"],
                "name": track["name"],
                "artist": track["artist_name"],
                "audio": track["audio"],
                "image": track["album_image"],
                "license": track["license_ccurl"]
            }
            for track in tracks
        ]

        return jsonify(simplified), 200

    except Exception as e:
        raise APIException(str(e), 500)
