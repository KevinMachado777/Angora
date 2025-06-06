// Importación de estilos y recursos
import "../styles/sideBar.css"
import homoIcon from "../assets/icons/home.ico"
import inventarioIcon from "../assets/icons/inventario.ico"
import pedidosIcon from "../assets/icons/pedidos.ico"
import personalIcon from "../assets/icons/personal.ico"
import reporteIcon from "../assets/icons/reportes.ico"
import ventasIcon from "../assets/icons/ventas.ico"
import portafolioIcon from "../assets/icons/portafolio.ico"
import proveedorIcon from "../assets/icons/provedores.ico" // corregida ruta
import { Link } from "react-router-dom"

const SideBar = () => {
    return (
        <div className="sidebar py-3">
            <ul className="nav flex-column">
                <li>
                    <Link to="/" className="nav-link">
                    <p>Home</p>
                        <img src={homoIcon} alt="Inicio" />
                        
                    </Link>
                </li>
                <li>
                    <Link to="/personal" className="nav-link">
                        <p>Personal</p>
                        <img src={personalIcon} alt="Personal" />
                    </Link>
                </li>
                <li>
                    <Link to="/inventarios" className="nav-link">
                        <p>Inventario</p>
                        <img src={inventarioIcon} alt="Inventarios" />
                    </Link>
                </li>
                <li>
                    <Link to="/reportes" className="nav-link">
                        <p>Reportes</p>
                        <img src={reporteIcon} alt="Reportes" />
                    </Link>
                </li>
                <li>
                    <Link to="/ventas" className="nav-link">
                        <p>Ventans</p>
                        <img src={ventasIcon} alt="Ventas" />
                    </Link>
                </li>
                <li>
                    <Link to="/clientes" className="nav-link">
                        <p>Clientes</p>
                        <img src={portafolioIcon} alt="Clientes" />
                    </Link>
                </li>
                <li>
                    <Link to="/pedidos" className="nav-link">
                        <p>Pedidos</p>
                        <img src={pedidosIcon} alt="Pedidos" />
                    </Link>
                </li>
                <li>
                    <Link to="/proveedores" className="nav-link">
                        <p>Proveedores</p>
                        <img src={proveedorIcon} alt="Proveedores" />
                    </Link>
                </li>
            </ul>
        </div>
    )
}

export default SideBar
