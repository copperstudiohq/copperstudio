import { moveInPondGrid, nearestInPond, nearestOnPlanet, plantGrid, spatialBuckets } from './spatial-grid.mjs';
import { hueColor, rgb, rgbHex } from './colors.mjs';
import { MAX_SPECIES_CALLS, validSpeciesCall } from './species-calls.mjs';

export const STARS = {
  amber: { name: 'Amber', color: '#ffbd70', core: '#fff8da', rim: '#f67935' },
  ice: { name: 'Ice', color: '#8bdcff', core: '#f1fdff', rim: '#378af4' },
  rose: { name: 'Rose', color: '#ff92b5', core: '#fff5f9', rim: '#ff527c' },
  jade: { name: 'Jade', color: '#89ebc1', core: '#efffed', rim: '#34ac80' },
};
export const WEATHER = {
  clear: { name: 'Clear', temperature: 23, growth: 1, moisture: .52 },
  rain: { name: 'Rain', temperature: 18, growth: 1.32, moisture: .88 },
  storm: { name: 'Storm', temperature: 15, growth: 0.92, moisture: .99 },
  snow: { name: 'Snow', temperature: -4, growth: 0.68, moisture: .36 },
};
export const STAGES = [
  { name: 'Cell', color: '#8ceac4', size: 5 },
  { name: 'Colony', color: '#b1df84', size: 7 },
  { name: 'Swimmer', color: '#9cd8fc', size: 9 },
  { name: 'Fish', color: '#f0c077', size: 13 },
  { name: 'Amphibian', color: '#c7a9fc', size: 14 },
  { name: 'Land animal', color: '#fc9cac', size: 15 },
  { name: 'Land runner', color: '#f9b982', size: 17 },
];
export const DIETS = { grazer: 'Grazer', omnivore: 'Omnivore', hunter: 'Hunter', scavenger: 'Scavenger' };
export const BODY_SHAPES = { round: 'Round', oval: 'Oval', spiky: 'Spiky', ribbon: 'Ribbon' };
export const PATTERNS = { plain: 'Plain', spots: 'Spots', bands: 'Bands', mottled: 'Mottled' };
export const MOTION = { tail: 'Flagellum', cilia: 'Cilia', glide: 'Glide' };
export const ACTIVITY = { flexible: 'Any light', daytime: 'Day-active', nighttime: 'Night-active', twilight: 'Twilight-active' };
export const DEFAULT_GENOME = {
  strain: '', diet: 'grazer', color: '#8ceac4', nucleus: '#f2fcb1', shape: 'round', pattern: 'spots',
  motion: 'tail', size: 1, speed: 1, senses: 1, metabolism: 1, mutation: .64, caution: .48, activity: 'flexible', sociability: .45,
};
export const DEFAULT_PALETTE = { stone: '#cb955a', water: '#2c9fca' };
export const PLANET_SIZES = {
  small: { name: 'Small', scale: .71, surfaceScale: 2.2, sizeGain: .34 },
  medium: { name: 'Medium', scale: 1, surfaceScale: 3, sizeGain: .48 },
  large: { name: 'Large', scale: 1.31, surfaceScale: 4.2, sizeGain: .67 },
};
export const TERRAIN_W = 92;
export const TERRAIN_H = 60;
export const MAX_PLANETS = 9;
export const MAX_PONDS = 6;
export const MAX_CREATURES = 125;
export const SPECIES_LIMIT = 5;
export const SPECIES_CAPACITY = 6;
const MAX_PLANTS = 145;
const MAX_POND_ALGAE = 64;
const MAX_OCEAN_ALGAE = 72;
const ALGAE_MATURITY = 1.25;
const SHORE_ADAPTATION_TIME = 4;
const DAY_LENGTH = 10;
const YEAR_LENGTH = 16 * DAY_LENGTH;
const WEATHER_INTERVAL = 11;
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const HISTORY_INTERVAL = 2.5;
const HISTORY_LIMIT = 192;
const GRASS_SPREAD_INTERVAL = 1.4;
const LINEAGE_RECORD_LIMIT = 80;
const LINEAGE_TRIM_THRESHOLD = LINEAGE_RECORD_LIMIT + 36;
const REMAINS_LIMIT = 48;
const dryTileCache = new WeakMap();
const climateFrames = new WeakMap();
const habitatColors = new WeakMap();
const creatureColors = new WeakMap();
export const STEP = 0.125;

const PLANET_NAMES = ['Aster', 'Tamar', 'Cinder', 'Lyra', 'Nacre', 'Vesper', 'Caldera', 'Oriel', 'Talus'];
const TAU = Math.PI * 2;
const RANDOM_INCREMENT = 0x6D2B79F5;
const worldRandomSources = new WeakMap();
const FOUNDER_ANATOMY = { tissue: .09, length: .42, legs: .02, fins: .06, tail: .16, armor: .04, eyes: .18, air: .03, thermal: .60 };
const ANATOMY_MUTATIONS = { tissue: .34, length: .40, legs: .45, fins: .46, tail: .40, armor: .38, eyes: .39, air: .44, thermal: .30 };
const ALGAE_DESIGN = { growth: 1, width: 1, pigment: 0, moisture: .65 };
const GRASS_GENES = { ...ALGAE_DESIGN, height: 1, spread: 1, curl: 1, blades: 0 };
const PLANT_MUTATIONS = {
  growth: [.28, .55, 1.55], height: [.38, .54, 1.65], width: [.37, .45, 1.72], spread: [.36, .48, 1.58],
  curl: [.49, .21, 1.95], blades: [2.2, -4, 5], pigment: [13, -24, 24], moisture: [.35, .12, 1.08],
};
const GRASS_HUES = [43, 91, 139, 175, 205, 233, 270, 307, 340];
const GRASS_FORMS = [
  { name: 'Needle blades', height: 1.3, spread: .52, width: .045, bend: .16 },
  { name: 'Fan blades', height: .92, spread: 1.08, width: .10, bend: .24 },
  { name: 'Curled blades', height: 1.15, spread: .73, width: .075, bend: .72 },
  { name: 'Ribbon blades', height: 1.04, spread: .70, width: .145, bend: .42 },
];

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const wrap = (value) => ((value % 1) + 1) % 1;
export const longitudeDistance = (from, to) => wrap(to - from + .5) - .5;
export const orbitAU = (orbit) => (0.26 + orbit * 1.54).toFixed(2);
const validColor = (color, fallback) => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
export const planetSize = (planet) => PLANET_SIZES[planet?.size] ?? PLANET_SIZES.medium;

export function starAppearance(system) {
  const color = validColor(system.sunTint, null);
  if (!color) return STARS[system.sun] ?? STARS.amber;
  const channels = rgb(color);
  return {
    name: 'Custom', color,
    core: rgbHex(channels.map((channel) => 210 + channel * .176)),
    rim: rgbHex(channels.map((channel, index) => 18 + channel * (index === 0 ? .81 : .68))),
  };
}

export function orbitalTemperature(orbit) {
  return Math.round(18 + 66 * (.59 - orbit));
}

export function planetTemperature(planet) {
  return orbitalTemperature(planet.orbit) + WEATHER[planet.weather].temperature - WEATHER.clear.temperature;
}

export function comfortableTemperature(anatomy) {
  return Math.round(-10 + anatomy.thermal * 54);
}

export function setFounderTemperature(pond, degrees) {
  if (Number.isFinite(degrees)) pond.founderThermal = (clamp(degrees, -10, 55) + 10) / 54;
}

export function activityLevel(activity, light) {
  if (activity === 'daytime') return .55 + light * .55;
  if (activity === 'nighttime') return 1.10 - light * .55;
  if (activity === 'twilight') return 1.05 - Math.abs(.5 - light) * .88;
  return 1;
}

export const sunlitLongitude = (planet) => wrap(.5 + (planet.climateTime ?? 0) / DAY_LENGTH);
export const iceCover = (planet, y = .5) => clamp((planet.ice ?? 0) * (.86 + Math.abs(y - .5) * .58), 0, 1);

function climateFrame(planet) {
  const time = planet.climateTime ?? 0;
  const previous = climateFrames.get(planet);
  if (previous?.time === time && previous.weather === planet.weather && previous.orbit === planet.orbit) return previous;
  const year = (time % YEAR_LENGTH) / YEAR_LENGTH;
  const frame = { time, weather: planet.weather, orbit: planet.orbit, year, sun: sunlitLongitude(planet),
    warmth: Math.sin(year * TAU - Math.PI * .25), temperature: planetTemperature(planet) };
  climateFrames.set(planet, frame);
  return frame;
}

export function habitatAt(planet, point, underwater = false) {
  const climate = climateFrame(planet);
  const latitude = Math.abs(point.y - .5) * 2;
  const sun = Math.cos(TAU * (point.x - climate.sun));
  const light = clamp(.55 + sun * .48 * (1 - latitude * .42), .05, 1);
  const seasonWarmth = climate.warmth * (.5 - point.y) * 23;
  const localYear = point.y > .5 ? wrap(climate.year + .5) : climate.year;
  const elevation = Math.max(0, terrainAt(planet, point.x, point.y));
  const thermalBuffer = underwater ? .28 : 1;
  const temperature = climate.temperature - latitude * 9 +
    (seasonWarmth + sun * 5 - (elevation - 25) * .12) * thermalBuffer;
  const shore = !underwater && (planet.ponds.some((pond) => {
    const scale = pondScale(pond);
    return Math.abs(point.y - pond.y) < .09 * scale && landDistance(point, pond) < .067 * scale;
  }) ||
    nearOcean(planet, point));
  const soil = planet.soilMoisture ?? WEATHER[planet.weather].moisture;
  const moisture = underwater ? 1 : clamp(soil + (shore ? .20 : -.055) - (elevation - 25) * .0027 - light * .035, .13, 1);
  return { temperature, moisture, light, season: SEASONS[Math.floor(localYear * SEASONS.length)] };
}

function nearOcean(planet, point) {
  if (!planet.basinWater) return false;
  const x = point.x;
  const y = point.y;
  const reach = .025 / Math.max(.42, Math.sin(y * Math.PI));
  return basinWaterAt(planet, x + reach, y) >= .22 || basinWaterAt(planet, x - reach, y) >= .22 ||
    basinWaterAt(planet, x, y + .025) >= .22 || basinWaterAt(planet, x, y - .025) >= .22;
}

export function habitatSurface(planet, point) {
  if (planet.ponds.some((pond) => pondDistance(pond, point.x, point.y) < 1.02)) return 'Pond water';
  if (basinWaterAt(planet, point.x, point.y) >= .14) return 'Ocean';
  if (grassCovers(planet, point.x, point.y)) return 'Grass';
  return terrainAt(planet, point.x, point.y) < 0 ? 'Dry basin' : 'Stone';
}

