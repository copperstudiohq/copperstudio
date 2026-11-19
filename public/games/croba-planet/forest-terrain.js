/** Prepared forest terrain. All positions and distances use simulation units. */
/** @typedef {{x:number,y:number,z:number}} ForestPoint */
/** @typedef {{point:ForestPoint,normal:ForestPoint,inside:boolean,distance:number,penetration:number,escape:ForestPoint}} ForestContact */
/** @typedef {{a:ForestPoint,b:ForestPoint,c:ForestPoint,normal:ForestPoint,ax:number,ay:number,az:number,bx:number,by:number,bz:number,cx:number,cy:number,cz:number,denominator:number,lowZ:number,highZ:number}} ForestTriangle */
/** @typedef {{x?:number,y?:number,ax?:number,ay?:number,bx?:number,by?:number,radius:number,low:number,high:number}} ForestObstacle */
/** @typedef {{cells:Map<string,ForestTriangle[]>,surfaces:Map<string,ForestTriangle[]>,walls:ForestTriangle[],obstacles:Map<string,ForestObstacle[]>,minX:number,maxX:number,minY:number,maxY:number}} ForestCache */
/** @type {WeakMap<object,ForestCache>} */
const caches = new WeakMap();
const CELL = 100;
const finite = (value) => Number.isFinite(value);
const forestOf = (value) => value?.forest ?? (value?.mesh ? value : null);
const key = (x, y) => `${Math.floor(x / CELL)}:${Math.floor(y / CELL)}`;

/** @returns {ForestCache|null} */
function cacheFor(forest) {
  if (!forest?.mesh || !Array.isArray(forest.mesh.positions) || !Array.isArray(forest.mesh.indices)) return null;
  let cached = caches.get(forest);
  if (cached) return cached;
  const cells = new Map();
  const surfaces = new Map();
  const walls = [];
  const obstacles = new Map();
  const { positions, indices } = forest.mesh;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const add = (map, entry, minX, minY, maxX, maxY) => {
    for (let x = Math.floor(minX / CELL); x <= Math.floor(maxX / CELL); x++)
      for (let y = Math.floor(minY / CELL); y <= Math.floor(maxY / CELL); y++) {
        const id = `${x}:${y}`;
        if (!map.has(id)) map.set(id, []);
        map.get(id).push(entry);
      }
  };
  const count = forest.mesh.surfaceIndexCount ?? indices.length;
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index] * 3;
    const b = indices[index + 1] * 3;
    const c = indices[index + 2] * 3;
    const triangle = { ax: positions[a], ay: positions[a + 1], az: positions[a + 2],
      bx: positions[b], by: positions[b + 1], bz: positions[b + 2],
      cx: positions[c], cy: positions[c + 1], cz: positions[c + 2] };
    triangle.denominator = (triangle.by - triangle.cy) * (triangle.ax - triangle.cx)
      + (triangle.cx - triangle.bx) * (triangle.ay - triangle.cy);
    const a3 = { x: triangle.ax, y: triangle.ay, z: triangle.az };
    const b3 = { x: triangle.bx, y: triangle.by, z: triangle.bz };
    const c3 = { x: triangle.cx, y: triangle.cy, z: triangle.cz };
    const ab = sub(b3, a3);
    const ac = sub(c3, a3);
    const normal = { x: ab.y * ac.z - ab.z * ac.y,
      y: ab.z * ac.x - ab.x * ac.z, z: ab.x * ac.y - ab.y * ac.x };
    const length = Math.hypot(normal.x, normal.y, normal.z) || 1;
    Object.assign(triangle, { a: a3, b: b3, c: c3, lowZ: Math.min(a3.z, b3.z, c3.z), highZ: Math.max(a3.z, b3.z, c3.z),
      normal: { x: normal.x / length, y: normal.y / length, z: normal.z / length } });
    const bounds = [Math.min(triangle.ax, triangle.bx, triangle.cx), Math.min(triangle.ay, triangle.by, triangle.cy),
      Math.max(triangle.ax, triangle.bx, triangle.cx), Math.max(triangle.ay, triangle.by, triangle.cy)];
    minX = Math.min(minX, bounds[0]); minY = Math.min(minY, bounds[1]);
    maxX = Math.max(maxX, bounds[2]); maxY = Math.max(maxY, bounds[3]);
    add(surfaces, triangle, ...bounds);
    if (index < count && Math.abs(triangle.denominator) > 1e-8) add(cells, triangle, ...bounds);
    if (index >= count) walls.push(triangle);
  }
  for (const tree of forest.trees ?? []) {
    const radius = tree.trunkRadius ?? tree.radius * 0.12;
    const obstacle = { x: tree.x, y: tree.y, radius, low: tree.z, high: tree.z + tree.height * 0.82 };
    add(obstacles, obstacle, tree.x - radius - 8, tree.y - radius - 8, tree.x + radius + 8, tree.y + radius + 8);
  }
  for (const rock of forest.rocks ?? []) {
    const obstacle = { x: rock.x, y: rock.y, radius: rock.radius, low: rock.z, high: rock.z + rock.height };
    add(obstacles, obstacle, rock.x - rock.radius - 8, rock.y - rock.radius - 8,
      rock.x + rock.radius + 8, rock.y + rock.radius + 8);
  }
  for (const log of forest.logs ?? []) {
    const dx = Math.cos(log.heading) * log.length / 2;
    const dy = Math.sin(log.heading) * log.length / 2;
    const obstacle = { ax: log.x - dx, ay: log.y - dy, bx: log.x + dx, by: log.y + dy,
      radius: log.radius, low: log.z, high: log.z + log.radius * 2 };
    add(obstacles, obstacle, log.x - Math.abs(dx) - log.radius - 8, log.y - Math.abs(dy) - log.radius - 8,
      log.x + Math.abs(dx) + log.radius + 8, log.y + Math.abs(dy) + log.radius + 8);
  }
  cached = { cells, surfaces, walls, obstacles, minX, minY, maxX, maxY };
  caches.set(forest, cached);
  return cached;
}

