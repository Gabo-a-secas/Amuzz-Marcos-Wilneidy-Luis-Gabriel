from flask_mail import Message
from flask import current_app
import os

def send_verification_email(user):
    """Envía email de verificación SIN commit automático"""
    try:
        mail = current_app.extensions['mail']
        
        token = user.verification_token
        if not token:
            print("❌ No hay token generado")
            return False
        
        frontend_url = os.getenv('FRONTEND_URL', 'https://urban-rotary-phone-pjwx7g97pjwqh967g-3000.app.github.dev')

        verification_url = f"{frontend_url.rstrip('/')}/verify-email?token={token}"
        
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
        
        mail.send(msg)
        print(f"✅ Email sent successfully to {user.email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False