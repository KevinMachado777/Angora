import axios from 'axios';

// instancia de axios para manejar las solicitudes HTTP
const api = axios.create({
  baseURL: 'http://localhost:8080/angora/api/v1',
});

// Interceptores para manejar solicitudes y respuestas
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token && !config.url.includes('/auth/logout')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log("Respuesta exitosa:", response.status, response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si hay un error 401 (Unauthorized) y no se ha reintentado la solicitud
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/logout')
    ) {
      originalRequest._retry = true;
      console.log("Detectado 401, intentando refresh con refreshToken:", localStorage.getItem('refreshToken'));

      // Intentar refrescar el token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.log("No hay refreshToken disponible");
          throw new Error('No hay refresh token disponible');
        }

        // Hacer la solicitud para refrescar el token
        const response = await api.post('/auth/refresh', { refreshToken });
        console.log("Refresh exitoso, nueva respuesta:", response.data);

        // Actualizar los tokens en localStorage
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        // Si hay un nuevo refreshToken, actualizarlo en localStorage
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log("Reintentando solicitud con nuevo token:", accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        console.log("Error en refresh:", refreshError.message);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('correo');
        return Promise.reject(refreshError);
      }
    }

    console.log("Error no manejado por refresh:", error.message);
    return Promise.reject(error);
  }
);

export default api; 