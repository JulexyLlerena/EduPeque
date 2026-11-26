import { getApiBaseUrl } from './config.js';

/**
 * Cliente HTTP REST centralizado para EduPeque.
 * Utiliza cookies HTTP-only gestionadas por el servidor.
 * Detecta si el frontend está alojado estáticamente sin backend conectado (ej. GitHub Pages)
 * y muestra mensajes de error claros y accionables en lugar de "Respuesta inválida del servidor".
 */
export async function apiRequest(url, options = {}) {
  const apiBaseUrl = getApiBaseUrl();

  // Si estamos en un hosting estático (como GitHub Pages) y no hay URL de API configurada:
  if (apiBaseUrl === null) {
    const error = new Error(
      'El servicio de autenticación y base de datos requiere el backend de EduPeque (Node.js/MySQL). ' +
      'Para probar todas las funciones interactivas, ejecuta el proyecto en tu entorno local con Node.js, ' +
      'o configura la URL de tu backend desplegado en window.__EDUPEQUE_API_URL__.'
    );
    error.status = 503;
    error.isStaticHostWithoutBackend = true;
    throw error;
  }

  const endpoint = `${apiBaseUrl}${url}`;
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  let response;
  try {
    response = await fetch(endpoint, config);
  } catch (networkError) {
    const error = new Error(
      'No se pudo conectar con el servidor de EduPeque. ' +
      'Asegúrate de que el backend esté ejecutándose en http://localhost:3000.'
    );
    error.status = 0;
    error.cause = networkError;
    throw error;
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!payload) {
    // Si la respuesta no fue JSON (por ejemplo un 404 HTML devuelto por GitHub Pages o un proxy)
    const error = new Error(
      response.ok
        ? 'El servidor devolvió una respuesta no válida (se esperaba JSON).'
        : `El servidor respondió con código ${response.status} sin formato JSON.`
    );
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Error al procesar la solicitud.');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
