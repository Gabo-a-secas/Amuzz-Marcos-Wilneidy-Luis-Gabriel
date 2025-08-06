import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
} from "react-router-dom";
import  { Layout } from "./pages/Layout";
import   Home   from "./pages/Home";
import   Mood  from "./pages/Mood";
import Results from "./pages/Results";
import Playlists from "./components/Playlists";
import VerifyEmail from "./pages/VerifyEmail"; 


export const router = createBrowserRouter(
    createRoutesFromElements(
    
      <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        <Route index element={<Home />} />
        <Route path="playlists" element={<Playlists />} />
        {/* <Route path="mood" element={<Mood />} />  */}
        <Route path="playlists" element={<Playlists />} />
        <Route path="results" element={<Results />} />
        <Route path="verify-email" element={<VerifyEmail />} /> 
        <Route path="test" element={<div>¡Test funcionando!</div>} />

      </Route>
    )
);

