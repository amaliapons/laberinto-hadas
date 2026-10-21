import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CONFIG, MAZE_MAP, COLLECTIBLES, DECORATION } from './config.js';
import { cellToWorld } from './maze.js';
import { mulberry32 } from './random.js';


function part(geometry, hex, { x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1 } = {}) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.scale(sx, sy, sz);
  g.translate(x, y, z);

  const color = new THREE.Color(hex);
  const count = g.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) color.toArray(colors, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

const merge = (parts) => mergeGeometries(parts, false);


function buildBush() {
  return merge([
    part(new THREE.SphereGeometry(0.5, 10, 8), 0x2f7d3a, { y: 0.4, sy: 0.85 }),
    part(new THREE.SphereGeometry(0.38, 10, 8), 0x3b9246, { x: 0.42, y: 0.3, z: 0.15 }),
    part(new THREE.SphereGeometry(0.34, 10, 8), 0x2a6e33, { x: -0.38, y: 0.28, z: -0.2 }),
    // florecitas en el arbusto
    part(new THREE.SphereGeometry(0.07, 6, 5), 0xff7aa8, { x: 0.15, y: 0.78, z: 0.3 }),
    part(new THREE.SphereGeometry(0.07, 6, 5), 0xffe27a, { x: -0.25, y: 0.66, z: 0.3 }),
    part(new THREE.SphereGeometry(0.07, 6, 5), 0xff7aa8, { x: 0.5, y: 0.55, z: -0.05 }),
  ]);
}

function mushroom(x, z, s, capColor) {
  const parts = [
    part(new THREE.CylinderGeometry(0.06 * s, 0.09 * s, 0.32 * s, 8), 0xf4ead5, { x, y: 0.16 * s, z }),
    part(new THREE.SphereGeometry(0.22 * s, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), capColor,
      { x, y: 0.3 * s, z, sy: 0.8 }),
  ];

  for (let i = 0; i < 3; i++) {
    const phi = i * 2.1, theta = 0.75;
    parts.push(part(new THREE.SphereGeometry(0.035 * s, 6, 5), 0xffffff, {
      x: x + 0.22 * s * Math.sin(theta) * Math.cos(phi),
      y: 0.3 * s + 0.22 * s * 0.8 * Math.cos(theta),
      z: z + 0.22 * s * Math.sin(theta) * Math.sin(phi),
      sy: 0.6,
    }));
  }
  return parts;
}

function buildMushrooms(capColor, smallColor) {
  return merge([
    ...mushroom(0, 0, 1.0, capColor),
    ...mushroom(0.3, 0.14, 0.65, capColor),
    ...mushroom(-0.22, 0.24, 0.5, smallColor),
  ]);
}

function flower(x, z, h, petalColor) {
  const parts = [
    part(new THREE.CylinderGeometry(0.015, 0.02, h, 5), 0x3f9a47, { x, y: h / 2, z }),
    part(new THREE.SphereGeometry(0.05, 6, 5), 0xffd84a, { x, y: h + 0.02, z }),
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push(part(new THREE.SphereGeometry(0.06, 6, 5), petalColor, {
      x: x + Math.cos(a) * 0.09, y: h + 0.02, z: z + Math.sin(a) * 0.09, sy: 0.4,
    }));
  }
  return parts;
}

function buildFlowerPatch(petalColor) {
  return merge([
    ...flower(0, 0, 0.42, petalColor),
    ...flower(0.25, 0.1, 0.32, petalColor),
    ...flower(-0.2, 0.15, 0.36, petalColor),
    ...flower(0.05, -0.25, 0.28, petalColor),
    ...flower(-0.12, -0.12, 0.5, petalColor),
  ]);
}

function buildRocks() {
  return merge([
    part(new THREE.DodecahedronGeometry(0.28, 0), 0x8a8f98, { y: 0.16, sy: 0.65 }),
    part(new THREE.DodecahedronGeometry(0.18, 0), 0x9aa0a8, { x: 0.32, y: 0.1, z: 0.1, sy: 0.7 }),
    part(new THREE.DodecahedronGeometry(0.12, 0), 0x777c85, { x: -0.25, y: 0.07, z: 0.2, sy: 0.7 }),
    part(new THREE.SphereGeometry(0.14, 8, 6), 0x5fa05a, { y: 0.28, sy: 0.4 }),
  ]);
}

const LANTERN_ORB_Y = 1.4;

function buildLanternPost() {
  return merge([
    part(new THREE.CylinderGeometry(0.14, 0.18, 0.12, 8), 0x9aa0a8, { y: 0.06 }),
    part(new THREE.CylinderGeometry(0.04, 0.05, 1.2, 8), 0x5b4636, { y: 0.7 }),
    part(new THREE.CylinderGeometry(0.12, 0.1, 0.04, 8), 0x5b4636, { y: 1.28 }),
    part(new THREE.ConeGeometry(0.16, 0.14, 8), 0x3d2f4f, { y: 1.58 }),
  ]);
}

const buildLanternGlow = () => new THREE.SphereGeometry(0.12, 10, 8).translate(0, LANTERN_ORB_Y, 0);

const TYPE_DEFS = [
  { name: 'bush',           build: buildBush,                                   weight: 4, placement: 'wall', margin: 0.5,  scale: [0.8, 1.3] },
  { name: 'mushroomRed',    build: () => buildMushrooms(0xe8384f, 0xff8fb8),    weight: 3, placement: 'any',  margin: 0.55, scale: [0.8, 1.3] },
  { name: 'mushroomPurple', build: () => buildMushrooms(0xb56bd6, 0xe3b7f5),    weight: 2, placement: 'any',  margin: 0.55, scale: [0.8, 1.3] },
  { name: 'flowersPink',    build: () => buildFlowerPatch(0xff8fc8),            weight: 3, placement: 'any',  margin: 0.45, scale: [0.9, 1.3] },
  { name: 'flowersLilac',   build: () => buildFlowerPatch(0xc9a6ff),            weight: 3, placement: 'any',  margin: 0.45, scale: [0.9, 1.3] },
  { name: 'rocks',          build: buildRocks,                                  weight: 2, placement: 'any',  margin: 0.5,  scale: [0.8, 1.4] },
  { name: 'lantern',        build: buildLanternPost, glow: buildLanternGlow,    weight: 1, placement: 'wall', margin: 0.35, scale: [1, 1], max: DECORATION.LANTERN_MAX },
];

const WALL_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];