function stepClimate(planet, dt) {
  const before = Math.floor(planet.climateTime / WEATHER_INTERVAL);
  planet.climateTime += dt;
  const interval = Math.floor(planet.climateTime / WEATHER_INTERVAL);
  if (planet.autoWeather && before !== interval) {
    const random = seededRandom(planet.seed ^ Math.imul(interval, 60223));
    const chance = random();
    const season = Math.sin(planet.climateTime * TAU / YEAR_LENGTH - Math.PI * .25);
    const ambient = orbitalTemperature(planet.orbit) + season * 8;
    planet.weather = ambient < 4 && chance < .70 ? 'snow' : chance < .12 ? 'storm' : chance < .53 ? 'rain' : 'clear';
  }
  const target = WEATHER[planet.weather].moisture;
  const moisture = planet.soilMoisture ?? target;
  planet.soilMoisture = moisture + (target - moisture) * Math.min(1, dt * (target > moisture ? .36 : .13));
  const air = planetTemperature(planet);
  const nextIce = clamp(-air / 17, 0, 1);
  const ice = planet.ice ?? 0;
  planet.ice = ice + (nextIce - ice) * Math.min(1, dt * (nextIce > ice ? .10 : .16));
}

function temperatureStress(anatomy, temperature) {
  return Math.min(1, Math.abs(comfortableTemperature(anatomy) - temperature) / 49);
}

function growingConditions(weather, temperature) {
  return WEATHER[weather].growth * Math.max(.77, 1 - Math.abs(temperature - 21) * .004);
}

export function planetPalette(planet) {
  return {
    stone: validColor(planet.stoneColor, validColor(planet.color, DEFAULT_PALETTE.stone)),
    water: validColor(planet.waterColor, DEFAULT_PALETTE.water),
  };
}

function concealmentColors(planet) {
  let colors = habitatColors.get(planet);
  if (!colors) {
    const palette = planetPalette(planet);
    colors = {
      stone: rgb(palette.stone),
      water: rgb(palette.water).map((channel, index) => channel * .57 + (index === 2 ? 17 : 9)),
      grass: hueColor(grassProfile(planet).hue, .56, .43),
    };
    habitatColors.set(planet, colors);
  }
  return colors;
}

export function camouflageAt(planet, cell, underwater) {
  if (!planet || cell.stage < 2) return 0;
  const colors = concealmentColors(planet);
  const ground = underwater || cell.submerged ? colors.water
    : planet.grassCover?.[terrainIndex(cell.x, cell.y)] ? colors.grass : colors.stone;
  const { genome } = cell;
  let skin = creatureColors.get(genome);
  if (!skin) {
    skin = rgb(genome.color);
    creatureColors.set(genome, skin);
  }
  const difference = Math.abs(skin[0] - ground[0]) * .27 + Math.abs(skin[1] - ground[1]) * .54 + Math.abs(skin[2] - ground[2]) * .19;
  return Math.max(0, 1 - difference / 65) * (genome.pattern === 'plain' ? .88 : 1);
}

function canSpot(planet, prey, distanceSquared, radiusSquared, light, underwater) {
  if (prey.stage < 2) return true;
  const reach = 1 - camouflageAt(planet, prey, underwater) * .27 - (1 - light) * .14;
  return distanceSquared < radiusSquared * reach * reach;
}

export function seededRandom(seed) {
  return () => {
    seed = (seed + RANDOM_INCREMENT) >>> 0;
    return randomFromSeed(seed);
  };
}

function randomFromSeed(seed) {
  let value = Math.imul(seed ^ (seed >>> 15), seed | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function systemRandom(system) {
  let next = worldRandomSources.get(system);
  if (!next) {
    next = () => {
      system.randomState = (system.randomState + RANDOM_INCREMENT) >>> 0;
      return randomFromSeed(system.randomState);
    };
    worldRandomSources.set(system, next);
  }
  return next;
}

export function grassProfile(planet) {
  const random = seededRandom(planet.seed ^ 0x37bd9c53);
  const form = GRASS_FORMS[Math.floor(random() * GRASS_FORMS.length)];
  const hue = planet.grassHue ?? pickGrassHue(planet.seed);
  return {
    ...form, height: form.height * (.82 + random() * .36), spread: form.spread * (.84 + random() * .33),
    bend: form.bend * (.76 + random() * .52), blades: 5 + Math.floor(random() * 5), hue,
    color: 'hsl(' + hue + ' 65% 63%)',
  };
}

function pickGrassHue(seed, taken = []) {
  const random = seededRandom(seed ^ 0x4ff10c72);
  const available = GRASS_HUES.filter((hue) => !taken.includes(hue));
  const choices = available.length ? available : GRASS_HUES;
  return choices[Math.floor(random() * choices.length)];
}

function terrainHash(x, y, seed) {
  const number = Math.imul(x + 1013, 15485863) ^ Math.imul(y + 587, 32452843) ^ seed;
  return ((Math.imul(number ^ (number >>> 13), 1274126177) >>> 0) / 4294967296) * 2 - 1;
}

export function noise(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const smooth = (n) => n * n * (3 - 2 * n);
  const dx = smooth(x - ix);
  const dy = smooth(y - iy);
  const top = terrainHash(ix, iy, seed) * (1 - dx) + terrainHash(ix + 1, iy, seed) * dx;
  const bottom = terrainHash(ix, iy + 1, seed) * (1 - dx) + terrainHash(ix + 1, iy + 1, seed) * dx;
  return top * (1 - dy) + bottom * dy;
}

function terrainIndex(x, y) {
  const ix = clamp(Math.round(x * (TERRAIN_W - 1)), 0, TERRAIN_W - 1);
  const iy = clamp(Math.round(y * (TERRAIN_H - 1)), 0, TERRAIN_H - 1);
  return iy * TERRAIN_W + ix;
}

export function terrainAt(planet, x, y) {
  return planet.terrain[terrainIndex(x, y)];
}

export function basinWaterAt(planet, x, y) {
  return planet.basinWater?.[terrainIndex(x, y)] ?? 0;
}

const pondScale = (pond) => Number.isFinite(pond.radiusScale) ? clamp(pond.radiusScale, .2, 1) : 1;
export const pondRadiusY = (pond) => .044 * pondScale(pond);
export const pondRadiusX = (pond) => pondRadiusY(pond) * .5 / Math.max(.33, Math.sin(pond.y * Math.PI));

export function pondEdgeScale(pond, angle) {
  return 1 + .12 * Math.sin(angle * 3 + pond.seed) + .08 * Math.cos(angle * 5);
}

export function pondDistance(pond, x, y) {
  const dy = (y - pond.y) / pondRadiusY(pond);
  if (Math.abs(dy) > 1.5) return Infinity;
  const dx = longitudeDistance(pond.x, x) / pondRadiusX(pond);
  if (Math.abs(dx) > 1.5) return Infinity;
  const angle = Math.atan2(dy, dx);
  return Math.hypot(dx, dy) / pondEdgeScale(pond, angle);
}

function climbPoint(pond, angle, distance) {
  const radius = distance * pondEdgeScale(pond, angle);
  return {
    x: wrap(pond.x + Math.cos(angle) * pondRadiusX(pond) * radius),
    y: clamp(pond.y + Math.sin(angle) * pondRadiusY(pond) * radius, .02, .98),
  };
}

export function paintTerrain(planet, x, y, radius, ocean, stroke) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(radius) || radius <= 0) return false;
  let changed = false;
  for (let iy = 0; iy < TERRAIN_H; iy++) {
    const dy = iy / (TERRAIN_H - 1) - y;
    if (Math.abs(dy) > radius) continue;
    for (let ix = 0; ix < TERRAIN_W; ix++) {
      const px = ix / (TERRAIN_W - 1);
      const py = iy / (TERRAIN_H - 1);
      if (longitudeDistance(px, x) ** 2 + dy ** 2 > radius ** 2) continue;
      const index = iy * TERRAIN_W + ix;
      const height = planet.terrain[index];
      if ((height < 0) === ocean) continue;
      if (ocean && planet.ponds.some((pond) => pondDistance(pond, px, py) <= 1.48)) continue;
      const nextHeight = ocean ? -Math.max(7, height) : -height;
      if (stroke && !stroke.has(index)) {
        stroke.set(index, { before: [height, planet.basinWater?.[index] ?? 0], after: [nextHeight, 0] });
      }
      planet.terrain[index] = nextHeight;
      planet.basinWater ??= Array(planet.terrain.length).fill(0);
      planet.basinWater[index] = 0;
      changed = true;
    }
  }
  if (changed) planet.revision++;
  return changed;
}

export function applyTerrainStroke(planet, stroke, direction) {
  let changed = false;
  for (const [index, state] of stroke) {
    const [height, water] = state[direction];
    if (height < 0) {
      const x = (index % TERRAIN_W) / (TERRAIN_W - 1);
      const y = Math.floor(index / TERRAIN_W) / (TERRAIN_H - 1);
      if (planet.ponds.some((pond) => pondDistance(pond, x, y) <= 1.48)) continue;
    }
    if (planet.terrain[index] === height && (planet.basinWater?.[index] ?? 0) === water) continue;
    planet.terrain[index] = height;
    planet.basinWater ??= Array(planet.terrain.length).fill(0);
    planet.basinWater[index] = water;
    changed = true;
  }
  if (changed) planet.revision++;
  return changed;
}

export function addPlanet(system, orbit, angle, palette = DEFAULT_PALETTE, random = systemRandom(system)) {
  if (system.planets.length >= MAX_PLANETS) return { error: 'This system has room for nine planets.' };
  if (!Number.isFinite(orbit) || !Number.isFinite(angle) || orbit < 0.13 || orbit > 1) {
    return { error: 'Choose a spot between the innermost and outermost rings.' };
  }
  const index = system.planets.length;
  const seed = Math.floor(random() * 0xffffffff);
  const geography = seededRandom(seed);
  const craters = Array.from({ length: 11 }, () => ({
    x: geography(), y: .08 + geography() * .84,
    radius: .012 + geography() ** 2 * .059,
    depth: 5 + geography() * 13,
  }));
  const terrain = Array.from({ length: TERRAIN_W * TERRAIN_H }, (_, i) => {
    const x = (i % TERRAIN_W) / (TERRAIN_W - 1);
    const y = Math.floor(i / TERRAIN_W) / (TERRAIN_H - 1);
    const latitude = (y - .5) * Math.PI;
    const longitude = (x - .5) * TAU;
    const groundX = Math.sin(longitude) * Math.cos(latitude) + Math.sin(latitude) * .84;
    const groundY = Math.cos(longitude) * Math.cos(latitude) + Math.sin(latitude) * .44;
    const broad = noise(groundX * 2.6 + 3, groundY * 2.1 + 7, seed);
    const ridges = 1 - Math.abs(noise(groundX * 5.8, groundY * 5.1, seed + 71));
    let height = 30 + broad * 22 + ridges * 12;
    for (const crater of craters) {
      const dx = longitudeDistance(crater.x, x) * Math.cos(latitude);
      const dy = (y - crater.y) * .5;
      const distanceSquared = (dx * dx + dy * dy) / (crater.radius * crater.radius);
      if (distanceSquared > 1.82) continue;
      const distance = Math.sqrt(distanceSquared);
      const rim = Math.exp(-((distance - .94) ** 2) * 46) * .61;
      const floor = Math.max(0, 1 - distanceSquared) * .89;
      height += (rim - floor) * crater.depth;
    }
    return Math.max(3, Math.round(height));
  });
  const planet = {
    id: 'planet-' + (index + 1), name: PLANET_NAMES[index], seed, placedAt: system.clock,
    size: Object.hasOwn(PLANET_SIZES, palette.size) ? palette.size : 'medium',
    grassHue: pickGrassHue(seed, system.planets.map((world) => world.grassHue)),
    stoneColor: validColor(palette.stone, DEFAULT_PALETTE.stone),
    waterColor: validColor(palette.water, DEFAULT_PALETTE.water),
    orbit, angle, terrain, revision: 0, weather: 'clear', autoWeather: false, climateTime: 0, soilMoisture: WEATHER.clear.moisture, ice: 0,
    ponds: [], walkers: [], eggs: [], plants: [], oceanAlgae: [], oceanSporeClock: 0, plantLineage: [],
    landHunts: 0, landBirths: 0, basinWater: null, rainClock: 0,
    grassCover: null, coverClock: 0, coverRevision: 0, coverGrowth: 0, history: [], remains: [], nutrients: 0,
  };
  system.planets.push(planet);
  sampleHistory(planet, system.clock);
  return { planet };
}

