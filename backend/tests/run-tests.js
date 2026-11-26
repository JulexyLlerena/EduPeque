const assert = require('node:assert/strict');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');

const { generateInvitationCode } = require('../src/utils/codeGenerator');
const {
  isValidEmail,
  isValidDateString,
  isValidInvitationCode,
  isStrongPassword,
  parsePositiveInt
} = require('../src/utils/validators');
const { requireDocenteAdmin, requireRole } = require('../src/middleware/authMiddleware');
const { errorHandler } = require('../src/middleware/errorHandler');

const usuarioModel = require('../src/models/usuarioModel');
const aulaModel = require('../src/models/aulaModel');
const alumnoModel = require('../src/models/alumnoModel');
const conductaModel = require('../src/models/conductaModel');
const codigoInvitacionModel = require('../src/models/codigoInvitacionModel');
const docenteModel = require('../src/models/docenteModel');

const authService = require('../src/services/authService');
const docenteService = require('../src/services/docenteService');
const adminDocenteService = require('../src/services/adminDocenteService');
const docenteRoutes = require('../src/routes/docenteRoutes');
const database = require('../src/config/database');

async function runTests() {
  const results = [];

  async function test(name, fn) {
    try {
      await fn();
      results.push({ name, ok: true });
      console.log(`PASS: ${name}`);
    } catch (error) {
      results.push({ name, ok: false, error });
      console.error(`FAIL: ${name} -> ${error.message}`);
      throw error;
    }
  }

  // 1. Validadores y generador de códigos
  await test('Validadores de entrada y generación de códigos de 8 caracteres', async () => {
    assert.equal(isValidEmail('docente@edupeque.edu'), true);
    assert.equal(isValidEmail('invalido@'), false);
    assert.equal(isValidDateString('2026-05-20'), true);
    assert.equal(isValidDateString('2026-02-30'), false);
    assert.equal(parsePositiveInt('5'), 5);
    assert.equal(parsePositiveInt('-1'), null);
    assert.equal(isStrongPassword('Segura123'), true);
    assert.equal(isStrongPassword('1234'), false);

    const code = generateInvitationCode();
    assert.equal(code.length, 8);
    assert.equal(isValidInvitationCode(code), true);
  });

  // 2. Autenticación bcrypt y bloqueo de perfiles prototipo
  await test('Autenticación con bcrypt y control de perfiles', async () => {
    const hash = await bcrypt.hash('ClavePrueba#2026', 10);
    const originalFind = usuarioModel.findByEmailWithRole;
    const originalUpdate = usuarioModel.updateLastAccess;

    usuarioModel.findByEmailWithRole = async (correo) => {
      if (correo === 'docente@test.local') {
        return {
          id: 10,
          correo,
          password_hash: hash,
          nombres: 'Docente',
          apellidos: 'Prueba',
          activo: 1,
          rol: 'DOCENTE',
          docente_id: 2,
          es_administrador: 0,
          docente_activo: 1
        };
      }
      return null;
    };
    usuarioModel.updateLastAccess = async () => {};

    try {
      const user = await authService.login({
        correo: 'docente@test.local',
        password: 'ClavePrueba#2026',
        rolEsperado: 'DOCENTE'
      });
      assert.equal(user.rol, 'DOCENTE');
      assert.equal(user.esAdministrador, false);

      await assert.rejects(
        () => authService.login({ correo: 'docente@test.local', password: 'Incorrecta', rolEsperado: 'DOCENTE' }),
        { statusCode: 401 }
      );

      await assert.rejects(
        () => authService.login({ correo: 'fam@test.local', password: 'Clave', rolEsperado: 'REPRESENTANTE' }),
        { statusCode: 501 }
      );
    } finally {
      usuarioModel.findByEmailWithRole = originalFind;
      usuarioModel.updateLastAccess = originalUpdate;
    }
  });

  // 3. Control de permisos docente normal vs docente administrador
  await test('Control de permisos entre docente normal y docente administrador', async () => {
    const normalUser = { id: 10, rol: 'DOCENTE', docenteId: 2, esAdministrador: false };
    const adminUser = { id: 1, rol: 'DOCENTE', docenteId: 1, esAdministrador: true };

    let nextErr = null;
    requireDocenteAdmin({ user: normalUser }, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr.statusCode, 403);

    nextErr = null;
    requireDocenteAdmin({ user: adminUser }, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr, undefined);

    nextErr = null;
    requireRole('DOCENTE')({ user: { rol: 'REPRESENTANTE' } }, {}, (err) => {
      nextErr = err;
    });
    assert.equal(nextErr.statusCode, 403);
  });

  // 4. Restricciones de acceso a aulas y alumnos no asignados
  await test('Restricción de acceso a alumnos fuera de aulas asignadas', async () => {
    const originalFindAlumno = alumnoModel.findByIdWithAula;
    const originalInAulas = alumnoModel.isAlumnoInDocenteAulas;

    alumnoModel.findByIdWithAula = async () => ({ id: 99, activo: 1, aula_id: 3, nombres: 'A', apellidos: 'B' });
    alumnoModel.isAlumnoInDocenteAulas = async () => false;

    try {
      await assert.rejects(
        () => docenteService.getHistorialAlumno({ docenteId: 2, esAdministrador: false }, '99', {}),
        { statusCode: 403 }
      );

      await assert.rejects(
        () => docenteService.generarCodigoVinculacion({ docenteId: 2, esAdministrador: false }, { alumnoId: 99 }),
        { statusCode: 403 }
      );
    } finally {
      alumnoModel.findByIdWithAula = originalFindAlumno;
      alumnoModel.isAlumnoInDocenteAulas = originalInAulas;
    }
  });

  // 5. Registro de conducta, historial y filtros de fecha
  await test('Registro de conducta y validación de filtros de historial', async () => {
    const originalCats = conductaModel.listCategoriasActivas;
    const originalFindAlumno = alumnoModel.findByIdWithAula;
    const originalInAulas = alumnoModel.isAlumnoInDocenteAulas;
    const originalCreate = conductaModel.createRegistroConducta;

    conductaModel.listCategoriasActivas = async () => [{ id: 1, nombre: 'Convivencia' }];
    alumnoModel.findByIdWithAula = async () => ({ id: 5, activo: 1, aula_id: 2 });
    alumnoModel.isAlumnoInDocenteAulas = async () => true;
    conductaModel.createRegistroConducta = async () => 77;

    try {
      const created = await docenteService.crearRegistroConducta(
        { docenteId: 2, esAdministrador: false },
        {
          alumnoId: 5,
          categoriaId: 1,
          puntaje: 4,
          observacion: 'Compartió materiales en clase.',
          requiereSeguimientoDece: true
        }
      );
      assert.equal(created.id, 77);

      await assert.rejects(
        () =>
          docenteService.getHistorialAlumno(
            { docenteId: 2, esAdministrador: false },
            '5',
            { fechaInicio: '2026-05-20', fechaFin: '2026-05-01' }
          ),
        { statusCode: 400 }
      );
    } finally {
      conductaModel.listCategoriasActivas = originalCats;
      alumnoModel.findByIdWithAula = originalFindAlumno;
      alumnoModel.isAlumnoInDocenteAulas = originalInAulas;
      conductaModel.createRegistroConducta = originalCreate;
    }
  });

  // 6. Validación de códigos vencidos / usados / revocados y fecha futura en updateAlumno
  await test('Validación de códigos de vinculación y fecha de nacimiento en actualización', async () => {
    const originalFindByCode = codigoInvitacionModel.findByCode;

    codigoInvitacionModel.findByCode = async () => ({
      id: 1,
      codigo: 'ABCD2345',
      estado: 'USADO',
      fecha_expiracion: new Date(Date.now() + 86400000)
    });

    try {
      await assert.rejects(() => docenteService.validarCodigoVinculacion('ABCD2345'), {
        statusCode: 409
      });
    } finally {
      codigoInvitacionModel.findByCode = originalFindByCode;
    }

    await assert.rejects(
      () =>
        adminDocenteService.updateAlumno('1', {
          nombres: 'Nombre',
          apellidos: 'Apellido',
          fechaNacimiento: '2099-01-01'
        }),
      { statusCode: 400 }
    );
  });

  // 7. Pruebas HTTP de Express + Helmet + rutas protegidas
  await test('Rutas HTTP protegidas y cabeceras de seguridad Helmet', async () => {
    const originalAulas = aulaModel.findAllForAdmin;
    const originalPanel = aulaModel.findAssignedToDocente;
    const originalDocentes = docenteModel.findAll;
    const originalGetPool = database.getPool;

    database.getPool = () => ({
      query: async () => [[
        {
          id: 2,
          correo: 'docente@test.local',
          nombres: 'Docente',
          apellidos: 'Normal',
          activo: 1,
          rol: 'DOCENTE',
          docente_id: 2,
          es_administrador: 0,
          docente_activo: 1
        }
      ]]
    });
    aulaModel.findAllForAdmin = async () => [];
    aulaModel.findAssignedToDocente = async () => [];
    docenteModel.findAll = async () => [];

    const app = express();
    app.use(helmet());
    app.use(express.json());
    app.use(session({ secret: 'test-session-secret-1234', resave: false, saveUninitialized: false }));
    app.post('/test-session', (req, res) => {
      req.session.user = req.body;
      res.json({ ok: true });
    });
    app.use('/api/docente', docenteRoutes);
    app.use(errorHandler);

    const server = await new Promise((resolve) => {
      const s = app.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
      const { port } = server.address();
      const baseUrl = `http://127.0.0.1:${port}`;

      const unauthRes = await fetch(`${baseUrl}/api/docente/panel`);
      assert.equal(unauthRes.status, 401);
      assert.equal(unauthRes.headers.get('x-content-type-options'), 'nosniff');

      const sessionRes = await fetch(`${baseUrl}/test-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 2, rol: 'DOCENTE', docenteId: 2, esAdministrador: false })
      });
      const cookie = sessionRes.headers.get('set-cookie').split(';')[0];

      // Docente normal intentando acceder a endpoint administrativo -> 403
      const forbiddenRes = await fetch(`${baseUrl}/api/docente/admin/aulas`, {
        headers: { Cookie: cookie }
      });
      assert.equal(forbiddenRes.status, 403);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      database.getPool = originalGetPool;
      aulaModel.findAllForAdmin = originalAulas;
      aulaModel.findAssignedToDocente = originalPanel;
      docenteModel.findAll = originalDocentes;
    }
  });

  console.log(`\nResumen: ${results.filter((r) => r.ok).length}/${results.length} pruebas unitarias/HTTP aprobadas.`);
}

runTests().catch(() => {
  process.exit(1);
});
