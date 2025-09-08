const API_BASE = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, "");

export const initialStore = () => {
  const storedToken = localStorage.getItem("token") || null;

  const rawUser = localStorage.getItem("user"); 
  let user = null;
  if (rawUser && rawUser !== "undefined" && rawUser !== "null") {
    try {
      user = JSON.parse(rawUser);
    } catch {
      localStorage.removeItem("user");
      user = null;
    }
  }

  return {
    user,
    token: storedToken,
    isAuthenticated: !!storedToken,
    currentTrack: null,
    playlists: [],
    selectedPlaylistId: null,
    isPlaying: false,
    isPlayerVisible: false,
    isPlayerMinimized: false,
  };
};

export default function storeReducer(state, action) {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.access_token);

      return {
        ...state,
        user: action.payload.user,
        token: action.payload.access_token,
        isAuthenticated: true,
      };
    
    case "REFRESH_SESSION_SUCCESS":  
      localStorage.setItem("user", JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };

    case "SET_CURRENT_TRACK":
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: true,
        isPlayerVisible: true,
        isPlayerMinimized: false,
      };
    case "SET_PLAYLISTS":
      return {
        ...state,
        playlists: action.payload,
      };

    case "SET_SELECTED_PLAYLIST":
      return {
        ...state,
        selectedPlaylistId: action.payload,
      };

    case "LOGOUT":
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        currentTrack: null,
      };

    case "STOP_TRACK":
      return {
        ...state,
        currentTrack: null,
        isPlaying: false,
        isPlayerVisible: false,
        isPlayerMinimized: false,
      };

    case "TOGGLE_PLAY_PAUSE":
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };

    case "SET_PLAYING":
      return {
        ...state,
        isPlaying: true,
      };

    case "SET_PAUSED":
      return {
        ...state,
        isPlaying: false,
      };

    case "MINIMIZE_PLAYER":
      return {
        ...state,
        isPlayerMinimized: true,
      };

    case "MAXIMIZE_PLAYER":
      return {
        ...state,
        isPlayerMinimized: false,
      };

    case "TOGGLE_PLAYER_VISIBILITY":
      return {
        ...state,
        isPlayerVisible: !state.isPlayerVisible,
      };

    default:
      return state;
  }
}

export async function refreshUserSession(dispatch) {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/refresh-session`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401 || response.status === 422) {
      dispatch({ type: "LOGOUT" });
      return false;
    }

    if (!response.ok) {
      console.error("No se pudo refrescar la sesión");
      return false;
    }

    const data = await response.json();
    dispatch({ type: "REFRESH_SESSION_SUCCESS", payload: data.user });
    console.log("Sesión refrescada automáticamente:", data.user);
    return true;
  } catch (error) {
    console.error("Error al refrescar sesión:", error);
    return false;
  }
}

export async function createUserPlaylist(token, name) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/playlists`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }
    );

    console.log("➡️ Enviando nueva playlist:", name);
    console.log("Token que se está enviando:", token);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "No se pudo crear la playlist");
    }

    const data = await response.json();
    console.log("✅ Playlist creada correctamente:", data);
    return data;
  } catch (error) {
    console.error("❌ Error creando playlist:", error);
    return null;
  }
}

