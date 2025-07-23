export const initialStore = () => ({
  user: null,
  isAuthenticated: false,
  currentTrack: null, // << nuevo
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
      };
    default:
      return state;
  }
}
