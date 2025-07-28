import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePlayer } from "../hooks/PlayerContext";
import "../results.css";

const Results = () => {
  const location = useLocation();
  const moodObj = location.state?.moodObj;
  const mood = moodObj?.mood;
  const label = moodObj?.label;

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openPlayer } = usePlayer();

  useEffect(() => {
    if (!mood) return;
    fetch(`/api/music/mood/${mood}`)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al traer la música:", err);
        setLoading(false);
      });
  }, [mood]);

  const handleEscuchar = (track) => {
    openPlayer({
      id: track.id,
      name: track.name,
      artist: track.artist,
      audio: track.audio,
      image: track.image,
    });
  };

  return (
    <div className="results-container">
      <video autoPlay loop muted playsInline className="background-video">
        <source src="/fondo.mp4" type="video/mp4" />
      </video>

      <div className="content-overlay">
        <h2 className="results-title">
          Música sugerida según: {label}
        </h2>

        {loading ? (
          <p className="results-loading">🎧 Cargando música...</p>
        ) : tracks.length === 0 ? (
          <p className="results-empty">😔 No encontramos música para ese mood.</p>
        ) : (
          <ul className="track-list">
            {tracks.map((track) => (
              <li key={track.id} className="track-item">
                <img src={track.image} alt={track.name} className="track-image" />
                <div className="track-info">
                  <h3 className="track-name">{track.name}</h3>
                  <p className="track-artist">{track.artist}</p>
                </div>
                <button
                  className="play-button"
                  onClick={() => handleEscuchar(track)}
                >
                  ▶️
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Results;
