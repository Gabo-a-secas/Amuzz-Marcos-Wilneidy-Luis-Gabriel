import { useEffect, useState } from "react";
import "../PlaylistViewModal.css";
import useGlobalReducer from "../hooks/useGlobalReducer";

const PlaylistViewModal = ({ isOpen, onClose, playlistId, playlistName }) => {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const { refreshPlaylists } = useGlobalReducer();

    useEffect(() => {
        const fetchSongs = async () => {
            if (!playlistId || !isOpen) return;

            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("token");
                const res = await fetch(`https://legendary-eureka-975rxjgrgp6v3xjrr-3001.app.github.dev/api/playlists/${playlistId}/songs`, {
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

        fetchSongs();
    }, [playlistId, isOpen]);

    const handleDelete = async () => {
    if (!confirmDeleteId) return;

    setDeleting(true);
    const token = localStorage.getItem("token");

    try {
        let url = "";
        if (confirmDeleteId === "playlist") {
            url = `https://legendary-eureka-975rxjgrgp6v3xjrr-3001.app.github.dev/api/playlists/${playlistId}`;
        } else {
            url = `https://legendary-eureka-975rxjgrgp6v3xjrr-3001.app.github.dev/api/playlists/${playlistId}/songs/${confirmDeleteId}`;
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
        } else {
            setSongs(prev => prev.filter(song => song.id !== confirmDeleteId));
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
                <h2 className="p_viewmodal-header">
                    {playlistName || `Playlist #${playlistId}`}
                    <button className="p_delete-playlist-button" onClick={() => setConfirmDeleteId("playlist")}>
                        🗑️
                    </button>
                </h2>

                {loading && <p>Cargando canciones...</p>}
                {error && <p className="p_viewerror">{error}</p>}

                {!loading && songs.length === 0 && !error && (
                    <p>No hay canciones en esta playlist.</p>
                )}

                <ul>
                    {songs.map((song) => (
                        <li key={song.id} className="p_view-song-item">
                            <span><strong>{song.name}</strong> - {song.artist}</span>
                            <button className="p_delete-button" onClick={() => setConfirmDeleteId(song.id)}>🗑️</button>
                        </li>
                    ))}
                </ul>

               
                {confirmDeleteId && (
                    <div className="p_confirm-modal">
                        <div className="p_confirm-content">
                            <p>
                                ¿Seguro que quieres eliminar{" "}
                                {confirmDeleteId === "playlist" ? "la playlist completa" : "esta canción"}?
                            </p>
                            <button onClick={handleDelete} disabled={deleting}>
                                {deleting ? "Eliminando..." : "Sí, eliminar"}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistViewModal;
