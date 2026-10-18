import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { CONFIG, MODELS, PLAYER, COLLECTIBLE, TEXTURES } from './config.js';
import { parseMaze, cellToWorld, createFloor, createWalls, MAZE_SIZE } from './maze.js';
import { loadModel } from './modelLoader.js';
import { PlayerController } from './controls.js';
import { Camera, Minimap } from './cameras.js';
import { CollectibleSystem } from './collectibles.js';
import { FairyAnimator } from './fairyAnimator.js';
import { createHud } from './hud.js';
import { Game } from './game.js';


const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ad7ff);
scene.fog = new THREE.Fog(0x9ad7ff, 25, 90);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);

renderer.shadowMap.enabled = true;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
document.body.appendChild(renderer.domElement);

//ESTADISTICAS (LAB2)
const statsPanels = [0, 1, 2].map((panel) => {
  const stats = new Stats();
  stats.showPanel(panel);
  Object.assign(stats.dom.style, { left: 'auto', top: '0px', right: `${panel * 80}px` });
  document.body.appendChild(stats.dom);
  return stats;
});

const worldSpan = Math.max(MAZE_SIZE.rows, MAZE_SIZE.cols) * CONFIG.CELL_SIZE;

const world = new THREE.Group(); world.name = 'world';
scene.add(world);

const lights = new THREE.Group(); lights.name = 'lights';
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 0.9);
const sun = new THREE.DirectionalLight(0xfff2d0, 1.2);
sun.position.set(20, 40, 15);
sun.castShadow = true;
sun.shadow.camera.left = sun.shadow.camera.bottom = -worldSpan / 2;
sun.shadow.camera.right = sun.shadow.camera.top = worldSpan / 2;
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.mapSize.set(2048, 2048);
hemi.layers.enable(1);
sun.layers.enable(1);
lights.add(hemi, sun);
world.add(lights);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

function loadTexture(path, repeatX = 1, repeatY = 1) {
  const texture = textureLoader.load(path);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

const wallMaterial = new THREE.MeshLambertMaterial({ map: loadTexture(TEXTURES.WALL) });

const floorMaterial = new THREE.MeshLambertMaterial({
  map: loadTexture(TEXTURES.FLOOR, MAZE_SIZE.cols, MAZE_SIZE.rows),
});


const { items, start } = parseMaze();
const maze = new THREE.Group(); maze.name = 'maze';
const wallsGroup = createWalls(wallMaterial);
maze.add(createFloor(floorMaterial), wallsGroup);
world.add(maze);


const collectibles = new THREE.Group(); collectibles.name = 'collectibles';
world.add(collectibles);


const player = new THREE.Group(); player.name = 'player';
const startPos = cellToWorld(start.row, start.col);
player.position.copy(startPos);
world.add(player);

world.updateMatrixWorld(true);

const controller = new PlayerController(player, wallsGroup);
const rig = new Camera(innerWidth / innerHeight, player, wallsGroup);
const minimap = new Minimap(renderer, scene, player, worldSpan);


const hud = createHud(items.length);
const game = new Game({
  totalItems: items.length,
  hud,
  onReset: () => {
    controller.reset(startPos);
    rig.reset();
    collectibleSystem.reset();
  },
});
let fairyAnimator = null;

const collectibleSystem = new CollectibleSystem(collectibles, (pivot) => {
  game.collect(pivot.userData.points, pivot.userData.label);
});


const minimapDotGeo = new THREE.SphereGeometry(0.6, 8, 8);

async function populate() {
  const counters = {};
  const jobs = items.map(async (item) => {
    const model = await loadModel(MODELS[item.type]);
    const n = (counters[item.type] = (counters[item.type] ?? 0) + 1);

    const pivot = new THREE.Group();
    pivot.name = `collectible_${item.type}_${n}`;
    const p = cellToWorld(item.row, item.col);
    pivot.position.set(p.x, CONFIG.OBJECT_FLOAT_HEIGHT, p.z);

    const glow = new THREE.PointLight(item.glow, COLLECTIBLE.GLOW_BASE, 6);
    glow.name = 'glow';
    glow.layers.enable(1);

    //solo para el minimapa:
    const dot = new THREE.Mesh(minimapDotGeo, new THREE.MeshBasicMaterial({ color: item.glow }));
    dot.layers.set(1);
    model.add(dot);

    pivot.add(model, glow);
    pivot.userData = {
      type: item.type, points: item.points, label: item.label,
      baseY: CONFIG.OBJECT_FLOAT_HEIGHT,
      phase: Math.random() * Math.PI * 2,//para que floten diferente
      state: 'idle', timer: 0, model, glow,
    };
    collectibles.add(pivot);
  });

  const fairyJob = loadModel(MODELS.fairy, { anchor: 'bottom' }).then((model) => {
    const fairy = new THREE.Group();
    fairy.name = 'fairy';
    model.rotation.y = PLAYER.MODEL_TURN;
    fairy.add(model);
    fairy.position.y = PLAYER.FAIRY_FLOAT;
    player.add(fairy);
    fairyAnimator = new FairyAnimator(fairy);
  });

  await Promise.all([...jobs, fairyJob]);
  console.log('Mundo listo:', collectibles.children.length, 'objetos mágicos');
}
populate().catch(console.error).finally(() => game.setReady());


addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyV') rig.toggleMode();
  if (e.code === 'KeyM') minimap.toggleMode();
  if ((e.code === 'KeyR' || e.code === 'Enter') && game.isGameOver) game.restart();
});

addEventListener('resize', () => {
  rig.setAspect(innerWidth / innerHeight);
  renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();
let time = 0;
renderer.setAnimationLoop(() => {
  const timeStep = Math.min(clock.getDelta(), 0.05);
  time += timeStep;

  controller.enabled = game.canMove;
  if (game.state === 'ready' && controller.wantsToMove) game.start();
  controller.update(timeStep);
  collectibleSystem.update(timeStep, time, player.position);
  fairyAnimator?.update(timeStep, controller.moveInput);
  rig.update(timeStep, controller.rotationY);
  minimap.update(controller.rotationY);

  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, innerWidth, innerHeight);
  renderer.render(scene, rig.camera);
  minimap.render();

  game.update(timeStep);

  statsPanels.forEach((s) => s.update());
});

