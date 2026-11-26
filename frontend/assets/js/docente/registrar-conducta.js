import { apiRequest } from '../api.js';
import { requireDocenteSession } from '../auth-guard.js';
import {
  clearElement,
  formatDateTimeEs,
  getAvatarPath,
  showBanner,
  hideBanner
} from '../ui.js';

const state = {
  alumnos: [],
  categorias: [],
  selectedCategoriaId: null,
  selectedScore: null
};

const conductaAlert = document.getElementById('conductaAlert');
const alumnoSelect = document.getElementById('alumnoSelect');
const studentAvatar = document.getElementById('studentAvatar');
const studentMetaText = document.getElementById('studentMetaText');
const studentBadge = document.getElementById('studentBadge');
const currentTimestampLabel = document.getElementById('currentTimestampLabel');
const categoriasGroup = document.getElementById('categoriasGroup');
const categoriaError = document.getElementById('categoriaError');
const puntajeButtons = document.querySelectorAll('.score-btn');
const puntajeError = document.getElementById('puntajeError');
const observacionInput = document.getElementById('observacionInput');
const observacionError = document.getElementById('observacionError');
const charCounter = document.getElementById('charCounter');
const deceCheckbox = document.getElementById('deceCheckbox');
const conductaForm = document.getElementById('conductaForm');

function updateStudentBanner() {
  const alumnoId = Number(alumnoSelect.value);
  const alumno = state.alumnos.find((item) => item.id === alumnoId);

  if (!alumno) {
    studentMetaText.textContent = 'Todavía no hay alumnos disponibles en tus aulas asignadas.';
    studentBadge.classList.add('hidden');
    return;
  }

  studentAvatar.src = getAvatarPath(alumno.avatar_codigo);
  studentMetaText.textContent = `${alumno.edad} años · ${alumno.total_registros} registros previos`;
  studentBadge.classList.remove('hidden');
  studentBadge.className = alumno.requiere_seguimiento ? 'badge badge-yellow' : 'badge badge-mint';
  studentBadge.textContent = alumno.requiere_seguimiento ? 'En seguimiento' : 'Sin novedades';
}

function renderCategorias(categorias) {
  clearElement(categoriasGroup);
  categorias.forEach((cat, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pill-option${idx === 0 ? ' active' : ''}`;
    btn.textContent = cat.nombre;
    if (idx === 0) {
      state.selectedCategoriaId = cat.id;
    }
    btn.addEventListener('click', () => {
      categoriasGroup.querySelectorAll('.pill-option').forEach((el) => el.classList.remove('active'));
      btn.classList.add('active');
      state.selectedCategoriaId = cat.id;
      categoriaError.classList.add('hidden');
    });
    categoriasGroup.appendChild(btn);
  });
}

puntajeButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    puntajeButtons.forEach((item) => item.classList.remove('active'));
    btn.classList.add('active');
    state.selectedScore = Number(btn.dataset.score);
    puntajeError.classList.add('hidden');
  });
});

observacionInput.addEventListener('input', () => {
  charCounter.textContent = `${observacionInput.value.length} / 500 caracteres`;
  if (observacionInput.value.trim().length >= 5) {
    observacionError.classList.add('hidden');
  }
});

conductaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(conductaAlert);

  const alumnoId = Number(alumnoSelect.value);
  const observacion = observacionInput.value.trim();

  let valid = true;
  if (!alumnoId) {
    showBanner(conductaAlert, 'warning', 'Debes contar con un alumno matriculado antes de registrar conductas.');
    return;
  }
  if (!state.selectedCategoriaId) {
    categoriaError.classList.remove('hidden');
    valid = false;
  }
  if (!state.selectedScore) {
    puntajeError.classList.remove('hidden');
    valid = false;
  }
  if (observacion.length < 5 || observacion.length > 500) {
    observacionError.classList.remove('hidden');
    valid = false;
  }
  if (!valid) {
    return;
  }

  try {
    await apiRequest('/api/docente/conducta', {
      method: 'POST',
      body: JSON.stringify({
        alumnoId,
        categoriaId: state.selectedCategoriaId,
        puntaje: state.selectedScore,
        observacion,
        requiereSeguimientoDece: deceCheckbox.checked
      })
    });

    window.location.href = `/pages/docente/historial-alumnos.html?alumnoId=${encodeURIComponent(alumnoId)}`;
  } catch (error) {
    showBanner(conductaAlert, 'error', error.message);
  }
});

(async () => {
  const user = await requireDocenteSession();
  if (!user) {
    return;
  }

  currentTimestampLabel.textContent = formatDateTimeEs(new Date().toISOString());

  const urlParams = new URLSearchParams(window.location.search);
  const aulaIdParam = urlParams.get('aulaId');
  const alumnoIdParam = urlParams.get('alumnoId');

  try {
    const [catRes, alumRes] = await Promise.all([
      apiRequest('/api/docente/categorias'),
      apiRequest(`/api/docente/alumnos${aulaIdParam ? `?aulaId=${encodeURIComponent(aulaIdParam)}` : ''}`)
    ]);

    state.categorias = catRes.data.categorias || [];
    state.alumnos = alumRes.data.alumnos || [];

    renderCategorias(state.categorias);
    clearElement(alumnoSelect);

    const btnGuardar = document.getElementById('btnGuardarConducta');
    if (state.alumnos.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Todavía no hay alumnos registrados';
      alumnoSelect.appendChild(opt);
      if (btnGuardar) {
        btnGuardar.disabled = true;
      }
      showBanner(conductaAlert, 'warning', 'Todavía no hay alumnos disponibles en tus aulas para registrar conductas.');
    } else {
      state.alumnos.forEach((al) => {
        const opt = document.createElement('option');
        opt.value = String(al.id);
        opt.textContent = `${al.nombres} ${al.apellidos}`;
        if (alumnoIdParam && String(al.id) === alumnoIdParam) {
          opt.selected = true;
        }
        alumnoSelect.appendChild(opt);
      });
    }

    updateStudentBanner();
    alumnoSelect.addEventListener('change', updateStudentBanner);
  } catch (error) {
    showBanner(conductaAlert, 'error', error.message);
  }
})();
