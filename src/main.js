import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { CONFIG, MODELS, PLAYER, COLLECTIBLE, TEXTURES, SKY, LIGHTING, GAME } from './config.js';
import { parseMaze, cellToWorld, createFloor, createWalls, rebuildWalls, MAZE_SIZE } from './maze.js';
import { createLevelGenerator } from './mazeGenerator.js';
import { createDecorations } from './decorations.js';
import { loadModel } from './modelLoader.js';
import { PlayerController } from './controls.js';
import { Camera, Minimap } from './cameras.js';
import { CollectibleSystem } from './collectibles.js';
import { FairyAnimator } from './fairyAnimator.js';
import { createHud } from './hud.js';
import { Game } from './game.js';


const scene = new THREE.Scene();
const skyTint = new THREE.Color(SKY.HORIZON_COLOR).multiplyScalar(SKY.BRIGHTNESS); 
scene.background = skyTint.clone(); //provisional hasta carga skybox
scene.fog = new THREE.Fog(skyTint, 25, 90);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);

renderer.shadowMap.enabled = true;

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
const hemi = new THREE.HemisphereLight(0xffffff, 0x4a7a3a, LIGHTING.HEMI_INTENSITY);
const sun = new THREE.DirectionalLight(0xfff2d0, LIGHTING.SUN_INTENSITY);
sun.position.set(20, 40, 15);
sun.castShadow = true;

sun.shadow.camera.left = sun.shadow.camera.bottom = -worldSpan * 0.75;
sun.shadow.camera.right = sun.shadow.camera.top = worldSpan * 0.75;
sun.shadow.camera.updateProjectionMatrix();
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;


const minimapHemi = new THREE.HemisphereLight(0xffffff, 0x4a7a3a, LIGHTING.MINIMAP_HEMI);
const minimapSun = new THREE.DirectionalLight(0xfff2d0, LIGHTING.MINIMAP_SUN);
minimapSun.position.copy(sun.position);
minimapHemi.layers.set(1);
minimapSun.layers.set(1);
lights.add(hemi, sun, minimapHemi, minimapSun);
world.add(lights);

const textureLoader = new THREE.TextureLoader();


textureLoader.load(SKY.PATH, (sky) => {
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.SRGBColorSpace;
  scene.background = sky;
  scene.backgroundIntensity = SKY.BRIGHTNESS;
}, undefined, () => console.error(`No se pudo cargar el skybox: ${SKY.PATH}`));
const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

function loadTexture(path, repeatX = 1, repeatY = 1) {
  const texture = textureLoader.load(path, undefined, undefined,
    () => console.error(`No se pudo cargar la textura: ${path} (revisa la ruta y las mayúsculas/minúsculas)`));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = maxAnisotropy;
  return texture;
}

const wallMaterials = TEXTURES.WALLS.map((path) => new THREE.MeshLambertMaterial({ map: loadTexture(path) }));

const floorMaterial = new THREE.MeshLambertMaterial({
  map: loadTexture(TEXTURES.FLOOR, MAZE_SIZE.cols, MAZE_SIZE.rows),
});



const nextLevel = createLevelGenerator();
let level = nextLevel();
let { items, start } = parseMaze(level.map);
logLevel(level);

const maze = new THREE.Group(); maze.name = 'maze';
const wallsGroup = createWalls(wallMaterials, level.map);
maze.add(createFloor(floorMaterial), wallsGroup);
world.add(maze);

//decoración estática (arbustos, setas, flores, rocas, farolillos)
let decorations = createDecorations(level.map);
world.add(decorations);


const collectibles = new THREE.Group(); collectibles.name = 'collectibles';
world.add(collectibles);


const player = new THREE.Group(); player.name = 'player';
let startPos = cellToWorld(start.row, start.col);
player.position.copy(startPos);
player.rotation.y = start.facing; //mirando hacia el pasillo, no hacia un muro
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
    loadNewLevel();
    controller.reset(startPos, start.facing);
    rig.reset(start.facing);
    collectibleSystem.reset();
    placeCollectibles();
  },
});
let fairyAnimator = null;

const collectibleSystem = new CollectibleSystem(collectibles, (pivot) => {
  game.collect(pivot.userData.points, pivot.userData.label);
});

function logLevel({ info }) {
  console.log(`Laberinto: mejor ruta ${info.routeCells} casillas ≈ ${info.routeSeconds.toFixed(0)} s de ${GAME.TIME_LIMIT} s`
    + (info.fallback ? ' (laberinto fijo)' : ''));
}

function disposeGroup(group) {
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    o.material.dispose();
    if (o.isInstancedMesh) o.dispose();
  });
}

function loadNewLevel() {
  level = nextLevel();
  ({ items, start } = parseMaze(level.map));
  logLevel(level);

  rebuildWalls(wallsGroup, wallMaterials, level.map);
  world.remove(decorations);
  disposeGroup(decorations);
  decorations = createDecorations(level.map);
  world.add(decorations);

  startPos = cellToWorld(start.row, start.col);
  world.updateMatrixWorld(true);
}


function placeCollectibles() {
  for (const pivot of collectibles.children) {
    const item = items.find((it) => it.type === pivot.userData.type);
    if (!item) continue;
    const p = cellToWorld(item.row, item.col);
    pivot.position.x = p.x;
    pivot.position.z = p.z;
  }
}


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