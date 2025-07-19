import { useLocation } from "react-router-dom";

const Results = () => {
  const location = useLocation();
  const label = location.state?.label;

  return (
    <div className="video-background">
      <video autoPlay loop muted playsInline>
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>

    <div className="contenido-encima">
      <h2 className="text-3xl font-bold text-purple-700 mb-4">
        Aquí hay música que te puede gustar según: {label}
      </h2>
      {/* AQUI VA LA INFO DE API GABO//MARCOS */}
    </div>
    </div>
  );
};

export default Results;
