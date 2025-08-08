import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import PremiumButton from "../components/PremiumButton";
import { getUserPlaylists } from "../store";
import PlaylistViewModal from "./PlaylistViewModal";
import useGlobalReducer from "../hooks/useGlobalReducer";


const Navbar = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const { store, dispatch } = useGlobalReducer();

  const playlists = store.playlists;

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !loggedUser) return;

    const fetchPlaylists = async () => {
      setLoadingPlaylists(true);
      const data = await getUserPlaylists(token);
      if (data) {
        dispatch({ type: "SET_PLAYLISTS", payload: data });
      }
      setLoadingPlaylists(false);
    };

    fetchPlaylists();
  }, [loggedUser]);

  const openPlaylistModal = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setIsModalOpen(true);
    dispatch({ type: "SET_SELECTED_PLAYLIST", payload: playlistId });
  };

  const closePlaylistModal = () => {
    setIsModalOpen(false);
    setSelectedPlaylistId(null);
  };



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
                <p className="navbar-username">Hey, {loggedUser.username}!</p>

                <li className="navbar-nav-item">
                  <details className="navbar-dropdown">
                    <summary className="navbar-btn navbar-btn-outline">Playlists</summary>
                    <ul className="navbar-dropdown-list">
                      {loadingPlaylists && <li className="navbar-dropdown-item">Loading...</li>}
                      {!loadingPlaylists && playlists.length === 0 && (
                        <li className="navbar-dropdown-item">Add a new playlist</li>
                      )}
                      {!loadingPlaylists &&
                        playlists.map((playlist) => (
                          <li key={playlist.id} className="navbar-dropdown-item">
                            <label
                              onClick={() => openPlaylistModal(playlist.id)}
                              className="navbar-dropdown-link"
                            >
                              {playlist.name}
                            </label>
                          </li>
                        ))}
                    </ul>
                  </details>
                </li>

                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'happy', label: 'Feliz' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Joyride
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'sad', label: 'Triste' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Lo-fi
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'anxiety', label: 'Ansioso' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    On Edge
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'party', label: 'Fiesta' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Groove
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'relax', label: 'Relajado' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Stay Mellow
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'latin', label: 'Latino' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Son Latino
                  </Link>
                </li>
                <li className="navbar-nav-item">
                  <Link
                    to="/results"
                    state={{ moodObj: { mood: 'random', label: 'Random' } }}
                    className="navbar-btn navbar-btn-outline"
                  >
                    Shuffle
                  </Link>
                </li>
              </>
            )}
          </ul>

          <div className="navbar-premium-button">
            <PremiumButton />
          </div>
          <div className="navbar-social-icons">
            <a href="https://x.com/AmuzzApp" target="_blank" rel="noopener noreferrer" aria-label="X">
              <i className="fab fa-x-twitter"></i>
            </a>
            <a href="https://www.instagram.com/amuzz.app/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
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

      <PlaylistViewModal
        isOpen={isModalOpen}
        onClose={closePlaylistModal}
        playlistId={selectedPlaylistId}
      />

    </>
  );
};

export default Navbar;
