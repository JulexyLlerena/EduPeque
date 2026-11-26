import { apiRequest } from './api.js';

export async function requireDocenteSession({ requireAdmin = false } = {}) {
  try {
    const res = await apiRequest('/api/auth/me');
    const user = res?.data?.user;

    if (!user || user.rol !== 'DOCENTE') {
      window.location.href = '/index.html';
      return null;
    }

    if (requireAdmin && !user.esAdministrador) {
      window.location.href = '/pages/docente/mi-aula.html';
      return null;
    }

    const userLabel = document.getElementById('topbarUserLabel');
    if (userLabel) {
      const roleLabel = user.esAdministrador ? 'Docente Administrador' : 'Docente';
      userLabel.textContent = `${user.nombres} ${user.apellidos} · ${roleLabel}`;
    }

    const adminNav = document.getElementById('navAdminItem');
    if (adminNav) {
      if (user.esAdministrador) {
        adminNav.classList.remove('hidden');
      } else {
        adminNav.classList.add('hidden');
      }
    }

    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await apiRequest('/api/auth/logout', { method: 'POST' });
        } finally {
          window.location.href = '/index.html';
        }
      });
    }

    return user;
  } catch {
    window.location.href = '/index.html';
    return null;
  }
}
