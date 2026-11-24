const GRID_SIZE = 8;
const MIN_ITEMS = 35;
const plantGrids = new WeakMap();

const tile = (coordinate) => Math.min(GRID_SIZE - 1, Math.max(0, Math.floor(coordinate * GRID_SIZE)));
const tileFor = (x, y) => tile(y) * GRID_SIZE + tile(x);

function linearNearest(point, items, radius, accepts) {
  let nearest;
  let best = radius * radius;
  for (const item of items) {
    const dx = item.x - point.x;
    const dy = item.y - point.y;
    const distance = dx * dx + dy * dy;
    if (distance >= best || !accepts(item, distance)) continue;
    nearest = item;
    best = distance;
  }
  return nearest;
}

export function spatialBuckets(items) {
  if (items.length < MIN_ITEMS) return null;
  const buckets = new Array(GRID_SIZE ** 2);
  for (let index = 0; index < items.length; index++) {
    const { x, y } = items[index];
    (buckets[tileFor(x, y)] ??= []).push(index);
  }
  return buckets;
}

// Plants stay at the same coordinates until their array gains or loses a patch.
export function plantGrid(items) {
  if (items.length < MIN_ITEMS) return null;
  let cached = plantGrids.get(items);
  if (!cached || cached.length !== items.length) {
    cached = { length: items.length, buckets: spatialBuckets(items) };
    plantGrids.set(items, cached);
  }
  return cached.buckets;
}

export function moveInPondGrid(grid, index, organism) {
  if (!grid) return;
  const from = tileFor(organism.px, organism.py);
  const to = tileFor(organism.x, organism.y);
  if (from === to) return;
  const old = grid[from];
  old.splice(old.indexOf(index), 1);
  (grid[to] ??= []).push(index);
}

export function nearestInPond(point, items, radius, accepts, grid) {
  if (!grid) return linearNearest(point, items, radius, accepts);
  const left = tile(point.x - radius);
  const right = tile(point.x + radius);
  const top = tile(point.y - radius);
  const bottom = tile(point.y + radius);
  if ((right - left + 1) * (bottom - top + 1) >= 45) return linearNearest(point, items, radius, accepts);

  let best = radius * radius;
  let bestIndex = -1;
  for (let row = top; row <= bottom; row++) {
    const offset = row * GRID_SIZE;
    for (let column = left; column <= right; column++) {
      const bucket = grid[offset + column];
      if (!bucket) continue;
      for (const index of bucket) {
        const item = items[index];
        const dx = item.x - point.x;
        const dy = item.y - point.y;
        const distance = dx * dx + dy * dy;
        if (distance > best || (distance === best && (bestIndex < 0 || index >= bestIndex)) || !accepts(item, distance)) continue;
        best = distance;
        bestIndex = index;
      }
    }
  }
  return items[bestIndex];
}

export function nearestOnPlanet(point, items, radius, accepts, grid, longitudeDistance, fallback) {
  const longitudeScale = Math.max(.4, Math.sin(point.y * Math.PI));
  const width = radius / longitudeScale;
  const height = radius / .65;
  const left = Math.floor((point.x - width) * GRID_SIZE);
  const right = Math.floor((point.x + width) * GRID_SIZE);
  const top = tile(point.y - height);
  const bottom = tile(point.y + height);
  const columns = right - left + 1;
  if (columns >= GRID_SIZE || columns * (bottom - top + 1) >= 45) return fallback(point, items, radius, accepts);

  let best = radius * radius;
  let bestIndex = -1;
  for (let row = top; row <= bottom; row++) {
    const offset = row * GRID_SIZE;
    for (let column = left; column <= right; column++) {
      const bucket = grid[offset + ((column + GRID_SIZE) % GRID_SIZE)];
      if (!bucket) continue;
      for (const index of bucket) {
        const item = items[index];
        const dx = longitudeDistance(point.x, item.x) * longitudeScale;
        const dy = (item.y - point.y) * .65;
        const distance = dx * dx + dy * dy;
        if (distance > best || (distance === best && (bestIndex < 0 || index >= bestIndex)) || !accepts(item, distance)) continue;
        best = distance;
        bestIndex = index;
      }
    }
  }
  return items[bestIndex];
}
