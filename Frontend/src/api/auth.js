// Importamos la instancia personalizada de Axios con interceptores ya configurados
import api from './axiosInstance';

// Función que realiza el inicio de sesión
// Recibe correo y contraseña, y los envía al backend en una petición POST
export const login = async (correo, password) => {
  // Devuelve la respuesta de la API haciendo POST al endpoint /auth/login
  return api.post('/auth/login', { correo, password });
};

// Función que permite renovar el accessToken utilizando un refreshToken
export const refreshToken = async (refreshToken) => {
  // Devuelve la respuesta de la API haciendo POST al endpoint /auth/refresh
  return api.post('/auth/refresh', { refreshToken });
};

// Función para cerrar sesión
export const logout = async () => {
  // Obtiene el refreshToken almacenado en localStorage
  const refreshToken = localStorage.getItem('refreshToken');

  // Si no hay refreshToken, lanza un error
  if (!refreshToken) {
    throw new Error('No hay refresh token disponible');
  }

  // Hace una solicitud POST al endpoint /auth/logout enviando el refreshToken
  return api.post('/auth/logout', { refreshToken });
};