export function createDecorations(map = MAZE_MAP) {
  const rand = mulberry32(DECORATION.SEED);
  const half = CONFIG.CELL_SIZE / 2;
  const dummy = new THREE.Object3D();

  const types = TYPE_DEFS.map((def) => ({ ...def, geometry: def.build(), matrices: [] }));

  function pickType(hasWall) {
    const candidates = types.filter((t) =>
      (hasWall || t.placement === 'any') && (t.max === undefined || t.matrices.length < t.max));
    let roll = rand() * candidates.reduce((sum, t) => sum + t.weight, 0);
    for (const t of candidates) {
      roll -= t.weight;
      if (roll <= 0) return t;
    }
    return candidates[candidates.length - 1];
  }

  map.forEach((line, row) => {
    [...line].forEach((ch, col) => {
      if (ch === '#' || ch === 'S' || COLLECTIBLES[ch]) return;
      if (rand() > DECORATION.DENSITY) return;

      const walls = WALL_DIRS.filter(([dc, dr]) => map[row + dr]?.[col + dc] === '#');
      const count = rand() < DECORATION.DOUBLE_CHANCE ? 2 : 1;
      const center = cellToWorld(row, col);

      for (let n = 0; n < count; n++) {
        const type = pickType(walls.length > 0);
        let ox, oz;

        if (walls.length > 0 && (type.placement === 'wall' || rand() < 0.6)) {
          const [dc, dr] = walls[Math.floor(rand() * walls.length)];
          const d = half - type.margin - rand() * 0.25;
          const jitter = (rand() * 2 - 1) * 1.2;
          ox = dc * d + Math.abs(dr) * jitter;
          oz = dr * d + Math.abs(dc) * jitter;
        } else {
          ox = (rand() < 0.5 ? -1 : 1) * (0.8 + rand() * 0.5);
          oz = (rand() < 0.5 ? -1 : 1) * (0.8 + rand() * 0.5);
        }

        const s = type.scale[0] + rand() * (type.scale[1] - type.scale[0]);
        dummy.position.set(center.x + ox, 0, center.z + oz);
        dummy.rotation.set(0, rand() * Math.PI * 2, 0);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        type.matrices.push(dummy.matrix.clone());
      }
    });
  });

  const material = new THREE.MeshLambertMaterial({ vertexColors: true });
  const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });

  function instance(geometry, mat, matrices, name, shadows) {
    const mesh = new THREE.InstancedMesh(geometry, mat, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
    mesh.computeBoundingSphere();
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = shadows;
    mesh.matrixAutoUpdate = false;
    return mesh;
  }

  const group = new THREE.Group();
  group.name = 'decorations';

  for (const t of types) {
    if (t.matrices.length === 0) continue;
    group.add(instance(t.geometry, material, t.matrices, `decor_${t.name}`, true));
    if (t.glow) group.add(instance(t.glow(), glowMaterial, t.matrices, `decor_${t.name}_glow`, false));
  }

  console.log('Decoración:', types.map((t) => `${t.name}=${t.matrices.length}`).join(', '));
  return group;
}