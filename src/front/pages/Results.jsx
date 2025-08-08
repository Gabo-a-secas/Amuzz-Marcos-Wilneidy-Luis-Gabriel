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
import { notifyPlaylistSongAdded, notifyPlaylistCreated } from "../PlaylistEvents.js";

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
  
  // 🔧 USAR LA MISMA ESTRUCTURA QUE EL PLAYER
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [playlistsWithCounts, setPlaylistsWithCounts] = useState([]);
  const { dispatch, state } = useGlobalReducer();
  
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showPlaylistMenuId, setShowPlaylistMenuId] = useState(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const dropdownRef = useRef(null);
  const plusButtonRefs = useRef({});

  // 🔧 EVENT LISTENER - EXACTAMENTE IGUAL QUE EN PLAYER
  useEffect(() => {
    const handlePlaylistUpdated = (event) => {
      const { playlistId, action, source, playlist } = event.detail;
      
      console.log("🎧 Results EVENT:", { action, source, playlistId, playlist });
      
      // Solo actualizar si NO viene de este mismo componente (results)
      if (source === 'results') {
        console.log("🎧 Results: Ignoring own event");
        return;
      }
      
      if (action === 'song_added') {
        console.log("🎧 Results: External song added to playlist:", playlistId);
        setPlaylistsWithCounts(prevPlaylists => {
          const updated = prevPlaylists.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: (p.songCount || 0) + 1 }
              : p
          );
          console.log("🎧 Results: Updated playlistsWithCounts:", updated);
          return updated;
        });
        
        setUserPlaylists(prevPlaylists => {
          const updated = prevPlaylists.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: (p.songCount || 0) + 1 }
              : p
          );
          console.log("🎧 Results: Updated userPlaylists:", updated);
          return updated;
        });
        
      } else if (action === 'song_removed') {
        setPlaylistsWithCounts(prevPlaylists => 
          prevPlaylists.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: Math.max(0, (p.songCount || 0) - 1) }
              : p
          )
        );
        
        setUserPlaylists(prevPlaylists => 
          prevPlaylists.map(p => 
            p.id === playlistId 
              ? { ...p, songCount: Math.max(0, (p.songCount || 0) - 1) }
              : p
          )
        );
        
      } else if (action === 'playlist_created') {
        console.log("🎧 Results: External playlist created:", playlist);
        
        if (playlist) {
          // Actualizar playlistsWithCounts
          setPlaylistsWithCounts(prev => {
            const exists = prev.some(p => p.id === playlist.id);
            console.log("🎧 Results: Playlist exists in playlistsWithCounts?", exists);
            
            if (!exists) {
              const newList = [...prev, playlist];
              console.log("🎧 Results: Adding to playlistsWithCounts. New list:", newList);
              return newList;
            }
            return prev;
          });
          
          // Actualizar userPlaylists
          setUserPlaylists(prev => {
            const exists = prev.some(p => p.id === playlist.id);
            console.log("🎧 Results: Playlist exists in userPlaylists?", exists);
            
            if (!exists) {
              const newList = [...prev, playlist];
              console.log("🎧 Results: Adding to userPlaylists. New list:", newList);
              return newList;
            }
            return prev;
          });
        }
        
      } else if (action === 'refresh') {
        console.log("🎧 Results: Refreshing all playlists due to external event");
        refreshPlaylistsResults();
      }
    };

    console.log("🎧 Results: Setting up event listener");
    window.addEventListener('playlistUpdated', handlePlaylistUpdated);
    
    return () => {
      console.log("🎧 Results: Removing event listener");
      window.removeEventListener('playlistUpdated', handlePlaylistUpdated);
    };
  }, []);

  // 🔧 CARGAR PLAYLISTS - EXACTAMENTE IGUAL QUE EN PLAYER
  useEffect(() => {
    const loadPlaylists = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          console.log("🎵 Results: Loading playlists with GUARANTEED counts...");
          const playlistsWithCounts = await getUserPlaylistsWithGuaranteedCounts(token);
          console.log("🎵 Results: Playlists with guaranteed counts received:", playlistsWithCounts);
          
          if (playlistsWithCounts && playlistsWithCounts.length > 0) {
            setUserPlaylists(playlistsWithCounts);
            setPlaylistsWithCounts(playlistsWithCounts);
            
            // Debug: mostrar conteos
            playlistsWithCounts.forEach(playlist => {
              console.log(`🎵 Results: "${playlist.name}": ${playlist.songCount || 0} canciones (${playlist.hasRealCount ? 'REAL' : 'FALLBACK'})`);
            });
          } else {
            console.log("🎵 Results: No playlists received");
          }
        } catch (error) {
          console.error("🎵 Results: Error loading playlists:", error);
        }
      }
    };
    loadPlaylists();
  }, []);

  // 🔧 FUNCIÓN REFRESH - EXACTAMENTE IGUAL QUE EN PLAYER
  const refreshPlaylistsResults = async () => {
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
      }
    }
  };

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

  // 🔧 FUNCIÓN AGREGAR A PLAYLIST - IGUAL QUE EN PLAYER
  const handleAddToPlaylist = async (playlist, track) => {
    if (!track) return;

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

    const addRes = await addSongToPlaylist(playlist.id, songData, token);
    if (addRes && addRes.ok) {
      alert(`🎶 Canción agregada a "${playlist.name}" con éxito!`);
      
      // Actualizar el conteo de la playlist específica
      setPlaylistsWithCounts(prevPlaylists => 
        prevPlaylists.map(p => 
          p.id === playlist.id 
            ? { ...p, songCount: (p.songCount || 0) + 1 }
            : p
        )
      );
      
      // Disparar evento para que otros componentes se sincronicen
      notifyPlaylistSongAdded(playlist.id, 'results');
      
    } else {
      alert(`Error al agregar la canción a "${playlist.name}".`);
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
        top: rect.bottom + scrollTop + 5,
        left: rect.left + scrollLeft - 150,
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

      {/* 🔧 DROPDOWN - USANDO PLAYLISTS CON CONTEOS IGUAL QUE EN PLAYER */}
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
          {/* Usar la misma lógica que el Player para seleccionar las playlists */}
          {(() => {
            const playlists = playlistsWithCounts.length > 0 ? playlistsWithCounts : (state?.playlists || userPlaylists);
            return playlists && playlists.length > 0;
          })() && (playlistsWithCounts.length > 0 ? playlistsWithCounts : (state?.playlists || userPlaylists)).map((playlist) => (
            <button
              key={playlist.id}
              className="playlist-option"
              onClick={() => handleAddToPlaylist(playlist, tracks.find(t => t.id === showPlaylistMenuId))}
              tabIndex={0}
            >
              <span className="playlist-name">{playlist.name}</span>
              <span className="playlist-count">
                {playlist.songCount !== undefined 
                  ? `${playlist.songCount} ${playlist.songCount === 1 ? 'canción' : 'canciones'}`
                  : (playlist.songs?.length || 0) + (playlist.songs?.length === 1 ? ' canción' : ' canciones')
                }
              </span>
            </button>
          ))}
          
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

      {/* 🔧 MODAL - EXACTAMENTE IGUAL QUE EN PLAYER */}
      {showNewPlaylistModal && createPortal(
        <NewPlaylistModal
          isOpen={showNewPlaylistModal}
          onClose={() => setShowNewPlaylistModal(false)}
          onCreate={async (name) => {
            const token = localStorage.getItem("token");
            const result = await createUserPlaylist(token, name);

            if (result) {
              console.log("✅ Results: Playlist creada desde results:", result);

              // 🔧 EXACTAMENTE IGUAL QUE EN PLAYER
              const newPlaylistWithCount = {
                ...result,
                songCount: 0, // Inicialmente 0
                hasRealCount: true
              };

              // Agregar la nueva playlist a ambos estados locales
              setPlaylistsWithCounts(prev => [...prev, newPlaylistWithCount]);
              setUserPlaylists(prev => [...prev, newPlaylistWithCount]);

              // Si hay una canción seleccionada, agregarla a la nueva playlist
              if (selectedTrack) {
                const songData = {
                  song_id: selectedTrack.id,
                  name: selectedTrack.name,
                  artist: selectedTrack.artist,
                  audio_url: selectedTrack.audio,
                  image_url: selectedTrack.image,
                };

                const addRes = await addSongToPlaylist(result.id, songData, token);
                if (addRes && addRes.ok) {
                  alert("🎶 Playlist creada y canción agregada con éxito!");
                  setSelectedTrack(null);

                  // Actualizar el contador a 1 después de agregar la canción
                  setPlaylistsWithCounts(prev =>
                    prev.map(p =>
                      p.id === result.id
                        ? { ...p, songCount: 1 }
                        : p
                    )
                  );

                  setUserPlaylists(prev =>
                    prev.map(p =>
                      p.id === result.id
                        ? { ...p, songCount: 1 }
                        : p
                    )
                  );

                  // Notificar a otros componentes
                  notifyPlaylistSongAdded(result.id, 'results');

                } else {
                  alert("Playlist creada, pero error al añadir la canción.");
                  setSelectedTrack(null);
                }
              } else {
                // Si no hay canción seleccionada, notificar playlist vacía
                console.log("🎵 Results: No selected track, notifying empty playlist creation");
                const emptyPlaylist = {
                  ...result,
                  songCount: 0,
                  hasRealCount: true
                };
                notifyPlaylistCreated(emptyPlaylist, 'results');
              }

              // Después de todo, notificar la creación de playlist
              const finalPlaylist = {
                ...result,
                songCount: selectedTrack ? 1 : 0,
                hasRealCount: true
              };
              console.log("🎵 Results: Notifying playlist created:", finalPlaylist);
              notifyPlaylistCreated(finalPlaylist, 'results');

              // Refrescar para sincronizar con el backend
              await refreshPlaylistsResults();

              setShowNewPlaylistModal(false);
            } else {
              alert("No se pudo crear la playlist.");
            }
          }}
        />,
        document.body
      )}
    </div>
  );
};

export default Results;