export function pondSite(planet, x, y) {
  return { x, y, radiusScale: 1 / planetSize(planet).surfaceScale, seed: (planet.seed + 7907 * planet.ponds.length) >>> 0 };
}

export function addPond(planet, x, y) {
  if (planet.ponds.length >= MAX_PONDS) return { error: 'This planet has room for six ponds.' };
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1) return { error: 'Choose a spot on the planet for your pond.' };
  if (y < .06 || y > .94 || terrainAt(planet, x, y) <= 0) return { error: 'Place your pond on dry stone away from the poles.' };
  const site = pondSite(planet, x, y);
  if (planet.ponds.some((pond) => Math.hypot(
    longitudeDistance(pond.x, x) / (pondRadiusX(pond) + pondRadiusX(site)),
    (pond.y - y) / (pondRadiusY(pond) + pondRadiusY(site)),
  ) < 1.175)) {
    return { error: 'Give the nearby pond a little more room.' };
  }
  const pond = {
    id: planet.id + '-pond-' + (planet.ponds.length + 1),
    ...site,
    creatures: [], food: [], algae: [], lineage: [], discovered: [], time: 0, births: 0, hunts: 0, climbed: 0, nextId: 1,
    shoreAdaptation: 0, rooted: false, remains: [], nutrients: 0,
    genome: { ...DEFAULT_GENOME }, algaeDesign: { ...ALGAE_DESIGN }, founderThermal: FOUNDER_ANATOMY.thermal,
  };
  replenish(pond, 64, seededRandom(pond.seed));
  planet.ponds.push(pond);
  planet.revision++;
  return { pond };
}

function replenish(pond, count, random) {
  for (let i = 0; i < count; i++) {
    pond.food.push({ x: .04 + random() * .92, y: .04 + random() * .92, value: .16 + random() * .14 });
  }
}

function plantPatch(point, mass, random, parent, type, pollen = null, founder = null) {
  const genes = { ...GRASS_GENES, ...founder, ...parent?.genes };
  for (const [key, [amount, min, max]] of Object.entries(PLANT_MUTATIONS)) {
    if (pollen && random() < .5) genes[key] = pollen.genes[key];
    if (parent && random() > .48) continue;
    genes[key] = clamp(genes[key] + (random() * 2 - 1) * amount * (parent ? 1 : .33), min, max);
  }
  return { ...point, type, mass, age: 0, seed: Math.floor(random() * 0xffffffff), genes,
    generation: Math.max(parent?.generation ?? 0, pollen?.generation ?? 0) + 1,
    parent: parent?.seed ?? null, pollenParent: pollen?.seed ?? null };
}

export function releasePlantCells(pond, point, random = Math.random, count = 6, parent) {
  if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y) ||
      point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return 0;
  let added = 0;
  for (let i = 0; i < count * 4 && added < count && pond.algae.length < MAX_POND_ALGAE; i++) {
    const angle = random() * TAU;
    const distance = .087 * Math.sqrt(random());
    const candidate = {
      x: clamp(point.x + Math.cos(angle) * distance, .025, .975),
      y: clamp(point.y + Math.sin(angle) * distance, .03, .97),
    };
    if (pond.algae.some((patch) => Math.hypot(patch.x - candidate.x, patch.y - candidate.y) < .041)) continue;
    const patch = { ...plantPatch(candidate, .075, random, parent, 'algae', null, pond.algaeDesign), maturity: 0 };
    pond.algae.push(patch);
    rememberLineage(pond.lineage, plantRecord(patch, pond.id));
    added++;
  }
  return added;
}

export function pondPlantStage(patch) {
  return patch.maturity < ALGAE_MATURITY ? 'cell' : 'algae';
}

export function shoreAdaptation(pond) {
  return pond.rooted ? 1 : clamp((pond.shoreAdaptation ?? 0) / SHORE_ADAPTATION_TIME, 0, 1);
}

function growPlant(patch, rate) {
  patch.mass = Math.min(1, patch.mass + rate * (1.15 - patch.mass));
}

const algaeLifespan = (patch) => 54 + patch.genes.moisture * 19 + patch.genes.width * 5;

function stepPondAlgae(pond, growthRate, dt, random) {
  const spores = [];
  const rate = dt * growthRate;
  let decayed = false;
  for (const patch of pond.algae) {
    patch.age += dt;
    if (patch.age > algaeLifespan(patch)) {
      const loss = Math.min(patch.mass, dt * .104);
      patch.mass -= loss;
      pond.nutrients += loss * .038 * (1 - pond.nutrients);
      if (patch.mass <= .048) decayed = true;
      continue;
    }
    const development = rate * patch.genes.growth * (.89 + patch.genes.moisture * .15);
    patch.maturity = Math.min(ALGAE_MATURITY, patch.maturity + development);
    growPlant(patch, .29 * development);
    if (patch.maturity >= ALGAE_MATURITY && patch.mass > .72 &&
        pond.algae.length < MAX_POND_ALGAE && random() < .058 * rate) spores.push(patch);
  }
  if (decayed) pond.algae = pond.algae.filter((patch) => patch.mass > .048);
  for (const patch of spores) releasePlantCells(pond, patch, random, 1, patch);
}

function oceanDrift(point, min, max, random) {
  const angle = random() * TAU;
  const distance = min + random() * (max - min);
  return {
    x: wrap(point.x + Math.cos(angle) * distance / Math.max(.4, Math.sin(point.y * Math.PI))),
    y: clamp(point.y + Math.sin(angle) * distance * 1.4, .015, .985),
  };
}

function seedOceanAlgae(planet, point, parent, random, pondId) {
  if (planet.oceanAlgae.length >= MAX_OCEAN_ALGAE || basinWaterAt(planet, point.x, point.y) < .28 ||
      planet.oceanAlgae.some((patch) => landDistance(patch, point) < .021)) return false;
  const patch = { ...plantPatch(point, .12, random, parent, 'algae'), maturity: 0 };
  if (pondId) {
    patch.algaeParent = { kind: 'algae', id: parent.seed, pondId };
    patch.parent = null;
  }
  planet.oceanAlgae.push(patch);
  rememberLineage(planet.plantLineage, plantRecord(patch));
  return true;
}

function stepOceanAlgae(planet, dt, random) {
  const sprouts = [];
  for (const patch of planet.oceanAlgae) {
    if (basinWaterAt(planet, patch.x, patch.y) < .14) {
      patch.mass = 0;
      continue;
    }
    patch.age += dt;
    if (patch.age > algaeLifespan(patch)) {
      patch.mass -= dt * .09;
      continue;
    }
    const local = habitatAt(planet, patch, true);
    const growth = dt * growingConditions(planet.weather, local.temperature) * (.74 + local.light * .26) * patch.genes.growth *
      (1 - iceCover(planet, patch.y) * .18);
    patch.maturity = Math.min(ALGAE_MATURITY, patch.maturity + growth);
    growPlant(patch, growth * .26);
    if (planet.oceanAlgae.length < MAX_OCEAN_ALGAE && patch.mass > .72 && random() < growth * .035) sprouts.push(patch);
  }
  if (planet.oceanAlgae.length) planet.oceanAlgae = planet.oceanAlgae.filter((patch) => patch.mass > .048);
  for (const algae of sprouts) seedOceanAlgae(planet, oceanDrift(algae, .02, .07, random), algae, random);

  planet.oceanSporeClock += dt;
  if (planet.oceanSporeClock < 1.5) return;
  planet.oceanSporeClock -= 1.5;
  if (planet.oceanAlgae.length >= MAX_OCEAN_ALGAE) return;
  for (const pond of planet.ponds) {
    const source = pond.algae.find((patch) => patch.mass > .67 && patch.maturity >= ALGAE_MATURITY);
    if (!source) continue;
    for (let attempt = 0; attempt < 8; attempt++) {
      const spot = oceanDrift(pond, .054, .19, random);
      if (seedOceanAlgae(planet, spot, source, random, pond.id)) break;
    }
  }
}

export function spawnCells(pond, genome, count, position, random = Math.random) {
  if (!Number.isFinite(count) || (position && (!Number.isFinite(position.x) || !Number.isFinite(position.y) ||
      position.x > 1 || position.x < 0 || position.y < 0 || position.y > 1))) return 0;
  const amount = clamp(Math.floor(count), 0, MAX_CREATURES - pond.creatures.length);
  for (let i = 0; i < amount; i++) {
    const y = clamp(position ? position.y + (random() - .5) * .105 : .1 + random() * .8, .034, .966);
    const x = clamp(position ? position.x + (random() - .5) * .105 : .1 + random() * .8, .028, .972);
    const cell = makeCreature(genome, x, y, random);
    cell.anatomy.thermal = pond.founderThermal ?? FOUNDER_ANATOMY.thermal;
    cell.id = pond.nextId++;
    cell.energy = genome.diet === 'hunter' ? 1.13 : 1.2 + random() * .2;
    pond.creatures.push(cell);
    rememberLineage(pond.lineage, creatureRecord(cell, pond.id));
  }
  if (amount && !pond.discovered.includes(0)) pond.discovered.push(0);
  return amount;
}

function makeCreature(genome, x, y, random) {
  const heading = random() * TAU;
  return {
    x, y, px: x, py: y, heading, previousHeading: heading, age: 0,
    energy: .65, cooldown: 1, attackCooldown: 0, stride: 0, pstride: 0, gen: 1, stage: 0,
    anatomy: { ...FOUNDER_ANATOMY, length: { round: .30, oval: .55, spiky: .42, ribbon: .82 }[genome.shape] ?? .42 },
    genome: { ...DEFAULT_GENOME, ...genome }, parent: null, coParent: null, exit: null,
  };
}

export function limbCount(anatomy) {
  if (anatomy.legs < .41) return 0;
  if (anatomy.legs < .64) return 2;
  return anatomy.legs < .89 ? 4 : 6;
}

export function creatureMaturity(cell) {
  return clamp(cell.age / (cell.stage >= 4 ? 2.65 : 1.60), 0, 1);
}

export function creatureSize(cell) {
  return cell.genome.size * (.61 + creatureMaturity(cell) * .39);
}

export function stageFor(anatomy) {
  if (anatomy.tissue >= .24 && anatomy.air >= .43 && limbCount(anatomy)) {
    return anatomy.legs > .85 && anatomy.air > .66 ? 6 : anatomy.air > .64 || anatomy.legs > .60 ? 5 : 4;
  }
  if (anatomy.tissue < .26) return 0;
  if (anatomy.tissue >= .36 && anatomy.fins >= .51) return 3;
  return anatomy.fins > .26 || anatomy.tail > .43 ? 2 : 1;
}

