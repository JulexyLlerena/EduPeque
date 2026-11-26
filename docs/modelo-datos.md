# Modelo Preliminar de Base de Datos (MySQL Community Edition)

> **Estado:** Propuesta preliminar (Etapa 1). Aún no se ha ejecutado DDL definitivo en MySQL; este documento sirve para revisión y aprobación previa antes de crear `database/schema.sql`.

---

## 1. Consideraciones técnicas para MySQL

- **Motor de almacenamiento:** `InnoDB` (soporte completo de transacciones ACID y claves foráneas).
- **Codificación:** `utf8mb4` / `utf8mb4_unicode_ci` (soporte completo de tildes, ñ y símbolos).
- **Integridad referencial:** Claves primarias autoincrementales `BIGINT UNSIGNED` (o `INT UNSIGNED`), claves foráneas explícitas (`ON DELETE RESTRICT` para históricos académicos/conductuales, `ON DELETE CASCADE` solo en relaciones dependientes directas cuando corresponda).
- **Seguridad:** Las contraseñas se almacenan como `password_hash` (`VARCHAR(255)`). No se almacenan contraseñas en texto plano.

---

## 2. Diagrama entidad-relación preliminar

```text
roles 1──N usuarios
usuarios 1──0..1 docentes
usuarios 1──0..1 representantes
usuarios 1──0..1 personal_dece

docentes 1──N asignaciones_docente N──1 aulas
aulas 1──N matriculas N──1 alumnos

representantes 1──N vinculaciones_familiares N──1 alumnos
docentes 1──N codigos_invitacion N──1 alumnos
codigos_invitacion N──0..1 representantes (usado_por)

alumnos 1──N registros_conducta
docentes 1──N registros_conducta
aulas 1──N registros_conducta
categorias_conducta 1──N registros_conducta

alumnos 1──N seguimientos_dece
registros_conducta 0..1──N seguimientos_dece (registro detonante/origen)
seguimientos_dece 1──N observaciones_dece N──1 personal_dece

categorias_conducta 0..1──N actividades_educativas
actividades_educativas 1──N progreso_actividades_alumno N──1 alumnos
insignias 1──N insignias_alumno N──1 alumnos
juegos 1──N resultados_juegos N──1 alumnos
```

---

## 3. Propuesta de tablas, atributos y relaciones

### 3.1. Seguridad, usuarios y perfiles

#### `roles`
Catálogo de roles del sistema.
- `id` (`TINYINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `codigo` (`VARCHAR(30)`, `UNIQUE`, `NOT NULL`) — valores previstos: `'DOCENTE'`, `'REPRESENTANTE'`, `'DECE'`
- `nombre` (`VARCHAR(60)`, `NOT NULL`)
- `descripcion` (`VARCHAR(200)`, `NULL`)

#### `usuarios`
Credenciales de acceso unificadas (Pág. 1).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `rol_id` (`TINYINT UNSIGNED`, FK → `roles.id`, `NOT NULL`)
- `correo` (`VARCHAR(150)`, `UNIQUE`, `NOT NULL`)
- `password_hash` (`VARCHAR(255)`, `NOT NULL`)
- `nombres` (`VARCHAR(100)`, `NOT NULL`)
- `apellidos` (`VARCHAR(100)`, `NOT NULL`)
- `activo` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)
- `ultimo_acceso` (`DATETIME`, `NULL`)
- `created_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)
- `updated_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)

#### `docentes`
Perfil específico del personal docente (ej. *Ana Torres*).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `usuario_id` (`BIGINT UNSIGNED`, `UNIQUE`, FK → `usuarios.id`, `NOT NULL`)
- `especialidad` (`VARCHAR(100)`, `NULL`)
- `telefono_contacto` (`VARCHAR(20)`, `NULL`)

#### `representantes`
Perfil del familiar o representante legal (ej. *Carolina Mendoza*).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `usuario_id` (`BIGINT UNSIGNED`, `UNIQUE`, FK → `usuarios.id`, `NOT NULL`)
- `telefono_contacto` (`VARCHAR(20)`, `NULL`)

#### `personal_dece`
Perfil del equipo de orientación y bienestar estudiantil.
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `usuario_id` (`BIGINT UNSIGNED`, `UNIQUE`, FK → `usuarios.id`, `NOT NULL`)
- `cargo` (`VARCHAR(100)`, `NOT NULL`, `DEFAULT 'Orientación y Bienestar'`)

---

### 3.2. Estructura escolar y alumnado

#### `aulas`
Aulas de educación inicial (ej. *Aula Girasoles — Inicial 2*, *Aula Mariposas — Inicial 1*).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `nombre` (`VARCHAR(80)`, `NOT NULL`)
- `nivel` (`VARCHAR(50)`, `NOT NULL`) — ej. `'Inicial 1'`, `'Inicial 2'`
- `periodo_lectivo` (`VARCHAR(30)`, `NOT NULL`) — ej. `'2026'`
- `capacidad` (`SMALLINT UNSIGNED`, `NULL`)
- `activa` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)

#### `asignaciones_docente`
Relación entre docentes y aulas asignadas (permite que una docente administre varias aulas como *Girasoles* y *Mariposas* en Pág. 2).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `docente_id` (`BIGINT UNSIGNED`, FK → `docentes.id`, `NOT NULL`)
- `aula_id` (`BIGINT UNSIGNED`, FK → `aulas.id`, `NOT NULL`)
- `es_titular` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)
- `fecha_asignacion` (`DATE`, `NOT NULL`)
- `activo` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)
- *Restricción:* `UNIQUE (docente_id, aula_id)`

#### `alumnos`
Estudiantes de educación inicial y su estado en el módulo infantil.
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `nombres` (`VARCHAR(100)`, `NOT NULL`)
- `apellidos` (`VARCHAR(100)`, `NOT NULL`)
- `fecha_nacimiento` (`DATE`, `NOT NULL`)
- `avatar_codigo` (`VARCHAR(30)`, `NOT NULL`, `DEFAULT 'menta'`) — valores del prototipo (Pág. 10): `'menta'`, `'violeta'`, `'sol'`, `'coral'`, `'melocoton'`, `'lila'`, `'cielo'`
- `nivel_explorador` (`SMALLINT UNSIGNED`, `NOT NULL`, `DEFAULT 1`)
- `puntos_aventura` (`INT UNSIGNED`, `NOT NULL`, `DEFAULT 0`)
- `activo` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)
- `created_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)

