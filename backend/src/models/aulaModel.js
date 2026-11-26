const { getPool } = require('../config/database');

async function findAllForAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT a.id, a.nombre, a.nivel, a.periodo_lectivo, a.capacidad, a.activa,
            COUNT(DISTINCT CASE WHEN m.estado = 'ACTIVA' THEN m.alumno_id END) AS total_alumnos,
            GROUP_CONCAT(
              DISTINCT CASE WHEN ad.activo = TRUE
                THEN CONCAT(u.nombres, ' ', u.apellidos)
              END
              ORDER BY u.apellidos ASC
              SEPARATOR ', '
            ) AS docentes_asignados
     FROM aulas a
     LEFT JOIN matriculas m ON m.aula_id = a.id
     LEFT JOIN asignaciones_docente ad ON ad.aula_id = a.id
     LEFT JOIN docentes d ON d.id = ad.docente_id AND d.activo = TRUE
     LEFT JOIN usuarios u ON u.id = d.usuario_id
     GROUP BY a.id, a.nombre, a.nivel, a.periodo_lectivo, a.capacidad, a.activa
     ORDER BY a.activa DESC, a.periodo_lectivo DESC, a.nombre ASC`
  );
  return rows;
}

async function findAssignedToDocente(docenteId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT a.id, a.nombre, a.nivel, a.periodo_lectivo, a.capacidad, a.activa,
            ad.es_titular, ad.fecha_asignacion,
            COUNT(DISTINCT CASE WHEN m.estado = 'ACTIVA' AND al.activo = TRUE THEN m.alumno_id END) AS total_alumnos
     FROM asignaciones_docente ad
     INNER JOIN aulas a ON a.id = ad.aula_id
     LEFT JOIN matriculas m ON m.aula_id = a.id
     LEFT JOIN alumnos al ON al.id = m.alumno_id
     WHERE ad.docente_id = ? AND ad.activo = TRUE AND a.activa = TRUE
     GROUP BY a.id, a.nombre, a.nivel, a.periodo_lectivo, a.capacidad, a.activa,
              ad.es_titular, ad.fecha_asignacion
     ORDER BY a.nombre ASC`,
    [docenteId]
  );
  return rows;
}

async function findById(aulaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, nombre, nivel, periodo_lectivo, capacidad, activa FROM aulas WHERE id = ? LIMIT 1',
    [aulaId]
  );
  return rows[0] || null;
}

async function isDocenteAssignedToAula(docenteId, aulaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT ad.id
     FROM asignaciones_docente ad
     INNER JOIN aulas a ON a.id = ad.aula_id
     WHERE ad.docente_id = ? AND ad.aula_id = ? AND ad.activo = TRUE AND a.activa = TRUE
     LIMIT 1`,
    [docenteId, aulaId]
  );
  return rows.length > 0;
}

async function createAula({ nombre, nivel, periodoLectivo, capacidad }) {
  const pool = getPool();
  const [res] = await pool.query(
    `INSERT INTO aulas (nombre, nivel, periodo_lectivo, capacidad, activa)
     VALUES (?, ?, ?, ?, TRUE)`,
    [nombre, nivel, periodoLectivo, capacidad || null]
  );
  return res.insertId;
}

async function updateAula(aulaId, { nombre, nivel, periodoLectivo, capacidad }) {
  const pool = getPool();
  const [res] = await pool.query(
    `UPDATE aulas
     SET nombre = ?, nivel = ?, periodo_lectivo = ?, capacidad = ?
     WHERE id = ?`,
    [nombre, nivel, periodoLectivo, capacidad || null, aulaId]
  );
  return res.affectedRows > 0;
}

async function setAulaStatus(aulaId, activa) {
  const pool = getPool();
  const [res] = await pool.query('UPDATE aulas SET activa = ? WHERE id = ?', [Boolean(activa), aulaId]);
  return res.affectedRows > 0;
}

async function listAsignaciones() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT ad.id, ad.docente_id, ad.aula_id, ad.es_titular, ad.fecha_asignacion, ad.activo,
            CONCAT(u.nombres, ' ', u.apellidos) AS docente_nombre,
            u.correo AS docente_correo,
            a.nombre AS aula_nombre, a.nivel AS aula_nivel, a.periodo_lectivo
     FROM asignaciones_docente ad
     INNER JOIN docentes d ON d.id = ad.docente_id
     INNER JOIN usuarios u ON u.id = d.usuario_id
     INNER JOIN aulas a ON a.id = ad.aula_id
     ORDER BY ad.activo DESC, a.nombre ASC, u.apellidos ASC`
  );
  return rows;
}

async function assignDocenteToAula({ docenteId, aulaId, esTitular = true }) {
  const pool = getPool();
  await pool.query(
    `INSERT INTO asignaciones_docente (docente_id, aula_id, es_titular, fecha_asignacion, activo)
     VALUES (?, ?, ?, CURDATE(), TRUE)
     ON DUPLICATE KEY UPDATE
       es_titular = VALUES(es_titular),
       fecha_asignacion = CURDATE(),
       activo = TRUE`,
    [docenteId, aulaId, Boolean(esTitular)]
  );
}

async function setAsignacionStatus(asignacionId, activo) {
  const pool = getPool();
  const [res] = await pool.query(
    'UPDATE asignaciones_docente SET activo = ? WHERE id = ?',
    [Boolean(activo), asignacionId]
  );
  return res.affectedRows > 0;
}

module.exports = {
  findAllForAdmin,
  findAssignedToDocente,
  findById,
  isDocenteAssignedToAula,
  createAula,
  updateAula,
  setAulaStatus,
  listAsignaciones,
  assignDocenteToAula,
  setAsignacionStatus
};
