from flask_mail import Message
from flask import render_template_string, current_app
import os

def send_verification_email(user):
    """Envía email de verificación usando Mailtrap"""
    from app import mail 
    
    token = user.generate_verification_token()
    
    msg = Message(
        subject='Verify your email address',
        recipients=[user.email],
        sender=current_app.config['MAIL_DEFAULT_SENDER']
    )
    
    
    html_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #beddb8;
                padding: 20px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }
            .content {
                background-color: #f4f4f4;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #beddb8;
                color: #2c3e2a;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }
            .footer {
                margin-top: 30px;
                font-size: 12px;
                color: #666;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1 style="color: #2c3e2a; margin: 0;">Welcome to Amuzz!</h1>
        </div>
        <div class="content">
            <h2>Hi {{ full_name }},</h2>
            <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
                <a href="{{ verification_link }}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">
                {{ verification_link }}
            </p>
            
            <p><strong>This link will expire in 24 hours.</strong></p>
            
            <div class="footer">
                <p>If you didn't create an account, you can safely ignore this email.</p>
                <p>&copy; 2024 Amuzz. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    verification_link = f"{os.getenv('FRONTEND_URL')}/verify-email?token={token}"
    
    msg.html = render_template_string(
        html_template,
        full_name=user.full_name,
        verification_link=verification_link
    )
    
    msg.body = f"""
    Hi {user.full_name},
    
    Thanks for signing up! Please verify your email address by clicking the link below:
    
    {verification_link}
    
    This link will expire in 24 hours.
    
    If you didn't create an account, you can safely ignore this email.
    """
    
    try:
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False