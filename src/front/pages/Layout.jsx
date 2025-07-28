import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import Navbar from "../components/Navbar";
import PlayerWrapper from "../components/PlayerWrapper";

const Layout = () => {
  return (
    <ScrollToTop>
      <div className="min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-grow">
          <Outlet />
        </main>
      </div>

      
      <PlayerWrapper />
    </ScrollToTop>
  );
};

export default Layout;
