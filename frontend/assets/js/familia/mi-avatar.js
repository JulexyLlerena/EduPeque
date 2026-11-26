import { showBanner } from '../ui.js';

const AVATARS = [
  { code: 'menta', label: 'Menta' },
  { code: 'violeta', label: 'Violeta' },
  { code: 'sol', label: 'Sol' },
  { code: 'coral', label: 'Coral' },
  { code: 'melocoton', label: 'Melocotón' },
  { code: 'lila', label: 'Lila' },
  { code: 'cielo', label: 'Cielo' }
];

let selectedCode = 'menta';

const currentAvatarImg = document.getElementById('currentAvatarImg');
const avatarGrid = document.getElementById('avatarGrid');
const btnGuardarAvatar = document.getElementById('btnGuardarAvatar');
const avatarFeedback = document.getElementById('avatarFeedback');

function renderAvatars() {
  while (avatarGrid.firstChild) {
    avatarGrid.removeChild(avatarGrid.firstChild);
  }

  AVATARS.forEach((item) => {
    const isSelected = item.code === selectedCode;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `avatar-option${isSelected ? ' selected' : ''}`;

    const img = document.createElement('img');
    img.src = `/assets/img/avatar-${item.code}.svg`;
    img.alt = item.label;
    img.style.width = '72px';
    img.style.margin = '0 auto 10px';

    const title = document.createElement('div');
    title.style.fontWeight = '800';
    title.textContent = item.label;

    btn.appendChild(img);
    btn.appendChild(title);

    if (isSelected) {
      const check = document.createElement('div');
      check.style.fontSize = '0.78rem';
      check.style.fontWeight = '700';
      check.style.color = 'var(--color-primary)';
      check.textContent = '✓ Elegido';
      btn.appendChild(check);
    }

    btn.addEventListener('click', () => {
      selectedCode = item.code;
      currentAvatarImg.src = `/assets/img/avatar-${item.code}.svg`;
      renderAvatars();
    });

    avatarGrid.appendChild(btn);
  });
}

btnGuardarAvatar.addEventListener('click', () => {
  showBanner(
    avatarFeedback,
    'info',
    `Vista previa actualizada al avatar ${selectedCode}. La persistencia de avatares en MySQL se activará con el módulo familiar completo.`
  );
});

renderAvatars();
