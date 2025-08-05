import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePlayer } from "../hooks/PlayerContext";
import { FaPlay } from "react-icons/fa";
import "../results.css";

const moodVideos = {
  happy: "/videos/feliz.mp4",
  sad: "/videos/triste.mp4",
  anxiety: "/videos/ansioso.mp4",
  party: "/videos/fiesta.mp4",
  relax: "/videos/relajado.mp4",
  latin: "/videos/latino.mp4",
};


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
      duration: track.duration,
      genre: track.genres,
      album_name: track.album_name,
      release_date: track.release_date,
      waveform: track.waveform,
      genres: track.genres,
    });
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const videoURL = moodVideos[mood] || "/videos/feliz.mp4";

  return (
    <div className="results-container">
      <video autoPlay loop muted playsInline className="background-video" key={videoURL}>
        <source src={videoURL} type="video/mp4" />
      </video>

      <div className="content-overlay">
        <h2 className="results-title">For this mood we may suggest</h2>

        {loading ? (
          <p className="results-loading">Loading music for you...</p>
        ) : tracks.length === 0 ? (
          <p className="results-empty">Not found.</p>
        ) : (
          <div className="results-list">
            {tracks.map((track) => (
              <div key={track.id} className="music-card">
                <img
                  src={track.image || "/music-icon.png"}
                  alt={track.name}
                  className="music-icon"
                />

                <div className="music-info">
                  <h3 className="track-name">{track.name}</h3>
                  <p className="track-artist">{track.artist}</p>
                  <p className="duration">{formatDuration(track.duration)}</p>
                </div>

                {(() => {
                  try {
                    const waveformObj = typeof track.waveform === "string"
                      ? JSON.parse(track.waveform)
                      : track.waveform;

                    const peaks = waveformObj?.peaks;

                    return Array.isArray(peaks) ? (
                      <div style={{ transform: 'translateX(-200px)' }} className="waveform-mini">
                        {peaks.slice(0, 40).map((value, i) => (
                          <div
                            key={i}
                            className="wave-bar-mini"
                            style={{
                              height: `${Math.max(4, value * 0.6)}px`,
                            }}
                          />
                        ))}
                      </div>
                    ) : null;
                  } catch (e) {
                    console.error("Waveform parse error:", e);
                    return null;
                  }
                })()}

                <FaPlay onClick={() => handleEscuchar(track)} className="icon" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
