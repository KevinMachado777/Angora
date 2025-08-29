import "../styles/footer.css";
import logotipo from "../assets/images/logotipo.png";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Footer = () => {
    // Obtiene el usuario autenticado desde el contexto
    const { user } = useContext(AuthContext);
    // Extrae los nombres de permisos del usuario (si existe)
    const userPermissions = user?.permisos?.map((permiso) => permiso.name) || [];

    // Lista de apartados para el mapa del sitio
    const siteMapItems = [
        { path: "/home", label: "Home", permission: "HOME" },
        { path: "/dashboard", label: "Dashboard", permission: "DASHBOARD" },
        { path: "/personal", label: "Personal", permission: "PERSONAL" },
        { path: "/inventarios", label: "Inventario",  permission: "INVENTARIOS" },
        { path: "/reportes", label: "Reportes", permission: "REPORTES" },
        { path: "/ventas", label: "Ventas", permission: "VENTAS" },
        { path: "/clientes", label: "Clientes", permission: "CLIENTES" },
        { path: "/pedidos", label: "Pedidos", permission: "PEDIDOS" },
        { path: "/proveedores", label: "Proveedores", permission: "PROVEEDORES" },
    ];

    return (
        <footer>
            <div>
                <img src={logotipo} alt="Logo Kase" width="70" />
                <p>Santa Bárbara, Antioquia - Sector Alto de los Gómez</p>
                <a href="/info-kase">¿Quiénes somos?</a>
            </div>

            <div>
                <h5>Mapa del sitio</h5>
                {/* Filtra los apartados según los permisos del usuario */}
                {siteMapItems
                    .filter((item) => !item.permission || userPermissions.includes(item.permission))
                    .map((item) => (
                        <div key={item.path}>
                            <Link to={item.path}>{item.label}</Link>
                        </div>
                    ))}
            </div>

            <div>
                <h5>Soporte</h5>
                <a href="mailto:kasedevelopmentgroup@gmail.com">Estado de servicios</a>
            </div>

            <div>
                <h5>Contáctanos</h5>
                <a href="mailto:angorasystem@gmail.com">Correo electrónico</a>
                <a href="https://wa.me/3196382919" target="_blank" rel="noreferrer">WhatsApp</a>
                <a href="https://www.facebook.com/share/1G2YsEwwSz/" target="_blank" rel="noreferrer">Facebook</a>
                <a href="https://www.instagram.com/fraganceys_eys?igsh=bnIwamplMHEwd3p1" target="_blank" rel="noreferrer">Instagram</a>
            </div>

            <div>
                <h5>Recursos</h5>
                <a href="/public/manualTecnico.pdf" download>Manual tecnico</a>
                <a href="/public/manualUsuario.pdf" download>Manual usuario</a>
            </div>

            <div className="parte-final">
                © Todos los derechos reservados 2025 Kase
            </div>
        </footer>
    );
};

export default Footer;