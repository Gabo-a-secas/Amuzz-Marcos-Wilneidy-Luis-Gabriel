export const initialStore = () => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  return {
    user: storedUser ? JSON.parse(storedUser) : null,
    token: storedToken || null,
    isAuthenticated: !!storedToken,
    currentTrack: null,
    isPlaying: false,
    isPlayerVisible: false, 
    isPlayerMinimized: false
  };
};

export default function storeReducer(state, action) {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('token', action.payload.access_token);


      return {
        ...state,
        user: action.payload.user,
        token: action.payload.access_token,
        isAuthenticated: true,
      };

    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };

    case "LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
      };

    case "SET_CURRENT_TRACK":
      return {
        ...state,
        currentTrack: action.payload,
        isPlaying: true,
        isPlayerVisible: true,
        isPlayerMinimized: false,
      };

    case "LOGOUT":
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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


export async function createUserPlaylist(token, name) {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/playlists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name })
    });

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
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/playlists`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

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