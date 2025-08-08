import { useEffect, useRef, useCallback, memo, useState } from "react";
import { createPortal } from "react-dom";
import { FaPlay, FaPause, FaForward, FaBackward, FaPlus, FaHeart, FaVolumeUp, FaVolumeMute, FaExpand, FaWindowClose } from "react-icons/fa";
import { usePlayer } from "../hooks/PlayerContext";
import { useNotifications } from "../NotificationProvider";
import "../player.css";
import "../playlist-dropup.css";
import NewPlaylistModal from "../components/NewPlaylistModal";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { createUserPlaylist, addSongToPlaylist, getUserPlaylistsWithGuaranteedCounts } from "../store.js";
import { notifyPlaylistSongAdded } from "../PlaylistEvents.js";

export const Player = memo(({ visible, onClose }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showPlaylistDropup, setShowPlaylistDropup] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistsWithCounts, setPlaylistsWithCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { dispatch, state } = useGlobalReducer();
  const { showSuccess, showError, showWarning } = useNotifications();

  // Event listener para sincronizar contadores cuando se agregan canciones desde otros componentes
  useEffect(() => {
    const handlePlaylistUpdated = (event) => {
      console.log("Playlist updated event received:", event.detail);
      const { playlistId, action, source } = event.detail;
      
      // Solo actualizar si NO viene de este mismo componente (player)
      if (source === 'player') return;
      
      if (action === 'song_added') {
        // Actualizar el contador de la playlist específica
        setPlaylistsWithCounts(prevPlaylists => 
          prevPlaylists.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: (p.songCount || 0) + 1 }
              : p
          )
        );
      } else if (action === 'song_removed') {
        // Manejar eliminación de canciones
        setPlaylistsWithCounts(prevPlaylists => 
          prevPlaylists.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: Math.max(0, (p.songCount || 0) - 1) }
              : p
          )
        );
      } else if (action === 'refresh') {
        // Refrescar todas las playlists
        refreshPlaylists();
      }
    };

    // Agregar event listener
    window.addEventListener('playlistUpdated', handlePlaylistUpdated);
    
    // Cleanup
    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistUpdated);
    };
  }, []);

  // Cargar playlists al montar el componente
  useEffect(() => {
    const loadPlaylists = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          console.log("🎵 Player: Loading playlists with GUARANTEED counts...");
          const playlistsWithCounts = await getUserPlaylistsWithGuaranteedCounts(token);
          console.log("🎵 Player: Playlists with guaranteed counts received:", playlistsWithCounts);
          
          if (playlistsWithCounts && playlistsWithCounts.length > 0) {
            setUserPlaylists(playlistsWithCounts);
            setPlaylistsWithCounts(playlistsWithCounts);
            
            playlistsWithCounts.forEach(playlist => {
              console.log(`🎵 Player: "${playlist.name}": ${playlist.songCount || 0} canciones (${playlist.hasRealCount ? 'REAL' : 'FALLBACK'})`);
            });
          } else {
            console.log("🎵 Player: No playlists received");
          }
        } catch (error) {
          console.error("🎵 Player: Error loading playlists:", error);
          showError("Error al cargar las playlists");
        }
      }
    };
    loadPlaylists();
  }, [showError]);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isUpdatingProgressRef = useRef(false);

  const {
    track,
    isPlaying,
    setPlaying,
    expandPlayer,
    nextTrack,
    previousTrack,
    playlist,
    currentIndex
  } = usePlayer();

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    const progressBar = progressBarRef.current;

    if (audio && progressBar && audio.duration && !isUpdatingProgressRef.current) {
      const progress = (audio.currentTime / audio.duration) * 100;
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration);

      if (!isNaN(progress)) {
        progressBar.value = progress;
      }
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
      setCurrentTime(0);
      if (progressBarRef.current) {
        progressBarRef.current.value = "0";
      }
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (audio && !isUpdatingProgressRef.current) {
      setCurrentTime(audio.currentTime);
      if (progressBarRef.current && audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBarRef.current.value = progress;
      }
    }
  }, []);

  useEffect(() => {
    if (!track || !audioRef.current) return;

    const audio = audioRef.current;
    setIsLoading(true);

    setCurrentTime(0);
    setDuration(0);
    if (progressBarRef.current) {
      progressBarRef.current.value = "0";
    }

    if (audio.src !== track.audio) {
      audio.src = track.audio;
      audio.load();
    }

    setIsLoading(false);
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Error al reproducir audio:", err);
            showError("Error al reproducir la canción");
            setPlaying(false);
          }
        });
      }
    };

    const handlePlay = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    };

    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    if (isPlaying && audio.paused) {
      if (audio.readyState >= 2) {
        audio.play().catch((err) => {
          if (err.name !== "AbortError") {
            console.error("Error al reproducir audio:", err);
            showError("Error al reproducir la canción");
            setPlaying(false);
          }
        });
      }
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [track, isPlaying, setPlaying, updateProgress, handleLoadedMetadata, handleTimeUpdate, showError]);

  const handleSeek = useCallback((e) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;

    isUpdatingProgressRef.current = true;
    const newTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);

    setTimeout(() => {
      isUpdatingProgressRef.current = false;
    }, 100);
  }, []);

  const handleVolumeChange = useCallback((e) => {
    const value = parseFloat(e.target.value);
    setVolume(value);
    setIsMuted(value === 0);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume;
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
    setPlaying(false);
    if (onClose) onClose();
  }, [setPlaying, onClose]);

  const handlePlay = useCallback(() => {
    setPlaying(true);
  }, [setPlaying]);

  const handlePause = useCallback(() => {
    setPlaying(false);
  }, [setPlaying]);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setCurrentTime(0);
    if (progressBarRef.current) {
      progressBarRef.current.value = "0";
    }

    if (playlist.length > 1) {
      nextTrack();
    }
  }, [setPlaying, playlist.length, nextTrack]);

  const handleNext = useCallback(() => {
    if (playlist.length > 1) {
      nextTrack();
    }
  }, [nextTrack, playlist.length]);

  const handlePrevious = useCallback(() => {
    if (playlist.length > 1) {
      previousTrack();
    }
  }, [previousTrack, playlist.length]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Función para manejar el clic en el botón plus
  const handlePlusClick = () => {
    const playlists = playlistsWithCounts.length > 0 ? playlistsWithCounts : (state?.playlists || userPlaylists);
    
    if (playlists && playlists.length > 0) {
      setShowPlaylistDropup(!showPlaylistDropup);
    } else {
      setShowModal(true);
    }
  };

  // Función para agregar canción a playlist existente
  const handleAddToPlaylist = async (playlist) => {
    if (!track) return;

    const token = localStorage.getItem("token");
    const songData = {
      song_id: track.id,
      name: track.name,
      artist: track.artist,
      audio_url: track.audio,
      image_url: track.image,
    };

    const addRes = await addSongToPlaylist(playlist.id, songData, token);
    if (addRes && addRes.ok) {
      showSuccess(`Canción agregada a "${playlist.name}" con éxito! 🎶`);
      
      // Actualizar el conteo de la playlist específica
      setPlaylistsWithCounts(prevPlaylists => 
        prevPlaylists.map(p => 
          p.id === playlist.id 
            ? { ...p, songCount: (p.songCount || 0) + 1 }
            : p
        )
      );
      
      // Disparar evento para que otros componentes se sincronicen
      notifyPlaylistSongAdded(playlist.id, 'player');
      
    } else {
      showError(`Error al agregar la canción a "${playlist.name}"`);
    }
    
    setShowPlaylistDropup(false);
  };

  // Función para refrescar las playlists
  const refreshPlaylists = async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const playlistsWithCounts = await getUserPlaylistsWithGuaranteedCounts(token);
        
        if (playlistsWithCounts) {
          setUserPlaylists(playlistsWithCounts);
          setPlaylistsWithCounts(playlistsWithCounts);
          dispatch({ type: "SET_PLAYLISTS", payload: playlistsWithCounts });
        }
      } catch (error) {
        console.error("Error refreshing playlists:", error);
        showError("Error al refrescar las playlists");
      }
    }
  };

  // Hook para cerrar el dropup al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPlaylistDropup && !event.target.closest('.playlist-dropdown-container')) {
        setShowPlaylistDropup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlaylistDropup]);

  if (!track || !visible) return null;

  return (
    <>
      <div className="player-container">
        <div className="playertrack-info">
          <img src={track.image} alt={track.name} className="playertrack-image" />
          <div>
            <h4 className="playertrack-title">{track.name}</h4>
            <p className="playertrack-artist">{track.artist}</p>

            {playlist.length > 1 && (
              <p className="playlist-position">
                {currentIndex + 1} de {playlist.length}
              </p>
            )}
          </div>
          <div className="playertrack-buttons">
            <FaHeart onClick={() => setIsLiked(!isLiked)} className={`heart-btn ${isLiked ? "liked" : ""}`} />
            <div className="playlist-dropdown-container">
              <FaPlus className="add-btn" onClick={handlePlusClick} />
              
              {showPlaylistDropup && (() => {
                const playlists = playlistsWithCounts.length > 0 ? playlistsWithCounts : (state?.playlists || userPlaylists);
                return playlists && playlists.length > 0;
              })() && (
                <div className="playlist-dropup">
                  <div className="playlist-dropup-header">
                    <span>Add to playlist</span>
                    <button 
                      className="create-new-playlist-btn"
                      onClick={() => {
                        setShowPlaylistDropup(false);
                        setShowModal(true);
                      }}
                    >
                      + New playlist
                    </button>
                  </div>
                  <div className="playlist-dropup-list">
                    {(playlistsWithCounts.length > 0 ? playlistsWithCounts : (state?.playlists || userPlaylists)).map((playlist) => (
                      <div
                        key={playlist.id}
                        className="playlist-dropup-item"
                        onClick={() => handleAddToPlaylist(playlist)}
                      >
                        <span className="playlist-name">{playlist.name}</span>
                        <span className="playlist-count">
                          {playlist.songCount !== undefined 
                            ? `${playlist.songCount} ${playlist.songCount === 1 ? 'canción' : 'canciones'}`
                            : (playlist.songs?.length || 0) + (playlist.songs?.length === 1 ? ' canción' : ' canciones')
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="player-controls">
          <div className="main-buttons">
            <FaBackward
              className={`icon ${playlist.length <= 1 ? 'disabled' : ''}`}
              onClick={handlePrevious}
              title={playlist.length <= 1 ? 'No hay canción anterior' : 'Canción anterior'}
            />
            {isLoading ? (
              <div className="loading-spinner">⏳</div>
            ) : isPlaying ? (
              <FaPause onClick={handlePause} className="icon" />
            ) : (
              <FaPlay onClick={handlePlay} className="icon" />
            )}
            <FaForward
              className={`icon ${playlist.length <= 1 ? 'disabled' : ''}`}
              onClick={handleNext}
              title={playlist.length <= 1 ? 'No hay siguiente canción' : 'Siguiente canción'}
            />
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
          {isMuted || volume === 0 ? (
            <FaVolumeMute onClick={toggleMute} className="icon" />
          ) : (
            <FaVolumeUp onClick={toggleMute} className="icon" />
          )}
          <input
            ref={volumeBarRef}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-bar"
          />
          <FaWindowClose className="icon" onClick={handleClose} />
        </div>

        <audio
          ref={audioRef}
          onEnded={handleEnded}
          preload="metadata"
        />
      </div>

      {showModal && createPortal(
        <NewPlaylistModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onCreate={async (name) => {
            const token = localStorage.getItem("token");
            const result = await createUserPlaylist(token, name);
            
            if (result) {
              console.log("✅ Playlist creada desde player:", result);
              
              await refreshPlaylists();
              
              if (track) {
                const songData = {
                  song_id: track.id,
                  name: track.name,
                  artist: track.artist,
                  audio_url: track.audio,
                  image_url: track.image,
                };

                const addRes = await addSongToPlaylist(result.id, songData, token);
                if (addRes && addRes.ok) {
                  showSuccess("🎶 Playlist creada y canción agregada con éxito!");
                } else {
                  showWarning("Playlist creada, pero error al añadir la canción");
                }
              }
              
              setShowModal(false);
            } else {
              showError("No se pudo crear la playlist");
            }
          }}
        />,
        document.body
      )}
    </>
  );
});

export default Player;