import React, { useState } from "react";
import BackendURL from "./BackendURL";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../LoginModal.css";

const LoginModal = ({ show, onClose }) => {
  if (!show) return null;
  const { dispatch } = useGlobalReducer();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); s
    try {
      const res = await fetch(`${BackendURL}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        sessionStorage.setItem("token", data.token);
        dispatch({ type: "SET_USER", payload: data });
        onClose(); // cerrar modal
      } else {
        setError(data.message || "Error en el login");
      }
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al conectar");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleLogin} className="modal-form">
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
          <button type="submit">Entrar</button>
        </form>
        {error && <p className="error-message">{error}</p>}
        <button className="close-button" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default LoginModal;
