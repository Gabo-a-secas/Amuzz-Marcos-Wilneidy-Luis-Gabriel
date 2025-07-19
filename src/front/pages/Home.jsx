import { useNavigate } from "react-router-dom";
import { Footer } from "../components/Footer";

const Home = () => {

  const navigate = useNavigate();

  return (
    <div className="relative video-background">
      <video autoPlay loop muted playsInline>
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>
      <div className="contenido-encima">
        <img src="/amuzz_logo.png" alt="amuzz_logo"/>
        <h1>AMUZZ</h1>
        <button
        onClick={() => navigate("/Mood")}
        className="bg-white text-purple-700 px-6 py-3 rounded-full shadow-lg hover:bg-purple-100 transition"
      >
        Elige tu mood
      </button>
      </div>
    </div>
  );
};

export default Home;