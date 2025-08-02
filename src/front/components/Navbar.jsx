import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import PremiumButton from "../components/PremiumButton";

const Navbar = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isHomePage = location.pathname === '/';

  const handleLoginSuccess = (userData) => {
    console.log('Usuario logueado:', userData);
    setLoggedUser(userData);
    setIsOpen(false);
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

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  const shouldShowSidebar = !loggedUser || isOpen;

  return (
    <>
      <button className="navbar-toggle" onClick={toggleNavbar}>
        {isOpen ? '✖' : '☰'}
      </button>

      {shouldShowSidebar && (
        <nav className={`navbar-sidebar ${loggedUser ? (isOpen ? 'open' : 'closed') : 'open'}`}>
          <div>
            <Link to="/" className="logo-link">
              <img className="navbar-logo" src="/amuzz_logo.png" alt="amuzz_logo" />
              <h2 className="navbar-amuzz">Amuzz</h2>
            </Link>
          </div>

          <ul className="navbar-nav">
            <hr className="navbar-divider" />

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

            {loggedUser && (
              <>
                <p className="navbar-username">Hola, {loggedUser.username}!</p>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'happy', label: 'Feliz' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Feliz
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'sad', label: 'Triste' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Triste
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'anxiety', label: 'Ansioso' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Ansioso
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'party', label: 'Fiesta' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Fiesta
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'relax', label: 'Relajado' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Relajado
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'latin', label: 'Latino' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Latino
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="navbar-premium-button">
            <PremiumButton />
          </div>
        </nav>
      )}

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
