// Importa Axios para realizar peticiones HTTP
import axios from 'axios';

// Crea una instancia de Axios con configuración base
const api = axios.create({
  baseURL: 'http://localhost:8080/angora/api/v1', // URL base para todas las peticiones
  headers: {
    'Content-Type': 'application/json', // Indica que se enviará y recibirá JSON
  },
});

// Interceptor de solicitudes: se ejecuta antes de enviar cualquier petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // Obtiene el access token del localStorage

    // Si existe el token y la URL no es /auth/logout, se agrega el header Authorization
    if (token && !config.url.includes('/auth/logout')) {
      config.headers.Authorization = `Bearer ${token}`; // Agrega el token como Bearer
    }

    return config; // Devuelve la configuración modificada
  },
  (error) => Promise.reject(error) // Si ocurre un error al preparar la petición, se propaga
);

// Interceptor de respuestas: se ejecuta cuando una respuesta es recibida o falla
api.interceptors.response.use(
  (response) => response, // Si la respuesta es correcta, se retorna tal cual
  async (error) => {
    const originalRequest = error.config; // Guarda la configuración original de la petición fallida

    // Si la respuesta es 401 (No autorizado), y no es un reintento, y no es una ruta de login, refresh o logout
    if (
      error.response?.status === 401 &&
      !originalRequest._retry && // Marca si ya se intentó reintentar la solicitud
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      originalRequest._retry = true; // Marca la petición como reintento para evitar bucles infinitos

      try {
        const refreshToken = localStorage.getItem('refreshToken'); // Obtiene el refresh token
        if (!refreshToken) {
          throw new Error('No hay refresh token disponible'); // Si no hay token, lanza error
        }

        // Hace una petición al backend para obtener un nuevo access token usando el refresh token
        const response = await api.post('/auth/refresh', { refreshToken });

        // Extrae el nuevo access token y refresh token de la respuesta
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Guarda el nuevo access token en localStorage
        localStorage.setItem('accessToken', accessToken);
        // Si el backend también envió un nuevo refresh token, lo actualiza
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Actualiza el header Authorization de la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Reintenta la petición original con el nuevo token
        return api(originalRequest);
      } catch (refreshError) {
        // Si el refresh falla (token inválido o expirado), limpia el almacenamiento local
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('correo');

        // Propaga el error del refresh para que el frontend lo maneje (por ejemplo, redirigir al login)
        return Promise.reject(refreshError);
      }
    }

    // Si el error no es 401 o no es elegible para refresh, simplemente se propaga
    return Promise.reject(error);
  }
);

// Exporta la instancia de Axios configurada con interceptores
export default api;
