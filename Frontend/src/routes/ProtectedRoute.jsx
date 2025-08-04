// src/routes/ProtectedRoute.jsx (versión con spinner)
import { Navigate } from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import "../styles/spiner.css"

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user, loading } = useContext(AuthContext);

    useEffect(() => {
        if (loading) return;

        if (!user) {
            console.log("No hay usuario autenticado, redirigiendo a /login");
        } else {
            const userPermissions = user?.permisos?.map((permiso) => permiso.name.toUpperCase()) || [];
            const requiredPerm = requiredPermission?.toUpperCase();

            console.log("Usuario:", user);
            console.log("Permisos del usuario:", userPermissions);
            console.log("Permiso requerido:", requiredPerm);

            if (requiredPerm && requiredPerm !== "HOME" && !userPermissions.includes(requiredPerm)) {
                console.log(`Permiso ${requiredPerm} no encontrado, redirigiendo a /home`);
            }
        }
    }, [user, loading, requiredPermission]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const userPermissions = user?.permisos?.map((permiso) => permiso.name.toUpperCase()) || [];
    const requiredPerm = requiredPermission?.toUpperCase();
    if (requiredPerm && requiredPerm !== "HOME" && !userPermissions.includes(requiredPerm)) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute;