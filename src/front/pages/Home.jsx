import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const moods = [
    { label: "Joyride", genre: "pop", mood: "happy" },
    { label: "Lo-fi", genre: "lofi", mood: "sad" },
    { label: "On Edge", genre: "ambient", mood: "anxiety" },
    { label: "Power Boost", genre: "metal", mood: "energic" },
    { label: "Stay Mellow", genre: "jazz", mood: "relax" },
    { label: "Groove", genre: "electronic", mood: "party" },
    { label: "Son Latino", genre: "latina", mood: "latin" },
    { label: "Shuffle", genre: "random", mood: "random" },
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
        <div>
          <h4>Ready to set the mood?</h4>
        </div>
        <div className="grid">
          {moods.map((m) => (
            <button
              key={m.genre || m.label}
              onClick={() => handleSelectMood(m)}
              className="mood-btn animate__animated animate__fadeInUp"
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
