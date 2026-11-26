import { apiRequest } from '../api.js';
import { requireDocenteSession } from '../auth-guard.js';
import { resolvePath } from '../config.js';
import {
  clearElement,
  formatDateTimeEs,
  getAvatarPath,
  showBanner,
  hideBanner
} from '../ui.js';

const state = {
  alumnos: [],
  alumnoId: null,
  fechaInicio: '',
  fechaFin: '',
  categoriaId: '',
  page: 1
};

const historialAlert = document.getElementById('historialAlert');
const alumnoSelect = document.getElementById('alumnoSelect');
const studentAvatar = document.getElementById('studentAvatar');
const studentMeta = document.getElementById('studentMeta');
const studentStatusBadge = document.getElementById('studentStatusBadge');
const topbarContext = document.getElementById('topbarContext');
const btnNuevoRegistro = document.getElementById('btnNuevoRegistro');
const kpiTotal = document.getElementById('kpiTotal');
const kpiPromedio = document.getElementById('kpiPromedio');
const kpiSeguimiento = document.getElementById('kpiSeguimiento');
const fechaInicioInput = document.getElementById('fechaInicioInput');
const fechaFinInput = document.getElementById('fechaFinInput');
const categoriaFilterSelect = document.getElementById('categoriaFilterSelect');
const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');
const historialTableContainer = document.getElementById('historialTableContainer');
const paginationBar = document.getElementById('paginationBar');
const paginationInfo = document.getElementById('paginationInfo');
const paginationPages = document.getElementById('paginationPages');

function renderEmptyHistory(message) {
  clearElement(historialTableContainer);
  paginationBar.classList.add('hidden');
  const box = document.createElement('div');
  box.className = 'empty-state';
  const h3 = document.createElement('h3');
  h3.textContent = 'Aún no existen registros de conducta';
  const p = document.createElement('p');
  p.textContent = message;
  box.appendChild(h3);
  box.appendChild(p);
  historialTableContainer.appendChild(box);
}

