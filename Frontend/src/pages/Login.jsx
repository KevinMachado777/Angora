import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import Angora from "../assets/images/angora.png";
import { AuthContext } from "../context/AuthContext.jsx";
import api from "../api/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);

  const [mostrarContraseña, establecerMostrarContraseña] = useState(false);
  const [panelDerechoActivo, establecerPanelDerechoActivo] = useState(false);
  const [vistaActual, setVistaActual] = useState("login");
  const [codigoVerificacion, setCodigoVerificacion] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarNuevaContraseña, establecerMostrarNuevaContraseña] =
    useState(false);
  const [inputNuevaContrasena, setInputNuevaContrasena] = useState("");
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [credenciales, setCredenciales] = useState({
    correo: "",
    password: "",
  });
  // Estados para manejar el contador de caducidad de los códigos
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [fechaExpiracion, setFechaExpiracion] = useState(null);

  const alternarVisibilidadContraseña = () => {
    establecerMostrarContraseña(!mostrarContraseña);
  };

  // Actualizar el contador
  useEffect(() => {
    if (!fechaExpiracion) return;

    const intervalo = setInterval(() => {
      const ahora = new Date().getTime();
      const diferencia = fechaExpiracion - ahora;

      if (diferencia <= 0) {
        clearInterval(intervalo);
        setTiempoRestante(0);
      } else {
        setTiempoRestante(Math.floor(diferencia / 1000)); // en segundos
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [fechaExpiracion]);

  const limpiarCampos = () => {
    setInputNuevaContrasena("");
    setEmailRecuperar("");
    setCodigoVerificacion(["", "", "", "", "", ""]);
    setError("");
    setCredenciales({ correo: "", password: "" });
    setFechaExpiracion(null);
    setTiempoRestante(null);
  };

  const validarContrasena = (contrasena) => {
    const minLength = contrasena.length >= 8;
    const hasUpperCase = /[A-Z]/.test(contrasena);
    const hasLowerCase = /[a-z]/.test(contrasena);
    const hasNumber = /\d/.test(contrasena);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(contrasena);

    if (!minLength) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    if (!hasUpperCase) {
      return "La contraseña debe contener al menos una letra mayúscula";
    }
    if (!hasLowerCase) {
      return "La contraseña debe contener al menos una letra minúscula";
    }
    if (!hasNumber) {
      return "La contraseña debe contener al menos un número";
    }
    if (!hasSpecialChar) {
      return "La contraseña debe contener al menos un carácter especial";
    }
    return "";
  };

  const manejarNuevaContrasena = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Antes de las validaciones de contraseña");
      // Validar la contraseña en el frontend
      const errorContrasena = validarContrasena(inputNuevaContrasena);
      if (errorContrasena) {
        setError(errorContrasena);
        setLoading(false);
        return;
      }

      console.log("Despues de la validacion");
      const datos = {
        correo: emailRecuperar,
        password: inputNuevaContrasena,
      };

      const response = await api.post(
        "http://localhost:8080/angora/api/v1/passwordReset/cambiar",
        datos
      );

      console.log("Respuesta del cambio de contraseña:", response.data);
      setVistaActual("login");
      establecerPanelDerechoActivo(false);
      limpiarCampos();
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      setError(
        error.response?.data?.mensaje ||
          "Error al cambiar la contraseña, intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  const manejarClicRecuperar = (e) => {
    e.preventDefault();
    establecerPanelDerechoActivo(true);
    limpiarCampos();
  };

  const manejarClicVolver = async (e) => {
    e.preventDefault();
    try {
      if (emailRecuperar) {
        const response = await api.delete(
          `http://localhost:8080/angora/api/v1/passwordReset/${emailRecuperar}`
        );
        console.log(
          "Se hizo el limpiado de códigos del backend:",
          response.data
        );
      }
      establecerPanelDerechoActivo(false);
      setVistaActual("login");
      limpiarCampos();
    } catch (error) {
      console.error("Error al limpiar códigos en el backend:", error);
      setError(
        error.response?.data?.mensaje ||
          "Error al limpiar códigos, intenta de nuevo"
      );
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(credenciales.correo, credenciales.password);
    } catch (error) {
      setError(error.message || "Error al iniciar sesión, intenta de nuevo");
    } finally {
      setLoading(false);
    }
  };

  const manejarEnvioVerificacion = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validar si el correo existe
      const validacionCorreo = await api.get(
        `http://localhost:8080/angora/api/v1/passwordReset/${emailRecuperar}`
      );

      if (
        !validacionCorreo.data ||
        typeof validacionCorreo.data.respuesta !== "boolean"
      ) {
        throw new Error("Respuesta inválida del servidor al validar el correo");
      }

      if (validacionCorreo.data.respuesta) {
        // Correo existe, proceder con el envío del código
        const passwordResetDTO = {
          correo: emailRecuperar,
          codigo: "",
          fechaExpiracion: "",
        };

        const response = await api.post(
          "http://localhost:8080/angora/api/v1/passwordReset",
          passwordResetDTO
        );

        if (!response.data || !response.data.fechaExpiracion) {
          throw new Error(
            "Respuesta inválida del servidor al generar el código"
          );
        }

        console.log("Respuesta Correo Recuperar:", response.data);

        // Guardar la fecha de expiración
        const fechaMs = new Date(response.data.fechaExpiracion).getTime();
        if (isNaN(fechaMs)) {
          throw new Error("Fecha de expiración inválida");
        }
        setFechaExpiracion(fechaMs);

        setVistaActual("verificacion");
        setCodigoVerificacion(["", "", "", "", "", ""]);
      } else {
        setError("Correo no registrado, intenta con otro");
      }
    } catch (error) {
      console.error("Error en la validación del correo:", error);
      setError(
        error.message ||
          error.response?.data?.mensaje ||
          "Error al validar el correo, intenta de nuevo"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatoTiempo = (segundos) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}:${seg < 10 ? "0" : ""}${seg}`;
  };

  const manejarCambioCodigo = async (index, value) => {
    if (!/^\d*$/.test(value)) return;

    if (value.length <= 1) {
      const nuevoCodigo = [...codigoVerificacion];
      nuevoCodigo[index] = value;
      setCodigoVerificacion(nuevoCodigo);

      if (value !== "" && index < 5) {
        const nextInput = document.querySelector(
          `input[name=codigo-${index + 1}]`
        );
        if (nextInput) nextInput.focus();
      }

      if (index === 5 && value !== "") {
        const codigoCompleto = [...nuevoCodigo.slice(0, 5), value].join("");

        const passwordResetDTO = {
          correo: emailRecuperar,
          codigo: codigoCompleto,
          fechaExpiracion: "",
        };

        console.log("Diccionario a enviar con el código:", passwordResetDTO);

        try {
          // Consultar el código
          const respuesta = await api.post(
            "http://localhost:8080/angora/api/v1/passwordReset/validar",
            passwordResetDTO
          );

          console.log("Respuesta después de ingresar código:", respuesta.data);

          if (respuesta.data?.respuesta) {
            setError("");
            setVistaActual("nuevaContrasena");
          } else {
            setError("Código de verificación incorrecto, verifica el código");
            setCodigoVerificacion(["", "", "", "", "", ""]);
            setTimeout(() => {
              const firstInput = document.querySelector("input[name=codigo-0]");
              if (firstInput) firstInput.focus();
            }, 100);
          }
        } catch (error) {
          console.error("Error al validar el código:", error);
          setError(
            error.response?.data?.mensaje ||
              "Error al validar el código, intenta de nuevo"
          );
          setCodigoVerificacion(["", "", "", "", "", ""]);
          setTimeout(() => {
            const firstInput = document.querySelector("input[name=codigo-0]");
            if (firstInput) firstInput.focus();
          }, 100);
        }
      }
    }
  };

  const manejarKeyDown = (index, e) => {
    if (
      e.key === "Backspace" &&
      codigoVerificacion[index] === "" &&
      index > 0
    ) {
      const prevInput = document.querySelector(
        `input[name=codigo-${index - 1}]`
      );
      if (prevInput) prevInput.focus();
    }
  };

  const manejarFoco = (e) => {
    e.preventDefault();
    if (e.relatedTarget) {
      establecerPanelDerechoActivo(false);
    }
  };

  useEffect(() => {
    let tono1 = 200;
    let tono2 = 240;
    const intervalo = setInterval(() => {
      tono1 = (tono1 + 1) % 360;
      tono2 = (tono2 + 2) % 360;
      document.documentElement.style.setProperty("--hue1", tono1);
      document.documentElement.style.setProperty("--hue2", tono2);
    }, 50);
    return () => clearInterval(intervalo);
  }, []);

  const renderizarVistaActual = () => {
    switch (vistaActual) {
      case "verificacion":
        return (
          <div className="card-back-login verificacion-container">
            <h2 className="login-title">Código de Verificación</h2>
            <div>
              {tiempoRestante === 0 && (
                <div className="error-mensaje">
                  El código ha expirado, solicita uno nuevo.
                </div>
              )}
              {tiempoRestante > 0 && (
                <div className="login-contador">
                  <p>Tiempo restante: {formatoTiempo(tiempoRestante)}</p>
                </div>
              )}
            </div>
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
                  disabled={loading}
                />
              ))}
            </div>
            <div className="button-group">
              <button
                className="login-button"
                onClick={manejarClicVolver}
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </div>
        );
      case "nuevaContrasena":
        return (
          <div className="card-back-login nueva-contrasena-container">
            <h2 className="login-title">Nueva Contraseña</h2>
            {error && <div className="error-mensaje">{error}</div>}
            <form onSubmit={manejarNuevaContrasena}>
              <div className="input-group">
                <label htmlFor="nueva-password">Nueva Contraseña</label>
                <div className="input-with-icon">
                  <svg
                    className="icon-left"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <div className="input-wrapper">
                    <input
                      type={mostrarNuevaContraseña ? "text" : "password"}
                      id="nueva-password"
                      value={inputNuevaContrasena}
                      onChange={(e) => setInputNuevaContrasena(e.target.value)}
                      required
                      placeholder="Ingresa tu nueva contraseña"
                      disabled={loading}
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
                      onClick={() =>
                        establecerMostrarNuevaContraseña(
                          !mostrarNuevaContraseña
                        )
                      }
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </div>
                </div>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Cargando..." : "Confirmar nueva contraseña"}
              </button>
            </form>
          </div>
        );
      default:
        return (
          <div className="card-back-login">
            <h2 className="login-title">Recuperar Contraseña</h2>
            {error && <div className="error-mensaje">{error}</div>}
            <form onSubmit={manejarEnvioVerificacion}>
              <div className="input-group">
                <label htmlFor="recover-email">Correo electrónico</label>
                <div className="input-with-icon">
                  <svg
                    className="icon-left"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
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
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Cargando..." : "Enviar Verificación"}
              </button>
            </form>
          </div>
        );
    }
  };

  return (
    <div className="login-container">
      <div className="bubbles">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="bubble"></div>
        ))}
      </div>
      <div
        className={`login-form ${
          panelDerechoActivo ? "right-panel-active" : ""
        }`}
      >
        <div className="form-container sign-in-container">
          <div className="card-front-login">
            <h2 className="login-title">Fraganc'eys</h2>
            {error && <div className="error-mensaje">{error}</div>}
            <form onSubmit={manejarEnvio}>
              <div className="input-group">
                <label htmlFor="correo">Correo electrónico</label>
                <div className="input-with-icon">
                  <svg
                    className="icon-left"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="correo"
                      name="correo"
                      value={credenciales.correo}
                      onChange={(e) =>
                        setCredenciales({
                          ...credenciales,
                          correo: e.target.value,
                        })
                      }
                      required
                      placeholder="Ingresa tu correo"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label htmlFor="password">Contraseña</label>
                <div className="input-with-icon">
                  <svg
                    className="icon-left"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect
                      x="3"
                      y="11"
                      width="18"
                      height="11"
                      rx="2"
                      ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <div className="input-wrapper">
                    <input
                      type={mostrarContraseña ? "text" : "password"}
                      id="password"
                      name="password"
                      value={credenciales.password}
                      onChange={(e) =>
                        setCredenciales({
                          ...credenciales,
                          password: e.target.value,
                        })
                      }
                      required
                      placeholder="Ingresa tu contraseña"
                      disabled={loading}
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
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Cargando..." : "Iniciar Sesión"}
              </button>
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
              <p>
                Para ingresar al sistema, por favor inicia sesión con tu
                información personal correcta
              </p>
              <button
                className="ghost"
                onClick={manejarClicVolver}
                onFocus={manejarFoco}
              >
                Volver al inicio
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>¡Hola, Amigo!</h1>
              <img src={Angora} className="logo-angora" alt="Logo Angora" />
              <p>¿Necesitas recuperar tu contraseña? Haz clic abajo</p>
              <button
                className="ghost"
                onClick={manejarClicRecuperar}
                onFocus={manejarFoco}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
