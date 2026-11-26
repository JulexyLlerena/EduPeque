const fs = require('fs');
const path = require('path');

const pages = [
  'frontend/index.html',
  'frontend/pages/docente/mi-aula.html',
  'frontend/pages/docente/registrar-conducta.html',
  'frontend/pages/docente/historial-alumnos.html',
  'frontend/pages/docente/codigos-vinculacion.html',
  'frontend/pages/docente/administracion.html',
  'frontend/pages/familia/resumen.html',
  'frontend/pages/familia/historial.html',
  'frontend/pages/familia/vinculacion.html',
  'frontend/pages/familia/mi-aventura.html',
  'frontend/pages/familia/juego-memoria.html',
  'frontend/pages/familia/juego-resultados.html',
  'frontend/pages/familia/mi-avatar.html',
  'frontend/pages/dece/seguimiento.html'
];

let allOk = true;
pages.forEach((p) => {
  if (!fs.existsSync(p)) {
    console.error('Missing page:', p);
    allOk = false;
    return;
  }
  const content = fs.readFileSync(p, 'utf8');
  const regex = /(?:href|src)="\/([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const rawTarget = match[1].split('?')[0].split('#')[0];
    if (rawTarget.startsWith('index.html') || rawTarget.startsWith('assets/') || rawTarget.startsWith('pages/')) {
      const fullTarget = path.join('frontend', rawTarget);
      if (!fs.existsSync(fullTarget)) {
        console.error(`Broken link in ${p} -> ${rawTarget}`);
        allOk = false;
      }
    }
  }
});

if (allOk) {
  console.log('ALL 14 PAGES AND INTERNAL ASSETS VERIFIED ON DISK');
}
