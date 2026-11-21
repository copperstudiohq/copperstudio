const GRID = 1.45;
const STEPS = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]];

export function clearTrack(a, b, canRide, spacing = .55) {
  const length = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.max(1, Math.ceil(length / spacing));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!canRide(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
  }
  return true;
}

export function riderPath(from, target, canRide, grid = GRID, spacing = .55) {
  if (clearTrack(from, target, canRide, spacing)) return [target];

  const distance = (point) => Math.hypot(point.x - target.x, point.z - target.z);
  const start = { ...from, i: 0, j: 0, cost: 0, score: distance(from), prev: null };
  const queue = [start];
  const costByCell = new Map([['0,0', 0]]);
  let closest = start;
  const goalDistance = canRide(target.x, target.z) ? grid * .84 : 2.1;

  for (let visit = 0; visit < 560 && queue.length; visit++) {
    let next = 0;
    for (let i = 1; i < queue.length; i++) if (queue[i].score < queue[next].score) next = i;
    const node = queue.splice(next, 1)[0];
    if (node.cost > costByCell.get(node.i + ',' + node.j)) continue;
    if (distance(node) < distance(closest)) closest = node;
    if (distance(node) < goalDistance) break;
    for (const [dx, dz] of STEPS) {
      const i = node.i + dx;
      const j = node.j + dz;
      const key = i + ',' + j;
      const cost = node.cost + Math.hypot(dx, dz) * grid;
      if (cost > 72 || cost >= (costByCell.get(key) ?? Infinity)) continue;
      const point = { x: from.x + i * grid, z: from.z + j * grid };
      if (!clearTrack(node, point, canRide, spacing)) continue;
      costByCell.set(key, cost);
      queue.push({ ...point, i, j, cost, score: cost + distance(point), prev: node });
    }
  }

  const path = [];
  for (let node = closest; node.prev; node = node.prev) path.push({ x: node.x, z: node.z });
  return path.reverse();
}
