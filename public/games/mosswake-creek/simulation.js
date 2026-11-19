export const VIEW_WIDTH = 384;
export const WORLD_AREAS = ['West Grove', 'Copper Rise', 'Mosswake Pond', 'Birch Flats', 'East Hollow'];
export const WIDTH = VIEW_WIDTH * WORLD_AREAS.length;
export const START_VIEW = VIEW_WIDTH * 2;
export const HEIGHT = 198;
export const POND_LEVEL = 132;
export const TICKS_PER_SECOND = 36;
export const DAY_TICKS = 80 * TICKS_PER_SECOND;
export const NIGHT_TICKS = 36 * TICKS_PER_SECOND;
export const TRI_PORTAL_OPEN_TICKS = 40;
export const CREEK_HUTS = [122, START_VIEW + 306, 3 * VIEW_WIDTH + 208];

export const EMPTY = 0;
export const COPPER = 1;
export const SAND = 2;
export const WATER = 3;
export const BASALT = 4;
export const EMBER = 5;
export const PATINA = 6;
export const ROCK = 7;
export const ERASE = 8;
export const ICHOR = 9;
export const GRASS = 10;

export const WEATHER = Object.freeze({ off: 0, rain: 270, storm: 470 });
export const CREATURES = { lizard: 'Copperback', duck: 'Duck', blob: 'Tri Blob', ling: 'Tri Ling', brain: 'Tri Brain' };
export const SCENERY = {
  birch: { label: 'Birch', width: 28, height: 38 },
  hut: { label: 'Hut', width: 30, height: 23 },
  pump: { label: 'Pump', width: 24, height: 18 },
  posts: { label: 'Fence', width: 12, height: 7 },
  dock: { label: 'Dock', width: 42, height: 14 }
};
export const TRI_PORTAL = { label: 'Tri Portal', halfWidth: 26, height: 44, limit: 8 };
export const BOSSES = {
  'copper-giant': { label: 'Copper Giant', halfWidth: 30, above: 55, below: 0 },
  'lake-terror': { label: 'Lake’s Corrupt Terror', halfWidth: 14, above: 11, below: 11 },
  'sky-eye': { label: 'Eye of the Sky', halfWidth: 25, above: 23, below: 45 }
};
export const TERROR_SEGMENTS = 24;
const TRI_BOSS_AGE = 240 * TICKS_PER_SECOND;
const TRI_BOSS_OFFSETS = [52, -52, 80, -80];
const TRI_BLOB_LIMIT = 14;
const TRI_BIRTHS = [
  { type: 'blob', first: 13, repeat: 16, max: TRI_BLOB_LIMIT },
  { type: 'ling', first: 75, repeat: 90, max: 3 },
  { type: 'brain', first: 180, repeat: 210, max: 2 }
];
const TRI_SPAWN_OFFSETS = [18, -18, 25, -25, 34, -34, 43, -43, 54, -54];
const TRI_EMERGENCE = Math.round(3.2 * TICKS_PER_SECOND);
const TRI_CREATURE_STRIDE = { blob: 8, ling: 4, brain: 6 };
const COPPER_MATERIALS = [COPPER, PATINA];
const ANIMAL_LIMIT = 24;
const SCENERY_LIMIT = 80;
const DEBRIS_LIMIT = 3600;
const TRI_LIMIT = 12;
const TRI_START_RADIUS = 10;
const TRI_GROWTH_TICKS = 6;
const TRI_GROWTH_PIXELS = 1;

