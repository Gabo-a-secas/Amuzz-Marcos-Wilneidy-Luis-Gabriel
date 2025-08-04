import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const moods = [
    { label: "Feliz", genre: "pop", mood: "happy" },
    { label: "Triste", genre: "lofi", mood: "sad" },
    { label: "Ansioso", genre: "ambient", mood: "anxiety" },
    { label: "Enérgico", genre: "metal", mood: "energic" },
    { label: "Relajado", genre: "jazz", mood: "relax" },
    { label: "Fiesta", genre: "electronic", mood: "party" },
    { label: "Latin", genre: "latina", mood: "latin" },
    { label: "Random", genre: "random", mood: "random" },
  ];
   const handleSelectMood = (moodObj) => {
    navigate("/results", { state: { moodObj } });
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/script.js";
    script.async = true;

    const wrapper = document.getElementById("three-wrapper");
    if (wrapper) {
      const existing = wrapper.querySelector("script[src='/script.js']");
      if (!existing) wrapper.appendChild(script);
    }

    return () => {
      const canvas = wrapper?.querySelector("canvas");
      if (canvas) canvas.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>

      <div
        id="three-wrapper"
        className="absolute top-0 left-0 w-full h-full z-1 pointer-events-none"
      />

      <div className="contenido-encima z-10 pointer-events-auto">
        <img className="home-logo" src="/amuzz_logo.png" alt="amuzz_logo" />
        {/* <button
          onClick={() => navigate("/Mood")}
          className="mood-btn mt-20"
        >
          Elige tu mood
        </button> */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto px-4">
          {moods.map((m) => (
            <button
              key={m.genre || m.label}
              onClick={() => handleSelectMood(m)}
              className="mood-btn"
            >
              <span className="text-xl font-semibold">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
