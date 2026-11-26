const adminDocenteService = require('../services/adminDocenteService');

async function listDocentes(req, res, next) {
  try {
    const docentes = await adminDocenteService.listDocentes();
    res.json({ ok: true, data: { docentes } });
  } catch (error) {
    next(error);
  }
}

async function createDocente(req, res, next) {
  try {
    const docente = await adminDocenteService.createDocente(req.body);
    res.status(201).json({ ok: true, message: 'Docente creado correctamente.', data: { docente } });
  } catch (error) {
    next(error);
  }
}

async function updateDocente(req, res, next) {
  try {
    const docente = await adminDocenteService.updateDocente(req.params.docenteId, req.body);
    res.json({ ok: true, message: 'Docente actualizado.', data: { docente } });
  } catch (error) {
    next(error);
  }
}

async function toggleDocenteStatus(req, res, next) {
  try {
    const docente = await adminDocenteService.toggleDocenteStatus(
      req.params.docenteId,
      req.body.activo,
      req.user
    );
    res.json({ ok: true, message: 'Estado del docente actualizado.', data: { docente } });
  } catch (error) {
    next(error);
  }
}

async function listAulas(req, res, next) {
  try {
    const aulas = await adminDocenteService.listAulas();
    res.json({ ok: true, data: { aulas } });
  } catch (error) {
    next(error);
  }
}

async function createAula(req, res, next) {
  try {
    const aula = await adminDocenteService.createAula(req.body);
    res.status(201).json({ ok: true, message: 'Aula registrada correctamente.', data: { aula } });
  } catch (error) {
    next(error);
  }
}

async function updateAula(req, res, next) {
  try {
    const aula = await adminDocenteService.updateAula(req.params.aulaId, req.body);
    res.json({ ok: true, message: 'Aula actualizada correctamente.', data: { aula } });
  } catch (error) {
    next(error);
  }
}

async function toggleAulaStatus(req, res, next) {
  try {
    const aula = await adminDocenteService.toggleAulaStatus(req.params.aulaId, req.body.activa);
    res.json({ ok: true, message: 'Estado del aula actualizado.', data: { aula } });
  } catch (error) {
    next(error);
  }
}

async function listAsignaciones(req, res, next) {
  try {
    const asignaciones = await adminDocenteService.listAsignaciones();
    res.json({ ok: true, data: { asignaciones } });
  } catch (error) {
    next(error);
  }
}

async function assignDocente(req, res, next) {
  try {
    const asignacion = await adminDocenteService.assignDocente(req.body);
    res.status(201).json({ ok: true, message: 'Docente asignado al aula.', data: { asignacion } });
  } catch (error) {
    next(error);
  }
}

async function toggleAsignacionStatus(req, res, next) {
  try {
    const result = await adminDocenteService.toggleAsignacionStatus(
      req.params.asignacionId,
      req.body.activo
    );
    res.json({ ok: true, message: 'Estado de asignación actualizado.', data: result });
  } catch (error) {
    next(error);
  }
}

async function listAlumnos(req, res, next) {
  try {
    const alumnos = await adminDocenteService.listAlumnos();
    res.json({ ok: true, data: { alumnos } });
  } catch (error) {
    next(error);
  }
}

async function createAlumno(req, res, next) {
  try {
    const alumno = await adminDocenteService.createAlumno(req.body);
    res.status(201).json({ ok: true, message: 'Alumno registrado correctamente.', data: { alumno } });
  } catch (error) {
    next(error);
  }
}

async function updateAlumno(req, res, next) {
  try {
    const alumno = await adminDocenteService.updateAlumno(req.params.alumnoId, req.body);
    res.json({ ok: true, message: 'Alumno actualizado correctamente.', data: { alumno } });
  } catch (error) {
    next(error);
  }
}

async function toggleAlumnoStatus(req, res, next) {
  try {
    const alumno = await adminDocenteService.toggleAlumnoStatus(req.params.alumnoId, req.body.activo);
    res.json({ ok: true, message: 'Estado del alumno actualizado.', data: { alumno } });
  } catch (error) {
    next(error);
  }
}

async function matricularAlumno(req, res, next) {
  try {
    const alumno = await adminDocenteService.matricularAlumno(req.params.alumnoId, req.body);
    res.json({ ok: true, message: 'Matrícula actualizada correctamente.', data: { alumno } });
  } catch (error) {
    next(error);
  }
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
