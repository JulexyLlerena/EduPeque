const aulaModel = require('../models/aulaModel');
const alumnoModel = require('../models/alumnoModel');
const conductaModel = require('../models/conductaModel');
const codigoInvitacionModel = require('../models/codigoInvitacionModel');
const { AppError } = require('../utils/errors');
const { generateInvitationCode } = require('../utils/codeGenerator');
const {
  parsePositiveInt,
  normalizeText,
  isValidDateString,
  isValidInvitationCode
} = require('../utils/validators');

async function ensureDocenteCanAccessAula(user, aulaId) {
  const aula = await aulaModel.findById(aulaId);
  if (!aula || !aula.activa) {
    throw new AppError(404, 'Aula no encontrada o inactiva.');
  }
  const assigned = await aulaModel.isDocenteAssignedToAula(user.docenteId, aulaId);
  if (!assigned && !user.esAdministrador) {
    throw new AppError(403, 'No tienes permisos sobre el aula solicitada.');
  }
  return aula;
}

async function ensureDocenteCanAccessAlumno(user, alumnoId) {
  const alumno = await alumnoModel.findByIdWithAula(alumnoId);
  if (!alumno || !alumno.activo) {
    throw new AppError(404, 'Alumno no encontrado o inactivo.');
  }
  const inAulas = await alumnoModel.isAlumnoInDocenteAulas(user.docenteId, alumnoId);
  if (!inAulas && !user.esAdministrador) {
    throw new AppError(403, 'No tienes permisos para acceder a la información de este alumno.');
  }
  return alumno;
}

