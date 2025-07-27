import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import PlayerTestWrapper from "../components/PlayerTestWrapper";

const Layout = () => {
  return (
    <ScrollToTop>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-grow">
          <Outlet />
        </main>
      </div>

      
      <PlayerTestWrapper />
    </ScrollToTop>
  );
};

export default Layout;
