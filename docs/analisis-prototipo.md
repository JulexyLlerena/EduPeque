# Análisis del Prototipo Visual — EduPeque (14 páginas)

Este documento recoge el análisis exhaustivo de las **14 pantallas** contenidas en el prototipo visual de EduPeque, detallando su propósito, estructura visual, componentes de interfaz, navegación, relaciones entre módulos y requerimientos de persistencia en MySQL.

---

## 1. Identidad visual observada en el prototipo

El diseño mantiene coherencia estricta en todas las páginas, diferenciando el tono adulto/profesional (Docente, Representante, DECE) del tono lúdico simplificado (Módulo Infantil):

- **Colores primarios y pasteles:**
  - Morado primario (`#6652B8`): botones principales (`Ingresar`, `+ Registrar conducta`, `Guardar registro`, `Vincular con mi hijo`, `¡Comenzar mi misión!`, `¡Vamos a jugar! →`, `Agregar observación`, `¡Guardar mi avatar!`, `Seguir jugando`), dorsos de cartas de memoria, pestañas/filtros activos y marca `edupeque`.
  - Lavanda (`#EFEBFF`): panel izquierdo de bienvenida en Login/Vinculación, primera tarjeta KPI, tarjeta de alumno en resumen familiar, botones secundarios suaves (`× Volver a mi aventura`, `Cerrar juego e ir al inicio`) e ítems activos de menú lateral.
  - Verde menta (`#E5F4EC`): botón `¡Entrar a mi aventura!`, segunda tarjeta KPI, tarjeta de misión diaria con Lumo, panel lateral del juego *«El bosque de las parejas»*, badges `Sin novedades` / `Registrado` / `En acompañamiento` y texto positivo (`#2E7D5B`).
  - Amarillo pastel (`#FFF0D5`): tercera tarjeta KPI, recuadro de derivación al DECE, badges `Requiere seguimiento` / `En seguimiento` / `Pendiente de revisión`, tarjetas de hábitos/logros y pill de nivel (`Explorador nivel 3`).
  - Fondo general (`#F5F8FC`) y tarjetas blancas (`#FFFFFF`) con bordes redondeados y sombras suaves.
  - Texto principal (`#292644`) y secundario (`#77758A`).
  - Colores complementarios observados en el prototipo: rojo/coral de error y borde de validación (`#D94E4E` sobre `#FDECEC`), dorado para las 3 estrellas de victoria (`#B87D14`) y overlay oscuro semitransparente para modales infantiles (`rgba(25, 23, 40, 0.72)`).
- **Mascota:** **Lumo**, un zorro amigable con pañoleta menta y mochila lila, presente en el espacio infantil (`Mi aventura`, juego de memoria, pantalla de victoria, modal de reintento y modal de misión).

---

## 2. Inventario y análisis de las 14 páginas

### Página 1 — Inicio de sesión unificado y entrada infantil
- **Módulo:** Acceso general / Docente / Representante / DECE / Infantil.
- **Propósito:** Autenticar al personal educativo y representantes según su rol, ofrecer acceso al flujo de vinculación familiar por primera vez y habilitar la entrada al espacio infantil.
- **Layout:** Pantalla dividida en 2 columnas.
  - *Columna izquierda (lavanda):* logo `edupeque`, etiqueta `ESCUELA • FAMILIA • PEQUEÑOS GRANDES LOGROS`, titular *«Cada pequeño paso cuenta.»*, subtítulo descriptivo, ilustración de dos niños regando una planta en maceta de madera y lema inferior *«Aprender. Sentir. Crecer. — Una comunidad que cuida la infancia.»*
  - *Columna derecha (blanca):* saludo *«¡Qué gusto verte de nuevo!»*, título *«Ingresa a EduPeque»*, selector por pestañas (`Docente` | `Representante` | `DECE`).
- **Formularios y controles:**
  - Campo `Correo electrónico` con validación inline (ejemplo mostrado: `ana.torres@` -> *«Ingresa un correo electrónico válido.»*).
  - Campo `Contraseña` con validación inline (*«La contraseña es obligatoria.»*).
  - Checkbox `Recordarme` y enlace `¿Olvidaste tu contraseña?`.
  - Botón primario `Ingresar`.
  - Bloque destacado: *«¿Es tu primera vez como representante?»* + enlace `Vincula a tu hijo con el código de su docente →` (navega a Pág. 5).
  - Nota de seguridad: *«Tus datos y los de tus pequeños están protegidos.»*
  - Botón menta: `¡Entrar a mi aventura!` (acceso a Pág. 7).
