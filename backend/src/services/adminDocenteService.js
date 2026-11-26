const bcrypt = require('bcryptjs');
const docenteModel = require('../models/docenteModel');
const aulaModel = require('../models/aulaModel');
const alumnoModel = require('../models/alumnoModel');
const { AppError } = require('../utils/errors');
const {
  parsePositiveInt,
  normalizeText,
  isValidEmail,
  isValidDateString,
  isStrongPassword
} = require('../utils/validators');

const VALID_AVATARS = ['menta', 'violeta', 'sol', 'coral', 'melocoton', 'lila', 'cielo'];

// ---- Gestión de Docentes ----

async function listDocentes() {
  return docenteModel.findAll();
}

async function createDocente(payload) {
  const nombres = normalizeText(payload.nombres);
  const apellidos = normalizeText(payload.apellidos);
  const correo = normalizeText(payload.correo).toLowerCase();
  const especialidad = normalizeText(payload.especialidad);
  const telefonoContacto = normalizeText(payload.telefonoContacto);
  const password = payload.password;
  const esAdministrador = Boolean(payload.esAdministrador);

  if (nombres.length < 2 || apellidos.length < 2) {
    throw new AppError(400, 'Nombres y apellidos son obligatorios.');
  }
  if (!isValidEmail(correo)) {
    throw new AppError(400, 'Ingresa un correo electrónico válido.');
  }
  if (!isStrongPassword(password)) {
    throw new AppError(400, 'La contraseña debe tener entre 8 y 72 caracteres.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = await docenteModel.createDocente({
    correo,
    passwordHash,
    nombres,
    apellidos,
    especialidad,
    telefonoContacto,
    esAdministrador
  });

  return docenteModel.findById(id);
}

async function updateDocente(docenteIdParam, payload) {
  const docenteId = parsePositiveInt(docenteIdParam);
  if (!docenteId) {
    throw new AppError(400, 'Identificador de docente inválido.');
  }

  const nombres = normalizeText(payload.nombres);
  const apellidos = normalizeText(payload.apellidos);
  const especialidad = normalizeText(payload.especialidad);
  const telefonoContacto = normalizeText(payload.telefonoContacto);

  if (nombres.length < 2 || apellidos.length < 2) {
    throw new AppError(400, 'Nombres y apellidos son obligatorios.');
  }

  const updated = await docenteModel.updateDocente(docenteId, {
    nombres,
    apellidos,
    especialidad,
    telefonoContacto
  });

  if (!updated) {
    throw new AppError(404, 'Docente no encontrado.');
  }
  return docenteModel.findById(docenteId);
}

async function toggleDocenteStatus(docenteIdParam, activo, currentUser) {
  const docenteId = parsePositiveInt(docenteIdParam);
  if (!docenteId) {
    throw new AppError(400, 'Identificador de docente inválido.');
  }
  if (docenteId === currentUser.docenteId && !activo) {
    throw new AppError(409, 'No puedes desactivar tu propia cuenta administradora activa.');
  }

  const updated = await docenteModel.setDocenteStatus(docenteId, Boolean(activo));
  if (!updated) {
    throw new AppError(404, 'Docente no encontrado.');
  }
  return docenteModel.findById(docenteId);
}

// ---- Gestión de Aulas ----

function validateAulaPayload(payload) {
  const nombre = normalizeText(payload.nombre);
  const nivel = normalizeText(payload.nivel);
  const periodoLectivo = normalizeText(payload.periodoLectivo);
  const hasCapacidad =
    payload.capacidad !== undefined && payload.capacidad !== '' && payload.capacidad !== null;
  const capacidad = hasCapacidad ? parsePositiveInt(payload.capacidad) : null;

  if (nombre.length < 2 || nivel.length < 2 || periodoLectivo.length < 2) {
    throw new AppError(400, 'Nombre, nivel y periodo lectivo son obligatorios.');
  }
  if (hasCapacidad && !capacidad) {
    throw new AppError(400, 'La capacidad debe ser un entero positivo.');
  }

  return { nombre, nivel, periodoLectivo, capacidad };
}

async function listAulas() {
  return aulaModel.findAllForAdmin();
}

async function createAula(payload) {
  const aulaData = validateAulaPayload(payload);
  const id = await aulaModel.createAula(aulaData);
  return aulaModel.findById(id);
}

async function updateAula(aulaIdParam, payload) {
  const aulaId = parsePositiveInt(aulaIdParam);
  if (!aulaId) {
    throw new AppError(400, 'Identificador de aula inválido.');
  }

  const aulaData = validateAulaPayload(payload);
  const updated = await aulaModel.updateAula(aulaId, aulaData);
  if (!updated) {
    throw new AppError(404, 'Aula no encontrada.');
  }
  return aulaModel.findById(aulaId);
}

async function toggleAulaStatus(aulaIdParam, activa) {
  const aulaId = parsePositiveInt(aulaIdParam);
  if (!aulaId) {
    throw new AppError(400, 'Identificador de aula inválido.');
  }
  const updated = await aulaModel.setAulaStatus(aulaId, Boolean(activa));
  if (!updated) {
    throw new AppError(404, 'Aula no encontrada.');
  }
  return aulaModel.findById(aulaId);
}

// ---- Asignaciones Docente-Aula ----

async function listAsignaciones() {
  return aulaModel.listAsignaciones();
}

