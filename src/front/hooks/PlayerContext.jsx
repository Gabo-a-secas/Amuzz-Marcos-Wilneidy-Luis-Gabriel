import React, { createContext, useContext, useState, useCallback } from "react";

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [expanded, setExpanded] = useState(false);
  const [track, setTrack] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  
  const [playlist, setPlaylist] = useState([]); // 
  const [currentIndex, setCurrentIndex] = useState(0); 

  const openPlayer = useCallback((newTrack, trackList = []) => {
    
    if (trackList.length > 0) {
      setPlaylist(trackList);
      const index = trackList.findIndex(t => t.id === newTrack.id);
      setCurrentIndex(index >= 0 ? index : 0);
    } else {
      
      setPlaylist([newTrack]);
      setCurrentIndex(0);
    }
    
    setTrack(newTrack);
    setVisible(true);
    setIsPlaying(true);
  }, []);

  const closePlayer = useCallback(() => {
    setVisible(false);
    setTrack(null);
    setIsPlaying(false);
    setPlaylist([]);
    setCurrentIndex(0);
  }, []);

  const setPlaying = useCallback((playing) => {
    setIsPlaying(playing);
  }, []);

  
  const nextTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];
    
    setCurrentIndex(nextIndex);
    setTrack(nextTrack);
    setIsPlaying(true);
  }, [playlist, currentIndex]);

  
  const previousTrack = useCallback(() => {
    if (playlist.length === 0) return;
    
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    const prevTrack = playlist[prevIndex];
    
    setCurrentIndex(prevIndex);
    setTrack(prevTrack);
    setIsPlaying(true);
  }, [playlist, currentIndex]);

  
  const playTrackAtIndex = useCallback((index) => {
    if (index < 0 || index >= playlist.length) return;
    
    const selectedTrack = playlist[index];
    setCurrentIndex(index);
    setTrack(selectedTrack);
    setIsPlaying(true);
  }, [playlist]);

  const expandPlayer = useCallback(() => setExpanded(true), []);
  const collapsePlayer = useCallback(() => setExpanded(false), []);

  return (
    <PlayerContext.Provider
      value={{
        track,
        visible,
        isPlaying,
        playlist,
        currentIndex,
        setPlaying,
        openPlayer,
        closePlayer,
        nextTrack,
        previousTrack,
        playTrackAtIndex,
        expanded,
        expandPlayer,
        collapsePlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}