- **Persistencia:** Validación de credenciales contra `usuarios` y `roles`, creación de sesión segura en servidor.

---

### Página 2 — Panel principal docente («Mi aula»)
- **Módulo:** Docente (`Espacio Docente`).
- **Propósito:** Mostrar el estado diario de las aulas asignadas al docente, indicadores clave y listado buscable/filtrable de alumnos.
- **Navegación (Sidebar fijo):** `Mi aula` (activo), `Registrar conducta`, `Historial de alumnos`, `Reportes`; pie con `Ayuda y acompañamiento`.
- **Cabecera:** Breadcrumb `Docentes / Inicial 2 · Aula Girasoles`, usuario `Ana Torres · Docente`, botón `× Cerrar sesión`.
- **Componentes:**
  - Encabezado *«Cada día, una oportunidad para crecer»* con fecha del día y botón `+ Registrar conducta` (Pág. 3).
  - 3 tarjetas KPI: `24` (`Alumnos en el aula`), `18` (`Registros de hoy`), `3` (`En seguimiento`).
  - Selector `Mis aulas`: tarjetas clickeables (`Aula Girasoles ✓ · Inicial 2 · 24 alumnos` activa; `Aula Mariposas · Inicial 1 · 20 alumnos`).
  - Sección `Alumnos de Girasoles`: barra de búsqueda `Buscar alumno...`, filtro `Todos los alumnos ⌄`, grilla de tarjetas de alumnos (avatar, nombre, edad, total de registros, badge `Requiere seguimiento` o `Sin novedades`, enlace `Ver historial →` hacia Pág. 4) y paginación (`Mostrando 6 de 24 alumnos`, páginas `1 2 3 4 Siguiente →`).
- **Persistencia:** Consulta de `aulas`, `matriculas`, `alumnos`, conteo de `registros_conducta` del día y estado de seguimiento.

---

### Página 3 — Registro de conducta
- **Módulo:** Docente.
- **Propósito:** Registrar una nueva observación conductual para un alumno específico, con calificación numérica y opción de derivación al DECE.
- **Cabecera:** `← Volver al aula` (Pág. 2) e `Inicio`.
- **Componentes:**
  - Tarjeta de contexto del alumno seleccionado (`Mateo Mendoza · Inicial 2 · Aula Girasoles · 4 años` + badge `En seguimiento`).
  - Formulario `Nuevo registro` (con fecha y hora `20 may 2026 · 10:30`):
    - Selector tipo píldora `Categoría de conducta *`: `Convivencia`, `Autonomía`, `Emociones`.
    - Escala `Puntaje de la observación *`: botones del `1` al `5` (`1 · Necesita apoyo` a `5 · Lo logra con autonomía`).
    - Área de texto `¿Qué observaste?` con contador `0 / 500 caracteres`.
    - Casilla destacada en amarillo: `Marcar para seguimiento del DECE`.
    - Botones `Cancelar` y `Guardar registro`.
  - Panel derecho informativo: tarjeta lavanda *«Pequeñas acciones, grandes avances»* (guía de 3 pasos de observación objetiva) y tarjeta blanca *«Acompañamiento oportuno»* (explica que el DECE revisará el caso y que la familia ve solo el resumen de conducta, no las notas internas del DECE).
- **Persistencia:** Inserción en `registros_conducta` y, si se marca la casilla DECE, creación o actualización automática de un caso en `seguimientos_dece`.

---

### Página 4 — Historial individual de conducta (Vista Docente)
- **Módulo:** Docente.
- **Propósito:** Consultar la evolución cronológica de registros de conducta de un alumno con KPIs y filtros.
- **Cabecera:** `← Volver al aula`, `Inicio` y botón `+ Nuevo registro` (lleva a Pág. 3 con el alumno preseleccionado).
- **Componentes:**
  - Tarjeta de alumno (`Mateo Mendoza`, badge `En seguimiento`).
  - 3 KPIs: `8` (`Registros totales`), `4,0 / 5` (`Promedio del periodo`), `2` (`Registros con seguimiento`).
  - Filtros: selector de rango de fechas (`01 may – 20 may 2026 ⌄`), selector de categoría (`Todas las categorías ⌄`) y acción `Limpiar filtros`.
  - Tabla de registros con columnas `FECHA`, `CATEGORÍA`, `OBSERVACIÓN`, `PUNTAJE` (`X / 5`), `ESTADO` (`Seguimiento` en amarillo / `Registrado` en verde) y paginación (`Mostrando 4 de 8 registros · Más recientes primero`).