function inheritTraits(child, parent, mate, random) {
  child.anatomy = { ...parent.anatomy };
  if (!mate) return;
  for (const trait of Object.keys(child.anatomy)) {
    if (random() < .5) child.anatomy[trait] = mate.anatomy[trait];
  }
  for (const trait of Object.keys(child.genome)) {
    if (trait !== 'strain' && random() < .5) child.genome[trait] = mate.genome[trait];
  }
}

function mutateOption(options, current, random) {
  const alternatives = Object.keys(options).filter((option) => option !== current);
  return alternatives[Math.floor(random() * alternatives.length)];
}

function shiftedPigment(color, amount, random) {
  const channels = rgb(color).map((channel) => clamp(channel + Math.round((random() * 2 - 1) * amount), 42, 255));
  return rgbHex(channels);
}

function mutate(child, planet, random) {
  const genome = child.genome;
  const probability = genome.mutation;
  if (random() < probability) {
    const largeChange = random() < .18 ? 1.75 : 1;
    for (const [trait, amount] of Object.entries(ANATOMY_MUTATIONS)) {
      if (random() < .51) child.anatomy[trait] = clamp(child.anatomy[trait] + (random() * 2 - 1) * amount * largeChange, 0, 1.22);
    }
    genome.speed = clamp(genome.speed + (random() * 2 - 1) * .24, .46, 1.95);
    const sizeRoll = random();
    const chance = planetSize(planet).sizeGain;
    const sizeChange = sizeRoll < chance ? .27 * (1 - sizeRoll / chance) : -.24 * (sizeRoll - chance) / (1 - chance);
    genome.size = clamp(genome.size + sizeChange, .65, 1.85);
    genome.senses = clamp(genome.senses + (random() * 2 - 1) * .20, .50, 1.95);
    genome.metabolism = clamp(genome.metabolism + (random() * 2 - 1) * .16, .55, 1.55);
    if (random() < .28) genome.caution = clamp(genome.caution + (random() * 2 - 1) * .19, 0, 1);
    if (random() < .26) genome.sociability = clamp(genome.sociability + (random() * 2 - 1) * .24, 0, 1);
    if (random() < .12) {
      const diets = Object.keys(DIETS);
      genome.diet = diets[Math.floor(random() * diets.length)];
    }
    if (random() < .14) {
      const activity = Object.keys(ACTIVITY);
      genome.activity = activity[Math.floor(random() * activity.length)];
    }
    const appearance = random();
    if (appearance < .37) genome.color = shiftedPigment(genome.color, 52, random);
    if (appearance < .046) genome.pattern = mutateOption(PATTERNS, genome.pattern, random);
    else if (appearance < .080) genome.motion = mutateOption(MOTION, genome.motion, random);
    else if (appearance < .114) genome.shape = mutateOption(BODY_SHAPES, genome.shape, random);
    else if (appearance < .157) genome.nucleus = shiftedPigment(genome.nucleus, 42, random);
  }
  child.stage = stageFor(child.anatomy);
}

function offspring(pond, parent, random, planet, populations, mate = null) {
  const child = makeCreature(parent.genome, parent.x, parent.y, random);
  child.gen = Math.max(parent.gen, mate?.gen ?? 0) + 1;
  child.parent = parent.id;
  if (mate) child.coParent = { id: mate.id, pondId: mate.pondId };
  inheritTraits(child, parent, mate, random);
  mutate(child, planet, random);
  if (populations) {
    const species = speciesTraits(child);
    if (child.stage < 4 || !reserveSpecies(populations, species)) {
      parent.cooldown = .85;
      return null;
    }
    child.pondId = pond.id;
    child.species = species.id;
  }
  child.id = pond.nextId++;
  parent.energy -= mate ? .34 : .62;
  parent.cooldown = 2.45;
  if (mate) {
    mate.energy -= .34;
    mate.cooldown = 2.45;
    mate.behavior = 'Laid an egg';
  }
  if (!populations) recordBirth(pond, child);
  return child;
}

function recordBirth(pond, child) {
  pond.births++;
  if (!pond.discovered.includes(child.stage)) pond.discovered.push(child.stage);
  rememberLineage(pond.lineage, creatureRecord(child, pond.id));
}

function rememberLineage(log, record) {
  log.push(record);
}

function creatureParents(cell, pondId) {
  const parents = [];
  if (cell.parent !== null && cell.parent !== undefined) parents.push({ kind: 'animal', id: cell.parent, pondId });
  if (cell.coParent) parents.push({ kind: 'animal', id: cell.coParent.id, pondId: cell.coParent.pondId });
  return parents;
}

function creatureRecord(cell, pondId) {
  const { genome, anatomy } = cell;
  return {
    kind: 'animal', id: cell.id, pondId, parents: creatureParents(cell, pondId), generation: cell.gen,
    name: cell.stage >= 4 ? speciesTraits(cell).name : STAGES[cell.stage].name,
    color: genome.color, strain: genome.strain,
    traits: {
      diet: genome.diet, activity: genome.activity, size: genome.size, speed: genome.speed, senses: genome.senses, caution: genome.caution,
      sociability: genome.sociability, pattern: genome.pattern, motion: genome.motion, shape: genome.shape,
      legs: anatomy.legs, fins: anatomy.fins, armor: anatomy.armor, thermal: anatomy.thermal,
    },
  };
}

function plantParents(patch, pondId) {
  const parents = [];
  if (patch.algaeParent) parents.push(patch.algaeParent);
  else if (patch.parent !== null) parents.push({ kind: patch.type, id: patch.parent, pondId });
  if (patch.pollenParent !== null) parents.push({ kind: patch.type, id: patch.pollenParent, pondId });
  return parents;
}

function plantRecord(patch, pondId) {
  const { genes, type } = patch;
  return {
    kind: type, id: patch.seed, pondId, parents: plantParents(patch, pondId), generation: patch.generation,
    name: type === 'algae' ? 'Algae' : 'Grass', strain: '',
    traits: { growth: genes.growth, height: genes.height, width: genes.width, curl: genes.curl,
      moisture: genes.moisture, pigment: genes.pigment },
  };
}

const lineageKey = ({ kind, id, pondId }) => `${kind}/${pondId ?? ''}/${id}`;

function trimLineages(planet) {
  const logs = [planet.plantLineage, ...planet.ponds.map((pond) => pond.lineage)];
  if (!logs.some((log) => log.length > LINEAGE_TRIM_THRESHOLD)) return;
  const records = new Map();
  for (const log of logs) for (const record of log) records.set(lineageKey(record), record);
  const priority = new Map();
  function keep(references, rank, trace = false) {
    const ancestors = [];
    for (const reference of references) {
      const key = lineageKey(reference);
      if (priority.has(key)) continue;
      priority.set(key, rank);
      if (trace) {
        const record = records.get(key);
        if (record) ancestors.push(...record.parents);
      }
    }
    return ancestors;
  }
  const landParents = [...planet.walkers, ...planet.eggs.map((egg) => egg.child)]
    .flatMap((cell) => creatureParents(cell, cell.pondId));
  keep(keep(keep(landParents, 4, true), 3, true), 2);
  for (const pond of planet.ponds) {
    keep(pond.creatures.flatMap((cell) => creatureParents(cell, pond.id)), 1);
    keep(pond.algae.flatMap((patch) => plantParents(patch, pond.id)), 1);
  }
  keep(planet.plants.flatMap((patch) => plantParents(patch)), 1);
  keep(planet.oceanAlgae.flatMap((patch) => plantParents(patch)), 1);
  for (const log of logs) {
    if (log.length <= LINEAGE_RECORD_LIMIT) continue;
    const recent = [...new Set(log.map(lineageKey).reverse())];
    recent.sort((a, b) => (priority.get(b) ?? 0) - (priority.get(a) ?? 0));
    log.splice(0, log.length, ...recent.slice(0, LINEAGE_RECORD_LIMIT).reverse().map((key) => records.get(key)));
  }
}

export function findLineage(planet, reference) {
  const { kind, id, pondId } = reference;
  const pond = planet.ponds.find((item) => item.id === pondId);
  if (kind === 'animal') {
    const inPond = pond?.creatures.find((cell) => cell.id === id);
    if (inPond) return { ...creatureRecord(inPond, pondId), state: 'In the pond' };
    const onLand = planet.walkers.find((cell) => cell.pondId === pondId && cell.id === id);
    if (onLand) return { ...creatureRecord(onLand, pondId), state: 'On land' };
    const egg = planet.eggs.find((item) => item.child.pondId === pondId && item.child.id === id);
    if (egg) return { ...creatureRecord(egg.child, pondId), state: 'Incubating' };
  } else {
    const plants = kind === 'grass' ? planet.plants : pondId ? pond?.algae : planet.oceanAlgae;
    const patch = plants?.find((item) => item.seed === id);
    if (patch) {
      const state = kind === 'grass' ? 'On land' : pondPlantStage(patch) === 'cell' ? 'Plant cell' : pondId ? 'In the pond' : 'In the ocean';
      return { ...plantRecord(patch, pondId), state };
    }
  }
  const archive = kind === 'grass' || !pondId ? planet.plantLineage : pond?.lineage;
  const record = archive?.findLast((item) => item.kind === kind && item.id === id);
  return record ? { ...record, state: 'Past generation' } : null;
}

function steer(cell, angle, rate, dt) {
  const difference = angle - cell.heading;
  const turn = Math.atan2(Math.sin(difference), Math.cos(difference));
  cell.heading += clamp(turn, -rate * dt, rate * dt);
  return .90 + .10 * Math.cos(turn);
}

function wander(cell, dt, random) {
  const drift = Math.sin(cell.age * 1.3 + (cell.id % 997) * .78);
  cell.heading += dt * (drift * .85 + (random() - .5) * 1.9);
}

function moveCreature(cell, target, dt, random, fleeing, activity) {
  cell.px = cell.x;
  cell.py = cell.y;
  cell.pstride = cell.stride;
  cell.previousHeading = cell.heading;
  let turningPace = 1;
  if (target) {
    const angle = Math.atan2(target.y - cell.y, target.x - cell.x) + (fleeing ? Math.PI : 0);
    const steering = cell.genome.motion === 'cilia' ? 4.5 : cell.genome.motion === 'glide' ? 2.4 : 3.5;
    turningPace = steer(cell, angle, steering, dt);
  } else {
    wander(cell, dt, random);
  }
  const pace = (.029 + cell.anatomy.fins * .043 + cell.anatomy.tail * .022) * cell.genome.speed *
    dt * (fleeing ? 1.25 : activity) * turningPace;
  const x = cell.x + Math.cos(cell.heading) * pace;
  const y = cell.y + Math.sin(cell.heading) * pace;
  if (x < .028 || x > .972) cell.heading = Math.PI - cell.heading;
  if (y < .028 || y > .972) cell.heading = -cell.heading;
  cell.x = clamp(x, .028, .972);
  cell.y = clamp(y, .028, .972);
  cell.stride += Math.hypot(cell.x - cell.px, cell.y - cell.py) * 290;
}

function trailToShore(cell) {
  const angle = Math.atan2(cell.y - .5, cell.x - .5);
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const distance = .49 / Math.max(Math.abs(x), Math.abs(y));
  return { x: .5 + x * distance, y: .5 + y * distance, angle };
}

