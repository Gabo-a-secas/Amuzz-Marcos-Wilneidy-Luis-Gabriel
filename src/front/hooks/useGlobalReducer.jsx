// Import necessary hooks and functions from React.
import { createContext, useContext, useReducer } from "react";
import storeReducer, { initialStore } from "../store";

// Create a context to hold the global state of the application
// We will call this global state the "store" to avoid confusion while using local states
export const StoreContext = createContext(null);

// Define a provider component that encapsulates the store and warps it in a context provider to 
// broadcast the information throught all the app pages and components.
export function StoreProvider({ children }) {
    // Initialize reducer with the initial state.
    const [store, dispatch] = useReducer(storeReducer, initialStore())
    // Provide the store and dispatch method to all child components.
    return <StoreContext.Provider value={{ store, dispatch }}>
        {children}
    </StoreContext.Provider>
}

export default function useGlobalReducer() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useGlobalReducer must be used within a StoreProvider");
  }

  const { store, dispatch } = context;
  return { store, dispatch };
}