- **Persistencia:** Consultas filtradas, agregaciones (`COUNT`, `AVG`) y paginación sobre `registros_conducta`.

---

### Página 5 — Vinculación de representante mediante código
- **Módulo:** Familiar (`Espacio Familiar`).
- **Propósito:** Permitir que un representante valide un código de invitación emitido por el docente para vincular su cuenta con el perfil de su hijo.
- **Layout:** Dos columnas igual que Pág. 1; izquierda con título *«Más cerca de su mundo.»* y misma ilustración de niños regando la planta.
- **Componentes (Columna derecha):**
  - Enlace `← Volver al inicio de sesión` (Pág. 1).
  - Título *«Un vínculo que nos acerca»* e indicador de pasos: `01 Ingresa tu código` / `02 Confirma el vínculo`.
  - Input segmentado de 8 casillas alfanuméricas (`Código de invitación`, ej. `E D U 8 K 2 P 4`), con ayuda *«8 caracteres · Revisa las letras y los números.»*
  - Alerta de error de validación (cuando falla): *«No pudimos validar el código — El código no es válido o ha vencido. Revísalo o solicita una nueva invitación al docente.»*
  - Botón `Vincular con mi hijo`.
  - Caja de ayuda *«¿Dónde encuentro mi código?»* (3 pasos) y nota de privacidad *«Solo tendrás acceso a la información de tu hijo.»*
- **Persistencia:** Validación de existencia, vigencia (`fecha_expiracion`) y estado de uso en `codigos_invitacion`, y creación de registro en `vinculaciones_familiares`.

---

### Página 6 — Resumen familiar del alumno
- **Módulo:** Familiar (`Espacio Familiar`).
- **Propósito:** Presentar al representante una visión clara y alentadora de los avances de su hijo, con métricas, gráfico reciente, sugerencias de hábitos en casa y acceso directo al juego infantil.
- **Navegación (Sidebar fijo):** `Resumen de mi hijo` (activo), `Historial de conducta`, `Hábitos en casa`, `Vincular otro hijo`, y botón destacado `Jugar con Mateo →` (acceso a Pág. 7).
- **Cabecera:** `Familias / Resumen`, `Carolina Mendoza · Representante`, `× Cerrar sesión`.
- **Componentes:**
  - Título *«Crecer también empieza en casa»* y botón `↓ Descargar reporte`.
  - Tarjeta lavanda del alumno con edad, nivel, aula, docente titular y selector `Cambiar hijo ⌄` (soporta representantes con más de un hijo vinculado).
  - 3 KPIs: `4,0 / 5` (`Promedio del periodo`), `8` (`Observaciones compartidas`), `3` (`Categorías trabajadas`).
  - Gráfico `Cada avance cuenta` (filtro `Mayo 2026 ⌄`): barras verticales de los últimos 4 registros (escala 1-5) y nota de fortaleza (*«Fortaleza: autonomía en las rutinas del aula.»*).
  - Tarjeta `Pequeños hábitos en casa`: lista numerada (`01 Esperar nuestro turno`, `02 Poner nombre a lo que siento`) con indicaciones prácticas para padres.
  - Tarjeta inferior `Una buena noticia desde el aula`: destaca la observación positiva más reciente y enlace `Ver todo el historial →` (Pág. 14).
- **Persistencia:** Lectura filtrada de `vinculaciones_familiares`, `registros_conducta` (excluyendo notas internas del DECE), `actividades_educativas` (hábitos en casa).

---

### Página 7 — Espacio infantil «Mi aventura»
- **Módulo:** Infantil.
- **Propósito:** Brindar una pantalla principal alegre y simple donde el niño vea su misión del día, acceda al juego de memoria, revise sus insignias y personalice su avatar.
- **Cabecera (sin sidebar):** Logo `edupeque`, navegación en píldoras (`Mi aventura` [activo], `Mis juegos`, `Mi avatar`, `× Salir`).
- **Componentes:**
  - Saludo personalizado `¡Hola, Mateo!` con avatar y pill de progreso `★ Explorador nivel 3 · 120 puntos de aventura`.
  - Tarjeta destacada menta `TU MISIÓN DE HOY · CONVIVENCIA`: título *«Compartir nos hace un gran equipo»*, descripción breve, ilustración de **Lumo** y botón `¡Comenzar mi misión!` (abre modal Pág. 13).
  - Tarjeta izquierda `JUEGA CON LUMO · MEMORIA Y ATENCIÓN`: *«¡Encuentra las parejas!»*, vista previa de 3 tarjetas (`?`, `★`, `♥`) y botón `¡Vamos a jugar! →` (abre Pág. 9).
  - Tarjeta derecha `Mis superlogros`: listado de insignias obtenidas (`Gran compañero`, `Corazón amable`) y siguiente objetivo (`Tu próximo logro`).
  - Pie: *«A tu ritmo, sin prisas. Lo importante es descubrir y divertirte.»*
