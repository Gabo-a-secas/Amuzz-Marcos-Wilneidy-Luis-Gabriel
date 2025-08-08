import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './Notifications.css';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      title: '',
      message: '',
      duration: 4000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id);
    }, newNotification.duration);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title = 'Éxito') => {
    return addNotification({ type: 'success', message, title });
  }, [addNotification]);

  const showError = useCallback((message, title = 'Error') => {
    return addNotification({ type: 'error', message, title, duration: 6000 });
  }, [addNotification]);

  const showInfo = useCallback((message, title = 'Información') => {
    return addNotification({ type: 'info', message, title });
  }, [addNotification]);

  const showWarning = useCallback((message, title = 'Advertencia') => {
    return addNotification({ type: 'warning', message, title, duration: 5000 });
  }, [addNotification]);

  const showConfirm = useCallback((message, title = 'Confirmar', onConfirm, onCancel) => {
    return addNotification({ 
      type: 'confirm', 
      message, 
      title, 
      duration: 0, // No auto-dismiss
      onConfirm,
      onCancel
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showInfo,
      showWarning,
      showConfirm,
      removeNotification
    }}>
      {children}
      {createPortal(
        <NotificationContainer 
          notifications={notifications}
          onRemove={removeNotification}
        />,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

const NotificationContainer = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationCard
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const NotificationCard = ({ notification, onRemove }) => {
  const { id, type, title, message, onConfirm, onCancel } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'confirm':
        return '❓';
      default:
        return 'ℹ️';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onRemove(id);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onRemove(id);
  };

  const handleClose = () => {
    onRemove(id);
  };

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <div className="notification-header">
          <span className="notification-icon">{getIcon()}</span>
          <h4 className="notification-title">{title}</h4>
          {type !== 'confirm' && (
            <button 
              className="notification-close"
              onClick={handleClose}
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          )}
        </div>
        <p className="notification-message">{message}</p>
        
        {type === 'confirm' && (
          <div className="notification-actions">
            <button 
              className="notification-btn notification-btn-confirm"
              onClick={handleConfirm}
            >
              Confirmar
            </button>
            <button 
              className="notification-btn notification-btn-cancel"
              onClick={handleCancel}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
      
      {/* Progress bar para notificaciones con duración */}
      {type !== 'confirm' && (
        <div 
          className="notification-progress"
          style={{
            animationDuration: `${notification.duration}ms`
          }}
        />
      )}
    </div>
  );
};

// Hook para usar las notificaciones
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider');
  }
  return context;
};