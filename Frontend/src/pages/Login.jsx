import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/login.css';


const Login = () => {
    const navegacion = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleRecoverClick = (e) => {
        e.preventDefault();
        setIsFlipped(true);
    };

    const handleBackClick = (e) => {
        e.preventDefault();
        setIsFlipped(false);
    };

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

            <div className={`login-form ${isFlipped ? 'girar' : ''}`}>
                <div className="card-front-login">
                    <h2 className="login-title">Fraganc'eys</h2>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        navegacion('/home');
                    }}>
                        <div className="input-group">
                            <label htmlFor="correo">Correo electrónico</label>
                            <div className="input-with-icon">
                                <svg className="icon-left" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <div className="input-wrapper">
                                    <input type="email" id="correo" name="correo" required placeholder='Ingrese tu correo' />
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
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        required
                                        placeholder='Ingresa tu contraseña'
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
                                        onClick={togglePasswordVisibility}
                                    >
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                        <circle cx="12" cy="12" r="3"></circle>
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="login-button">Iniciar Sesión</button>

                        <div className="recover-link">
                            <a href="/recover-password" className="recover-text" onClick={handleRecoverClick}>
                                ¿Olvidaste tu contraseña? Recupérala aquí
                            </a>
                        </div>
                    </form>
                </div>

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

                        <div className="recover-link">
                            <a href="/" className="recover-text" onClick={handleBackClick}>
                                Volver al inicio
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>

    );
};

export default Login;