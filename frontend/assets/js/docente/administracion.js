import { apiRequest } from '../api.js';
import { requireDocenteSession } from '../auth-guard.js';
import { clearElement, showBanner, hideBanner } from '../ui.js';

const state = {
  aulas: [],
  docentes: [],
  asignaciones: [],
  alumnos: []
};

const adminAlert = document.getElementById('adminAlert');
const tabs = document.querySelectorAll('[data-tab]');

// Elementos de Aulas
const aulaForm = document.getElementById('aulaForm');
const aulaFormTitle = document.getElementById('aulaFormTitle');
const aulaEditId = document.getElementById('aulaEditId');
const aulaNombre = document.getElementById('aulaNombre');
const aulaNivel = document.getElementById('aulaNivel');
const aulaPeriodo = document.getElementById('aulaPeriodo');
const aulaCapacidad = document.getElementById('aulaCapacidad');
const btnCancelAula = document.getElementById('btnCancelAula');
const aulasListContainer = document.getElementById('aulasListContainer');

// Elementos de Docentes
const docenteForm = document.getElementById('docenteForm');
const docenteFormTitle = document.getElementById('docenteFormTitle');
const docenteEditId = document.getElementById('docenteEditId');
const docenteNombres = document.getElementById('docenteNombres');
const docenteApellidos = document.getElementById('docenteApellidos');
const docenteCorreoGroup = document.getElementById('docenteCorreoGroup');
const docenteCorreo = document.getElementById('docenteCorreo');
const docentePasswordGroup = document.getElementById('docentePasswordGroup');
const docentePassword = document.getElementById('docentePassword');
const docenteEspecialidad = document.getElementById('docenteEspecialidad');
const docenteAdminGroup = document.getElementById('docenteAdminGroup');
const docenteEsAdmin = document.getElementById('docenteEsAdmin');
const btnCancelDocente = document.getElementById('btnCancelDocente');
const docentesListContainer = document.getElementById('docentesListContainer');

// Elementos de Asignaciones
const asignacionForm = document.getElementById('asignacionForm');
const asigDocenteSelect = document.getElementById('asigDocenteSelect');
const asigAulaSelect = document.getElementById('asigAulaSelect');
const asigTitular = document.getElementById('asigTitular');
const asignacionesListContainer = document.getElementById('asignacionesListContainer');

// Elementos de Alumnos
const alumnoForm = document.getElementById('alumnoForm');
const alumnoFormTitle = document.getElementById('alumnoFormTitle');
const alumnoEditId = document.getElementById('alumnoEditId');
const alumnoNombres = document.getElementById('alumnoNombres');
const alumnoApellidos = document.getElementById('alumnoApellidos');
const alumnoNacimiento = document.getElementById('alumnoNacimiento');
const alumnoAvatar = document.getElementById('alumnoAvatar');
const alumnoAulaSelect = document.getElementById('alumnoAulaSelect');
const btnCancelAlumno = document.getElementById('btnCancelAlumno');
const alumnosListContainer = document.getElementById('alumnosListContainer');

function buildEmptyBox(container, title, text) {
  clearElement(container);
  const box = document.createElement('div');
  box.className = 'empty-state';
  const h3 = document.createElement('h3');
  h3.textContent = title;
  const p = document.createElement('p');
  p.textContent = text;
  box.appendChild(h3);
  box.appendChild(p);
  container.appendChild(box);
}

function createTable(headers) {
  const wrap = document.createElement('div');
  wrap.className = 'table-wrap';
  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const tr = document.createElement('tr');
  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  table.appendChild(tbody);
  wrap.appendChild(table);
  return { wrap, tbody };
}

tabs.forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    tabBtn.classList.add('active');
    const selected = tabBtn.dataset.tab;
    ['aulas', 'docentes', 'asignaciones', 'alumnos'].forEach((name) => {
      const section = document.getElementById(`tab-${name}`);
      if (name === selected) {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    });
  });
});

