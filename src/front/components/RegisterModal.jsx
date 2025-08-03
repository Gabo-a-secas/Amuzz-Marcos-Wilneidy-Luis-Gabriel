import { useState } from 'react';
import BackendURL from './BackendURL';
import { Eye, EyeOff } from 'lucide-react';

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
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
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
        alert(data.message || 'Registration successful! Please check your email to verify your account.');

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
            setErrors({ email: data.message || 'This email is already registered' });
          } else if (data.message && data.message.toLowerCase().includes('username')) {
            setErrors({ username: data.message || 'This username is already taken' });
          } else {
            setErrors({ general: data.message || 'User already exists' });
          }
        } else if (response.status === 400) {
          if (data.message && data.message.toLowerCase().includes('password')) {
            setErrors({ confirmPassword: data.message });
          } else if (data.errors) {
            setErrors(data.errors);
          } else {
            setErrors({ general: data.message || 'Invalid data provided' });
          }
        } else if (response.status === 422) {
          if (data.errors) {
            setErrors(data.errors);
          } else {
            setErrors({ general: data.message || 'Validation error' });
          }
        } else {
          setErrors({ general: data.message || 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Network error. Please check your connection and try again.' });
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
            <h5 className="modal-title">Create Account</h5>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => !isLoading && onClose()}
              disabled={isLoading}
              aria-label="Close"
            />
          </div>

          <div className="modal-body modal-body-scrollable">
            <form className="modal-form" onSubmit={handleSubmit}>
              {errors.general && (
                <div className="form-alert form-alert-danger">{errors.general}</div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  className={`form-input ${errors.fullName ? 'form-input-error' : ''}`}
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Enter your full name"
                  autoComplete="name"
                />
                {errors.fullName && (
                  <span className="form-error-message">{errors.fullName}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  name="username"
                  className={`form-input ${errors.username ? 'form-input-error' : ''}`}
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  placeholder="Choose a username"
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
                  placeholder="Enter your email"
                  autoComplete="email"
                />
                {errors.email && (
                  <span className="form-error-message">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Date of Birth *</label>
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
                <label className="form-label">Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Create a password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                <label className="form-label">Confirm Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
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
                <p>By creating an account, you agree to our Terms of Service and Privacy Policy.</p>
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
                  Creating Account...
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