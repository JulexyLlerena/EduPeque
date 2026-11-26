const { getPool, withTransaction } = require('../config/database');

async function findByIdWithAula(alumnoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT al.id, al.nombres, al.apellidos, al.fecha_nacimiento,
            TIMESTAMPDIFF(YEAR, al.fecha_nacimiento, CURDATE()) AS edad,
            al.avatar_codigo, al.nivel_explorador, al.puntos_aventura, al.activo,
            m.id AS matricula_id, m.aula_id, m.fecha_matricula,
            au.nombre AS aula_nombre, au.nivel AS aula_nivel, au.periodo_lectivo,
            EXISTS (
              SELECT 1 FROM seguimientos_dece sd
              WHERE sd.alumno_id = al.id AND sd.estado IN ('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO')
            ) AS en_seguimiento
     FROM alumnos al
     LEFT JOIN matriculas m ON m.alumno_id = al.id AND m.estado = 'ACTIVA'
     LEFT JOIN aulas au ON au.id = m.aula_id AND au.activa = TRUE
     WHERE al.id = ?
     LIMIT 1`,
    [alumnoId]
  );
  return rows[0] || null;
}

async function isAlumnoInDocenteAulas(docenteId, alumnoId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT al.id
     FROM alumnos al
     INNER JOIN matriculas m ON m.alumno_id = al.id AND m.estado = 'ACTIVA'
     INNER JOIN aulas a ON a.id = m.aula_id AND a.activa = TRUE
     INNER JOIN asignaciones_docente ad ON ad.aula_id = a.id AND ad.activo = TRUE
     WHERE al.id = ? AND al.activo = TRUE AND ad.docente_id = ?
     LIMIT 1`,
    [alumnoId, docenteId]
  );
  return rows.length > 0;
}

async function findAlumnosByAula({ aulaId, search = '', filtro = 'todos', page = 1, pageSize = 6 }) {
  const pool = getPool();
  const whereClauses = ['m.aula_id = ?', "m.estado = 'ACTIVA'", 'al.activo = TRUE'];
  const params = [aulaId];

  if (search) {
    whereClauses.push("(CONCAT(al.nombres, ' ', al.apellidos) LIKE ?)");
    params.push(`%${search}%`);
  }

  if (filtro === 'seguimiento') {
    whereClauses.push(
      "EXISTS (SELECT 1 FROM seguimientos_dece sd WHERE sd.alumno_id = al.id AND sd.estado IN ('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO'))"
    );
  } else if (filtro === 'sin_novedades') {
    whereClauses.push(
      "NOT EXISTS (SELECT 1 FROM seguimientos_dece sd WHERE sd.alumno_id = al.id AND sd.estado IN ('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO'))"
    );
  }

  const whereSql = whereClauses.join(' AND ');
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query(
    `SELECT COUNT(DISTINCT al.id) AS total
     FROM alumnos al
     INNER JOIN matriculas m ON m.alumno_id = al.id
     WHERE ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT al.id, al.nombres, al.apellidos, al.fecha_nacimiento,
            TIMESTAMPDIFF(YEAR, al.fecha_nacimiento, CURDATE()) AS edad,
            al.avatar_codigo,
            COUNT(rc.id) AS total_registros,
            EXISTS (
              SELECT 1 FROM seguimientos_dece sd
              WHERE sd.alumno_id = al.id AND sd.estado IN ('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO')
            ) AS requiere_seguimiento
     FROM alumnos al
     INNER JOIN matriculas m ON m.alumno_id = al.id
     LEFT JOIN registros_conducta rc ON rc.alumno_id = al.id
     WHERE ${whereSql}
     GROUP BY al.id, al.nombres, al.apellidos, al.fecha_nacimiento, al.avatar_codigo
     ORDER BY al.apellidos ASC, al.nombres ASC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  return {
    total: Number(countRows[0]?.total || 0),
    items: rows
  };
}

async function findAllForAdmin() {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT al.id, al.nombres, al.apellidos, al.fecha_nacimiento,
            TIMESTAMPDIFF(YEAR, al.fecha_nacimiento, CURDATE()) AS edad,
            al.avatar_codigo, al.activo,
            m.id AS matricula_id, m.aula_id, m.fecha_matricula, m.estado AS matricula_estado,
            au.nombre AS aula_nombre, au.nivel AS aula_nivel
     FROM alumnos al
     LEFT JOIN matriculas m ON m.alumno_id = al.id AND m.estado = 'ACTIVA'
     LEFT JOIN aulas au ON au.id = m.aula_id
     ORDER BY al.activo DESC, al.apellidos ASC, al.nombres ASC`
  );
  return rows;
}

async function createAlumnoWithMatricula({
  nombres,
  apellidos,
  fechaNacimiento,
  avatarCodigo = 'menta',
  aulaId
}) {
  return withTransaction(async (connection) => {
    const [alumnoRes] = await connection.query(
      `INSERT INTO alumnos (nombres, apellidos, fecha_nacimiento, avatar_codigo, activo)
       VALUES (?, ?, ?, ?, TRUE)`,
      [nombres, apellidos, fechaNacimiento, avatarCodigo]
    );

    const alumnoId = alumnoRes.insertId;

    if (aulaId) {
      await connection.query(
        `INSERT INTO matriculas (alumno_id, aula_id, fecha_matricula, estado)
         VALUES (?, ?, CURDATE(), 'ACTIVA')`,
        [alumnoId, aulaId]
      );
    }

    return alumnoId;
  });
}

async function updateAlumno(alumnoId, { nombres, apellidos, fechaNacimiento, avatarCodigo }) {
  const pool = getPool();
  const [res] = await pool.query(
    `UPDATE alumnos
     SET nombres = ?, apellidos = ?, fecha_nacimiento = ?, avatar_codigo = ?
     WHERE id = ?`,
    [nombres, apellidos, fechaNacimiento, avatarCodigo || 'menta', alumnoId]
  );
  return res.affectedRows > 0;
}

async function setAlumnoStatus(alumnoId, activo) {
  const pool = getPool();
  const [res] = await pool.query('UPDATE alumnos SET activo = ? WHERE id = ?', [Boolean(activo), alumnoId]);
  return res.affectedRows > 0;
}

async function upsertActiveMatricula(alumnoId, aulaId) {
  return withTransaction(async (connection) => {
    await connection.query(
      "UPDATE matriculas SET estado = 'FINALIZADA' WHERE alumno_id = ? AND estado = 'ACTIVA'",
      [alumnoId]
    );

    const [res] = await connection.query(
      `INSERT INTO matriculas (alumno_id, aula_id, fecha_matricula, estado)
       VALUES (?, ?, CURDATE(), 'ACTIVA')`,
      [alumnoId, aulaId]
    );

    return res.insertId;
  });
}

module.exports = {
  findByIdWithAula,
  isAlumnoInDocenteAulas,
  findAlumnosByAula,
  findAllForAdmin,
  createAlumnoWithMatricula,
  updateAlumno,
  setAlumnoStatus,
  upsertActiveMatricula
};
