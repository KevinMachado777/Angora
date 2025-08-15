import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/Layout";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Perfil from "../pages/Perfil";
import Personal from "../pages/Personal";
import Inventario from "../pages/Inventario";
import Ventas from "../pages/Ventas";
import Portafolio from "../pages/Portafolio";
import Pedidos from "../pages/Pedidos";
import Reportes from "../pages/Reportes";
import Proveedores from "../pages/Proveedores";
import Dashboard from "../pages/Dashboard";
import ProtectedRoute from "../routes/ProtectedRoute";
import NotFound from "../pages/NotFound"; // Pagina para rutas no encontradas

const AppRoutes = () => {
    return (
        <Routes>
            {/* Redirigir siempre al login cuando inicie la aplicación */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route exact path="/login" element={<Login />} />
            <Route
                exact
                path="/home"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Home />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/dashboard"
                element={
                    <ProtectedRoute requiredPermission="DASHBOARD">
                        <Layout>
                            <Dashboard />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/perfil"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <Perfil />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/personal"
                element={
                    <ProtectedRoute requiredPermission="PERSONAL">
                        <Layout>
                            <Personal />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/inventarios"
                element={
                    <ProtectedRoute requiredPermission="INVENTARIOS">
                        <Layout>
                            <Inventario />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/ventas"
                element={
                    <ProtectedRoute requiredPermission="VENTAS">
                        <Layout>
                            <Ventas />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/clientes"
                element={
                    <ProtectedRoute requiredPermission="CLIENTES">
                        <Layout>
                            <Portafolio />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/pedidos"
                element={
                    <ProtectedRoute requiredPermission="PEDIDOS">
                        <Layout>
                            <Pedidos />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/reportes"
                element={
                    <ProtectedRoute requiredPermission="REPORTES">
                        <Layout>
                            <Reportes />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                exact
                path="/proveedores"
                element={
                    <ProtectedRoute requiredPermission="PROVEEDORES">
                        <Layout>
                            <Proveedores />
                        </Layout>
                    </ProtectedRoute>
                }
            />
            {/* Ruta wildcard para 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;