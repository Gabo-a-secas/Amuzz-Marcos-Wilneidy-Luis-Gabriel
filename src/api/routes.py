"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Blueprint, request, jsonify
import requests
import os
from dotenv import load_dotenv
from api.models import db, User, Playlist, PlaylistSong
from api.utils import generate_sitemap, APIException
from flask_jwt_extended import jwt_required, get_jwt_identity

load_dotenv()

api = Blueprint('api', __name__)

# JAMENDO API - obtener música por estado de ánimo
JAMENDO_CLIENT_ID = os.getenv("JAMENDO_CLIENT_ID", "64b5cce9")  # valor por defecto

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

# --- PLAYLISTS ---

# Crear playlist nueva
@api.route('/playlists', methods=['POST'])
@jwt_required()
def create_playlist():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')

    if not name:
        return jsonify({"error": "El nombre es obligatorio"}), 400

    playlist = Playlist(
        name=name,
        description=description,
        user_id=user.id
    )
    db.session.add(playlist)
    db.session.commit()

    return jsonify({
        "message": "Playlist creada",
        "id": playlist.id,
        "name": playlist.name,
        "description": playlist.description
    }), 201

# Obtener todas las playlists del usuario
@api.route('/playlists', methods=['GET'])
@jwt_required()
def get_playlists():
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlists = Playlist.query.filter_by(user_id=user.id).all()
    serialized = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat()
        } for p in playlists
    ]
    return jsonify(serialized), 200

# Borrar una playlist por id
@api.route('/playlists/<int:playlist_id>', methods=['DELETE'])
@jwt_required()
def delete_playlist(playlist_id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlist = Playlist.query.filter_by(id=playlist_id, user_id=user.id).first()
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o no tienes permiso"}), 404

    db.session.delete(playlist)
    db.session.commit()
    return jsonify({"message": "Playlist eliminada"}), 200

# Añadir canción a playlist
@api.route('/playlists/<int:playlist_id>/songs', methods=['POST'])
@jwt_required()
def add_song_to_playlist(playlist_id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()
    song_id = data.get('song_id')
    name = data.get('name')
    artist = data.get('artist')
    audio_url = data.get('audio_url')

    if not all([song_id, name, artist, audio_url]):
        return jsonify({"error": "Faltan datos obligatorios de la canción"}), 400

    playlist = Playlist.query.filter_by(id=playlist_id, user_id=user.id).first()
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o sin permiso"}), 404

    existing = PlaylistSong.query.filter_by(playlist_id=playlist_id, song_id=song_id).first()
    if existing:
        return jsonify({"message": "La canción ya está en la playlist"}), 200

    new_song = PlaylistSong(
        playlist_id=playlist_id,
        song_id=song_id,
        name=name,
        artist=artist,
        audio_url=audio_url,
        image_url=data.get('image_url'),
        license_url=data.get('license_url')
    )

    db.session.add(new_song)
    db.session.commit()

    return jsonify({"message": "Canción añadida a la playlist"}), 201

# Listar canciones de una playlist
@api.route('/playlists/<int:playlist_id>/songs', methods=['GET'])
@jwt_required()
def get_songs_in_playlist(playlist_id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlist = Playlist.query.filter_by(id=playlist_id, user_id=user.id).first()
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o sin permiso"}), 404

    songs = PlaylistSong.query.filter_by(playlist_id=playlist_id).all()
    songs_serialized = [{"id": s.id, "song_id": s.song_id, "added_at": s.added_at.isoformat()} for s in songs]

    return jsonify(songs_serialized), 200

# Borrar canción de la playlist
@api.route('/playlists/<int:playlist_id>/songs/<int:song_entry_id>', methods=['DELETE'])
@jwt_required()
def remove_song_from_playlist(playlist_id, song_entry_id):
    current_user_email = get_jwt_identity()
    user = User.query.filter_by(email=current_user_email).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlist = Playlist.query.filter_by(id=playlist_id, user_id=user.id).first()
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o sin permiso"}), 404

    song_entry = PlaylistSong.query.filter_by(id=song_entry_id, playlist_id=playlist_id).first()
    if not song_entry:
        return jsonify({"error": "Canción no encontrada en la playlist"}), 404

    db.session.delete(song_entry)
    db.session.commit()

    return jsonify({"message": "Canción eliminada de la playlist"}), 200
