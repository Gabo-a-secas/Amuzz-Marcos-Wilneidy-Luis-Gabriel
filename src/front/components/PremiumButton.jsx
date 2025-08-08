import React from "react";
import BackendURL from "./BackendURL";
import { useNotifications } from "../NotificationProvider";

const PremiumButton = () => {
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  const handlePayment = async () => {
    try {
      showInfo('Preparando tu sesión de pago...', 'Procesando');
      
      const token = localStorage.getItem("token");
      const apiURL = `${BackendURL.replace(/\/$/, "")}/api/create-checkout-session`;

      const response = await fetch(apiURL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const text = await response.text();
      console.log("Texto crudo recibido:", text);

      if (!response.ok) {
        console.error("Error HTTP:", response.status, text);
        showError(
          `Error del servidor (${response.status}). Por favor intenta de nuevo más tarde.`,
          'Error de Pago'
        );
        return;
      }

      const data = JSON.parse(text);

      if (data.url) {
        showSuccess('¡Redirigiendo a la página de pago! 💳', 'Sesión Creada');
        // Pequeño delay para que el usuario vea la notificación antes de redireccionar
        setTimeout(() => {
          window.location.href = data.url;
        }, 1000);
      } else {
        console.error("Stripe session error:", data.error || "URL no recibida");
        showError(
          data.error || 'No se pudo crear la sesión de pago. URL no recibida.',
          'Error de Stripe'
        );
      }
    } catch (error) {
      console.error("Error al procesar el pago:", error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showError(
          'No se puede conectar al servidor de pagos. Verifica tu conexión a internet.',
          'Error de Conexión'
        );
      } else if (error instanceof SyntaxError) {
        showError(
          'Error al procesar la respuesta del servidor. Por favor intenta de nuevo.',
          'Error de Datos'
        );
      } else {
        showError(
          'Error inesperado al procesar el pago. Por favor intenta de nuevo más tarde.',
          'Error de Pago'
        );
      }
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      className="navbar-btn navbar-btn-outline"
      title="Apoya el desarrollo de Amuzz"
    >
      Support us
    </button>
  );
};

export default PremiumButton;