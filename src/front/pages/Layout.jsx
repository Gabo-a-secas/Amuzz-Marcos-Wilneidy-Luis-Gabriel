import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { Player } from "../components/Player";
import useGlobalReducer from "../hooks/useGlobalReducer";

const Layout = () => {
  const { store } = useGlobalReducer();

  return (
    <ScrollToTop>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        {/* Contenido principal con espacio inferior para el Player */}
        <main className="flex-grow" style={{ paddingBottom: store.currentTrack ? '110px' : '0' }}>
          <Outlet />
        </main>

        <Footer />
      </div>

      {/* Player fijo */}
      {store.currentTrack && (
        <div className="fixed-player">
          <Player track={store.currentTrack} />
        </div>
      )}
    </ScrollToTop>
  );
};

export default Layout;
