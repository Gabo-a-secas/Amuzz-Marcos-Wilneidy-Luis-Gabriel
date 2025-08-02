import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

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
        <button
          onClick={() => navigate("/Mood")}
          className="mood-btn mt-20"
        >
          Elige tu mood
        </button>
      </div>
    </div>
  );
};

export default Home;
