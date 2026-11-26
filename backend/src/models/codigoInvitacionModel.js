const { getPool } = require('../config/database');

async function expireOutdatedCodes() {
  const pool = getPool();
  await pool.query(
    `UPDATE codigos_invitacion
     SET estado = 'VENCIDO'
     WHERE estado = 'ACTIVO' AND fecha_expiracion < NOW()`
  );
}

async function existsByCode(codigo) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id FROM codigos_invitacion WHERE codigo = ? LIMIT 1',
    [codigo]
  );
  return rows.length > 0;
}

async function createCode({ codigo, alumnoId, docenteId, fechaExpiracion }) {
  const pool = getPool();
  const [res] = await pool.query(
    `INSERT INTO codigos_invitacion (codigo, alumno_id, generado_por_docente_id, estado, fecha_expiracion)
     VALUES (?, ?, ?, 'ACTIVO', ?)`,
    [codigo, alumnoId, docenteId, fechaExpiracion]
  );
  return res.insertId;
}

async function findById(codigoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT id, codigo, alumno_id, generado_por_docente_id, estado, fecha_expiracion, fecha_uso, created_at
     FROM codigos_invitacion
     WHERE id = ?
     LIMIT 1`,
    [codigoId]
  );
  return rows[0] || null;
}

async function findByCode(codigo) {
  await expireOutdatedCodes();
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT ci.id, ci.codigo, ci.alumno_id, ci.estado, ci.fecha_expiracion, ci.fecha_uso,
            al.nombres AS alumno_nombres, al.apellidos AS alumno_apellidos
     FROM codigos_invitacion ci
     INNER JOIN alumnos al ON al.id = ci.alumno_id
     WHERE ci.codigo = ?
     LIMIT 1`,
    [codigo]
  );
  return rows[0] || null;
}

async function listForDocente({ docenteId, esAdministrador = false, alumnoId = null }) {
  await expireOutdatedCodes();
  const pool = getPool();
  const whereClauses = ['1=1'];
  const params = [];

  if (!esAdministrador) {
    whereClauses.push(
      `EXISTS (
        SELECT 1
        FROM matriculas m
        INNER JOIN asignaciones_docente ad ON ad.aula_id = m.aula_id AND ad.activo = TRUE
        WHERE m.alumno_id = ci.alumno_id AND m.estado = 'ACTIVA' AND ad.docente_id = ?
      )`
    );
    params.push(docenteId);
  }

  if (alumnoId) {
    whereClauses.push('ci.alumno_id = ?');
    params.push(alumnoId);
  }

  const [rows] = await pool.query(
    `SELECT ci.id, ci.codigo, ci.alumno_id, ci.estado, ci.fecha_expiracion, ci.fecha_uso, ci.created_at,
            CONCAT(al.nombres, ' ', al.apellidos) AS alumno_nombre,
            au.nombre AS aula_nombre,
            CONCAT(u.nombres, ' ', u.apellidos) AS generado_por
     FROM codigos_invitacion ci
     INNER JOIN alumnos al ON al.id = ci.alumno_id
     LEFT JOIN matriculas m ON m.alumno_id = al.id AND m.estado = 'ACTIVA'
     LEFT JOIN aulas au ON au.id = m.aula_id
     INNER JOIN docentes d ON d.id = ci.generado_por_docente_id
     INNER JOIN usuarios u ON u.id = d.usuario_id
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY ci.created_at DESC, ci.id DESC`,
    params
  );

  return rows;
}

async function revokeCode(codigoId) {
  const pool = getPool();
  const [res] = await pool.query(
    `UPDATE codigos_invitacion
     SET estado = 'REVOCADO'
     WHERE id = ? AND estado = 'ACTIVO'`,
    [codigoId]
  );
  return res.affectedRows > 0;
}

module.exports = {
  expireOutdatedCodes,
  existsByCode,
  createCode,
  findById,
  findByCode,
  listForDocente,
  revokeCode
};
