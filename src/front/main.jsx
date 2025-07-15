import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom"
import { router } from "./routes"
import { StoreProvider } from './hooks/useGlobalReducer'
import { BackendURL } from './components/BackendURL'
import Home from './pages/Home'
import { Navbar } from './components/Navbar' // Importa el Navbar
import { BrowserRouter } from 'react-router-dom' // Importa BrowserRouter

const Main = () => {
    
    if(!import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL == "") {
        return (
            <React.StrictMode>
                <BrowserRouter>
                    <Navbar /> {/* Agrega el Navbar aquí */}
                    <Home />
                </BrowserRouter>
            </React.StrictMode>
        );
    }
    
    return (
        <React.StrictMode>  
            <StoreProvider> 
                <RouterProvider router={router} />
            </StoreProvider>
        </React.StrictMode>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />)