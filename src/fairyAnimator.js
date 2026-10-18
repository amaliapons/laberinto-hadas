import { FAIRY_ANIM, PLAYER } from './config.js';

export class FairyAnimator {
  constructor(fairy) {
    this.fairy = fairy;
    this.timer = 0;
    this.tilt = 0;
  }

  update(timeStep, moveInput) {
    this.timer += timeStep;
    const A = FAIRY_ANIM;

    this.fairy.position.y = PLAYER.FAIRY_FLOAT + Math.sin(this.timer * A.FLOATING_SPEED) * A.FLOATING_AMPLITUDE;

    const target = -A.TILT * moveInput;
    this.tilt += (target - this.tilt) * (1 - Math.exp(-5 * timeStep));//suave
    this.fairy.rotation.x = this.tilt;
  }
}