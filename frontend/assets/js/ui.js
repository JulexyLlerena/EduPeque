import { resolvePath } from './config.js';

const VALID_AVATARS = new Set([
  'menta',
  'violeta',
  'sol',
  'coral',
  'melocoton',
  'lila',
  'cielo'
]);

export function getAvatarPath(codigo) {
  const safeCode = VALID_AVATARS.has(codigo) ? codigo : 'menta';
  return resolvePath(`/assets/img/avatar-${safeCode}.svg`);
}

export function formatDateTimeEs(dateString) {
  if (!dateString) {
    return '-';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatDateEs(dateString) {
  if (!dateString) {
    return '-';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatLongTodayEs() {
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
}

export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

export function showBanner(container, type, message) {
  if (!container) {
    return;
  }
  container.className = `alert alert-${type}`;
  container.textContent = message;
  container.classList.remove('hidden');
}

export function hideBanner(container) {
  if (!container) {
    return;
  }
  container.classList.add('hidden');
  container.textContent = '';
}
