import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BackendURL from '../components/BackendURL';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const VerifyEmail = async () => {
      const token = searchParams.get('token');
      
      // Debug logs
      console.log('🔍 Token extraído:', token);
      console.log('🏠 BackendURL:', BackendURL);
      
      if (!token) {
        console.error('❌ No se encontró token en la URL');
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      const url = `${BackendURL}/api/verify-email/${token}`;
      console.log('🌐 URL de verificación:', url);

      try {
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
          setMessage(data.message || 'Email verified successfully!');
          
          // Redirigir después de 3 segundos
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          // Manejar diferentes tipos de errores
          console.error('❌ Error del servidor:', data);
          setStatus('error');
          
          // Personalizar mensajes según el error
          if (response.status === 400) {
            setMessage(data.message || 'Invalid or expired verification link.');
          } else if (response.status === 404) {
            setMessage('Verification endpoint not found. Please contact support.');
          } else {
            setMessage(data.message || 'Verification failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('❌ Network error:', error);
        setStatus('error');
        
        // Mensaje más específico para errores de red
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          setMessage('Unable to connect to server. Please check your internet connection.');
        } else {
          setMessage('Network error. Please try again later.');
        }
      }
    };

    VerifyEmail();
  }, [searchParams, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'verifying' && (
          <>
            <div className="verify-spinner"></div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verify-icon success">✓</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <p>Redirecting to home in 3 seconds...</p>
            <button 
              className="verify-btn"
              onClick={() => navigate('/')}
              style={{ marginTop: '15px' }}
            >
              Go to Home Now
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-icon error">✗</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <div style={{ marginTop: '20px' }}>
              <button 
                className="verify-btn"
                onClick={() => navigate('/')}
                style={{ marginRight: '10px' }}
              >
                Go to Home
              </button>
              <button 
                className="verify-btn"
                onClick={() => navigate('/register')}
                style={{ backgroundColor: '#6c757d' }}
              >
                Register Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;