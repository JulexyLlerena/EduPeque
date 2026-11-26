const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const { AppError } = require('../utils/errors');
const { isValidEmail, normalizeText } = require('../utils/validators');

const ALLOWED_ROLES = ['DOCENTE', 'REPRESENTANTE', 'DECE'];

function validateLoginRequest({ correo, password, rolEsperado }) {
  const email = normalizeText(correo).toLowerCase();
  if (!isValidEmail(email)) {
    throw new AppError(400, 'Ingresa un correo electrónico válido.');
  }
  if (typeof password !== 'string' || password.length === 0) {
    throw new AppError(400, 'La contraseña es obligatoria.');
  }

  const requestedRole = normalizeText(rolEsperado).toUpperCase();
  if (requestedRole && !ALLOWED_ROLES.includes(requestedRole)) {
    throw new AppError(400, 'El perfil seleccionado no es válido.');
  }
  if (requestedRole === 'REPRESENTANTE' || requestedRole === 'DECE') {
    throw new AppError(
      501,
      'En la Etapa 2 el inicio de sesión operativo está habilitado para el módulo Docente. Los módulos Representante y DECE permanecen como prototipo navegable.'
    );
  }

  return { email, requestedRole };
}

function assertDocenteAccountValid(user, requestedRole) {
  if (!user || !user.activo) {
    throw new AppError(401, 'Correo o contraseña incorrectos.');
  }
  if (requestedRole && user.rol !== requestedRole) {
    throw new AppError(403, 'Tu cuenta no corresponde al perfil seleccionado.');
  }
  if (user.rol !== 'DOCENTE') {
    throw new AppError(403, 'Acceso restringido al módulo docente en esta etapa.');
  }
  if (!user.docente_id || !user.docente_activo) {
    throw new AppError(403, 'El perfil docente se encuentra desactivado.');
  }
}

async function login({ correo, password, rolEsperado }) {
  const { email, requestedRole } = validateLoginRequest({ correo, password, rolEsperado });
  const user = await usuarioModel.findByEmailWithRole(email);

  assertDocenteAccountValid(user, requestedRole);

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new AppError(401, 'Correo o contraseña incorrectos.');
  }

  await usuarioModel.updateLastAccess(user.id);

  return {
    id: user.id,
    correo: user.correo,
    nombres: user.nombres,
    apellidos: user.apellidos,
    rol: user.rol,
    docenteId: user.docente_id,
    esAdministrador: Boolean(user.es_administrador),
    especialidad: user.especialidad || null
  };
}

module.exports = {
  login
};
