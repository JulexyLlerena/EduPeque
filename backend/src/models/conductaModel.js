const { getPool, withTransaction } = require('../config/database');

async function listCategoriasActivas() {
  const pool = getPool();
  const [rows] = await pool.query(
    'SELECT id, nombre, descripcion FROM categorias_conducta WHERE activa = TRUE ORDER BY id ASC'
  );
  return rows;
}

async function getAulaKpis(aulaId) {
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT
       (SELECT COUNT(DISTINCT m.alumno_id)
        FROM matriculas m
        INNER JOIN alumnos al ON al.id = m.alumno_id
        WHERE m.aula_id = ? AND m.estado = 'ACTIVA' AND al.activo = TRUE) AS alumnos_en_aula,
       (SELECT COUNT(*)
        FROM registros_conducta rc
        WHERE rc.aula_id = ? AND DATE(rc.fecha_registro) = CURDATE()) AS registros_hoy,
       (SELECT COUNT(DISTINCT sd.alumno_id)
        FROM seguimientos_dece sd
        INNER JOIN matriculas m ON m.alumno_id = sd.alumno_id AND m.estado = 'ACTIVA'
        INNER JOIN alumnos al ON al.id = m.alumno_id AND al.activo = TRUE
        WHERE m.aula_id = ? AND sd.estado IN ('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO')) AS en_seguimiento`,
    [aulaId, aulaId, aulaId]
  );

  const row = rows[0] || {};
  return {
    alumnosEnAula: Number(row.alumnos_en_aula || 0),
    registrosHoy: Number(row.registros_hoy || 0),
    enSeguimiento: Number(row.en_seguimiento || 0)
  };
}

async function createRegistroConducta({
  alumnoId,
  aulaId,
  docenteId,
  categoriaId,
  puntaje,
  observacion,
  requiereSeguimientoDece,
  fechaRegistro
}) {
  return withTransaction(async (connection) => {
    const [res] = await connection.query(
      `INSERT INTO registros_conducta
       (alumno_id, aula_id, docente_id, categoria_id, puntaje, observacion, requiere_seguimiento_dece, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, NOW()))`,
      [
        alumnoId,
        aulaId,
        docenteId,
        categoriaId,
        puntaje,
        observacion,
        Boolean(requiereSeguimientoDece),
        fechaRegistro || null
      ]
    );

    const registroId = res.insertId;

    if (requiereSeguimientoDece) {
      const [existingCases] = await connection.query(
        `SELECT id FROM seguimientos_dece
         WHERE alumno_id = ? AND estado IN ('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO')
         LIMIT 1`,
        [alumnoId]
      );

      if (existingCases.length > 0) {
        await connection.query(
          'UPDATE seguimientos_dece SET ultimo_registro_id = ? WHERE id = ?',
          [registroId, existingCases[0].id]
        );
      } else {
        await connection.query(
          `INSERT INTO seguimientos_dece (alumno_id, ultimo_registro_id, estado)
           VALUES (?, ?, 'PENDIENTE_REVISION')`,
          [alumnoId, registroId]
        );
      }
    }

    return registroId;
  });
}

async function getHistorialAlumno({
  alumnoId,
  fechaInicio = null,
  fechaFin = null,
  categoriaId = null,
  page = 1,
  pageSize = 4
}) {
  const pool = getPool();
  const whereClauses = ['rc.alumno_id = ?'];
  const params = [alumnoId];

  if (fechaInicio) {
    whereClauses.push('DATE(rc.fecha_registro) >= ?');
    params.push(fechaInicio);
  }
  if (fechaFin) {
    whereClauses.push('DATE(rc.fecha_registro) <= ?');
    params.push(fechaFin);
  }
  if (categoriaId) {
    whereClauses.push('rc.categoria_id = ?');
    params.push(categoriaId);
  }

  const whereSql = whereClauses.join(' AND ');
  const offset = (page - 1) * pageSize;

  const [kpiRows] = await pool.query(
    `SELECT
       COUNT(*) AS registros_totales,
       AVG(rc.puntaje) AS promedio_periodo,
       SUM(CASE WHEN rc.requiere_seguimiento_dece = TRUE THEN 1 ELSE 0 END) AS registros_con_seguimiento
     FROM registros_conducta rc
     WHERE ${whereSql}`,
    params
  );

  const [rows] = await pool.query(
    `SELECT rc.id, rc.puntaje, rc.observacion, rc.requiere_seguimiento_dece, rc.fecha_registro,
            cc.id AS categoria_id, cc.nombre AS categoria_nombre,
            CONCAT(u.nombres, ' ', u.apellidos) AS docente_nombre
     FROM registros_conducta rc
     INNER JOIN categorias_conducta cc ON cc.id = rc.categoria_id
     INNER JOIN docentes d ON d.id = rc.docente_id
     INNER JOIN usuarios u ON u.id = d.usuario_id
     WHERE ${whereSql}
     ORDER BY rc.fecha_registro DESC, rc.id DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const stats = kpiRows[0] || {};
  return {
    kpis: {
      registrosTotales: Number(stats.registros_totales || 0),
      promedioPeriodo: stats.promedio_periodo !== null ? Number(Number(stats.promedio_periodo).toFixed(1)) : 0,
      registrosConSeguimiento: Number(stats.registros_con_seguimiento || 0)
    },
    items: rows
  };
}

module.exports = {
  listCategoriasActivas,
  getAulaKpis,
  createRegistroConducta,
  getHistorialAlumno
};
