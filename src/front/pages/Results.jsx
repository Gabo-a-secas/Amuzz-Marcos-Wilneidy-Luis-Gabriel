import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { usePlayer } from "../hooks/PlayerContext";
import { FaPlay, FaPlus } from "react-icons/fa";
import "../results.css";
import { addSongToPlaylist, createUserPlaylist, getUserPlaylistsWithGuaranteedCounts } from "../store";
import NewPlaylistModal from "../components/NewPlaylistModal";
import "../NewPlaylistModal.css";
import { createPortal } from "react-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { notifyPlaylistSongAdded } from "../PlaylistEvents.js";

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

  const { store, refreshPlaylists } = useGlobalReducer();
  const { playlists } = store;
  const [playlistsWithCounts, setPlaylistsWithCounts] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showPlaylistMenuId, setShowPlaylistMenuId] = useState(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const dropdownRef = useRef(null);
  const plusButtonRefs = useRef({});

  // Cargar playlists con conteos al montar
  useEffect(() => {
    const loadPlaylistsWithCounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        console.log("🔄 Results: Loading playlists with GUARANTEED counts...");
        const playlistsData = await getUserPlaylistsWithGuaranteedCounts(token);
        console.log("📊 Results: Playlists with guaranteed counts received:", playlistsData);

        if (playlistsData && playlistsData.length > 0) {
          setPlaylistsWithCounts(playlistsData);

          // Verificar que los conteos están correctos
          playlistsData.forEach(playlist => {
            console.log(`📝 Results: Playlist "${playlist.name}": ${playlist.songCount || 0} canciones (${playlist.hasRealCount ? 'REAL' : 'FALLBACK'})`);
          });
        } else {
          console.log("⚠️ Results: No playlists data received");
        }
      } catch (error) {
        console.error("❌ Error loading playlists with counts:", error);
        // Fallback: usar playlists regulares
        refreshPlaylists();
      }
    };

    loadPlaylistsWithCounts();
  }, []);

  // Event listener para sincronizar contadores cuando se agregan canciones
  useEffect(() => {
    const handlePlaylistUpdated = (event) => {
      const { playlistId, action, source } = event.detail;

      // Solo actualizar si NO viene de este mismo componente
      if (source === 'results') return;

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
        // ✅ AGREGAR: Manejar eliminación de canciones
        setPlaylistsWithCounts(prevPlaylists =>
          prevPlaylists.map(p =>
            p.id === playlistId
              ? { ...p, songCount: Math.max(0, (p.songCount || 0) - 1) }
              : p
          )
        );
      } else if (action === 'refresh' || action === 'playlist_created') {
        // Recargar todas las playlists con conteos
        const loadPlaylistsWithCounts = async () => {
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const playlistsData = await getUserPlaylistsWithGuaranteedCounts(token);
              if (playlistsData) {
                setPlaylistsWithCounts(playlistsData);
              }
            } catch (error) {
              console.error("Error reloading playlists:", error);
            }
          }
        };
        loadPlaylistsWithCounts();
      }
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdated);

    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistUpdated);
    };
  }, []);

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
    const trackData = {
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
    };

    const playlistData = tracks.map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      audio: t.audio,
      image: t.image,
      duration: t.duration,
      genre: t.genres,
      album_name: t.album_name,
      release_date: t.release_date,
      waveform: t.waveform,
      genres: t.genres,
    }));

    openPlayer(trackData, playlistData);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddToPlaylist = async (playlistId, track) => {
    const token = localStorage.getItem("token");
    const songData = {
      song_id: track.id,
      name: track.name,
      artist: track.artist,
      audio_url: track.audio,
      image_url: track.image,
      genre: Array.isArray(track.genres) ? JSON.stringify(track.genres) : (track.genres ?? null),
      duration: track.duration ?? null,                
      release_date: track.release_date ?? null
    };

    const res = await addSongToPlaylist(playlistId, songData, token);
    if (res.ok) {
      alert("Canción agregada");

      // Solo actualizar contador local, NO duplicar con la notificación
      setPlaylistsWithCounts(prevPlaylists =>
        prevPlaylists.map(p =>
          p.id === playlistId
            ? { ...p, songCount: (p.songCount || 0) + 1 }
            : p
        )
      );

      // Notificar al Player (pero el Player no debe incrementar desde Results)
      notifyPlaylistSongAdded(playlistId, 'results');

      refreshPlaylists();
      setShowPlaylistMenuId(null);
    } else {
      alert("Error al agregar canción");
    }

    setShowPlaylistMenuId(null);
  };

  const togglePlaylistMenu = (trackId) => {
    if (showPlaylistMenuId === trackId) {
      setShowPlaylistMenuId(null);
      return;
    }

    // Calcular posición del dropdown basada en el botón plus
    const buttonElement = plusButtonRefs.current[trackId];
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setDropdownPosition({
        top: rect.bottom + scrollTop + 5, // 5px debajo del botón
        left: rect.left + scrollLeft - 150, // Ajustar hacia la izquierda
      });
    }

    setShowPlaylistMenuId(trackId);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !Object.values(plusButtonRefs.current).some(ref => ref && ref.contains(event.target))
      ) {
        setShowPlaylistMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cerrar dropdown al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      if (showPlaylistMenuId) {
        setShowPlaylistMenuId(null);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showPlaylistMenuId]);

  const videoURL = moodVideos[mood] || "/videos/feliz.mp4";

  return (
    <div className={`results-container ${mood}`}>
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
            {tracks.map((track, index) => (
              <div key={track.id} className="music-card">
                <div className="track-number">{index + 1}</div>
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

                <div className="plus-container">
                  <button
                    ref={el => plusButtonRefs.current[track.id] = el}
                    className="plus-btn"
                    onClick={() => togglePlaylistMenu(track.id)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {showPlaylistMenuId && createPortal(
        <div
          className="playlist-dropdown-portal"
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 10000,
          }}
        >
          {/* Usar playlistsWithCounts en lugar de playlists para mostrar conteos */}
          {Array.isArray(playlistsWithCounts) && playlistsWithCounts.length > 0
            ? playlistsWithCounts.map((playlist) => (
              <button
                key={playlist.id}
                className="playlist-option"
                onClick={() => handleAddToPlaylist(playlist.id, tracks.find(t => t.id === showPlaylistMenuId))}
                tabIndex={0}
              >
                <span className="playlist-name">{playlist.name}</span>
                <span className="playlist-count">
                  {playlist.songCount !== undefined
                    ? `${playlist.songCount} ${playlist.songCount === 1 ? 'canción' : 'canciones'}`
                    : '0 canciones'
                  }
                </span>
              </button>
            ))
            : Array.isArray(playlists) && playlists.map((playlist) => (
              <button
                key={playlist.id}
                className="playlist-option"
                onClick={() => handleAddToPlaylist(playlist.id, tracks.find(t => t.id === showPlaylistMenuId))}
                tabIndex={0}
              >
                <span className="playlist-name">{playlist.name}</span>
                <span className="playlist-count">0 canciones</span>
              </button>
            ))
          }
          <button
            className="playlist-option create-new-playlist"
            onClick={() => {
              setSelectedTrack(tracks.find(t => t.id === showPlaylistMenuId));
              setShowPlaylistMenuId(null);
              setShowNewPlaylistModal(true);
            }}
            tabIndex={0}
          >
            + Crear nueva playlist
          </button>
        </div>,
        document.body
      )}

      {showNewPlaylistModal &&
        createPortal(
          <NewPlaylistModal
            isOpen={showNewPlaylistModal}
            onClose={() => setShowNewPlaylistModal(false)}
            onCreate={async (name) => {
              const token = localStorage.getItem("token");
              const result = await createUserPlaylist(token, name);

              if (result) {
                console.log("Playlist creada desde botón +:", result);
                refreshPlaylists();
                setShowNewPlaylistModal(false);

                if (selectedTrack) {
                  const songData = {
                    song_id: selectedTrack.id,
                    name: selectedTrack.name,
                    artist: selectedTrack.artist,
                    audio_url: selectedTrack.audio,
                    image_url: selectedTrack.image,
                  };

                  const addRes = await addSongToPlaylist(result.id, songData, token);
                  if (addRes.ok) {
                    alert("🎶 Playlist creada y canción agregada con éxito!");
                    setSelectedTrack(null);

                    // Actualizar contador local para la nueva playlist
                    setPlaylistsWithCounts(prev => [...prev, {
                      ...result,
                      songCount: 1,
                      hasRealCount: true
                    }]);

                    // ✅ Notificar al Player
                    notifyPlaylistSongAdded(result.id, 'results');

                  } else {
                    alert("Playlist creada, pero error al añadir la canción.");
                  }
                }
              } else {
                alert("No se pudo crear la playlist.");
              }
            }}
          />,
          document.body
        )
      }
    </div>
  );
};

export default Results;