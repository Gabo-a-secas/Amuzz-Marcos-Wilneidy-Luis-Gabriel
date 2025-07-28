import { usePlayer } from "../hooks/PlayerContext";
import { FaTimes } from "react-icons/fa";
import "../PlayerModal.css";

export const PlayerModal = () => {
  const { track, expanded, collapsePlayer } = usePlayer();

  if (!expanded || !track) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={collapsePlayer} className="close-button">
          <FaTimes />
        </button>
        <div className="modal-info">
          <img src={track.image} alt={track.name} className="modal-image" />
          <h2>{track.name}</h2>
          <p><strong>Artista:</strong> {track.artist}</p>
          <p><strong>Álbum:</strong> {track.album || "Desconocido"}</p>
          <p><strong>Género:</strong> {track.genre || "?"}</p>
          <p><strong>Año:</strong> {track.year || "?"}</p>
        </div>
        {/* Aquí puedes agregar los controles del player también, más cómodos */}
      </div>
    </div>
  );
};
