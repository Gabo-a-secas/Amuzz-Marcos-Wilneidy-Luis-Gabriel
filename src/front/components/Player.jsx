import { useEffect, useRef, useState } from "react";

export const Player = ({ track }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.load();
      setIsPlaying(true);
      setProgress(0);
    }
  }, [track]);

  useEffect(() => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.play() : audioRef.current.pause();
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const { currentTime, duration } = audioRef.current;
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleSeek = (e) => {
    const newTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
  };

  if (!track) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        <img
          src={track.image}
          alt={track.name}
          className="w-16 h-16 rounded shadow-md object-cover"
        />
        <div>
          <h4 className="text-sm font-semibold text-gray-800">{track.name}</h4>
          <p className="text-xs text-gray-500">{track.artist}</p>
        </div>
      </div>

      <div className="flex flex-col items-center w-full md:w-1/2">
        <div className="flex gap-4 mb-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-purple-600 hover:text-purple-800 text-2xl"
          >
            {isPlaying ? "⏸️" : "▶️"}
          </button>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full"
        />
      </div>

      <audio
        ref={audioRef}
        src={track.audio}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};
