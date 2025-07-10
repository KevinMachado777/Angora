import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';

const Login = () => {
    const navegacion = useNavigate(); // Hook para navegar entre rutas, usado para redirigir a /home

    // Estado para controlar si la contraseña es visible o no
    const [mostrarContraseña, establecerMostrarContraseña] = useState(false);

    // Estado para controlar si el panel derecho (recuperación) está activo
    const [panelDerechoActivo, establecerPanelDerechoActivo] = useState(false);

    // Función para alternar la visibilidad de la contraseña
    const alternarVisibilidadContraseña = () => {
        establecerMostrarContraseña(!mostrarContraseña);
    };

    // Función que se ejecuta al hacer clic en "Olvidaste tu contraseña" para mostrar el panel de recuperación
    const manejarClicRecuperar = (e) => {
        e.preventDefault();
        establecerPanelDerechoActivo(true);
    };

    // Función que se ejecuta al hacer clic en "Volver al inicio" para regresar al panel de inicio de sesión
    const manejarClicVolver = (e) => {
        e.preventDefault();
        establecerPanelDerechoActivo(false);
    };

    // Función que maneja el envío del formulario de inicio de sesión
    const manejarEnvio = (e) => {
        e.preventDefault();
        navegacion('/home');
    };

    // Efecto para animar los colores neón de los bordes y el botón
    useEffect(() => {
        let tono1 = 200; // Tono inicial ajustado a la paleta azul
        let tono2 = 240;
        const intervalo = setInterval(() => {
            tono1 = (tono1 + 1) % 360;
            tono2 = (tono2 + 2) % 360;
            document.documentElement.style.setProperty('--hue1', tono1);
            document.documentElement.style.setProperty('--hue2', tono2);
        }, 50);
        return () => clearInterval(intervalo); // Limpia el intervalo al desmontar el componente
    }, []);

    return (
        <div className="login-container">
            <div className="bubbles">
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
                <div className="bubble"></div>
            </div>

            <div className={`login-form ${panelDerechoActivo ? 'right-panel-active' : ''}`}>
                <div className="form-container sign-in-container">
                    <div className="card-front-login">
                        <h2 className="login-title">Fraganc'eys</h2>
                        <form onSubmit={manejarEnvio}>
                            <div className="input-group">
                                <label htmlFor="correo">Correo electrónico</label>
                                <div className="input-with-icon">
                                    <svg className="icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <div className="input-wrapper">
                                        <input type="email" id="correo" name="correo" required placeholder="Ingresa tu correo" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="input-group">
                                <label htmlFor="password">Contraseña</label>
                                <div className="input-with-icon">
                                    <svg className="icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <div className="input-wrapper">
                                        <input
                                            type={mostrarContraseña ? 'text' : 'password'}
                                            id="password"
                                            name="password"
                                            required
                                            placeholder="Ingresa tu contraseña"
                                        />
                                        <svg
                                            className="input-icon eye-icon"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            onClick={alternarVisibilidadContraseña}
                                        >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="login-button">Iniciar Sesión</button>
                        </form>
                    </div>
                </div>

                <div className="form-container sign-up-container">
                    <div className="card-back-login">
                        <h2 className="login-title">Recuperar Contraseña</h2>
                        <form>
                            <div className="input-group">
                                <label htmlFor="recover-email">Correo electrónico</label>
                                <div className="input-with-icon">
                                    <svg className="icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <div className="input-wrapper">
                                        <input type="email" id="recover-email" name="recover-email" required placeholder="Ingresa tu correo" />
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="login-button">Enviar Verificación</button>
                        </form>
                    </div>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>¡Bienvenido de vuelta a Angora!</h1>
                            <p>Para ingresar al sistema, por favor inicia sesión con tu información personal correcta</p>
                            <button className="ghost" onClick={manejarClicVolver}>Volver al inicio</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>¡Hola, Amigo!</h1>
                            <p>¿Necesitas recuperar tu contraseña? Haz clic abajo</p>
                            <button className="ghost" onClick={manejarClicRecuperar}>¿Olvidaste tu contraseña?</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;