function renderAulas() {
  if (state.aulas.length === 0) {
    buildEmptyBox(aulasListContainer, 'Todavía no hay aulas registradas', 'Crea la primera aula desde el formulario.');
    return;
  }

  const { wrap, tbody } = createTable(['AULA', 'NIVEL / PERIODO', 'ALUMNOS', 'ESTADO', 'ACCIONES']);
  state.aulas.forEach((aula) => {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.style.fontWeight = '700';
    tdNombre.textContent = aula.nombre;

    const tdNivel = document.createElement('td');
    tdNivel.textContent = `${aula.nivel} · ${aula.periodo_lectivo}`;

    const tdAlumnos = document.createElement('td');
    tdAlumnos.textContent = String(aula.total_alumnos || 0);

    const tdEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = aula.activa ? 'badge badge-mint' : 'badge badge-error';
    badge.textContent = aula.activa ? 'Activa' : 'Inactiva';
    tdEstado.appendChild(badge);

    const tdAcciones = document.createElement('td');
    tdAcciones.style.display = 'flex';
    tdAcciones.style.gap = '6px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-lavender btn-sm';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => {
      aulaEditId.value = String(aula.id);
      aulaFormTitle.textContent = `Editando ${aula.nombre}`;
      aulaNombre.value = aula.nombre;
      aulaNivel.value = aula.nivel;
      aulaPeriodo.value = aula.periodo_lectivo;
      aulaCapacidad.value = aula.capacidad || '';
      btnCancelAula.classList.remove('hidden');
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-secondary btn-sm';
    toggleBtn.textContent = aula.activa ? 'Desactivar' : 'Activar';
    toggleBtn.addEventListener('click', async () => {
      try {
        await apiRequest(`/api/docente/admin/aulas/${aula.id}/estado`, {
          method: 'PATCH',
          body: JSON.stringify({ activa: !aula.activa })
        });
        await loadAll();
      } catch (error) {
        showBanner(adminAlert, 'error', error.message);
      }
    });

    tdAcciones.appendChild(editBtn);
    tdAcciones.appendChild(toggleBtn);

    tr.appendChild(tdNombre);
    tr.appendChild(tdNivel);
    tr.appendChild(tdAlumnos);
    tr.appendChild(tdEstado);
    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });

  clearElement(aulasListContainer);
  aulasListContainer.appendChild(wrap);
}

function renderDocentes() {
  if (state.docentes.length === 0) {
    buildEmptyBox(docentesListContainer, 'Sin docentes registrados', 'Registra docentes desde el formulario.');
    return;
  }

  const { wrap, tbody } = createTable(['DOCENTE', 'CORREO', 'ROL', 'ESTADO', 'ACCIONES']);
  state.docentes.forEach((doc) => {
    const tr = document.createElement('tr');

    const tdNombre = document.createElement('td');
    tdNombre.style.fontWeight = '700';
    tdNombre.textContent = `${doc.nombres} ${doc.apellidos}`;

    const tdCorreo = document.createElement('td');
    tdCorreo.textContent = doc.correo;

    const tdRol = document.createElement('td');
    const roleBadge = document.createElement('span');
    roleBadge.className = doc.es_administrador ? 'badge badge-lavender' : 'badge badge-mint';
    roleBadge.textContent = doc.es_administrador ? 'Administrador' : 'Docente';
    tdRol.appendChild(roleBadge);

    const tdEstado = document.createElement('td');
    const stBadge = document.createElement('span');
    const isActive = Boolean(doc.docente_activo && doc.usuario_activo);
    stBadge.className = isActive ? 'badge badge-mint' : 'badge badge-error';
    stBadge.textContent = isActive ? 'Activo' : 'Inactivo';
    tdEstado.appendChild(stBadge);

    const tdAcciones = document.createElement('td');
    tdAcciones.style.display = 'flex';
    tdAcciones.style.gap = '6px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-lavender btn-sm';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => {
      docenteEditId.value = String(doc.id);
      docenteFormTitle.textContent = `Editando ${doc.nombres} ${doc.apellidos}`;
      docenteNombres.value = doc.nombres;
      docenteApellidos.value = doc.apellidos;
      docenteEspecialidad.value = doc.especialidad || '';
      docenteCorreoGroup.classList.add('hidden');
      docentePasswordGroup.classList.add('hidden');
      docenteAdminGroup.classList.add('hidden');
      btnCancelDocente.classList.remove('hidden');
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-secondary btn-sm';
    toggleBtn.textContent = isActive ? 'Desactivar' : 'Activar';
    toggleBtn.addEventListener('click', async () => {
      try {
        await apiRequest(`/api/docente/admin/docentes/${doc.id}/estado`, {
          method: 'PATCH',
          body: JSON.stringify({ activo: !isActive })
        });
        await loadAll();
      } catch (error) {
        showBanner(adminAlert, 'error', error.message);
      }
    });

    tdAcciones.appendChild(editBtn);
    tdAcciones.appendChild(toggleBtn);

    tr.appendChild(tdNombre);
    tr.appendChild(tdCorreo);
    tr.appendChild(tdRol);
    tr.appendChild(tdEstado);
    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });

  clearElement(docentesListContainer);
  docentesListContainer.appendChild(wrap);
}

function renderAsignaciones() {
  clearElement(asigDocenteSelect);
  clearElement(asigAulaSelect);

  state.docentes
    .filter((d) => d.docente_activo && d.usuario_activo)
    .forEach((d) => {
      const opt = document.createElement('option');
      opt.value = String(d.id);
      opt.textContent = `${d.nombres} ${d.apellidos}`;
      asigDocenteSelect.appendChild(opt);
    });

  state.aulas
    .filter((a) => a.activa)
    .forEach((a) => {
      const opt = document.createElement('option');
      opt.value = String(a.id);
      opt.textContent = `${a.nombre} (${a.nivel})`;
      asigAulaSelect.appendChild(opt);
    });

  if (state.asignaciones.length === 0) {
    buildEmptyBox(asignacionesListContainer, 'Todavía no hay asignaciones', 'Asigna un docente a un aula activa.');
    return;
  }

  const { wrap, tbody } = createTable(['DOCENTE', 'AULA', 'ESTADO', 'ACCIÓN']);
  state.asignaciones.forEach((asig) => {
    const tr = document.createElement('tr');
    const tdDoc = document.createElement('td');
    tdDoc.textContent = asig.docente_nombre;
    const tdAula = document.createElement('td');
    tdAula.textContent = `${asig.aula_nombre} (${asig.aula_nivel})`;
    const tdEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = asig.activo ? 'badge badge-mint' : 'badge badge-error';
    badge.textContent = asig.activo ? 'Activa' : 'Inactiva';
    tdEstado.appendChild(badge);

    const tdAcc = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-secondary btn-sm';
    btn.textContent = asig.activo ? 'Desactivar' : 'Reactivar';
    btn.addEventListener('click', async () => {
      try {
        await apiRequest(`/api/docente/admin/asignaciones/${asig.id}/estado`, {
          method: 'PATCH',
          body: JSON.stringify({ activo: !asig.activo })
        });
        await loadAll();
      } catch (error) {
        showBanner(adminAlert, 'error', error.message);
      }
    });
    tdAcc.appendChild(btn);

    tr.appendChild(tdDoc);
    tr.appendChild(tdAula);
    tr.appendChild(tdEstado);
    tr.appendChild(tdAcc);
    tbody.appendChild(tr);
  });

  clearElement(asignacionesListContainer);
  asignacionesListContainer.appendChild(wrap);
}

function renderAlumnos() {
  clearElement(alumnoAulaSelect);
  const emptyOpt = document.createElement('option');
  emptyOpt.value = '';
  emptyOpt.textContent = '-- Sin asignar aula todavía --';
  alumnoAulaSelect.appendChild(emptyOpt);

  state.aulas
    .filter((a) => a.activa)
    .forEach((a) => {
      const opt = document.createElement('option');
      opt.value = String(a.id);
      opt.textContent = `${a.nombre} (${a.nivel})`;
      alumnoAulaSelect.appendChild(opt);
    });

  if (state.alumnos.length === 0) {
    buildEmptyBox(alumnosListContainer, 'Todavía no hay alumnos registrados', 'Registra alumnos desde el formulario.');
    return;
  }

  const { wrap, tbody } = createTable(['ALUMNO', 'EDAD', 'AULA MATRÍCULA', 'ESTADO', 'ACCIONES']);
  state.alumnos.forEach((al) => {
    const tr = document.createElement('tr');
    const tdNom = document.createElement('td');
    tdNom.style.fontWeight = '700';
    tdNom.textContent = `${al.nombres} ${al.apellidos}`;

    const tdEdad = document.createElement('td');
    tdEdad.textContent = `${al.edad} años`;

    const tdAula = document.createElement('td');
    tdAula.textContent = al.aula_nombre ? `${al.aula_nombre} (${al.aula_nivel})` : 'Sin matrícula';

    const tdEstado = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = al.activo ? 'badge badge-mint' : 'badge badge-error';
    badge.textContent = al.activo ? 'Activo' : 'Inactivo';
    tdEstado.appendChild(badge);

    const tdAcc = document.createElement('td');
    tdAcc.style.display = 'flex';
    tdAcc.style.gap = '6px';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn btn-lavender btn-sm';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => {
      alumnoEditId.value = String(al.id);
      alumnoFormTitle.textContent = `Editando ${al.nombres} ${al.apellidos}`;
      alumnoNombres.value = al.nombres;
      alumnoApellidos.value = al.apellidos;
      alumnoNacimiento.value = String(al.fecha_nacimiento).slice(0, 10);
      alumnoAvatar.value = al.avatar_codigo || 'menta';
      alumnoAulaSelect.value = al.aula_id ? String(al.aula_id) : '';
      btnCancelAlumno.classList.remove('hidden');
    });

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'btn btn-secondary btn-sm';
    toggleBtn.textContent = al.activo ? 'Desactivar' : 'Activar';
    toggleBtn.addEventListener('click', async () => {
      try {
        await apiRequest(`/api/docente/admin/alumnos/${al.id}/estado`, {
          method: 'PATCH',
          body: JSON.stringify({ activo: !al.activo })
        });
        await loadAll();
      } catch (error) {
        showBanner(adminAlert, 'error', error.message);
      }
    });

    tdAcc.appendChild(editBtn);
    tdAcc.appendChild(toggleBtn);

    tr.appendChild(tdNom);
    tr.appendChild(tdEdad);
    tr.appendChild(tdAula);
    tr.appendChild(tdEstado);
    tr.appendChild(tdAcc);
    tbody.appendChild(tr);
  });

  clearElement(alumnosListContainer);
  alumnosListContainer.appendChild(wrap);
}

