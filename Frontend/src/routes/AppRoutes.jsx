import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import Layout from '../components/Layout'

// Definicion de las rutas de la aplicacion
const AppRoutes = () => {
    
    return (
        <BrowserRouter>
            <Routes>
                <Route exact path="/" element={<Layout><Home /></Layout>} />
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes