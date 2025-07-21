import React, { useState } from "react";
import BackendURL from "./BackendURL";
import "../LoginModal.css";

const RegisterModal = ({ show, onClose }) => {
  if (!show) return null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BackendURL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
        onClose(); // cerrar modal
      } else {
        setError(data.message || "Error en el registro");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al conectar");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Registro</h2>
        <form onSubmit={handleRegister} className="modal-form">
          <input
            type="text"
            placeholder="Nombre completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Registrarse</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <button className="close-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default RegisterModal;
