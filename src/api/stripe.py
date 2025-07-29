from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from api.models import db, User
import stripe
import os

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

stripe_bp = Blueprint('stripe_bp', __name__)

@stripe_bp.route('/api/create-checkout-session', methods=['POST', 'OPTIONS'])
@cross_origin(origins="*")
@jwt_required(optional=True)
def create_checkout_session():
    if request.method == "OPTIONS":
        return jsonify({}), 200
    try:
        identity = get_jwt_identity()
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {'name': 'Amuzz Premium Access'},
                    'unit_amount': 500,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url=f'{frontend_url}/payment-success',
            cancel_url=f'{frontend_url}/payment-cancelled',
            metadata={'email': identity} if identity else {}
        )
        return jsonify({'url': session.url}), 200
    except Exception as e:
        print(f"Error en checkout: {e}")
        return jsonify({'error': str(e)}), 500

@stripe_bp.route('/api/webhook', methods=['POST'])
@cross_origin(origins="*")
def stripe_webhook():
    payload = request.data
    sig_header = request.headers.get('stripe-signature')
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, endpoint_secret)
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            user_email = session['metadata'].get('email')
            if user_email:
                user = db.session.execute(
                    db.select(User).filter_by(email=user_email)
                ).scalar_one_or_none()
                if user:
                    user.is_premium = True
                    db.session.commit()
                    print(f"Usuario {user_email} ahora es premium.")
                else:
                    print(f"Usuario con email {user_email} no encontrado.")
    except Exception as e:
        current_app.logger.error(f"Error en webhook: {e}")
        return jsonify({'error': str(e)}), 400
    return jsonify({'status': 'success'}), 200