export function makeRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function pixelNoise(x, y) {
  let hash = Math.imul(x ^ 0x6c50, 0x45d9f3b) ^ Math.imul(y ^ 0x842d, 0x119de1f3);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

const profiles = [
  [[0, 112], [78, 112], [91, 116], [220, 116], [237, 112], [383, 112]],
  [[0, 112], [64, 112], [82, 103], [228, 103], [247, 112], [383, 112]],
  [[0, 112], [111, 112], [116, 114], [122, 121], [132, 136], [145, 143],
    [164, 151], [181, 155], [209, 155], [231, 152], [252, 145], [261, 140],
    [268, 132], [274, 123], [280, 112], [383, 112]],
  [[0, 112], [383, 112]],
  [[0, 112], [99, 112], [133, 127], [229, 127], [260, 112], [383, 112]]
];

function profileHeight(x) {
  const profile = profiles[Math.floor(x / VIEW_WIDTH)];
  const localX = x % VIEW_WIDTH;
  const index = profile.findIndex(([edge]) => edge >= localX);
  if (index <= 0) return profile[0][1];
  const [x0, y0] = profile[index - 1];
  const [x1, y1] = profile[index];
  if (y0 === y1) return y0;
  const variation = Math.sin(localX * 0.53) * 1.1 + (pixelNoise(localX, 9) - 0.5) * 2.25;
  return Math.round(y0 + (y1 - y0) * (localX - x0) / (x1 - x0) + variation);
}

const groundHeights = Uint8Array.from({ length: WIDTH }, (_, x) => profileHeight(x));

export function quarryHeight(x) {
  return groundHeights[x];
}

export function isLiquid(material) {
  return material === WATER || material === ICHOR;
}

export function isSolid(material) {
  return material !== EMPTY && material !== EMBER && !isLiquid(material);
}

export function triCoreScale(radius) {
  return 1 + Math.min(0.85, (radius - TRI_START_RADIUS) / 140);
}

export function bossPosition(boss, tick, segment = 0) {
  const age = tick - boss.bornAt;
  if (boss.type === 'lake-terror') {
    const phase = (age - segment * 3.5) / 43;
    return {
      x: Math.round(boss.x + Math.sin(phase) * 57),
      y: Math.round(boss.y - 8 - Math.sin(phase * 2) * 38 - (1 - Math.cos(phase)) * 11),
      direction: Math.cos(phase) < 0 ? -1 : 1
    };
  }
  if (boss.type === 'sky-eye') {
    return { x: boss.x + Math.round(Math.sin(age / 42) * 13),
      y: boss.y + Math.round(Math.sin(age / 23) * 4), direction: 1 };
  }
  return { x: boss.x, y: boss.y, direction: boss.direction };
}

function bedrockMaterial(x, y, depth) {
  if (depth < 5) return ROCK;
  const shelf = y + Math.sin(x * 0.026) * 10 + Math.sin(x * 0.103) * 2.7 + x * 0.07;
  const seam = Math.abs((shelf + 28) % 29 - 14);
  const pocket = pixelNoise(Math.floor(x / 15), Math.floor(shelf / 27));
  return seam < 1.6 && pocket > 0.71 && pixelNoise(x, y) > 0.57 ? COPPER : ROCK;
}

export class Quarry {
  grid = new Uint8Array(WIDTH * HEIGHT);
  heat = new Uint8Array(this.grid.length);
  updated = new Uint32Array(this.grid.length);
  placedTri = new Uint8Array(this.grid.length);
  surface = new Int16Array(WIDTH);
  triMap = new Uint8Array(this.grid.length);
  ichorCells = new Uint8Array(this.grid.length);
  liquidQueue = new Uint32Array(this.grid.length);
  creatures = [];
  bosses = [];
  scenery = [];
  portals = [];
  triPatches = [];
  debris = [];
  tick = 0;
  weather = 'rain';

  constructor(seed = 20261118) {
    this.seed = seed;
    this.reset();
  }

  reset(blank = false) {
    this.random = makeRandom(this.seed);
    this.fragmentRandom = makeRandom(this.seed ^ 0x2851);
    this.debris.length = 0;
    this.nextFragment = 0;
    this.grid.fill(EMPTY);
    this.heat.fill(0);
    this.updated.fill(0);
    this.placedTri.fill(0);
    this.surface.fill(HEIGHT);
    this.triMap.fill(0);
    this.creatures.length = 0;
    this.bosses.length = 0;
    this.scenery.length = 0;
    this.portals.length = 0;
    this.triPatches.length = 0;
    this.tick = 0;
    this.skyMode = 'day';
    this.skyStartedAt = 0;
    this.weather = blank ? 'off' : 'rain';
    if (blank) return;

    for (let x = 0; x < WIDTH; x++) {
      const surface = quarryHeight(x);
      const pool = x >= START_VIEW && x < START_VIEW + VIEW_WIDTH ? POND_LEVEL : HEIGHT;
      const top = Math.min(surface, pool);
      this.surface[x] = top;
      for (let y = top; y < HEIGHT; y++) {
        this.grid[y * WIDTH + x] = y >= surface ? bedrockMaterial(x, y, y - surface) : WATER;
      }
    }
    this.placeCreature('lizard', START_VIEW + 179, 133);
    this.placeCreature('duck', START_VIEW + 231, 132);
    this.placeCreature('duck', START_VIEW + 98, quarryHeight(START_VIEW + 98) - 1);
  }

  setWeather(weather) {
    if (!Object.hasOwn(WEATHER, weather)) throw new RangeError(`Unknown rainfall setting: ${weather}`);
    this.weather = weather;
  }

  setSkyMode(mode) {
    if (mode !== 'day' && mode !== 'auto' && mode !== 'night') throw new RangeError(`Unknown sky mode: ${mode}`);
    if (this.skyMode === mode) return;
    this.skyMode = mode;
    this.skyStartedAt = this.tick;
  }

  get cycleTick() {
    return (this.tick - this.skyStartedAt) % (DAY_TICKS + NIGHT_TICKS);
  }

  get night() {
    return this.skyMode === 'night' || (this.skyMode === 'auto' && this.cycleTick >= DAY_TICKS);
  }

  get skyProgress() {
    if (this.skyMode !== 'auto') return 0.5;
    return this.night ? (this.cycleTick - DAY_TICKS) / NIGHT_TICKS : this.cycleTick / DAY_TICKS;
  }

  get portalOpening() {
    if (!this.night) return 0;
    return this.skyMode === 'night' ? 1 : Math.min(1, (this.cycleTick - DAY_TICKS) / TRI_PORTAL_OPEN_TICKS);
  }

  at(x, y) {
    if (x < 0 || x >= WIDTH || y >= HEIGHT) return BASALT;
    return y < 0 ? EMPTY : this.grid[y * WIDTH + x];
  }

  paint(material, x, y, radius, variant = false) {
    const converted = variant || material === ICHOR;
    for (let dy = -radius; dy <= radius; dy++) {
      const row = y + dy;
      if (row < 0 || row >= HEIGHT) continue;
      for (let dx = -radius; dx <= radius; dx++) {
        const column = x + dx;
        if (column < 0 || column >= WIDTH || dx * dx + dy * dy > radius * radius) continue;
        const index = row * WIDTH + column;
        const current = this.grid[index];
        if (material === ERASE) {
          this.grid[index] = EMPTY;
          this.heat[index] = 0;
          this.placedTri[index] = 0;
        } else if (converted && current === material) {
          this.placedTri[index] = 1;
        } else if (current === EMPTY || (isLiquid(current) && !isLiquid(material) && material !== EMBER)
            || (material === ICHOR && current === WATER) || (current === EMBER && isLiquid(material))) {
          this.grid[index] = material;
          this.heat[index] = material === EMBER ? 40 + Math.floor(this.random() * 65) : 0;
          this.placedTri[index] = Number(converted);
        }
      }
    }
    if (material === ERASE) {
      this.debris = this.debris.filter((piece) => Math.hypot(Math.floor(piece.x) - x, Math.floor(piece.y) - y) > radius);
      this.creatures = this.creatures.filter((animal) => {
        if (!Object.hasOwn(TRI_CREATURE_STRIDE, animal.type)) {
          return Math.hypot(animal.x - x, animal.y - y) > radius + 2;
        }
        const height = animal.type === 'brain' ? 26 : animal.type === 'ling' ? 15 : 18;
        const halfWidth = animal.type === 'blob' ? 11 : 6;
        return Math.abs(animal.x - x) > radius + halfWidth || y + radius < animal.y - height || y - radius > animal.y + 2;
      });
      this.scenery = this.scenery.filter((item) => {
        const { width, height } = SCENERY[item.type];
        return Math.abs(item.x - x) > radius + width / 2 || y + radius < item.y - height
          || y - radius > item.y + (item.type === 'dock' ? 16 : 1);
      });
      this.portals = this.portals.filter((portal) => Math.abs(portal.x - x) > radius + TRI_PORTAL.halfWidth
        || y + radius < portal.y - TRI_PORTAL.height || y - radius > portal.y + 1);
      this.bosses = this.bosses.filter((boss) => !this.bossTouches(boss, x, y, radius));
      if (this.triPatches.length > 0) {
        this.triPatches = this.triPatches.filter((patch) => {
          const scale = triCoreScale(patch.radius);
          return Math.abs(patch.x - x) > radius + 10 * scale
            || y + radius < patch.y - 18 * scale || y - radius > patch.y + 1;
        });
        this.updateTri();
      }
    }
  }

  clearPixel(x, y) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return false;
    const index = y * WIDTH + x;
    if (this.grid[index] === EMPTY) return false;
    this.grid[index] = EMPTY;
    this.heat[index] = 0;
    this.placedTri[index] = 0;
    return true;
  }

  shedPixel(x, y, color) {
    const piece = { x: x + 0.5, y: y + 0.5, color };
    this.kickFragment(piece);
    if (this.debris.length < DEBRIS_LIMIT) this.debris.push(piece);
    else {
      this.debris[this.nextFragment] = piece;
      this.nextFragment = (this.nextFragment + 1) % DEBRIS_LIMIT;
    }
  }

  kickFragment(piece) {
    piece.bornAt = this.tick;
    piece.vx = (this.fragmentRandom() - 0.5) * 1.5;
    piece.vy = -0.25 - this.fragmentRandom() * 0.9;
  }

  removeShattered(isShattered) {
    this.creatures = this.creatures.filter((item) => !isShattered(item));
    this.bosses = this.bosses.filter((item) => !isShattered(item));
    this.scenery = this.scenery.filter((item) => !isShattered(item));
    this.portals = this.portals.filter((item) => !isShattered(item));
    const count = this.triPatches.length;
    this.triPatches = this.triPatches.filter((item) => !isShattered(item));
    if (this.triPatches.length !== count) this.updateTri();
  }

  stepDebris() {
    for (const piece of this.debris) {
      if (!piece.vx && !piece.vy && isSolid(this.at(Math.floor(piece.x), Math.floor(piece.y) + 1))) continue;
      const nextX = piece.x + piece.vx;
      if (isSolid(this.at(Math.floor(nextX), Math.floor(piece.y)))) piece.vx *= -0.42;
      else piece.x = nextX;
      piece.vy = Math.min(2.6, piece.vy + 0.14);
      const column = Math.floor(piece.x);
      const nextY = piece.y + piece.vy;
      const direction = Math.sign(piece.vy);
      const target = Math.floor(nextY);
      let row = Math.floor(piece.y) + direction;
      for (; direction && (target - row) * direction >= 0; row += direction) {
        if (isSolid(this.at(column, row))) break;
      }
      if (direction && (target - row) * direction >= 0) {
        piece.y = row - direction * 0.5;
        piece.vy = 0;
        piece.vx *= 0.48;
        if (Math.abs(piece.vx) < 0.08) piece.vx = 0;
      } else {
        piece.y = Math.max(0, nextY);
      }
    }
  }

  placeCreature(type, x, y, { converted = false, emerging = false, facing } = {}) {
    if (!Object.hasOwn(CREATURES, type) || this.creatures.length >= ANIMAL_LIMIT) return false;
    x = Math.max(2, Math.min(WIDTH - 3, x));
    y = Math.max(2, Math.min(HEIGHT - 2, y));
    let lift = 0;
    while (isSolid(this.at(x, y)) && y > 2 && lift++ < 12) y--;
    if (isSolid(this.at(x, y))) return false;
    const direction = facing ?? (this.random() < 0.5 ? -1 : 1);
    const bornAt = this.tick;
    const readyAt = bornAt + (emerging ? TRI_EMERGENCE : 0);
    this.creatures.push({ type, x, y, converted, direction, phase: this.random() * 10, wait: 0, wet: false,
      bornAt, readyAt });
    return true;
  }

  findPlacementSurface(x, y, allowLiquid = false) {
    if (x < 0 || x >= WIDTH) return null;
    for (let ground = Math.max(1, y - 5); ground < HEIGHT; ground++) {
      const material = this.at(x, ground);
      if (material === EMPTY) continue;
      return this.at(x, ground - 1) === EMPTY && (isSolid(material) || (allowLiquid && isLiquid(material))) ? ground : null;
    }
    return null;
  }

  placeScenery(type, x, y, { converted = false } = {}) {
    if (!Object.hasOwn(SCENERY, type) || this.scenery.length >= SCENERY_LIMIT) return false;
    const { width, height } = SCENERY[type];
    const ground = this.findPlacementSurface(x, y, type === 'dock');
    if (ground === null || ground < height || this.scenery.some((item) =>
      Math.abs(item.x - x) < (width + SCENERY[item.type].width) / 2
      && Math.abs(item.y - ground) < Math.max(height, SCENERY[item.type].height))) return false;
    this.scenery.push({ type, x, y: ground, converted });
    return true;
  }

  placePortal(x, y) {
    const { halfWidth, height, limit } = TRI_PORTAL;
    if (this.portals.length >= limit || x < halfWidth || x >= WIDTH - halfWidth) return false;
    const ground = this.findPlacementSurface(x, y);
    if (ground === null || ground < height || this.portals.some((portal) =>
      Math.abs(portal.x - x) < halfWidth * 2 && Math.abs(portal.y - ground) < height)) return false;
    const direction = x < WIDTH / 2 ? 1 : -1;
    this.portals.push({ x, y: ground, direction, birthAt: this.tick });
    return true;
  }

  placeBoss(type, x, y) {
    if (!Object.hasOwn(BOSSES, type) || this.bosses.some((boss) => boss.type === type)) return false;
    const margin = type === 'lake-terror' ? 72 : BOSSES[type].halfWidth + 13;
    if (x < margin || x >= WIDTH - margin) return false;
    if (type === 'sky-eye') {
      const { above, below } = BOSSES[type];
      y = Math.max(above + 4, Math.min(HEIGHT - below - 1, y));
      if (this.at(x, y) !== EMPTY || this.at(x, y + 10) !== EMPTY) return false;
    } else {
      const ground = this.findPlacementSurface(x, y, type === 'lake-terror');
      if (ground === null || ground <= BOSSES[type].above
          || (type === 'lake-terror' && !isLiquid(this.at(x, ground)))) return false;
      y = ground;
    }
    this.bosses.push({ type, x, y, homeX: x, direction: 1, bornAt: this.tick, stride: 0 });
    return true;
  }

  bossTouches(boss, x, y, radius) {
    if (boss.type === 'lake-terror') {
      for (let index = 0; index < TERROR_SEGMENTS; index++) {
        const part = bossPosition(boss, this.tick, index);
        if (!isSolid(this.at(part.x, part.y)) && Math.hypot(part.x - x, part.y - y) <= radius + (index ? 7 : 13)) return true;
      }
      return false;
    }
    const center = bossPosition(boss, this.tick);
    const { halfWidth, above, below } = BOSSES[boss.type];
    return Math.abs(center.x - x) <= radius + halfWidth
      && y + radius >= center.y - above && y - radius <= center.y + below;
  }

  isTriAt(x, y) {
    return x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT && this.triMap[y * WIDTH + x] !== 0;
  }

  placeTri(x, y) {
    if (this.triPatches.length >= TRI_LIMIT) return false;
    const ground = this.findPlacementSurface(x, y);
    if (ground === null || this.triPatches.some((patch) =>
      Math.abs(x - patch.x) <= 12 && Math.abs(ground - patch.y) <= 4)) return false;
    const farX = Math.max(x, WIDTH - 1 - x);
    const farY = Math.max(ground, HEIGHT - 1 - ground);
    const limit = Math.ceil(Math.hypot(farX, farY));
    const births = TRI_BIRTHS.map(({ first }) => this.tick + first * TICKS_PER_SECOND);
    this.triPatches.push({ x, y: ground, radius: TRI_START_RADIUS, limit, births, bossAt: this.tick + TRI_BOSS_AGE });
    this.updateTri();
    return true;
  }

  spawnTriCreature(patch, type) {
    const start = Math.floor(this.random() * TRI_SPAWN_OFFSETS.length);
    for (let i = 0; i < TRI_SPAWN_OFFSETS.length; i++) {
      const x = patch.x + TRI_SPAWN_OFFSETS[(start + i) % TRI_SPAWN_OFFSETS.length];
      const y = this.findPlacementSurface(x, patch.y);
      if (y === null || !this.isTriAt(x, y) || this.creatures.some((animal) =>
        Math.abs(animal.x - x) < 9 && Math.abs(animal.y - y) < 8)) continue;
      return this.placeCreature(type, x, y - 1, { converted: true, emerging: true });
    }
    return false;
  }

  updateTriBirths() {
    for (const patch of this.triPatches) {
      for (const [index, spawn] of TRI_BIRTHS.entries()) {
        if (this.tick < patch.births[index]) continue;
        const available = this.creatures.length < ANIMAL_LIMIT
          && this.creatures.filter(({ type }) => type === spawn.type).length < spawn.max;
        const placed = available && this.spawnTriCreature(patch, spawn.type);
        patch.births[index] = this.tick + (placed ? spawn.repeat : 1) * TICKS_PER_SECOND;
      }
      if (this.tick >= patch.bossAt) {
        const y = Math.max(32, patch.y - 55);
        const awakened = TRI_BOSS_OFFSETS.some((offset) => {
          const x = patch.x + offset;
          return this.isTriAt(x, y) && this.placeBoss('sky-eye', x, y);
        });
        patch.bossAt = awakened ? Infinity : this.tick + TICKS_PER_SECOND;
      }
    }
  }

  updatePortalBirths() {
    if (this.portalOpening < 1) return;
    let population = this.creatures.filter(({ type }) => type === 'blob').length;
    for (const portal of this.portals) {
      if (population >= TRI_BLOB_LIMIT || this.creatures.length >= ANIMAL_LIMIT) break;
      if (this.tick < portal.birthAt) continue;
      const spawned = [10, 0].some((offset) => {
        const x = portal.x + portal.direction * offset;
        const y = this.findPlacementSurface(x, portal.y);
        if (y === null || Math.abs(y - portal.y) > 5) return false;
        if (this.creatures.some((creature) => Math.abs(creature.x - x) < 9 && Math.abs(creature.y - y) < 8)) return false;
        return this.placeCreature('blob', x, y - 1, { converted: true, facing: portal.direction });
      });
      portal.birthAt = this.tick + (spawned ? 5 : 1) * TICKS_PER_SECOND;
      if (spawned) population++;
    }
  }

  updateTri(growth = 0) {
    const active = this.triPatches.filter(({ x, y }) => isSolid(this.at(x, y)));
    const changed = active.length !== this.triPatches.length;
    this.triPatches = active;
    if (!growth || changed || active.some((patch) => patch.radius < patch.limit)) {
      this.triMap.fill(0);
      for (const patch of active) {
        patch.radius = Math.min(patch.limit, patch.radius + growth);
        const { x, y, radius } = patch;
        const bottom = Math.min(HEIGHT - 1, y + radius);
        for (let row = Math.max(0, y - radius); row <= bottom; row++) {
          // Fill just the horizontal span inside the growing circle.
          const halfWidth = Math.floor(Math.sqrt(radius * radius - (row - y) ** 2));
          const start = Math.max(0, x - halfWidth);
          const end = Math.min(WIDTH, x + halfWidth + 1);
          this.triMap.fill(1, row * WIDTH + start, row * WIDTH + end);
        }
      }
    }
    this.syncIchor();
  }

  syncIchor() {
    const { grid, triMap, ichorCells, liquidQueue } = this;
    if (this.triPatches.length === 0 && !grid.includes(ICHOR)) return;
    ichorCells.fill(0);
    let tail = 0;
    const visit = (index) => {
      if (!ichorCells[index] && isLiquid(grid[index])) {
        ichorCells[index] = 1;
        liquidQueue[tail++] = index;
      }
    };
    // Flood-fill connected pools from every liquid cell touched by Tri.
    for (let index = 0; index < grid.length; index++) {
      if (triMap[index]) visit(index);
    }
    for (let head = 0; head < tail; head++) {
      const index = liquidQueue[head];
      const x = index % WIDTH;
      if (x > 0) visit(index - 1);
      if (x + 1 < WIDTH) visit(index + 1);
      if (index >= WIDTH) visit(index - WIDTH);
      if (index + WIDTH < grid.length) visit(index + WIDTH);
    }
    for (let index = 0; index < grid.length; index++) {
      if (ichorCells[index]) grid[index] = ICHOR;
      else if (grid[index] === ICHOR && !this.placedTri[index]) grid[index] = WATER;
    }
  }

  move(index, target) {
    const material = this.grid[index];
    const heat = this.heat[index];
    this.grid[index] = this.grid[target];
    this.heat[index] = this.heat[target];
    this.grid[target] = material;
    this.heat[target] = heat;
    const converted = this.placedTri[index];
    this.placedTri[index] = this.placedTri[target];
    this.placedTri[target] = converted;
    this.updated[index] = this.tick;
    this.updated[target] = this.tick;
  }

  step() {
    this.tick++;
    for (let y = HEIGHT - 1; y >= 0; y--) {
      const row = y * WIDTH;
      const direction = (y + this.tick) % 2 ? 1 : -1;
      for (let x = direction === 1 ? 0 : WIDTH - 1; x >= 0 && x < WIDTH; x += direction) {
        const index = row + x;
        const material = this.grid[index];
        if (material === EMPTY || material === BASALT || material === ROCK || material === GRASS) continue;
        if (this.updated[index] === this.tick) continue;
        if (isLiquid(material)) {
          if (material === WATER || this.tick % 2 === 0) {
            this.stepLiquid(index, x, y, direction, material === ICHOR ? 1 : 3);
          }
        } else if (material === EMBER) this.stepEmber(index, x, y, direction);
        else this.stepGrain(index, x, y, material, direction);
      }
    }
    for (const creature of this.creatures) {
      if (this.tick >= creature.readyAt) this.stepCreature(creature);
    }
    for (const boss of this.bosses) {
      if (boss.type === 'copper-giant' && this.tick % 8 === 0) this.stepGiant(boss);
    }
    this.stepDebris();
    if (this.triPatches.length > 0 && this.tick % TRI_GROWTH_TICKS === 0) {
      this.updateTri(TRI_GROWTH_PIXELS);
      this.updateTriBirths();
    }
    if (this.portals.length > 0) this.updatePortalBirths();
  }

  stepGiant(boss) {
    const next = boss.x + boss.direction;
    if (Math.abs(next - boss.homeX) < 80) {
      for (const offset of [0, -1, 1, -2, 2, -3, 3]) {
        const y = boss.y + offset;
        if (next < 30 || next >= WIDTH - 30 || !isSolid(this.at(next, y)) || this.at(next, y - 1) !== EMPTY) continue;
        boss.x = next;
        boss.y = y;
        boss.stride++;
        return;
      }
    }
    boss.direction *= -1;
  }

  stepLiquid(index, x, y, direction, flowRange) {
    if (y + 1 < HEIGHT) {
      const below = index + WIDTH;
      if (this.grid[below] === EMPTY) {
        this.move(index, below);
        return;
      }
      for (const dx of [direction, -direction]) {
        if (this.at(x + dx, y + 1) === EMPTY && !isSolid(this.at(x + dx, y))) {
          this.move(index, below + dx);
          return;
        }
      }
    }
    for (const dx of [direction, -direction]) {
      let distance = 0;
      while (distance < flowRange && this.at(x + dx * (distance + 1), y) === EMPTY) {
        distance++;
        if (this.at(x + dx * distance, y + 1) === EMPTY) break;
      }
      if (distance > 0) {
        this.move(index, index + distance * dx);
        return;
      }
    }
  }

  stepGrain(index, x, y, material, direction) {
    if (material === COPPER && this.tick % 12 === (x + y) % 12
        && (isLiquid(this.at(x, y + 1)) || isLiquid(this.at(x, y - 1))
          || isLiquid(this.at(x - 1, y)) || isLiquid(this.at(x + 1, y)))
        && this.random() < 0.14) {
      this.grid[index] = PATINA;
    }
    if (y + 1 === HEIGHT) return;
    const below = index + WIDTH;
    for (const dx of [0, direction, -direction]) {
      const next = this.at(x + dx, y + 1);
      if ((next === EMPTY || isLiquid(next)) && (!dx || !isSolid(this.at(x + dx, y)))) {
        this.move(index, below + dx);
        return;
      }
    }
  }

  stepEmber(index, x, y, direction) {
    if (this.heat[index] <= 1 || isLiquid(this.at(x, y + 1)) || isLiquid(this.at(x, y - 1))
        || isLiquid(this.at(x + 1, y)) || isLiquid(this.at(x - 1, y))) {
      this.grid[index] = EMPTY;
      this.heat[index] = 0;
      this.placedTri[index] = 0;
      return;
    }
    this.heat[index]--;
    for (const dx of [0, direction, -direction]) {
      if (this.at(x + dx, y + 1) === EMPTY && (!dx || !isSolid(this.at(x + dx, y)))) {
        this.move(index, index + WIDTH + dx);
        return;
      }
    }
  }

  stepCreature(animal) {
    let { x, y, direction } = animal;
    animal.wet = isLiquid(this.at(x, y)) || isLiquid(this.at(x, y + 1));
    const swimming = animal.wet;
    const stride = TRI_CREATURE_STRIDE[animal.type] ?? (animal.type === 'duck' ? 5 : swimming ? 3 : 8);
    if (isSolid(this.at(x, y)) && !isSolid(this.at(x, y - 1))) {
      y = Math.max(2, y - 1);
    } else if (swimming && isLiquid(this.at(x, y - 1)) && this.tick % 3 === 0) {
      y--;
    } else if (!swimming && !isSolid(this.at(x, y + 1))) {
      y++;
    }

    if (animal.wait > 0) animal.wait--;
    else if (this.tick % stride === 0) {
      const next = x + direction;
      const terrain = this.at(next, y);
      if (next < 2 || next >= WIDTH - 2 || (animal.type === 'lizard' && swimming && !isSolid(terrain)
          && !isLiquid(this.at(next, y + 1)) && !isLiquid(terrain))) {
        direction *= -1;
        animal.wait = 12;
      } else if (!isSolid(terrain)) {
        x = next;
      } else if (!isSolid(this.at(next, y - 1))) {
        x = next;
        y = Math.max(2, y - 1);
      } else {
        direction *= -1;
      }
      if (this.tick % (stride * 13) === 0 && this.random() < 0.07) direction *= -1;
    }
    Object.assign(animal, { x, y, direction });
  }

  getStats() {
    let copper = 0;
    let water = 0;
    let ichor = 0;
    for (const material of this.grid) {
      if (material === WATER) water++;
      if (material === ICHOR) ichor++;
      if (COPPER_MATERIALS.includes(material)) copper++;
    }
    return { copper, water, ichor, creatures: this.creatures.length };
  }
}
