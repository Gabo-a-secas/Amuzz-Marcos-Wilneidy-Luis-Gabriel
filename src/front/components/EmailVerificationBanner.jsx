import { useState, useEffect } from 'react';
import BackendURL from './BackendURL';

const EmailVerificationBanner = ({ email, onResendEmail, onClose }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); 

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const handleResend = async () => {
    if (!email) {
      showMessage('Email address is required', 'error');
      return;
    }

    setIsResending(true);
    setMessage(''); 
    
    console.log('🔄 Reenviando email de verificación para:', email);

    try {
      const response = await fetch(`${BackendURL}/api/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('📡 Respuesta del servidor:', data);

      if (response.ok) {
        showMessage(data.message || 'Verification email sent! Please check your inbox.', 'success');
        setResendCooldown(60);
        
        if (onResendEmail) {
          onResendEmail(true);
        }
      } else {
        if (response.status === 400) {
          showMessage(data.message || 'Invalid email address', 'error');
        } else if (response.status === 404) {
          showMessage('User not found. Please register again.', 'error');
        } else if (response.status === 409) {
          showMessage('Email already verified', 'success');
        } else {
          showMessage(data.message || 'Failed to resend email. Please try again later.', 'error');
        }
        
        if (onResendEmail) {
          onResendEmail(false);
        }
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showMessage('Unable to connect to server. Please check your internet connection.', 'error');
      } else {
        showMessage('Network error. Please check your connection and try again.', 'error');
      }
      
      if (onResendEmail) {
        onResendEmail(false);
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="verification-banner">
      <div className="verification-content">
        <span className="verification-icon">✉️</span>
        <div className="verification-text">
          <p className="verification-title">Verify your email address</p>
          <p className="verification-subtitle">
            We've sent a verification email to <strong>{email}</strong>
          </p>
          {message && (
            <p className={`verification-message ${messageType}`}>
              {messageType === 'success' ? '✅' : '❌'} {message}
            </p>
          )}
        </div>
        <div className="verification-actions">
          <button
            className="verification-resend-btn"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <>
                <span className="spinner">🔄</span> Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              'Resend email'
            )}
          </button>
          {onClose && (
            <button
              className="verification-close-btn"
              onClick={handleClose}
              title="Close banner"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;