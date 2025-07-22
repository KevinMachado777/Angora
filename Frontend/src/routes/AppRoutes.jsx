import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Home from '../pages/Home'
import Perfil from '../pages/Perfil'
import Personal from '../pages/Personal'
import {Inventario} from '../pages/Inventario'
import Ventas from '../pages/Ventas'
import Portafolio from '../pages/Portafolio'
import Pedidos from '../pages/Pedidos'
import Proveedores from "../pages/Proveedores"
import Dashboard from "../pages/Dashboard"


// Definicion de las rutas de la aplicacion
const AppRoutes = () => {
    
    return (
        <BrowserRouter>
            <Routes>
                {/*Redirigir siempre al login cuando inicie la aplicacion */}
                <Route path='/' element={<Navigate to="/login" />} />
                <Route exact path='/login' element={<Login />} />
                <Route exact path="/home" element={<Layout><Home /></Layout>} />
                <Route exact path="/dashboard" element = {<Layout><Dashboard /></Layout>} />
                <Route exact path="/perfil" element={<Layout><Perfil /></Layout>} />
                <Route exact path="/personal" element={<Layout><Personal /></Layout>} />
                <Route exact path="/inventarios" element={<Layout><Inventario /></Layout>} />
                <Route exact path="/ventas" element={<Layout><Ventas /></Layout>} />
                <Route exact path="/clientes" element={<Layout><Portafolio /></Layout>} />
                <Route exact path="/pedidos" element={<Layout><Pedidos /></Layout>} />     
                <Route  exact path="/proveedores" element={<Layout><Proveedores /></Layout>} />    
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes