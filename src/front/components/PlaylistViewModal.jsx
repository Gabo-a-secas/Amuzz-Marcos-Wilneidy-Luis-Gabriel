import { useEffect, useState } from "react";
import "../PlaylistViewModal.css";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { notifyPlaylistSongRemoved, notifyPlaylistRefresh } from "../PlaylistEvents.js";

const PlaylistViewModal = ({ isOpen, onClose, playlistId, playlistName }) => {
    const [songs, setSongs] = useState([]);
    const [playlistInfo, setPlaylistInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { refreshPlaylists } = useGlobalReducer();

    // ✅ NUEVA FUNCIÓN: Obtener info de la playlist
    const fetchPlaylistInfo = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/playlists`, {

                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Error al traer playlists");

            const playlists = await res.json();
            // Buscar la playlist específica por ID
            const currentPlaylist = (Array.isArray(playlists) ? playlists : []).find(
                p => p.id === Number(playlistId) 
            );

            if (currentPlaylist) {
                setPlaylistInfo(currentPlaylist);
            }
        } catch (err) {
            console.error("Error al obtener info de playlist:", err);
            // Si falla, mantenemos el nombre que viene por props
            setPlaylistInfo({ name: playlistName || `Playlist #${playlistId}` });
        }
    };

    // ✅ FUNCIÓN ACTUALIZADA: Obtener canciones
    const fetchSongs = async () => {
        if (!playlistId || !isOpen) return;

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });


            if (!res.ok) throw new Error("Error al traer las canciones");

            const data = await res.json();
            setSongs(data);
        } catch (err) {
            setError(err.message);
            setSongs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && playlistId) {
            // ✅ ACTUALIZADO: Traer tanto la info de playlist como las canciones
            fetchPlaylistInfo();
            fetchSongs();
        }
    }, [playlistId, isOpen]);

    // ✅ NUEVA FUNCIÓN: Formatear duración de segundos a mm:ss
    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // ✅ NUEVA FUNCIÓN: Reproducir una canción específica
    const playSong = (song) => {
        // TODO: Implementar reproductor de audio
        console.log('Reproducir canción:', song);
        alert(`Reproduciendo: ${song.name} - ${song.artist}`);
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;

        setDeleting(true);
        const token = localStorage.getItem("token");

        try {
            let url = "";
            if (confirmDeleteId === "playlist") {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}`;
            } else {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs/${confirmDeleteId}`;
            }


            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Error al eliminar");

            if (confirmDeleteId === "playlist") {
                onClose();
                refreshPlaylists();
                notifyPlaylistRefresh('playlistModal');
            } else {
                setSongs(prev => prev.filter(song => song.id !== confirmDeleteId));
                notifyPlaylistSongRemoved(playlistId, 'playlistModal');
                console.log(`Song removed from playlist ${playlistId}`);
            }

            setConfirmDeleteId(null);
        } catch (err) {
            alert("Error: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="p_viewmodal-backdrop">
            <div className="p_viewmodal">
                <button className="p_viewclose-button" onClick={onClose}>✖</button>

                {/* ✅ ACTUALIZADO: Mostrar nombre real de la playlist */}
                <h2 className="p_viewmodal-header">
                    {playlistInfo ? playlistInfo.name : (playlistName || `Playlist #${playlistId}`)}
                    <button className="p_delete-playlist-button" onClick={() => setConfirmDeleteId("playlist")}>
                        🗑️
                    </button>
                </h2>

                {/* ✅ OPCIONAL: Mostrar descripción si existe */}
                {playlistInfo?.description && (
                    <p className="playlist-description">{playlistInfo.description}</p>
                )}

                {loading && <p>Loading...</p>}
                {error && <p className="p_viewerror">{error}</p>}

                {!loading && songs.length === 0 && !error && (
                    <p>No songs on this playlist, add a new one.</p>
                )}

                {/* ✅ NUEVA VISTA TIPO LISTA DETALLADA */}
                {!loading && songs.length > 0 && (
                    <div className="songs-table-container">
                        <div className="songs-table-header">
                            <div className="song-info-column">Song</div>
                            <div className="song-details-column">Detail</div>
                            <div className="song-actions-column">Action</div>
                        </div>

                        <div className="songs-list">
                            {songs.map((song, index) => (
                                <div key={song.id} className="song-item">
                                    <div className="song-info-column">
                                        <div className="song-image-container">
                                            {song.image_url ? (
                                                <img
                                                    src={song.image_url}
                                                    alt={`${song.name} cover`}
                                                    className="song-image"
                                                />
                                            ) : (
                                                <div className="song-image-placeholder">🎵</div>
                                            )}
                                        </div>
                                        <div className="song-main-info">
                                            <div className="song-title">{song.name}</div>
                                            <div className="song-artist">{song.artist}</div>
                                        </div>
                                    </div>

                                    <div className="song-details-column">
                                        <div className="song-detail-row">
                                            <span className="detail-label">Genre:</span>
                                            <span className="detail-value">
                                                {(() => {
                                                    const g = song.genre !== undefined ? song.genre : song.genres;
                                                    if (!g) return 'N/A';
                                                    if (Array.isArray(g)) return g.join(', ');
                                                    if (typeof g === 'string') {
                                                        try {
                                                            const parsed = JSON.parse(g);
                                                            return Array.isArray(parsed) ? parsed.join(', ') : g;
                                                        } catch {
                                                            return g; 
                                                        }
                                                    }
                                                    return 'N/A';
                                                })()}
                                            </span>

                                        </div>
                                        <div className="song-detail-row">
                                            <span className="detail-label">Duration:</span>
                                            <span className="detail-value">
                                                {song.duration ? formatDuration(song.duration) : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="song-detail-row">
                                            <span className="detail-label">Release date:</span>
                                            <span className="detail-value">
                                                {song.release_date ? new Date(song.release_date).getFullYear() : 'N/A'}
                                            </span>
                                        </div>
                                        {song.album_name && (
                                            <div className="song-detail-row">
                                                <span className="detail-label">Album:</span>
                                                <span className="detail-value">{song.album_name}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="song-actions-column">
                                        <button
                                            className="play-button"
                                            onClick={() => playSong(song)}
                                            title="Reproducir canción"
                                        >
                                            ▶️
                                        </button>
                                        <button
                                            className="p_delete-button"
                                            onClick={() => setConfirmDeleteId(song.id)}
                                            title="Eliminar de playlist"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {confirmDeleteId && (
                    <div className="p_confirm-modal">
                        <div className="p_confirm-content">
                            <p>
                                    Sure you want to delete{" "}
                                {confirmDeleteId === "playlist" ? "la playlist completa" : "esta canción"}?
                            </p>
                            <button onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistViewModal;