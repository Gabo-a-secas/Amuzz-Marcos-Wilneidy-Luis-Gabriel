import { useState } from 'react';
import BackendURL from './BackendURL';

const LoginModal = ({ show, onClose, onLoginSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));


    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }


    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${BackendURL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {

        sessionStorage.setItem('token', data.token);


        localStorage.setItem('authToken', data.token);
        localStorage.setItem('tokenType', data.token_type);
        localStorage.setItem('expiresAt', data.expires_at);


        if (onLoginSuccess) {
          onLoginSuccess({
            token: data.token,
            email: formData.email,
            ...data // pasar toda la data del usuario
          });
        }


        alert(data.message || 'Login successful!');


        setFormData({
          email: '',
          password: ''
        });


        onClose();
      } else {

        if (response.status === 401) {

          setErrors({
            general: 'Invalid email or password. Please check your credentials and try again.'
          });
        } else if (response.status === 400) {
          setErrors({ general: data.message || 'Please fill in all required fields.' });
        } else {
          setErrors({ general: data.message || 'Login failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Login</h5>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            <form className="modal-form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="form-alert form-alert-danger">{errors.general}</div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && (
                  <span className="form-error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                {errors.password && (
                  <span className="form-error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-links">
                <a href="#" className="form-link" onClick={(e) => {
                  e.preventDefault();
                  alert('Forgot password functionality coming soon!');
                }}>
                  Forgot your password?
                </a>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="modal-btn modal-btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="form-spinner"></span>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>

          <div className="modal-divider">
            <span>Don't have an account?</span>
          </div>

          <div className="modal-footer-secondary">
            <button
              type="button"
              className="form-link-button"
              onClick={() => {
                if (onSwitchToRegister) {
                  onSwitchToRegister();
                }
              }}
              disabled={isLoading}
            >
              Create an account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;