function stepAge(cell, dt) {
  cell.age += dt;
  cell.cooldown -= dt;
  cell.attackCooldown = Math.max(0, (cell.attackCooldown ?? 0) - dt);
  if (cell.age > 12 + cell.gen % 6) cell.energy -= dt * (.27 + (cell.age - 12) * .055);
}

function leaveRemains(habitat, cell) {
  const mass = (.17 + cell.genome.size * .30) * (cell.killed ? .64 : 1);
  habitat.remains.push({ x: cell.x, y: cell.y, mass });
  if (habitat.remains.length > REMAINS_LIMIT) {
    const excess = habitat.remains.shift();
    habitat.nutrients += excess.mass * .035 * (1 - habitat.nutrients);
  }
}

function recycleRemains(habitat, dt, rate) {
  habitat.nutrients *= Math.max(0, 1 - dt * .055);
  let remaining = 0;
  let decomposed = 0;
  for (const remains of habitat.remains) {
    const decay = Math.min(remains.mass, dt * rate);
    remains.mass -= decay;
    decomposed += decay;
    if (remains.mass > .025) habitat.remains[remaining++] = remains;
  }
  habitat.remains.length = remaining;
  habitat.nutrients += Math.min(1, decomposed * .07) * (1 - habitat.nutrients);
}

const eatsPlants = (diet) => diet === 'grazer' || diet === 'omnivore';
const catchesPrey = (diet) => diet === 'hunter' || diet === 'omnivore';
const scavenges = (diet) => diet === 'scavenger' || diet === 'omnivore';

function groupPosition(cell, peer, surfaceScale) {
  const dx = surfaceScale ? longitudeDistance(peer.x, cell.x) : cell.x - peer.x;
  const dy = cell.y - peer.y;
  const distance = Math.hypot(dx, dy);
  const scale = surfaceScale ?? 1;
  const spacing = (.031 + (creatureSize(cell) + creatureSize(peer)) * .009) / scale;
  const nearby = distance < spacing;
  const direction = nearby ? (distance > .001 / scale ? Math.atan2(dy, dx) : cell.heading + Math.PI * .5) : peer.heading;
  const anchor = nearby ? cell : peer;
  const x = anchor.x + Math.cos(direction) * .047 / scale;
  const y = anchor.y + Math.sin(direction) * .047 / scale;
  return { x: surfaceScale ? wrap(x) : clamp(x, .03, .97), y: clamp(y, .03, .97) };
}

export function stepPond(pond, weather, dt, random = Math.random, planet, populations) {
  pond.time += dt;
  const local = planet ? habitatAt(planet, pond, true) : { temperature: WEATHER[weather].temperature, light: .55 };
  const { temperature, light } = local;
  recycleRemains(pond, dt, .068 + Math.max(0, temperature) * .0012);
  const growthRate = growingConditions(weather, temperature) * (1 + pond.nutrients * .15) * (1 - (planet ? iceCover(planet, pond.y) * .16 : 0));
  if (pond.algae.length) {
    stepPondAlgae(pond, growthRate, dt, random);
    if (planet && (!pond.rooted || shoreNeedsPlants(planet, pond, dt))) establishPlants(planet, pond, growthRate, dt, random);
  }
  if (pond.food.length < 104 && random() < dt * 14 * growthRate / 4) replenish(pond, 4, random);
  const creatures = pond.creatures;
  if (!creatures.length && planet) return;
  const hunters = creatures.filter((cell) => cell.genome.diet === 'hunter');
  const animalGrid = spatialBuckets(creatures);
  const algaeGrid = spatialBuckets(pond.algae);
  const remainsGrid = spatialBuckets(pond.remains);
  const foodGrid = spatialBuckets(pond.food);
  const babies = [];
  let emigrated;
  let remaining = pond.creatures.length;

  for (let index = 0; index < creatures.length; index++) {
    const cell = creatures[index];
    if (cell.energy <= 0) continue;
    const { diet } = cell.genome;
    const activity = activityLevel(cell.genome.activity, light);
    stepAge(cell, dt);
    const anatomy = cell.anatomy;
    const sense = cell.genome.senses * (.88 + anatomy.eyes * .37) * (.68 + activity * .32);
    const coldOrHeat = temperatureStress(anatomy, temperature);
    cell.energy -= dt * cell.genome.metabolism * (.86 + activity * .14) *
      (.059 + anatomy.armor * .018 + (diet === 'hunter' ? .024 : 0) + coldOrHeat * .013) * (.89 + creatureSize(cell) * .11);
    if (diet === 'grazer') cell.energy += dt * .15 * growthRate;
    if (planet && cell.stage >= 4 && cell.age > 1 && !cell.exit && random() < dt * (.36 + anatomy.air * .85)) {
      cell.exit = trailToShore(cell);
    }
    const species = cell.exit && planet ? speciesTraits(cell) : undefined;
    const canClimb = species && canReserveSpecies(populations, species.id);
    let prey;
    const hunger = diet === 'hunter' ? 1.17 : .81;
    if (!canClimb && catchesPrey(diet) && cell.energy < hunger) {
      const radius = .23 * sense;
      const limit = radius * radius;
      prey = nearestInPond(cell, creatures, radius, (other, distance) =>
        other.id !== cell.id && other.energy > 0 && other.genome.diet !== 'hunter' &&
        other.genome.size < cell.genome.size * 1.45 && canSpot(planet, other, distance, limit, light, true), animalGrid);
    }
    const threat = !canClimb && diet !== 'hunter' ? nearestInPond(cell, hunters, (.024 + cell.genome.caution * .032) * sense,
      (other) => other.energy > 0 && other.energy < 1.2) : undefined;
    const foraging = !canClimb && !prey && !threat && cell.energy < 1.7;
    const greenery = foraging && eatsPlants(diet)
      ? nearestInPond(cell, pond.algae, .23 * sense, (patch) => patch.maturity >= ALGAE_MATURITY && patch.mass > .30, algaeGrid)
      : undefined;
    const remains = foraging && !greenery && scavenges(diet)
      ? nearestInPond(cell, pond.remains, .24 * sense, (item) => item.mass > .07, remainsGrid)
      : undefined;
    const food = foraging && !greenery && !remains
      ? nearestInPond(cell, pond.food, .18 * sense, (item) => item.value > 0, foodGrid)
      : undefined;
    const peer = !canClimb && !prey && !threat && !greenery && !remains && !food && cell.stage >= 2 && cell.genome.sociability > .57
      ? nearestInPond(cell, creatures, .17 * sense, (other) => other !== cell && other.stage === cell.stage &&
        other.genome.diet === diet && other.energy > .28 && other.genome.sociability > .43, animalGrid) : undefined;
    const group = peer && groupPosition(cell, peer);
    cell.behavior = canClimb ? 'Swimming toward shore' : threat ? 'Evading a hunter' : prey ? 'Chasing prey' :
      greenery ? 'Grazing' : remains ? 'Scavenging' : food ? 'Seeking food' : group ? 'Swimming with group' : activity < .72 ? 'Resting' : 'Swimming';
    moveCreature(cell, canClimb ? cell.exit : threat ?? prey ?? greenery ?? remains ?? food ?? group,
      dt, random, Boolean(threat), canClimb ? 1 : activity);
    moveInPondGrid(animalGrid, index, cell);
    if (canClimb && cell.energy > 0 && Math.hypot(cell.x - cell.exit.x, cell.y - cell.exit.y) < .046) {
      const point = climbPoint(pond, cell.exit.angle, .78);
      reserveSpecies(populations, species);
      planet.walkers.push({
        ...cell, ...point, px: point.x, py: point.y, pondId: pond.id, energy: Math.max(.76, cell.energy),
        species: species.id, heading: cell.exit.angle, climb: { angle: cell.exit.angle, progress: 0 },
        exit: null, behavior: 'Climbing',
      });
      pond.climbed++;
      (emigrated ??= new Set()).add(cell);
      cell.energy = 0;
      remaining--;
      continue;
    }
    if (food && Math.hypot(food.x - cell.x, food.y - cell.y) < .026 + cell.stage * .001) {
      cell.energy += food.value * (diet === 'hunter' ? .6 : 1);
      food.value = 0;
    }
    if (greenery && cell.attackCooldown === 0 && Math.hypot(greenery.x - cell.x, greenery.y - cell.y) < .035 + cell.stage * .002) {
      const bite = Math.min(.42, greenery.mass * .53);
      greenery.mass = Math.max(.12, greenery.mass - bite * .64);
      cell.energy += bite;
      cell.attackCooldown = .49;
    }
    if (remains && cell.attackCooldown === 0 && Math.hypot(remains.x - cell.x, remains.y - cell.y) < .044) {
      const bite = Math.min(.34, remains.mass);
      remains.mass -= bite;
      cell.energy += bite * (diet === 'scavenger' ? 1.45 : .94);
      cell.attackCooldown = .56;
    }
    if (prey && cell.attackCooldown === 0 && Math.hypot(prey.x - cell.x, prey.y - cell.y) < .02 + cell.stage * .003) {
      cell.attackCooldown = .48;
      prey.energy -= (.44 + anatomy.tissue * .23) * (1 - prey.anatomy.armor * .32);
      cell.energy += .10;
      if (prey.energy <= 0) {
        prey.killed = true;
        cell.energy += .47;
        pond.hunts++;
      }
    }
    if (cell.age < 1.3 || cell.cooldown > 0 || cell.energy < 1.28) continue;
    if (babies.length + remaining >= MAX_CREATURES) {
      // At carrying capacity, surplus energy still funds the next generation.
      // Retire an older member of this lineage so a full pond can keep evolving.
      const elder = pond.creatures.find((other) => other.id !== cell.id && other.age > 5 &&
        other.energy > 0 && other.genome.diet === diet && other.gen < cell.gen + 1);
      if (!elder) continue;
      elder.energy = 0;
      remaining--;
    }
    babies.push(offspring(pond, cell, random, planet));
  }

  pond.food = pond.food.filter((food) => food.value > 0);
  pond.creatures = pond.creatures.filter((cell) => {
    if (cell.energy > 0) return true;
    if (!emigrated?.has(cell)) leaveRemains(pond, cell);
    rememberLineage(pond.lineage, creatureRecord(cell, pond.id));
    return false;
  }).concat(babies).slice(0, MAX_CREATURES);
  if (!planet && pond.lineage.length > LINEAGE_RECORD_LIMIT) pond.lineage.splice(0, pond.lineage.length - LINEAGE_RECORD_LIMIT);
}

export function landPopulation(planet, { includeEggs = false } = {}) {
  const groups = new Map();
  for (const cell of includeEggs ? [...planet.walkers, ...planet.eggs.map((egg) => egg.child)] : planet.walkers) {
    if (cell.energy <= 0) continue;
    const group = groups.get(cell.species);
    if (group) group.count++;
    else groups.set(cell.species, { ...speciesTraits(cell), count: 1 });
  }
  return groups;
}

function canReserveSpecies(groups, id) {
  const group = groups.get(id);
  return group ? group.count < SPECIES_CAPACITY : groups.size < SPECIES_LIMIT;
}

function reserveSpecies(groups, species) {
  if (!canReserveSpecies(groups, species.id)) return false;
  const group = groups.get(species.id);
  if (group) group.count++;
  else groups.set(species.id, { ...species, count: 1 });
  return true;
}

