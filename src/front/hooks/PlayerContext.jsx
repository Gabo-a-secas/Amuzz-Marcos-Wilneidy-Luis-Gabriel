import React, { createContext, useContext, useState, useCallback } from "react";

const PlayerContext = createContext();




export function PlayerProvider({ children }) {

  const [expanded, setExpanded] = useState(false);

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

  const expandPlayer = useCallback(() => setExpanded(true), []);
  const collapsePlayer = useCallback(() => setExpanded(false), []);

  return (
    <PlayerContext.Provider
      value={{ track, visible, expanded, openPlayer, closePlayer, expandPlayer, collapsePlayer }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
