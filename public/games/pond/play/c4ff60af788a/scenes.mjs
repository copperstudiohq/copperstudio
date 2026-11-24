import {
  TERRAIN_W, TERRAIN_H, basinWaterAt, clamp, creatureSize, dryGround, grassCovers, grassProfile, habitatAt, iceCover, limbCount, longitudeDistance, noise, planetPalette, planetSize,
  orbitalTemperature, pondDistance, pondEdgeScale, pondPlantStage, pondRadiusX, pondRadiusY, pondSite, seededRandom, speciesTraits, starAppearance, sunlitLongitude, terrainAt, wrap,
} from './model.mjs';
import { hueColor, rgb } from './colors.mjs';
import { atmosphereColor, cloudSprite, cloudTracks, drawAtmosphere, shorelineMask } from './planet-art.mjs';
import { drawAnimalModel } from './animal-model.mjs';
import { drawTree } from './tree-art.mjs';

const TAU = Math.PI * 2;
const H = 600;
const LAND_ENTITY_SCALE = .65;
const POND_ENTITY_SCALE = 1;
const LAND_TREE_SCALE = 1.56;
const GLOBE_TREE_SCALE = .56;
const MAP_CREATURE_RADIUS = 4.5;
const ORBIT_CAMERA = { lon: 0, lat: .06 };
const CLOUD_OPACITY = { clear: .40, rain: .61, storm: .72, snow: .62 };
const mix = (a, b, weight) => a.map((value, index) => value + (b[index] - value) * weight);
const tint = (color, weight) => 'rgb(' + color.map((channel) => Math.round(weight < 1 ? channel * weight :
  channel + (255 - channel) * (weight - 1))).join(',') + ')';

export const HABITAT_LAYERS = {
  natural: { name: 'Natural' },
  temperature: { name: 'Temperature', colors: ['#5f9fe8', '#f0d18b', '#e37376'], labels: ['Cold', 'Hot'] },
  moisture: { name: 'Soil moisture', colors: ['#d68854', '#e5d599', '#47c7d1'], labels: ['Dry', 'Wet'] },
  light: { name: 'Daylight', colors: ['#57569c', '#abc29a', '#f6e48d'], labels: ['Dark', 'Bright'] },
};

export function headingAt(cell, fraction) {
  if (fraction >= 1) return cell.heading;
  const previous = cell.previousHeading ?? cell.heading;
  const turn = cell.heading - previous;
  return previous + Math.atan2(Math.sin(turn), Math.cos(turn)) * fraction;
}

function ellipse(ctx, x, y, rx, ry = rx) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
}

function projectGlobe(point, camera, { x, y, radius }) {
  const lon = (point.x - .5) * TAU - camera.lon;
  const lat = (.5 - point.y) * Math.PI;
  const sx = Math.sin(lon) * Math.cos(lat);
  const sy = Math.sin(lat);
  const sz = Math.cos(lon) * Math.cos(lat);
  const sin = Math.sin(camera.lat);
  const cos = Math.cos(camera.lat);
  const depth = sy * sin + sz * cos;
  return { x: x + sx * radius, y: y - (sy * cos - sz * sin) * radius, depth };
}

function glow(ctx, x, y, radius, stops) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  for (const [position, color] of stops) gradient.addColorStop(position, color);
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function bitmap(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  paint(ctx, width, height);
  return canvas;
}

function pixels(ctx, width, height, colorAt) {
  const image = ctx.createImageData(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = colorAt(x, y);
      if (!color) continue;
      const index = (y * width + x) * 4;
      image.data[index] = color[0];
      image.data[index + 1] = color[1];
      image.data[index + 2] = color[2];
      image.data[index + 3] = color[3] ?? 255;
    }
  }
  ctx.putImageData(image, 0, 0);
}

function spaceBackground() {
  return bitmap(1000, 620, (ctx, width, height) => {
    pixels(ctx, width, height, (x, y) => {
      const u = x / width;
      const v = y / height;
      const curve = v - .62 + (u - .38) * .42 + noise(u * 5, v * 4, 72) * .19;
      const cloud = Math.exp(-curve * curve * 45) * (.49 + noise(u * 9, v * 8, 144) * .36);
      const violet = Math.exp(-((u - .66) ** 2 * 7 + (v - .61) ** 2 * 8));
      const blue = Math.exp(-((u - .15) ** 2 * 7 + (v - .26) ** 2 * 10));
      const grain = noise(x * 2, y * 2, 940) * 1.7;
      return [5 + 25 * cloud + 11 * violet + grain, 7 + 11 * cloud + 7 * blue + grain, 17 + 37 * cloud + 20 * violet + 8 * blue + grain];
    });
    const random = seededRandom(23520);
    for (let i = 0; i < 690; i++) {
      const x = random() * width;
      const y = random() * height;
      const bright = random();
      const size = .26 + bright ** 5 * 1.24;
      const colors = ['201,192,255', '165,200,255', '255,237,220'];
      const color = colors[Math.floor(random() * colors.length)];
      if (bright > .982) glow(ctx, x, y, 7, [[0, 'rgba(' + color + ',.42)'], [1, 'transparent']]);
      ctx.fillStyle = 'rgba(' + color + ',' + (.12 + bright ** 2 * .64) + ')';
      ellipse(ctx, x, y, size);
      ctx.fill();
      if (bright > .994) {
        ctx.fillRect(x - 4, y - .35, 8, .7);
        ctx.fillRect(x - .35, y - 4, .7, 8);
      }
    }
  });
}

function starBitmap(star) {
  const core = rgb(star.core);
  const hue = rgb(star.color);
  const rim = rgb(star.rim);
  return bitmap(270, 270, (ctx, width, height) => {
    pixels(ctx, width, height, (x, y) => {
      const u = (x - width / 2) / 132;
      const v = (y - height / 2) / 132;
      const radius = Math.hypot(u, v);
      if (radius > 1.004) return null;
      const z = Math.sqrt(Math.max(0, 1 - radius * radius));
      const large = noise(u * 4.7 + 5, v * 4.7 + 6, 772);
      const swirls = noise(u * 17 + large * 2.2, v * 17 - large * 2.2, 805);
      const granules = noise(u * 70 - swirls * 2, v * 70 + swirls * 2, 856);
      const plasma = clamp(.57 + large * .28 + swirls * .42 + granules * .24, 0, 1);
      const color = mix(mix(rim, hue, clamp(z + plasma * .18, 0, 1)), core, clamp(plasma * .83 + z * .14 - .06, 0, 1));
      return [...color, 255 * clamp((1.004 - radius) * 125, 0, 1)];
    });
  });
}

function planetBitmap(planet) {
  return globeBitmap(readTerrainTexture(planet, 216), ORBIT_CAMERA, 112, atmosphereColor(planet));
}

function drawSmallPlanet(ctx, color, x, y, radius) {
  const shading = ctx.createRadialGradient(x - radius * .34, y - radius * .34, 1, x, y, radius);
  shading.addColorStop(0, tint(rgb(color), 1.32));
  shading.addColorStop(.70, color);
  shading.addColorStop(1, tint(rgb(color), .39));
  ctx.fillStyle = shading;
  ellipse(ctx, x, y, radius);
  ctx.fill();
}

function turfSprite(profile, variation) {
  return bitmap(40, 34, (ctx) => {
    const hue = profile.hue + variation * 3;
    ctx.fillStyle = 'hsl(' + hue + ' 46% 23% / .65)';
    ellipse(ctx, 21, 28, 14, 4);
    ctx.fill();
    const blade = ctx.createLinearGradient(0, 29, 15, 5);
    blade.addColorStop(0, 'hsl(' + hue + ' 53% 30%)');
    blade.addColorStop(1, 'hsl(' + hue + ' 62% 62%)');
    ctx.fillStyle = blade;
    for (let i = 0; i < 10; i++) {
      const offset = i / 4.5 - 1;
      const root = 19 + offset * 8;
      const tip = 19 + offset * 16 * profile.spread;
      const height = 15 * profile.height * (1 - Math.abs(offset) * .4 + Math.sin(i * 5 + variation) * .2);
      ctx.beginPath();
      ctx.moveTo(root - 1.8, 29);
      ctx.quadraticCurveTo(root + (tip - root) * .34, 25 - height * .48, tip, 26 - height);
      ctx.quadraticCurveTo(root + 3 + (tip - root) * .70, 25 - height * .37, root + 2, 29);
      ctx.fill();
    }
  });
}

