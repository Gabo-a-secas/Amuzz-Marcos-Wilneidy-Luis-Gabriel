import { createContext, useContext, useReducer, useEffect } from "react";
import storeReducer, { initialStore } from "../store";
import { refreshUserSession } from "../store";

export const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [store, dispatch] = useReducer(storeReducer, initialStore());

  const refreshPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/playlists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al obtener playlists");

      const data = await res.json();

  
      dispatch({ type: "SET_PLAYLISTS", payload: data });
    } catch (error) {
      console.error("❌ Error al refrescar playlists:", error.message);
      dispatch({ type: "SET_PLAYLISTS", payload: [] });
    }
  };

  useEffect(() => {
  (async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const ok = await refreshUserSession(dispatch);
    if (ok) {
      await refreshPlaylists();
    } else {
    }
  })();
},[]);
  return (
    <StoreContext.Provider value={{ store, dispatch, refreshPlaylists }}>
      {children}
    </StoreContext.Provider>
  );
}


export default function useGlobalReducer() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useGlobalReducer debe usarse dentro de StoreProvider");
  }
  return context;
}