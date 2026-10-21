export const CONFIG = {
  CELL_SIZE: 3,
  WALL_HEIGHT: 2.5,
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
  '#...#.#L..#...#',
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
  //lotus:    { path: 'models/lotus/scene.gltf',    size: 1.0 },
  potion:   { path: 'models/potion/scene.gltf',   size: 0.9 },
};

export const COLLECTIBLES = {
  U: { label: 'cupcake', type: 'cupcake',  points: 10, glow: 0xff8fd1 },
  C: { label: 'super tarta', type: 'cake',     points: 20, glow: 0xffd37a },
  R: { label: 'corona mágica de flores', type: 'crown',    points: 50, glow: 0xffe14d },
  H: { label: 'florecita', type: 'hibiscus', points: 15, glow: 0xff5e7e },
  //L: { label: 'flor de loto', type: 'lotus',    points: 15, glow: 0xc9a6ff },
  P: { label: 'poción mágica', type: 'potion',   points: 30, glow: 0x6be6ff },
};

export const COLLECTIBLE = {
  FLOAT_AMPLITUDE: 0.25,
  FLOAT_SPEED: 2.0,
  SPIN_SPEED: 1.2,
  PICKUP_RADIUS: 1.0,
  COLLECT_TIME: 1.5,
  GLOW_BASE: 15.0,
  GLOW_PULSE: 2.0,
};

export const DECORATION = {
  SEED: 20260,// de momento misma decoración en cada partida
  DENSITY: 0.8,
  DOUBLE_CHANCE: 0.3,
  LANTERN_MAX: 8,
};

export const FAIRY_ANIM = {
  FLOATING_AMPLITUDE: 0.12,
  FLOATING_SPEED: 2.4,
  TILT: 0.5,
};

export const TEXTURES = {
  WALLS: [
    'textures/muro.png',
    'textures/muro2.jpeg',
    'textures/muro3.jpeg',
    'textures/muro4.jpeg',
  ],
  WALL_SEED: 7,
  FLOOR: 'textures/suelo.png',
};

export const SKY = {
  PATH: 'textures/skybox-morning.png',
  HORIZON_COLOR: 0xb1c5f2,
  MINIMAP_BACKGROUND: 0x9ad7ff,
  BRIGHTNESS: 1,
};

export const LIGHTING = {
  HEMI_INTENSITY: 0.3,
  SUN_INTENSITY: 0.6,
  MINIMAP_HEMI: 0.9,
};

export const GENERATOR = {
  SEED: null,
  LOOP_CHANCE: 0.12,
  MIN_START_DISTANCE: 8,
  MIN_ITEM_SPACING: 6,
  MIN_TIME_FRACTION: 0.3,
  MAX_TIME_FRACTION: 0.6,
  MAX_ATTEMPTS: 500,
};

export const GAME = {
  TIME_LIMIT: 150,
  TIME_BONUS_PER_SECOND: 2,
  WARNING_SECONDS: 15,
};
