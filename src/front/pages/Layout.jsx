import { Outlet, useLocation } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import PlayerWrapper from "../components/PlayerWrapper";

const Layout = () => {
  const location = useLocation();

  const hideNavbar = location.pathname.startsWith("/results");

  return (
     <ScrollToTop>
      <div className="min-h-screen flex flex-col relative">
        {/* Z-index 10 to ensure navbar goes above outlet content */}
        <Navbar />
        
        {/* Main content, grows to fill space above player */}
        <main className="flex-grow relative z-0">
          <Outlet />
        </main>

        {/* Player fixed to bottom, above everything */}
        <PlayerWrapper />
      </div>
    </ScrollToTop>
  );
};

export default Layout;
