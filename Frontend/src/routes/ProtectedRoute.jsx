// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredPermission }) => {
    const { user } = useContext(AuthContext); // Eliminamos loading
    const userPermissions = user?.permisos?.map((permiso) => permiso.name) || [];

    // Si no hay usuario autenticado, redirige a /login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Si hay usuario pero no tiene el permiso requerido (y no es HOME), redirige a /home
    if (requiredPermission && requiredPermission !== "HOME" && !userPermissions.includes(requiredPermission)) {
        return <Navigate to="/home" replace />;
    }

    // Si el usuario está autenticado y tiene los permisos, renderiza los hijos
    return children;
};

export default ProtectedRoute;