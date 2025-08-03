"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Blueprint, request, jsonify
import requests
import os
import secrets
from datetime import datetime, timedelta
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from api.models import db, User, Playlist, PlaylistSong
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

@api.route('/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Validaciones
        required_fields = ['full_name', 'username', 'email', 'password', 'confirm_password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'message': f'{field} is required'}), 400
        
        if data['password'] != data['confirm_password']:
            return jsonify({'message': 'Passwords do not match'}), 400
            
        # Verificar si el usuario ya existe
        existing_user = db.session.execute(
            db.select(User).filter(
                (User.email == data['email'].lower()) | 
                (User.username == data['username'])
            )
        ).scalar_one_or_none()
        
        if existing_user:
            if existing_user.email == data['email'].lower():
                return jsonify({'message': 'Email already registered'}), 409
            else:
                return jsonify({'message': 'Username already taken'}), 409
        
        # Crear usuario
        user = User(
            full_name=data['full_name'],
            username=data['username'],
            email=data['email'].lower(),
            date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date() if data.get('date_of_birth') else None,
            password_hash=generate_password_hash(data['password']),
            email_verified=False
        )
        

        user.verification_token = secrets.token_urlsafe(32)
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        
       
        db.session.add(user)
        db.session.flush()  
        
        from api.email_service import send_verification_email
        
        try:
            email_sent = send_verification_email(user)
            if email_sent:
                db.session.commit() 
                return jsonify({
                    'message': 'Registration successful! Please check your email to verify your account.',
                    'email': user.email
                }), 201
            else:
                db.session.rollback()
                return jsonify({'message': 'Registration failed. Email could not be sent.'}), 500
        except Exception as email_error:
            db.session.rollback()
            print(f'Email error: {email_error}')
            return jsonify({'message': 'Registration failed. Please try again.'}), 500
            
    except Exception as e:
        db.session.rollback()
        print(f'Registration error: {e}')
        return jsonify({'message': 'Registration failed. Please try again.'}), 500

@api.route('/resend-verification', methods=['POST', 'OPTIONS'])
def resend_verification():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'message': 'Email is required'}), 400
        
        user = db.session.execute(
            db.select(User).filter_by(email=email.lower())
        ).scalar_one_or_none()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if user.email_verified:
            return jsonify({'message': 'Email is already verified'}), 400
        
        # Verificar cooldown (evitar spam)
        if user.verification_token_expires and user.verification_token_expires > datetime.utcnow():
            time_left = (user.verification_token_expires - datetime.utcnow()).seconds
            if time_left > 82800:  # 23 horas
                return jsonify({
                    'message': 'Please wait before requesting a new verification email',
                    'wait_time': 86400 - time_left
                }), 429
        
        # ✅ GENERAR NUEVO TOKEN antes de enviar
        user.verification_token = secrets.token_urlsafe(32)
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        from api.email_service import send_verification_email
        if send_verification_email(user):
            db.session.commit()  # ✅ Commit después de enviar email
            return jsonify({'message': 'Verification email sent successfully'}), 200
        else:
            db.session.rollback()
            return jsonify({'message': 'Failed to send verification email'}), 500
            
    except Exception as e:
        db.session.rollback()
        print(f'Resend verification error: {e}')
        return jsonify({'message': 'Failed to resend verification email'}), 500

# --- MÚSICA ---

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

# --- PLAYLISTS ---

@api.route('/playlists', methods=['POST'])
@jwt_required()
def create_playlist():
    current_user_data = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(email=current_user_data['email'])
    ).scalar_one_or_none()

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

@api.route('/playlists', methods=['GET'])
@jwt_required()
def get_playlists():
    current_user_data = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(email=current_user_data['email'])
    ).scalar_one_or_none()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlists = db.session.execute(
        db.select(Playlist).filter_by(user_id=user.id)
    ).scalars().all()
    
    serialized = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "created_at": p.created_at.isoformat()
        } for p in playlists
    ]
    return jsonify(serialized), 200

@api.route('/playlists/<int:playlist_id>', methods=['DELETE'])
@jwt_required()
def delete_playlist(playlist_id):
    current_user_data = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(email=current_user_data['email'])
    ).scalar_one_or_none()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlist = db.session.execute(
        db.select(Playlist).filter_by(id=playlist_id, user_id=user.id)
    ).scalar_one_or_none()
    
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o no tienes permiso"}), 404

    db.session.delete(playlist)
    db.session.commit()
    return jsonify({"message": "Playlist eliminada"}), 200

@api.route('/playlists/<int:playlist_id>/songs', methods=['POST'])
@jwt_required()
def add_song_to_playlist(playlist_id):
    current_user_data = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(email=current_user_data['email'])
    ).scalar_one_or_none()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()
    song_id = data.get('song_id')
    name = data.get('name')
    artist = data.get('artist')
    audio_url = data.get('audio_url')

    if not all([song_id, name, artist, audio_url]):
        return jsonify({"error": "Faltan datos obligatorios de la canción"}), 400

    playlist = db.session.execute(
        db.select(Playlist).filter_by(id=playlist_id, user_id=user.id)
    ).scalar_one_or_none()
    
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o sin permiso"}), 404

    existing = db.session.execute(
        db.select(PlaylistSong).filter_by(playlist_id=playlist_id, song_id=song_id)
    ).scalar_one_or_none()
    
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

@api.route('/playlists/<int:playlist_id>/songs', methods=['GET'])
@jwt_required()
def get_songs_in_playlist(playlist_id):
    current_user_data = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(email=current_user_data['email'])
    ).scalar_one_or_none()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlist = db.session.execute(
        db.select(Playlist).filter_by(id=playlist_id, user_id=user.id)
    ).scalar_one_or_none()
    
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o sin permiso"}), 404

    songs = db.session.execute(
        db.select(PlaylistSong).filter_by(playlist_id=playlist_id)
    ).scalars().all()
    
    songs_serialized = [s.serialize() for s in songs]

    return jsonify(songs_serialized), 200

@api.route('/playlists/<int:playlist_id>/songs/<int:song_entry_id>', methods=['DELETE'])
@jwt_required()
def remove_song_from_playlist(playlist_id, song_entry_id):
    current_user_data = get_jwt_identity()
    user = db.session.execute(
        db.select(User).filter_by(email=current_user_data['email'])
    ).scalar_one_or_none()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    playlist = db.session.execute(
        db.select(Playlist).filter_by(id=playlist_id, user_id=user.id)
    ).scalar_one_or_none()
    
    if not playlist:
        return jsonify({"error": "Playlist no encontrada o sin permiso"}), 404

    song_entry = db.session.execute(
        db.select(PlaylistSong).filter_by(id=song_entry_id, playlist_id=playlist_id)
    ).scalar_one_or_none()
    
    if not song_entry:
        return jsonify({"error": "Canción no encontrada en la playlist"}), 404

    db.session.delete(song_entry)
    db.session.commit()

    return jsonify({"message": "Canción eliminada de la playlist"}), 200