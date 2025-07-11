import "../styles/header.css";
import user from "../assets/icons/user.png";
import logo_angora from "../assets/icons/angora.png";
import logout from "../assets/icons/logout.png";
import fraganceys from "../assets/images/Logo_de_la_empresa.png";
import { Link } from 'react-router-dom';

const Header = ({ onToggleSidebar }) => {
    return (
        <header>
            <div className='div-header'>
                <button className="menu-toggle" onClick={onToggleSidebar}>
                    <i className="bi bi-list"></i>
                </button>
                
                <img src={fraganceys} alt='fraganceys' className='fraganceys' />
                
                <div className="d-none d-md-block">
                    <img src={logo_angora} alt="logo_angora" width="90" />
                </div>

                <div className="user-section">
                    <div className="user-info">
                        <p className="mb-0 text-white d-none d-sm-block">Kevin Andrés Machado Rueda</p>
                        <Link to={"/perfil"}>
                            <img src={user} alt="user" width="35" />
                        </Link>
                    </div>
                    <Link to={"/login"}>
                        <img src={logout} alt="logout" width="30" />
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default Header;