async function assignDocente(payload) {
  const docenteId = parsePositiveInt(payload.docenteId);
  const aulaId = parsePositiveInt(payload.aulaId);
  const esTitular = payload.esTitular === undefined ? true : Boolean(payload.esTitular);

  if (!docenteId || !aulaId) {
    throw new AppError(400, 'Debes seleccionar un docente y un aula válidos.');
  }

  const [docente, aula] = await Promise.all([
    docenteModel.findById(docenteId),
    aulaModel.findById(aulaId)
  ]);

  if (!docente || !docente.docente_activo || !docente.usuario_activo) {
    throw new AppError(404, 'Docente no encontrado o inactivo.');
  }
  if (!aula || !aula.activa) {
    throw new AppError(404, 'Aula no encontrada o inactiva.');
  }

  await aulaModel.assignDocenteToAula({ docenteId, aulaId, esTitular });
  return { docenteId, aulaId, esTitular };
}

async function toggleAsignacionStatus(asignacionIdParam, activo) {
  const asignacionId = parsePositiveInt(asignacionIdParam);
  if (!asignacionId) {
    throw new AppError(400, 'Identificador de asignación inválido.');
  }
  const updated = await aulaModel.setAsignacionStatus(asignacionId, Boolean(activo));
  if (!updated) {
    throw new AppError(404, 'Asignación no encontrada.');
  }
  return { id: asignacionId, activo: Boolean(activo) };
}

// ---- Gestión de Alumnos y Matrículas ----

async function listAlumnos() {
  return alumnoModel.findAllForAdmin();
}

function validateAlumnoBasePayload(payload) {
  const nombres = normalizeText(payload.nombres);
  const apellidos = normalizeText(payload.apellidos);
  const fechaNacimiento = normalizeText(payload.fechaNacimiento);
  const avatarCodigo = VALID_AVATARS.includes(payload.avatarCodigo) ? payload.avatarCodigo : 'menta';

  if (nombres.length < 2 || apellidos.length < 2) {
    throw new AppError(400, 'Nombres y apellidos del alumno son obligatorios.');
  }
  if (!isValidDateString(fechaNacimiento)) {
    throw new AppError(400, 'La fecha de nacimiento debe tener formato YYYY-MM-DD.');
  }
  if (new Date(`${fechaNacimiento}T00:00:00Z`) > new Date()) {
    throw new AppError(400, 'La fecha de nacimiento no puede ser futura.');
  }

  return { nombres, apellidos, fechaNacimiento, avatarCodigo };
}

async function createAlumno(payload) {
  const baseData = validateAlumnoBasePayload(payload);
  const aulaId = payload.aulaId ? parsePositiveInt(payload.aulaId) : null;

  if (payload.aulaId && !aulaId) {
    throw new AppError(400, 'Identificador de aula inválido.');
  }
  if (aulaId) {
    const aula = await aulaModel.findById(aulaId);
    if (!aula || !aula.activa) {
      throw new AppError(404, 'El aula seleccionada no existe o está inactiva.');
    }
  }

  const id = await alumnoModel.createAlumnoWithMatricula({
    ...baseData,
    aulaId
  });

  return alumnoModel.findByIdWithAula(id);
}

async function updateAlumno(alumnoIdParam, payload) {
  const alumnoId = parsePositiveInt(alumnoIdParam);
  if (!alumnoId) {
    throw new AppError(400, 'Identificador de alumno inválido.');
  }

  const baseData = validateAlumnoBasePayload(payload);
  const updated = await alumnoModel.updateAlumno(alumnoId, baseData);
  if (!updated) {
    throw new AppError(404, 'Alumno no encontrado.');
  }
  return alumnoModel.findByIdWithAula(alumnoId);
}

async function toggleAlumnoStatus(alumnoIdParam, activo) {
  const alumnoId = parsePositiveInt(alumnoIdParam);
  if (!alumnoId) {
    throw new AppError(400, 'Identificador de alumno inválido.');
  }
  const updated = await alumnoModel.setAlumnoStatus(alumnoId, Boolean(activo));
  if (!updated) {
    throw new AppError(404, 'Alumno no encontrado.');
  }
  return alumnoModel.findByIdWithAula(alumnoId);
}

async function matricularAlumno(alumnoIdParam, payload) {
  const alumnoId = parsePositiveInt(alumnoIdParam);
  const aulaId = parsePositiveInt(payload.aulaId);
  if (!alumnoId || !aulaId) {
    throw new AppError(400, 'Alumno y aula son obligatorios para la matrícula.');
  }

  const [alumno, aula] = await Promise.all([
    alumnoModel.findByIdWithAula(alumnoId),
    aulaModel.findById(aulaId)
  ]);

  if (!alumno || !alumno.activo) {
    throw new AppError(404, 'Alumno no encontrado o inactivo.');
  }
  if (!aula || !aula.activa) {
    throw new AppError(404, 'Aula no encontrada o inactiva.');
  }

  await alumnoModel.upsertActiveMatricula(alumnoId, aulaId);
  return alumnoModel.findByIdWithAula(alumnoId);
}

module.exports = {
  listDocentes,
  createDocente,
  updateDocente,
  toggleDocenteStatus,
  listAulas,
  createAula,
  updateAula,
  toggleAulaStatus,
  listAsignaciones,
  assignDocente,
  toggleAsignacionStatus,
  listAlumnos,
  createAlumno,
  updateAlumno,
  toggleAlumnoStatus,
  matricularAlumno
};
