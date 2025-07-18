import { useNavigate } from "react-router-dom";

const moods = [
  { label: "Feliz", genre: "pop"},
  { label: "Triste", genre: "lofi"},
  { label: "Ansioso", genre: "ambient"},
  { label: "Enérgico", genre: "metal"},
  { label: "Relajado", genre: "jazz"},
  { label: "Fiesta", genre: "electronic"},
  { label: "Latin", genre: "latina"},
  { label: "Random", genre: ""},
];

const Mood = () => {
  const navigate = useNavigate();

  const handleSelectMood = (label) => {
    navigate("/results", { state: { label } });
  };

  return (
    <div className="video-background">
      <video autoPlay loop muted playsInline>
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>

      <div className="contenido-encima">
        <h2>¿Cómo te sientes hoy?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {moods.map(({ label, genre}) => (
            <button
              key={genre}
              onClick={() => handleSelectMood(label)}
              className="w-48 h-48 flex flex-col justify-center items-center border-2 border-white rounded-xl shadow-md hover:bg-white/10 transition text-black"
            >
            
              <span className="text-xl font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Mood;
