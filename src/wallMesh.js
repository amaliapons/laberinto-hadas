export function buildWallArrays(map, cellSize, height) {
  const rows = map.length, cols = map[0].length;
  const halfSize = cellSize / 2;
  const isWall = (r, c) => r < 0 || c < 0 || r >= rows || c >= cols || map[r][c] === '#'; //para no dibujar donde no se ve

  const uvHeightRatio = height / cellSize;

  const positions = [], normals = [], uvs = [], indices = [];


  function quad(v1, v2, v3, v4, normalVector, vCoord) {
    const base = positions.length / 3;
    for (const p of [v1, v2, v3, v4]) { positions.push(...p); normals.push(...normalVector); }
    uvs.push(0, 0, 1, 0, 1, vCoord, 0, vCoord);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (map[r][c] !== '#') continue;
      const centerX = (c - cols / 2 + 0.5) * cellSize;
      const centerZ = (r - rows / 2 + 0.5) * cellSize;
      const x0 = centerX - halfSize, x1 = centerX + halfSize, z0 = centerZ - halfSize, z1 = centerZ + halfSize, H = height;

      if (!isWall(r, c + 1)) quad([x1, 0, z1], [x1, 0, z0], [x1, H, z0], [x1, H, z1], [1, 0, 0], uvHeightRatio);
      if (!isWall(r, c - 1)) quad([x0, 0, z0], [x0, 0, z1], [x0, H, z1], [x0, H, z0], [-1, 0, 0], uvHeightRatio);
      if (!isWall(r + 1, c)) quad([x0, 0, z1], [x1, 0, z1], [x1, H, z1], [x0, H, z1], [0, 0, 1], uvHeightRatio);
      if (!isWall(r - 1, c)) quad([x1, 0, z0], [x0, 0, z0], [x0, H, z0], [x1, H, z0], [0, 0, -1], uvHeightRatio);
      quad([x0, H, z1], [x1, H, z1], [x1, H, z0], [x0, H, z0], [0, 1, 0], 1);  
    }
  }
  return { positions, normals, uvs, indices };
}