- **Persistencia:** Lectura de perfil infantil (`alumnos`: avatar, nivel, puntos), `actividades_educativas` (misión diaria) e insignias desbloqueadas.

---

### Página 8 — Panel de seguimiento DECE y observaciones
- **Módulo:** DECE (`Bienestar Estudiantil`).
- **Propósito:** Centralizar los alumnos marcados para seguimiento, permitir el cambio de estado del caso y documentar observaciones internas confidenciales del equipo DECE.
- **Navegación (Sidebar fijo):** `Casos de seguimiento` (activo), `Observaciones`, `Reportes`.
- **Cabecera:** `DECE / Seguimiento`, `Equipo DECE · Orientación`, `× Cerrar sesión`.
- **Componentes:**
  - Título *«Acompañar a tiempo hace la diferencia»* y 3 KPIs: `3` (`Casos activos`), `1` (`Pendiente de revisión`), `2` (`En acompañamiento`).
  - Panel maestro-detalle (2 columnas):
    - *Lista izquierda (`Casos para seguimiento`):* filtros `Todas las aulas ⌄` y `Todos los estados ⌄`; tarjetas con nombre, aula, cantidad de registros marcados, fecha del último registro y badge de estado (`En acompañamiento` / `Pendiente de revisión`), acción `Consultar caso →`. Pie: *«Acceso restringido al equipo de orientación y bienestar.»*
    - *Detalle derecho:* nombre del alumno, aula y docente; selector desplegable de estado (`En acompañamiento ⌄`); tarjeta amarilla con el `Último registro` docente; sección `Observaciones del DECE` con historial cronológico, textarea *«Escribe una observación o un próximo paso...»*, botón `Agregar observación` y aviso *«Notas internas. No se comparten con las familias.»*
- **Persistencia:** Lectura y actualización de `seguimientos_dece` (estado) e inserción/lectura en `observaciones_dece`.

---

### Página 9 — Juego de memoria «El bosque de las parejas»
- **Módulo:** Infantil.
- **Propósito:** Ejercitar la memoria y atención en un entorno sin reloj ni penalizaciones.
- **Cabecera:** `← Mi aventura` (Pág. 7), título `EL BOSQUE DE LAS PAREJAS`, chip de usuario (`Mateo` + avatar) y `× Cerrar juego`.
- **Componentes:**
  - *Tablero izquierdo (`¡Encuentra a los amigos iguales!`):* indicadores superiores (`Pareja 1`, `Pareja 2`, `Pareja 3`), cuadrícula de 6 cartas (3×2) moradas con `?` y etiqueta `Tócame`, mensaje *«Sin reloj y sin perder puntos. ¡Puedes intentarlo otra vez!»*
  - *Panel derecho menta (`¡Yo juego contigo!`):* ilustración de Lumo, tarjeta *«Soy Lumo, tu compañero»*, botón `↻ Empezar de nuevo` y texto *«Encuentra las 3 parejas y celebra tu esfuerzo.»*
- **Navegación/Estados:** Al elegir dos cartas distintas abre modal de retroalimentación (Pág. 12); al emparejar las 3 parejas navega a resultados (Pág. 11).
- **Persistencia:** Registro de partida en `resultados_juegos` al completarse (o reiniciarse/cerrarse si se desea analítica).

---

### Página 10 — Selección de avatar («Mi avatar»)
- **Módulo:** Infantil.
- **Propósito:** Permitir que el niño elija el personaje visual que lo representa en la plataforma sin alterar su progreso.
- **Cabecera:** `← Mi aventura`, título `MI AVATAR`, botón `× Cerrar`.
- **Componentes:**
  - Tarjeta superior lavanda con avatar actual grande, *«¡Así soy yo!»*, nivel (`Mateo · Explorador nivel 3`).
  - Selector `¿Cuál se parece a ti?` con 7 opciones ilustradas: `Menta` (`✓ Elegido`), `Violeta`, `Sol`, `Coral`, `Melocotón`, `Lila`, `Cielo`.
  - Botón primario `¡Guardar mi avatar!` y nota *«Tu nombre y tus logros siguen siendo los mismos. ¡Solo cambia tu estilo!»*
