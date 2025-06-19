import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import Layout from '../components/Layout'
import Perfil from '../pages/Perfil'
import Personal from '../pages/Personal'

// Definicion de las rutas de la aplicacion
const AppRoutes = () => {
    
    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/" element={<Layout><Home /></Layout>} />
                <Route exact path="/perfil" element={<Layout><Perfil /></Layout>} />
                <Route exact path="/personal" element={<Layout><Personal /></Layout>} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes