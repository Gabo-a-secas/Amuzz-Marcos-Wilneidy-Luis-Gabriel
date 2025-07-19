import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";

const Navbar = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const location = useLocation();
  
  const isHomePage = location.pathname === '/';

  return (
    <>
      <nav className="navbar-sidebar">
        <div className="navbar-logo">
          <Link to="/" className="navbar-logo-link">
            <img className="navbar-logo" src="/amuzz_logo.png" alt="amuzz_logo" />
          </Link>
        </div>

        <ul className="navbar-nav">
          <li className="navbar-nav-item">
            <Link to="/" className="navbar-nav-link">
              <i className="bi bi-house-door navbar-nav-icon"></i>
              Home
            </Link>
          </li>
          
          <hr className="navbar-divider" />
          
          {isHomePage && (
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
      </nav>

      {isHomePage && (
        <>
          <LoginModal 
            show={showLoginModal} 
            onClose={() => setShowLoginModal(false)} 
          />
          <RegisterModal 
            show={showRegisterModal} 
            onClose={() => setShowRegisterModal(false)} 
          />
        </>
      )}
    </>
  );
};

export default Navbar;