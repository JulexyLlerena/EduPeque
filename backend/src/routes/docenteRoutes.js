const express = require('express');
const docenteController = require('../controllers/docenteController');
const adminDocenteController = require('../controllers/adminDocenteController');
const {
  requireAuth,
  requireRole,
  requireDocenteAdmin
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth, requireRole('DOCENTE'));

// Rutas operativas para docentes (validadas por aulas asignadas)
router.get('/panel', docenteController.getPanel);
router.get('/categorias', docenteController.getCategorias);
router.get('/alumnos', docenteController.getAlumnosDisponibles);
router.get('/alumnos/:alumnoId/historial', docenteController.getHistorialAlumno);
router.post('/conducta', docenteController.crearConducta);

// Códigos de vinculación familiar
router.get('/codigos', docenteController.listarCodigos);
router.post('/codigos', docenteController.generarCodigo);
router.patch('/codigos/:codigoId/revocar', docenteController.revocarCodigo);
router.get('/codigos/validar/:codigo', docenteController.validarCodigo);

// Rutas administrativas exclusivas para docente administrador
router.get('/admin/docentes', requireDocenteAdmin, adminDocenteController.listDocentes);
router.post('/admin/docentes', requireDocenteAdmin, adminDocenteController.createDocente);
router.put('/admin/docentes/:docenteId', requireDocenteAdmin, adminDocenteController.updateDocente);
router.patch('/admin/docentes/:docenteId/estado', requireDocenteAdmin, adminDocenteController.toggleDocenteStatus);

router.get('/admin/aulas', requireDocenteAdmin, adminDocenteController.listAulas);
router.post('/admin/aulas', requireDocenteAdmin, adminDocenteController.createAula);
router.put('/admin/aulas/:aulaId', requireDocenteAdmin, adminDocenteController.updateAula);
router.patch('/admin/aulas/:aulaId/estado', requireDocenteAdmin, adminDocenteController.toggleAulaStatus);

router.get('/admin/asignaciones', requireDocenteAdmin, adminDocenteController.listAsignaciones);
router.post('/admin/asignaciones', requireDocenteAdmin, adminDocenteController.assignDocente);
router.patch('/admin/asignaciones/:asignacionId/estado', requireDocenteAdmin, adminDocenteController.toggleAsignacionStatus);

router.get('/admin/alumnos', requireDocenteAdmin, adminDocenteController.listAlumnos);
router.post('/admin/alumnos', requireDocenteAdmin, adminDocenteController.createAlumno);
router.put('/admin/alumnos/:alumnoId', requireDocenteAdmin, adminDocenteController.updateAlumno);
router.patch('/admin/alumnos/:alumnoId/estado', requireDocenteAdmin, adminDocenteController.toggleAlumnoStatus);
router.put('/admin/alumnos/:alumnoId/matricula', requireDocenteAdmin, adminDocenteController.matricularAlumno);

module.exports = router;
