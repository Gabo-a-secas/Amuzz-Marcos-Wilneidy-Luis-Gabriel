import { useState, useEffect } from 'react';
import BackendURL from './BackendURL';
import { useNotifications } from '../NotificationProvider';

const EmailVerificationBanner = ({ email, onResendEmail, onClose }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (!email) {
      showError('Se requiere una dirección de email', 'Error');
      return;
    }

    setIsResending(true);
    
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
        showSuccess(
          `📧 Email de verificación enviado a ${email}. Revisa tu bandeja de entrada.`,
          'Email Enviado'
        );
        setResendCooldown(60);
        
        if (onResendEmail) {
          onResendEmail(true);
        }
      } else {
        if (response.status === 400) {
          showError(data.message || 'Dirección de email inválida', 'Error');
        } else if (response.status === 404) {
          showError('Usuario no encontrado. Por favor regístrate nuevamente.', 'Usuario No Encontrado');
        } else if (response.status === 409) {
          showSuccess('El email ya está verificado', 'Email Ya Verificado');
        } else {
          showError(data.message || 'Error al reenviar email. Intenta de nuevo más tarde.', 'Error de Envío');
        }
        
        if (onResendEmail) {
          onResendEmail(false);
        }
      }
    } catch (error) {
      console.error('❌ Error de red:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError('No se puede conectar al servidor. Verifica tu conexión a internet.', 'Error de Conexión');
      } else {
        showError('Error de red. Verifica tu conexión e intenta de nuevo.', 'Error de Red');
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
          <p className="verification-title">Verifica tu dirección de email</p>
          <p className="verification-subtitle">
            Te hemos enviado un email de verificación a <strong>{email}</strong>
          </p>
        </div>
        <div className="verification-actions">
          <button
            className="verification-resend-btn"
            onClick={handleResend}
            disabled={isResending || resendCooldown > 0}
          >
            {isResending ? (
              <>
                <span className="spinner">🔄</span> Enviando...
              </>
            ) : resendCooldown > 0 ? (
              `Reenviar en ${resendCooldown}s`
            ) : (
              'Reenviar email'
            )}
          </button>
          {onClose && (
            <button
              className="verification-close-btn"
              onClick={handleClose}
              title="Cerrar banner"
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