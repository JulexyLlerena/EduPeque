import { apiRequest } from '../api.js';
import { requireDocenteSession } from '../auth-guard.js';
import { resolvePath } from '../config.js';
import {
  clearElement,
  formatLongTodayEs,
  getAvatarPath,
  showBanner,
  hideBanner
} from '../ui.js';

const state = {
  user: null,
  aulaId: null,
  search: '',
  filtro: 'todos',
  page: 1
};

const panelAlert = document.getElementById('panelAlert');
const topbarContext = document.getElementById('topbarContext');
const greetingSubtitle = document.getElementById('greetingSubtitle');
const kpiAlumnos = document.getElementById('kpiAlumnos');
const kpiRegistrosHoy = document.getElementById('kpiRegistrosHoy');
const kpiSeguimiento = document.getElementById('kpiSeguimiento');
const aulasContainer = document.getElementById('aulasContainer');
const alumnosSectionTitle = document.getElementById('alumnosSectionTitle');
const alumnosContainer = document.getElementById('alumnosContainer');
const searchAlumnoInput = document.getElementById('searchAlumnoInput');
const filterAlumnoSelect = document.getElementById('filterAlumnoSelect');
const paginationBar = document.getElementById('paginationBar');
const paginationInfo = document.getElementById('paginationInfo');
const paginationPages = document.getElementById('paginationPages');
const btnNuevoRegistro = document.getElementById('btnNuevoRegistro');

function renderEmptyState(container, title, description, actionHtml = null) {
  clearElement(container);
  const box = document.createElement('div');
  box.className = 'empty-state';

  const h3 = document.createElement('h3');
  h3.textContent = title;
  const p = document.createElement('p');
  p.textContent = description;

  box.appendChild(h3);
  box.appendChild(p);
  if (actionHtml) {
    box.appendChild(actionHtml);
  }
  container.appendChild(box);
}

function renderAulas(aulas, aulaActiva) {
  clearElement(aulasContainer);

  if (!aulas || aulas.length === 0) {
    let adminAction = null;
    if (state.user?.esAdministrador) {
      adminAction = document.createElement('a');
      adminAction.href = resolvePath('/pages/docente/administracion.html');
      adminAction.className = 'btn btn-lavender btn-sm';
      adminAction.textContent = 'Ir a Administración para crear o asignar aulas →';
    }
    renderEmptyState(
      aulasContainer,
      'Todavía no tienes aulas asignadas',
      'Cuando se te asigne un aula activa, aparecerá aquí con sus indicadores.',
      adminAction
    );
    return;
  }

  aulas.forEach((aula) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = aulaActiva && aula.id === aulaActiva.id;
    btn.className = `aula-chip-card${isActive ? ' active' : ''}`;

    const title = document.createElement('div');
    title.className = 'aula-chip-title';
    title.textContent = isActive ? `${aula.nombre} ✓` : aula.nombre;

    const meta = document.createElement('div');
    meta.className = 'aula-chip-meta';
    meta.textContent = `${aula.nivel} · ${aula.total_alumnos} alumnos`;

    btn.appendChild(title);
    btn.appendChild(meta);
    btn.addEventListener('click', () => {
      state.aulaId = aula.id;
      state.page = 1;
      loadPanel();
    });

    aulasContainer.appendChild(btn);
  });
}

