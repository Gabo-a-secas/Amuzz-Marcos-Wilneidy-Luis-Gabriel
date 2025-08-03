from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase, relationship
from datetime import datetime, timedelta
import secrets


class Base(DeclarativeBase):
    pass


db = SQLAlchemy(model_class=Base)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    date_of_birth = db.Column(db.Date, nullable=True)
    password_hash = db.Column(db.String(200), nullable=False)
    email_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_token = db.Column(db.String(100), unique=True, nullable=True)
    verification_token_expires = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"User(username={self.username!r}, email={self.email!r})"

    def serialize(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "username": self.username,
            "email": self.email,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "email_verified": self.email_verified
        }

    def generate_verification_token(self):
        """Genera un token único para verificación de email"""
        self.verification_token = secrets.token_urlsafe(32)
        self.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        return self.verification_token
    
    def verify_email(self, token):
        """Verifica el email si el token es válido"""
        try:
            if (self.verification_token == token and
                self.verification_token_expires and
                self.verification_token_expires > datetime.utcnow()):
                self.email_verified = True
                self.verification_token = None
                self.verification_token_expires = None
                return True
            return False
        except Exception as e:
            print(f"Error verificando email: {e}")
            return False


class Playlist(db.Model):
    __tablename__ = 'playlists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    description = db.Column(db.String(250))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, ForeignKey('user.id'), nullable=False)

    user = relationship('User', backref=db.backref('playlists', lazy=True))


class PlaylistSong(db.Model):
    __tablename__ = 'playlist_songs'

    id = db.Column(db.Integer, primary_key=True)
    playlist_id = db.Column(db.Integer, ForeignKey(
        'playlists.id'), nullable=False)
    song_id = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String, nullable=False)
    artist = db.Column(db.String, nullable=False)
    audio_url = db.Column(db.String, nullable=False)
    image_url = db.Column(db.String, nullable=True)
    license_url = db.Column(db.String, nullable=True)
    added_at = db.Column(db.DateTime, default=datetime.utcnow)

    playlist = relationship('Playlist', backref=db.backref('songs', lazy=True))

    def serialize(self):
        return {
            "id": self.id,
            "playlist_id": self.playlist_id,
            "song_id": self.song_id,
            "name": self.name,
            "artist": self.artist,
            "audio_url": self.audio_url,
            "image_url": self.image_url,
            "license_url": self.license_url,
            "added_at": self.added_at.isoformat()
        }
