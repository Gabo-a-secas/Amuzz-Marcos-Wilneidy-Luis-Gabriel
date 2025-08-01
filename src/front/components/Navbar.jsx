import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import PremiumButton from "../components/PremiumButton";

const Navbar = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  const handleLoginSuccess = (userData) => {
    console.log('Usuario logueado:', userData);
    setLoggedUser(userData);
    // Aquí voy agregar la actualizacion del estado del usuario
  };

  const handleRegisterSuccess = (email) => {
    console.log('Usuario registrado:', email);
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
  };

  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
  };

  return (
    <>
      <nav className="navbar-sidebar">
        <div>
          <Link to="/" className="logo-link">
            <img className="navbar-logo" src="/amuzz_logo.png" alt="amuzz_logo" />
            <h2 className="navbar-amuzz">Amuzz</h2>
          </Link>
          
        </div>

        <ul className="navbar-nav">
          <hr className="navbar-divider" />
          {loggedUser && (
            <p className="navbar-username">Hola, {loggedUser.username}!</p>  
          )}
          {!loggedUser && isHomePage && (
            <>
              <li className="navbar-nav-item">
                <button
                  className="navbar-btn navbar-btn-primary"
                  onClick={() => setShowLoginModal(true)}
                >
                  Login
                </button>
              </li>
              <li className="navbar-nav-item">
                <button
                  className="navbar-btn navbar-btn-outline"
                  onClick={() => setShowRegisterModal(true)}
                >
                  Register
                </button>
              </li>
            </>
          )}
        </ul>


        <div className="navbar-premium-button">
          <PremiumButton />
        </div>
      </nav>

      {!loggedUser && isHomePage && (
        <>
          <LoginModal
            show={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={switchToRegister}
          />
          <RegisterModal
            show={showRegisterModal}
            onClose={() => setShowRegisterModal(false)}
            onRegisterSuccess={handleRegisterSuccess}
            onSwitchToLogin={switchToLogin}
          />
        </>
      )}
    </>
  );
};

export default Navbar;
