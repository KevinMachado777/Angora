import { createContext, useState, useEffect } from "react"; // Importa React y hooks necesarios
import { login, logout } from "../api/auth"; // Importa las funciones de autenticación
import { useNavigate } from "react-router-dom";
import axios from "axios";

// Crea un contexto para la autenticación
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Estado para almacenar el usuario autenticado y el estado de carga
  const [user, setUser] = useState(null);
  // Estado para manejar la carga de la verificación de sesión
  const [loading, setLoading] = useState(true);
  // Hook para redireccionar al usuario
  const navigate = useNavigate();

  // Efecto para verificar si hay una sesión activa al cargar la aplicación
  useEffect(() => {
    const verificarSesion = async () => {
      // Obtiene el access token y correo del localStorage
      // Si no hay token, redirige al login
      const accessToken = localStorage.getItem("accessToken");
      const correo = localStorage.getItem("correo");

      // Si hay un access token y correo, intenta obtener los datos del usuario
      if (accessToken && correo) {
        try {
          // Realiza una petición al backend para obtener los datos del usuario autenticado
          const respuesta = await axios.get(
            `http://localhost:8080/angora/api/v1/user/authenticated/${correo}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          setUser(respuesta.data);
        } catch (error) {
          console.error("Error al verificar sesión:", error.message);
          await signOut();
        }
      }
      setLoading(false);
    };
    // Llama a la función de verificación de sesión al montar el componente
    verificarSesion();
  }, []);

  // Función para iniciar sesión
  const signIn = async (correo, password) => {
    try {
      // Obtiene el access token y refresh token del backend
      const response = await login(correo, password);
      const { accessToken, refreshToken, correo: userCorreo, status } = response.data;

      // Si el login es exitoso, guarda los tokens y redirige al usuario
      if (status) {
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("correo", userCorreo);

        // Realiza una petición para obtener los datos del usuario autenticado
        const respuesta = await axios.get(
          `http://localhost:8080/angora/api/v1/user/authenticated/${correo}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        console.log("Respuesta usuario: ", respuesta.data);

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
      // Limpia el estado y redirige inmediatamente
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("correo");
      // Forzar redirección instantánea sin re-renderizado
      window.location.replace("/login"); // Usa replace para no dejar la página en el historial
    }
  };

  // Proporciona el contexto de autenticación a los componentes hijos
  return (
    <AuthContext.Provider value={{ user, setUser, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};