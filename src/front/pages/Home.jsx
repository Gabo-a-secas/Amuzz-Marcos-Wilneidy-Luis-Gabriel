const Home = () => {
  return (
    <div className="video-background">
      <video autoPlay loop muted playsInline>
        <source src="/fondo.mp4" type="video/mp4" />
        Tu navegador no soporta video.
      </video>
      <div className="contenido-encima">
        <h1>AMUZZ</h1>
      </div>
    </div>
  );
};

export default Home;