#### `matriculas`
Inscripción de alumnos en un aula y periodo lectivo.
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `aula_id` (`BIGINT UNSIGNED`, FK → `aulas.id`, `NOT NULL`)
- `fecha_matricula` (`DATE`, `NOT NULL`)
- `estado` (`ENUM('ACTIVA', 'RETIRADA', 'FINALIZADA')`, `NOT NULL`, `DEFAULT 'ACTIVA'`)
- *Índice:* `(aula_id, estado)`, `(alumno_id, estado)`

---

### 3.3. Vinculación familiar e invitaciones

#### `codigos_invitacion`
Códigos alfanuméricos de 8 caracteres generados para vincular representantes con un alumno (Pág. 5).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `codigo` (`CHAR(8)`, `UNIQUE`, `NOT NULL`) — ej. `'EDU8K2P4'`
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `generado_por_docente_id` (`BIGINT UNSIGNED`, FK → `docentes.id`, `NOT NULL`)
- `usado_por_representante_id` (`BIGINT UNSIGNED`, FK → `representantes.id`, `NULL`)
- `estado` (`ENUM('ACTIVO', 'USADO', 'VENCIDO', 'REVOCADO')`, `NOT NULL`, `DEFAULT 'ACTIVO'`)
- `fecha_expiracion` (`DATETIME`, `NOT NULL`)
- `fecha_uso` (`DATETIME`, `NULL`)
- `created_at` (`TIMESTAMP`, `DEFAULT CURRENT_TIMESTAMP`)

#### `vinculaciones_familiares`
Vínculo autorizado representante ↔ alumno (habilita el selector `Cambiar hijo` en Pág. 6).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `representante_id` (`BIGINT UNSIGNED`, FK → `representantes.id`, `NOT NULL`)
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `codigo_invitacion_id` (`BIGINT UNSIGNED`, FK → `codigos_invitacion.id`, `NULL`)
- `parentesco` (`VARCHAR(40)`, `NOT NULL`, `DEFAULT 'Representante'`)
- `activa` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)
- `fecha_vinculacion` (`DATETIME`, `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`)
- *Restricción:* `UNIQUE (representante_id, alumno_id)`

---

### 3.4. Seguimiento conductual y módulo DECE

