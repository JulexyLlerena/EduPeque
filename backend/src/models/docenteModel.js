const { getPool, withTransaction } = require('../config/database');

async function findAll() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT d.id, d.usuario_id, d.es_administrador, d.especialidad, d.telefono_contacto,
            d.activo AS docente_activo,
            u.correo, u.nombres, u.apellidos, u.activo AS usuario_activo, u.ultimo_acceso,
            COUNT(DISTINCT CASE WHEN ad.activo = TRUE THEN ad.aula_id END) AS total_aulas
     FROM docentes d
     INNER JOIN usuarios u ON u.id = d.usuario_id
     LEFT JOIN asignaciones_docente ad ON ad.docente_id = d.id
     GROUP BY d.id, d.usuario_id, d.es_administrador, d.especialidad, d.telefono_contacto,
              d.activo, u.correo, u.nombres, u.apellidos, u.activo, u.ultimo_acceso
     ORDER BY d.es_administrador DESC, u.apellidos ASC, u.nombres ASC`
  );
  return rows;
}

async function findById(docenteId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT d.id, d.usuario_id, d.es_administrador, d.especialidad, d.telefono_contacto,
            d.activo AS docente_activo,
            u.correo, u.nombres, u.apellidos, u.activo AS usuario_activo
     FROM docentes d
     INNER JOIN usuarios u ON u.id = d.usuario_id
     WHERE d.id = ?
     LIMIT 1`,
    [docenteId]
  );
  return rows[0] || null;
}

async function hasAnyAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT d.id
     FROM docentes d
     INNER JOIN usuarios u ON u.id = d.usuario_id
     WHERE d.es_administrador = TRUE AND d.activo = TRUE AND u.activo = TRUE
     LIMIT 1`
  );
  return rows.length > 0;
}

async function createDocente({
  correo,
  passwordHash,
  nombres,
  apellidos,
  especialidad,
  telefonoContacto,
  esAdministrador = false
}) {
  return withTransaction(async (connection) => {
    const [roleRows] = await connection.query(
      "SELECT id FROM roles WHERE codigo = 'DOCENTE' LIMIT 1"
    );
    if (roleRows.length === 0) {
      throw new Error('El rol DOCENTE no existe en el catálogo.');
    }

    const [userRes] = await connection.query(
      `INSERT INTO usuarios (rol_id, correo, password_hash, nombres, apellidos, activo)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [roleRows[0].id, correo, passwordHash, nombres, apellidos]
    );

    const [docRes] = await connection.query(
      `INSERT INTO docentes (usuario_id, es_administrador, especialidad, telefono_contacto, activo)
       VALUES (?, ?, ?, ?, TRUE)`,
      [userRes.insertId, Boolean(esAdministrador), especialidad || null, telefonoContacto || null]
    );

    return docRes.insertId;
  });
}

async function updateDocente(docenteId, { nombres, apellidos, especialidad, telefonoContacto }) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      'SELECT usuario_id FROM docentes WHERE id = ? LIMIT 1',
      [docenteId]
    );
    if (rows.length === 0) {
      return false;
    }

    await connection.query(
      'UPDATE usuarios SET nombres = ?, apellidos = ? WHERE id = ?',
      [nombres, apellidos, rows[0].usuario_id]
    );

    await connection.query(
      'UPDATE docentes SET especialidad = ?, telefono_contacto = ? WHERE id = ?',
      [especialidad || null, telefonoContacto || null, docenteId]
    );

    return true;
  });
}

async function setDocenteStatus(docenteId, activo) {
  return withTransaction(async (connection) => {
    const [rows] = await connection.query(
      'SELECT usuario_id FROM docentes WHERE id = ? LIMIT 1',
      [docenteId]
    );
    if (rows.length === 0) {
      return false;
    }

    await connection.query('UPDATE docentes SET activo = ? WHERE id = ?', [Boolean(activo), docenteId]);
    await connection.query('UPDATE usuarios SET activo = ? WHERE id = ?', [Boolean(activo), rows[0].usuario_id]);
    return true;
  });
}

module.exports = {
  findAll,
  findById,
  hasAnyAdmin,
  createDocente,
  updateDocente,
  setDocenteStatus
};
