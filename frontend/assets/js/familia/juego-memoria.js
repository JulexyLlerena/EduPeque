const PAIRS = [
  { id: 1, symbol: '🦊', label: 'Zorrito' },
  { id: 2, symbol: '🌻', label: 'Girasol' },
  { id: 3, symbol: '🦋', label: 'Mariposa' }
];

const memoryBoard = document.getElementById('memoryBoard');
const retryModal = document.getElementById('retryModal');
const btnSeguirJugando = document.getElementById('btnSeguirJugando');
const btnReiniciarJuego = document.getElementById('btnReiniciarJuego');

let cards = [];
let flippedIndices = [];
let matchedPairIds = new Set();
let locked = false;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderBoard() {
  while (memoryBoard.firstChild) {
    memoryBoard.removeChild(memoryBoard.firstChild);
  }

  cards.forEach((card, index) => {
    const isFlipped = flippedIndices.includes(index);
    const isMatched = matchedPairIds.has(card.id);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `memory-card${isFlipped ? ' revealed' : ''}${isMatched ? ' matched' : ''}`;
    btn.disabled = isMatched || isFlipped || locked;

    const symbol = document.createElement('span');
    symbol.className = 'memory-card-symbol';
    symbol.textContent = isFlipped || isMatched ? card.symbol : '?';

    const caption = document.createElement('span');
    caption.style.fontSize = '0.84rem';
    caption.textContent = isFlipped || isMatched ? card.label : 'Tócame';

    btn.appendChild(symbol);
    btn.appendChild(caption);

    btn.addEventListener('click', () => handleFlip(index));
    memoryBoard.appendChild(btn);
  });
}

function handleFlip(index) {
  if (locked || flippedIndices.includes(index)) {
    return;
  }

  flippedIndices.push(index);
  renderBoard();

  if (flippedIndices.length === 2) {
    locked = true;
    const [firstIdx, secondIdx] = flippedIndices;
    const firstCard = cards[firstIdx];
    const secondCard = cards[secondIdx];

    if (firstCard.id === secondCard.id) {
      matchedPairIds.add(firstCard.id);
      const badge = document.getElementById(`pairBadge${firstCard.id}`);
      if (badge) {
        badge.className = 'badge badge-mint';
        badge.textContent = `Pareja ${firstCard.id} ✓`;
      }
      flippedIndices = [];
      locked = false;
      renderBoard();

      if (matchedPairIds.size === PAIRS.length) {
        setTimeout(() => {
          window.location.href = '/pages/familia/juego-resultados.html';
        }, 500);
      }
    } else {
      setTimeout(() => {
        retryModal.classList.remove('hidden');
      }, 450);
    }
  }
}

function initGame() {
  cards = shuffle([...PAIRS, ...PAIRS]);
  flippedIndices = [];
  matchedPairIds = new Set();
  locked = false;
  [1, 2, 3].forEach((n) => {
    const badge = document.getElementById(`pairBadge${n}`);
    if (badge) {
      badge.className = 'badge badge-lavender';
      badge.textContent = `Pareja ${n}`;
    }
  });
  retryModal.classList.add('hidden');
  renderBoard();
}

btnSeguirJugando.addEventListener('click', () => {
  flippedIndices = [];
  locked = false;
  retryModal.classList.add('hidden');
  renderBoard();
});

btnReiniciarJuego.addEventListener('click', initGame);

initGame();
