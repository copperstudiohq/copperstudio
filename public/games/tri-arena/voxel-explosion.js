/** Group every real voxel into a bounded number of spatial debris chunks. */
export function partitionExplosionCells(cells, maxPieces = 96) {
  if (!Array.isArray(cells) || !Number.isSafeInteger(maxPieces) || maxPieces < 1 || maxPieces > 128) {
    throw new TypeError('Voxel explosions need a cell array and 1–128 debris pieces.');
  }
  if (!cells.length) return [];
  const low = { x: Infinity, y: Infinity, z: Infinity }, high = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const cell of cells) for (const axis of ['x', 'y', 'z']) {
    const value = cell?.position?.[axis];
    if (!Number.isFinite(value)) throw new TypeError('Explosion cells require finite positions.');
    low[axis] = Math.min(low[axis], value); high[axis] = Math.max(high[axis], value);
  }
  let span = Math.max(.4, Math.cbrt((high.x - low.x) * (high.y - low.y) * (high.z - low.z) / maxPieces));
  for (;;) {
    const groups = new Map();
    for (const cell of cells) {
      const key = ['x', 'y', 'z'].map(axis => Math.floor((cell.position[axis] - low[axis]) / span)).join(':');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(cell);
    }
    if (groups.size <= maxPieces) return [...groups.values()];
    span *= 1.35;
  }
}