- **Persistencia:** Actualización del atributo `avatar_codigo` del alumno en `alumnos`.

---

### Página 11 — Visualización de resultados del juego
- **Módulo:** Infantil.
- **Propósito:** Celebrar la finalización del juego de memoria reforzando el esfuerzo por encima de la competencia.
- **Layout:** Fondo lavanda claro, cabecera minimalista (`edupeque · Mis juegos` y `× Cerrar`), tarjeta blanca central.
- **Componentes:** 3 estrellas doradas (`★ ★ ★`), ilustración de Lumo, título `¡Lo lograste, Mateo!`, subtítulo verde `Encontraste las 3 parejas`, mensaje *«Miraste, recordaste y seguiste intentando. ¡Tu esfuerzo es tu superpoder!»*, botón primario `↻ ¡Jugar otra vez!` (reinicia Pág. 9), botón secundario menta `Volver a mi aventura` (Pág. 7) y nota *«Sin competir. Cada pequeño logro cuenta.»*
- **Persistencia:** Lectura/confirmación del resultado guardado en `resultados_juegos` y eventual acreditación de puntos en `alumnos`.

---

### Página 12 — Retroalimentación para volver a intentar (Modal)
- **Módulo:** Infantil.
- **Propósito:** Acompañar emocionalmente al niño cuando dos cartas volteadas no coinciden, evitando frustración.
- **Layout:** Modal centrado sobre overlay oscuro.
- **Componentes:** Ilustración de Lumo, título `¡Probemos otra vez!`, texto *«Estas cartas son diferentes. Recuerda dónde estaban y busca su pareja. ¡Lumo confía en ti!»*, botón primario `Seguir jugando` (cierra el modal y voltea las cartas), botón secundario lavanda `Cerrar juego e ir al inicio` (regresa a Pág. 7).
- **Persistencia:** No requiere persistencia obligatoria por cada intento fallido (puede contabilizarse en memoria durante la partida para registrar el total de intentos al finalizar en `resultados_juegos`).

---

### Página 13 — Modal de Misión diaria («¡Compartamos una aventura!»)
- **Módulo:** Infantil.
- **Propósito:** Desglosar en 3 pasos sencillos la misión diaria mostrada en «Mi aventura» (Pág. 7).
- **Layout:** Modal centrado sobre overlay oscuro.
- **Componentes:** Ilustración de Lumo, título verde `¡Compartamos una aventura!`, lista numerada (`1. Busca un juguete que te guste.`, `2. Invita a alguien a jugar contigo.`, `3. Jueguen por turnos y escúchense.`), botón primario `¡Voy a intentarlo!` (registra aceptación/progreso de la misión) y botón secundario `× Volver a mi aventura`.
- **Persistencia:** Registro de interacción/completitud en `progreso_actividades_alumno` (y eventual otorgamiento de puntos/insignia).

---

### Página 14 — Historial de conducta (Vista Familiar)
- **Módulo:** Familiar (`Espacio Familiar`).
- **Propósito:** Permitir al representante revisar el detalle histórico de observaciones compartidas por el docente, con total transparencia pero sin acceso a las notas internas del DECE.
- **Cabecera:** `Familias / Historial de mi hijo`, botones `← Volver al resumen` (Pág. 6) y `× Cerrar sesión`, usuario `Carolina Mendoza · Representante`.
- **Componentes:**
  - Título *«Su historia, también en casa»* y subtítulo aclaratorio: *«Observaciones compartidas por su docente. Sin notas internas del DECE.»*
  - Tarjeta de alumno (`Mateo Mendoza`, badge `En seguimiento`), 3 KPIs (`8 Registros totales`, `4,0 / 5 Promedio del periodo`, `2 Registros con seguimiento`), barra de filtros (fechas, categoría, `Limpiar filtros`), tabla (`FECHA`, `CATEGORÍA`, `OBSERVACIÓN`, `PUNTAJE`, `ESTADO`) y paginación.
- **Persistencia:** Misma fuente de `registros_conducta` filtrada por vínculo familiar autorizado, ocultando estrictamente cualquier registro de `observaciones_dece`.

