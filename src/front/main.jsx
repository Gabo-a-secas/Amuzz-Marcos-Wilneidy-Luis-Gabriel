import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './navBar-Modal.css'
import { RouterProvider } from 'react-router-dom';
import { StoreProvider } from './hooks/useGlobalReducer';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';

// Importación de componentes principales
import Layout from './pages/Layout';
import Home from './pages/Home';
import Mood from './pages/Mood';
import Results from './pages/Results';  // Puedes renombrar como Results si prefieres
import Navbar from './components/Navbar';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>No encontrado 😢</h1>}>

      {/* Componente visual persistente como la Navbar */}
      <Route index element={
        <>
          <Navbar />
          <Home />
        </>
      } />

      {/* Página para elegir estado de ánimo */}
      <Route path="mood" element={
        <>
          <Navbar />
          <Mood />
        </>
      } />

      {/* Página que muestra resultados sugeridos */}
      <Route path="results" element={
        <>
          <Navbar />
          <Results />
        </>
      } />

    </Route>
  )
);
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import './index.css'
// import './navBar-Modal.css'
// import { RouterProvider } from "react-router-dom"
// import { router } from "./routes"
// import { StoreProvider } from './hooks/useGlobalReducer'
// import { BackendURL } from './components/BackendURL'
// import Home from './pages/Home'
// import { Navbar } from './components/Navbar' // Importa el Navbar
// import { BrowserRouter } from 'react-router-dom' // Importa BrowserRouter

// const Main = () => {
//   return (
//     <React.StrictMode>
//       <StoreProvider>
//         <RouterProvider router={router} />
//       </StoreProvider>
//     </React.StrictMode>
//   );
// };

// ReactDOM.createRoot(document.getElementById('root')).render(<Main />);
