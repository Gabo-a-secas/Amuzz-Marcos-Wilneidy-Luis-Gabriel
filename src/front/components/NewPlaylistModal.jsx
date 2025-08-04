import { useState } from "react";
import { FaTimes, FaPlusCircle } from "react-icons/fa";
import "../NewPlaylistModal.css"; // Asegúrate de que esté enlazado el CSS

const NewPlaylistModal = ({ isOpen, onClose, onCreate }) => {
  const [playlistName, setPlaylistName] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (playlistName.trim()) {
      onCreate(playlistName.trim());
      setPlaylistName("");
    }
  };

  return (
    <div className="newplaylist-modal-overlay">
      <div className="newplaylist-modal-content">
        <button className="newplaylist-modal-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h2 className="newplaylist-modal-title">
          <FaPlusCircle className="newplaylist-modal-icon" /> Nueva Playlist
        </h2>
        <form onSubmit={handleSubmit} className="newplaylist-modal-form">
          <input
            type="text"
            placeholder="Nombre de la playlist"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="newplaylist-modal-input"
          />
          <button type="submit" className="newplaylist-modal-button">
            Crear
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewPlaylistModal;