---

## 3. Relaciones entre los cuatro módulos

1. **Docente → DECE:** Cuando el docente registra una conducta (Pág. 3) y marca *«Marcar para seguimiento del DECE»*, el registro alimenta automáticamente el panel de casos del DECE (Pág. 8).
2. **Docente → Familiar:** Todas las observaciones de conducta (`Convivencia`, `Autonomía`, `Emociones`) y sus puntajes se reflejan en el resumen familiar (Pág. 6) y en el historial familiar (Pág. 14), **excluyendo** siempre las notas internas del DECE.
3. **Docente → Familiar (Vinculación):** El docente provee el código de invitación de 8 caracteres que habilita al representante a vincularse con su hijo (Pág. 5).
4. **Familiar → Infantil:** El representante puede iniciar la experiencia infantil para su hijo desde el botón `Jugar con Mateo →` (Pág. 6), y también existe un acceso directo en el login (`¡Entrar a mi aventura!`, Pág. 1).
5. **Infantil ↔ Base de datos compartida:** Los avatares, puntos, insignias, misiones y resultados de juegos se persisten en el perfil del alumno y quedan disponibles para futuras consultas de progreso.

---

## 4. Funcionalidades que requieren persistencia de datos

1. Autenticación por roles (`Docente`, `Representante`, `DECE`) y gestión de sesiones activas.
2. Gestión de aulas, asignación docente-aula y matrículas de alumnos.
3. Generación, validación, expiración y consumo único de códigos de invitación familiar.
4. Vinculación representante-alumno (incluyendo soporte para múltiples hijos por representante).
5. Registro de conducta (categoría, puntaje 1–5, observación, fecha/hora, bandera de seguimiento DECE) y consulta filtrada/paginada con KPIs calculados.
6. Gestión de casos DECE (cambio de estado) y bitácora confidencial de observaciones internas del DECE.
7. Catálogo de misiones infantiles, hábitos para casa, insignias, selección de avatar del alumno y registro de resultados de juegos educativos.

---

## 5. Observaciones y aspectos del prototipo que requieren aclaración

Durante la revisión de las 14 páginas se detectaron los siguientes puntos que conviene confirmar antes de pasar a la etapa de implementación:

1. **Inconsistencia en el nombre del alumno de muestra:** En las páginas 2, 3, 4 y 14 aparece como **Mateo Mendoza** (representante Carolina Mendoza), mientras que en la página 6 y en la tarjeta izquierda de la página 8 aparece como **Mateo Torres** (aunque en el detalle derecho de la página 8 vuelve a figurar como **Mateo Mendoza**). Se recomienda confirmar la unificación del dato ficticio de prueba.
2. **Mecanismo de identificación en el acceso infantil desde el Login (Pág. 1):** El botón `¡Entrar a mi aventura!` está en la pantalla pública de login sin selector de alumno ni PIN infantil. Es necesario definir si desde ahí se solicitará un código infantil, se seleccionará un niño en sesión familiar previa o qué regla de seguridad aplicará para evitar acceso no autorizado a perfiles de menores.
3. **Paso 02 de vinculación familiar y creación de cuenta (Pág. 5):** El indicador muestra `01 Ingresa tu código` y `02 Confirma el vínculo`, pero no hay pantalla dibujada para el paso 02 ni formulario de creación de contraseña del representante nuevo. Asimismo, el módulo docente no muestra aún una pantalla/modal específica para generar y entregar códigos de invitación.
4. **Opciones del menú lateral sin pantalla dedicada en el PDF:**
   - Docente: `Reportes` (Pág. 2–4) y creación/edición de aulas y alumnos.
   - Familiar: `Hábitos en casa`, `Vincular otro hijo` y acción `↓ Descargar reporte` (Pág. 6).
   - DECE: `Observaciones` y `Reportes` (Pág. 8).
   - Infantil: `Mis juegos` (Pág. 7), donde actualmente solo se detalla «El bosque de las parejas».
5. **Reglas de gamificación:** Definir cómo se suman los `puntos de aventura`, cuándo sube el `nivel de explorador` y qué condiciones desbloquean las insignias de `Mis superlogros`.
6. **Recuperación de contraseña (Pág. 1):** Confirmar si el enlace `¿Olvidaste tu contraseña?` se resolverá en entorno local mediante restablecimiento administrativo/simulado o flujo de token local, dado que no se usarán servicios externos de pago.
