import * as THREE from 'three';
import { CONFIG, CAMERA, MINIMAP } from './config.js';

const _puntoDeEnfoque = new THREE.Vector3();
const _posicionIdealCamara = new THREE.Vector3();
const _trayectoriaDelRayo = new THREE.Vector3();


export class Camera {
  constructor(aspectRatio, player, wallsGroup) {
    this.camera = new THREE.PerspectiveCamera(CAMERA.FOV, aspectRatio, CAMERA.NEAR, CAMERA.FAR);
    this.player = player;
    this.walls = wallsGroup.children;
    this.mode = 'third';
    this.rotationY = player.rotation.y;
    this.raycaster = new THREE.Raycaster();
    this.fairy = null;
  }

  toggleMode() { 
    this.mode = this.mode === 'third' ? 'first' : 'third'; 
  }

  reset() { 
    this.rotationY = 0; 
  }

  setAspect(aspectRatio) { 
    this.camera.aspect = aspectRatio; 
    this.camera.updateProjectionMatrix(); 
  }

  update(timeStep, playerRotationY) {
    this.fairy ||= this.player.getObjectByName('fairy');
    if (this.fairy) this.fairy.visible = this.mode === 'third';

    if (this.mode === 'first') {
      this.camera.position.copy(this.player.position);
      this.camera.position.y = CONFIG.PLAYER_EYE_HEIGHT;
      this.camera.rotation.set(0, playerRotationY, 0);
      return;
    }

    const diff = Math.atan2(Math.sin(playerRotationY - this.rotationY), Math.cos(playerRotationY - this.rotationY));
    this.rotationY += diff * (1 - Math.exp(-CAMERA.SMOOTH_TURN * timeStep)); //se supone que Math.exp crea el efecto suave


    _puntoDeEnfoque.copy(this.player.position);
    _puntoDeEnfoque.y = CAMERA.TARGET_HEIGHT;
    _posicionIdealCamara.set(
      _puntoDeEnfoque.x + Math.sin(this.rotationY) * CAMERA.DISTANCE,
      CAMERA.HEIGHT,
      _puntoDeEnfoque.z + Math.cos(this.rotationY) * CAMERA.DISTANCE
    );

    _trayectoriaDelRayo.subVectors(_posicionIdealCamara, _puntoDeEnfoque);
    const fullDist = _trayectoriaDelRayo.length();
    _trayectoriaDelRayo.divideScalar(fullDist);

    this.raycaster.set(_puntoDeEnfoque, _trayectoriaDelRayo);
    this.raycaster.far = fullDist + CAMERA.WALL_MARGIN;
    const hit = this.raycaster.intersectObjects(this.walls, false)[0];
    const dist = hit ? Math.max(hit.distance - CAMERA.WALL_MARGIN, 0.5) : fullDist;

    this.camera.position.copy(_puntoDeEnfoque).addScaledVector(_trayectoriaDelRayo, Math.min(dist, fullDist));
    this.camera.lookAt(_puntoDeEnfoque);
  }
}


export class Minimap {
  constructor(renderer, scene, player, worldSpan) {
    this.renderer = renderer;
    this.scene = scene;
    this.player = player;
    this.worldSpan = worldSpan;
    this.localMode = true;

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);

    this.camera.layers.set(1);

    this.marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 2.2, 3),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a })
    );
    this.marker.name = 'minimapMarker';
    this.marker.geometry.rotateX(-Math.PI / 2);
    this.marker.position.y = CONFIG.WALL_HEIGHT + 5; //para que se vea bien
    this.marker.layers.set(1);
    player.add(this.marker);


    this.frame = document.createElement('div'); //marco rosita html
    Object.assign(this.frame.style, {
      position: 'fixed', left: `${MINIMAP.MARGIN}px`, bottom: `${MINIMAP.MARGIN}px`,
      width: `${MINIMAP.SIZE}px`, height: `${MINIMAP.SIZE}px`,
      border: '5px solid #ffeafc', borderRadius: '5px', boxSizing: 'border-box',
      pointerEvents: 'none',
    });
    document.body.appendChild(this.frame);

    this.applyZoom();

  }

  toggleMode() { 
    this.localMode = !this.localMode; 
    this.applyZoom(); 
  }

  applyZoom() {
    const h = this.localMode ? MINIMAP.LOCAL_VIEW : this.worldSpan / 2; //la mitad porque si no se ve de lejos
    Object.assign(this.camera, { left: -h, right: h, top: h, bottom: -h });
    this.camera.updateProjectionMatrix();
  }

  update(playerRotationY) {
    const p = this.player.position;
    if (this.localMode) {
      this.camera.position.set(p.x, 50, p.z);
      this.camera.up.set(-Math.sin(playerRotationY), 0, -Math.cos(playerRotationY)); //para que gire!!
      this.camera.lookAt(p.x, 0, p.z);
    } else {
      this.camera.position.set(0, 50, 0);
      this.camera.up.set(0, 0, -1);
      this.camera.lookAt(0, 0, 0);
    }
  }

  render() {
    const r = this.renderer;
    const { SIZE, MARGIN } = MINIMAP;
    const fog = this.scene.fog;
    const { near, far } = fog;
    fog.near = 1e5; //infintito para que no se vea nada
    fog.far = 1e6;

    r.setScissorTest(true); //(ahorrar potencia)

    r.setViewport(MARGIN, MARGIN, SIZE, SIZE);
    r.setScissor(MARGIN, MARGIN, SIZE, SIZE);
    r.clearDepth();
    r.render(this.scene, this.camera);

    r.setScissorTest(false);
    fog.near = near; fog.far = far;
  }
}