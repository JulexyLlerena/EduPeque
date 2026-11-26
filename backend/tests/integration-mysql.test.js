/**
 * Pruebas de integración reales contra MySQL Community Server 8.4.13 (localhost:3307).
 * Requiere archivo .env válido, esquema ejecutado (db:setup) y docente administrador inicializado.
 * Limpia los registros temporales creados al finalizar la ejecución.
 */
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { validateEnv } = require('../src/config/env');
const { getPool, testConnection, closePool } = require('../src/config/database');
const docenteModel = require('../src/models/docenteModel');
const adminDocenteService = require('../src/services/adminDocenteService');
const docenteService = require('../src/services/docenteService');
const authService = require('../src/services/authService');

async function runMySQLIntegration() {
  validateEnv();
  const ok = await testConnection();
  assert.equal(ok, true);
  console.log('PASS: Conexión al pool MySQL en puerto configurado');

  const pool = getPool();
  const [roles] = await pool.query('SELECT codigo FROM roles ORDER BY id ASC');
  assert.deepEqual(
    roles.map((r) => r.codigo),
    ['DOCENTE', 'REPRESENTANTE', 'DECE']
  );
  console.log('PASS: Catálogo de 3 roles verificado en MySQL');

  const [cats] = await pool.query('SELECT nombre FROM categorias_conducta WHERE activa = TRUE');
  assert.ok(cats.length >= 3);
  console.log('PASS: Catálogo de categorías de conducta verificado en MySQL');

  const adminExists = await docenteModel.hasAnyAdmin();
  assert.equal(adminExists, true, 'Debe existir un docente administrador inicializado.');

  // Prueba transaccional aislada con rollback manual mediante limpieza por prefijo único
  const suffix = Date.now();
  const tempEmail = `test.docente.${suffix}@edupeque.local`;
  const tempPass = `TempPass#${suffix}`;

  let createdDocente = null;
  let createdAula = null;
  let createdAlumno = null;

  try {
    createdDocente = await adminDocenteService.createDocente({
      nombres: 'Prueba',
      apellidos: 'Integracion',
      correo: tempEmail,
      password: tempPass,
      especialidad: 'Inicial',
      esAdministrador: false
    });

    const logged = await authService.login({
      correo: tempEmail,
      password: tempPass,
      rolEsperado: 'DOCENTE'
    });
    assert.equal(logged.esAdministrador, false);
    assert.equal(await bcrypt.compare(tempPass, (await pool.query('SELECT password_hash FROM usuarios WHERE id = ?', [logged.id]))[0][0].password_hash), true);
    console.log('PASS: Login con bcrypt contra MySQL');

    createdAula = await adminDocenteService.createAula({
      nombre: `Aula Test ${suffix}`,
      nivel: 'Inicial 2',
      periodoLectivo: '2026',
      capacidad: 15
    });

    await adminDocenteService.assignDocente({
      docenteId: createdDocente.id,
      aulaId: createdAula.id,
      esTitular: true
    });

    createdAlumno = await adminDocenteService.createAlumno({
      nombres: 'Alumno',
      apellidos: `Prueba${suffix}`,
      fechaNacimiento: '2022-04-10',
      avatarCodigo: 'menta',
      aulaId: createdAula.id
    });

    const normalUser = { docenteId: createdDocente.id, esAdministrador: false };
    const panel = await docenteService.getPanelData(normalUser, { aulaId: createdAula.id });
    assert.equal(panel.kpis.alumnosEnAula, 1);

    const reg = await docenteService.crearRegistroConducta(normalUser, {
      alumnoId: createdAlumno.id,
      categoriaId: 1,
      puntaje: 5,
      observacion: 'Registro de integración verificado en MySQL.',
      requiereSeguimientoDece: false
    });
    assert.ok(reg.id > 0);

    const hist = await docenteService.getHistorialAlumno(normalUser, String(createdAlumno.id), {});
    assert.equal(hist.kpis.registrosTotales, 1);

    const code = await docenteService.generarCodigoVinculacion(normalUser, {
      alumnoId: createdAlumno.id,
      diasVigencia: 7
    });
    const validated = await docenteService.validarCodigoVinculacion(code.codigo);
    assert.equal(validated.valido, true);
    console.log('PASS: Flujo completo docente (aulas, asignaciones, alumnos, conducta, códigos) en MySQL');
  } finally {
    if (createdAlumno) {
      await pool.query('DELETE FROM codigos_invitacion WHERE alumno_id = ?', [createdAlumno.id]);
      await pool.query('DELETE FROM registros_conducta WHERE alumno_id = ?', [createdAlumno.id]);
      await pool.query('DELETE FROM matriculas WHERE alumno_id = ?', [createdAlumno.id]);
      await pool.query('DELETE FROM alumnos WHERE id = ?', [createdAlumno.id]);
    }
    if (createdDocente && createdAula) {
      await pool.query('DELETE FROM asignaciones_docente WHERE docente_id = ? AND aula_id = ?', [
        createdDocente.id,
        createdAula.id
      ]);
    }
    if (createdAula) {
      await pool.query('DELETE FROM aulas WHERE id = ?', [createdAula.id]);
    }
    if (createdDocente) {
      const uid = createdDocente.usuario_id;
      await pool.query('DELETE FROM docentes WHERE id = ?', [createdDocente.id]);
      await pool.query('DELETE FROM usuarios WHERE id = ?', [uid]);
    }
    await closePool();
  }
}

runMySQLIntegration().catch((error) => {
  console.error('Error en integración MySQL:', error.message);
  process.exit(1);
});
