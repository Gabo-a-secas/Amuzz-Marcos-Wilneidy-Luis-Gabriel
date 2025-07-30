import { useState, useContext } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import BackendURL from './BackendURL';
import { StoreContext } from "../hooks/useGlobalReducer";
import EmailVerificationBanner from './EmailVerificationBanner';

const LoginModal = ({ show, onClose, onLoginSuccess, onSwitchToRegister }) => {
  const { dispatch } = useContext(StoreContext);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // NUEVOS ESTADOS PARA VERIFICACIÓN
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

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
    
    // Resetear estado de verificación cuando cambie el email
    if (name === 'email' && needsVerification) {
      setNeedsVerification(false);
      setUnverifiedEmail('');
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
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setNeedsVerification(false);

    try {
      const response = await fetch(`${BackendURL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        const { token, user } = data;

        localStorage.setItem('token', token);

        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });

        if (onLoginSuccess) onLoginSuccess({ user, token });

        alert(data.message || 'Login successful!');
        setFormData({ email: '', password: '' });
        onClose();
      } else {
        // MANEJAR CASO DE EMAIL NO VERIFICADO
        if (response.status === 403 && data.requires_verification) {
          setNeedsVerification(true);
          setUnverifiedEmail(data.email);
          setErrors({
            general: data.message || 'Please verify your email before logging in.'
          });
        } else {
          setErrors({
            general: data.message || 'Login failed. Please check your credentials.'
          });
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
    if (!isLoading) onClose();
  };

  // FUNCIÓN PARA MANEJAR EL CIERRE Y LIMPIAR ESTADOS
  const handleClose = () => {
    setNeedsVerification(false);
    setUnverifiedEmail('');
    setErrors({});
    onClose();
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
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close"
            />
          </div>

          <div className="modal-body">
            {/* MOSTRAR BANNER DE VERIFICACIÓN SI ES NECESARIO */}
            {needsVerification && unverifiedEmail && (
              <EmailVerificationBanner email={unverifiedEmail} />
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              {errors.general && <div className="form-alert form-alert-danger">{errors.general}</div>}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Enter your email"
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && <span className="form-error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="form-error-message">{errors.password}</span>}
              </div>

              <div className="form-links">
                <a
                  href="#"
                  className="form-link"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Forgot password functionality coming soon!');
                  }}
                >
                  Forgot your password?
                </a>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-btn modal-btn-secondary" onClick={handleClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="modal-btn modal-btn-primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="form-spinner" /> Logging in...
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
              onClick={() => onSwitchToRegister && onSwitchToRegister()}
              disabled={isLoading}
            >
              Register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;