import "../styles/header.css";
import userImg from "../assets/icons/user.png";
import logo_angora from "../assets/icons/angora.png";
import logoutImg from "../assets/icons/logout.png";
import fraganceys from "../assets/images/Logo_de_la_empresa.png";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Header = ({ onToggleSidebar }) => {
    // Obtiene el usuario autenticado desde el contexto  
  const { signOut, user } = useContext(AuthContext);

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    try {
      // Llama a la función de cierre de sesión del contexto
      await signOut();
    } catch (error) {
      console.error("Error durante el logout:", error);
    }
  };

  return (
    <header>
      <div className="div-header">
        <button className="menu-toggle" onClick={onToggleSidebar}>
          <i className="bi bi-list"></i>
        </button>

        <img src={fraganceys} alt="fraganceys" className="fraganceys" />

        <div className="d-none d-md-block">
          <img src={logo_angora} alt="logo_angora" width="90" />
        </div>

        <div className="user-section">
          <div className="user-info">
            <p className="mb-0 text-white d-none d-sm-block">
              <strong>{user?.nombre} {user?.apellido}</strong>
            </p>
            <Link to="/perfil">
              <img src={userImg} alt="user" width="35" />
            </Link>
          </div>

          <img
            src={logoutImg}
            alt="logout"
            width="30"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;