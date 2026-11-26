# EduPeque

Aplicación web educativa orientada al seguimiento de la conducta infantil y al fortalecimiento de hábitos positivos en niños de educación inicial, conectando en un mismo entorno a **docentes**, **representantes (familias)**, **personal del DECE** y **estudiantes** (acompañados por **Lumo**, la mascota del sistema).

> **Estado del proyecto:** Etapa 1 completada (Análisis del prototipo visual de 14 páginas, diseño de arquitectura, propuesta preliminar de base de datos, estructura base del proyecto y documentación inicial).

---

## Objetivo general

Brindar una plataforma accesible, amigable y segura para registrar observaciones de conducta en el aula, coordinar oportunamente casos que requieran acompañamiento del Departamento de Consejería Estudiantil (DECE), compartir avances y hábitos sugeridos con las familias (protegiendo siempre la privacidad de las notas internas del DECE), y reforzar hábitos positivos en los niños mediante misiones y juegos educativos no competitivos.

---

## Módulos del sistema

1. **Módulo Docente (`Espacio Docente`)**: Inicio de sesión, panel principal de aulas y alumnos (`Mi aula`), registro de observaciones conductuales con escala de 1 a 5 y derivación opcional al DECE, e historial individual de conducta.
2. **Módulo Familiar (`Espacio Familiar`)**: Vinculación mediante código de invitación de 8 caracteres, resumen del progreso del alumno con gráficos y hábitos recomendados para casa, descarga de reporte y consulta del historial compartido (sin notas internas del DECE).
3. **Módulo Infantil (`Mi aventura`)**: Espacio lúdico guiado por **Lumo** con misión diaria de convivencia, selección de avatar personalizado, juego de memoria *«El bosque de las parejas»*, retroalimentación motivadora sin castigos y pantalla de logros.
4. **Módulo DECE (`Bienestar Estudiantil`)**: Panel de casos marcados por docentes, filtros por aula y estado, actualización del estado de acompañamiento y registro de observaciones internas confidenciales.

---

## Stack tecnológico definido

Todas las herramientas seleccionadas son **gratuitas y de código abierto**:

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, JavaScript nativo (Vanilla JS) | Interfaz fiel al prototipo, sin frameworks comerciales ni SPAs pesadas |
| **Backend** | Node.js + Express | Servidor HTTP y API REST con respuestas JSON |
| **Base de datos** | MySQL Community Edition | Persistencia relacional compartida por los cuatro módulos |
| **Driver BD** | `mysql2` | Pool de conexiones y consultas parametrizadas (prevención de SQL Injection) |
| **Seguridad y sesiones** | Sesiones HTTP-only en servidor (`express-session` + almacén en MySQL) y hashing con `bcrypt` / `argon2` | Autenticación segura, control de acceso por rol y protección de contraseñas |

---

## Estructura del proyecto

```text
EduPeque/
├── frontend/
│   ├── assets/
│   │   ├── css/          # Tokens de diseño (variables.css) y hojas de estilo modulares
│   │   ├── js/           # Lógica de vistas, validaciones y consumo de API
│   │   ├── img/          # Ilustraciones (Lumo, avatares, escenas)
│   │   └── fonts/        # Fuentes tipográficas locales
│   ├── pages/            # Vistas HTML por módulo
│   └── index.html        # Punto de entrada del frontend
├── backend/
│   └── src/
│       ├── config/       # Configuración de entorno, BD y sesiones
│       ├── controllers/  # Controladores HTTP por módulo
│       ├── middleware/   # Autenticación, RBAC, validación y manejo de errores
│       ├── models/       # Consultas SQL parametrizadas sobre mysql2
│       ├── routes/       # Definición de rutas REST
│       ├── services/     # Lógica de negocio y reglas compartidas
│       └── utils/        # Utilidades transversales
├── database/             # Futuros scripts DDL (schema.sql) y datos semilla (seed.sql)
├── docs/                 # Documentación técnica y funcional de la Etapa 1
├── .env.example          # Plantilla de variables de entorno
├── .gitignore
└── README.md
```

---

## Identidad visual de referencia

- **Paleta base:** Morado (`#6652B8`), Lavanda (`#EFEBFF`), Menta (`#E5F4EC`), Amarillo pastel (`#FFF0D5`), Fondo claro (`#F5F8FC`), Blanco (`#FFFFFF`), Texto principal (`#292644`) y Texto secundario (`#77758A`).
- **Estilo:** Tarjetas blancas con bordes redondeados, sombras suaves, tipografía legible y enfoque emocional positivo para educación inicial.

---

## Documentación disponible

- [Análisis del prototipo (14 páginas)](./docs/analisis-prototipo.md)
- [Arquitectura del sistema](./docs/arquitectura.md)
- [Modelo preliminar de datos (MySQL)](./docs/modelo-datos.md)
- [Funcionalidades por módulo](./docs/funcionalidades.md)

---

## Requisitos previstos para desarrollo local

- Node.js (v18 LTS o superior) y npm.
- MySQL Community Edition (v8.0 o superior) ejecutándose localmente.
- Navegador web moderno (Chrome, Firefox, Edge).

> **Nota de privacidad:** Nunca se deben almacenar contraseñas en texto plano ni utilizar datos personales reales de menores en entornos de desarrollo o pruebas.
