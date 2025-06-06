import React from 'react';
import "../styles/header.css"
import user from "../assets/icons/user.png"
import logo_angora from "../assets/icons/angora.png"
import logout from "../assets/icons/logout.png"
import fraganceys from "../assets/images/Logo_de_la_empresa.png"
import { Link } from 'react-router-dom';

const Header = () => {

    return (
        // Contenedor del header, fijo al hacer scroll
        <header className="d-flex flex-wrap align-items-center justify-content-center 
        justify-content-md-between py-3 mb-4 border-bottom">

            <div className='div-header'>
                
                <img src={fraganceys} alt='fraganceys' width={"380"} className='fraganceys'></img>
                

                {/*Logo de angora */}
                <div>
                    <img src={logo_angora} alt="logo_angora" width={"90 px"}/>
                </div>

                {/*Nombre e icono para ir al perfil del usuario */}
                <div className="d-flex align-items-center gap-5">
                    <div className="d-flex align-items-center gap-1">
                        <p className="mb-0 text-white">Kevin Andrés Machado Rueda</p>
                        <Link to={"/perfil"}>
                            <img src={user} alt="user" width="35px" />
                        </Link>
                    </div>

                    {/*Boton para cerra la sesion */}
                    <Link to={"/inicio-sesion"}>
                        <img src={logout} alt="logout" width="30px" />
                    </Link>
                </div>
            </div>
        </header>
    );
};

// Retorna el header
export default Header;