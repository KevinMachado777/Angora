import "../styles/sideBar.css";
import homoIcon from "../assets/icons/home.ico";
import inventarioIcon from "../assets/icons/inventario.ico";
import pedidosIcon from "../assets/icons/pedidos.ico";
import personalIcon from "../assets/icons/personal.ico";
import reporteIcon from "../assets/icons/reportes.ico";
import ventasIcon from "../assets/icons/ventas.ico";
import portafolioIcon from "../assets/icons/portafolio.ico";
import proveedorIcon from "../assets/icons/provedores.ico";
import { Link } from "react-router-dom";

const SideBar = ({ isOpen, onClose }) => {
    return (
        <>
            <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
            <div className={`sidebar py-3 ${isOpen ? 'open' : ''}`}>
                <div className="d-md-none text-end p-2">
                    <button className="btn-close btn-close-white" onClick={onClose}></button>
                </div>
                <div className="sidebar-content">
                    <ul className="nav flex-column">
                        <li>
                            <Link to="/home" className="nav-link" onClick={onClose}>
                                <p>Home</p>
                                <img src={homoIcon} alt="Inicio" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/personal" className="nav-link" onClick={onClose}>
                                <p>Personal</p>
                                <img src={personalIcon} alt="Personal" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/inventarios" className="nav-link" onClick={onClose}>
                                <p>Inventario</p>
                                <img src={inventarioIcon} alt="Inventarios" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/reportes" className="nav-link" onClick={onClose}>
                                <p>Reportes</p>
                                <img src={reporteIcon} alt="Reportes" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/ventas" className="nav-link" onClick={onClose}>
                                <p>Ventas</p>
                                <img src={ventasIcon} alt="Ventas" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/clientes" className="nav-link" onClick={onClose}>
                                <p>Clientes</p>
                                <img src={portafolioIcon} alt="Clientes" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/pedidos" className="nav-link" onClick={onClose}>
                                <p>Pedidos</p>
                                <img src={pedidosIcon} alt="Pedidos" />
                            </Link>
                        </li>
                        <li>
                            <Link to="/proveedores" className="nav-link" onClick={onClose}>
                                <p>Proveedores</p>
                                <img src={proveedorIcon} alt="Proveedores" />
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
};

export default SideBar;