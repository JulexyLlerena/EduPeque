import { apiRequest } from './api.js';
import { resolvePath } from './config.js';
import { showBanner, hideBanner } from './ui.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let selectedRole = 'DOCENTE';

const tabs = document.querySelectorAll('.segmented-tab');
const loginForm = document.getElementById('loginForm');
const correoInput = document.getElementById('correoInput');
const passwordInput = document.getElementById('passwordInput');
const recordarmeInput = document.getElementById('recordarmeInput');
const correoError = document.getElementById('correoError');
const passwordError = document.getElementById('passwordError');
const loginAlert = document.getElementById('loginAlert');
const prototypeNotice = document.getElementById('prototypeNotice');
const prototypeNoticeText = document.getElementById('prototypeNoticeText');
const prototypePreviewLink = document.getElementById('prototypePreviewLink');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

function updatePrototypeNotice() {
  if (selectedRole === 'REPRESENTANTE') {
    prototypeNotice.classList.remove('hidden');

    prototypeNoticeText.textContent =
      'Módulo Representante en modo prototipo navegable (Etapa 2). Puedes explorar sus vistas sin datos personales reales.';

    prototypePreviewLink.href = resolvePath('/pages/familia/resumen.html');
    prototypePreviewLink.textContent = 'Explorar prototipo Representante →';

  } else if (selectedRole === 'DECE') {
    prototypeNotice.classList.remove('hidden');

    prototypeNoticeText.textContent =
      'Módulo DECE en modo prototipo navegable (Etapa 2). Puedes revisar el panel independiente de seguimiento.';

    prototypePreviewLink.href = resolvePath('/pages/dece/seguimiento.html');
    prototypePreviewLink.textContent = 'Explorar prototipo DECE →';

  } else {
    prototypeNotice.classList.add('hidden');
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((item) => item.classList.remove('active'));
    tab.classList.add('active');
    selectedRole = tab.dataset.role || 'DOCENTE';
    hideBanner(loginAlert);
    updatePrototypeNotice();
  });
});

function validateLoginInputs() {
  let valid = true;
  const email = correoInput.value.trim();
  const password = passwordInput.value;

  if (!EMAIL_REGEX.test(email)) {
    correoInput.classList.add('is-invalid');
    correoError.classList.remove('hidden');
    valid = false;
  } else {
    correoInput.classList.remove('is-invalid');
    correoError.classList.add('hidden');
  }

  if (!password) {
    passwordInput.classList.add('is-invalid');
    passwordError.classList.remove('hidden');
    valid = false;
  } else {
    passwordInput.classList.remove('is-invalid');
    passwordError.classList.add('hidden');
  }

  return valid;
}

correoInput.addEventListener('input', () => {
  if (EMAIL_REGEX.test(correoInput.value.trim())) {
    correoInput.classList.remove('is-invalid');
    correoError.classList.add('hidden');
  }
});

passwordInput.addEventListener('input', () => {
  if (passwordInput.value.length > 0) {
    passwordInput.classList.remove('is-invalid');
    passwordError.classList.add('hidden');
  }
});

forgotPasswordLink.addEventListener('click', (event) => {
  event.preventDefault();
  showBanner(
    loginAlert,
    'info',
    'Para restablecer una contraseña docente en entorno local, solicita asistencia al docente administrador del sistema.'
  );
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(loginAlert);

  if (!validateLoginInputs()) {
    return;
  }

  try {
    await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        correo: correoInput.value.trim(),
        password: passwordInput.value,
        rol: selectedRole,
        recordarme: recordarmeInput.checked
      })
    });

    if (selectedRole === 'DOCENTE') {
      window.location.href = resolvePath('/pages/docente/mi-aula.html');
    }
  } catch (error) {
    showBanner(loginAlert, 'error', error.message);
  }
});

(async () => {
  try {
    const res = await apiRequest('/api/auth/me');
    if (res?.data?.user?.rol === 'DOCENTE') {
      window.location.href = resolvePath('/pages/docente/mi-aula.html');
    }
  } catch {
    // Sin sesión activa o sin backend disponible en este host
  }
})();

updatePrototypeNotice();
