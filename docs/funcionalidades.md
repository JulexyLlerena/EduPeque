# Especificación de Funcionalidades por Módulo — EduPeque

Este documento describe las funcionalidades de cada uno de los cuatro módulos de **EduPeque** según el prototipo visual de 14 páginas y las reglas de permisos entre roles.

---

## 1. Módulo de Acceso (Transversal)

- **Inicio de sesión por rol (Pág. 1):**
  - Selección explícita de perfil de ingreso (`Docente`, `Representante`, `DECE`).
  - Validación de formato de correo electrónico y obligatoriedad de contraseña en frontend y backend.
  - Opción `Recordarme` y enlace de recuperación `¿Olvidaste tu contraseña?` (flujo por definir).
- **Accesos alternativos desde login:**
  - Enlace directo para representantes primerizos hacia la vinculación mediante código (`Vincula a tu hijo con el código de su docente →`).
  - Acceso al entorno infantil (`¡Entrar a mi aventura!`), sujeto a definición del mecanismo de identificación del estudiante.
- **Cierre de sesión (`× Cerrar sesión`):** Destruye la sesión del servidor y redirige al login.

---

## 2. Módulo Docente (`Espacio Docente`)

Orientado al docente de educación inicial (ej. *Ana Torres*) para administrar sus aulas y registrar el seguimiento diario:

1. **Panel principal `Mi aula` (Pág. 2):**
   - Visualización de KPIs diarios del aula activa: total de alumnos, registros realizados en el día y cantidad de alumnos en seguimiento.
   - Cambio rápido entre aulas asignadas (`Mis aulas`, ej. *Aula Girasoles* y *Aula Mariposas*).
   - Búsqueda de alumnos por nombre y filtro por estado (`Todos los alumnos`, con distinción visual entre `Sin novedades` y `Requiere seguimiento`).
   - Navegación paginada de tarjetas de alumnos y acceso directo a su historial (`Ver historial →`).
2. **Gestión de alumnos, aulas e invitaciones (Base estructural):**
   - Consulta de aulas y nómina de alumnos matriculados.
   - Capacidad técnica en base de datos y backend para emitir códigos de invitación de 8 caracteres para los representantes (requerida para soportar el flujo de Pág. 5).
3. **Registro de conducta (Pág. 3):**
   - Selección de categoría (`Convivencia`, `Autonomía`, `Emociones`).
   - Calificación en escala del `1` (`Necesita apoyo`) al `5` (`Lo logra con autonomía`).
   - Descripción objetiva de la observación (máximo 500 caracteres) con guía metodológica visible de 3 pasos.
   - Opción `Marcar para seguimiento del DECE`, que deriva automáticamente el caso al módulo DECE.
4. **Historial individual de conducta (Pág. 4):**
   - Resumen cuantitativo del alumno: registros totales, promedio del periodo y registros con seguimiento.
   - Filtros por rango de fechas, categoría y botón `Limpiar filtros`.
   - Tabla cronológica paginada (más recientes primero) con estado (`Registrado` / `Seguimiento`).
   - Acceso rápido `+ Nuevo registro` para el alumno visualizado.

---

## 3. Módulo Familiar (`Espacio Familiar`)

Orientado a madres, padres o representantes (ej. *Carolina Mendoza*) para acompañar el desarrollo desde el hogar:

1. **Vinculación mediante código de invitación (Pág. 5):**
   - Ingreso de código de 8 caracteres (`E D U 8 K 2 P 4`) en campos individuales con validación de vigencia, existencia y no reutilización.
   - Mensajes de error claros ante códigos inválidos o vencidos y guía de 3 pasos para obtenerlo.
   - Confirmación del vínculo (Paso 02 del flujo) asegurando que el representante solo acceda a sus hijos vinculados.
2. **Resumen familiar del alumno (Pág. 6):**
   - Selector `Cambiar hijo ⌄` para representantes con más de un niño vinculado y acceso `Vincular otro hijo` en el menú lateral.
   - KPIs del periodo: promedio, observaciones compartidas y categorías trabajadas.
   - Gráfico de barras `Cada avance cuenta` con filtro mensual y mensaje de fortaleza destacada.
   - Sección `Pequeños hábitos en casa`: sugerencias prácticas numeradas conectadas con el aprendizaje en aula.
   - Tarjeta `Una buena noticia desde el aula`: resalta la última observación positiva y enlaza al historial completo.
   - Botón `↓ Descargar reporte` y acceso directo al espacio lúdico del niño (`Jugar con Mateo →`).
