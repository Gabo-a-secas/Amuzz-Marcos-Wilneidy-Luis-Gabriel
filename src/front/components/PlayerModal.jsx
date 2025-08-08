import { usePlayer } from "../hooks/PlayerContext";
import { FaTimes } from "react-icons/fa";
import "../PlayerModal.css";

export const PlayerModal = () => {
  const { track, expanded, collapsePlayer } = usePlayer();
  if (!expanded || !track) return null;
  return (
    <div className="playermodal-overlay">
      <div className="playermodal-content">
        <button onClick={collapsePlayer} className="close-button">
          <FaTimes />
        </button>
        <div className="modal-info">
          <img src={track.image} alt={track.name} className="playermodal-image" />
          <h2>{track.name}</h2>
          <p><strong>Artist:</strong> {track.artist}</p>
          <p><strong>Album:</strong> {track.album_name}</p>
          <p><strong>Genre:</strong> {track.genres?.join(", ") || "N/A"}</p>
          <p><strong>Release date:</strong> {track.release_date}</p>
          <p><strong>Duration:</strong> {track.duration}</p>
        </div>



      </div>
    </div>
  );
};