async function getPanelData(user, query = {}) {
  const aulas = await aulaModel.findAssignedToDocente(user.docenteId);

  if (aulas.length === 0) {
    return {
      aulas: [],
      aulaActiva: null,
      kpis: {
        alumnosEnAula: 0,
        registrosHoy: 0,
        enSeguimiento: 0
      },
      alumnos: {
        total: 0,
        page: 1,
        pageSize: 6,
        totalPages: 1,
        items: []
      }
    };
  }

  const requestedAulaId = parsePositiveInt(query.aulaId);
  let aulaActiva = aulas[0];
  if (requestedAulaId) {
    const found = aulas.find((item) => item.id === requestedAulaId);
    if (!found) {
      throw new AppError(403, 'No tienes acceso al aula seleccionada.');
    }
    aulaActiva = found;
  }

  const search = normalizeText(query.search || '');
  const allowedFilters = ['todos', 'seguimiento', 'sin_novedades'];
  const filtro = allowedFilters.includes(query.filtro) ? query.filtro : 'todos';
  const page = Math.min(parsePositiveInt(query.page) || 1, 100);
  const pageSize = 6;

  const [kpis, alumnosResult] = await Promise.all([
    conductaModel.getAulaKpis(aulaActiva.id),
    alumnoModel.findAlumnosByAula({
      aulaId: aulaActiva.id,
      search,
      filtro,
      page,
      pageSize
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(alumnosResult.total / pageSize));

  return {
    aulas,
    aulaActiva,
    kpis,
    alumnos: {
      total: alumnosResult.total,
      page,
      pageSize,
      totalPages,
      items: alumnosResult.items
    }
  };
}

async function getCategorias() {
  return conductaModel.listCategoriasActivas();
}

async function listAlumnosDisponibles(user, aulaIdParam) {
  const aulas = user.esAdministrador
    ? (await aulaModel.findAllForAdmin()).filter((item) => item.activa)
    : await aulaModel.findAssignedToDocente(user.docenteId);

  if (aulas.length === 0) {
    return { aulas: [], alumnos: [] };
  }

  let targetAulaId = aulas[0].id;
  if (aulaIdParam) {
    const parsedId = parsePositiveInt(aulaIdParam);
    if (!parsedId) {
      throw new AppError(400, 'Identificador de aula inválido.');
    }
    const found = aulas.find((a) => a.id === parsedId);
    if (!found) {
      throw new AppError(403, 'No tienes acceso al aula solicitada.');
    }
    targetAulaId = parsedId;
  }

  const alumnos = await alumnoModel.findAlumnosByAula({
    aulaId: targetAulaId,
    page: 1,
    pageSize: 100
  });

  return {
    aulas,
    aulaId: targetAulaId,
    alumnos: alumnos.items
  };
}

async function crearRegistroConducta(user, payload) {
  const alumnoId = parsePositiveInt(payload.alumnoId);
  const categoriaId = parsePositiveInt(payload.categoriaId);
  const puntaje = Number(payload.puntaje);
  const observacion = normalizeText(payload.observacion);
  const requiereSeguimientoDece = payload.requiereSeguimientoDece ?? false;
  if (typeof requiereSeguimientoDece !== 'boolean') {
    throw new AppError(
      400,
      'El indicador de seguimiento DECE debe ser booleano.'
    );
  }

  if (!alumnoId) {
    throw new AppError(400, 'Debes seleccionar un alumno válido.');
  }
  if (!categoriaId) {
    throw new AppError(400, 'Debes seleccionar una categoría de conducta.');
  }
  if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
    throw new AppError(400, 'El puntaje debe ser un número entero entre 1 y 5.');
  }
  if (observacion.length < 5 || observacion.length > 500) {
    throw new AppError(400, 'La observación debe tener entre 5 y 500 caracteres.');
  }

  const categorias = await conductaModel.listCategoriasActivas();
  if (!categorias.some((cat) => cat.id === categoriaId)) {
    throw new AppError(400, 'La categoría seleccionada no existe o no está activa.');
  }

  const alumno = await ensureDocenteCanAccessAlumno(user, alumnoId);
  if (!alumno.aula_id) {
    throw new AppError(409, 'El alumno no tiene una matrícula activa en un aula.');
  }

  const registroId = await conductaModel.createRegistroConducta({
    alumnoId,
    aulaId: alumno.aula_id,
    docenteId: user.docenteId,
    categoriaId,
    puntaje,
    observacion,
    requiereSeguimientoDece,
    fechaRegistro: null
  });

  return {
    id: registroId,
    alumnoId,
    aulaId: alumno.aula_id
  };
}

function parseHistorialFilters(query = {}) {
  const fechaInicio = query.fechaInicio ? normalizeText(query.fechaInicio) : null;
  const fechaFin = query.fechaFin ? normalizeText(query.fechaFin) : null;
  const categoriaId = query.categoriaId ? parsePositiveInt(query.categoriaId) : null;
  const page = Math.min(parsePositiveInt(query.page) || 1, 100);
  
  if (fechaInicio && !isValidDateString(fechaInicio)) {
    throw new AppError(400, 'La fecha de inicio debe tener formato YYYY-MM-DD.');
  }
  if (fechaFin && !isValidDateString(fechaFin)) {
    throw new AppError(400, 'La fecha de fin debe tener formato YYYY-MM-DD.');
  }
  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    throw new AppError(400, 'La fecha de inicio no puede ser posterior a la fecha de fin.');
  }
  if (query.categoriaId && !categoriaId) {
    throw new AppError(400, 'La categoría seleccionada no es válida.');
  }

  return { fechaInicio, fechaFin, categoriaId, page, pageSize: 4 };
}

async function getHistorialAlumno(user, alumnoIdParam, query = {}) {
  const alumnoId = parsePositiveInt(alumnoIdParam);
  if (!alumnoId) {
    throw new AppError(400, 'Identificador de alumno inválido.');
  }

  const alumno = await ensureDocenteCanAccessAlumno(user, alumnoId);
  const filters = parseHistorialFilters(query);

  const historial = await conductaModel.getHistorialAlumno({
    alumnoId,
    ...filters
  });

  const totalPages = Math.max(1, Math.ceil(historial.kpis.registrosTotales / filters.pageSize));

  return {
    alumno,
    kpis: historial.kpis,
    registros: {
      total: historial.kpis.registrosTotales,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
      items: historial.items
    }
  };
}

async function generarCodigoVinculacion(user, payload) {
  const alumnoId = parsePositiveInt(payload.alumnoId);
  const diasVigenciaRaw = payload.diasVigencia === undefined ? 7 : Number(payload.diasVigencia);

  if (!alumnoId) {
    throw new AppError(400, 'Debes seleccionar un alumno válido.');
  }
  if (!Number.isInteger(diasVigenciaRaw) || diasVigenciaRaw < 1 || diasVigenciaRaw > 90) {
    throw new AppError(400, 'La vigencia debe estar entre 1 y 90 días.');
  }

  const alumno = await ensureDocenteCanAccessAlumno(user, alumnoId);

  let codigo = null;
  for (let intento = 0; intento < 10; intento += 1) {
    const candidate = generateInvitationCode();
    const exists = await codigoInvitacionModel.existsByCode(candidate);
    if (!exists) {
      codigo = candidate;
      break;
    }
  }

  if (!codigo) {
    throw new AppError(500, 'No fue posible generar un código único. Intenta nuevamente.');
  }

  const fechaExpiracion = new Date(Date.now() + diasVigenciaRaw * 24 * 60 * 60 * 1000);
  const id = await codigoInvitacionModel.createCode({
    codigo,
    alumnoId,
    docenteId: user.docenteId,
    fechaExpiracion
  });

  return {
    id,
    codigo,
    alumnoId,
    alumnoNombre: `${alumno.nombres} ${alumno.apellidos}`,
    estado: 'ACTIVO',
    fechaExpiracion
  };
}

async function listarCodigosVinculacion(user, query = {}) {
  const alumnoId = query.alumnoId ? parsePositiveInt(query.alumnoId) : null;
  if (query.alumnoId && !alumnoId) {
    throw new AppError(400, 'Identificador de alumno inválido.');
  }
  if (alumnoId) {
    await ensureDocenteCanAccessAlumno(user, alumnoId);
  }

  return codigoInvitacionModel.listForDocente({
    docenteId: user.docenteId,
    esAdministrador: user.esAdministrador,
    alumnoId
  });
}

async function revocarCodigoVinculacion(user, codigoIdParam) {
  const codigoId = parsePositiveInt(codigoIdParam);
  if (!codigoId) {
    throw new AppError(400, 'Identificador de código inválido.');
  }

  const record = await codigoInvitacionModel.findById(codigoId);
  if (!record) {
    throw new AppError(404, 'Código de invitación no encontrado.');
  }

  await ensureDocenteCanAccessAlumno(user, record.alumno_id);

  if (record.estado !== 'ACTIVO') {
    throw new AppError(409, 'Solo se pueden revocar códigos que estén activos.');
  }

  const updated = await codigoInvitacionModel.revokeCode(codigoId);
  if (!updated) {
    throw new AppError(409, 'No fue posible revocar el código.');
  }
  return { id: codigoId, estado: 'REVOCADO' };
}

async function validarCodigoVinculacion(codigoParam) {
  const codigo = normalizeText(codigoParam).toUpperCase();
  if (!isValidInvitationCode(codigo)) {
    throw new AppError(400, 'El código debe tener exactamente 8 caracteres alfanuméricos.');
  }

  const record = await codigoInvitacionModel.findByCode(codigo);
  if (!record) {
    throw new AppError(404, 'El código no es válido o no existe.');
  }
  if (record.estado === 'USADO') {
    throw new AppError(409, 'Este código ya fue utilizado.');
  }
  if (record.estado === 'REVOCADO') {
    throw new AppError(409, 'Este código fue revocado por el docente.');
  }
  if (record.estado === 'VENCIDO' || new Date(record.fecha_expiracion) < new Date()) {
    throw new AppError(409, 'El código ha vencido. Solicita una nueva invitación al docente.');
  }

  return {
    valido: true,
    codigo: record.codigo,
    estado: record.estado,
    alumnoId: record.alumno_id,
    alumnoNombre: `${record.alumno_nombres} ${record.alumno_apellidos}`,
    fechaExpiracion: record.fecha_expiracion
  };
}

module.exports = {
  ensureDocenteCanAccessAula,
  ensureDocenteCanAccessAlumno,
  getPanelData,
  getCategorias,
  listAlumnosDisponibles,
  crearRegistroConducta,
  getHistorialAlumno,
  generarCodigoVinculacion,
  listarCodigosVinculacion,
  revocarCodigoVinculacion,
  validarCodigoVinculacion
};
