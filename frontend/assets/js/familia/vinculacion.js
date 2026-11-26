import { showBanner, hideBanner } from '../ui.js';

const cells = Array.from(document.querySelectorAll('.otp-cell'));
const form = document.getElementById('vinculacionForm');
const feedback = document.getElementById('vinculacionFeedback');

cells.forEach((cell, idx) => {
  cell.addEventListener('input', () => {
    cell.value = cell.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cell.value && idx < cells.length - 1) {
      cells[idx + 1].focus();
    }
  });

  cell.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace' && !cell.value && idx > 0) {
      cells[idx - 1].focus();
    }
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  hideBanner(feedback);
  const code = cells.map((c) => c.value.trim()).join('');

  if (code.length < 8) {
    cells.forEach((c) => c.classList.add('is-invalid'));
    showBanner(
      feedback,
      'error',
      'No pudimos validar el código. Ingresa los 8 caracteres alfanuméricos sin espacios.'
    );
    return;
  }

  cells.forEach((c) => c.classList.remove('is-invalid'));
  showBanner(
    feedback,
    'info',
    'En esta Etapa 2, la generación y validación de códigos opera desde el Módulo Docente; el flujo completo de registro de representantes se completará en la siguiente etapa.'
  );
});
