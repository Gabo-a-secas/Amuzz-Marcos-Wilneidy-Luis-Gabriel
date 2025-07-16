import { useState } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <nav className="position-fixed top-0 start-0 text-white vh-100 p-3" 
           style={{ 
             width: '220px', 
             zIndex: 1050, // Aumentado para estar sobre todo
             backgroundColor: 'rgba(33, 37, 41, 0.9)', // Semi-transparente
             backdropFilter: 'blur(10px)' // Efecto blur
           }}>
        
        {/* Logo/Home Link */}
        <div className="mb-5">
          <Link to="/" className="text-decoration-none">
            <h2 className="text-white mb-0">Amuzz</h2>
          </Link>
        </div>

        {/* Navigation Items */}
        <ul className="nav flex-column gap-3">
          <li className="nav-item">
            <Link to="/" className="nav-link text-white d-flex align-items-center">
              <i className="bi bi-house-door me-2"></i>
              Home
            </Link>
          </li>
          
          {/* Divider */}
          <hr className="text-white-50 my-3" />
          
          {/* Auth Buttons */}
          <li className="nav-item">
            <button 
              className="btn btn-primary w-100 mb-2"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
          </li>
          <li className="nav-item">
            <button 
              className="btn btn-outline-primary w-100"
              onClick={() => setShowRegisterModal(true)}
            >
              Register
            </button>
          </li>
        </ul>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Login</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowLoginModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowLoginModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Register</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowRegisterModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input type="password" className="form-control" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Confirm Password</label>
                    <input type="password" className="form-control" />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowRegisterModal(false)}
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary">
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;