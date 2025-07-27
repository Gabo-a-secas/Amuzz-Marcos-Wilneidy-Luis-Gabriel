import { createContext, useContext, useState, useCallback } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [track, setTrack]     = useState(null);
  const [visible, setVisible] = useState(false);

  const openPlayer = useCallback((newTrack) => {
    setTrack(newTrack);
    setVisible(true);
  }, []);

  const closePlayer = useCallback(() => {
    setVisible(false);
    setTrack(null);
  }, []);

  return (
    <PlayerContext.Provider
      value={{ track, visible, openPlayer, closePlayer }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
