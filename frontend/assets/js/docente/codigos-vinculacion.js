import { apiRequest } from '../api.js';
import { requireDocenteSession } from '../auth-guard.js';
import {
  clearElement,
  formatDateTimeEs,
  showBanner,
  hideBanner
} from '../ui.js';

const codigosAlert = document.getElementById('codigosAlert');
const alumnoCodigoSelect = document.getElementById('alumnoCodigoSelect');
const diasVigenciaInput = document.getElementById('diasVigenciaInput');
const generarCodigoForm = document.getElementById('generarCodigoForm');
const validarCodigoForm = document.getElementById('validarCodigoForm');
const validarCodigoInput = document.getElementById('validarCodigoInput');
const validacionResultado = document.getElementById('validacionResultado');
const codigosTableContainer = document.getElementById('codigosTableContainer');

function getBadgeClass(estado) {
  if (estado === 'ACTIVO') {
    return 'badge-mint';
  }
  if (estado === 'USADO') {
    return 'badge-lavender';
  }
  if (estado === 'VENCIDO') {
    return 'badge-yellow';
  }
  return 'badge-error';
}

function renderCodigosTable(codigos) {
  clearElement(codigosTableContainer);

  if (!codigos || codigos.length === 0) {
    const box = document.createElement('div');
    box.className = 'empty-state';
    const h3 = document.createElement('h3');
    h3.textContent = 'Aún no hay códigos de vinculación';
    const p = document.createElement('p');
    p.textContent = 'Genera el primer código para que un representante vincule a su hijo.';
    box.appendChild(h3);
    box.appendChild(p);
    codigosTableContainer.appendChild(box);
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['CÓDIGO', 'ALUMNO', 'ESTADO', 'VIGENCIA', 'ACCIÓN'].forEach((text) => {
    const th = document.createElement('th');
    th.textContent = text;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  codigos.forEach((item) => {
    const tr = document.createElement('tr');

    const tdCode = document.createElement('td');
    const codeSpan = document.createElement('span');
    codeSpan.className = 'code-badge-mono';
    codeSpan.textContent = item.codigo;
    tdCode.appendChild(codeSpan);

    const tdAlumno = document.createElement('td');
    tdAlumno.textContent = `${item.alumno_nombre} (${item.aula_nombre || 'Sin aula'})`;

    const tdEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge ${getBadgeClass(item.estado)}`;
    badge.textContent = item.estado;
    tdEstado.appendChild(badge);

    const tdVigencia = document.createElement('td');
    tdVigencia.textContent = formatDateTimeEs(item.fecha_expiracion);

    const tdAccion = document.createElement('td');
    if (item.estado === 'ACTIVO') {
      const revokeBtn = document.createElement('button');
      revokeBtn.type = 'button';
      revokeBtn.className = 'btn btn-danger-outline btn-sm';
      revokeBtn.textContent = 'Revocar';
      revokeBtn.addEventListener('click', async () => {
        try {
          await apiRequest(`/api/docente/codigos/${encodeURIComponent(item.id)}/revocar`, {
            method: 'PATCH'
          });
          showBanner(codigosAlert, 'success', `Código ${item.codigo} revocado.`);
          await loadCodigos();
        } catch (error) {
          showBanner(codigosAlert, 'error', error.message);
        }
      });
      tdAccion.appendChild(revokeBtn);
    } else {
      tdAccion.textContent = '-';
    }

    tr.appendChild(tdCode);
    tr.appendChild(tdAlumno);
    tr.appendChild(tdEstado);
    tr.appendChild(tdVigencia);
    tr.appendChild(tdAccion);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  codigosTableContainer.appendChild(wrap);
}

async function loadCodigos() {
  try {
    const res = await apiRequest('/api/docente/codigos');
    renderCodigosTable(res.data.codigos || []);
  } catch (error) {
    showBanner(codigosAlert, 'error', error.message);
  }
}

generarCodigoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(codigosAlert);

  const alumnoId = Number(alumnoCodigoSelect.value);
  const diasVigencia = Number(diasVigenciaInput.value);

  if (!alumnoId) {
    showBanner(codigosAlert, 'warning', 'No hay alumnos disponibles para generar códigos.');
    return;
  }

  try {
    const res = await apiRequest('/api/docente/codigos', {
      method: 'POST',
      body: JSON.stringify({ alumnoId, diasVigencia })
    });
    showBanner(
      codigosAlert,
      'success',
      `Código generado para ${res.data.alumnoNombre}: ${res.data.codigo}`
    );
    await loadCodigos();
  } catch (error) {
    showBanner(codigosAlert, 'error', error.message);
  }
});

validarCodigoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(validacionResultado);

  const codigo = validarCodigoInput.value.trim().toUpperCase();
  if (!/^[A-Z0-9]{8}$/.test(codigo)) {
    showBanner(validacionResultado, 'error', 'Ingresa un código de exactamente 8 caracteres.');
    return;
  }

  try {
    const res = await apiRequest(`/api/docente/codigos/validar/${encodeURIComponent(codigo)}`);
    showBanner(
      validacionResultado,
      'success',
      `Código válido para ${res.data.alumnoNombre}. Vigente hasta ${formatDateTimeEs(res.data.fechaExpiracion)}.`
    );
  } catch (error) {
    showBanner(validacionResultado, 'error', error.message);
  }
});

(async () => {
  const user = await requireDocenteSession();
  if (!user) {
    return;
  }

  try {
    const alumRes = await apiRequest('/api/docente/alumnos');
    const alumnos = alumRes.data.alumnos || [];
    clearElement(alumnoCodigoSelect);

    if (alumnos.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Todavía no hay alumnos registrados';
      alumnoCodigoSelect.appendChild(opt);
    } else {
      alumnos.forEach((al) => {
        const opt = document.createElement('option');
        opt.value = String(al.id);
        opt.textContent = `${al.nombres} ${al.apellidos}`;
        alumnoCodigoSelect.appendChild(opt);
      });
    }

    await loadCodigos();
  } catch (error) {
    showBanner(codigosAlert, 'error', error.message);
  }
})();
