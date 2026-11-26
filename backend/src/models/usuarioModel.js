const { getPool } = require('../config/database');

async function findByEmailWithRole(correo) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT u.id, u.correo, u.password_hash, u.nombres, u.apellidos, u.activo,
            r.codigo AS rol,
            d.id AS docente_id, d.es_administrador, d.especialidad, d.activo AS docente_activo
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     LEFT JOIN docentes d ON d.usuario_id = u.id
     WHERE u.correo = ?
     LIMIT 1`,
    [correo]
  );
  return rows[0] || null;
}

async function updateLastAccess(usuarioId) {
  const pool = getPool();
  await pool.query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?', [usuarioId]);
}

module.exports = {
  findByEmailWithRole,
  updateLastAccess
};
