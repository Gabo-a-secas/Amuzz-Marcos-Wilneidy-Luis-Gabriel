"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Blueprint, request, jsonify, current_app
import requests
import stripe
import os
from dotenv import load_dotenv
from api.models import db, User
from api.utils import generate_sitemap, APIException
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

load_dotenv()

api = Blueprint('api', __name__)

# JAMENDO API - obtener música por estado de ánimo
JAMENDO_CLIENT_ID = os.getenv("JAMENDO_CLIENT_ID", "64b5cce9")  # por si no está definido

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

# Stripe setup
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if not stripe.api_key or not STRIPE_WEBHOOK_SECRET:
    raise RuntimeError("Stripe API Key or Webhook Secret not found in environment variables")

@api.route('/create-checkout-session', methods=['POST'])
@jwt_required()
def create_checkout_session():
    user_id = get_jwt_identity()

    try:
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': 'Amuzz Premium Access',
                    },
                    'unit_amount': 500,  # 5.00 EUR en centavos
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='http://localhost:5173/payment-success',
            cancel_url='http://localhost:5173/payment-cancelled',
            metadata={'user_id': user_id}
        )
        return jsonify({'url': checkout_session.url}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/webhook', methods=['POST'])
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )

        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_id = session['metadata'].get('user_id')
            user = db.session.get(User, user_id)
            if user:
                user.is_premium = True
                db.session.commit()

    except Exception as e:
        current_app.logger.error(f"Webhook error: {e}")
        return '', 400

    return '', 200
