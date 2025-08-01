"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Blueprint, request, jsonify
import requests
import os
from dotenv import load_dotenv
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_jwt_extended import jwt_required, get_jwt_identity

load_dotenv()

api = Blueprint('api', __name__)

JAMENDO_CLIENT_ID = os.getenv("JAMENDO_CLIENT_ID", "64b5cce9") 

@api.route('/hello', methods=['GET', 'POST'])
def handle_hello():
    return jsonify({"message": "Hello! I'm a message that came from the backend."}), 200

@api.route('/admin-zone', methods=['GET'])
@jwt_required()
def admin_zone():
    user = get_jwt_identity()
    user_from_db = User.query.get(user['id'])

    if not user_from_db:
        return jsonify({"msg": "Acceso denegado"}), 403

    return jsonify({"msg": f"Bienvenido, admin {user['email']}"}), 200

@api.route('/music/mood/<string:mood>', methods=['GET'])
def get_music_by_mood(mood):
    try:
        url = "https://api.jamendo.com/v3.0/tracks"
        params = {
            "client_id": JAMENDO_CLIENT_ID,
            "format": "json",
            "limit": 20,
            "audioformat": "mp31",
            "include": "musicinfo",
            "fuzzytags": mood,
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
                "image": track.get("album_image") or track.get("image"),
                "license": track["license_ccurl"],
                
                "duration": track["duration"],
                "album_name": track["album_name"],
                "release_date": track["releasedate"],
                "waveform": track["waveform"],
                "genres": track["musicinfo"]["tags"]["genres"],
            }
            for track in tracks
        ]

        

        return jsonify(simplified), 200
    except Exception as e:
        raise APIException(str(e), 500)
