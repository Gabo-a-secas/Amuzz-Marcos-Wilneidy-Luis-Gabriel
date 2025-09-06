import { useEffect, useState } from "react";
import { useNotifications } from "../NotificationProvider";
import { usePlayer } from "../hooks/PlayerContext";
import "../PlaylistViewModal.css";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { notifyPlaylistSongRemoved, notifyPlaylistRefresh } from "../PlaylistEvents.js";

const PlaylistViewModal = ({ isOpen, onClose, playlistId, playlistName }) => {
    const [songs, setSongs] = useState([]);
    const [playlistInfo, setPlaylistInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmModal, setConfirmModal] = useState(null); 
    const [deleting, setDeleting] = useState(false);
    const { refreshPlaylists } = useGlobalReducer();
    const { showSuccess, showError } = useNotifications(); 
    const { openPlayer } = usePlayer();

    // Debug: verificar que las funciones están disponibles
    useEffect(() => {
        console.log('PlaylistViewModal hooks:', {
            showSuccess: typeof showSuccess,
            showError: typeof showError,
            openPlayer: typeof openPlayer
        });
    }, [showSuccess, showError, openPlayer]);

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
        console.log('🎵 Intentando reproducir canción:', song);
        
        if (!song.audio_url) {
            console.error('La canción no tiene URL de audio:', song);
            showError('Esta canción no tiene archivo de audio disponible');
            return;
        }
        
        // Crear el objeto track con la estructura esperada por el player
        const trackData = {
            id: song.id,
            name: song.name,
            artist: song.artist,
            audio: song.audio_url,
            image: song.image_url,
            duration: song.duration,
            genre: song.genre || song.genres,
            album_name: song.album_name,
            release_date: song.release_date,
            waveform: song.waveform,
            genres: song.genre || song.genres,
        };

        console.log('🎵 Track data preparado:', trackData);

        // Crear playlist con todas las canciones de la playlist actual
        const playlistData = songs.map(s => ({
            id: s.id,
            name: s.name,
            artist: s.artist,
            audio: s.audio_url,
            image: s.image_url,
            duration: s.duration,
            genre: s.genre || s.genres,
            album_name: s.album_name,
            release_date: s.release_date,
            waveform: s.waveform,
            genres: s.genre || s.genres,
        }));

        console.log('🎵 Playlist data preparado:', playlistData);

        try {
            // Abrir el player con la canción y la playlist
            openPlayer(trackData, playlistData);
            showSuccess(`Reproduciendo: ${song.name} - ${song.artist} 🎵`);
        } catch (error) {
            console.error('Error al abrir player:', error);
            showError('Error al reproducir la canción');
        }
    };

    const handleDelete = async (id) => {
        if (!id) return;

        setDeleting(true);
        const token = localStorage.getItem("token");

        try {
            let url = "";
            if (id === "playlist") {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}`;
            } else {
                url = `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs/${id}`;
            }

            const res = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error("Error al eliminar");

            if (id === "playlist") {
                showSuccess("Playlist eliminada con éxito");
                onClose();
                refreshPlaylists();
                notifyPlaylistRefresh('playlistModal');
            } else {
                const songName = songs.find(s => s.id === id)?.name || "la canción";
                showSuccess(`"${songName}" eliminada de la playlist`);
                setSongs(prev => prev.filter(song => song.id !== id));
                notifyPlaylistSongRemoved(playlistId, 'playlistModal');
                console.log(`Song removed from playlist ${playlistId}`);
            }

        } catch (err) {
            showError("Error al eliminar: " + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleConfirmDelete = () => {
        if (confirmModal) {
            console.log('Usuario confirmó eliminación');
            handleDelete(confirmModal.id);
            setConfirmModal(null);
        }
    };

    const handleCancelDelete = () => {
        console.log('Usuario canceló eliminación');
        setConfirmModal(null);
    };

    const confirmDelete = (id, itemName) => {
        console.log('Intentando eliminar:', { id, itemName });
        
        const isPlaylist = id === "playlist";
        const message = isPlaylist 
            ? `¿Estás seguro de que quieres eliminar la playlist completa "${playlistInfo?.name || 'esta playlist'}"? Esta acción no se puede deshacer.`
            : `¿Estás seguro de que quieres eliminar "${itemName}" de la playlist?`;
        
        console.log('Mostrando confirmación:', { message, isPlaylist });
        
        // Usar modal local en lugar de notificación global
        setConfirmModal({
            id,
            itemName,
            message,
            title: isPlaylist ? "Eliminar Playlist" : "Eliminar Canción",
            isPlaylist
        });
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
                        🗑️
                    </button>
                </h2>

                {playlistInfo?.description && (
                    <p className="playlist-description">{playlistInfo.description}</p>
                )}

                {loading && <p>Loading...</p>}
                {error && <p className="p_viewerror">{error}</p>}

                {!loading && songs.length === 0 && !error && (
                    <p>There are no songs on this playlist, add a new song!</p>
                )}

                {!loading && songs.length > 0 && (
                    <div className="songs-table-container">
                        <div className="songs-table-header">
                            <div className="song-info-column">Song</div>
                            <div className="song-details-column">Details</div>
                            <div className="song-actions-column">Actions</div>
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

                {/* Modal de confirmación local */}
                {confirmModal && (
                    <div className="p_confirm-modal">
                        <div className="p_confirm-content">
                            <div className="p_confirm-header">
                                <span className="p_confirm-icon">❓</span>
                                <h3 className="p_confirm-title">{confirmModal.title}</h3>
                            </div>
                            <p className="p_confirm-message">{confirmModal.message}</p>
                            <div className="p_confirm-actions">
                                <button 
                                    onClick={handleConfirmDelete} 
                                    disabled={deleting}
                                    className="p_confirm-delete-btn"
                                >
                                    {deleting ? "Eliminando..." : "Sí, eliminar"}
                                </button>
                                <button 
                                    onClick={handleCancelDelete} 
                                    disabled={deleting}
                                    className="p_confirm-cancel-btn"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistViewModal;