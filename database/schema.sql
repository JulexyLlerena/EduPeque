-- EduPeque | Esquema Relacional MySQL Community Server 8.4.13
-- Motor: InnoDB | Codificación: utf8mb4
-- Regla de privacidad: Sin datos personales ni registros operativos ficticios.

CREATE DATABASE IF NOT EXISTS edupeque
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edupeque;

-- ---------------------------------------------------------------------------
-- 1. Seguridad, roles y perfiles (3 perfiles: DOCENTE, REPRESENTANTE, DECE)
--    El administrador es un docente con es_administrador = TRUE.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  nombre VARCHAR(60) NOT NULL,
  descripcion VARCHAR(200) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  rol_id TINYINT UNSIGNED NOT NULL,
  correo VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  ultimo_acceso DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_correo (correo),
  KEY idx_usuarios_rol_activo (rol_id, activo),
  CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS docentes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  es_administrador BOOLEAN NOT NULL DEFAULT FALSE,
  especialidad VARCHAR(100) NULL,
  telefono_contacto VARCHAR(20) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_docentes_usuario (usuario_id),
  KEY idx_docentes_admin_activo (es_administrador, activo),
  CONSTRAINT fk_docentes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS representantes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  telefono_contacto VARCHAR(20) NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_representantes_usuario (usuario_id),
  CONSTRAINT fk_representantes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personal_dece (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT UNSIGNED NOT NULL,
  cargo VARCHAR(100) NOT NULL DEFAULT 'Orientación y Bienestar',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_personal_dece_usuario (usuario_id),
  CONSTRAINT fk_personal_dece_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. Estructura escolar, aulas, asignaciones y alumnado
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS aulas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(80) NOT NULL,
  nivel VARCHAR(50) NOT NULL,
  periodo_lectivo VARCHAR(30) NOT NULL,
  capacidad SMALLINT UNSIGNED NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_aulas_nombre_periodo (nombre, periodo_lectivo),
  KEY idx_aulas_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS asignaciones_docente (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  docente_id BIGINT UNSIGNED NOT NULL,
  aula_id BIGINT UNSIGNED NOT NULL,
  es_titular BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_asignacion DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_asignacion_docente_aula (docente_id, aula_id),
  KEY idx_asignacion_aula_activo (aula_id, activo),
  CONSTRAINT fk_asignaciones_docente FOREIGN KEY (docente_id) REFERENCES docentes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_asignaciones_aula FOREIGN KEY (aula_id) REFERENCES aulas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alumnos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombres VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  avatar_codigo VARCHAR(30) NOT NULL DEFAULT 'menta',
  nivel_explorador SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  puntos_aventura INT UNSIGNED NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_alumnos_activo_nombre (activo, apellidos, nombres)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS matriculas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  aula_id BIGINT UNSIGNED NOT NULL,
  fecha_matricula DATE NOT NULL,
  estado ENUM('ACTIVA', 'RETIRADA', 'FINALIZADA') NOT NULL DEFAULT 'ACTIVA',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_matriculas_aula_estado (aula_id, estado),
  KEY idx_matriculas_alumno_estado (alumno_id, estado),
  CONSTRAINT fk_matriculas_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_matriculas_aula FOREIGN KEY (aula_id) REFERENCES aulas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. Vinculación familiar y códigos de invitación
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS codigos_invitacion (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo CHAR(8) NOT NULL,
  alumno_id BIGINT UNSIGNED NOT NULL,
  generado_por_docente_id BIGINT UNSIGNED NOT NULL,
  usado_por_representante_id BIGINT UNSIGNED NULL,
  estado ENUM('ACTIVO', 'USADO', 'VENCIDO', 'REVOCADO') NOT NULL DEFAULT 'ACTIVO',
  fecha_expiracion DATETIME NOT NULL,
  fecha_uso DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_codigos_invitacion_codigo (codigo),
  KEY idx_codigos_alumno_estado (alumno_id, estado),
  KEY idx_codigos_expiracion (fecha_expiracion),
  CONSTRAINT fk_codigos_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_codigos_docente FOREIGN KEY (generado_por_docente_id) REFERENCES docentes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_codigos_representante FOREIGN KEY (usado_por_representante_id) REFERENCES representantes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vinculaciones_familiares (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  representante_id BIGINT UNSIGNED NOT NULL,
  alumno_id BIGINT UNSIGNED NOT NULL,
  codigo_invitacion_id BIGINT UNSIGNED NULL,
  parentesco VARCHAR(40) NOT NULL DEFAULT 'Representante',
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_vinculacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vinculacion_rep_alumno (representante_id, alumno_id),
  KEY idx_vinculacion_alumno_activa (alumno_id, activa),
  CONSTRAINT fk_vinculacion_representante FOREIGN KEY (representante_id) REFERENCES representantes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_vinculacion_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_vinculacion_codigo FOREIGN KEY (codigo_invitacion_id) REFERENCES codigos_invitacion (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. Seguimiento conductual y módulo DECE
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS categorias_conducta (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(60) NOT NULL,
  descripcion VARCHAR(255) NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_conducta_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS registros_conducta (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  aula_id BIGINT UNSIGNED NOT NULL,
  docente_id BIGINT UNSIGNED NOT NULL,
  categoria_id TINYINT UNSIGNED NOT NULL,
  puntaje TINYINT UNSIGNED NOT NULL,
  observacion VARCHAR(500) NOT NULL,
  requiere_seguimiento_dece BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_registros_alumno_fecha (alumno_id, fecha_registro),
  KEY idx_registros_aula_fecha (aula_id, fecha_registro),
  KEY idx_registros_docente_fecha (docente_id, fecha_registro),
  KEY idx_registros_seguimiento (requiere_seguimiento_dece),
  CONSTRAINT chk_registros_puntaje CHECK (puntaje BETWEEN 1 AND 5),
  CONSTRAINT fk_registros_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_registros_aula FOREIGN KEY (aula_id) REFERENCES aulas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_registros_docente FOREIGN KEY (docente_id) REFERENCES docentes (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_registros_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_conducta (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS seguimientos_dece (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  ultimo_registro_id BIGINT UNSIGNED NULL,
  estado ENUM('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO', 'CERRADO') NOT NULL DEFAULT 'PENDIENTE_REVISION',
  fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_seguimientos_estado_fecha (estado, fecha_actualizacion),
  KEY idx_seguimientos_alumno_estado (alumno_id, estado),
  CONSTRAINT fk_seguimientos_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_seguimientos_ultimo_registro FOREIGN KEY (ultimo_registro_id) REFERENCES registros_conducta (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS observaciones_dece (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  seguimiento_id BIGINT UNSIGNED NOT NULL,
  personal_dece_id BIGINT UNSIGNED NOT NULL,
  nota_interna TEXT NOT NULL,
  proximo_paso VARCHAR(300) NULL,
  fecha_observacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_obs_dece_seguimiento_fecha (seguimiento_id, fecha_observacion),
  CONSTRAINT fk_obs_dece_seguimiento FOREIGN KEY (seguimiento_id) REFERENCES seguimientos_dece (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_obs_dece_personal FOREIGN KEY (personal_dece_id) REFERENCES personal_dece (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. Actividades educativas, insignias y juegos infantiles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS actividades_educativas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  categoria_id TINYINT UNSIGNED NULL,
  tipo ENUM('MISION_INFANTIL', 'HABITO_CASA') NOT NULL,
  titulo VARCHAR(120) NOT NULL,
  descripcion VARCHAR(300) NOT NULL,
  pasos_json JSON NULL,
  puntos_recompensa SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  KEY idx_actividades_tipo_activa (tipo, activa),
  CONSTRAINT fk_actividades_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_conducta (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS progreso_actividades_alumno (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  actividad_id BIGINT UNSIGNED NOT NULL,
  estado ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA') NOT NULL DEFAULT 'EN_PROGRESO',
  fecha_asignacion DATE NOT NULL,
  fecha_completado DATETIME NULL,
  PRIMARY KEY (id),
  KEY idx_progreso_alumno_estado (alumno_id, estado),
  CONSTRAINT fk_progreso_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_progreso_actividad FOREIGN KEY (actividad_id) REFERENCES actividades_educativas (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS insignias (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(40) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  descripcion VARCHAR(200) NOT NULL,
  icono VARCHAR(40) NOT NULL,
  color_tema VARCHAR(20) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_insignias_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS insignias_alumno (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  insignia_id SMALLINT UNSIGNED NOT NULL,
  fecha_obtencion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_insignias_alumno (alumno_id, insignia_id),
  CONSTRAINT fk_insignias_alumno_est FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_insignias_alumno_ins FOREIGN KEY (insignia_id) REFERENCES insignias (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS juegos (
  id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(40) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  habilidad VARCHAR(100) NOT NULL,
  total_parejas TINYINT UNSIGNED NOT NULL DEFAULT 3,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_juegos_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resultados_juegos (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  alumno_id BIGINT UNSIGNED NOT NULL,
  juego_id SMALLINT UNSIGNED NOT NULL,
  parejas_encontradas TINYINT UNSIGNED NOT NULL,
  intentos_totales SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  estrellas TINYINT UNSIGNED NOT NULL DEFAULT 3,
  completado BOOLEAN NOT NULL DEFAULT TRUE,
  puntos_otorgados SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fecha_partida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_resultados_alumno_fecha (alumno_id, fecha_partida),
  CONSTRAINT fk_resultados_alumno FOREIGN KEY (alumno_id) REFERENCES alumnos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_resultados_juego FOREIGN KEY (juego_id) REFERENCES juegos (id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. Almacén de sesiones HTTP-only (express-mysql-session)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires INT UNSIGNED NOT NULL,
  data MEDIUMTEXT COLLATE utf8mb4_bin NULL,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
