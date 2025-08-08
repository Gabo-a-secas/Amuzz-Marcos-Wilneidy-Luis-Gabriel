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
      playlist: {
        ...playlist,
        songCount: playlist.songCount || 0,
        hasRealCount: true
      }, 
      action: 'playlist_created',
      source,
      timestamp: Date.now()
    }
  }));
};

/**
 * 🔧 NEW: Disparar evento cuando se crea una nueva playlist con datos completos
 * @param {object} playlist - La playlist creada con toda su información
 * @param {string} source - Componente que disparó el evento
 * @param {number} initialSongCount - Número inicial de canciones (0 o 1)
 */
export const notifyPlaylistCreatedWithData = (playlist, source = 'unknown', initialSongCount = 0) => {
  console.log(`Notifying playlist created with data: ${playlist.name} from ${source} with ${initialSongCount} songs`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      playlist: {
        ...playlist,
        songCount: initialSongCount,
        hasRealCount: true
      }, 
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

/**
 * 🔧 NEW: Disparar evento cuando se crea una playlist Y se agrega una canción en una sola operación
 * @param {object} playlist - La playlist creada
 * @param {string} source - Componente que disparó el evento
 */
export const notifyPlaylistCreatedWithSong = (playlist, source = 'unknown') => {
  console.log(`Notifying playlist created with song: ${playlist.name} from ${source}`);
  window.dispatchEvent(new CustomEvent('playlistUpdated', {
    detail: { 
      playlist: {
        ...playlist,
        songCount: 1, // Ya tiene una canción
        hasRealCount: true
      }, 
      action: 'playlist_created_with_song',
      source,
      timestamp: Date.now()
    }
  }));
};

/**
 * 🔧 NEW: Disparar múltiples eventos en secuencia para operaciones complejas
 * @param {object} playlist - La playlist creada
 * @param {boolean} hasSong - Si se agregó una canción
 * @param {string} source - Componente que disparó el evento
 */
export const notifyPlaylistCompleteOperation = (playlist, hasSong = false, source = 'unknown') => {
  // Primero notificar la creación
  notifyPlaylistCreated(playlist, source);
  
  // Luego, si se agregó una canción, notificar eso también
  if (hasSong) {
    setTimeout(() => {
      notifyPlaylistSongAdded(playlist.id, source);
    }, 100); // Pequeño delay para asegurar el orden
  }
};