/** Height on the exact baked surface triangle, or null outside its coastal outline.
 * Accepts either a World with .forest or the prepared forest object itself.
 * @param {object} worldOrForest @param {number} x @param {number} y @returns {number|null}
 */
export function getForestHeight(worldOrForest, x, y) {
  if (!finite(x) || !finite(y)) return null;
  const cached = cacheFor(forestOf(worldOrForest));
  for (const triangle of cached?.cells.get(key(x, y)) ?? []) {
    const a = ((triangle.by - triangle.cy) * (x - triangle.cx)
      + (triangle.cx - triangle.bx) * (y - triangle.cy)) / triangle.denominator;
    const b = ((triangle.cy - triangle.ay) * (x - triangle.cx)
      + (triangle.ax - triangle.cx) * (y - triangle.cy)) / triangle.denominator;
    const c = 1 - a - b;
    if (a >= -1e-8 && b >= -1e-8 && c >= -1e-8) return a * triangle.az + b * triangle.bz + c * triangle.cz;
  }
  return null;
}

/** Includes the submerged beach apron; the surrounding ocean remains separate. */
export function isForestAt(worldOrForest, x, y) {
  return getForestHeight(worldOrForest, x, y) !== null;
}

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b, scale) => ({ x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale });
function closestTriangle(p, a, b, c) {
  const scale = Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  if (scale > 1e100) {
    // At astronomical finite coordinates, the leading support vertex is more
    // stable than multiplying the query by terrain edges into Infinity.
    const direction = { x: p.x / scale, y: p.y / scale, z: p.z / scale };
    return [a, b, c].reduce((best, vertex) => dot(direction, vertex) > dot(direction, best) ? vertex : best);
  }
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b);
  const d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, ab, d1 / (d1 - d3));
  const cp = sub(p, c);
  const d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, ac, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return add(b, sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6));
  const denominator = 1 / (va + vb + vc);
  return add(add(a, ab, vb * denominator), ac, vc * denominator);
}

/** Sphere contact with the exact solid headland, including its vertical coastal
 * walls. Cached triangles are shared by wildlife and the player's ground query.
 * `point` is the nearest terrain surface; `escape` is a clear sphere centre.
 * @param {object} worldOrForest @param {ForestPoint} centre @param {number} [radius]
 * @returns {ForestContact|null}
 */