export function speciesTraits(cell) {
  const { armor, length, fins } = cell.anatomy;
  const build = armor > .66 ? 'Shellback' : length > .67 ? 'Longbody' : fins > .65 ? 'Fanback' : 'Roundbody';
  const legs = limbCount(cell.anatomy);
  const gait = { 0: 'swimmer', 2: 'hopper', 4: 'walker', 6: 'crawler' }[legs];
  const diet = cell.genome.diet;
  return { id: build.toLowerCase() + '-' + legs + '-' + diet, name: build + ' ' + gait, diet, color: cell.genome.color };
}

function landDistance(from, to) {
  const dx = longitudeDistance(from.x, to.x) * Math.max(.4, Math.sin(from.y * Math.PI));
  return Math.hypot(dx, (to.y - from.y) * .65);
}

export function dryGround(planet, point) {
  return basinWaterAt(planet, point.x, point.y) < .14 && !planet.ponds.some((pond) => pondDistance(pond, point.x, point.y) < 1.02);
}

export function grassCovers(planet, x, y) {
  return Boolean(planet.grassCover?.[terrainIndex(x, y)]) && dryGround(planet, { x, y });
}

function dryTiles(planet) {
  const previous = dryTileCache.get(planet);
  if (previous?.revision === planet.revision) return previous.tiles;
  const tiles = new Uint8Array(TERRAIN_W * TERRAIN_H);
  for (let index = 0; index < tiles.length; index++) {
    const x = (index % TERRAIN_W) / (TERRAIN_W - 1);
    const y = Math.floor(index / TERRAIN_W) / (TERRAIN_H - 1);
    tiles[index] = Number(dryGround(planet, { x, y }));
  }
  dryTileCache.set(planet, { revision: planet.revision, tiles });
  return tiles;
}

export function landGrassPercentage(planet) {
  if (!planet.grassCover) return 0;
  let ground = 0;
  let covered = 0;
  const dry = dryTiles(planet);
  for (let index = 0; index < planet.grassCover.length; index++) {
    if (!dry[index]) continue;
    ground++;
    covered += planet.grassCover[index];
  }
  return ground ? Math.round(covered * 100 / ground) : 0;
}

function initializeCover(planet, point) {
  planet.grassCover ??= Array(TERRAIN_W * TERRAIN_H).fill(0);
  const index = terrainIndex(point.x, point.y);
  if (!planet.grassCover[index]) {
    planet.grassCover[index] = 1;
    planet.coverRevision++;
  }
}

function stepGrassCover(planet, dt) {
  if (!planet.grassCover) {
    for (const plant of planet.plants) {
      if (dryGround(planet, plant)) initializeCover(planet, plant);
    }
    return;
  }
  planet.coverClock += dt * WEATHER[planet.weather].growth;
  if (planet.coverClock < GRASS_SPREAD_INTERVAL) return;
  planet.coverClock -= GRASS_SPREAD_INTERVAL;
  planet.coverGrowth++;
  const growthSeed = planet.seed ^ Math.imul(planet.coverGrowth, 2549);
  const existing = planet.grassCover;
  const next = existing.slice();
  const dry = dryTiles(planet);
  let changed = false;
  for (let row = 0; row < TERRAIN_H; row++) {
    const offset = row * TERRAIN_W;
    for (let col = 0; col < TERRAIN_W; col++) {
      const index = offset + col;
      const covered = existing[index];
      if (covered && !dry[index]) {
        next[index] = 0;
        changed = true;
      }
      if (covered || !dry[index]) continue;
      const west = offset + (col + TERRAIN_W - 1) % TERRAIN_W;
      const east = offset + (col + 1) % TERRAIN_W;
      const neighbors = existing[west] + existing[east] + (existing[index - TERRAIN_W] ?? 0) + (existing[index + TERRAIN_W] ?? 0);
      const corners = (existing[west - TERRAIN_W] ?? 0) + (existing[east - TERRAIN_W] ?? 0) +
        (existing[west + TERRAIN_W] ?? 0) + (existing[east + TERRAIN_W] ?? 0);
      if (neighbors + corners === 0) continue;
      const wind = terrainHash(col, row, growthSeed);
      if (wind >= -.45 + neighbors * .32 + corners * .17) continue;
      next[index] = 1;
      changed = true;
    }
  }
  if (changed) {
    planet.grassCover = next;
    planet.coverRevision++;
  }
}

export function seedGrass(planet, point, { count = 8, spread = .028, parent, pollen, genes, algaePondId } = {}, random = Math.random) {
  if (!dryGround(planet, point)) return 0;
  const surfaceScale = planetSize(planet).surfaceScale;
  let added = 0;
  for (let i = 0; i < count * 3 && added < count && planet.plants.length < MAX_PLANTS; i++) {
    const angle = random() * TAU;
    const distance = spread * Math.sqrt(random()) / surfaceScale;
    const x = wrap(point.x + Math.cos(angle) * distance / Math.max(.4, Math.sin(point.y * Math.PI)));
    const y = clamp(point.y + Math.sin(angle) * distance * 1.55, .01, .99);
    const candidate = { x, y };
    if (!dryGround(planet, candidate) || planet.plants.some((plant) => landDistance(plant, candidate) * surfaceScale < .012)) continue;
    const patch = plantPatch(candidate, .35 + random() * .23, random, parent, 'grass', pollen, genes);
    if (algaePondId && parent?.type === 'algae') {
      patch.algaeParent = { kind: 'algae', id: parent.seed, pondId: algaePondId };
      patch.parent = null;
    }
    planet.plants.push(patch);
    rememberLineage(planet.plantLineage, plantRecord(patch));
    initializeCover(planet, candidate);
    added++;
  }
  return added;
}

export function grassSeedSource(planet) {
  return planet.plants.find((plant) => plant.mass >= .52 && dryGround(planet, plant));
}

function establishPlants(planet, pond, growthRate, dt, random) {
  const colonies = pond.algae.filter((patch) => patch.maturity >= ALGAE_MATURITY && patch.mass >= .62);
  if (!colonies.length) return;
  const strongest = colonies.reduce((best, patch) => patch.mass * patch.genes.growth > best.mass * best.genes.growth ? patch : best);
  pond.shoreAdaptation = Math.min(SHORE_ADAPTATION_TIME,
    pond.shoreAdaptation + dt * growthRate * strongest.genes.growth);
  if (shoreAdaptation(pond) < 1) return;
  let seeded = 0;
  for (let i = 0; i < 5; i++) {
    const nearby = climbPoint(pond, i * TAU / 5, 1.7);
    seeded += seedGrass(planet, nearby, { count: 3, spread: .025, parent: strongest, algaePondId: pond.id }, random);
  }
  if (seeded) pond.rooted = true;
  else pond.shoreAdaptation = SHORE_ADAPTATION_TIME - .6;
}

function shoreNeedsPlants(planet, pond, dt) {
  if (Math.floor(pond.time / 8) === Math.floor((pond.time - dt) / 8)) return false;
  return !planet.plants.some((plant) => landDistance(pond, plant) < .13 * pondScale(pond) && dryGround(planet, plant));
}

function stepPlants(planet, dt, random) {
  const sprouts = [];
  const neighbors = plantGrid(planet.plants);
  const surfaceScale = planetSize(planet).surfaceScale;
  for (const plant of planet.plants) {
    plant.age += dt;
    if (!dryGround(planet, plant)) {
      plant.mass -= dt * .42;
      continue;
    }
    if (plant.age > 75 + 37 * plant.genes.moisture) {
      plant.mass -= dt * .07;
      if (plant.mass <= .04 && grassCovers(planet, plant.x, plant.y)) {
        delete plant.algaeParent;
        Object.assign(plant, plantPatch({ x: plant.x, y: plant.y }, .23, random, plant, 'grass'));
        rememberLineage(planet.plantLineage, plantRecord(plant));
      }
      continue;
    }
    const local = habitatAt(planet, plant);
    const climate = growingConditions(planet.weather, local.temperature) * (1 + planet.nutrients * .21);
    const height = plant.genes.height * plant.mass;
    if (plant.shaded === undefined || Math.floor(plant.age) !== Math.floor(plant.age - dt)) {
      plant.shaded = Boolean(landTarget(plant, planet.plants, .029 / surfaceScale,
        (neighbor) => neighbor !== plant && neighbor.genes.height * neighbor.mass > height * 1.22, neighbors));
    }
    const fit = (1 - Math.abs(local.moisture - plant.genes.moisture) * .91) * (.71 + local.light * .29) * (plant.shaded ? .68 : 1);
    growPlant(plant, dt * .13 * climate * plant.genes.growth * fit);
    if (plant.mass > .78 && planet.plants.length < MAX_PLANTS && random() < dt * .023 * climate * fit) sprouts.push(plant);
  }
  if (planet.plants.some((plant) => plant.mass <= .04)) planet.plants = planet.plants.filter((plant) => plant.mass > .04);
  for (const plant of sprouts) {
    const wind = planet.weather === 'storm' ? -1 : 1;
    const pollen = landTarget(plant, planet.plants, .13 / surfaceScale, (other) =>
      other !== plant && other.mass > .66 && longitudeDistance(other.x, plant.x) * wind > -.012, plantGrid(planet.plants));
    seedGrass(planet, plant, { count: 1, spread: .046 * plant.genes.spread, parent: plant, pollen }, random);
  }
}

function landTarget(cell, items, range, accepts, grid) {
  if (grid) return nearestOnPlanet(cell, items, range, accepts, grid, longitudeDistance, landTarget);
  let match;
  const longitudeScale = Math.max(.4, Math.sin(cell.y * Math.PI));
  let best = range ** 2;
  for (const item of items) {
    const dy = (item.y - cell.y) * .65;
    if (dy * dy >= best) continue;
    const dx = longitudeDistance(cell.x, item.x) * longitudeScale;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared >= best || !accepts(item, distanceSquared)) continue;
    best = distanceSquared;
    match = item;
  }
  return match;
}

function readyToBreed(cell, energy) {
  return cell.energy >= energy && creatureMaturity(cell) === 1 && cell.cooldown <= 0 && !cell.climb;
}

function layEgg(planet, pond, parent, mate, populations, random) {
  const x = mate ? wrap(parent.x + longitudeDistance(parent.x, mate.x) * .5) : parent.x;
  const y = mate ? (parent.y + mate.y) * .5 : parent.y;
  if (!dryGround(planet, { x, y })) return;
  const child = offspring(pond, parent, random, planet, populations, mate);
  if (!child) return;
  Object.assign(child, { x, y, px: x, py: y });
  planet.eggs.push({ x, y, child, progress: 0, duration: 1.50 + child.genome.size * .83 });
  parent.behavior = 'Laid an egg';
}

function parentOf(egg, cell) {
  const { child } = egg;
  return (child.pondId === cell.pondId && child.parent === cell.id) ||
    (child.coParent?.pondId === cell.pondId && child.coParent?.id === cell.id);
}

