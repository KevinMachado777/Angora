import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import Layout from '../components/Layout'
import Perfil from '../pages/Perfil'
import Personal from '../pages/Personal'
import Ventas from "../pages/Ventas"
import Portafolio from "../pages/Portafolio"
import {Inventario} from "../pages/Inventario"
import Proveedores from '../pages/Proveedores'
import Ordenes from "../pages/Ordenes"

// Definicion de las rutas de la aplicacion
const AppRoutes = () => {
    
    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/" element={<Layout><Home /></Layout>} />
                <Route exact path="/perfil" element={<Layout><Perfil /></Layout>} />
                <Route exact path="/personal" element={<Layout><Personal /></Layout>} />
                <Route exact path= "/ventas" element= {<Layout><Ventas /></Layout>} />
                <Route exact path= "/clientes" element= {<Layout><Portafolio /></Layout>} />
                <Route exact path= "/inventarios" element = {<Layout><Inventario /></Layout>} />
                <Route exact path = "/proveedores" element = {<Layout><Proveedores /></Layout>} />
                <Route exact path = "/ordenes" element = {<Layout><Ordenes /></Layout>} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes