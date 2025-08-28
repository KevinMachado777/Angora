import React, { useState, useEffect } from 'react';
import '../styles/modalContrasena.css';
import api from '../api/axiosInstance';

const ModalContrasena = ({ isOpen, onClose, user, setUser }) => {
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const [mostrarNuevaContrasena, establecerMostrarNuevaContrasena] = useState(false);

    // Bloquear/desbloquear scroll del body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        // Limpieza al desmontar
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    const validarContrasena = (contrasena) => {
        const minLength = contrasena.length >= 8;
        const hasUpperCase = /[A-Z]/.test(contrasena);
        const hasLowerCase = /[a-z]/.test(contrasena);
        const hasNumber = /\d/.test(contrasena);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(contrasena);

        if (!minLength) return "La contraseña debe tener al menos 8 caracteres.";
        if (!hasUpperCase) return "La contraseña debe contener al menos una letra mayúscula.";
        if (!hasLowerCase) return "La contraseña debe contener al menos una letra minúscula.";
        if (!hasNumber) return "La contraseña debe contener al menos un número.";
        if (!hasSpecialChar) return "La contraseña debe contener al menos un carácter especial.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        const errorValidacion = validarContrasena(nuevaContrasena);
        if (errorValidacion) {
            setError(errorValidacion);
            return;
        }

        setCargando(true);
        try {
            const cambiarPasswordDTO = { correo: user.correo, password: nuevaContrasena };
            const response = await api.post(`/passwordReset/cambiar`, cambiarPasswordDTO);

            if (response.status === 200 && response.data) {
                setUser({ ...response.data, primerLogin: false });
                onClose(); // Cierra el modal
                window.location.reload(); // Recarga la página
            } else {
                setError(response.data.message || 'Error al cambiar la contraseña. Intenta de nuevo.');
            }
        } catch (err) {
            console.error("Error al cambiar la contraseña:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('Ocurrió un error inesperado al cambiar la contraseña.');
            }
        } finally {
            setCargando(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="change-password-modal-content">
                    <div className="change-password-header">
                        <i className="bi bi-key-fill change-password-icon"></i>
                        <h2>Cambiar Contraseña</h2>
                    </div>
                    <div className="change-password-body">
                        <p>Es tu primer inicio de sesión. Por favor, cambia tu contraseña para continuar.</p>
                        <form onSubmit={handleSubmit} className="change-password-form">
                            <div className="change-password-form-group">
                                <label htmlFor="nueva-contrasena">Nueva Contraseña</label>
                                <div className="change-password-input-wrapper">
                                    <input
                                        type={mostrarNuevaContrasena ? "text" : "password"}
                                        id="nueva-contrasena"
                                        value={nuevaContrasena}
                                        onChange={(e) => setNuevaContrasena(e.target.value)}
                                        required
                                        className="change-password-input"
                                        placeholder="Ingresa tu nueva contraseña"
                                    />
                                    <i
                                        className={`bi ${mostrarNuevaContrasena ? "bi-eye-slash-fill" : "bi-eye-fill"} change-password-eye-icon`}
                                        onClick={() => establecerMostrarNuevaContrasena(!mostrarNuevaContrasena)}
                                    ></i>
                                </div>
                            </div>
                            <div className="change-password-form-group">
                                <label htmlFor="confirmar-contrasena">Confirmar Contraseña</label>
                                <div className="change-password-input-wrapper">
                                    <input
                                        type={mostrarNuevaContrasena ? "text" : "password"}
                                        id="confirmar-contrasena"
                                        value={confirmarContrasena}
                                        onChange={(e) => setConfirmarContrasena(e.target.value)}
                                        required
                                        className="change-password-input"
                                        placeholder="Confirma tu nueva contraseña"
                                    />
                                    <i
                                        className={`bi ${mostrarNuevaContrasena ? "bi-eye-slash-fill" : "bi-eye-fill"} change-password-eye-icon`}
                                        onClick={() => establecerMostrarNuevaContrasena(!mostrarNuevaContrasena)}
                                    ></i>
                                </div>
                            </div>
                            {error && <p className="change-password-error-message">{error}</p>}
                            <div className="change-password-footer">
                                <button type="submit" className="boton-aceptar" disabled={cargando}>
                                    {cargando ? (
                                        <>
                                            <span className="change-password-spinner"></span>
                                            {' Cambiando...'}
                                        </>
                                    ) : (
                                        'Cambiar Contraseña'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalContrasena;