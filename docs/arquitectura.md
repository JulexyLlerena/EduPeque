# Arquitectura Propuesta — EduPeque

Este documento define la arquitectura técnica del sistema **EduPeque** bajo un enfoque modular en tres capas (**Presentación**, **Lógica de Negocio / API REST** y **Datos**), utilizando exclusivamente tecnologías gratuitas y de código abierto.

---

## 1. Visión general de la arquitectura

```text
+-------------------------------------------------------------------+
|                     NAVEGADOR DEL USUARIO                         |
|   Frontend (HTML5 + CSS3 + JavaScript nativo modular por rol)     |
+---------------------------------+---------------------------------+
                                  | HTTP / HTTPS (JSON + Cookies HTTP-only)
                                  v
+-------------------------------------------------------------------+
|                   SERVIDOR NODE.JS + EXPRESS                      |
|                                                                   |
|  [Middlewares] -> CORS, JSON parser, Sesión, Auth, RBAC, Errores  |
|  [Routes]      -> /api/auth, /api/docente, /api/familia,          |
|                   /api/dece, /api/infantil                        |
|  [Controllers] -> Validación de entrada y respuestas JSON         |
|  [Services]    -> Reglas de negocio (ej. derivación al DECE,      |
|                   visibilidad familiar, códigos de invitación)    |
|  [Models]      -> Consultas SQL parametrizadas vía mysql2         |
+---------------------------------+---------------------------------+
                                  | TCP / Pool mysql2
                                  v
+-------------------------------------------------------------------+
|                MYSQL COMMUNITY EDITION (edupeque_db)              |
|   Única base de datos relacional compartida por los 4 módulos     |
+-------------------------------------------------------------------+
```

---

## 2. Arquitectura del Frontend (`frontend/`)

El frontend se construye sin frameworks externos (Vanilla JS + HTML5 + CSS3), organizado por recursos compartidos y módulos funcionales:

- **`frontend/assets/css/`**:
  - `variables.css`: tokens oficiales de color, tipografía, radios y sombras derivados del prototipo.
  - `base.css` y `layout.css`: estilos globales, sistema de grid de dos columnas (login/vinculación) y layout de dashboard con sidebar fijo.
  - `components.css`: tarjetas KPI, tablas, pills de categoría/estado, botones, modales y controles de formulario.
  - Hojas específicas por módulo si es necesario (ej. `infantil.css` para el tablero de cartas de memoria y vista de avatar).
- **`frontend/assets/js/`**:
  - `api.js`: cliente HTTP centralizado con `fetch` (`credentials: 'include'`) para consumir la API REST JSON y manejar respuestas de sesión expirada o errores.
  - `auth.js`: verificación de sesión activa y redirección según el rol del usuario.
  - Módulos de vista independientes (`docente/`, `familia/`, `dece/`, `infantil/`) para que cada pantalla gestione su estado en DOM sin mezclar responsabilidades.
- **`frontend/pages/`**:
  - Páginas HTML organizadas por módulo (`login.html`, `docente/*.html`, `familia/*.html`, `dece/*.html`, `infantil/*.html`) o vistas separadas por rol que comparten cabecera/sidebar mediante componentes reutilizables en JS.
- **`frontend/assets/img/` y `frontend/assets/fonts/`**:
  - Ilustraciones locales (Lumo, avatares infantiles, escena de bienvenida) y tipografía local sin dependencias de CDNs de pago.

**Principio de almacenamiento:** No se utilizará `localStorage` como sustituto de la base de datos. Toda información de alumnos, conductas, avatares, logros y sesiones reales residirá en MySQL y en la sesión HTTP-only del servidor.

---

## 3. Arquitectura del Backend (`backend/src/`)

Se adopta una **arquitectura en capas (Routes → Controllers → Services → Models)** que permite desarrollar cada módulo de manera independiente manteniendo integración en un único servidor Express:

- **`config/`**:
  - `env.js`: carga y validación de variables de entorno (`.env`).
  - `database.js`: pool de conexiones `mysql2/promise` con manejo de errores y cierre limpio.
  - `session.js`: configuración de sesiones seguras en servidor (cookies `HttpOnly`, `SameSite=Lax`, persistidas en MySQL mediante almacén open-source como `express-mysql-session`).
- **`middleware/`**:
  - `authMiddleware.js`: valida que exista una sesión autenticada.
  - `roleMiddleware.js`: aplica **Control de Acceso Basado en Roles (RBAC)** (`docente`, `representante`, `dece`) y valida pertenencia de datos (por ejemplo, que un representante solo acceda a los hijos vinculados a su cuenta y que nunca reciba observaciones internas del DECE).
  - `errorHandler.js`: formato uniforme de respuestas JSON de error sin filtrar trazas internas en producción.
- **`routes/`** (agrupadas por dominio/módulo):
  - `auth.routes.js`: inicio/cierre de sesión y usuario actual.
  - `docente.routes.js`: aulas, alumnos, registro de conducta, historial y generación de códigos de invitación.
  - `familia.routes.js`: validación de código, vinculación, resumen del hijo, hábitos e historial filtrado.
  - `dece.routes.js`: listado de casos en seguimiento, detalle, cambio de estado y observaciones internas.
  - `infantil.routes.js`: perfil de aventura, selección de avatar, misiones, logros y guardado de resultados de juegos.
- **`controllers/`**: reciben `req` y `res`, extraen parámetros validados, invocan al servicio correspondiente y devuelven JSON con códigos HTTP semánticos (`200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`).
- **`services/`**: encapsulan reglas de negocio transversales:
  - *Regla de derivación automática al DECE:* al guardar un registro de conducta marcado para seguimiento, el servicio crea o actualiza el caso DECE dentro de una transacción SQL.
  - *Regla de aislamiento de privacidad:* las consultas orientadas al módulo familiar excluyen explícitamente `observaciones_dece`.
  - *Regla de vinculación por código:* valida unicidad, vigencia y uso único del código de 8 caracteres.
- **`models/`**: repositorios SQL que ejecutan consultas preparadas (`?`) con `mysql2`.
- **`utils/`**: formateadores de fechas, validadores, generador criptográfico de códigos de invitación (`crypto.randomBytes`) y utilidades de hashing de contraseñas (`bcrypt` / `argon2`).

---

## 4. Seguridad, autenticación y control de acceso

1. **Contraseñas:** Almacenadas exclusivamente como hashes con sal criptográfica (`bcrypt` o `argon2`), nunca en texto plano ni reversibles.
2. **Sesiones:** Cookies `HttpOnly` firmadas, respaldadas en tabla de sesiones de MySQL, con expiración configurable.
3. **Autorización por rol y propiedad del recurso:**
   - Un **docente** solo gestiona aulas y alumnos asignados.
   - Un **representante** solo consulta información de alumnos vinculados en `vinculaciones_familiares`, sin acceso a notas internas del DECE.
   - El **personal DECE** accede a los casos derivados y gestiona observaciones internas confidenciales.
   - El **módulo infantil** opera únicamente sobre el perfil autorizado del alumno correspondiente, sin exponer datos administrativos ni observaciones de adultos.
4. **Prevención de vulnerabilidades comunes:** Consultas parametrizadas en `mysql2`, sanitización/escape de salidas en el DOM (evitando `innerHTML` con texto ingresado por usuarios) y validación estricta de entradas en backend.

---

## 5. Entorno de ejecución local

En desarrollo local, el propio servidor Express puede servir los archivos estáticos de `frontend/` junto con los endpoints `/api/*` en el mismo origen (`http://localhost:3000`), simplificando cookies de sesión y evitando fricciones de CORS durante pruebas locales.