function stepEggs(planet, dt) {
  const incubating = [];
  const surfaceScale = planetSize(planet).surfaceScale;
  for (const egg of planet.eggs) {
    if (!dryGround(planet, egg)) continue;
    const local = habitatAt(planet, egg);
    const guardian = landTarget(egg, planet.walkers, .028 / surfaceScale, (cell) =>
      cell.behavior === 'Tending an egg' && cell.energy > 0 && parentOf(egg, cell));
    egg.tended = Boolean(guardian);
    egg.progress += dt * (1 - temperatureStress(egg.child.anatomy, local.temperature) * .36 + (egg.tended ? .24 : 0));
    if (egg.progress < egg.duration) {
      incubating.push(egg);
      continue;
    }
    const pond = planet.ponds.find((item) => item.id === egg.child.pondId);
    if (!pond) continue;
    egg.child.behavior = 'Newly hatched';
    planet.walkers.push(egg.child);
    recordBirth(pond, egg.child);
    planet.landBirths++;
  }
  planet.eggs = incubating;
}

function dryShoreFrom(planet, cell) {
  const longitudeScale = Math.max(.4, Math.sin(cell.y * Math.PI));
  for (const distance of [.018, .042, .072, .12, .19, .27]) {
    for (let ray = 0; ray < 12; ray++) {
      const angle = cell.heading + ray / 12 * TAU;
      const point = { x: wrap(cell.x + Math.cos(angle) * distance / longitudeScale),
        y: clamp(cell.y + Math.sin(angle) * distance * 1.55, .02, .98) };
      if (dryGround(planet, point)) return point;
    }
  }
  return null;
}

function swimOutOfFlood(planet, cell, dt) {
  const goal = cell.shoreGoal;
  if (!(cell.shoreCheck > cell.age) || (goal && !dryGround(planet, goal))) {
    cell.shoreGoal = dryShoreFrom(planet, cell);
    cell.shoreCheck = cell.age + (cell.shoreGoal ? 2.4 : .75);
  }
  cell.submerged = true;
  const longitudeScale = Math.max(.4, Math.sin(cell.y * Math.PI));
  if (cell.shoreGoal) {
    const surfaceScale = planetSize(planet).surfaceScale;
    const dx = longitudeDistance(cell.x, cell.shoreGoal.x) * longitudeScale;
    const dy = (cell.shoreGoal.y - cell.y) * .65;
    cell.heading = Math.atan2(dy, dx);
    const pace = Math.min(Math.hypot(dx, dy),
      (.011 + cell.anatomy.fins * .03 + cell.anatomy.tail * .009) * cell.genome.speed * dt / surfaceScale);
    cell.x = wrap(cell.x + Math.cos(cell.heading) * pace / longitudeScale);
    cell.y = clamp(cell.y + Math.sin(cell.heading) * pace / .65, .02, .98);
    cell.stride += pace * surfaceScale * 520;
  }
  cell.energy -= dt * (.066 - Math.min(.047, cell.anatomy.fins * .032));
  cell.behavior = 'Seeking dry ground';
}

function stepWalkers(planet, populations, dt, random) {
  const residents = landPopulation(planet);
  const grasses = plantGrid(planet.plants);
  const surfaceScale = planetSize(planet).surfaceScale;
  for (const cell of planet.walkers) {
    if (cell.energy <= 0) continue;
    const pond = planet.ponds.find((item) => item.id === cell.pondId);
    if (!pond) { cell.energy = 0; continue; }
    cell.px = cell.x;
    cell.py = cell.y;
    cell.pstride = cell.stride;
    cell.previousHeading = cell.heading;
    stepAge(cell, dt);
    if (cell.climb) {
      const { angle } = cell.climb;
      cell.climb.progress = Math.min(1, cell.climb.progress + dt * .83 / (pondScale(pond) * surfaceScale));
      Object.assign(cell, climbPoint(pond, angle, .78 + cell.climb.progress * .68));
      cell.stride += dt * 9;
      if (cell.climb.progress === 1) cell.climb = null;
      continue;
    }
    if (!dryGround(planet, cell)) {
      swimOutOfFlood(planet, cell, dt);
      continue;
    }
    if (cell.submerged) {
      cell.submerged = false;
      cell.shoreGoal = null;
      cell.shoreCheck = 0;
    }
    const { diet } = cell.genome;
    const anatomy = cell.anatomy;
    const local = habitatAt(planet, cell);
    const activity = activityLevel(cell.genome.activity, local.light);
    const growth = growingConditions(planet.weather, local.temperature);
    const senses = cell.genome.senses * (.85 + anatomy.eyes * .46) * (.68 + activity * .32) / surfaceScale;
    const threat = diet !== 'hunter' && cell.energy > .24 ? landTarget(cell, planet.walkers, (.025 + cell.genome.caution * .038) * senses,
      (other) => other.energy > 0 && other.energy < 1.15 && !other.climb && other.genome.diet === 'hunter') : undefined;
    const plant = !threat && eatsPlants(diet) && cell.energy < 1.7
      ? landTarget(cell, planet.plants, .19 * senses, (item) => item.mass > .26, grasses)
      : undefined;
    const remains = !threat && !plant && scavenges(diet) && cell.energy < 1.35
      ? landTarget(cell, planet.remains, .23 * senses, (item) => item.mass > .065)
      : undefined;
    let prey;
    if (!threat && !plant && !remains && catchesPrey(diet) && cell.energy < 1.08) {
      const radius = .22 * senses;
      const limit = radius * radius;
      prey = landTarget(cell, planet.walkers, radius, (other, distance) => other.energy > 0 && !other.climb &&
        other.genome.diet !== 'hunter' && other.species !== cell.species && canSpot(planet, other, distance, limit, local.light, false));
    }
    // Ground cover and insects bridge short gaps between meals.
    const forage = eatsPlants(diet) ? .125 : diet === 'scavenger' ? .104 : .087;
    const upkeep = (.094 + anatomy.armor * .015 + temperatureStress(anatomy, local.temperature) * .017) *
      (.87 + creatureSize(cell) * .13);
    cell.energy += dt * (forage * Math.min(1, growth) - upkeep * cell.genome.metabolism * (.86 + activity * .14));
    const sameSpecies = residents.get(cell.species)?.count ?? 0;
    const room = canReserveSpecies(populations, cell.species) || populations.size < SPECIES_LIMIT;
    const mate = !threat && room && sameSpecies > 1 && readyToBreed(cell, 1.28)
      ? landTarget(cell, planet.walkers, .21 * senses, (other) =>
        other !== cell && other.species === cell.species && readyToBreed(other, 1.04) && other.behavior !== 'Fleeing')
      : undefined;
    const nest = !threat && !mate && cell.genome.sociability > .65 && cell.energy >= 1.12
      ? landTarget(cell, planet.eggs, .12, (egg) => parentOf(egg, cell)) : undefined;
    const peer = !threat && !mate && !nest && !prey && !plant && !remains && cell.genome.sociability > .57
      ? landTarget(cell, planet.walkers, .14 * senses, (other) => other !== cell && !other.climb && other.energy > .25 &&
        other.species === cell.species && other.genome.sociability > .43) : undefined;
    const group = peer && groupPosition(cell, peer, surfaceScale);
    const target = threat ?? mate ?? nest ?? prey ?? plant ?? remains ?? group;
    let turningPace = 1;
    if (target) {
      const angle = Math.atan2((target.y - cell.y) * .65,
        longitudeDistance(cell.x, target.x) * Math.max(.4, Math.sin(cell.y * Math.PI))) + (threat ? Math.PI : 0);
      turningPace = steer(cell, angle, 4.8, dt);
    } else {
      wander(cell, dt, random);
    }
    const feeding = target === plant && plant && landDistance(cell, plant) * surfaceScale < .015;
    const scavenging = target === remains && remains && landDistance(cell, remains) * surfaceScale < .019;
    const meeting = mate && landDistance(cell, mate) * surfaceScale < .019;
    const guarding = nest && landDistance(cell, nest) * surfaceScale < .028;
    const resting = !target && (cell.energy > 1.48 || activity < .72);
    const pace = (.009 + anatomy.legs * .027) * cell.genome.speed * (.85 + creatureMaturity(cell) * .15) * dt *
      (meeting ? .18 : feeding || scavenging || guarding ? .12 : threat ? 1.29 : resting ? .31 : activity) * turningPace / surfaceScale;
    const x = wrap(cell.x + Math.cos(cell.heading) * pace / Math.max(.4, Math.sin(cell.y * Math.PI)));
    const y = clamp(cell.y + Math.sin(cell.heading) * pace * 1.55, .02, .98);
    if (!dryGround(planet, { x, y })) {
      cell.heading += Math.PI * (.72 + random() * .53);
    } else {
      cell.x = x;
      cell.y = y;
      cell.stride += landDistance({ x: cell.px, y: cell.py }, cell) * surfaceScale * 600;
    }
    cell.behavior = threat ? 'Fleeing' : mate ? 'Seeking a mate' : nest ? guarding ? 'Tending an egg' : 'Returning to an egg' :
      prey ? 'Hunting' : feeding ? 'Grazing' : remains ? 'Scavenging' : plant ? 'Foraging' : group ? 'Moving with herd' : resting ? 'Resting' : 'Exploring';
    if (cell.attackCooldown <= 0 && feeding) {
      const bite = Math.min(.44, plant.mass * .67);
      plant.mass = Math.max(.10, plant.mass - bite * .64);
      cell.energy += bite;
      cell.attackCooldown = .58;
      cell.behavior = 'Eating plants';
    } else if (cell.attackCooldown <= 0 && scavenging) {
      const bite = Math.min(.38, remains.mass);
      remains.mass -= bite;
      cell.energy += bite * (diet === 'scavenger' ? 1.6 : 1.15);
      cell.attackCooldown = .64;
    } else if (cell.attackCooldown <= 0 && target === prey && prey && landDistance(cell, prey) * surfaceScale < .016) {
      prey.energy -= (.52 + anatomy.tissue * .19) * (1 - prey.anatomy.armor * .38);
      cell.energy += .14;
      cell.attackCooldown = .83;
      if (prey.energy <= 0) {
        prey.killed = true;
        cell.energy += .73;
        planet.landHunts++;
      }
    }
    if (threat || !room || !readyToBreed(cell, 1.28)) continue;
    if (meeting && readyToBreed(mate, 1.04)) {
      layEgg(planet, pond, cell, mate, populations, random);
    } else if (sameSpecies === 1 && cell.energy >= 1.36 && populations.get(cell.species)?.count === 1) {
      layEgg(planet, pond, cell, null, populations, random);
    }
  }
  planet.walkers = planet.walkers.filter((cell) => {
    if (cell.energy > 0) return true;
    leaveRemains(planet, cell);
    const pond = planet.ponds.find((item) => item.id === cell.pondId);
    if (pond) rememberLineage(pond.lineage, creatureRecord(cell, pond.id));
    return false;
  });
}

function gatherRain(planet, dt) {
  if (!planet.basinWater || (planet.weather !== 'rain' && planet.weather !== 'storm')) return;
  planet.rainClock += dt;
  if (planet.rainClock < .75) return;
  planet.rainClock -= .75;
  const amount = planet.weather === 'storm' ? .34 : .23;
  let changed = false;
  for (let index = 0; index < planet.terrain.length; index++) {
    if (planet.terrain[index] >= 0 || planet.basinWater[index] >= 1) continue;
    planet.basinWater[index] = Math.min(1, planet.basinWater[index] + amount);
    changed = true;
  }
  if (changed) planet.revision++;
}

function populationTraits() {
  return { count: 0, size: 0, temperature: 0, speed: 0, armor: 0, sociability: 0, caution: 0 };
}

