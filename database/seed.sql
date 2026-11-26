-- EduPeque | Datos semilla exclusivos de catálogos del sistema
-- IMPORTANTE: Este archivo NO contiene datos personales ni registros operativos ficticios.

USE edupeque;

-- Catálogo de los tres perfiles definidos en el prototipo
INSERT INTO roles (codigo, nombre, descripcion)
VALUES
  ('DOCENTE', 'Docente', 'Personal docente encargado de aulas, alumnos y registros de conducta'),
  ('REPRESENTANTE', 'Representante', 'Madre, padre o representante legal vinculado a sus hijos'),
  ('DECE', 'Equipo DECE', 'Personal del Departamento de Consejería Estudiantil')
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  descripcion = VALUES(descripcion);

-- Catálogo de categorías de conducta del prototipo
INSERT INTO categorias_conducta (nombre, descripcion, activa)
VALUES
  ('Convivencia', 'Interacción respetuosa, trabajo en equipo, espera de turnos y cuidado mutuo', TRUE),
  ('Autonomía', 'Iniciativa personal, organización de materiales y hábitos cotidianos', TRUE),
  ('Emociones', 'Reconocimiento, expresión saludable y regulación emocional', TRUE)
ON DUPLICATE KEY UPDATE
  descripcion = VALUES(descripcion),
  activa = VALUES(activa);

-- Catálogo estático del juego de memoria del prototipo
INSERT INTO juegos (codigo, nombre, habilidad, total_parejas, activo)
VALUES
  ('BOSQUE_PAREJAS', 'El bosque de las parejas', 'Memoria y atención', 3, TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  habilidad = VALUES(habilidad),
  total_parejas = VALUES(total_parejas),
  activo = VALUES(activo);
