// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import { login, logout } from "../api/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Crea un contexto para la autenticación
export const AuthContext = createContext();

// Proveedor del contexto de autenticación
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Inicializa user desde localStorage si existe para evitar retrasos
    const accessToken = localStorage.getItem("accessToken");
    // Si no hay accessToken, user será null
    const correo = localStorage.getItem("correo");
    return accessToken && correo ? { correo } : null; // Valor temporal hasta la verificación
  });
  // Estado para manejar el loading que es necesario para evitar renderizados prematuros
  const [loading, setLoading] = useState(true);
  // Navegación para redirigir después del login
  const navigate = useNavigate();

  // Efecto para verificar la sesión al cargar el componente
  useEffect(() => {
    const verificarSesion = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const correo = localStorage.getItem("correo");

      // Si no hay accessToken o correo, no hay sesión activa
      if (!accessToken || !correo) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8080/angora/api/v1/auth/authenticated/${correo}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Error al verificar sesión:", error.message);
        await signOut();
      } finally {
        setLoading(false);
      }
    };
    verificarSesion();
  }, []);

  // Función para iniciar sesión
  const signIn = async (correo, password) => {
    try {
      const response = await login(correo, password);
      const { accessToken, refreshToken, correo: userCorreo, status } = response.data;

      
      if (status) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("correo", userCorreo);

        // Actualiza el estado del usuario con el correo
        const respuesta = await axios.get(
          `http://localhost:8080/angora/api/v1/auth/authenticated/${correo}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log("Respuesta usuario: ", respuesta.data);

        // Actualiza el estado del usuario con la respuesta del backend
        setUser(respuesta.data);
        navigate("/home", { replace: true });
      } else {
        throw new Error(response.data.message || "Error en el login");
      }
    } catch (error) {
      console.error("Error en signIn:", error);
      if (error.response?.status === 401) {
        throw new Error("Credenciales incorrectas. Por favor, verifica tu correo y contraseña.");
      }
      throw new Error(error.response?.data?.message || error.message || "Error al iniciar sesión");
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión en el backend:", error.message);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("correo");
      setUser(null);
      window.location.replace("/login");
    }
  };

  // Proporciona el contexto de autenticación a los componentes hijos
  return (
    <AuthContext.Provider value={{ user, setUser, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};