function sampleTrait(traits, cell) {
  traits.count++;
  traits.size += cell.genome.size;
  traits.temperature += comfortableTemperature(cell.anatomy);
  traits.speed += cell.genome.speed;
  traits.armor += cell.anatomy.armor;
  traits.sociability += cell.genome.sociability * 100;
  traits.caution += cell.genome.caution * 100;
}

function traitAverages({ count, ...values }) {
  if (!count) return null;
  return Object.fromEntries(Object.entries(values).map(([name, sum]) => [name, Math.round(sum / count * 100) / 100]));
}

export function populationSnapshot(planet, time) {
  let swimming = 0;
  let algae = planet.oceanAlgae.length;
  let births = 0;
  let hunts = planet.landHunts;
  const pondTraits = populationTraits();
  const landTraits = populationTraits();
  for (const pond of planet.ponds) {
    swimming += pond.creatures.length;
    algae += pond.algae.length;
    births += pond.births;
    hunts += pond.hunts;
    for (const cell of pond.creatures) sampleTrait(pondTraits, cell);
  }
  for (const cell of planet.walkers) if (!cell.climb) sampleTrait(landTraits, cell);
  return { time, swimming, walking: landTraits.count, eggs: planet.eggs.length, algae, grass: planet.plants.length,
    births, hunts, temperature: planetTemperature(planet), weather: planet.weather,
    traits: { pond: traitAverages(pondTraits), land: traitAverages(landTraits) } };
}

function sampleHistory(planet, time) {
  const history = planet.history;
  if (history.length && time - history.at(-1).time < HISTORY_INTERVAL) return;
  history.push(populationSnapshot(planet, time));
  if (history.length > HISTORY_LIMIT) {
    const older = history.slice(0, 96).filter((sample, index) => index % 2 === 0);
    history.splice(0, 96, ...older);
  }
}

export function tick(system, dt, random = systemRandom(system)) {
  system.clock += dt;
  for (const planet of system.planets) {
    planet.angle = (planet.angle + dt * .071 / (planet.orbit + .26) ** 1.43) % TAU;
    stepClimate(planet, dt);
    recycleRemains(planet, dt, .039 + planet.soilMoisture * .037);
    gatherRain(planet, dt);
    if (planet.eggs.length) stepEggs(planet, dt);
    const populations = landPopulation(planet, { includeEggs: true });
    for (const pond of planet.ponds) stepPond(pond, planet.weather, dt, random, planet, populations);
    if (planet.basinWater) stepOceanAlgae(planet, dt, random);
    if (planet.plants.length) stepPlants(planet, dt, random);
    if (planet.grassCover || planet.plants.length) stepGrassCover(planet, dt);
    if (planet.walkers.length) stepWalkers(planet, populations, dt, random);
    trimLineages(planet);
    sampleHistory(planet, system.clock);
  }
}

export function newSystem(seed = Math.floor(Math.random() * 2 ** 32)) {
  return { version: 1, name: 'Aurora System', sun: 'amber', planets: [], clock: 0, randomState: seed >>> 0 };
}

export const slotKey = (number) => 'orbit-bloom/save-v1/' + number;

function restoredGenome(saved) {
  const genome = { ...DEFAULT_GENOME, ...saved };
  const options = { diet: DIETS, shape: BODY_SHAPES, pattern: PATTERNS, motion: MOTION, activity: ACTIVITY };
  const ranges = { size: [.25, 2.5], speed: [.1, 3], senses: [.1, 3], metabolism: [.1, 3], mutation: [0, 1], caution: [0, 1], sociability: [0, 1] };
  for (const [trait, choices] of Object.entries(options)) {
    if (typeof genome[trait] !== 'string' || !Object.hasOwn(choices, genome[trait])) genome[trait] = DEFAULT_GENOME[trait];
  }
  for (const [trait, [minimum, maximum]] of Object.entries(ranges)) {
    genome[trait] = Number.isFinite(genome[trait]) ? clamp(genome[trait], minimum, maximum) : DEFAULT_GENOME[trait];
  }
  genome.color = validColor(genome.color, DEFAULT_GENOME.color);
  genome.nucleus = validColor(genome.nucleus, DEFAULT_GENOME.nucleus);
  genome.strain = typeof genome.strain === 'string' ? genome.strain.slice(0, 24) : '';
  return genome;
}

function restoreCreature(cell) {
  cell.genome = restoredGenome(cell.genome);
  cell.heading = Number.isFinite(cell.heading) ? cell.heading : 0;
  cell.px = Number.isFinite(cell.px) ? cell.px : cell.x;
  cell.py = Number.isFinite(cell.py) ? cell.py : cell.y;
  cell.age = Number.isFinite(cell.age) ? Math.max(0, cell.age) : 0;
  cell.gen = Number.isSafeInteger(cell.gen) && cell.gen > 0 ? cell.gen : 1;
  cell.cooldown = Number.isFinite(cell.cooldown) ? cell.cooldown : 0;
  cell.stride = Number.isFinite(cell.stride) ? cell.stride : 0;
  cell.pstride = Number.isFinite(cell.pstride) ? cell.pstride : cell.stride;
  cell.previousHeading = Number.isFinite(cell.previousHeading) ? cell.previousHeading : cell.heading;
  cell.coParent ??= null;
  if (cell.anatomy) {
    for (const [trait, fallback] of Object.entries(FOUNDER_ANATOMY)) {
      cell.anatomy[trait] = Number.isFinite(cell.anatomy[trait]) ? clamp(cell.anatomy[trait], 0, 1.5) : fallback;
    }
    return;
  }
  const stage = cell.stage ?? 0;
  cell.anatomy = {
    ...FOUNDER_ANATOMY, tissue: [.09, .32, .42, .62, .45, .61, .72][stage] ?? .48,
    fins: stage === 3 ? .70 : stage === 2 ? .37 : .11,
    legs: stage >= 4 ? .48 + (stage - 4) * .23 : .02,
    air: stage >= 4 ? .51 + (stage - 4) * .12 : .05,
  };
  cell.stage = stageFor(cell.anatomy);
}

function restorePlant(plant, type) {
  plant.type = type;
  if (!plant.genes || typeof plant.genes !== 'object' || Array.isArray(plant.genes)) plant.genes = {};
  for (const [trait, fallback] of Object.entries(GRASS_GENES)) {
    if (!Number.isFinite(plant.genes[trait])) plant.genes[trait] = fallback;
  }
  plant.generation ??= 1;
  plant.parent ??= null;
  plant.pollenParent ??= null;
  plant.age ??= 0;
}

export function readSlot(storage, number) {
  const raw = storage.getItem(slotKey(number));
  return raw ? restoreSlot(JSON.parse(raw)) : null;
}

export function restoreSlot(save) {
  const system = save?.system;
  if (!system || system.version !== 1 || !Object.hasOwn(STARS, system.sun) ||
      !Number.isFinite(system.clock) || typeof system.name !== 'string' || !Array.isArray(system.planets) ||
      !system.planets.every((planet) => planet && Array.isArray(planet.terrain) &&
        planet.terrain.length === TERRAIN_W * TERRAIN_H && Object.hasOwn(WEATHER, planet.weather) &&
        Array.isArray(planet.ponds) && planet.ponds.every((pond) => Array.isArray(pond.creatures) &&
          Array.isArray(pond.food) && Array.isArray(pond.discovered) && pond.genome))) {
    throw new Error('This slot contains an unreadable save.');
  }
  if (system.sunTint !== undefined && !validColor(system.sunTint, null)) delete system.sunTint;
  system.randomState = Number.isInteger(system.randomState) ? system.randomState >>> 0 :
    (Math.floor(system.clock * 1000) ^ (system.planets[0]?.seed ?? 0x2f1249ed)) >>> 0;
  const usedHues = [];
  for (const planet of system.planets) {
    if (!Object.hasOwn(PLANET_SIZES, planet.size)) planet.size = 'medium';
    if (!GRASS_HUES.includes(planet.grassHue) || usedHues.includes(planet.grassHue)) {
      planet.grassHue = pickGrassHue(planet.seed, usedHues);
    }
    usedHues.push(planet.grassHue);
    if (!('basinWater' in planet)) {
      planet.basinWater = planet.terrain.some((height) => height < 0) ? planet.terrain.map((height) => Number(height < 0)) : null;
    }
    planet.rainClock ??= 0;
    planet.climateTime = Number.isFinite(planet.climateTime) ? Math.max(0, planet.climateTime) : system.clock;
    planet.soilMoisture = Number.isFinite(planet.soilMoisture) ? clamp(planet.soilMoisture, 0, 1) : WEATHER[planet.weather].moisture;
    planet.ice = Number.isFinite(planet.ice) ? clamp(planet.ice, 0, 1) : 0;
    planet.autoWeather = planet.autoWeather === true;
    planet.walkers ??= [];
    planet.eggs ??= [];
    planet.plants ??= [];
    planet.oceanAlgae ??= [];
    planet.oceanSporeClock ??= 0;
    for (const patch of planet.oceanAlgae) restorePlant(patch, 'algae');
    planet.plantLineage ??= [];
    for (const plant of planet.plants) restorePlant(plant, 'grass');
    planet.grassCover ??= null;
    planet.coverClock ??= 0;
    planet.coverRevision ??= 0;
    planet.coverGrowth ??= 0;
    planet.landHunts ??= 0;
    planet.landBirths ??= 0;
    planet.history ??= [];
    planet.placedAt = Number.isFinite(planet.placedAt) ? planet.placedAt :
      planet.history[0]?.time ?? Math.max(0, system.clock - planet.climateTime);
    planet.remains ??= [];
    planet.nutrients ??= 0;
    for (const pond of planet.ponds) {
      pond.climbed ??= 0;
      pond.lineage ??= [];
      pond.shoreAdaptation ??= 0;
      pond.rooted ??= false;
      pond.remains ??= [];
      pond.nutrients ??= 0;
      pond.algae ??= pond.grass ?? [];
      delete pond.grass;
      for (const patch of pond.algae) {
        patch.maturity ??= ALGAE_MATURITY;
        restorePlant(patch, 'algae');
      }
      pond.genome = restoredGenome(pond.genome);
      pond.algaeDesign = { ...ALGAE_DESIGN, ...pond.algaeDesign };
      pond.founderThermal ??= FOUNDER_ANATOMY.thermal;
      for (const cell of pond.creatures) restoreCreature(cell);
    }
    const groups = new Map();
    planet.walkers = planet.walkers.filter((cell) => {
      restoreCreature(cell);
      const species = speciesTraits(cell);
      cell.species = species.id;
      return cell.energy > 0 && reserveSpecies(groups, species);
    });
    planet.eggs = planet.eggs.filter((egg) => {
      const child = egg.child;
      if (!child || !planet.ponds.some((pond) => pond.id === child.pondId)) return false;
      restoreCreature(child);
      const species = speciesTraits(child);
      child.species = species.id;
      return child.stage >= 4 && reserveSpecies(groups, species);
    });
  }
  return save;
}

export function writeSlot(storage, number, system, view) {
  const record = createSlotRecord(system, view);
  storage.setItem(slotKey(number), JSON.stringify(record));
  return record;
}

export function createSlotRecord(system, view) {
  return { system, view, timestamp: new Date().toISOString() };
}
