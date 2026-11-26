/**
 * Cliente HTTP REST centralizado para EduPeque.
 * Utiliza cookies HTTP-only gestionadas por el servidor (sin localStorage para datos ni sesión).
 */
export async function apiRequest(url, options = {}) {
  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  const response = await fetch(url, config);
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = { ok: false, message: 'Respuesta inválida del servidor.' };
  }

  if (!response.ok) {
    const error = new Error(payload?.message || 'Error al procesar la solicitud.');
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