function sampleGrid(grid, x, y) {
  const fx = x * (TERRAIN_W - 1);
  const fy = y * (TERRAIN_H - 1);
  const ix = Math.floor(fx);
  const iy = Math.floor(fy);
  const rx = Math.min(ix + 1, TERRAIN_W - 1);
  const by = Math.min(iy + 1, TERRAIN_H - 1);
  const a = grid[iy * TERRAIN_W + ix] * (1 - (fx - ix)) + grid[iy * TERRAIN_W + rx] * (fx - ix);
  const b = grid[by * TERRAIN_W + ix] * (1 - (fx - ix)) + grid[by * TERRAIN_W + rx] * (fx - ix);
  return a * (1 - (fy - iy)) + b * (fy - iy);
}

const freezeFrame = (planet) => planet.ponds.length || planet.basinWater ? Math.floor((planet.ice ?? 0) * 12) : 0;

function frostWater(color, coverage, x, y, seed) {
  if (coverage < .035) return color;
  const crystals = noise(x * 182, y * 164, seed + 41);
  const veil = clamp(coverage * (.54 + crystals * .33), 0, .87);
  return mix(color, [195 + crystals * 14, 227 + crystals * 8, 243 + crystals * 8], veil);
}

function readTerrainTexture(planet, resolution) {
  const palette = planetPalette(planet);
  const stone = rgb(palette.stone);
  const water = rgb(palette.water);
  const turf = planet.grassCover ? hueColor(grassProfile(planet).hue, .56, .43) : null;
  const coast = planet.basinWater ? shorelineMask(planet.terrain) : null;
  const image = bitmap(resolution, resolution / 2, (ctx, width, height) => {
    pixels(ctx, width, height, (x, y) => {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const frost = iceCover(planet, v);
      for (const pond of planet.ponds) {
        const distance = pondDistance(pond, u, v);
        if (distance >= 1) continue;
        const shallow = clamp((distance - .45) * 1.9, 0, 1);
        const ripple = noise(u * 73, v * 124, pond.seed) * 5;
        const color = water.map((channel, index) => channel * (.87 + shallow * .23) + shallow * (index === 2 ? 24 : 34) + ripple);
        return frostWater(color, frost, u, v, planet.seed);
      }
      const value = sampleGrid(planet.terrain, u, v);
      const mineral = noise(u * 8, v * 5, planet.seed + 13) * .092;
      const slope = value - sampleGrid(planet.terrain, wrap(u - .006), Math.max(0, v - .012));
      const basin = coast ? sampleGrid(coast, u, v) : 0;
      let basinFloor;
      if (basin > .50) {
        const rim = clamp((.86 - basin) / .36, 0, 1);
        const lip = clamp((basin - .50) / .17, 0, 1);
        basinFloor = stone.map((channel) => channel * (.57 + rim * .31) + clamp(slope * .26, -10, 12));
        const volume = sampleGrid(planet.basinWater, u, v);
        if (volume > 0) {
          const depth = clamp(-value / 95, .04, .84);
          const color = water.map((channel, index) => channel * (.98 - depth * .26 + mineral * .66) + rim * (index === 2 ? 34 : 42));
          return mix(basinFloor, frostWater(color, frost, u, v, planet.seed), Math.min(1, volume * (1.08 + rim * .55)) * (.72 + lip * .28));
        }
      }
      if (turf && sampleGrid(planet.grassCover, u, v) > .42 + noise(u * 186, v * 152, planet.seed + 25) * .16) {
        const tuft = noise(u * 188, v * 140, planet.seed + 63);
        const strands = noise(u * 520 + v * 190, v * 258, planet.seed + 17);
        const canopy = .99 + tuft * .19 + strands * .10;
        const relief = clamp(slope * .8, -6, 8);
        return turf.map((channel) => channel * canopy + relief + Math.max(0, strands) ** 2 * 20);
      }
      if (basinFloor) return basinFloor;
      const heightTone = clamp((value - 30) / 38 + mineral, 0, 1);
      const relief = clamp(slope, -9, 13);
      return stone.map((channel, index) => channel * (.84 + heightTone * .30 + mineral * .5) + relief + heightTone * (index === 2 ? 15 : 9));
    });
  });
  return image.getContext('2d').getImageData(0, 0, image.width, image.height);
}

function globeBitmap(texture, camera, size, air, region = { left: -1, top: -1, width: 2, height: 2 }) {
  const sin = Math.sin(camera.lat);
  const cos = Math.cos(camera.lat);
  const longitude = camera.lon / TAU + .5;
  const width = texture.width - 1;
  const height = texture.height - 1;
  const density = size / Math.max(region.width, region.height);
  const { data } = texture;
  return bitmap(Math.ceil(region.width * density), Math.ceil(region.height * density), (ctx, columns, rows) => {
    pixels(ctx, columns, rows, (x, y) => {
      const nx = region.left + (x + .5) * region.width / columns;
      const ny = -region.top - (y + .5) * region.height / rows;
      const distance = nx * nx + ny * ny;
      if (distance >= 1) return null;
      const nz = Math.sqrt(1 - distance);
      const u = wrap(longitude + Math.atan2(nx, nz * cos - ny * sin) / TAU);
      const v = .5 - Math.asin(clamp(ny * cos + nz * sin, -1, 1)) / Math.PI;
      const fx = u * width;
      const fy = v * height;
      const tx = Math.floor(fx);
      const ty = Math.floor(fy);
      const left = 1 - (fx - tx);
      const top = 1 - (fy - ty);
      const index = (ty * texture.width + tx) * 4;
      const right = tx < width ? 4 : 0;
      const below = ty < height ? texture.width * 4 : 0;
      const colorAt = (channel) => {
        const at = index + channel;
        return (data[at] * left + data[at + right] * (1 - left)) * top +
          (data[at + below] * left + data[at + below + right] * (1 - left)) * (1 - top);
      };
      const light = .48 + Math.max(0, -.53 * nx + .37 * ny + .77 * nz) * .72;
      const atmosphere = (1 - nz) ** 3.2 * (.32 + light * .20);
      return [
        colorAt(0) * light + atmosphere * air[0],
        colorAt(1) * light + atmosphere * air[1],
        colorAt(2) * light + atmosphere * air[2],
        255 * Math.min(1, (1 - distance) * density * .84),
      ];
    });
  });
}

function globeShadow(lon, lat) {
  const width = 90;
  const east = Math.sin(lon);
  const north = -Math.cos(lon) * Math.sin(lat);
  const forward = Math.cos(lon) * Math.cos(lat);
  return bitmap(width, width, (ctx) => {
    pixels(ctx, width, width, (x, y) => {
      const nx = (x + .5) * 2 / width - 1;
      const ny = 1 - (y + .5) * 2 / width;
      const squared = nx * nx + ny * ny;
      if (squared >= 1) return null;
      const ray = nx * east + ny * north + Math.sqrt(1 - squared) * forward;
      const twilight = clamp((ray + .23) / .46, 0, 1);
      const opacity = (1 - twilight ** 2 * (3 - 2 * twilight)) * 110;
      return opacity > 0 ? [25, 31, 72, opacity] : null;
    });
  });
}

function habitatBitmap(planet, bounds, layer) {
  const colors = HABITAT_LAYERS[layer].colors.map(rgb);
  return bitmap(96, 60, (ctx, width, height) => {
    pixels(ctx, width, height, (x, y) => {
      const point = { x: wrap(bounds.left + (x + .5) / width * bounds.width), y: bounds.top + (y + .5) / height * bounds.height };
      const water = !dryGround(planet, point);
      if (water && layer === 'moisture') return null;
      const sample = habitatAt(planet, point, water);
      const value = clamp(layer === 'temperature' ? (sample.temperature + 25) / 83 : sample[layer], 0, 1);
      const color = value >= .5 ? mix(colors[1], colors[2], (value - .5) * 2) : mix(colors[0], colors[1], value * 2);
      return [...color, water ? 105 : 153];
    });
  });
}

