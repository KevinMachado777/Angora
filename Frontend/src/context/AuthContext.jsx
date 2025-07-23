// Importa funciones y hooks necesarios desde React
import { createContext, useState, useEffect } from 'react';
// Importa funciones de login y logout desde el archivo de API
import { login, logout } from '../api/auth';
// Importa el hook de navegación para redireccionar al usuario
import { useNavigate } from 'react-router-dom';
// Importa Axios para hacer peticiones HTTP
import axios from 'axios';

// Crea un nuevo contexto de autenticación que se podrá usar en toda la app
export const AuthContext = createContext();

// Define el proveedor de autenticación, que envuelve a los componentes hijos
export const AuthProvider = ({ children }) => {
  // Estado que almacena los datos del usuario autenticado
  const [user, setUser] = useState(null);
  // Estado que indica si la app está cargando (útil para proteger rutas mientras se verifica la sesión)
  const [loading, setLoading] = useState(true);
  // Hook para redirigir al usuario a diferentes rutas
  const navigate = useNavigate();

  // useEffect que se ejecuta al montar el componente, usado para verificar si ya hay una sesión iniciada
  useEffect(() => {
    // Función asincrónica para verificar y cargar sesión automáticamente
    const verificarSesion = async () => {
      // Obtiene el accessToken y correo del localStorage
      const accessToken = localStorage.getItem('accessToken');
      const correo = localStorage.getItem('correo');

      // Si existen ambos, intenta validar el token
      if (accessToken && correo) {
        try {
          // Hace la petición al backend con el token en los headers
          const respuesta = await axios.get(
            `http://localhost:8080/angora/api/v1/user/authenticated/${correo}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }
          );

          // Si el token es válido, actualiza el estado con los datos del usuario
          setUser(respuesta.data);
        } catch (error) {
          // Si el token es inválido o expiró, cierra sesión
          console.error('Token inválido o expirado:', error.message);
          await signOut(); // Usa la función de cierre de sesión ya definida
        }
      }

      // Marca la app como ya cargada
      setLoading(false);
    };

    verificarSesion(); // Ejecuta la función
  }, []);

  // Función para iniciar sesión
  const signIn = async (correo, password) => {
    try {
      // Llama a la función login del backend
      const response = await login(correo, password);
      // Extrae datos del token y estado desde la respuesta
      const { accessToken, refreshToken, correo: userCorreo, status } = response.data;

      // Si el estado es exitoso (status === true)
      if (status) {
        // Guarda los tokens y correo en el localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('correo', userCorreo);

        // Hace una petición para obtener los datos del usuario autenticado
        const respuesta = await axios.get(`http://localhost:8080/angora/api/v1/user/authenticated/${correo}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        // Muestra los datos obtenidos del backend por consola
        console.log("Respuesta usuario: " + respuesta.data);

        // Actualiza el estado con los datos del usuario autenticado
        setUser(respuesta.data);

        // Redirige al usuario a la ruta /home
        navigate('/home', { replace: true });
      } else {
        // Lanza un error si el login no fue exitoso
        throw new Error(response.data.message || 'Error en el login');
      }
    } catch (error) {
      // Muestra el error por consola
      console.error('Error en signIn:', error);
      // Si la respuesta fue 401 (no autorizado), lanza un error específico
      if (error.response?.status === 401) {
        throw new Error('Credenciales incorrectas. Por favor, verifica tu correo y contraseña.');
      }
      // Lanza un error general si no fue un 401
      throw new Error(error.response?.data?.message || error.message || 'Error al iniciar sesión');
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      // Llama al logout en el backend (opcional)
      await logout();
    } catch (error) {
      // Muestra cualquier error que ocurra al cerrar sesión
      console.log("Error Logout: " + error.message)
    } finally {
      // Elimina los datos de sesión del localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('correo');
      // Limpia el estado del usuario
      setUser(null);
      // Redirige al login
      navigate('/login', { replace: true });
    }
  };

  // Retorna el proveedor de contexto, permitiendo que los componentes hijos accedan al contexto de autenticación
  return (
<AuthContext.Provider value={{ user, setUser, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
