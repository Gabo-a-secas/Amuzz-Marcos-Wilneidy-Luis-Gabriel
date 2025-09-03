import { useState } from 'react';
import BackendURL from './BackendURL';
import { Eye, EyeOff } from 'lucide-react';
import { useNotifications } from '../NotificationProvider';

const RegisterModal = ({ show, onClose, onRegisterSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { showSuccess, showError, showWarning } = useNotifications();

  if (!show) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'El nombre completo es requerido';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'El nombre de usuario solo puede contener letras, números y guiones bajos';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Por favor ingresa un email válido';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'La fecha de nacimiento es requerida';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      if (age < 13) {
        newErrors.dateOfBirth = 'Debes tener al menos 13 años';
      } else if (age > 120) {
        newErrors.dateOfBirth = 'Por favor ingresa una fecha de nacimiento válida';
      }
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const apiURL = `${BackendURL.replace(/\/$/, '')}/api/register`;
      console.log('Registering with URL:', apiURL);
      
      const requestBody = {
        full_name: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        date_of_birth: formData.dateOfBirth,
        password: formData.password,
        confirm_password: formData.confirmPassword
      };

      console.log('Request body:', { ...requestBody, password: '[HIDDEN]', confirm_password: '[HIDDEN]' });

      const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);

      if (response.ok) {
        showSuccess(
          `¡Registro exitoso! Te hemos enviado un email de verificación a ${formData.email}. Revisa tu bandeja de entrada.`,
          'Cuenta Creada'
        );

        if (onRegisterSuccess) {
          onRegisterSuccess(formData.email.trim());
        }

        setFormData({
          fullName: '',
          username: '',
          email: '',
          dateOfBirth: '',
          password: '',
          confirmPassword: ''
        });

        onClose();
      } else {
        if (response.status === 409) {
          if (data.message && data.message.toLowerCase().includes('email')) {
            showError('Este email ya está registrado. Intenta con otro email o inicia sesión.');
            setErrors({ email: data.message || 'Este email ya está registrado' });
          } else if (data.message && data.message.toLowerCase().includes('username')) {
            showError('Este nombre de usuario ya está en uso. Prueba con otro.');
            setErrors({ username: data.message || 'Este nombre de usuario ya está en uso' });
          } else {
            showError('El usuario ya existe. Intenta con datos diferentes.');
            setErrors({ general: data.message || 'El usuario ya existe' });
          }
        } else if (response.status === 400) {
          if (data.message && data.message.toLowerCase().includes('password')) {
            setErrors({ confirmPassword: data.message });
          } else if (data.errors) {
            setErrors(data.errors);
          } else {
            showError('Datos inválidos. Revisa la información ingresada.');
            setErrors({ general: data.message || 'Datos inválidos' });
          }
        } else if (response.status === 422) {
          if (data.errors) {
            setErrors(data.errors);
          } else {
            showError('Error de validación. Revisa todos los campos.');
            setErrors({ general: data.message || 'Error de validación' });
          }
        } else {
          showError('Error en el registro. Intenta de nuevo más tarde.');
          setErrors({ general: data.message || 'Error en el registro. Intenta de nuevo.' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      showError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setErrors({ general: 'Error de red. Verifica tu conexión e intenta de nuevo.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 13);
  const maxDateString = maxDate.toISOString().split('T')[0];

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-dialog modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Crear Cuenta</h5>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => !isLoading && onClose()}
              disabled={isLoading}
              aria-label="Cerrar"
            />
          </div>

          <div className="modal-body modal-body-scrollable">
            <form className="modal-form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="form-alert form-alert-danger">{errors.general}</div>
              )}

              <div className="form-group">
                <label className="form-label">Full name</label>
                <input
                  type="text"
                  name="fullName"
                  className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Type in your full name"
                  autoComplete="name"
                />
                {errors.fullName && (
                  <span className="form-error-message">{errors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="pick a username"
                  autoComplete="username"
                />
                {errors.username && (
                  <span className="form-error-message">{errors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Ingresa tu email"
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="form-error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className={`form-input ${errors.dateOfBirth ? 'form-input-error' : ''}`}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={isLoading}
                  min={minDateString}
                  max={maxDateString}
                  autoComplete="bday"
                />
                {errors.dateOfBirth && (
                  <span className="form-error-message">{errors.dateOfBirth}</span>
                )}
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
                    placeholder="Create a new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex="-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="form-error-message">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Confirm password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Confirma your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="form-error-message">{errors.confirmPassword}</span>
                )}
              </div>

              <div className="form-info-text">
                <p>By creating your account you accept our terms and conditions</p>
              </div>
            </form>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="modal-btn modal-btn-secondary"
              onClick={() => !isLoading && onClose()}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="form-spinner"></span>
                  Creating your account
                </>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;