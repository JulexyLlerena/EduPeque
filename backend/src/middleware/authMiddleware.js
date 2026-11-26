const database = require('../config/database');
const { AppError } = require('../utils/errors');

async function requireAuth(req, res, next) {
  try {
    if (!req.session || !req.session.user || !req.session.user.id) {
      return next(new AppError(401, 'Debes iniciar sesión para continuar.'));
    }

    const pool = database.getPool();
    const [rows] = await pool.query(
      `SELECT u.id, u.correo, u.nombres, u.apellidos, u.activo, r.codigo AS rol,
              d.id AS docente_id, d.es_administrador, d.activo AS docente_activo
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.rol_id
       LEFT JOIN docentes d ON d.usuario_id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [req.session.user.id]
    );

    if (rows.length === 0 || !rows[0].activo) {
      req.session.destroy(() => {});
      return next(new AppError(401, 'Tu sesión ya no es válida o el usuario fue desactivado.'));
    }

    const user = rows[0];
    if (user.rol === 'DOCENTE' && (!user.docente_id || !user.docente_activo)) {
      req.session.destroy(() => {});
      return next(new AppError(403, 'El perfil docente se encuentra desactivado.'));
    }

    req.user = {
      id: user.id,
      correo: user.correo,
      nombres: user.nombres,
      apellidos: user.apellidos,
      rol: user.rol,
      docenteId: user.docente_id || null,
      esAdministrador: Boolean(user.es_administrador)
    };

    return next();
  } catch (error) {
    return next(error);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, 'Autenticación requerida.'));
    }
    if (!allowedRoles.includes(req.user.rol)) {
      return next(new AppError(403, 'No tienes permisos para acceder a este recurso.'));
    }
    return next();
  };
}

function requireDocenteAdmin(req, res, next) {
  if (!req.user) {
    return next(new AppError(401, 'Autenticación requerida.'));
  }
  if (req.user.rol !== 'DOCENTE' || !req.user.esAdministrador) {
    return next(new AppError(403, 'Esta acción requiere permisos de docente administrador.'));
  }
  return next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireDocenteAdmin
};
