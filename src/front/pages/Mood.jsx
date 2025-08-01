import { useNavigate } from "react-router-dom";

const moods = [
  { label: "Feliz", genre: "pop", mood: "happy" },
  { label: "Triste", genre: "lofi", mood: "sad" },
  { label: "Ansioso", genre: "ambient", mood: "anxiety" },
  { label: "Enérgico", genre: "metal", mood: "energic" },
  { label: "Relajado", genre: "jazz", mood: "relax" },
  { label: "Fiesta", genre: "electronic", mood: "party" },
  { label: "Latin", genre: "latina", mood: "latin" },
  { label: "Random", genre: "", mood: "" },
];

const Mood = () => {
  const navigate = useNavigate();

  const handleSelectMood = (moodObj) => {
    navigate("/results", { state: { moodObj } });
  };

  return (
    <div className="video-background">
      <video autoPlay loop muted playsInline>
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>

      <div className="contenido-encima">
        <h2>¿Cómo te sientes hoy?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto px-4">
          {moods.map((moodObj) => (
            <button
              key={moodObj.genre}
              onClick={() => handleSelectMood(moodObj)}
              className="mood-btn">
              <span className="text-xl font-semibold">{moodObj.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Mood;
