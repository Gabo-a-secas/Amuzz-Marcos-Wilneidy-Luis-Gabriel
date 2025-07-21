export const initialStore = () => ({
  user: null,
  isAuthenticated: false,
  // ...otros estados globales
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
    // ...otros casos
    default:
      return state;
  }
}
