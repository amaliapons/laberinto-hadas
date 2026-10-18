import * as THREE from 'three';
import { CONFIG, MAZE_MAP, COLLECTIBLES } from './config.js';
import { buildWallArrays } from './wallMesh.js';

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

export function parseMaze() {
  const items = [];
  let start = null;
  MAZE_MAP.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      if (ch === 'S') start = { row, col };
      else if (COLLECTIBLES[ch]) items.push({ row, col, ...COLLECTIBLES[ch] });
    });
  });
  if (!start) throw new Error("Falta una posición inicial S");
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

export function createWalls(material) {
  const { positions, normals, uvs, indices } =
    buildWallArrays(MAZE_MAP, CONFIG.CELL_SIZE, CONFIG.WALL_HEIGHT);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'wallMesh';
  mesh.castShadow = mesh.receiveShadow = true;
  makeStatic(mesh);

  const group = new THREE.Group();
  group.name = 'walls';
  group.add(mesh);
  return group;
}

export const MAZE_SIZE = { rows: ROWS, cols: COLS };
