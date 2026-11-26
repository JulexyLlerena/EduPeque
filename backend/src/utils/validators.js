const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INVITATION_CODE_REGEX = /^[A-Z0-9]{8}$/;

function parsePositiveInt(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    return null;
  }
  return num;
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function isValidEmail(value) {
  const email = normalizeText(value).toLowerCase();
  return email.length <= 150 && EMAIL_REGEX.test(email);
}

function isValidDateString(value) {
  if (typeof value !== 'string' || !DATE_REGEX.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidInvitationCode(value) {
  const normalized = normalizeText(value).toUpperCase();
  return INVITATION_CODE_REGEX.test(normalized);
}

function isStrongPassword(password) {
  if (typeof password !== 'string') {
    return false;
  }
  return password.length >= 8 && password.length <= 72;
}

module.exports = {
  parsePositiveInt,
  normalizeText,
  isValidEmail,
  isValidDateString,
  isValidInvitationCode,
  isStrongPassword
};
