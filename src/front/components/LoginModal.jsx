import { useState, useContext } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import BackendURL from './BackendURL';
import { StoreContext } from "../hooks/useGlobalReducer";
import { useNotifications } from '../NotificationProvider';
import EmailVerificationBanner from './EmailVerificationBanner';

const LoginModal = ({ show, onClose, onLoginSuccess, onSwitchToRegister }) => {
  const { dispatch } = useContext(StoreContext);
  const { showSuccess, showError, showWarning } = useNotifications();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
    
    if (name === 'email' && needsVerification) {
      setNeedsVerification(false);
      setUnverifiedEmail('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor ingresa un email válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
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

    console.log('🔐 Intentando login para:', formData.email);

    try {
      const response = await fetch(`${BackendURL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('📡 Respuesta del login:', data);

      if (response.ok) {
        const { access_token, user } = data;

        localStorage.setItem('token', access_token);
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user, access_token } });

        if (onLoginSuccess) {
          onLoginSuccess(data.user);
        }

        console.log('✅ Login exitoso para:', user.email);
        showSuccess(`¡Bienvenido de vuelta, ${user.username || user.email}! 🎵`);
        setFormData({ email: '', password: '' });
        onClose();
      } else {
        console.log('❌ Error de login:', response.status, data);
        
        if (response.status === 403 && data.requires_verification) {
          console.log('📧 Email no verificado, mostrando banner');
          setNeedsVerification(true);
          setUnverifiedEmail(data.email || formData.email);
          showWarning('Por favor verifica tu email antes de iniciar sesión');
          setErrors({
            general: data.message || 'Por favor verifica tu email antes de iniciar sesión.'
          });
        } else if (response.status === 401) {
          showError('Email o contraseña incorrectos. Verifica tus credenciales.');
          setErrors({
            general: 'Email o contraseña incorrectos. Verifica tus credenciales.'
          });
        } else if (response.status === 404) {
          showError('Usuario no encontrado. Verifica tu email o regístrate.');
          setErrors({
            general: 'Usuario no encontrado. Verifica tu email o regístrate.'
          });
        } else {
          showError(data.message || 'Error en el login. Intenta de nuevo.');
          setErrors({
            general: data.message || 'Error en el login. Intenta de nuevo.'
          });
        }
      }
    } catch (error) {
      console.error('❌ Error de red en login:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError('No se puede conectar al servidor. Verifica tu conexión a internet.');
        setErrors({ 
          general: 'No se puede conectar al servidor. Verifica tu conexión a internet.' 
        });
      } else {
        showError('Error de red. Verifica tu conexión e intenta de nuevo.');
        setErrors({ 
          general: 'Error de red. Verifica tu conexión e intenta de nuevo.' 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleClose();
    }
  };

  const handleClose = () => {
    setNeedsVerification(false);
    setUnverifiedEmail('');
    setErrors({});
    setFormData({ email: '', password: '' }); 
    onClose();
  };

  const handleResendEmail = (success) => {
    if (success) {
      console.log('📧 Email de verificación reenviado');
      showSuccess('Email de verificación enviado correctamente');
    }
  };

  const handleCloseBanner = () => {
    setNeedsVerification(false);
    setUnverifiedEmail('');
  };

  const handleForgotPassword = () => {
    showWarning('La funcionalidad de recuperar contraseña estará disponible pronto. 🚧');
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Iniciar Sesión</h5>
            <button
              type="button"
              className="modal-close-btn"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Cerrar"
            />
          </div>

          <div className="modal-body">
            {needsVerification && unverifiedEmail && (
              <EmailVerificationBanner 
                email={unverifiedEmail}
                onResendEmail={handleResendEmail}
                onClose={handleCloseBanner}
              />
            )}

            <form className="modal-form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="form-alert form-alert-danger">
                  {errors.general}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Ingresa tu email"
                  autoComplete="email"
                  autoFocus
                />
                {errors.email && <span className="form-error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Ingresa tu contraseña"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                    handleForgotPassword();
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="modal-btn modal-btn-secondary" 
              onClick={handleClose} 
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="modal-btn modal-btn-primary" 
              onClick={handleSubmit} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="form-spinner" /> Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </div>

          <div className="modal-divider">
            <span>¿No tienes una cuenta?</span>
          </div>

          <div className="modal-footer-secondary">
            <button
              type="button"
              className="form-link-button"
              onClick={() => onSwitchToRegister && onSwitchToRegister()}
              disabled={isLoading}
            >
              Registrarse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;