3. **Consulta del historial de conducta (Pág. 14):**
   - Mismos indicadores, filtros (fechas y categoría) y tabla cronológica del historial docente.
   - **Regla estricta de privacidad:** muestra únicamente las observaciones compartidas por el docente y **oculta por completo** las notas internas del DECE.

---

## 4. Módulo Infantil (`Mi aventura`)

Entorno seguro, sin competencia ni penalizaciones, guiado por **Lumo**:

1. **Espacio infantil «Mi aventura» (Pág. 7):**
   - Saludo personalizado con avatar actual, nivel (`Explorador nivel 3`) y puntos de aventura.
   - Tarjeta de misión del día por categoría (ej. *Convivencia: «Compartir nos hace un gran equipo»*).
   - Acceso al modal de pasos de la misión (`¡Comenzar mi misión!` → Pág. 13: *«¡Compartamos una aventura!»*, con 3 pasos guiados y botón `¡Voy a intentarlo!`).
   - Bloque de acceso a juegos (`¡Vamos a jugar! →`) y panel `Mis superlogros` con insignias obtenidas y próximo reto.
2. **Selección de avatar («Mi avatar», Pág. 10):**
   - Visualización del avatar actual y elección entre 7 personajes ilustrados (`Menta`, `Violeta`, `Sol`, `Coral`, `Melocotón`, `Lila`, `Cielo`).
   - Persistencia del avatar elegido conservando nombre, nivel y logros.
3. **Juego de memoria «El bosque de las parejas» (Pág. 9, 11 y 12):**
   - Tablero de 6 cartas (3 parejas) sin temporizador y sin pérdida de puntos.
   - Acompañamiento lateral de Lumo con botón `↻ Empezar de nuevo`.
   - **Retroalimentación ante error (Pág. 12):** modal amable *«¡Probemos otra vez!»* con opciones `Seguir jugando` y `Cerrar juego e ir al inicio`.
   - **Visualización de resultados (Pág. 11):** pantalla de celebración con 3 estrellas, mensaje de refuerzo positivo al esfuerzo (*«¡Tu esfuerzo es tu superpoder!»*) y botones `↻ ¡Jugar otra vez!` y `Volver a mi aventura`.

---

## 5. Módulo DECE (`Bienestar Estudiantil`)

Entorno restringido al personal de orientación y bienestar estudiantil:

1. **Panel de seguimiento (Pág. 8):**
   - KPIs de gestión: casos activos, pendientes de revisión y en acompañamiento.
   - Listado maestro de casos derivados por docentes, filtrable por aula (`Todas las aulas ⌄`) y estado (`Todos los estados ⌄`).
2. **Consulta de alumnos y detalle del caso (Pág. 8):**
   - Visualización de datos escolares del alumno, docente referente y último registro conductual marcado para seguimiento.
   - Cambio de estado del caso (`Pendiente de revisión`, `En acompañamiento`, etc.).
3. **Seguimiento de casos y observaciones internas (Pág. 8):**
   - Bitácora cronológica de observaciones y próximos pasos del equipo DECE.
   - Formulario para agregar nuevas observaciones confidenciales, marcadas explícitamente como **notas internas no compartidas con las familias**.

---

## 6. Matriz resumida de permisos sobre datos compartidos

| Recurso / Dato | Docente | Representante | Infantil | DECE |
| :--- | :---: | :---: | :---: | :---: |
| Aulas y alumnos asignados | Lectura / Gestión | Solo hijos vinculados | Solo perfil propio | Lectura institucional |
| Registros de conducta | Crear / Leer | Solo lectura (sin notas DECE) | No visible directamente | Lectura de marcados / caso |
| Códigos de invitación | Generar / Consultar | Validar / Usar | No | No |
| Casos y notas internas DECE | Derivar caso (flag) | **Prohibido** | **Prohibido** | Lectura / Escritura |
| Avatar, misiones y juegos | No | Iniciar / Acompañar | Lectura / Interacción | No |