function renderTable(registros) {
  clearElement(historialTableContainer);
  clearElement(paginationPages);

  if (!registros.items || registros.items.length === 0) {
    renderEmptyHistory('Cuando registres observaciones para este alumno, aparecerán ordenadas aquí.');
    return;
  }

  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'data-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['FECHA', 'CATEGORÍA', 'OBSERVACIÓN', 'PUNTAJE', 'ESTADO'].forEach((label) => {
    const th = document.createElement('th');
    th.textContent = label;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  registros.items.forEach((item) => {
    const tr = document.createElement('tr');

    const tdFecha = document.createElement('td');
    tdFecha.textContent = formatDateTimeEs(item.fecha_registro);

    const tdCategoria = document.createElement('td');
    tdCategoria.textContent = item.categoria_nombre;

    const tdObs = document.createElement('td');
    tdObs.textContent = item.observacion;

    const tdPuntaje = document.createElement('td');
    tdPuntaje.style.fontWeight = '700';
    tdPuntaje.textContent = `${item.puntaje} / 5`;

    const tdEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = item.requiere_seguimiento_dece ? 'badge badge-yellow' : 'badge badge-mint';
    badge.textContent = item.requiere_seguimiento_dece ? 'Seguimiento' : 'Registrado';
    tdEstado.appendChild(badge);

    tr.appendChild(tdFecha);
    tr.appendChild(tdCategoria);
    tr.appendChild(tdObs);
    tr.appendChild(tdPuntaje);
    tr.appendChild(tdEstado);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  wrap.appendChild(table);
  historialTableContainer.appendChild(wrap);

  paginationBar.classList.remove('hidden');
  paginationInfo.textContent = `Mostrando ${registros.items.length} de ${registros.total} registros · Más recientes primero`;

  for (let p = 1; p <= registros.totalPages; p += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `page-btn${p === registros.page ? ' active' : ''}`;
    btn.textContent = String(p);
    btn.addEventListener('click', () => {
      state.page = p;
      loadHistorial();
    });
    paginationPages.appendChild(btn);
  }
}

async function loadHistorial() {
  hideBanner(historialAlert);
  if (!state.alumnoId) {
    renderEmptyHistory('Todavía no hay alumnos asignados para consultar historial.');
    return;
  }

  btnNuevoRegistro.href = resolvePath(`/pages/docente/registrar-conducta.html?alumnoId=${encodeURIComponent(state.alumnoId)}`);

  const params = new URLSearchParams();
  if (state.fechaInicio) {
    params.set('fechaInicio', state.fechaInicio);
  }
  if (state.fechaFin) {
    params.set('fechaFin', state.fechaFin);
  }
  if (state.categoriaId) {
    params.set('categoriaId', state.categoriaId);
  }
  params.set('page', String(state.page));

  try {
    const res = await apiRequest(`/api/docente/alumnos/${encodeURIComponent(state.alumnoId)}/historial?${params.toString()}`);
    const { alumno, kpis, registros } = res.data;

    studentAvatar.src = getAvatarPath(alumno.avatar_codigo);
    studentMeta.textContent = `${alumno.aula_nivel || '-'} · ${alumno.aula_nombre || 'Sin aula'} · ${alumno.edad} años`;
    topbarContext.textContent = `Docentes / ${alumno.aula_nivel || 'Historial'} · ${alumno.aula_nombre || 'Alumno'}`;

    studentStatusBadge.classList.remove('hidden');
    studentStatusBadge.className = alumno.en_seguimiento ? 'badge badge-yellow' : 'badge badge-mint';
    studentStatusBadge.textContent = alumno.en_seguimiento ? 'En seguimiento' : 'Sin novedades';

    kpiTotal.textContent = String(kpis.registrosTotales);
    kpiPromedio.textContent = `${String(kpis.promedioPeriodo.toFixed(1)).replace('.', ',')} / 5`;
    kpiSeguimiento.textContent = String(kpis.registrosConSeguimiento);

    renderTable(registros);
  } catch (error) {
    showBanner(historialAlert, 'error', error.message);
  }
}

[fechaInicioInput, fechaFinInput, categoriaFilterSelect].forEach((el) => {
  el.addEventListener('change', () => {
    state.fechaInicio = fechaInicioInput.value;
    state.fechaFin = fechaFinInput.value;
    state.categoriaId = categoriaFilterSelect.value;
    state.page = 1;
    loadHistorial();
  });
});

btnLimpiarFiltros.addEventListener('click', () => {
  fechaInicioInput.value = '';
  fechaFinInput.value = '';
  categoriaFilterSelect.value = '';
  state.fechaInicio = '';
  state.fechaFin = '';
  state.categoriaId = '';
  state.page = 1;
  loadHistorial();
});

(async () => {
  const user = await requireDocenteSession();
  if (!user) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const alumnoIdParam = urlParams.get('alumnoId');

  try {
    const [catRes, alumRes] = await Promise.all([
      apiRequest('/api/docente/categorias'),
      apiRequest('/api/docente/alumnos')
    ]);

    (catRes.data.categorias || []).forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = String(cat.id);
      opt.textContent = cat.nombre;
      categoriaFilterSelect.appendChild(opt);
    });

    state.alumnos = alumRes.data.alumnos || [];
    clearElement(alumnoSelect);

    if (state.alumnos.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Todavía no hay alumnos registrados';
      alumnoSelect.appendChild(opt);
      studentMeta.textContent = '';
      renderEmptyHistory('Todavía no hay alumnos registrados en tus aulas.');
      return;
    }

    state.alumnos.forEach((al, idx) => {
      const opt = document.createElement('option');
      opt.value = String(al.id);
      opt.textContent = `${al.nombres} ${al.apellidos}`;
      if ((alumnoIdParam && String(al.id) === alumnoIdParam) || (!alumnoIdParam && idx === 0)) {
        opt.selected = true;
        state.alumnoId = al.id;
      }
      alumnoSelect.appendChild(opt);
    });

    if (!state.alumnoId && state.alumnos.length > 0) {
      state.alumnoId = state.alumnos[0].id;
    }

    alumnoSelect.addEventListener('change', () => {
      state.alumnoId = Number(alumnoSelect.value);
      state.page = 1;
      loadHistorial();
    });

    await loadHistorial();
  } catch (error) {
    showBanner(historialAlert, 'error', error.message);
  }
})();
