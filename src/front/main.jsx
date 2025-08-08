import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './navBar-Modal.css';
import './player.css';
import 'animate.css';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './hooks/useGlobalReducer';
import { PlayerProvider } from './hooks/PlayerContext';
import { NotificationProvider } from './NotificationProvider';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Mood from './pages/Mood';
import Results from './pages/Results';
import VerifyEmail from './pages/VerifyEmail';
import Playlists from './components/Playlists';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found 😢</h1>}>
      <Route index element={<Home />} />
      <Route path="mood" element={<Mood />} />
      <Route path="playlists" element={<Playlists />} />
      <Route path="results" element={<Results />} />
      <Route path="verify-email" element={<VerifyEmail />} />
    </Route>
  )
);

const Main = () => {
  return (
    <NotificationProvider>
      <PlayerProvider>
        <StoreProvider>
          <RouterProvider router={router} />
        </StoreProvider>
      </PlayerProvider>
    </NotificationProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);