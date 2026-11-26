# Diagnóstico y Corrección de Compatibilidad Local y GitHub Pages — EduPeque

> **Fecha:** 26 de noviembre de 2026  
> **Repositorio:** `JulexyLlerena/EduPeque`  
> **URL Publicada:** `https://julexyllerena.github.io/EduPeque/`  

---

## 1. Diagnóstico de los Problemas Encontrados y Causas Raíz

### A. Error «Respuesta inválida del servidor» al iniciar sesión en GitHub Pages
* **Causa raíz:** GitHub Pages es un servicio de alojamiento puramente estático (solo sirve HTML, CSS, JS e imágenes). No ejecuta el runtime de Node.js ni Express, ni tiene conexión con bases de datos MySQL locales (`localhost:3307`). Al enviar el formulario de login en GitHub Pages, `fetch('/api/auth/login')` realizaba una petición HTTP GET/POST a la URL `https://julexyllerena.github.io/EduPeque/api/auth/login`. Como esa ruta no existe en el servidor estático de GitHub, este devolvía una página HTML 404 de GitHub.
* En `frontend/assets/js/api.js`, la función `apiRequest` intentaba ejecutar `await response.json()`. Al recibir HTML en lugar de JSON, la promesa fallaba y caía en el bloque `catch`, generando el mensaje genérico: `«Respuesta inválida del servidor.»`.

### B. Error 404 en los accesos a los prototipos de Representante y DECE (Prefijos duplicados)
* **Causa raíz:** En intentos manuales previos se había agregado en `frontend/assets/js/login.js` la constante `const BASE_PATH = '/EduPeque';` y se construían enlaces como:
  ```javascript
  prototypePreviewLink.href = `${BASE_PATH}/pages/familia/resumen.html`;
  ```
  Al mismo tiempo, el workflow de GitHub Actions (`.github/workflows/main.yml`) ejecutaba una expresión regular en Python que buscaba cualquier ocurrencia de `/pages/` en los archivos `.js` y le anteponía `/EduPeque/`.
* **Resultado:** La ruta generada en GitHub Pages se transformaba en:
  `https://julexyllerena.github.io/EduPeque/EduPeque/pages/familia/resumen.html` (con `/EduPeque/` duplicado), provocando un error 404 inmediato.
* Adicionalmente, al ejecutar el proyecto en local (`http://localhost:3000`), `BASE_PATH = '/EduPeque'` intentaba cargar `http://localhost:3000/EduPeque/pages/...`, lo cual también causaba un error 404 en el entorno de desarrollo local donde el servidor Express sirve directamente en `/`.

### C. Redirecciones con rutas absolutas rígidas en `auth-guard.js` y vistas docentes
* **Causa raíz:** Archivos como `auth-guard.js`, `mi-aula.js`, `registrar-conducta.js`, `juego-memoria.js` y `mi-avatar.js` contenían redirecciones o asignaciones fijas como `window.location.href = '/index.html'` o `link.href = '/pages/docente/mi-aula.html'`. En GitHub Pages, esto expulsaba al usuario fuera del repositorio hacia la raíz `https://julexyllerena.github.io/index.html` (inexistente).

### D. Ausencia de soporte CORS y ajuste de cookies para backend desacoplado
* **Causa raíz:** En `backend/src/app.js` no estaba instalado ni configurado el middleware `cors`. Si el frontend se ejecuta desde GitHub Pages (`https://julexyllerena.github.io`) y se comunica con un backend desplegado en la nube, el navegador bloquea las solicitudes por política de mismo origen (CORS) y descarta las cookies de sesión si `sameSite` o `credentials` no están debidamente configurados.

---

## 2. Correcciones Implementadas

### 1. Módulo Universal de Rutas y Configuración (`frontend/assets/js/config.js`)
Se creó un módulo centralizado que detecta dinámicamente el entorno de ejecución:
- `getBasePath()`: retorna `'/EduPeque'` cuando se detecta el subdirectorio o el dominio `github.io`, y `''` cuando se ejecuta localmente.
- `resolvePath(path)`: transforma rutas internas como `'/pages/familia/resumen.html'` en `'/EduPeque/pages/familia/resumen.html'` en GitHub Pages, o `'/pages/familia/resumen.html'` en local, asegurando idempotencia (evita duplicar `/EduPeque/EduPeque/`).
- `getApiBaseUrl()`: determina si existe un backend conectado. Si se define `window.__EDUPEQUE_API_URL__`, lo utiliza. En local retorna cadena vacía (mismo origen), y en GitHub Pages sin backend remoto devuelve `null`.

### 2. Detección Inteligente y Manejo de Errores en `api.js`
Se actualizó `apiRequest` para:
1. Detectar si el frontend se ejecuta en un hosting estático (GitHub Pages) sin backend en la nube configurado, mostrando un mensaje claro y guiado al usuario explicando que la autenticación y la base de datos MySQL requieren el backend en Node.js local o un endpoint remoto.
2. Validar el encabezado `Content-Type` de la respuesta HTTP. Si el servidor responde con HTML o error HTTP, se extrae el código de estado sin lanzar «Respuesta inválida del servidor».
3. Capturar fallos de red (`fetch failed`) e instruir al usuario para verificar que Express esté corriendo en `http://localhost:3000`.

### 3. Normalización de Enlaces y Navegación en el Frontend
Se actualizaron todos los archivos JavaScript del frontend (`login.js`, `auth-guard.js`, `mi-aula.js`, `registrar-conducta.js`, `historial-alumnos.js`, `juego-memoria.js`, `mi-avatar.js` y `ui.js`) para utilizar `resolvePath(...)`.
- Se verificó que todas las 14 páginas del prototipo existan físicamente en `frontend/` y que sus enlaces internos apunten a destinos válidos.

### 4. Ajuste Seguro del Workflow de GitHub Actions (`.github/workflows/main.yml`)
- Se corrigió el script de preparación para que **únicamente** transforme atributos de archivos HTML (`href`, `src`, `action`) asegurando que los enlaces apunten a `/EduPeque/...`.
- **Se eliminó la sustitución destructiva en archivos `.js`**, evitando corromper la lógica de scripts, cadenas interpoladas o variables de código.
- Se mantuvieron las verificaciones de archivos (`test -f public/index.html`, `public/pages/familia/resumen.html`, `public/pages/dece/seguimiento.html`, etc.) y el archivo `.nojekyll`.

### 5. Configuración de CORS y Sesiones en el Backend (`backend/src/app.js` y `session.js`)
- Se instaló la dependencia oficial `cors`.
- Se habilitó CORS con soporte para credenciales (`credentials: true`) y orígenes permitidos configurables (`http://localhost:3000`, `http://127.0.0.1:3000`, `https://julexyllerena.github.io` y `CLIENT_ORIGIN` desde variables de entorno).
- Se ajustó la configuración de cookies en `session.js` para permitir `sameSite: 'none'` y `secure: true` cuando `NODE_ENV=production`, permitiendo que un backend en la nube pueda emitir cookies de sesión válidas hacia GitHub Pages.
