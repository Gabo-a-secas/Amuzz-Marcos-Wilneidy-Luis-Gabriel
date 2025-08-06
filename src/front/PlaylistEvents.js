// PlaylistEvents.js - Helper para manejar eventos de playlists

/**
 * Disparar evento cuando se agrega una canción a una playlist
 * @param {string} playlistId - ID de la playlist
 * @param {string} source - Componente que disparó el evento ('player', 'results', etc.)
 */
export const notifyPlaylistSongAdded = (playlistId, source = 'unknown') => {
  console.log(`Notifying playlist song added: ${playlistId} from ${source}`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      playlistId, 
      action: 'song_added',
      source,
      timestamp: Date.now()
    }
  }));
};

/**
 * Disparar evento cuando se crea una nueva playlist
 * @param {object} playlist - La playlist creada
 * @param {string} source - Componente que disparó el evento
 */
export const notifyPlaylistCreated = (playlist, source = 'unknown') => {
  console.log(`Notifying playlist created: ${playlist.name} from ${source}`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      playlist, 
      action: 'playlist_created',
      source,
      timestamp: Date.now()
    }
  }));
};

/**
 * Disparar evento para refrescar todas las playlists
 * @param {string} source - Componente que disparó el evento
 */
export const notifyPlaylistRefresh = (source = 'unknown') => {
  console.log(`Notifying playlist refresh from ${source}`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      action: 'refresh',
      source,
      timestamp: Date.now()
    }
  }));
};

/**
 * Disparar evento cuando se elimina una canción de una playlist
 * @param {string} playlistId - ID de la playlist
 * @param {string} source - Componente que disparó el evento
 */
export const notifyPlaylistSongRemoved = (playlistId, source = 'unknown') => {
  console.log(`Notifying playlist song removed: ${playlistId} from ${source}`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      playlistId, 
      action: 'song_removed',
      source,
      timestamp: Date.now()
    }
  }));
};

/**
 * Hook para escuchar cambios en playlists
 * @param {function} callback - Función a ejecutar cuando hay cambios
 */
export const usePlaylistEvents = (callback) => {
  React.useEffect(() => {
    const handlePlaylistEvent = (event) => {
      callback(event.detail);
    };

    window.addEventListener('playlistUpdated', handlePlaylistEvent);
    
    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistEvent);
    };
  }, [callback]);
};

/**
 * Notificar cuando se actualiza una playlist completa (para refrescar conteos)
 * @param {string} playlistId - ID de la playlist
 * @param {string} source - Componente que disparó el evento
 */
export const notifyPlaylistUpdated = (playlistId, source = 'unknown') => {
  console.log(`Notifying playlist updated: ${playlistId} from ${source}`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      playlistId, 
      action: 'playlist_updated',
      source,
      timestamp: Date.now()
    }
  }));
};