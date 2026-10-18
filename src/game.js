import { GAME } from './config.js';

export class Game {
  constructor({ totalItems, hud, onReset }) {
    this.totalItems = totalItems;
    this.hud = hud;
    this.onReset = onReset;
    this.bestScore = 0;
    this.state = 'loading';
    this.resetValues();
    hud.toast('Cargando...', 0);
  }

  get canMove() { 
    return this.state === 'ready' || this.state === 'playing'; 
  }

  get isGameOver() { 
    return this.state === 'won' || this.state === 'lost'; 
  }

  resetValues() {
    this.timeLeft = GAME.TIME_LIMIT;
    this.score = 0;
    this.itemsCollected = 0;
    this.hasWarnedLowTime = false;
    this.hud.update(0, 0);
    this.hud.setTime(this.timeLeft);
  }

  setReady() {
    if (this.state !== 'loading') return;
    this.state = 'ready';
    this.hud.toast('Pulsa W A S D para empezar', 0);
  }

  start() {
    if (this.state !== 'ready') return;
    this.state = 'playing';
    this.hud.toast('Recoge todos los objetos antes de que acabe el tiempo', 2500);
  }

  update(timeStep) {
    if (this.state !== 'playing') return;
    this.timeLeft = Math.max(0, this.timeLeft - timeStep);
    this.hud.setTime(this.timeLeft);

    if (!this.hasWarnedLowTime && this.timeLeft <= GAME.WARNING_SECONDS && this.timeLeft > 0) {
      this.hasWarnedLowTime = true;
      this.hud.toast(`¡Quedan ${GAME.WARNING_SECONDS} segundos!`);
    }
    if (this.timeLeft === 0) this.endGame(false);
  }

  collect(points, label) {
    if (!this.canMove) return;
    this.start();
    this.score += points;
    this.itemsCollected += 1;
    this.hud.update(this.score, this.itemsCollected);

    if (this.itemsCollected === this.totalItems) this.endGame(true);
    else this.hud.toast(`+${points} ${label}`);
  }

  endGame(isVictory) {
    this.state = isVictory ? 'won' : 'lost';
    const bonus = isVictory ? Math.ceil(this.timeLeft) * GAME.TIME_BONUS_PER_SECOND : 0;
    const finalScore = this.score + bonus;
    const newRecord = finalScore > this.bestScore;
    if (newRecord) this.bestScore = finalScore;

    this.hud.clearToast();

    this.hud.showResult({
      won: isVictory,
      collected: this.itemsCollected,
      total: this.totalItems,
      itemPoints: this.score, bonus, finalScore,
      timeUsed: GAME.TIME_LIMIT - this.timeLeft,
      best: this.bestScore,
      newRecord,
    }, () => this.restart());
  }

  restart() {
    if (!this.isGameOver) return;
    this.hud.hideResult();
    this.resetValues();
    this.onReset();
    this.state = 'ready';
    this.hud.toast('Pulsa W A S D para empezar', 0);
  }
}
