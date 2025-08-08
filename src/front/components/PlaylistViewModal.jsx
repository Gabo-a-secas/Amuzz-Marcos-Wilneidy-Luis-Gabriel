import { useEffect, useState } from "react";
import { useNotifications } from "../NotificationProvider";
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
    const { showSuccess, showError, showConfirm } = useNotifications();

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
            const currentPlaylist = (Array.isArray(playlists) ? playlists : []).find(
                p => p.id === Number(playlistId) 
            );

            if (currentPlaylist) {
                setPlaylistInfo(currentPlaylist);
            }
        } catch (err) {
            console.error("Error al obtener info de playlist:", err);
            setPlaylistInfo({ name: playlistName || `Playlist #${playlistId}` });
        }
    };

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
            showError("Error al cargar las canciones de la playlist");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && playlistId) {
            fetchPlaylistInfo();
            fetchSongs();
        }
    }, [playlistId, isOpen]);

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const playSong = (song) => {
        console.log('Reproducir canción:', song);
        showSuccess(`Reproduciendo: ${song.name} - ${song.artist}`);
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
                showSuccess("Playlist eliminada con éxito");
                onClose();
                refreshPlaylists();
                notifyPlaylistRefresh('playlistModal');
            } else {
                const songName = songs.find(s => s.id === confirmDeleteId)?.name || "la canción";
                showSuccess(`"${songName}" eliminada de la playlist`);
                setSongs(prev => prev.filter(song => song.id !== confirmDeleteId));
                notifyPlaylistSongRemoved(playlistId, 'playlistModal');
                console.log(`Song removed from playlist ${playlistId}`);
            }

            setConfirmDeleteId(null);
        } catch (err) {
            showError("Error al eliminar: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const confirmDelete = (id, itemName) => {
        const isPlaylist = id === "playlist";
        const message = isPlaylist 
            ? `¿Estás seguro de que quieres eliminar la playlist completa "${playlistInfo?.name || 'esta playlist'}"? Esta acción no se puede deshacer.`
            : `¿Estás seguro de que quieres eliminar "${itemName}" de la playlist?`;
        
        showConfirm(
            message,
            isPlaylist ? "Eliminar Playlist" : "Eliminar Canción",
            () => {
                setConfirmDeleteId(id);
                handleDelete();
            },
            () => {
                // No hacer nada si cancela
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div className="p_viewmodal-backdrop">
            <div className="p_viewmodal">
                <button className="p_viewclose-button" onClick={onClose}>✖</button>

                <h2 className="p_viewmodal-header">
                    {playlistInfo ? playlistInfo.name : (playlistName || `Playlist #${playlistId}`)}
                    <button 
                        className="p_delete-playlist-button" 
                        onClick={() => confirmDelete("playlist", playlistInfo?.name)}
                    >
                        🗑️ Eliminar Playlist
                    </button>
                </h2>

                {playlistInfo?.description && (
                    <p className="playlist-description">{playlistInfo.description}</p>
                )}

                {loading && <p>Cargando canciones...</p>}
                {error && <p className="p_viewerror">{error}</p>}

                {!loading && songs.length === 0 && !error && (
                    <p>No hay canciones en esta playlist. ¡Agrega algunas!</p>
                )}

                {!loading && songs.length > 0 && (
                    <div className="songs-table-container">
                        <div className="songs-table-header">
                            <div className="song-info-column">Canción</div>
                            <div className="song-details-column">Detalles</div>
                            <div className="song-actions-column">Acciones</div>
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
                                            <span className="detail-label">Género:</span>
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
                                            <span className="detail-label">Duración:</span>
                                            <span className="detail-value">
                                                {song.duration ? formatDuration(song.duration) : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="song-detail-row">
                                            <span className="detail-label">Año:</span>
                                            <span className="detail-value">
                                                {song.release_date ? new Date(song.release_date).getFullYear() : 'N/A'}
                                            </span>
                                        </div>
                                        {song.album_name && (
                                            <div className="song-detail-row">
                                                <span className="detail-label">Álbum:</span>
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
                                            onClick={() => confirmDelete(song.id, song.name)}
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
            </div>
        </div>
    );
};

export default PlaylistViewModal;