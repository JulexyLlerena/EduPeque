const docenteService = require('../services/docenteService');

async function getPanel(req, res, next) {
  try {
    const data = await docenteService.getPanelData(req.user, req.query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function getCategorias(req, res, next) {
  try {
    const categorias = await docenteService.getCategorias();
    res.json({ ok: true, data: { categorias } });
  } catch (error) {
    next(error);
  }
}

async function getAlumnosDisponibles(req, res, next) {
  try {
    const data = await docenteService.listAlumnosDisponibles(req.user, req.query.aulaId);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function crearConducta(req, res, next) {
  try {
    const result = await docenteService.crearRegistroConducta(req.user, req.body);
    res.status(201).json({
      ok: true,
      message: 'Registro de conducta guardado correctamente.',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getHistorialAlumno(req, res, next) {
  try {
    const data = await docenteService.getHistorialAlumno(req.user, req.params.alumnoId, req.query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

async function generarCodigo(req, res, next) {
  try {
    const data = await docenteService.generarCodigoVinculacion(req.user, req.body);
    res.status(201).json({
      ok: true,
      message: 'Código de vinculación generado correctamente.',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function listarCodigos(req, res, next) {
  try {
    const codigos = await docenteService.listarCodigosVinculacion(req.user, req.query);
    res.json({ ok: true, data: { codigos } });
  } catch (error) {
    next(error);
  }
}

async function revocarCodigo(req, res, next) {
  try {
    const data = await docenteService.revocarCodigoVinculacion(req.user, req.params.codigoId);
    res.json({
      ok: true,
      message: 'Código revocado correctamente.',
      data
    });
  } catch (error) {
    next(error);
  }
}

async function validarCodigo(req, res, next) {
  try {
    const data = await docenteService.validarCodigoVinculacion(req.params.codigo);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPanel,
  getCategorias,
  getAlumnosDisponibles,
  crearConducta,
  getHistorialAlumno,
  generarCodigo,
  listarCodigos,
  revocarCodigo,
  validarCodigo
};
