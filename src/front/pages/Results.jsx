import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePlayer } from "../hooks/PlayerContext";

const Results = () => {
  console.log("🔥 Results re-render");
  
  const location = useLocation();
  const moodObj = location.state?.moodObj;
  const mood = moodObj?.mood;
  const label = moodObj?.label;

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { openPlayer } = usePlayer();

  useEffect(() => {
    if (!mood) return;
    fetch(`/api/music/mood/${mood}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("🗂️ Ejemplo de track:", data[0]);
        setTracks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error al traer la música:", err);
        setLoading(false);
      });
  }, [mood]);

  const handleEscuchar = (track) => {
    console.log("🎵 Abriendo Player:", track.name);
    openPlayer({
      id: track.id,
      name: track.name,
      artist: track.artist,
      audio: track.audio,
      image: track.image
    });
  };

  return (
    <div className="video-background pb-40">
      <video autoPlay loop muted playsInline>
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>

      <div className="contenido-encima p-4 text-white bg-black bg-opacity-50 min-h-screen">
        <h2 className="text-3xl font-bold text-purple-300 mb-4">
          Música sugerida según: {label}
        </h2>

        {loading ? (
          <p className="text-lg">🎧 Cargando música...</p>
        ) : tracks.length === 0 ? (
          <p className="text-lg">😔 No encontramos música para ese mood.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="bg-white bg-opacity-10 p-4 rounded-lg shadow-lg flex flex-col items-center"
              >
                <img
                  src={track.image}
                  alt={track.name}
                  className="w-full h-48 object-cover rounded mb-2"
                />
                <h3 className="text-xl font-semibold">{track.name}</h3>
                <p className="text-sm text-gray-300">{track.artist}</p>
                <button
                  onClick={() => handleEscuchar(track)}
                  className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-full"
                >
                  Escuchar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;