export function getForestCollision(worldOrForest, centre, radius = 0) {
  if (![centre?.x, centre?.y, centre?.z, radius].every(finite) || radius < 0) return null;
  const forest = forestOf(worldOrForest);
  const cached = cacheFor(forest);
  if (!cached || centre.x + radius < cached.minX || centre.x - radius > cached.maxX
    || centre.y + radius < cached.minY || centre.y - radius > cached.maxY) return null;
  const height = getForestHeight(forest, centre.x, centre.y);
  const inside = height !== null && centre.z < height;
  const candidates = new Set(inside ? cached.walls : []);
  const minCellX = Math.floor(Math.max(cached.minX, centre.x - radius) / CELL);
  const maxCellX = Math.floor(Math.min(cached.maxX, centre.x + radius) / CELL);
  const minCellY = Math.floor(Math.max(cached.minY, centre.y - radius) / CELL);
  const maxCellY = Math.floor(Math.min(cached.maxY, centre.y + radius) / CELL);
  for (let x = minCellX; x <= maxCellX; x++)
    for (let y = minCellY; y <= maxCellY; y++)
      for (const triangle of cached.surfaces.get(`${x}:${y}`) ?? []) candidates.add(triangle);
  let nearest = null, best = Infinity, normal;
  for (const triangle of candidates) {
    if (!inside && (centre.z + radius < triangle.lowZ || centre.z - radius > triangle.highZ)) continue;
    const point = closestTriangle(centre, triangle.a, triangle.b, triangle.c);
    const distance = Math.hypot(centre.x - point.x, centre.y - point.y, centre.z - point.z);
    if (distance >= best) continue;
    best = distance;
    nearest = point;
    normal = triangle.normal;
  }
  if (!nearest || !inside && best > radius + 1e-8) return null;
  if (!inside && best > 1e-8) normal = { x: (centre.x - nearest.x) / best,
    y: (centre.y - nearest.y) / best, z: (centre.z - nearest.z) / best };
  return { point: { ...nearest }, normal: { ...normal }, inside, distance: best,
    penetration: Math.min(Number.MAX_VALUE, radius + (inside ? best : -best)),
    escape: add(nearest, normal, radius + 0.01) };
}

/** Resolve solid spruce trunks, rocks and fallen-log capsules along a short path.
 * Substeps prevent a fast jump from crossing a thin trunk between endpoints.
 * Canopies, grass and flowers remain passable.
 * @param {object} worldOrForest @param {{x:number,y:number,z:number}} from
 * @param {{x:number,y:number,z:number}} to @param {number} [bodyHeight] @param {number} [radius]
 */
export function resolveForestMovement(worldOrForest, from, to, bodyHeight = 36, radius = 5) {
  const cached = cacheFor(forestOf(worldOrForest));
  if (!cached || ![from?.x, from?.y, from?.z, to?.x, to?.y, to?.z, bodyHeight, radius].every(finite)) return { ...to };
  const steps = Math.max(1, Math.min(64, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / Math.max(1, radius))));
  const result = { ...from };
  const dx = (to.x - from.x) / steps, dy = (to.y - from.y) / steps;
  for (let step = 1; step <= steps; step++) {
    const previous = { x: result.x, y: result.y };
    result.x += dx; result.y += dy; result.z = from.z + (to.z - from.z) * step / steps;
    for (let pass = 0; pass < 3; pass++) for (const obstacle of cached.obstacles.get(key(result.x, result.y)) ?? []) {
      if (result.z >= obstacle.high || result.z + bodyHeight <= obstacle.low) continue;
      let x = obstacle.x, y = obstacle.y;
      if (obstacle.ax !== undefined) {
        const ox = obstacle.bx - obstacle.ax, oy = obstacle.by - obstacle.ay;
        const along = Math.max(0, Math.min(1, ((result.x - obstacle.ax) * ox + (result.y - obstacle.ay) * oy) / (ox * ox + oy * oy || 1)));
        x = obstacle.ax + ox * along; y = obstacle.ay + oy * along;
      }
      let nx = result.x - x, ny = result.y - y, length = Math.hypot(nx, ny);
      const clear = obstacle.radius + radius + 0.01;
      if (length >= clear) continue;
      if (length < 1e-8) { nx = previous.x - x; ny = previous.y - y; length = Math.hypot(nx, ny); }
      result.x = x + (length ? nx / length : 1) * clear;
      result.y = y + (length ? ny / length : 0) * clear;
    }
  }
  return result;
}
