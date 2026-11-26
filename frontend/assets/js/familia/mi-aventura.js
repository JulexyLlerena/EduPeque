const misionModal = document.getElementById('misionModal');
const btnAbrirMision = document.getElementById('btnAbrirMision');
const btnAceptarMision = document.getElementById('btnAceptarMision');
const btnCerrarMision = document.getElementById('btnCerrarMision');

btnAbrirMision.addEventListener('click', () => {
  misionModal.classList.remove('hidden');
});

[btnAceptarMision, btnCerrarMision].forEach((btn) => {
  btn.addEventListener('click', () => {
    misionModal.classList.add('hidden');
  });
});
