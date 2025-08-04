import { useEffect, useRef, useCallback, memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaPlay, FaPause, FaForward, FaBackward, FaPlus, FaHeart, FaVolumeUp, FaVolumeMute, FaExpand, FaWindowClose } from "react-icons/fa";
import { usePlayer } from "../hooks/PlayerContext";
import "../player.css";
import NewPlaylistModal from "../components/NewPlaylistModal";
import { createUserPlaylist } from "../store.js";

export const Player = memo(({ track, visible, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showModal, setShowModal] = useState(false);

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
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);
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
    setVolume(value * 100);
    setIsMuted(value === 0);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume / 100;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

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

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track || !visible) return null;

  return (
    <>
      <div className="player-container">
        <div className="playertrack-info">
          <img src={track.image} alt={track.name} className="playertrack-image" />
          <div>
            <h4 className="playertrack-title">{track.name}</h4>
            <p className="playertrack-artist">{track.artist}</p>
          </div>
          <div className="playertrack-buttons">
            <FaHeart onClick={() => setIsLiked(!isLiked)} className={`heart-btn ${isLiked ? "liked" : ""}`} />
            <FaPlus className="add-btn" onClick={() => setShowModal(true)} />
          </div>
        </div>

        <div className="player-controls">
          <div className="main-buttons">
            <FaBackward className="icon" />
            {isPlaying ? (
              <FaPause onClick={handlePause} className="icon" />
            ) : (
              <FaPlay onClick={handlePlay} className="icon" />
            )}
            <FaForward className="icon" />
          </div>

          <div className="progress-wrapper">
            <span className="time-elapsed">{formatTime(currentTime)}</span>
            <input
              ref={progressBarRef}
              type="range"
              min="0"
              max="100"
              defaultValue="0"
              onChange={handleSeek}
              className="progress-bar"
            />
            <span className="time-full">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-control">
          <FaExpand onClick={expandPlayer} title="Expandir" className="icon" />
          <FaVolumeUp onClick={toggleMute}>
            {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
          </FaVolumeUp>
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
          <FaWindowClose className="icon" onClick={handleClose} />
        </div>

        <audio ref={audioRef} onEnded={handleEnded} />
      </div>

      {/* Portal para renderizar el modal fuera del player */}
      {showModal && createPortal(
        <NewPlaylistModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreate={async (name) => {
            const token = localStorage.getItem("token");
            const result = await createUserPlaylist(token, name);
            if (result) {
              console.log("✅ Playlist creada:", result);
              setShowModal(false);
            }
          }}
        />,
        document.body
      )}
    </>
  );
});

export default Player;