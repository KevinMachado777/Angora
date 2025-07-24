import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Esta ruta protegida verifica si el usuario está autenticado y tiene los permisos necesarios
const ProtectedRoute = ({ children, requiredPermission }) => {
    // Obtiene el usuario autenticado y sus permisos desde el contexto
    const { user } = useContext(AuthContext);
    const userPermissions = user?.permisos?.map((permiso) => permiso.name) || [];

    // Si el usuario no está autenticado o no tiene el permiso requerido, redirige a la página de inicio
    if (!user || (requiredPermission && requiredPermission !== "HOME" && !userPermissions.includes(requiredPermission))) {
        return <Navigate to="/home" replace />;
    }

    // Si el usuario está autenticado y tiene los permisos necesarios, renderiza los hijos
    return children;
};

export default ProtectedRoute;