#### `categorias_conducta`
Dimensiones formativas observadas (Pág. 3 y 4).
- `id` (`TINYINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `nombre` (`VARCHAR(60)`, `UNIQUE`, `NOT NULL`) — valores del prototipo: `'Convivencia'`, `'Autonomía'`, `'Emociones'`
- `descripcion` (`VARCHAR(255)`, `NULL`)
- `activa` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)

#### `registros_conducta`
Observaciones registradas por el docente (Pág. 3), consultadas en historiales docente (Pág. 4) y familiar (Pág. 6 y 14).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `aula_id` (`BIGINT UNSIGNED`, FK → `aulas.id`, `NOT NULL`)
- `docente_id` (`BIGINT UNSIGNED`, FK → `docentes.id`, `NOT NULL`)
- `categoria_id` (`TINYINT UNSIGNED`, FK → `categorias_conducta.id`, `NOT NULL`)
- `puntaje` (`TINYINT UNSIGNED`, `NOT NULL`) — `CHECK (puntaje BETWEEN 1 AND 5)`
- `observacion` (`VARCHAR(500)`, `NOT NULL`)
- `requiere_seguimiento_dece` (`BOOLEAN`, `NOT NULL`, `DEFAULT FALSE`)
- `fecha_registro` (`DATETIME`, `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`)
- *Índices:* `(alumno_id, fecha_registro DESC)`, `(aula_id, fecha_registro DESC)`, `(requiere_seguimiento_dece)`

#### `seguimientos_dece`
Casos activos o históricos bajo atención del equipo DECE (Pág. 8).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `ultimo_registro_id` (`BIGINT UNSIGNED`, FK → `registros_conducta.id`, `NULL`)
- `estado` (`ENUM('PENDIENTE_REVISION', 'EN_ACOMPANAMIENTO', 'CERRADO')`, `NOT NULL`, `DEFAULT 'PENDIENTE_REVISION'`)
- `fecha_apertura` (`DATETIME`, `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`)
- `fecha_actualizacion` (`DATETIME`, `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`)
- *Índice:* `(estado, fecha_actualizacion DESC)`, `(alumno_id, estado)`

#### `observaciones_dece`
Notas internas confidenciales del equipo DECE (Pág. 8). **Nunca se exponen al módulo familiar.**
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `seguimiento_id` (`BIGINT UNSIGNED`, FK → `seguimientos_dece.id`, `NOT NULL`)
- `personal_dece_id` (`BIGINT UNSIGNED`, FK → `personal_dece.id`, `NOT NULL`)
- `nota_interna` (`TEXT`, `NOT NULL`)
- `proximo_paso` (`VARCHAR(300)`, `NULL`)
- `fecha_observacion` (`DATETIME`, `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`)

---

### 3.5. Actividades educativas, insignias y juegos infantiles

#### `actividades_educativas`
Catálogo de misiones diarias del módulo infantil (Pág. 7 y 13) y hábitos sugeridos para casa del módulo familiar (Pág. 6).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `categoria_id` (`TINYINT UNSIGNED`, FK → `categorias_conducta.id`, `NULL`)
- `tipo` (`ENUM('MISION_INFANTIL', 'HABITO_CASA')`, `NOT NULL`)
- `titulo` (`VARCHAR(120)`, `NOT NULL`)
- `descripcion` (`VARCHAR(300)`, `NOT NULL`)
- `pasos_json` (`JSON`, `NULL`) — arreglo ordenado de pasos (ej. los 3 pasos de Pág. 13)
- `puntos_recompensa` (`SMALLINT UNSIGNED`, `NOT NULL`, `DEFAULT 10`)
- `activa` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)

#### `progreso_actividades_alumno`
Seguimiento de misiones aceptadas o completadas por el niño.
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `actividad_id` (`BIGINT UNSIGNED`, FK → `actividades_educativas.id`, `NOT NULL`)
- `estado` (`ENUM('PENDIENTE', 'EN_PROGRESO', 'COMPLETADA')`, `NOT NULL`, `DEFAULT 'EN_PROGRESO'`)
- `fecha_asignacion` (`DATE`, `NOT NULL`)
- `fecha_completado` (`DATETIME`, `NULL`)

#### `insignias` e `insignias_alumno`
Superlogros visibles en «Mi aventura» (Pág. 7: *Gran compañero*, *Corazón amable*).
- `insignias`: `id` (`SMALLINT UNSIGNED`, PK), `codigo` (`VARCHAR(40)`, `UNIQUE`), `nombre` (`VARCHAR(80)`), `descripcion` (`VARCHAR(200)`), `icono` (`VARCHAR(40)`), `color_tema` (`VARCHAR(20)`).
- `insignias_alumno`: `id` (`BIGINT UNSIGNED`, PK), `alumno_id` (FK → `alumnos.id`), `insignia_id` (FK → `insignias.id`), `fecha_obtencion` (`DATETIME`), `UNIQUE (alumno_id, insignia_id)`.

#### `juegos`
Catálogo de juegos educativos disponibles (Pág. 7 y 9).
- `id` (`SMALLINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `codigo` (`VARCHAR(40)`, `UNIQUE`, `NOT NULL`) — ej. `'BOSQUE_PAREJAS'`
- `nombre` (`VARCHAR(100)`, `NOT NULL`) — ej. `'El bosque de las parejas'`
- `habilidad` (`VARCHAR(100)`, `NOT NULL`) — ej. `'Memoria y atención'`
- `total_parejas` (`TINYINT UNSIGNED`, `NOT NULL`, `DEFAULT 3`)
- `activo` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)

#### `resultados_juegos`
Historial de partidas completadas por el niño (Pág. 9 y 11).
- `id` (`BIGINT UNSIGNED`, PK, `AUTO_INCREMENT`)
- `alumno_id` (`BIGINT UNSIGNED`, FK → `alumnos.id`, `NOT NULL`)
- `juego_id` (`SMALLINT UNSIGNED`, FK → `juegos.id`, `NOT NULL`)
- `parejas_encontradas` (`TINYINT UNSIGNED`, `NOT NULL`)
- `intentos_totales` (`SMALLINT UNSIGNED`, `NOT NULL`, `DEFAULT 0`)
- `estrellas` (`TINYINT UNSIGNED`, `NOT NULL`, `DEFAULT 3`) — enfoque positivo: celebra completar sin penalización
- `completado` (`BOOLEAN`, `NOT NULL`, `DEFAULT TRUE`)
- `puntos_otorgados` (`SMALLINT UNSIGNED`, `NOT NULL`, `DEFAULT 0`)
- `fecha_partida` (`DATETIME`, `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`)
