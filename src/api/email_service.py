from flask_mail import Message
from flask import current_app
import secrets
from datetime import datetime, timedelta

def send_verification_email(user):
    """Envía email de verificación al usuario"""
    try:
    
        from flask import current_app
        mail = current_app.extensions['mail']
        
    
        user.verification_token = secrets.token_urlsafe(32)
        user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Guardar en BD
        from api.models import db
        db.session.commit()
        
        # URL del frontend desde .env
        import os
        frontend_url = os.getenv('FRONTEND_URL', 'https://legendary-eureka-975rxjgrgp6v3xjrr-3000.app.github.dev')
        verification_url = f"{frontend_url.rstrip('/')}/verify-email?token={user.verification_token}"
        
        # Crear mensaje
        msg = Message(
            subject='Verify your email - Amuzz',
            recipients=[user.email],
            sender=current_app.config['MAIL_DEFAULT_SENDER']
        )
        
        msg.html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify your email address</h2>
            <p>Hi {user.full_name},</p>
            <p>Thank you for registering with Amuzz! Please click the button below to verify your email address:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{verification_url}" 
                   style="background-color: #007bff; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block;">
                    Verify Email
                </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">{verification_url}</p>
            
            <p style="color: #666; font-size: 14px;">
                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
            </p>
        </div>
        """
        
        # Enviar email
        mail.send(msg)
        print(f"✅ Email sent successfully to {user.email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False