function pondBitmap(seed, palette) {
  const water = rgb(palette.water);
  return bitmap(744, 474, (ctx, width, height) => {
    pixels(ctx, width, height, (x, y) => {
      const u = x / width;
      const v = y / height;
      const wide = noise(u * 7, v * 5, seed);
      const fine = noise(u * 23, v * 19, seed + 714);
      const deep = .50 + v * .31 + wide * .14;
      const caustic = Math.abs(Math.sin(u * 26 + wide * 3.4) * Math.sin(v * 26 - fine * 1.2));
      return water.map((channel, index) => channel * (1 - deep * .63) + caustic ** 6 * 12 + fine * 4 + (index === 2 ? 14 : 6));
    });
  });
}

function caption(ctx, text, x, y, color = '#edebff') {
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0b0e1b';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export class Scene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 950;
    this.background = spaceBackground();
    this.stars = new Map();
    this.planets = new WeakMap();
    this.terrain = new WeakMap();
    this.ponds = new WeakMap();
    this.clouds = new WeakMap();
    this.cloudSprites = [];
    this.grassProfiles = new WeakMap();
    this.turfSprites = new WeakMap();
    this.globe = null;
    this.shadow = null;
    this.habitatOverlay = null;
    this.systemSky = null;
    this.hits = [];
    this.visibleCreatures = [];
    this.speciesMarkers = [];
    this.resize = this.resize.bind(this);
    new ResizeObserver(this.resize).observe(canvas);
    this.resize();
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    if (!rect.height || !rect.width) return;
    const resolution = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(rect.width * resolution);
    this.canvas.height = Math.round(rect.height * resolution);
    this.width = H * rect.width / rect.height;
  }

  geometry() {
    const edge = this.orbitPlanetRadius({ size: 'large' }) + 9;
    const rx = Math.max(1, Math.min(this.width * .456, this.width * .5 - edge, 535));
    return { x: this.width * .5, y: H * .49, rx, ry: 220 };
  }

  orbitPlanetRadius(planet) {
    return 36 * planetSize(planet).scale * clamp(this.width / 700, .68, 1);
  }

  orbitPoint(orbit, angle) {
    const { x, y, rx, ry } = this.geometry();
    return { x: x + orbit * rx * Math.cos(angle), y: y + orbit * ry * Math.sin(angle) };
  }

  orbitAt(point) {
    const { x, y, rx, ry } = this.geometry();
    const dx = (point.x - x) / rx;
    const dy = (point.y - y) / ry;
    const sunRadius = clamp(this.width * .073, 44, 68);
    if (Math.hypot(point.x - x, point.y - y) < sunRadius + 23) return null;
    return { orbit: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
  }

  point(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width * this.width, y: (event.clientY - rect.top) / rect.height * H };
  }

  normalized(point) {
    return { x: point.x / this.width, y: point.y / H };
  }

  pondBounds(camera) {
    const span = 1 / (camera.zoom ?? 1);
    return { left: clamp(camera.x - span / 2, 0, 1 - span), top: clamp(camera.y - span / 2, 0, 1 - span), span };
  }

  pondAt(point, camera) {
    const bounds = this.pondBounds(camera);
    return { x: clamp(bounds.left + point.x / this.width * bounds.span, 0, 1), y: clamp(bounds.top + point.y / H * bounds.span, 0, 1) };
  }

  projectPond(point, bounds) {
    return { x: (point.x - bounds.left) * this.width / bounds.span, y: (point.y - bounds.top) * H / bounds.span };
  }

  landBounds(camera, planet) {
    const scale = (camera.zoom ?? 1) * planetSize(planet).surfaceScale;
    const height = .32 / scale;
    const width = clamp(height * this.width / H * .60 / Math.max(.43, Math.sin(camera.y * Math.PI)), .20 / scale, .69 / scale);
    return { left: camera.x - width / 2, top: clamp(camera.y - height / 2, 0, 1 - height), width, height };
  }

  landAt(point, camera, planet) {
    const bounds = this.landBounds(camera, planet);
    return {
      x: wrap(bounds.left + point.x / this.width * bounds.width),
      y: clamp(bounds.top + point.y / H * bounds.height, .01, .99),
    };
  }

  projectLand(point, bounds) {
    return {
      x: wrap(point.x - bounds.left) * this.width / bounds.width,
      y: (point.y - bounds.top) * H / bounds.height,
    };
  }

  globeGeometry(planet, camera) {
    const radius = Math.min(this.width * .45, 254) * planetSize(planet).scale * (camera?.zoom ?? 1);
    return { x: this.width / 2, y: H * .49, radius };
  }

  globeFrame({ x, y, radius }) {
    const left = Math.max(0, x - radius);
    const top = Math.max(0, y - radius);
    const width = Math.min(this.width, x + radius) - left;
    const height = Math.min(H, y + radius) - top;
    return { left, top, width, height, region: {
      left: (left - x) / radius, top: (top - y) / radius,
      width: width / radius, height: height / radius,
    } };
  }

  surfaceAt(point, camera, planet) {
    const { x, y, radius } = this.globeGeometry(planet, camera);
    const nx = (point.x - x) / radius;
    const ny = (y - point.y) / radius;
    const distance = nx * nx + ny * ny;
    if (distance >= 1) return null;
    const nz = Math.sqrt(1 - distance);
    const sin = Math.sin(camera.lat);
    const cos = Math.cos(camera.lat);
    const lat = Math.asin(clamp(ny * cos + nz * sin, -1, 1));
    const lon = camera.lon + Math.atan2(nx, nz * cos - ny * sin);
    return { x: wrap(.5 + lon / TAU), y: .5 - lat / Math.PI };
  }

  projectSurface(point, camera, planet) {
    return projectGlobe(point, camera, this.globeGeometry(planet, camera));
  }

  hit(point) {
    const hits = this.hits.map((hit) => ({ hit, distance: Math.hypot(point.x - hit.x, point.y - hit.y) }))
      .filter(({ hit, distance }) => distance <= hit.radius);
    return hits.reduce((best, item) => !best || item.distance < best.distance ? item : best, null)?.hit;
  }

  draw({ system, planet, pond, view, tool, pointer, selected, focusSpecies, brush, camera, landCamera, pondCamera, rotating, fraction, time,
    placementPalette, habitatLayer, habitatPoint }) {
    const ctx = this.ctx;
    ctx.setTransform(this.canvas.width / this.width, 0, 0, this.canvas.height / H, 0, 0);
    this.hits = [];
    this.visibleCreatures.length = 0;
    this.speciesMarkers.length = 0;
    this.focusSpecies = focusSpecies;
    if (view === 'system') this.drawSystem(system, pointer, tool, time, placementPalette);
    if (view === 'surface' && planet) this.drawSurface(planet, pointer, tool, brush, camera, rotating, selected, fraction, time);
    if (view === 'land' && planet) this.drawLand(planet, landCamera, pointer, tool, selected, fraction, time, habitatLayer, habitatPoint);
    if (view === 'pond' && pond) this.drawPond(pond, planet, pondCamera, pointer, tool, selected, fraction, time);
    this.drawSpeciesMarkers();
  }

  noteCreature(cell, x, y, selected) {
    if (x < 0 || y < 0 || x > this.width || y > H) return;
    const species = cell.species ?? speciesTraits(cell).id;
    this.visibleCreatures.push({ species, pan: x / this.width * 2 - 1 });
    if (!selected && species === this.focusSpecies) this.speciesMarkers.push({ x, y });
  }

  drawSpeciesMarkers() {
    const ctx = this.ctx;
    ctx.fillStyle = '#8df8de';
    ctx.strokeStyle = '#13242c';
    ctx.lineWidth = 1.4;
    for (const { x, y } of this.speciesMarkers) {
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 4, y - 12);
      ctx.lineTo(x, y - 16);
      ctx.lineTo(x - 4, y - 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  systemBackdrop(system) {
    const width = this.width;
    const key = [system.sunTint ?? system.sun, this.canvas.width, this.canvas.height, width].join('/');
    if (this.systemSky?.key === key) return this.systemSky.image;
    const image = bitmap(this.canvas.width, this.canvas.height, (ctx, pixelsWide, pixelsHigh) => {
      const { x, y, rx, ry } = this.geometry();
      ctx.setTransform(pixelsWide / width, 0, 0, pixelsHigh / H, 0, 0);
      ctx.drawImage(this.background, 0, 0, width, H);
      ctx.lineWidth = 1;
      for (const orbit of [.28, .46, .64, .82, 1]) {
        ellipse(ctx, x, y, rx * orbit, ry * orbit);
        ctx.strokeStyle = orbit === 1 ? '#aca1f33e' : '#aca1f332';
        ctx.stroke();
      }
      ctx.strokeStyle = '#aea1ec2b';
      for (let i = 0; i < 24; i++) {
        const angle = i / 24 * TAU;
        const p = this.orbitPoint(1.013, angle);
        const q = this.orbitPoint(i % 6 === 0 ? 1.058 : 1.035, angle);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.stroke();
      }
      const star = starAppearance(system);
      const solarRadius = clamp(width * .073, 44, 68);
      glow(ctx, x, y, solarRadius * 3.1, [[0, star.color + '66'], [.37, star.rim + '47'], [.64, star.rim + '18'], [1, star.rim + '00']]);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      glow(ctx, x, y, solarRadius * 1.65, [[0, star.color + 'b0'], [.58, star.rim + '91'], [.77, star.rim + '29'], [1, star.rim + '00']]);
      ctx.restore();
      if (!system.sunTint && !this.stars.has(star)) this.stars.set(star, starBitmap(star));
      const starImage = this.stars.get(star) ?? starBitmap(star);
      ctx.drawImage(starImage, x - solarRadius, y - solarRadius, solarRadius * 2, solarRadius * 2);
      ctx.strokeStyle = star.core + '94';
      ctx.lineWidth = 1.2;
      ellipse(ctx, x, y, solarRadius * .979);
      ctx.stroke();
      caption(ctx, 'Solara', x, y + solarRadius + 15, '#f9dfc7');
    });
    this.systemSky = { key, image };
    return image;
  }

  drawSystem(system, pointer, tool, time, placementPalette) {
    const ctx = this.ctx;
    const width = this.width;
    const { x, y, rx, ry } = this.geometry();
    ctx.drawImage(this.systemBackdrop(system), 0, 0, width, H);
    const preview = tool === 'planet' && pointer ? this.orbitAt(pointer) : null;

    if (preview && preview.orbit >= .13 && preview.orbit <= 1) {
      ctx.setLineDash([5, 6]);
      ctx.strokeStyle = '#d0c1ffb5';
      ellipse(ctx, x, y, rx * preview.orbit, ry * preview.orbit);
      ctx.stroke();
      ctx.setLineDash([]);
      const size = this.orbitPlanetRadius(placementPalette);
      drawAtmosphere(ctx, pointer.x, pointer.y, size, atmosphereColor({ waterColor: placementPalette.water }), .75);
      drawSmallPlanet(ctx, placementPalette.stone, pointer.x, pointer.y, size);
      const temperature = orbitalTemperature(preview.orbit);
      caption(ctx, temperature + '°C in clear weather', clamp(pointer.x, 79, width - 79), pointer.y + size + 10,
        temperature >= 26 ? '#ffd59c' : temperature <= 0 ? '#b9e8ff' : '#edebff');
    }

    const coords = system.planets.map((planet) => {
      const position = this.orbitPoint(planet.orbit, planet.angle);
      const radius = this.orbitPlanetRadius(planet);
      this.hits.push({ ...position, radius: radius + 10, id: planet.id });
      return { planet, ...position, radius };
    });
    const hovered = pointer && !tool ? this.hit(pointer) : null;
    const now = performance.now();
    let refreshAvailable = true;
    for (const point of coords) {
      const { planet, x: px, y: py, radius } = point;
      const hue = planetPalette(planet).stone;
      const focused = hovered?.id === planet.id;
      ctx.lineWidth = 1;
      ellipse(ctx, x, y, rx * planet.orbit, ry * planet.orbit);
      ctx.strokeStyle = focused ? '#d9c9ff76' : '#b8a4f748';
      ctx.stroke();
      drawAtmosphere(ctx, px, py, radius, atmosphereColor(planet), .68);
      let cached = this.planets.get(planet);
      const freeze = freezeFrame(planet);
      const changed = cached?.revision !== planet.revision || cached?.cover !== planet.coverRevision || cached?.freeze !== freeze;
      if (refreshAvailable && changed && (!cached || now - cached.drawnAt > 240)) {
        cached = { revision: planet.revision, cover: planet.coverRevision, freeze, image: planetBitmap(planet), drawnAt: now };
        this.planets.set(planet, cached);
        refreshAvailable = false;
      }
      if (cached) {
        ctx.drawImage(cached.image, px - radius, py - radius, radius * 2, radius * 2);
        ctx.save();
        ellipse(ctx, px, py, radius);
        ctx.clip();
        this.drawPlanetClouds(planet, ORBIT_CAMERA, { x: px, y: py, radius }, .85);
        ctx.restore();
      } else {
        drawSmallPlanet(ctx, hue, px, py, radius);
      }
      if (focused) {
        ctx.strokeStyle = '#e4dcffce';
        ellipse(ctx, px, py, radius + 5);
        ctx.stroke();
      }
      caption(ctx, planet.name, px, py + radius + 12);
    }

    // Sparse stars vary subtly while the orbital layout stays easy to read.
    const random = seededRandom(490);
    ctx.fillStyle = '#cec3ff';
    for (let i = 0; i < 25; i++) {
      ctx.globalAlpha = .22 + .19 * Math.sin(time * .85 + i * 2.2);
      ctx.fillRect(random() * width, random() * H, 1.3, 1.3);
    }
    ctx.globalAlpha = 1;
  }

  terrainTexture(planet, detail) {
    let cached = this.terrain.get(planet);
    const now = performance.now();
    const freeze = freezeFrame(planet);
    const vegetationChanged = cached?.cover !== planet.coverRevision && now - (cached?.updatedAt ?? 0) > 350;
    if (!cached || cached.revision !== planet.revision || vegetationChanged || cached.detail < detail || cached.freeze !== freeze) {
      cached = { revision: planet.revision, cover: planet.coverRevision, freeze, detail, updatedAt: now, texture: readTerrainTexture(planet, detail) };
      this.terrain.set(planet, cached);
    }
    return cached;
  }

  grassFor(planet) {
    if (!this.grassProfiles.has(planet)) this.grassProfiles.set(planet, grassProfile(planet));
    return this.grassProfiles.get(planet);
  }

  drawPlanetClouds(planet, camera, globe, opacity = 1) {
    if (!this.clouds.has(planet)) this.clouds.set(planet, cloudTracks(planet.seed));
    const tracks = this.clouds.get(planet);
    const daylight = sunlitLongitude(planet);
    const climateTime = planet.climateTime ?? 0;
    const cloudiness = CLOUD_OPACITY[planet.weather] * opacity;
    const ctx = this.ctx;
    for (const [index, track] of tracks.entries()) {
      const drift = climateTime * (.0022 + index * .00016);
      const x = wrap(track.x + drift);
      const y = track.y + Math.sin(index + drift * 6) * .018;
      const position = projectGlobe({ x, y }, camera, globe);
      if (position.depth < .15) continue;
      const width = globe.radius * track.width * (.56 + position.depth * .44);
      const height = width * track.aspect;
      const sunlight = .60 + .34 * Math.cos((x - daylight) * TAU);
      this.cloudSprites[track.sprite] ??= cloudSprite(480 + track.sprite * 71);
      ctx.save();
      ctx.globalAlpha = cloudiness * clamp((position.depth - .12) * 2.3, 0, 1) * sunlight;
      ctx.translate(position.x, position.y);
      ctx.rotate(track.angle);
      ctx.drawImage(this.cloudSprites[track.sprite], -width / 2, -height / 2, width, height);
      ctx.restore();
    }
  }

  drawSurface(planet, pointer, tool, brush, camera, rotating, selected, fraction, time) {
    const ctx = this.ctx;
    const width = this.width;
    const globe = this.globeGeometry(planet, camera);
    const { x: centerX, y: centerY, radius } = globe;
    const air = atmosphereColor(planet);
    const frame = this.globeFrame(globe);
    const cached = this.terrainTexture(planet, rotating ? 372 : camera.zoom > 1.8 ? 1040 : 820);
    const size = rotating ? 240 : Math.min(530, Math.max(290, Math.round(radius * 2.6)));
    if (this.globe?.texture !== cached.texture || this.globe.lon !== camera.lon ||
        this.globe.lat !== camera.lat || this.globe.size !== size || this.globe.radius !== radius || this.globe.width !== width) {
      this.globe = { texture: cached.texture, lon: camera.lon, lat: camera.lat, size, radius, width,
        image: globeBitmap(cached.texture, camera, size, air, frame.region) };
    }
    ctx.drawImage(this.background, 0, 0, width, H);
    drawAtmosphere(ctx, centerX, centerY, radius, air, planet.weather === 'clear' ? .92 : 1.12);
    ctx.drawImage(this.globe.image, frame.left, frame.top, frame.width, frame.height);
    const at = pointer && this.surfaceAt(pointer, camera, planet);
    ctx.save();
    ellipse(ctx, centerX, centerY, radius);
    ctx.clip();
    const shadowLon = Math.round(((sunlitLongitude(planet) - .5) * TAU - camera.lon) * 21) / 21;
    const shadowLat = Math.round(camera.lat * 21) / 21;
    if (this.shadow?.lon !== shadowLon || this.shadow?.lat !== shadowLat) {
      this.shadow = { lon: shadowLon, lat: shadowLat, image: globeShadow(shadowLon, shadowLat) };
    }
    ctx.drawImage(this.shadow.image, centerX - radius, centerY - radius, radius * 2, radius * 2);
    this.drawPlanetClouds(planet, camera, globe, (tool ? .48 : 1) / Math.max(1, (camera.zoom ?? 1) * .72));
    this.drawWeather(planet.weather, time);
    if (at && !rotating && (tool === 'ocean' || tool === 'stone')) {
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = tool === 'ocean' ? '#9de6ff' : '#d7ec9c';
      ellipse(ctx, pointer.x, pointer.y, brush * radius * 4.2, brush * radius * 3.1);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (at && tool === 'pond' && !rotating) {
      this.drawPondOutline(pondSite(planet, at.x, at.y), camera, planet, terrainAt(planet, at.x, at.y) < 0);
    }
    const grass = this.grassFor(planet);
    const scale = Math.max(.10, this.globeGeometry(planet).radius / (600 * planetSize(planet).surfaceScale));
    const visible = ({ x, y, depth }) => depth >= .06 && x >= -12 && y >= -12 && x <= width + 12 && y <= H + 12;
    for (const patch of planet.oceanAlgae) {
      if (basinWaterAt(planet, patch.x, patch.y) < .14) continue;
      const point = this.projectSurface(patch, camera, planet);
      if (!visible(point)) continue;
      this.drawOceanColony(patch, grass, point.x, point.y, scale, time, iceCover(planet, patch.y));
    }
    for (const plant of planet.plants) {
      if (!dryGround(planet, plant)) continue;
      const point = this.projectSurface(plant, camera, planet);
      if (!visible(point)) continue;
      this.drawGrass(plant, grass, point.x, point.y, scale, time);
    }
    for (const tree of planet.trees) {
      const point = this.projectSurface(tree, camera, planet);
      if (point.depth < .06 || point.x < -26 || point.x > width + 26 || point.y < -12 || point.y > H + 48) continue;
      this.drawMapTree(tree, planet, point.x, point.y, GLOBE_TREE_SCALE, selected);
    }
    for (const egg of planet.eggs) {
      const point = this.projectSurface(egg, camera, planet);
      if (!visible(point)) continue;
      const id = 'egg/' + egg.child.pondId + '/' + egg.child.id;
      this.drawEgg(egg, point.x, point.y, scale, selected === id);
      this.hits.push({ x: point.x, y: point.y, radius: 8, id });
    }
    for (const cell of planet.walkers) {
      const location = {
        x: wrap(cell.px + longitudeDistance(cell.px, cell.x) * fraction),
        y: cell.py + (cell.y - cell.py) * fraction,
      };
      const point = this.projectSurface(location, camera, planet);
      if (!visible(point)) continue;
      const heading = headingAt(cell, fraction);
      const ahead = this.projectSurface({
        x: wrap(location.x + Math.cos(heading) * .005 / Math.max(.4, Math.sin(location.y * Math.PI))),
        y: clamp(location.y + Math.sin(heading) * .008, .001, .999),
      }, camera, planet);
      const angle = Math.atan2(ahead.y - point.y, ahead.x - point.x);
      const id = cell.pondId + '/' + cell.id;
      this.drawAnimalBody(cell, point.x, point.y, angle, scale, id === selected, fraction, true);
      this.noteCreature(cell, point.x, point.y, id === selected);
      this.hits.push({ x: point.x, y: point.y, radius: 10, id });
    }
    ctx.restore();
  }

  drawLand(planet, camera, pointer, tool, selected, fraction, time, habitatLayer = 'natural', habitatPoint) {
    const ctx = this.ctx;
    const bounds = this.landBounds(camera, planet);
    const cached = this.terrainTexture(planet, 1040);
    const { texture } = cached;
    cached.map ??= bitmap(texture.width, texture.height, (buffer) => buffer.putImageData(texture, 0, 0));
    const sourceLeft = wrap(bounds.left) * texture.width;
    const sourceTop = bounds.top * texture.height;
    const sourceWidth = bounds.width * texture.width;
    const sourceHeight = bounds.height * texture.height;
    const first = Math.min(sourceWidth, texture.width - sourceLeft);
    const splitAt = this.width * first / sourceWidth;
    ctx.drawImage(cached.map, sourceLeft, sourceTop, first, sourceHeight, 0, 0, splitAt, H);
    if (first < sourceWidth) {
      ctx.drawImage(cached.map, 0, sourceTop, sourceWidth - first, sourceHeight, splitAt, 0, this.width - splitAt, H);
    }
    const shade = ctx.createLinearGradient(0, 0, this.width * .8, H);
    shade.addColorStop(0, '#f6c0861b');
    shade.addColorStop(.65, '#182a2015');
    shade.addColorStop(1, '#2027313b');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, this.width, H);

    const grass = this.grassFor(planet);
    const scale = LAND_ENTITY_SCALE;
    const animalScale = scale * .86;
    if (planet.grassCover) this.drawTurf(planet, bounds, grass, scale);
    if (habitatLayer !== 'natural') this.drawHabitatOverlay(planet, bounds, habitatLayer);
    for (const patch of planet.oceanAlgae) {
      const { x, y } = this.projectLand(patch, bounds);
      if (x > this.width + 26 * scale || y < -26 * scale || y > H + 26 * scale || basinWaterAt(planet, patch.x, patch.y) < .14) continue;
      const radius = this.drawOceanColony(patch, grass, x, y, scale, time, iceCover(planet, patch.y));
      const id = 'ocean/' + patch.seed;
      if (id === selected) this.drawSelection(x, y, radius + 5);
      this.hits.push({ x, y, radius: radius + 3, id });
    }
    for (const remains of planet.remains) {
      const { x, y } = this.projectLand(remains, bounds);
      if (x <= this.width + 25 * scale && y >= -25 * scale && y <= H + 25 * scale && dryGround(planet, remains)) {
        this.drawRemains(remains, x, y, scale);
      }
    }
    for (const plant of planet.plants) {
      const { x, y } = this.projectLand(plant, bounds);
      if (x > this.width + 38 * scale || y < -38 * scale || y > H + 38 * scale || !dryGround(planet, plant)) continue;
      this.drawGrass(plant, grass, x, y, scale, time);
      const id = 'plant/' + plant.seed;
      if (selected === id) this.drawSelection(x, y - 10 * scale, 19 * scale);
      this.hits.push({ x, y: y - 10 * scale, radius: 15 * scale, id });
    }
    for (const tree of planet.trees) {
      const offset = longitudeDistance(bounds.left + bounds.width * .5, tree.x);
      const x = this.width * (.5 + offset / bounds.width);
      const y = (tree.y - bounds.top) / bounds.height * H;
      if (x < -96 || x > this.width + 96 || y < -14 || y > H + 132) continue;
      this.drawMapTree(tree, planet, x, y, LAND_TREE_SCALE, selected);
    }
    for (const egg of planet.eggs) {
      const { x, y } = this.projectLand(egg, bounds);
      if (x > this.width + 26 * scale || y < -26 * scale || y > H + 26 * scale) continue;
      const id = 'egg/' + egg.child.pondId + '/' + egg.child.id;
      this.drawEgg(egg, x, y, scale, selected === id);
      this.hits.push({ x, y, radius: 10 * scale, id });
    }
    const animals = [];
    for (const cell of planet.walkers) {
      const position = {
        x: wrap(cell.px + longitudeDistance(cell.px, cell.x) * fraction),
        y: cell.py + (cell.y - cell.py) * fraction,
      };
      const { x, y } = this.projectLand(position, bounds);
      if (x > this.width + 43 * scale || y < -43 * scale || y > H + 43 * scale) continue;
      animals.push({ cell, x, y, id: cell.pondId + '/' + cell.id });
    }
    animals.sort((a, b) => a.y - b.y);
    for (const { cell, x, y, id } of animals) {
      const heading = headingAt(cell, fraction);
      const longitudeScale = Math.max(.4, Math.sin(cell.y * Math.PI));
      const angle = Math.atan2(Math.sin(heading) * 1.55 * H / bounds.height,
        Math.cos(heading) * this.width / (bounds.width * longitudeScale));
      const size = this.drawAnimalBody(cell, x, y, angle, animalScale, selected === id, fraction, true);
      this.noteCreature(cell, x, y, selected === id);
      this.hits.push({ x, y: y - size * .37, radius: Math.max(11, size * 1.6), id });
    }
    const light = habitatAt(planet, camera).light;
    ctx.fillStyle = `rgba(13, 24, 64, ${(1 - light) ** 2 * .43})`;
    ctx.fillRect(0, 0, this.width, H);
    this.drawWeather(planet.weather, time);
    if (habitatPoint) {
      const { x, y } = this.projectLand(habitatPoint, bounds);
      if (x <= this.width && y >= 0 && y <= H) {
        this.drawSelection(x, y, 12);
        caption(ctx, 'Sample', x, y + 16);
      }
    }
    if (pointer && tool === 'seeds') {
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#efffd8';
      ellipse(ctx, pointer.x, pointer.y, 26);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawHabitatOverlay(planet, bounds, layer) {
    const key = [layer, planet.revision, planet.weather, Math.floor(planet.climateTime * 3),
      ...Object.values(bounds).map((value) => Math.round(value * 400))].join('/');
    if (this.habitatOverlay?.planet !== planet || this.habitatOverlay?.key !== key) {
      this.habitatOverlay = { planet, key, image: habitatBitmap(planet, bounds, layer) };
    }
    this.ctx.drawImage(this.habitatOverlay.image, 0, 0, this.width, H);
  }

  drawTurf(planet, bounds, profile, scale) {
    const ctx = this.ctx;
    if (!this.turfSprites.has(planet)) {
      this.turfSprites.set(planet, [0, 1, 2].map((variation) => turfSprite(profile, variation)));
    }
    const sprites = this.turfSprites.get(planet);
    const columns = Math.round(TERRAIN_W * planetSize(planet).surfaceScale);
    const rows = Math.round(TERRAIN_H * planetSize(planet).surfaceScale);
    const fromX = Math.floor(bounds.left * columns);
    const toX = Math.ceil((bounds.left + bounds.width) * columns);
    const fromY = Math.max(0, Math.floor(bounds.top * rows));
    const toY = Math.min(rows, Math.ceil((bounds.top + bounds.height) * rows));
    const width = 25 * scale;
    for (let row = fromY; row < toY; row++) {
      for (let col = fromX; col < toX; col++) {
        const pattern = (Math.imul((col + columns) % columns, 374761393) ^ Math.imul(row, 668265263) ^ planet.seed) >>> 0;
        const x = wrap((col + .15 + ((pattern >>> 5) % 11) * .064) / columns);
        const y = (row + .16 + ((pattern >>> 9) % 13) * .052) / rows;
        if (!grassCovers(planet, x, y)) continue;
        const point = this.projectLand({ x, y }, bounds);
        const size = width * (.78 + ((pattern >>> 16) % 11) * .046);
        ctx.drawImage(sprites[pattern % sprites.length], point.x - size * .48, point.y - size * .64, size, size * .85);
      }
    }
  }

  drawGrass(patch, profile, x, y, scale, time) {
    const ctx = this.ctx;
    const genes = patch.genes;
    const size = (4 + Math.sqrt(patch.mass) * 17) * scale;
    const blades = clamp(Math.round((profile.blades + genes.blades) * 1.7), 9, 25);
    const color = (profile.hue + genes.pigment + 360) % 360;
    const tilt = ((patch.seed % 89) / 89 - .5) * .65;
    const sway = Math.sin(time * .95 + patch.seed % 31) * .10;
    ctx.save();
    ctx.translate(x, y);
    const spreadWidth = size * (.55 + profile.spread * .21) * genes.spread;
    ctx.fillStyle = 'hsl(' + color + ' 48% 20% / .60)';
    ellipse(ctx, size * .15, size * .16, spreadWidth * 1.16, size * .32);
    ctx.fill();
    const canopy = ctx.createLinearGradient(0, -size * .63, 0, size * .24);
    canopy.addColorStop(0, 'hsl(' + color + ' 51% 45%)');
    canopy.addColorStop(.55, 'hsl(' + color + ' 47% 31%)');
    canopy.addColorStop(1, 'hsl(' + color + ' 55% 23%)');
    ctx.fillStyle = canopy;
    for (let lobe = 0; lobe < 5; lobe++) {
      const offset = lobe / 2 - 1;
      ellipse(ctx, offset * spreadWidth * .62, -size * (.16 + (.3 * (1 - Math.abs(offset)))),
        spreadWidth * .50, size * (.28 + (1 - Math.abs(offset)) * .13));
      ctx.fill();
    }
    if (scale < .42) {
      ctx.restore();
      return;
    }
    ctx.strokeStyle = 'hsl(' + color + ' 37% 22% / .66)';
    ctx.lineWidth = Math.max(.32, scale * .55);
    const colors = [42, 52, 65].map((lightness, index) => {
      const blade = ctx.createLinearGradient(size * .21, 0, -size * .31, -size * profile.height * genes.height);
      blade.addColorStop(0, 'hsl(' + color + ' 47% 26%)');
      blade.addColorStop(.47, 'hsl(' + color + ' 57% ' + (lightness - 8) + '%)');
      blade.addColorStop(1, 'hsl(' + (color - index * 3) + ' 66% ' + lightness + '%)');
      return blade;
    });
    for (let index = 0; index < blades; index++) {
      const spread = index * 2 / (blades - 1) - 1;
      const height = size * profile.height * genes.height * (1.07 - Math.abs(spread) * .38 + Math.sin(index * 13 + patch.seed % 71) * .23);
      const root = spread * size * .43 + Math.sin(index * 10) * size * .15;
      const tip = root + size * (spread * profile.spread * genes.spread + tilt + sway);
      const center = root + (tip - root) * (.82 - profile.bend * genes.curl);
      const halfWidth = size * (.046 + profile.width * .95) * genes.width;
      ctx.beginPath();
      ctx.moveTo(root - halfWidth, 0);
      ctx.bezierCurveTo(center - halfWidth, -height * .42, tip - halfWidth * 1.4, -height * .87, tip, -height);
      ctx.bezierCurveTo(tip + halfWidth * 1.2, -height * .63, center + halfWidth, -height * .29, root + halfWidth, 0);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.stroke();
      if (scale > .55 && halfWidth > 1.4) {
        ctx.beginPath();
        ctx.moveTo(root, 0);
        ctx.quadraticCurveTo(center, -height * .47, tip * .81 + root * .19, -height * .84);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawPondPlant(patch, profile, x, y, scale, time) {
    const ctx = this.ctx;
    const stage = pondPlantStage(patch);
    if (stage === 'cell') {
      const radius = (3 + patch.mass * 5) * scale;
      ctx.fillStyle = 'hsl(' + (profile.hue + patch.genes.pigment) + ' 67% 66%)';
      ellipse(ctx, x, y, radius);
      ctx.fill();
      ctx.fillStyle = '#f0ffed';
      ellipse(ctx, x - scale, y - scale, 1.2 * scale);
      ctx.fill();
      return radius;
    }

    const radius = (7 + patch.mass * 13) * patch.genes.width * scale;
    const hue = (profile.hue + patch.genes.pigment + 12) % 360;
    const algae = ctx.createRadialGradient(x - radius * .32, y - radius * .32, 0, x, y, radius);
    algae.addColorStop(0, 'hsl(' + hue + ' 64% 66% / .92)');
    algae.addColorStop(.63, 'hsl(' + hue + ' 54% 42% / .78)');
    algae.addColorStop(1, 'hsl(' + hue + ' 46% 25% / .43)');
    ctx.fillStyle = algae;
    ctx.strokeStyle = 'hsl(' + hue + ' 55% 62% / .42)';
    ctx.lineWidth = .76;
    const lobes = clamp(Math.round(7 + patch.genes.blades), 4, 11);
    for (let lobe = 0; lobe < lobes; lobe++) {
      const angle = lobe * TAU / lobes + patch.seed % 9 + Math.sin(time * .6 + lobe) * .09;
      ellipse(ctx, x + Math.cos(angle) * radius * .38, y + Math.sin(angle) * radius * .30,
        radius * (.46 + Math.sin(lobe * 3) * .13), radius * .39);
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = 'hsl(' + hue + ' 62% 77% / .85)';
    for (let dot = 0; dot < 7; dot++) {
      const angle = dot * 2.4 + patch.seed % 13;
      const distance = radius * ((dot % 3) + 1) / 4.8;
      ellipse(ctx, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance * .72, .9 * scale);
      ctx.fill();
    }
    return radius;
  }

  drawOceanColony(patch, profile, x, y, scale, time, frost) {
    const ctx = this.ctx;
    const radius = (3 + patch.mass * 12) * patch.genes.width * scale;
    const hue = (profile.hue + patch.genes.pigment + 21) % 360;
    const sway = Math.sin(time * .65 + patch.seed % 7) * .12;
    ctx.save();
    ctx.globalAlpha *= 1 - frost * .72;
    ctx.translate(x, y);
    ctx.rotate((patch.seed % 31) * .12 + sway);
    const tint = ctx.createRadialGradient(-radius * .18, -radius * .15, 0, 0, 0, radius * 1.3);
    tint.addColorStop(0, `hsl(${hue} 59% 57% / .83)`);
    tint.addColorStop(.67, `hsl(${hue} 52% 44% / .53)`);
    tint.addColorStop(1, `hsl(${hue} 50% 36% / .13)`);
    ctx.fillStyle = tint;
    for (const angle of [0, 2.1, 4.2]) {
      ellipse(ctx, Math.cos(angle) * radius * .44, Math.sin(angle) * radius * .36, radius * .60, radius * .30);
      ctx.fill();
    }
    ctx.restore();
    return radius;
  }

  drawSelection(x, y, radius) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#fff2bb';
    ctx.lineWidth = 1.25;
    ellipse(ctx, x, y, radius);
    ctx.stroke();
  }

  drawEgg(egg, x, y, scale, selected) {
    const ctx = this.ctx;
    const skin = rgb(egg.child.genome.color);
    const size = (7 + egg.child.genome.size * 3) * scale;
    const progress = egg.progress / egg.duration;
    if (selected) this.drawSelection(x, y, size + 6);
    ctx.save();
    ctx.translate(x, y);
    const wobble = progress > .76 ? Math.sin(egg.progress * 23) * .11 : 0;
    ctx.rotate((egg.child.id % 31) * .092 + wobble);
    ctx.fillStyle = '#171d16a0';
    ellipse(ctx, size * .12, size * .20, size * .78, size * .84);
    ctx.fill();
    const shell = ctx.createRadialGradient(-size * .26, -size * .23, 0, 0, 0, size * 1.08);
    shell.addColorStop(0, '#fffae8');
    shell.addColorStop(.42, tint(skin, 1.71));
    shell.addColorStop(.83, tint(skin, .82));
    shell.addColorStop(1, tint(skin, .49));
    ctx.fillStyle = shell;
    ellipse(ctx, 0, 0, size * .69, size * .94);
    ctx.fill();
    if (scale > .52) {
      ctx.fillStyle = tint(skin, .69);
      for (let spot = 0; spot < 4; spot++) {
        const angle = spot * 2.4 + egg.child.id % 7;
        ellipse(ctx, Math.cos(angle) * size * .36, Math.sin(angle) * size * .49, size * (.06 + spot * .014));
        ctx.fill();
      }
      if (progress > .79) {
        ctx.beginPath();
        ctx.moveTo(-size * .61, -size * .23);
        ctx.lineTo(-size * .25, -size * .04);
        ctx.lineTo(size * .04, -size * .26);
        ctx.lineTo(size * .24, size * .04);
        ctx.lineTo(size * .64, -size * .15);
        ctx.strokeStyle = tint(skin, .41);
        ctx.lineWidth = scale * .7;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawMapTree(tree, planet, x, y, scale, selected) {
    if (!dryGround(planet, tree)) return;
    const height = drawTree(this.ctx, tree, planet, x, y, scale);
    const center = y - height * .53;
    const radius = Math.max(8, height * .57);
    const id = 'tree/' + tree.seed;
    if (selected === id) this.drawSelection(x, center, radius + 2);
    this.hits.push({ x, y: center, radius, id });
  }

  drawAnimalBody(cell, x, y, angle, scale, selected, fraction, land) {
    const size = drawAnimalModel(this.ctx, cell, x, y, angle, scale, fraction, land, MAP_CREATURE_RADIUS);
    if (selected) this.drawSelection(x, y - size * .35, size * 1.6 + 4);
    return size;
  }

  drawPondOutline(pond, camera, planet, invalid) {
    const ctx = this.ctx;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = invalid ? '#ffadab' : '#d7f6ff';
    ctx.beginPath();
    let visible = false;
    for (let i = 0; i <= 32; i++) {
      const angle = i * TAU / 32;
      const edge = pondEdgeScale(pond, angle);
      const point = this.projectSurface({
        x: wrap(pond.x + Math.cos(angle) * pondRadiusX(pond) * edge),
        y: clamp(pond.y + Math.sin(angle) * pondRadiusY(pond) * edge, 0, 1),
      }, camera, planet);
      if (point.depth < 0) { visible = false; continue; }
      if (visible) ctx.lineTo(point.x, point.y);
      else ctx.moveTo(point.x, point.y);
      visible = true;
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawWeather(weather, time) {
    if (weather === 'clear') return;
    const ctx = this.ctx;
    const width = this.width;
    ctx.fillStyle = weather === 'storm' ? '#0918244d' : weather === 'snow' ? '#d4ebff2c' : '#1223391b';
    ctx.fillRect(0, 0, width, H);
    const random = seededRandom(903);
    const snow = weather === 'snow';
    const count = weather === 'storm' ? 155 : 85;
    ctx.strokeStyle = weather === 'storm' ? '#b6dffa70' : '#c4eaff68';
    ctx.fillStyle = '#f1fcffcc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < count; i++) {
      const velocity = snow ? 22 + random() * 20 : 320 + random() * 280;
      const x = (random() * width + time * velocity * (snow ? .37 : -.26) % width + width) % width;
      const y = (random() * H + time * velocity) % H;
      if (snow) {
        ctx.moveTo(x + 1.8, y);
        ctx.arc(x, y, 1.8, 0, TAU);
      } else {
        ctx.moveTo(x, y);
        ctx.lineTo(x - velocity * .014, y + velocity * .041);
      }
    }
    if (snow) ctx.fill();
    else ctx.stroke();
    if (weather === 'storm' && time % 8 > 7.92) {
      ctx.fillStyle = '#d4e5ff25';
      ctx.fillRect(0, 0, width, H);
    }
  }

  drawRemains(remains, x, y, scale) {
    if (remains.mass <= .025) return;
    const ctx = this.ctx;
    const size = (4 + remains.mass * 11) * scale;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((remains.x + remains.y) * 41);
    ctx.globalAlpha = clamp(remains.mass * 1.55, .08, .72);
    ctx.fillStyle = '#29221c';
    ellipse(ctx, 0, 1, size, size * .58);
    ctx.fill();
    ctx.fillStyle = '#d9c8ac';
    ellipse(ctx, -size * .12, 0, size * .61, Math.max(1, size * .16));
    ctx.fill();
    ellipse(ctx, size * .35, -size * .19, size * .26, size * .22);
    ctx.fill();
    ctx.restore();
  }

  drawPond(pond, planet, camera = { x: .5, y: .5, zoom: 1 }, pointer, tool, selected, fraction, time) {
    const ctx = this.ctx;
    const width = this.width;
    const bounds = this.pondBounds(camera);
    const scale = POND_ENTITY_SCALE;
    const visible = ({ x, y }, margin) => x >= -margin && x <= width + margin && y >= -margin && y <= H + margin;
    if (!this.ponds.has(pond)) this.ponds.set(pond, pondBitmap(pond.seed, planetPalette(planet)));
    const texture = this.ponds.get(pond);
    ctx.drawImage(texture, bounds.left * texture.width, bounds.top * texture.height,
      bounds.span * texture.width, bounds.span * texture.height, 0, 0, width, H);
    const light = habitatAt(planet, pond, true).light;
    ctx.fillStyle = `rgba(15, 20, 47, ${(1 - light) ** 2 * .36})`;
    ctx.fillRect(0, 0, width, H);
    const frost = iceCover(planet, pond.y);
    if (frost > .035) {
      const filtered = ctx.createLinearGradient(0, 0, 0, H * .67);
      filtered.addColorStop(0, `rgba(200, 233, 252, ${frost * .42})`);
      filtered.addColorStop(.60, `rgba(169, 214, 248, ${frost * .14})`);
      filtered.addColorStop(1, 'transparent');
      ctx.fillStyle = filtered;
      ctx.fillRect(0, 0, width, H);
    }
    const rng = seededRandom(pond.seed + 101);
    for (let i = 0; i < 37; i++) {
      const position = { x: .04 + rng() * .91 + Math.sin(time * .27 + i) * .02,
        y: .07 + rng() * .86 + Math.cos(time * .45 + i) * .022 };
      const radius = (.9 + rng() * 1.7) * Math.min(scale, 1.8);
      const point = this.projectPond(position, bounds);
      if (!visible(point, radius)) continue;
      ctx.fillStyle = i % 4 ? '#b5f9e126' : '#c3ffed62';
      ellipse(ctx, point.x, point.y, radius);
      ctx.fill();
    }
    for (const dot of pond.food) {
      const point = this.projectPond(dot, bounds);
      if (!visible(point, 7 * scale)) continue;
      ctx.fillStyle = dot.value > .25 ? '#f9dfa47c' : '#b5d4dd67';
      ellipse(ctx, point.x, point.y, (1.5 + dot.value * 3) * scale, 1.5 * scale);
      ctx.fill();
    }
    for (const remains of pond.remains) {
      const point = this.projectPond(remains, bounds);
      if (visible(point, 12 * scale)) this.drawRemains(remains, point.x, point.y, .82 * scale);
    }
    const grass = this.grassFor(planet);
    for (const patch of pond.algae) {
      const point = this.projectPond(patch, bounds);
      if (!visible(point, 36 * scale)) continue;
      const { x, y } = point;
      const radius = this.drawPondPlant(patch, grass, x, y, scale, time);
      const id = 'plant/' + patch.seed;
      if (selected === id) this.drawSelection(x, y, radius + 7);
      this.hits.push({ x, y, radius: Math.max(10, radius), id });
    }
    for (const cell of pond.creatures) {
      const position = { x: cell.px + (cell.x - cell.px) * fraction, y: cell.py + (cell.y - cell.py) * fraction };
      const point = this.projectPond(position, bounds);
      if (!visible(point, 50 * scale)) continue;
      const size = this.drawCreature(cell, point.x, point.y, selected === cell.id, fraction, scale);
      this.noteCreature(cell, point.x, point.y, selected === cell.id);
      this.hits.push({ ...point, radius: Math.max(10, size * 2), id: cell.id });
    }
    if (pointer && (tool === 'cells' || tool === 'plant-cells')) {
      ctx.strokeStyle = tool === 'plant-cells' ? grass.color : '#c0ffde';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ellipse(ctx, pointer.x, pointer.y, 22);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawCreature(cell, x, y, selected, fraction, scale) {
    const heading = headingAt(cell, fraction);
    const angle = Math.atan2(Math.sin(heading) * H, Math.cos(heading) * this.width);
    if (cell.stage >= 2 || cell.anatomy.tissue > .46) {
      return this.drawAnimalBody(cell, x, y, angle, .83 * scale, selected, fraction, false);
    }
    const ctx = this.ctx;
    const size = Math.min(MAP_CREATURE_RADIUS, (5.6 + cell.anatomy.tissue * 8) * creatureSize(cell) * scale);
    if (selected) this.drawSelection(x, y, size + 8);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    const membrane = ctx.createRadialGradient(-size * .22, -size * .30, 0, 0, 0, size);
    membrane.addColorStop(0, cell.genome.color + 'af');
    membrane.addColorStop(.70, cell.genome.color + '73');
    membrane.addColorStop(1, cell.genome.color + '2e');
    ctx.fillStyle = membrane;
    ctx.strokeStyle = cell.genome.color + 'd4';
    ctx.lineWidth = .8;
    this.drawMicrobe(cell, size, cell.pstride + (cell.stride - cell.pstride) * fraction);
    ctx.restore();
    return size;
  }

  drawMicrobe(cell, size, phase) {
    const ctx = this.ctx;
    const { genome } = cell;
    const length = size * (.69 + cell.anatomy.length * .79);
    const breadth = size * (genome.shape === 'ribbon' ? .38 : genome.shape === 'oval' ? .59 : .83);
    if (genome.motion === 'tail') {
      ctx.beginPath();
      ctx.moveTo(-length * .7, 0);
      ctx.bezierCurveTo(-length * 1.15, -size * .55, -length * 1.55, Math.sin(phase) * size, -length * 1.85, size * .13);
      ctx.stroke();
    }
    if (genome.motion === 'cilia') {
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const angle = i * TAU / 12;
        ctx.moveTo(Math.cos(angle) * length * .88, Math.sin(angle) * breadth * .88);
        ctx.lineTo(Math.cos(angle + .12) * (length + size * .22), Math.sin(angle + .12) * (breadth + size * .22));
      }
      ctx.stroke();
    }
    const blobs = cell.stage === 0 ? 1 : clamp(Math.round(2 + cell.anatomy.tissue * 4), 3, 5);
    for (let i = 0; i < blobs; i++) {
      const shift = (i - (blobs - 1) / 2) * size * .57;
      if (genome.shape === 'spiky') {
        ctx.beginPath();
        for (let spike = 0; spike < 18; spike++) {
          const angle = spike * TAU / 18;
          const radius = spike % 2 ? .73 : 1.15;
          ctx.lineTo(shift + Math.cos(angle) * length * radius, Math.sin(angle) * breadth * radius);
        }
        ctx.closePath();
      } else {
        ellipse(ctx, shift, Math.sin(i * 2) * size * .32, length, breadth);
      }
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = genome.nucleus;
    ellipse(ctx, length * .22, 0, size * .28, Math.min(breadth * .79, size * .28));
    ctx.fill();
    ctx.fillStyle = genome.nucleus + 'a0';
    if (genome.pattern === 'spots') {
      ellipse(ctx, -length * .43, breadth * .27, size * .135);
      ctx.fill();
      ellipse(ctx, -length * .1, -breadth * .55, size * .10);
      ctx.fill();
    } else if (genome.pattern === 'bands') {
      ctx.fillRect(-length * .53, -breadth * .57, size * .17, breadth * 1.14);
      ctx.fillRect(-length * .21, -breadth * .65, size * .17, breadth * 1.30);
    } else if (genome.pattern === 'mottled') {
      for (let i = 0; i < 7; i++) {
        ellipse(ctx, Math.sin(i * 1.9) * length * .69, Math.cos(i * 2.6) * breadth * .72,
          size * (.05 + i % 3 * .019));
        ctx.fill();
      }
    }
  }
}
