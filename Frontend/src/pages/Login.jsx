import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';
import Angora from '../assets/images/angora.png';

const Login = () => {
    const navegacion = useNavigate();

    // Estados para controlar la visibilidad de las contraseñas y paneles
    const [mostrarContraseña, establecerMostrarContraseña] = useState(false);
    const [panelDerechoActivo, establecerPanelDerechoActivo] = useState(false);

    // Estado para el manejo de las diferentes vistas y verificación
    const [vistaActual, setVistaActual] = useState('login');

    // Estado para el código de verificación
    const [codigoVerificacion, setCodigoVerificacion] = useState(['', '', '', '', '', '']);

    // Estado para manejar errores en la verificación
    const [error, setError] = useState('');

    // Modifica estos estados al inicio del componente
    const [mostrarNuevaContraseña, establecerMostrarNuevaContraseña] = useState(false);
    const [inputNuevaContrasena, setInputNuevaContrasena] = useState('');
    const [emailRecuperar, setEmailRecuperar] = useState('');


    // Función para alternar la visibilidad de la contraseña
    const alternarVisibilidadContraseña = () => {
        establecerMostrarContraseña(!mostrarContraseña);
    };

    // También agrega esta función para limpiar todos los campos cuando se cambia de vista
    const limpiarCampos = () => {
        setInputNuevaContrasena('');
        setEmailRecuperar('');
        setCodigoVerificacion(['', '', '', '', '', '']);
        setError('');
    };


    // Manejador para el formulario de nueva contraseña
    const manejarNuevaContrasena = (e) => {
        e.preventDefault();
        setVistaActual('login');
        establecerPanelDerechoActivo(false);
        setInputNuevaContrasena('');
        setEmailRecuperar('');
    };

    // Manejadores para la navegación entre paneles
    const manejarClicRecuperar = (e) => {
        e.preventDefault();
        establecerPanelDerechoActivo(true);
        limpiarCampos();
    };

    // Manejador para volver al inicio desde el panel de verificación
    const manejarClicVolver = (e) => {
        e.preventDefault();
        establecerPanelDerechoActivo(false);
        setVistaActual('login');
        limpiarCampos();
    };

    // Manejador para el envío del formulario de login
    const manejarEnvio = (e) => {
        e.preventDefault();
        navegacion('/home');
    };

    // Manejador para iniciar el proceso de verificación
    const manejarEnvioVerificacion = (e) => {
        e.preventDefault();
        setVistaActual('verificacion');
        setCodigoVerificacion(['', '', '', '', '', '']);
        setError('');
    };

    // Manejador para el cambio de dígitos en el código de verificación
    const manejarCambioCodigo = (index, value) => {
        // Validación para permitir solo números
        if (!/^\d*$/.test(value)) return;

        if (value.length <= 1) {
            const nuevoCodigo = [...codigoVerificacion];
            // Actualiza el código de verificación en el índice correspondiente
            nuevoCodigo[index] = value;
            setCodigoVerificacion(nuevoCodigo);

            // Navegación automática al siguiente campo si el valor es válido
            if (value !== '' && index < 5) {
                // Enfoca el siguiente campo de entrada
                const nextInput = document.querySelector(`input[name=codigo-${index + 1}]`);
                if (nextInput) nextInput.focus();
            }

            // Validación automática al completar el último dígito
            if (index === 5 && value !== '') {
                // Compara el código ingresado con el código esperado (ejemplo: '123456')
                const codigoCompleto = [...nuevoCodigo.slice(0, 5), value].join('');
                if (codigoCompleto === '123456') {
                    setError('');
                    setVistaActual('nuevaContrasena');
                } else {
                    setError('Código de verificación incorrecto, verifica el código');
                    setCodigoVerificacion(['', '', '', '', '', '']);
                    // Retorno al primer campo después de error
                    setTimeout(() => {
                        const firstInput = document.querySelector('input[name=codigo-0]');
                        if (firstInput) firstInput.focus();
                    }, 100);
                }
            }
        }
    };

    // Manejador para la navegación con tecla Backspace
    const manejarKeyDown = (index, e) => {
        // Navegación hacia atrás con Backspace en campo vacío
        if (e.key === 'Backspace' && codigoVerificacion[index] === '' && index > 0) {
            const prevInput = document.querySelector(`input[name=codigo-${index - 1}]`);
            if (prevInput) {
                prevInput.focus();
            }
        }
    };

    // Funcion para evitar errores con la tabulacion
    const manejarFoco = (e) => {
        // Prevenir el comportamiento por defecto del foco
        e.preventDefault();
        // Si el foco viene del tabulador, no permitir el cambio de panel
        if (e.relatedTarget) {
            establecerPanelDerechoActivo(false);
        }
    };

    // Efecto para la animación de colores del fondo
    useEffect(() => {
        let tono1 = 200;
        let tono2 = 240;
        const intervalo = setInterval(() => {
            tono1 = (tono1 + 1) % 360;
            tono2 = (tono2 + 2) % 360;
            document.documentElement.style.setProperty('--hue1', tono1);
            document.documentElement.style.setProperty('--hue2', tono2);
        }, 50);
        return () => clearInterval(intervalo);
    }, []);

    // Función para renderizar la vista actual según el estado
    const renderizarVistaActual = () => {
        switch (vistaActual) {
            // Renderiza la vista de verificación o nueva contraseña
            case 'verificacion':
                return (
                    <div className="card-back-login verificacion-container">
                        <h2 className="login-title">Código de Verificación</h2>
                        {error && <div className="error-mensaje">{error}</div>}
                        <div className="codigo-verificacion">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    name={`codigo-${index}`}
                                    value={codigoVerificacion[index]}
                                    onChange={(e) => manejarCambioCodigo(index, e.target.value)}
                                    onKeyDown={(e) => manejarKeyDown(index, e)}
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <div className="button-group">
                            <button className="login-button" onClick={manejarClicVolver}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                );
            // Renderiza la vista de nueva contraseña
            case 'nuevaContrasena':
                return (
                    <div className="card-back-login nueva-contrasena-container">
                        <h2 className="login-title">Nueva Contraseña</h2>
                        <form onSubmit={manejarNuevaContrasena}>
                            <div className="input-group">
                                <label htmlFor="nueva-password">Nueva Contraseña</label>
                                <div className="input-with-icon">
                                    <svg className="icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    <div className="input-wrapper">
                                        <input
                                            type={mostrarNuevaContraseña ? 'text' : 'password'}
                                            id="nueva-password"
                                            value={inputNuevaContrasena}
                                            onChange={(e) => setInputNuevaContrasena(e.target.value)}
                                            required
                                            placeholder="Ingresa tu nueva contraseña"
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
                                            onClick={() => establecerMostrarNuevaContraseña(!mostrarNuevaContraseña)}
                                        >
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="login-button">Confirmar nueva contraseña</button>
                        </form>
                    </div>
                );
            default:
                // Renderiza la vista de inicio de sesión
                return (
                    <div className="card-back-login">
                        <h2 className="login-title">Recuperar Contraseña</h2>
                        <form onSubmit={manejarEnvioVerificacion}>
                            <div className="input-group">
                                <label htmlFor="recover-email">Correo electrónico</label>
                                <div className="input-with-icon">
                                    <svg className="icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    <div className="input-wrapper">
                                        <input
                                            type="email"
                                            id="recover-email"
                                            name="recover-email"
                                            value={emailRecuperar}
                                            onChange={(e) => setEmailRecuperar(e.target.value)}
                                            required
                                            placeholder="Ingresa tu correo"
                                        />

                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="login-button">Enviar Verificación</button>
                        </form>
                    </div>
                );
        }
    };

    // Renderizado del componente principal
    return (
        <div className="login-container">
            <div className="bubbles">
                {[...Array(15)].map((_, i) => (
                    <div key={i} className="bubble"></div>
                ))}
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
                    {renderizarVistaActual()}
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>¡Bienvenido de vuelta a Angora!</h1>
                            <p>Para ingresar al sistema, por favor inicia sesión con tu información personal correcta</p>
                            <button className="ghost" onClick={manejarClicVolver} onFocus={manejarFoco}>Volver al inicio</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>¡Hola, Amigo!</h1>
                            <img src={Angora} className="logo-angora" alt="Logo Angora" />
                            <p>¿Necesitas recuperar tu contraseña? Haz clic abajo</p>
                            <button className="ghost" onClick={manejarClicRecuperar} onFocus={manejarFoco}>¿Olvidaste tu contraseña?</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;