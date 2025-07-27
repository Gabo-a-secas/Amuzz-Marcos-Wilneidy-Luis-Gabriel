export const initialStore = () => ({
  user: null,
  isAuthenticated: false,
  currentTrack: null,     // Objeto con la canción actual
  isPlaying: false,       // ¿Está sonando?
  isPlayerVisible: false, // ¿Está visible el reproductor?
  isPlayerMinimized: false // ¿Está minimizado?
});

export default function storeReducer(state, action) {
  switch (action.type) {
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

