import { BLUE_OCEAN_START_X, pointInPolygon } from './terrain.js';

/** Fixed seabed biomes beneath the Arctic. Surface ice retains its cold climate. */
export const ARCTIC_GARDEN_REGIONS = Object.freeze([
  { id: 'blue-kelp-forest', name: 'Blue Kelp Forest', color: 0x397eb5,
    boundary: [[-5650,-4900],[-4200,-5350],[-2500,-5100],[-900,-5400],[650,-4400],
      [820,-2900],[450,-1700],[-650,-1300],[-2300,-1850],[-3700,-1450],[-5350,-2200]] },
  { id: 'orange-grass-field', name: 'Orange Grass Field', color: 0xc77b3b,
    boundary: [[-5600,850],[-4200,420],[-2800,700],[-1600,250],[300,650],[850,1950],
      [550,3500],[-400,5100],[-2400,5300],[-4100,4900],[-5600,3700]] },
].map(region => Object.freeze({...region, boundary: Object.freeze(region.boundary.map(
  ([x,y]) => Object.freeze({x,y})))})));

/** Smooth edge influence for sediment colors and prepared vegetation density. */
export function getArcticGarden(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x >= BLUE_OCEAN_START_X) return null;
  for (const region of ARCTIC_GARDEN_REGIONS) {
    if (!pointInPolygon(region.boundary, x, y)) continue;
    let distance = Infinity;
    region.boundary.forEach((a, index) => {
      const b = region.boundary[(index + 1) % region.boundary.length];
      const dx = b.x-a.x, dy = b.y-a.y;
      const t = Math.max(0, Math.min(1, ((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy)));
      distance = Math.min(distance, Math.hypot(x-a.x-dx*t, y-a.y-dy*t));
    });
    const t = Math.min(1, distance/240);
    return {region, blend: t*t*(3-2*t)};
  }
  return null;
}
