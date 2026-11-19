import {getSaltCave} from './salt-cave.js';
import {CLIFF_CANYON_GRID as CLIFF_REGION} from './cliff-canyon-data.js';
import {isSulfuricLand,confineSulfuricWorld} from './sulfuric-biome.js';
import {isShellField} from './shell-field.js';
import { highestIceAt } from './ice-surface.js';
import { getArcticGarden } from './arctic-gardens.js';
import { createFlora } from "./flora.js";
import { getIceSpikes } from "./ice-spikes.js";
import { isForestAt } from "./forest-terrain.js";
import { BLUE_OCEAN_START_X, BLUE_OCEAN_FLOOR, SEABED_LEVEL, WORLD_BOUNDS } from "./terrain.js";
export { BLUE_OCEAN_START_X, WORLD_BOUNDS } from "./terrain.js";

/** @typedef {{id:string,x:number,y:number,rx:number,ry:number,kind:'iceberg'|'stone',height:number,baseZ:number,seed:number}} Border */

/** @param {number} x @returns {'arctic'|'blue-ocean'} */
export function getBiome(x) {
  return x >= BLUE_OCEAN_START_X ? "blue-ocean" : "arctic";
}

/** The forest is a separate surface biome with its own exact prepared boundary.
 * Submerged coastal water keeps the blue ocean's dive rules.
 * @param {object} world @param {number} x @param {number} y
 * @param {boolean} [underwater] @returns {'arctic'|'blue-ocean'|'shell-field'|'salt-cave'|'sulfuric-land'|'purple-forest'|'blue-kelp-forest'|'orange-grass-field'|'iceberg-tundra'|'cliff-biome'}
 */
export function getWorldBiome(world, x, y, underwater = false) {
  if(world.player&&x===world.player.x&&y===world.player.y&&getSaltCave(x,y,world.player.z))return 'salt-cave';
  if(isSulfuricLand(x,y))return 'sulfuric-land';
  if(underwater&&x>=CLIFF_REGION.minX&&x<=CLIFF_REGION.maxX&&y>=CLIFF_REGION.minY&&y<=CLIFF_REGION.maxY)return 'cliff-biome';
  const ice=highestIceAt(world.platforms??[],x,y);
  if(ice?.biome==='cliff-biome')return 'cliff-biome';
  if(!underwater&&ice?.biome==='iceberg-tundra')return 'iceberg-tundra';
  if (isForestAt(world, x, y)) return underwater ? "blue-ocean" : "purple-forest";
  if(underwater&&isShellField(x,y))return 'shell-field';
  return underwater && world.arcticGardens ? getArcticGarden(x,y)?.region.id ?? getBiome(x) : getBiome(x);
}

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

/** Continuous perimeter walls, with their inner faces exactly at WORLD_BOUNDS. */
export function createBorders(seed) {
  const rng = random(seed ^ 0xb0ade7);
  /** @type {Border[]} */
  const borders = [];
  const add = (x, y, rx, ry, kind) => borders.push({
    id: `border-${borders.length}`, x, y, rx, ry, kind,
    baseZ: kind === "stone" ? BLUE_OCEAN_FLOOR : SEABED_LEVEL,
    height: (kind === "iceberg" ? 190 : 140) + rng() * 220,
    seed: Math.floor(rng() * 0x100000000),
  });
  const { minX, maxX, minY, maxY } = WORLD_BOUNDS;
  for (const [start, end, kind] of [
    [minX - 180, BLUE_OCEAN_START_X, "iceberg"],
    [BLUE_OCEAN_START_X, maxX + 180, "stone"],
  ]) {
    const count = Math.ceil((end - start) / 200);
    const width = (end - start) / count;
    for (let i = 0; i < count; i += 1) {
      const x = start + width * (i + 0.5);
      add(x, minY - 90, width / 2, 90, kind);
      add(x, maxY + 90, width / 2, 90, kind);
    }
  }
  const rows = Math.ceil((maxY - minY) / 200);
  const height = (maxY - minY) / rows;
  for (let i = 0; i < rows; i += 1) {
    const y = minY + height * (i + 0.5);
    add(minX - 90, y, 90, height / 2, "iceberg");
    add(maxX + 90, y, 90, height / 2, "stone");
  }
  return borders;
}

/** Keep all ice west of the warm sea and give the 60m hunter a broad glacier. */
export function createBiomes(archipelago) {
  const glacier = {
    id: "hunting-glacier", x: -1550, y: -1050,
    rx: 1050, ry: 700, depth: 220, kind: "glacier", seed: 7841,
  };
  // A stable stepping floe connects the giant's glacier to the seeded ice field.
  const crossing = {
    id: "crossing-floe-0", x: -1100, y: -350,
    rx: 110, ry: 85, depth: 80, kind: "island", seed: 2043,
  };
  const clearOfShelf = (floe) =>
    Math.abs(floe.x - glacier.x) > floe.rx + glacier.rx + 35 ||
    Math.abs(floe.y - glacier.y) > floe.ry + glacier.ry + 35;
  const iceOnly = (floe) => floe.x + floe.rx < BLUE_OCEAN_START_X;
  const platforms = archipelago.platforms.filter((floe) =>
    iceOnly(floe) && clearOfShelf(floe) &&
    Math.hypot(floe.x - crossing.x, floe.y - crossing.y) >
      Math.max(floe.rx, floe.ry) + Math.max(crossing.rx, crossing.ry) + 25);
  platforms.push(glacier, crossing);
  const submergedIce = archipelago.submergedIce.filter((chunk) =>
    iceOnly(chunk) && clearOfShelf(chunk));
  const landIds = new Set(platforms.map((floe) => floe.id));
  const crabs = archipelago.crabs.filter((crab) =>
    crab.habitat === "seabed" || landIds.has(crab.platformId));
  const iceSpikes = [...platforms, ...submergedIce].flatMap(getIceSpikes);
  const flora = createFlora(platforms, submergedIce, archipelago.seed);
  return { platforms, submergedIce, crabs, iceSpikes, ...flora,
    borders: createBorders(archipelago.seed) };
}

/** The authored arch is the only extension through the original perimeter. */
export function confineToWorld(player, radius = 5) {
  return confineSulfuricWorld(player,radius);
}
