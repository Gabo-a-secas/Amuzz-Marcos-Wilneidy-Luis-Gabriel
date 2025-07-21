import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './navBar-Modal.css';
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './hooks/useGlobalReducer';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';
import Mood from './pages/Mood';
import Results from './pages/Results';
import Navbar from './components/Navbar';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>No encontrado 😢</h1>}>

     
      <Route index element={
        <>
          <Navbar />
          <Home />
        </>
      } />

      
      <Route path="mood" element={
        <>
          <Navbar />
          <Mood />
        </>
      } />

      
      <Route path="results" element={
        <>
          <Navbar />
          <Results />
        </>
      } />

    </Route>
  )
);

const Main = () => {
  return (
    <React.StrictMode>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Main />);