import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BackendURL from '../components/BackendURL';
import { useNotifications } from '../NotificationProvider';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const { showSuccess, showError, showInfo } = useNotifications();

  useEffect(() => {
    const VerifyEmail = async () => {
      const token = searchParams.get('token');
      
      console.log('🔍 Token extraído:', token);
      console.log('🏠 BackendURL:', BackendURL);
      
      if (!token) {
        console.error('❌ No se encontró token en la URL');
        setStatus('error');
        setMessage('Enlace de verificación inválido. Por favor revisa tu email e intenta de nuevo.');
        showError('Enlace de verificación inválido. Por favor revisa tu email e intenta de nuevo.');
        return;
      }

      const url = `${BackendURL}/api/verify-email/${token}`;
      console.log('🌐 URL de verificación:', url);

      try {
        showInfo('Verificando tu email...', 'Verificación en Proceso');
        
        const response = await fetch(url, {
          method: 'GET', 
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('📡 Response status:', response.status);
        
        const data = await response.json();
        console.log('📦 Response data:', data);

        if (response.ok) {
          setStatus('success');
          const successMessage = data.message || '¡Email verificado exitosamente!';
          setMessage(successMessage);
          showSuccess(`${successMessage} 🎉 Serás redirigido al inicio en unos segundos.`, 'Verificación Exitosa');
          
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          console.error('❌ Error del servidor:', data);
          setStatus('error');
          
          let errorMessage = '';
          if (response.status === 400) {
            errorMessage = data.message || 'Enlace de verificación inválido o expirado.';
          } else if (response.status === 404) {
            errorMessage = 'Endpoint de verificación no encontrado. Por favor contacta soporte.';
          } else {
            errorMessage = data.message || 'Verificación fallida. Por favor intenta de nuevo.';
          }
          
          setMessage(errorMessage);
          showError(errorMessage, 'Error de Verificación');
        }
      } catch (error) {
        console.error('❌ Network error:', error);
        setStatus('error');
        
        let errorMessage = '';
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage = 'No se puede conectar al servidor. Por favor verifica tu conexión a internet.';
        } else {
          errorMessage = 'Error de red. Por favor intenta de nuevo más tarde.';
        }
        
        setMessage(errorMessage);
        showError(errorMessage, 'Error de Conexión');
      }
    };

    VerifyEmail();
  }, [searchParams, navigate, showSuccess, showError, showInfo]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'verifying' && (
          <>
            <div className="verify-spinner"></div>
            <h2>Verificando tu email...</h2>
            <p>Por favor espera mientras verificamos tu dirección de email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verify-icon success">✓</div>
            <h2>¡Email Verificado!</h2>
            <p>{message}</p>
            <p>Redirigiendo al inicio en 3 segundos...</p>
            <button 
              className="verify-btn"
              onClick={() => navigate('/')}
              style={{ marginTop: '15px' }}
            >
              Ir al Inicio Ahora
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-icon error">✗</div>
            <h2>Error de Verificación</h2>
            <p>{message}</p>
            <div style={{ marginTop: '20px' }}>
              <button 
                className="verify-btn"
                onClick={() => navigate('/')}
                style={{ marginRight: '10px' }}
              >
                Ir al Inicio
              </button>
              <button 
                className="verify-btn"
                onClick={() => navigate('/register')}
                style={{ backgroundColor: '#6c757d' }}
              >
                Registrarse Nuevamente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;