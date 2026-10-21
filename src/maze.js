import * as THREE from 'three';
import { CONFIG, MAZE_MAP, COLLECTIBLES, TEXTURES } from './config.js';
import { buildWallArrays } from './wallMesh.js';
import { mulberry32 } from './random.js';

const ROWS = MAZE_MAP.length;
const COLS = MAZE_MAP[0].length;


export function cellToWorld(row, col) {
  const { CELL_SIZE } = CONFIG;
  return new THREE.Vector3(
    (col - COLS / 2 + 0.5) * CELL_SIZE,
    0,
    (row - ROWS / 2 + 0.5) * CELL_SIZE
  );
}

export function parseMaze(map = MAZE_MAP) {
  const items = [];
  let start = null;
  map.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      if (ch === 'S') start = { row, col };
      else if (COLLECTIBLES[ch]) items.push({ row, col, ...COLLECTIBLES[ch] });
    });
  });
  if (!start) throw new Error("Falta una posición inicial S");

  const facings = [[-1, 0, 0], [0, 1, -Math.PI / 2], [1, 0, Math.PI], [0, -1, Math.PI / 2]];
  const open = facings.find(([dr, dc]) => {
    const ch = map[start.row + dr]?.[start.col + dc];
    return ch !== undefined && ch !== '#';
  });
  start.facing = open ? open[2] : 0;
  return { items, start };
}

function makeStatic(mesh) {
  mesh.layers.enable(1);
  mesh.updateMatrix();
  mesh.matrixAutoUpdate = false;
  return mesh;
}

export function createFloor(material) {
  const { CELL_SIZE } = CONFIG;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CELL_SIZE, ROWS * CELL_SIZE), material);
  floor.name = 'floor';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return makeStatic(floor);
}

function buildWallMesh(materials, map) {
  const rand = mulberry32(TEXTURES.WALL_SEED);
  const variants = new Map();
  const variantFor = (r, c) => {
    const key = r * COLS + c;
    if (!variants.has(key)) variants.set(key, Math.floor(rand() * materials.length));
    return variants.get(key);
  };

  const { positions, normals, uvs, indices, groups } =
    buildWallArrays(map, CONFIG.CELL_SIZE, CONFIG.WALL_HEIGHT, materials.length, variantFor);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  for (const g of groups) geometry.addGroup(g.start, g.count, g.materialIndex);

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.name = 'wallMesh';
  mesh.castShadow = mesh.receiveShadow = true;
  makeStatic(mesh);
  return mesh;
}

export function createWalls(materials, map = MAZE_MAP) {
  const group = new THREE.Group();
  group.name = 'walls';
  group.add(buildWallMesh(materials, map));
  return group;
}

export function rebuildWalls(group, materials, map) {
  for (const old of [...group.children]) {
    group.remove(old);
    old.geometry.dispose();
  }
  group.add(buildWallMesh(materials, map));
}

export const MAZE_SIZE = { rows: ROWS, cols: COLS };