export async function getUserPlaylists(token) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/playlists`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("Token que se está enviando:", token);

    if (!response.ok) {
      throw new Error("No se pudieron obtener las playlists");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error obteniendo playlists:", error);
    return null;
  }
}

// 🔧 FUNCIÓN CORREGIDA: addSongToPlaylist
export async function addSongToPlaylist(playlistId, songData, token) {
  try {
    console.log("🔧 addSongToPlaylist - Datos originales:", songData);
    
    // 🔧 VALIDAR datos requeridos primero
    if (!playlistId) {
      throw new Error("playlistId es requerido");
    }
    if (!songData) {
      throw new Error("songData es requerido");
    }
    if (!token) {
      throw new Error("token es requerido");
    }

    // 🔧 LIMPIAR y estructurar datos correctamente
    const completeSongData = {
      // ✅ Campos requeridos por el backend
      song_id: songData.song_id || songData.id,
      name: songData.name,
      artist: songData.artist,
      audio_url: songData.audio_url || songData.audio,
      image_url: songData.image_url || songData.image,
      
      // ✅ Campos opcionales con valores por defecto seguros
      duration: songData.duration && !isNaN(songData.duration) ? Number(songData.duration) : null,
      
      // 🔧 MANEJAR géneros correctamente
      genre: (() => {
        if (!songData.genre && !songData.genres) return null;
        
        const genreData = songData.genre || songData.genres;
        
        // Si ya es string, devolverlo tal como está
        if (typeof genreData === 'string') {
          // Si parece ser JSON, validarlo
          try {
            JSON.parse(genreData);
            return genreData; // Ya es JSON válido
          } catch {
            return JSON.stringify([genreData]); // Convertir string simple a array JSON
          }
        }
        
        // Si es array, convertir a JSON
        if (Array.isArray(genreData)) {
          return JSON.stringify(genreData);
        }
        
        return null;
      })(),
      
      // 🔧 MANEJAR fecha correctamente
      release_date: (() => {
        if (!songData.release_date) return null;
        
        // Si ya es una fecha válida, mantenerla
        if (songData.release_date instanceof Date) {
          return songData.release_date.toISOString();
        }
        
        // Si es string, validar que sea una fecha válida
        if (typeof songData.release_date === 'string') {
          const date = new Date(songData.release_date);
          return !isNaN(date.getTime()) ? songData.release_date : null;
        }
        
        return null;
      })(),
      
      // ✅ Campos adicionales opcionales
      album_name: songData.album_name || null,
      waveform: songData.waveform || null,
    };

    console.log("🔧 addSongToPlaylist - Datos procesados:", completeSongData);

    // 🔧 VALIDAR campos críticos antes del envío
    if (!completeSongData.song_id) {
      console.error("❌ song_id faltante:", { original: songData, processed: completeSongData });
      throw new Error("song_id es requerido pero no se encontró en los datos");
    }
    
    if (!completeSongData.name) {
      console.error("❌ name faltante:", { original: songData, processed: completeSongData });
      throw new Error("name es requerido pero no se encontró en los datos");
    }
    
    if (!completeSongData.artist) {
      console.error("❌ artist faltante:", { original: songData, processed: completeSongData });
      throw new Error("artist es requerido pero no se encontró en los datos");
    }
    
    if (!completeSongData.audio_url) {
      console.error("❌ audio_url faltante:", { original: songData, processed: completeSongData });
      throw new Error("audio_url es requerido pero no se encontró en los datos");
    }

    console.log(`🔧 Enviando request a: ${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs`);

    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(completeSongData),
      }
    );

    console.log("🔧 Response status:", response.status);
    console.log("🔧 Response headers:", Object.fromEntries(response.headers.entries()));

    // 🔧 MANEJAR respuestas de error con más detalle
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      
      try {
        const errorData = await response.text(); // Usar text() en lugar de json() para capturar cualquier respuesta
        console.error("❌ Error del servidor:", errorData);
        
        // Intentar parsear como JSON si es posible
        try {
          const parsedError = JSON.parse(errorData);
          errorMessage = parsedError.message || parsedError.error || errorData;
        } catch {
          errorMessage = errorData || errorMessage;
        }
      } catch (parseError) {
        console.error("❌ No se pudo leer la respuesta de error:", parseError);
      }
      
      throw new Error(`Error del servidor: ${errorMessage}`);
    }

    const result = await response.json();
    console.log("✅ addSongToPlaylist - Éxito:", result);
    
    return { ok: true, result };
    
  } catch (error) {
    console.error("❌ Error en addSongToPlaylist:", error);
    console.error("❌ Stack trace:", error.stack);
    
    // 🔧 PROPORCIONAR información útil para debugging
    console.error("❌ Debugging info:", {
      playlistId,
      songData,
      hasToken: !!token,
      backendUrl: import.meta.env.VITE_BACKEND_URL
    });
    
    return { ok: false, result: null, error: error.message };
  }
}

// Resto de las funciones sin cambios...

/**
 * Obtener canciones de una playlist específica
 * @param {string} playlistId - ID de la playlist
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de canciones o array vacío
 */
export const getPlaylistSongs = async (playlistId, token) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log(`API response for playlist ${playlistId}:`, data);

      // Manejar diferentes estructuras de respuesta
      if (Array.isArray(data)) return data;
      if (data && data.songs && Array.isArray(data.songs)) return data.songs;
      if (data && Array.isArray(data.data)) return data.data;
      return [];
    } else {
      console.error(
        `Error fetching songs for playlist ${playlistId}:`,
        response.status,
        response.statusText
      );
      return [];
    }
  } catch (error) {
    console.error(
      `Network error fetching songs for playlist ${playlistId}:`,
      error
    );
    return [];
  }
};

/**
 * Obtener canciones de playlist con múltiples endpoints de respaldo
 * @param {string} playlistId - ID de la playlist
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de canciones
 */
export const getPlaylistSongsWithFallback = async (playlistId, token) => {
  // Intentar endpoint principal primero
  let songs = await getPlaylistSongs(playlistId, token);

  if (songs && songs.length > 0) {
    return songs;
  }

  // Si no funciona, probar endpoints alternativos
  const alternativeEndpoints = [
    `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}/songs`,
    `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${playlistId}`,
  ];

  for (const endpoint of alternativeEndpoints) {
    try {
      console.log(`Trying alternative endpoint: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Success with endpoint ${endpoint}:`, data);

        // Manejar diferentes estructuras de respuesta
        if (Array.isArray(data)) return data;
        if (data.songs && Array.isArray(data.songs)) return data.songs;
        if (data.data && Array.isArray(data.data)) return data.data;
        if (data.playlist && data.playlist.songs) return data.playlist.songs;
      }
    } catch (error) {
      console.log(`Endpoint ${endpoint} failed:`, error);
      continue;
    }
  }

  return [];
};

/**
 * Obtener playlists del usuario con conteo de canciones
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de playlists con conteo de canciones
 */
export const getUserPlaylistsWithSongCounts = async (token) => {
  try {
    // Primero obtener las playlists
    const playlists = await getUserPlaylists(token);

    if (!playlists || !Array.isArray(playlists)) {
      return [];
    }

    // Luego obtener el conteo de canciones para cada una
    const playlistsWithCounts = await Promise.all(
      playlists.map(async (playlist) => {
        try {
          // Verificar si ya tiene información de canciones
          if (playlist.songCount !== undefined) {
            return playlist;
          }

          if (playlist.songs && Array.isArray(playlist.songs)) {
            return {
              ...playlist,
              songCount: playlist.songs.length,
              hasRealCount: true,
            };
          }

          // Si no, obtener canciones desde la API
          const songs = await getPlaylistSongsWithFallback(playlist.id, token);

          return {
            ...playlist,
            songCount: songs.length,
            songs: songs,
            hasRealCount: true,
          };
        } catch (error) {
          console.error(
            `Error getting song count for playlist ${playlist.name}:`,
            error
          );
          return {
            ...playlist,
            songCount: 0,
            songs: [],
            hasRealCount: false,
          };
        }
      })
    );

    console.log("Playlists with song counts:", playlistsWithCounts);
    return playlistsWithCounts;
  } catch (error) {
    console.error("Error getting playlists with song counts:", error);
    return [];
  }
};

/**
 * Obtener playlists del usuario con conteo GARANTIZADO de canciones
 * Esta función siempre intentará obtener el conteo real de canciones
 * @param {string} token - Token de autenticación
 * @returns {Promise<Array>} Array de playlists con conteo garantizado de canciones
 */
export const getUserPlaylistsWithGuaranteedCounts = async (token) => {
  try {
    console.log("🔍 Getting playlists with GUARANTEED counts...");

    // Paso 1: Obtener las playlists básicas
    const playlists = await getUserPlaylists(token);

    if (!playlists || !Array.isArray(playlists) || playlists.length === 0) {
      console.log("🔍 No playlists found");
      return [];
    }

    console.log(
      `🔍 Found ${playlists.length} playlists, getting song counts...`
    );

    // Paso 2: Para cada playlist, obtener el conteo REAL de canciones
    const playlistsWithGuaranteedCounts = await Promise.all(
      playlists.map(async (playlist, index) => {
        try {
          console.log(
            `🔍 [${index + 1}/${playlists.length}] Getting songs for: ${
              playlist.name
            }`
          );

          // Solo usar el endpoint que funciona
          const endpoints = [
            `${import.meta.env.VITE_BACKEND_URL}/api/playlists/${
              playlist.id
            }/songs`,
          ];

          let songs = [];
          let success = false;

          for (const endpoint of endpoints) {
            try {
              console.log(`🔍 Trying endpoint: ${endpoint}`);

              const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });

              if (response.ok) {
                const data = await response.json();
                console.log(`🔍 Response for ${playlist.name}:`, data);

                // Manejar diferentes formatos de respuesta
                if (Array.isArray(data)) {
                  songs = data;
                } else if (data && Array.isArray(data.songs)) {
                  songs = data.songs;
                } else if (data && Array.isArray(data.data)) {
                  songs = data.data;
                } else {
                  songs = [];
                }

                success = true;
                console.log(
                  `✅ Found ${songs.length} songs for "${playlist.name}"`
                );
                break;
              } else {
                console.log(
                  `❌ Endpoint failed: ${response.status} ${response.statusText}`
                );
              }
            } catch (endpointError) {
              console.log(`❌ Endpoint error:`, endpointError.message);
              continue;
            }
          }

          const finalSongCount = songs.length;

          return {
            ...playlist,
            songCount: finalSongCount,
            songs: songs, // Incluir las canciones para referencia
            hasRealCount: success,
            lastCountUpdate: Date.now(),
          };
        } catch (error) {
          console.error(
            `❌ Error getting songs for playlist ${playlist.name}:`,
            error
          );
          return {
            ...playlist,
            songCount: 0,
            songs: [],
            hasRealCount: false,
            lastCountUpdate: Date.now(),
          };
        }
      })
    );

    console.log("🎯 Final playlists with guaranteed counts:");
    playlistsWithGuaranteedCounts.forEach((playlist) => {
      console.log(
        `🎯 "${playlist.name}": ${playlist.songCount} canciones (${
          playlist.hasRealCount ? "REAL" : "FALLBACK"
        })`
      );
    });

    return playlistsWithGuaranteedCounts;
  } catch (error) {
    console.error("❌ Error in getUserPlaylistsWithGuaranteedCounts:", error);
    return [];
  }
};