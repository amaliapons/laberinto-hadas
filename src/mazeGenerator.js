import { CONFIG, PLAYER, GAME, MAZE_MAP, COLLECTIBLES, GENERATOR } from './config.js';
import { mulberry32 } from './random.js';

const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
const ROWS = MAZE_MAP.length;
const COLS = MAZE_MAP[0].length;

function shuffle(list, rand) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}


function carve(rand) {
  const open = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
  const r0 = 1 + 2 * Math.floor(rand() * ((ROWS - 1) / 2));
  const c0 = 1 + 2 * Math.floor(rand() * ((COLS - 1) / 2));
  open[r0][c0] = true;
  const stack = [[r0, c0]];

  while (stack.length) {
    const [r, c] = stack[stack.length - 1];
    const options = DIRS
      .map(([dr, dc]) => [r + 2 * dr, c + 2 * dc, dr, dc])
      .filter(([nr, nc]) => nr > 0 && nc > 0 && nr < ROWS - 1 && nc < COLS - 1 && !open[nr][nc]);
    if (options.length === 0) { stack.pop(); continue; }

    const [nr, nc, dr, dc] = options[Math.floor(rand() * options.length)];
    open[r + dr][c + dc] = true;
    open[nr][nc] = true;
    stack.push([nr, nc]);
  }
  return open;
}

function addLoops(open, rand) {
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (open[r][c]) continue;
      const between =
        (r % 2 === 1 && c % 2 === 0 && open[r][c - 1] && open[r][c + 1]) ||
        (r % 2 === 0 && c % 2 === 1 && open[r - 1][c] && open[r + 1][c]);
      if (between && rand() < GENERATOR.LOOP_CHANCE) open[r][c] = true;
    }
  }
}



function distancesFrom(map, row, col) {
  const dist = Array.from({ length: map.length }, () => Array(map[0].length).fill(-1));
  dist[row][col] = 0;
  const queue = [[row, col]];
  for (let i = 0; i < queue.length; i++) {
    const [r, c] = queue[i];
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc;
      if (map[nr]?.[nc] !== undefined && map[nr][nc] !== '#' && dist[nr][nc] === -1) {
        dist[nr][nc] = dist[r][c] + 1;
        queue.push([nr, nc]);
      }
    }
  }
  return dist;
}


function shortestRoute(distMatrix) {
  const n = distMatrix.length - 1;
  const used = Array(n + 1).fill(false);
  let best = Infinity;
  (function visit(last, count, total) {
    if (total >= best) return;
    if (count === n) { best = total; return; }
    for (let i = 1; i <= n; i++) {
      if (used[i]) continue;
      used[i] = true;
      visit(i, count + 1, total + distMatrix[last][i]);
      used[i] = false;
    }
  })(0, 0, 0);
  return best;
}



export function analyzeMap(map) {
  const rows = map.length, cols = map[0].length;
  let start = null;
  const items = [];
  let openCells = 0;
  map.forEach((line, r) => [...line].forEach((ch, c) => {
    if (ch !== '#') openCells++;
    if (ch === 'S') start = [r, c];
    else if (COLLECTIBLES[ch]) items.push([r, c, ch]);
  }));
  if (!start) return { valid: false };

  const fromStart = distancesFrom(map, start[0], start[1]);
  const reachable = fromStart.flat().filter((d) => d >= 0).length;
  const nodes = [start, ...items];
  const dist = nodes.map(([r, c]) => distancesFrom(map, r, c));
  const matrix = nodes.map((_, i) => nodes.map(([r, c]) => dist[i][r][c]));
  const connected = reachable === openCells && matrix.flat().every((d) => d >= 0);

  const routeCells = connected ? shortestRoute(matrix) : Infinity;
  return {
    start, items,
    connected,
    startInCorner: [1, rows - 2].includes(start[0]) && [1, cols - 2].includes(start[1]),
    hasAllItems: Object.keys(COLLECTIBLES).every((ch) => items.some((it) => it[2] === ch)),
    routeCells,
    routeSeconds: routeCells * CONFIG.CELL_SIZE / PLAYER.FORWARD_SPEED, //para que sea posible ganar siempre
  };
}



function buildCandidate(rand) {
  const open = carve(rand);
  addLoops(open, rand);

  const corners = [[1, 1], [1, COLS - 2], [ROWS - 2, 1], [ROWS - 2, COLS - 2]];
  const [sr, sc] = corners[Math.floor(rand() * corners.length)];

  const plain = open.map((row) => row.map((isOpen) => (isOpen ? '.' : '#')).join(''));
  const fromStart = distancesFrom(plain, sr, sc);

  const chars = shuffle(Object.keys(COLLECTIBLES), rand);
  const candidates = [];
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      if (open[r][c] && fromStart[r][c] >= GENERATOR.MIN_START_DISTANCE) candidates.push([r, c]);
    }
  }
  shuffle(candidates, rand);

  const chosen = [];
  const chosenDist = [];
  for (const [r, c] of candidates) {
    if (chosen.length === chars.length) break;
    if (chosenDist.every((d) => d[r][c] >= GENERATOR.MIN_ITEM_SPACING)) {
      chosen.push([r, c]);
      chosenDist.push(distancesFrom(plain, r, c));
    }
  }
  if (chosen.length < chars.length) return null;

  const grid = open.map((row) => row.map((isOpen) => (isOpen ? '.' : '#')));
  grid[sr][sc] = 'S';
  chosen.forEach(([r, c], i) => { grid[r][c] = chars[i]; });
  return grid.map((row) => row.join(''));
}


export function generateLevel(rand = Math.random) {
  const limit = GAME.TIME_LIMIT;
  for (let attempt = 1; attempt <= GENERATOR.MAX_ATTEMPTS; attempt++) {
    const map = buildCandidate(rand);
    if (!map) continue;
    const a = analyzeMap(map);
    if (!a.connected || !a.startInCorner || !a.hasAllItems) continue;
    if (a.routeSeconds > limit * GENERATOR.MAX_TIME_FRACTION) continue;
    if (a.routeSeconds < limit * GENERATOR.MIN_TIME_FRACTION) continue;
    return { map, info: { attempt, routeCells: a.routeCells, routeSeconds: a.routeSeconds, fallback: false } };
  }
  console.warn('Error con laberinto aleatorio -> laberinto fijo.');
  const a = analyzeMap(MAZE_MAP);
  return { map: [...MAZE_MAP], info: { attempt: GENERATOR.MAX_ATTEMPTS, routeCells: a.routeCells, routeSeconds: a.routeSeconds, fallback: true } };
}

export function createLevelGenerator() {
  const seed = GENERATOR.SEED ?? ((Math.random() * 2 ** 32) >>> 0);
  console.log('Semilla de los laberintos:', seed);
  const rand = mulberry32(seed);
  return () => generateLevel(rand);
}