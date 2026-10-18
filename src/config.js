export const CONFIG = {
  CELL_SIZE: 4,
  WALL_HEIGHT: 3,
  OBJECT_FLOAT_HEIGHT: 1.2,
  PLAYER_EYE_HEIGHT: 1.4,
};

export const PLAYER = {
  FORWARD_SPEED: 3.5,
  BACK_SPEED: 2,
  TURN_SPEED: 2.2,
  WALL_DISTANCE: 0.6,
  FAIRY_FLOAT: 0.6,
  MODEL_TURN: Math.PI,
};

export const CAMERA = {
  FOV: 70, NEAR: 0.1, FAR: 200,
  DISTANCE: 3.2,
  HEIGHT: 1.8,
  TARGET_HEIGHT: 1,
  SMOOTH_TURN: 6,
  WALL_MARGIN: 0.35,
};

export const MINIMAP = {
  SIZE: 200,
  MARGIN: 12,
  LOCAL_VIEW: 12,
};

export const MAZE_MAP = [
  '###############',
  '#S..U..#.....P#',
  '#.#.#.###.#.#.#',
  '#.#.......#.#.#',
  '#.#####.###.#.#',
  '#...#.....#...#',
  '###.#.###.#.###',
  '#...#.#...#...#',
  '#.###.#.###.#.#',
  '#.....#...#.#.#',
  '#.#####.#.#.#.#',
  '#.#R....#...#.#',
  '#.#.#####.###.#',
  '#H..#.....C...#',
  '###############',
];

export const MODELS = {
  fairy:    { path: 'models/fairy/scene.gltf',    size: 0.8 },
  cake:     { path: 'models/cake/scene.gltf',     size: 1.0 },
  crown:    { path: 'models/crown/scene.gltf',    size: 1.0 },
  cupcake:  { path: 'models/cupcake/scene.gltf',  size: 0.9 },
  hibiscus: { path: 'models/hibiscus/scene.gltf', size: 1.0 },
  //lotus:    { path: 'models/lotus/scene.gltf',    size: 1.0 }, //lo quito porque pesa mucho
  potion:   { path: 'models/potion/scene.gltf',   size: 0.9 },
};

export const COLLECTIBLES = {
  U: { label: 'cupcake', type: 'cupcake',  points: 10, glow: 0xff8fd1 },
  C: { label: 'super tarta', type: 'cake',     points: 20, glow: 0xffd37a },
  R: { label: 'corona mágica de flores', type: 'crown',    points: 50, glow: 0xffe14d },
  H: { label: 'florecita', type: 'hibiscus', points: 15, glow: 0xff5e7e },
  L: { label: 'flor de loto', type: 'lotus',    points: 15, glow: 0xc9a6ff },
  P: { label: 'poción mágica', type: 'potion',   points: 30, glow: 0x6be6ff },
};

export const COLLECTIBLE = {
  FLOAT_AMPLITUDE: 0.25,
  FLOAT_SPEED: 2.0,
  SPIN_SPEED: 1.2,
  PICKUP_RADIUS: 1.0,
  COLLECT_TIME: 1.5,
  GLOW_BASE: 5.0,
  GLOW_PULSE: 1.0,
};

export const FAIRY_ANIM = {
  FLOATING_AMPLITUDE: 0.12,
  FLOATING_SPEED: 2.4,
  TILT: 0.5,
};

export const TEXTURES = {
  WALL: 'textures/muro.png',
  FLOOR: 'textures/suelo.png',
};

export const GAME = {
  TIME_LIMIT: 150,
  TIME_BONUS_PER_SECOND: 2,
  WARNING_SECONDS: 15,
};
