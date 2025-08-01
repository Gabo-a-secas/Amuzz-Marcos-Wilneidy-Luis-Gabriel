import { useEffect, useRef, useCallback, memo, useState } from "react";
import { FaPlay, FaPause, FaForward, FaBackward, FaVolumeUp, FaTimes, FaExpand } from "react-icons/fa";
import { usePlayer } from "../hooks/PlayerContext";
import "../player.css";

export const Player = memo(({ track, visible, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const animationFrameRef = useRef(null);
  const { expandPlayer } = usePlayer();

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;
    if (audio && progressBar && audio.duration && isPlaying) {
      const progress = (audio.currentTime / audio.duration) * 100;
      if (!isNaN(progress)) {
        progressBar.value = progress;
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!track || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = track.audio;
    audio.load();
    setIsPlaying(true);
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        if (err.name !== "AbortError") console.error("Error al reproducir audio:", err);
      });
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      audio.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateProgress]);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const newTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = newTime;
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsPlaying(false);
    if (onClose) onClose();
  }, [onClose]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (progressBarRef.current) {
      progressBarRef.current.value = 100;
    }
  }, []);

  if (!track || !visible) return null;

  return (
    <div
      className="player-container"
      style={{
        position: "fixed",
        bottom: 0,
        right: 0,
        zIndex: 1000,
        background: "white",
        padding: "1rem",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}
    >
      <div className="player-actions">
        <button onClick={handleClose} title="Cerrar"><FaTimes /></button>
      </div>
      <button className="modal-btn" onClick={expandPlayer} title="Expandir">
        <FaExpand />
      </button>
      <div className="playertrack-info">
        <img src={track.image} alt={track.name} className="playertrack-image" />
        <div>
          <h4 className="playertrack-title">{track.name}</h4>
          <p className="playertrack-artist">{track.artist}</p>
        </div>
      </div>

      <div className="player-controls">
        <div className="buttons">
          <FaBackward className="icon" />
          {isPlaying ? (
            <FaPause onClick={handlePause} className="icon" />
          ) : (
            <FaPlay onClick={handlePlay} className="icon" />
          )}
          <FaForward className="icon" />
        </div>
        <input
          ref={progressBarRef}
          type="range"
          min="0"
          max="100"
          defaultValue="0"
          onChange={handleSeek}
          className="progress-bar"
        />
      </div>

      <div className="volume-control">
        <FaVolumeUp className="icon" />
        <input
          ref={volumeBarRef}
          type="range"
          min="0"
          max="1"
          step="0.01"
          defaultValue="1"
          onChange={handleVolumeChange}
          className="volume-bar"
        />
      </div>

      <audio
        ref={audioRef}
        onEnded={handleEnded}
      />
    </div>
  );
});
