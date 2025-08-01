import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import BackendURL from '../components/BackendURL';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`${BackendURL}/api/verify-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message);
          
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message);
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };

    verifyEmail();
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
            <p>Redirecting to home...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verify-icon error">✗</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <button 
              className="verify-btn"
              onClick={() => navigate('/')}
            >
              Go to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;