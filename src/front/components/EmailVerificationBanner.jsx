import { useState, useEffect } from 'react';
import BackendURL from './BackendURL';

const EmailVerificationBanner = ({ email, onResendEmail }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${BackendURL}/api/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (response.ok) {
        alert('Verification email sent! Please check your inbox.');
        setResendCooldown(60); 
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to resend email. Please try again later.');
      }
    } catch (error) {
      alert('Network error. Please check your connection.');
    } finally {
      setIsResending(false);
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
        </div>
        <button
          className="verification-resend-btn"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
        >
          {isResending ? 'Sending...' : 
           resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 
           'Resend email'}
        </button>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;