import { useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { usePlayer } from "../hooks/PlayerContext";
import { FaPlay, FaPlus } from "react-icons/fa";
import "../results.css";
import { addSongToPlaylist, getUserPlaylists, createUserPlaylist } from "../store";
import NewPlaylistModal from "../components/NewPlaylistModal";
import "../NewPlaylistModal.css";
import { createPortal } from "react-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

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
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [showPlaylistMenuId, setShowPlaylistMenuId] = useState(null);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    refreshPlaylists();
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
    };

    const res = await addSongToPlaylist(playlistId, songData, token);
    if (res.ok) {
      alert("Canción agregada");
      refreshPlaylists();
      setShowPlaylistMenuId(null);
    } else {
      alert("Error al agregar canción");
    }

    setShowPlaylistMenuId(null);
  };

  const togglePlaylistMenu = (trackId) => {
    setShowPlaylistMenuId(prev => (prev === trackId ? null : trackId));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowPlaylistMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
                  <button className="plus-btn" onClick={() => togglePlaylistMenu(track.id)}>+</button>
                  {showPlaylistMenuId === track.id && (
                    <div className="playlist-dropdown" ref={dropdownRef}>
                      {Array.isArray(playlists) && playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          className="playlist-option"
                          onClick={() => handleAddToPlaylist(playlist.id, track)}
                          tabIndex={0}
                        >
                          {playlist.name}
                        </button>
                      ))}
                      <button
                        className="playlist-option create-new-playlist"
                        onClick={() => {
                          setSelectedTrack(track);
                          setShowPlaylistMenuId(null);
                          setShowNewPlaylistModal(true);
                        }}
                        tabIndex={0}
                      >
                        + Crear nueva playlist
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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