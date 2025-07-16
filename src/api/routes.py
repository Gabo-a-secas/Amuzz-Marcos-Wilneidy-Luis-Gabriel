"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import requests
from flask import Blueprint, request, jsonify
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)

@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():
    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }
    return jsonify(response_body), 200

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
