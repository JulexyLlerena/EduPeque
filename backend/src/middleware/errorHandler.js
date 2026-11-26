const { AppError } = require('../utils/errors');

function notFoundHandler(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return next(new AppError(404, 'Recurso de API no encontrado.'));
  }
  return next();
}

function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      message: err.message,
      ...(err.details ? { details: err.details } : {})
    });
  }

  if (err && err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      ok: false,
      message: 'Ya existe un registro con ese valor único.'
    });
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      message: 'El cuerpo JSON enviado no es válido.'
    });
  }

  console.error('[EduPeque Error]', err);
  return res.status(500).json({
    ok: false,
    message: 'Ocurrió un error interno en el servidor.'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
