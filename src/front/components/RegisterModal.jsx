import { useState } from 'react';
import BackendURL from './BackendURL';
import useGlobalReducer from "../hooks/useGlobalReducer";

const RegisterModal = ({ show, onClose, onRegisterSuccess }) => {
  const { dispatch } = useGlobalReducer();

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
    let newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 13) {
        newErrors.dateOfBirth = 'You must be at least 13 years old';
      } else if (age > 120) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const loginAfterRegister = async () => {
    const loginResponse = await fetch(`${BackendURL}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password
      })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(loginData.message || 'Login failed');
    }

    localStorage.setItem('token', loginData.token);
    localStorage.setItem('tokenType', loginData.token_type);
    localStorage.setItem('expiresAt', loginData.expires_at);

    dispatch({
      type: 'SET_USER',
      payload: loginData.user || { email: formData.email }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${BackendURL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formData.fullName,
          username: formData.username,
          email: formData.email,
          date_of_birth: formData.dateOfBirth,
          password: formData.password,
          confirm_password: formData.confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        await loginAfterRegister();

        if (onRegisterSuccess) onRegisterSuccess(formData.email);

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
          if (data.message.includes('correo')) {
            setErrors({ email: data.message });
          } else if (data.message.includes('username')) {
            setErrors({ username: data.message });
          } else {
            setErrors({ general: data.message });
          }
        } else if (response.status === 400) {
          if (data.message.includes('contraseñas no coinciden')) {
            setErrors({ confirmPassword: data.message });
          } else {
            setErrors({ general: data.message });
          }
        } else {
          setErrors({ general: data.message || 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (!isLoading) onClose();
  };

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate());
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-dialog modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create Account</h5>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              disabled={isLoading}
              aria-label="Close"
            />
          </div>

          <form className="modal-form" onSubmit={handleSubmit}>
            <div className="modal-body modal-body-scrollable">
              {errors.general && (
                <div className="form-alert form-alert-danger">{errors.general}</div>
              )}

              {[ 
                { label: 'Full Name', name: 'fullName', type: 'text', placeholder: 'Enter your full name' },
                { label: 'Username', name: 'username', type: 'text', placeholder: 'Choose a username' },
                { label: 'Email', name: 'email', type: 'email', placeholder: 'Enter your email' },
                { label: 'Date of Birth', name: 'dateOfBirth', type: 'date' },
                { label: 'Password', name: 'password', type: 'password', placeholder: 'Create a password' },
                { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: 'Re-enter your password' }
              ].map(({ label, name, type, placeholder }) => (
                <div className="form-group" key={name}>
                  <label className="form-label">{label} *</label>
                  <input
                    type={type}
                    name={name}
                    className={`form-input ${errors[name] ? 'form-input-error' : ''}`}
                    value={formData[name]}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder={placeholder}
                    min={name === 'dateOfBirth' ? minDate.toISOString().split('T')[0] : undefined}
                    max={name === 'dateOfBirth' ? maxDate.toISOString().split('T')[0] : undefined}
                  />
                  {errors[name] && (
                    <span className="form-error-message">{errors[name]}</span>
                  )}
                </div>
              ))}

              <div className="form-info-text">
                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
              </div>
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
                type="submit"
                className="modal-btn modal-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="form-spinner"></span>
                    Creating Account...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterModal;