function resetAulaForm() {
  aulaEditId.value = '';
  aulaFormTitle.textContent = 'Registrar nueva aula';
  aulaForm.reset();
  btnCancelAula.classList.add('hidden');
}

function resetDocenteForm() {
  docenteEditId.value = '';
  docenteFormTitle.textContent = 'Registrar docente';
  docenteForm.reset();
  docenteCorreoGroup.classList.remove('hidden');
  docentePasswordGroup.classList.remove('hidden');
  docenteAdminGroup.classList.remove('hidden');
  btnCancelDocente.classList.add('hidden');
}

function resetAlumnoForm() {
  alumnoEditId.value = '';
  alumnoFormTitle.textContent = 'Registrar alumno';
  alumnoForm.reset();
  btnCancelAlumno.classList.add('hidden');
}

btnCancelAula.addEventListener('click', resetAulaForm);
btnCancelDocente.addEventListener('click', resetDocenteForm);
btnCancelAlumno.addEventListener('click', resetAlumnoForm);

aulaForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(adminAlert);
  const id = aulaEditId.value;
  const payload = {
    nombre: aulaNombre.value.trim(),
    nivel: aulaNivel.value.trim(),
    periodoLectivo: aulaPeriodo.value.trim(),
    capacidad: aulaCapacidad.value ? Number(aulaCapacidad.value) : null
  };

  try {
    if (id) {
      await apiRequest(`/api/docente/admin/aulas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      showBanner(adminAlert, 'success', 'Aula actualizada correctamente.');
    } else {
      await apiRequest('/api/docente/admin/aulas', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showBanner(adminAlert, 'success', 'Aula registrada correctamente.');
    }
    resetAulaForm();
    await loadAll();
  } catch (error) {
    showBanner(adminAlert, 'error', error.message);
  }
});

docenteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(adminAlert);
  const id = docenteEditId.value;

  try {
    if (id) {
      await apiRequest(`/api/docente/admin/docentes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          nombres: docenteNombres.value.trim(),
          apellidos: docenteApellidos.value.trim(),
          especialidad: docenteEspecialidad.value.trim()
        })
      });
      showBanner(adminAlert, 'success', 'Docente actualizado correctamente.');
    } else {
      await apiRequest('/api/docente/admin/docentes', {
        method: 'POST',
        body: JSON.stringify({
          nombres: docenteNombres.value.trim(),
          apellidos: docenteApellidos.value.trim(),
          correo: docenteCorreo.value.trim(),
          password: docentePassword.value,
          especialidad: docenteEspecialidad.value.trim(),
          esAdministrador: docenteEsAdmin.checked
        })
      });
      showBanner(adminAlert, 'success', 'Docente creado correctamente.');
    }
    resetDocenteForm();
    await loadAll();
  } catch (error) {
    showBanner(adminAlert, 'error', error.message);
  }
});

asignacionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(adminAlert);

  try {
    await apiRequest('/api/docente/admin/asignaciones', {
      method: 'POST',
      body: JSON.stringify({
        docenteId: Number(asigDocenteSelect.value),
        aulaId: Number(asigAulaSelect.value),
        esTitular: asigTitular.checked
      })
    });
    showBanner(adminAlert, 'success', 'Docente asignado al aula correctamente.');
    await loadAll();
  } catch (error) {
    showBanner(adminAlert, 'error', error.message);
  }
});

alumnoForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner(adminAlert);
  const id = alumnoEditId.value;
  const payload = {
    nombres: alumnoNombres.value.trim(),
    apellidos: alumnoApellidos.value.trim(),
    fechaNacimiento: alumnoNacimiento.value,
    avatarCodigo: alumnoAvatar.value,
    aulaId: alumnoAulaSelect.value ? Number(alumnoAulaSelect.value) : null
  };

  try {
    if (id) {
      await apiRequest(`/api/docente/admin/alumnos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (payload.aulaId) {
        await apiRequest(`/api/docente/admin/alumnos/${id}/matricula`, {
          method: 'PUT',
          body: JSON.stringify({ aulaId: payload.aulaId })
        });
      }
      showBanner(adminAlert, 'success', 'Alumno actualizado correctamente.');
    } else {
      await apiRequest('/api/docente/admin/alumnos', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showBanner(adminAlert, 'success', 'Alumno registrado correctamente.');
    }
    resetAlumnoForm();
    await loadAll();
  } catch (error) {
    showBanner(adminAlert, 'error', error.message);
  }
});

async function loadAll() {
  const [aulasRes, docentesRes, asigRes, alumnosRes] = await Promise.all([
    apiRequest('/api/docente/admin/aulas'),
    apiRequest('/api/docente/admin/docentes'),
    apiRequest('/api/docente/admin/asignaciones'),
    apiRequest('/api/docente/admin/alumnos')
  ]);

  state.aulas = aulasRes.data.aulas || [];
  state.docentes = docentesRes.data.docentes || [];
  state.asignaciones = asigRes.data.asignaciones || [];
  state.alumnos = alumnosRes.data.alumnos || [];

  renderAulas();
  renderDocentes();
  renderAsignaciones();
  renderAlumnos();
}

(async () => {
  const user = await requireDocenteSession({ requireAdmin: true });
  if (!user) {
    return;
  }
  try {
    await loadAll();
  } catch (error) {
    showBanner(adminAlert, 'error', error.message);
  }
})();
