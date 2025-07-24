import "../styles/sideBar.css";
import homoIcon from "../assets/icons/home.ico";
import inventarioIcon from "../assets/icons/inventario.ico";
import pedidosIcon from "../assets/icons/pedidos.ico";
import personalIcon from "../assets/icons/personal.ico";
import reporteIcon from "../assets/icons/reportes.ico";
import ventasIcon from "../assets/icons/ventas.ico";
import portafolioIcon from "../assets/icons/portafolio.ico";
import proveedorIcon from "../assets/icons/provedores.ico";
import DashboardIcon from "../assets/icons/dashboard.png";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext"

// Definición de los apartados con sus rutas y permisos asociados
const sidebarItems = [
    { path: "/dashboard", label: "Dashboard", icon: DashboardIcon, permission: "DASHBOARD" },
    { path: "/personal", label: "Personal", icon: personalIcon, permission: "PERSONAL" },
    { path: "/inventarios", label: "Inventario", icon: inventarioIcon, permission: "INVENTARIOS" },
    { path: "/reportes", label: "Reportes", icon: reporteIcon, permission: "REPORTES" },
    { path: "/ventas", label: "Ventas", icon: ventasIcon, permission: "VENTAS" },
    { path: "/clientes", label: "Clientes", icon: portafolioIcon, permission: "CLIENTES" },
    { path: "/pedidos", label: "Pedidos", icon: pedidosIcon, permission: "PEDIDOS" },
    { path: "/proveedores", label: "Proveedores", icon: proveedorIcon, permission: "PROVEEDORES" },
];

const SideBar = ({ isOpen, onClose }) => {
    // Obtiene el usuario autenticado desde el contexto
    const { user } = useContext(AuthContext);

    // Extrae los nombres de permisos del usuario (si existe)
    const userPermissions = user?.permisos?.map((permiso) => permiso.name) || [];

    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? "show" : ""}`} onClick={onClose}></div>
            <div className={`sidebar py-3 ${isOpen ? "open" : ""}`}>
                <div className="d-md-none text-end p-2">
                    <button className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="sidebar-content">
                    <ul className="nav flex-column">
                        {/* Muestra siempre el apartado Home */}
                        <li>
                            <Link to="/home" className="nav-link" onClick={onClose}>
                                <p>Home</p>
                                <img src={homoIcon} alt="Inicio" />
                            </Link>
                        </li>
                        {/* Renderiza los demás apartados según los permisos */}
                        {sidebarItems
                            .filter((item) => item.permission === "HOME" || userPermissions.includes(item.permission))
                            .map((item) => (
                                <li key={item.path}>
                                    <Link to={item.path} className="nav-link" onClick={onClose}>
                                        <p>{item.label}</p>
                                        <img src={item.icon} alt={item.label} />
                                    </Link>
                                </li>
                            ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default SideBar;