function renderAlumnos(alumnosData, aulaActiva) {
  clearElement(alumnosContainer);
  clearElement(paginationPages);

  if (!aulaActiva) {
    paginationBar.classList.add('hidden');
    renderEmptyState(
      alumnosContainer,
      'Todavía no hay alumnos registrados',
      'Asigna un aula y matricula alumnos para iniciar el seguimiento conductual.'
    );
    return;
  }

  alumnosSectionTitle.textContent = `Alumnos de ${aulaActiva.nombre}`;

  if (!alumnosData.items || alumnosData.items.length === 0) {
    paginationBar.classList.add('hidden');
    const msg =
      state.search || state.filtro !== 'todos'
        ? 'No se encontraron alumnos con los filtros aplicados.'
        : 'Todavía no hay alumnos registrados en esta aula.';
    renderEmptyState(
      alumnosContainer,
      'Sin alumnos para mostrar',
      msg
    );
    return;
  }

  const grid = document.createElement('div');
  grid.className = 'cards-grid-2';

  alumnosData.items.forEach((alumno) => {
    const card = document.createElement('article');
    card.className = 'student-card';

    const header = document.createElement('div');
    header.className = 'student-card-header';

    const img = document.createElement('img');
    img.src = getAvatarPath(alumno.avatar_codigo);
    img.alt = `Avatar de ${alumno.nombres}`;
    img.className = 'avatar-circle';

    const info = document.createElement('div');
    const nameEl = document.createElement('div');
    nameEl.style.fontWeight = '800';
    nameEl.textContent = `${alumno.nombres} ${alumno.apellidos}`;

    const metaEl = document.createElement('div');
    metaEl.className = 'text-secondary';
    metaEl.style.fontSize = '0.84rem';
    metaEl.textContent = `${alumno.edad} años · ${alumno.total_registros} registros`;

    info.appendChild(nameEl);
    info.appendChild(metaEl);
    header.appendChild(img);
    header.appendChild(info);

    const footer = document.createElement('div');
    footer.className = 'student-card-footer';

    const badge = document.createElement('span');
    badge.className = alumno.requiere_seguimiento ? 'badge badge-yellow' : 'badge badge-mint';
    badge.textContent = alumno.requiere_seguimiento ? 'Requiere seguimiento' : 'Sin novedades';

    const link = document.createElement('a');
    link.href = resolvePath(`/pages/docente/historial-alumnos.html?alumnoId=${encodeURIComponent(alumno.id)}`);
    link.style.fontWeight = '700';
    link.style.fontSize = '0.88rem';
    link.textContent = 'Ver historial →';

    footer.appendChild(badge);
    footer.appendChild(link);

    card.appendChild(header);
    card.appendChild(footer);
    grid.appendChild(card);
  });

  alumnosContainer.appendChild(grid);

  paginationBar.classList.remove('hidden');
  paginationInfo.textContent = `Mostrando ${alumnosData.items.length} de ${alumnosData.total} alumnos`;

  for (let p = 1; p <= alumnosData.totalPages; p += 1) {
    const pageBtn = document.createElement('button');
    pageBtn.type = 'button';
    pageBtn.className = `page-btn${p === alumnosData.page ? ' active' : ''}`;
    pageBtn.textContent = String(p);
    pageBtn.addEventListener('click', () => {
      state.page = p;
      loadPanel();
    });
    paginationPages.appendChild(pageBtn);
  }

  if (alumnosData.page < alumnosData.totalPages) {
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Siguiente →';
    nextBtn.addEventListener('click', () => {
      state.page = alumnosData.page + 1;
      loadPanel();
    });
    paginationPages.appendChild(nextBtn);
  }
}

async function loadPanel() {
  hideBanner(panelAlert);
  const params = new URLSearchParams();
  if (state.aulaId) {
    params.set('aulaId', String(state.aulaId));
  }
  if (state.search) {
    params.set('search', state.search);
  }
  if (state.filtro) {
    params.set('filtro', state.filtro);
  }
  params.set('page', String(state.page));

  try {
    const res = await apiRequest(`/api/docente/panel?${params.toString()}`);
    const data = res.data;

    if (data.aulaActiva) {
      state.aulaId = data.aulaActiva.id;
      topbarContext.textContent = `Docentes / ${data.aulaActiva.nivel} · ${data.aulaActiva.nombre}`;
      btnNuevoRegistro.href = resolvePath(`/pages/docente/registrar-conducta.html?aulaId=${encodeURIComponent(data.aulaActiva.id)}`);
    } else {
      topbarContext.textContent = 'Docentes / Sin aulas asignadas';
    }

    kpiAlumnos.textContent = String(data.kpis.alumnosEnAula);
    kpiRegistrosHoy.textContent = String(data.kpis.registrosHoy);
    kpiSeguimiento.textContent = String(data.kpis.enSeguimiento);

    renderAulas(data.aulas, data.aulaActiva);
    renderAlumnos(data.alumnos, data.aulaActiva);
  } catch (error) {
    showBanner(panelAlert, 'error', error.message);
  }
}

let searchDebounce = null;
searchAlumnoInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    state.search = searchAlumnoInput.value.trim();
    state.page = 1;
    loadPanel();
  }, 250);
});

filterAlumnoSelect.addEventListener('change', () => {
  state.filtro = filterAlumnoSelect.value;
  state.page = 1;
  loadPanel();
});

(async () => {
  const user = await requireDocenteSession();
  if (!user) {
    return;
  }
  state.user = user;
  greetingSubtitle.textContent = `Hola, ${user.nombres}. Así va tu aula hoy · ${formatLongTodayEs()}`;
  await loadPanel();
})();
