import { createSlotRecord, MAX_CREATURES, MAX_PLANETS, MAX_PONDS, restoreSlot, SPECIES_CAPACITY, SPECIES_LIMIT, TERRAIN_H, TERRAIN_W } from './model.mjs';

const FORMAT = 'orbit-bloom-backup';
const MAX_BYTES = 24 * 1024 * 1024;
const LAND_CAPACITY = SPECIES_CAPACITY * SPECIES_LIMIT;
const TILE_COUNT = TERRAIN_H * TERRAIN_W;

const finite = Number.isFinite;
const record = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const id = (value) => typeof value === 'string' && /^[\w-]{1,64}$/.test(value);
const point = (value) => record(value) && finite(value.x) && value.x >= 0 && value.x <= 1 && finite(value.y) && value.y >= 0 && value.y <= 1;
const list = (value, max, validate) => Array.isArray(value) && value.length <= max && value.every(validate);
const optionalList = (value, max, validate) => value == null || list(value, max, validate);
const grid = (value) => Array.isArray(value) && value.length === TILE_COUNT && value.every(finite);
const pathTarget = (value) => value == null || (point(value) && finite(value.angle));
const climb = (value) => value == null || (record(value) && finite(value.angle) && finite(value.progress) && value.progress >= 0 && value.progress <= 1);
const ancestry = (value) => record(value) && Number.isSafeInteger(value.id) && typeof value.kind === 'string' &&
  record(value.traits) && list(value.parents, 2, record);
// Releases while paused can add ancestry records before the next simulation step trims the archive.
const lineage = (value) => value == null || (Array.isArray(value) && value.every(ancestry));
const animal = (value) => point(value) && Number.isSafeInteger(value.id) && finite(value.energy) &&
  record(value.genome) && (value.anatomy == null || (record(value.anatomy) && Object.values(value.anatomy).every(finite))) &&
  Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 6 && pathTarget(value.exit) && climb(value.climb) &&
  (value.shoreGoal == null || point(value.shoreGoal));
const plant = (value) => point(value) && finite(value.mass) && value.mass >= 0 && value.mass <= 1 && finite(value.seed) &&
  (value.genes == null || (record(value.genes) && Object.values(value.genes).every(finite)));
const remains = (value) => point(value) && finite(value.mass);
const egg = (value) => point(value) && finite(value.duration) && value.duration > 0 && finite(value.progress) && animal(value.child);

function pondIsValid(pond) {
  return point(pond) && id(pond.id) && finite(pond.seed) && finite(pond.time) && record(pond.genome) &&
    list(pond.creatures, MAX_CREATURES, animal) && list(pond.food, 125, (food) => point(food) && finite(food.value)) &&
    list(pond.discovered, 7, (stage) => Number.isInteger(stage) && stage >= 0 && stage <= 6) &&
    optionalList(pond.algae ?? pond.grass, 64, plant) && lineage(pond.lineage) &&
    optionalList(pond.remains, 48, remains);
}

function planetIsValid(planet) {
  return record(planet) && id(planet.id) && typeof planet.name === 'string' && finite(planet.seed) &&
    finite(planet.orbit) && finite(planet.angle) && grid(planet.terrain) &&
    (planet.basinWater == null || grid(planet.basinWater)) && (planet.grassCover == null || grid(planet.grassCover)) &&
    list(planet.ponds, MAX_PONDS, pondIsValid) && optionalList(planet.walkers, LAND_CAPACITY, animal) &&
    optionalList(planet.eggs, LAND_CAPACITY, egg) && optionalList(planet.plants, 145, plant) &&
    optionalList(planet.oceanAlgae, 72, plant) && optionalList(planet.remains, 48, remains) &&
    lineage(planet.plantLineage) && optionalList(planet.history, 192, (sample) => record(sample) && finite(sample.time));
}

export function createBackup(system, view) {
  const name = system.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const filename = `${name || 'my-system'}.pond.json`;
  const text = JSON.stringify({ format: FORMAT, ...createSlotRecord(system, view) });
  return { filename, text };
}

export async function readBackup(file) {
  if (file.size > MAX_BYTES) throw new Error('Choose a Pond backup under 24 MB.');
  let saved;
  try {
    saved = JSON.parse(await file.text());
    if (saved?.format !== FORMAT || !list(saved.system?.planets, MAX_PLANETS, planetIsValid)) throw new Error('Invalid backup.');
    return restoreSlot(saved);
  } catch (error) {
    throw new Error('Choose a readable Pond backup file.', { cause: error });
  }
}
