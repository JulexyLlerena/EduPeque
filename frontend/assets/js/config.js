/**
 * Configuración de entorno y rutas para EduPeque.
 * Permite ejecutar la aplicación tanto en entorno local (raíz /) como en GitHub Pages
 * bajo subdirectorio (/EduPeque/), sin prefijos duplicados y sin romper enlaces.
 */

// Detecta el prefijo base según el hostname y pathname actual
export function getBasePath() {
  if (typeof window === 'undefined') {
    return '';
  }

  // Si está desplegado en GitHub Pages (*.github.io/EduPeque/...)
  const pathname = window.location.pathname || '';
  if (window.location.hostname.endsWith('github.io') || pathname.startsWith('/EduPeque')) {
    return '/EduPeque';
  }

  // Entorno local por defecto (servidor Express o localhost)
  return '';
}

/**
 * Convierte una ruta interna absoluta (iniciada con '/') en una ruta válida para el entorno actual.
 * Evita duplicar el prefijo /EduPeque si ya está presente.
 */
export function resolvePath(path) {
  if (!path || typeof path !== 'string') {
    return path;
  }

  // No modificar URLs completas ni anclas o protocolos externos
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('#') || path.startsWith('mailto:') || path.startsWith('tel:')) {
    return path;
  }

  const basePath = getBasePath();

  // Asegura que empiece con '/'
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Si ya tiene el basePath al inicio, evitar duplicar
  if (basePath && cleanPath.startsWith(`${basePath}/`)) {
    return cleanPath;
  }

  return `${basePath}${cleanPath}`;
}

/**
 * Obtiene la URL base de la API del backend.
 * - Si se define `window.__EDUPEQUE_API_URL__`, se utiliza esa URL (para backend en la nube).
 * - En local (localhost o 127.0.0.1), usa la raíz relativa '' o el puerto configurado.
 * - En GitHub Pages sin backend configurado, retorna null para que el frontend informe al usuario amigablemente.
 */
export function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return '';
  }

  // Variable inyectable globalmente si se despliega el backend en Render/Railway/Fly.io
  if (window.__EDUPEQUE_API_URL__) {
    return window.__EDUPEQUE_API_URL__.replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (isLocal) {
    // Si se accede directamente al servidor Express (ej: puerto 3000)
    return '';
  }

  // En GitHub Pages sin backend remoto especificado:
  return null;
}
