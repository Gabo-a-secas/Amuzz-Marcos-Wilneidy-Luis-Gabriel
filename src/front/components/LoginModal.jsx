const LoginModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Login</h5>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form className="modal-form">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="modal-btn modal-btn-primary">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;