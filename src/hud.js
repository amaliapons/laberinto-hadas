import { GAME } from './config.js';

const $ = (id) => document.getElementById(id);

function mmss(seconds) {
  const s = Math.ceil(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function createHud(total) {
  const timeEl = $('time');
  const scoreEl = $('score');
  const toastEl = $('toast');
  const overlay = $('overlay');

  let timer = null;
  let shownSecond = null;

  return {
    update(points, collected) {
      scoreEl.textContent = `✨ ${points} puntos · ${collected}/${total} objetos ✨`;
    },

    setTime(seconds) {
      const s = Math.ceil(seconds);
      if (s === shownSecond) return;
      shownSecond = s;
      timeEl.textContent = `⌛ ${mmss(seconds)}`;
      timeEl.classList.toggle('danger', s <= GAME.WARNING_SECONDS);
    },

    toast(text, ms = 1400) {
      toastEl.textContent = text;
      toastEl.style.opacity = '1';
      clearTimeout(timer);
      if (ms > 0) timer = setTimeout(() => { toastEl.style.opacity = '0'; }, ms);
    },
    clearToast() {
      clearTimeout(timer);
      toastEl.style.opacity = '0';
    },

    showResult(r, onRestart) {
      $('result-title').textContent = r.won ? '¡Has ganado!' : '¡Se acabó el tiempo!';
      $('result-sub').textContent = r.won
        ? `Has recogido todos los objetos mágicos en ${mmss(r.timeUsed)}.`
        : `Has recogido ${r.collected} de ${r.total} objetos mágicos.`;
      $('items-label').textContent = `Objetos (${r.collected}/${r.total})`;
      $('items-points').textContent = `+${r.itemPoints}`;
      $('bonus-row').style.display = r.won ? 'flex' : 'none';
      $('bonus').textContent = `+${r.bonus}`;
      $('final-score').textContent = r.finalScore;
      $('record').textContent = r.newRecord ? '🏆 ¡Nuevo récord! 🎉' : `Mejor puntuación: ${r.best}`;

      overlay.style.display = 'flex';
      $('restart').onclick = () => { $('restart').blur(); onRestart(); };
    },

    hideResult() {
      overlay.style.display = 'none';
    },
  };
}
