import * as THREE from 'three';
import { CONFIG, PLAYER } from './config.js';

const _movimientoFrame = new THREE.Vector3();
const _direccionRayo = new THREE.Vector3();
const _vectorLateral = new THREE.Vector3();
const _origenRayo = new THREE.Vector3();


export class PlayerController {
  constructor(player, wallsGroup) {
    this.player = player;
    this.walls = wallsGroup.children;
    this.rotationY = player.rotation.y;
    this.keys = new Set(); //mejor esto que el array
    this.moveInput = 0;
    this.enabled = true;
    this.raycaster = new THREE.Raycaster();

    addEventListener('keydown', (e) => this.keys.add(e.code));
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear()); //se quedaba pillada al tocar otra ventana!!
  }

  isPressed(...codes) { 
    return codes.some((c) => this.keys.has(c)); 
  }

  get wantsToMove() {
    return this.isPressed('KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight');
  }

  reset(position) {
    this.player.position.copy(position);
    this.rotationY = 0;
    this.player.rotation.y = 0;
    this.moveInput = 0;
  }

  getForward(out = new THREE.Vector3()) {
    return out.set(-Math.sin(this.rotationY), 0, -Math.cos(this.rotationY));
  }

  update(timeStep) {
    if (!this.enabled) { 
      this.moveInput = 0; 
      return; 
    }

    const turn = (this.isPressed('KeyA', 'ArrowLeft') ? 1 : 0) - (this.isPressed('KeyD', 'ArrowRight') ? 1 : 0);
    this.rotationY += turn * PLAYER.TURN_SPEED * timeStep;
    this.player.rotation.y = this.rotationY;

    const move = (this.isPressed('KeyW', 'ArrowUp') ? 1 : 0) - (this.isPressed('KeyS', 'ArrowDown') ? 1 : 0);
    this.moveInput = move;
    if (move === 0) return;

    const speed = move > 0 ? PLAYER.FORWARD_SPEED : PLAYER.BACK_SPEED;
    this.getForward(_movimientoFrame).multiplyScalar(move * speed * timeStep);
    const mx = _movimientoFrame.x, mz = _movimientoFrame.z;

    //DESLIZAMIENTO POR LAS PAREDES EN CASO DE QUE SE CHOQUE (mejor que antes)
    if (mx !== 0 && !this.blocked(Math.sign(mx), 0, Math.abs(mx))) this.player.position.x += mx;
    if (mz !== 0 && !this.blocked(0, Math.sign(mz), Math.abs(mz))) this.player.position.z += mz;
  }

  blocked(dx, dz, step) {
    _direccionRayo.set(dx, 0, dz);
    _vectorLateral.set(dz, 0, -dx);
    this.raycaster.far = step + PLAYER.WALL_DISTANCE;

    for (const side of [-PLAYER.WALL_DISTANCE, 0, PLAYER.WALL_DISTANCE]) {
      _origenRayo.copy(this.player.position).addScaledVector(_vectorLateral, side);
      _origenRayo.y = CONFIG.WALL_HEIGHT / 2;
      this.raycaster.set(_origenRayo, _direccionRayo);
      if (this.raycaster.intersectObjects(this.walls, false).length > 0) return true;
    }
    return false;
  }
}