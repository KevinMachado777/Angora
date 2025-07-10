import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import Layout from '../components/Layout'
import Perfil from '../pages/Perfil'
import Personal from '../pages/Personal'
import Login from '../pages/Login'

// Definicion de las rutas de la aplicacion
const AppRoutes = () => {
    
    return (
        <BrowserRouter>
            <Routes>
                {/*Redirigir siempre al login cuando inicie la aplicacion */}
                <Route path='/' element={<Navigate to="/login" />} />

                <Route exact path='/login' element={<Login />} />
                <Route exact path="/home" element={<Layout><Home /></Layout>} />
                <Route exact path="/perfil" element={<Layout><Perfil /></Layout>} />
                <Route exact path="/personal" element={<Layout><Personal /></Layout>} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes