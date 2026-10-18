import { COLLECTIBLE } from './config.js';

export class CollectibleSystem {
  constructor(group, onCollect) {
    this.group = group;
    this.onCollect = onCollect;
  }

  reset() {
    for (const item of this.group.children) {
      const data = item.userData;

      data.state = 'idle';
      data.timer = 0;
      data.model.visible = true;
      item.scale.setScalar(1);
      item.position.y = data.baseY;
      data.glow.intensity = COLLECTIBLE.GLOW_BASE;
    }
  }

  update(timeStep, time, playerPos) {
    const C = COLLECTIBLE;

    for (const item of this.group.children) {
      const data = item.userData;
      if (data.state === 'done') continue;

      if (data.state === 'idle') {
        const swing = Math.sin(time * C.FLOAT_SPEED + data.phase);//la onda seno para el sube y baja
        item.position.y = data.baseY + swing * C.FLOAT_AMPLITUDE;//para el giro
        item.rotation.y += C.SPIN_SPEED * timeStep;
        data.glow.intensity = C.GLOW_BASE + swing * C.GLOW_PULSE; //y para el brillo también

        const dx = playerPos.x - item.position.x;
        const dz = playerPos.z - item.position.z;

        if (dx * dx + dz * dz < C.PICKUP_RADIUS * C.PICKUP_RADIUS) {
          data.state = 'collecting';
          data.timer = 0;
          this.onCollect?.(item);
        }
      } else {

        data.timer += timeStep;
        const progress = Math.min(data.timer / C.COLLECT_TIME, 1);//tope en el 100%
        item.position.y += 2.5 * timeStep;
        item.scale.setScalar(Math.max(1 - progress, 0.001));
        data.glow.intensity = C.GLOW_BASE * (1 - progress);

        if (progress >= 1) {
          data.model.visible = false;
          data.glow.intensity = 0;
          data.state = 'done';
        }
      }
    }
  }
}
