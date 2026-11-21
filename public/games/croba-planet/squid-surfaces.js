import { BLUE_OCEAN_START_X, BLUE_OCEAN_FLOOR, WORLD_BOUNDS } from "./terrain.js";
import { getSeabedHeight, SEABED_GRID } from "./seabed.js";
import { getForestCollision } from "./forest-terrain.js";
import {NEW_PERIMETER_BOUNDS} from './world-perimeter.js';
import {SULFURIC_PASSAGE,SULFURIC_ARCH,sulfuricPassageWidth} from './sulfuric-biome.js';

/** @typedef {{x:number,y:number,z:number}} Point3 */
/** @typedef {{linkIndex:number,along:number,point:Point3,surfacePoint:Point3,normal:Point3,kind:'seabed'|'stone'|'forest',penetration?:number,correctedPoint?:Point3}} SurfaceContact */
const finite = (p) => Boolean(p && [p.x, p.y, p.z].every(Number.isFinite));
const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const add = (a, b, scale) => ({ x: a.x + b.x * scale, y: a.y + b.y * scale, z: a.z + b.z * scale });
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const stoneCache=new WeakMap();
const legacyBorders=Object.freeze([
  {kind:'stone',x:WORLD_BOUNDS.maxX+90,y:0,rx:90,ry:WORLD_BOUNDS.maxY,baseZ:BLUE_OCEAN_FLOOR,height:360},
  {kind:'stone',x:(BLUE_OCEAN_START_X+WORLD_BOUNDS.maxX)/2,y:WORLD_BOUNDS.minY-90,rx:(WORLD_BOUNDS.maxX-BLUE_OCEAN_START_X)/2,ry:90,baseZ:BLUE_OCEAN_FLOOR,height:360},
  {kind:'stone',x:(BLUE_OCEAN_START_X+WORLD_BOUNDS.maxX)/2,y:WORLD_BOUNDS.maxY+90,rx:(WORLD_BOUNDS.maxX-BLUE_OCEAN_START_X)/2,ry:90,baseZ:BLUE_OCEAN_FLOOR,height:360},
]);

/** Closest point on a finite terrain triangle, including its edges and vertices. */
function closestTriangle(p, a, b, c) {
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a);
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return add(a, ab, d1 / (d1 - d3));
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return add(a, ac, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0)
    return add(b, sub(c, b), (d4 - d3) / (d4 - d3 + d5 - d6));
  const denominator = 1 / (va + vb + vc);
  return add(add(a, ab, vb * denominator), ac, vc * denominator);
}

function triangle(a, b, c) {
  const ab = sub(b, a), ac = sub(c, a);
  const normal = { x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z, z: ab.x * ac.y - ab.y * ac.x };
  const length = Math.hypot(normal.x, normal.y, normal.z);
  return { a, b, c, normal: { x: normal.x / length, y: normal.y / length, z: normal.z / length },
    high: Math.max(a.z, b.z, c.z) };
}

function terrainCell(column, row, cache) {
  const key = `${column}:${row}`;
  if (cache.has(key)) return cache.get(key);
  const { minX, minY, step } = SEABED_GRID;
  const x = minX + column * step, y = minY + row * step;
  const vertex = (dx, dy) => ({ x: x + dx, y: y + dy, z: getSeabedHeight(x + dx, y + dy) });
  const a = vertex(0, 0), b = vertex(step, 0), c = vertex(0, step), d = vertex(step, step);
  const faces = [triangle(a, b, c), triangle(b, d, c)];
  cache.set(key, faces);
  return faces;
}

function stoneFaces(world) {
  const { maxX, minY, maxY } = WORLD_BOUNDS;
  const borders = Array.isArray(world?.borders) ? world.borders : legacyBorders;
  const cached=stoneCache.get(borders);if(cached)return cached;
  const faces = [];
  const push=(a,b,low,high,normal)=>{
    const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy;if(length2<1e-8)return;
    const minX=Math.min(a.x,b.x),maxX=Math.max(a.x,b.x),minY=Math.min(a.y,b.y),maxY=Math.max(a.y,b.y);
    faces.push({a,b,dx,dy,length2,minX,maxX,minY,maxY,low,high,normal,
      arch:Math.abs(a.y-SULFURIC_PASSAGE.frontY)<.001&&Math.abs(b.y-SULFURIC_PASSAGE.frontY)<.001&&minX<SULFURIC_PASSAGE.x+SULFURIC_PASSAGE.halfWidth&&maxX>SULFURIC_PASSAGE.x-SULFURIC_PASSAGE.halfWidth});
  };
  for (const border of borders) {
    if (border?.kind !== "stone") continue;
    const low = Number.isFinite(border.baseZ) ? border.baseZ : BLUE_OCEAN_FLOOR;
    const high = Number.isFinite(border.height) ? border.height : 360;
    if([border.start?.x,border.start?.y,border.end?.x,border.end?.y].every(Number.isFinite)){
      const a=border.start,b=border.end,dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<1e-4)continue;
      const outward=border.outward,normal=outward&&[outward.x,outward.y].every(Number.isFinite)?{x:-outward.x,y:-outward.y,z:0}:{x:-dy/length,y:dx/length,z:0};
      const size=Math.hypot(normal.x,normal.y);if(size<1e-8)continue;normal.x/=size;normal.y/=size;
      push(a,b,low,high,normal);continue;
    }
    if(![border.x,border.y,border.rx,border.ry].every(Number.isFinite))continue;
    if (Math.abs(border.x - border.rx - maxX) < 0.001)
      push({x:maxX,y:border.y-border.ry},{x:maxX,y:border.y+border.ry},low,high,{x:-1,y:0,z:0});
    if (Math.abs(border.y + border.ry - minY) < 0.001)
      push({x:Math.max(BLUE_OCEAN_START_X,border.x-border.rx),y:minY},{x:border.x+border.rx,y:minY},low,high,{x:0,y:1,z:0});
    if (Math.abs(border.y - border.ry - maxY) < 0.001)
      push({x:Math.max(BLUE_OCEAN_START_X,border.x-border.rx),y:maxY},{x:border.x+border.rx,y:maxY},low,high,{x:0,y:-1,z:0});
  }
  stoneCache.set(borders,faces);
  return faces;
}

/** The reserved doorway removes a real polygon from the cliff plane. A capsule
 * inside it can touch its finite rim, but never the missing central face. */
function archSurface(point,surface,wall){
  if(!wall.arch||surface.z<SULFURIC_PASSAGE.floor||surface.z>SULFURIC_PASSAGE.ceiling
    ||Math.abs(surface.x-SULFURIC_PASSAGE.x)>=sulfuricPassageWidth(surface.z))return false;
  let best=Infinity,x=surface.x,z=surface.z;
  for(let i=0;i<SULFURIC_ARCH.length;i++){
    const a=SULFURIC_ARCH[i],b=SULFURIC_ARCH[(i+1)%SULFURIC_ARCH.length],dx=b[0]-a[0],dz=b[1]-a[1];
    const t=clamp(((point.x-SULFURIC_PASSAGE.x-a[0])*dx+(point.z-a[1])*dz)/(dx*dx+dz*dz),0,1);
    const px=SULFURIC_PASSAGE.x+a[0]+dx*t,pz=a[1]+dz*t;if(px<wall.minX-.001||px>wall.maxX+.001)continue;
    const d=(point.x-px)**2+(point.z-pz)**2;if(d<best){best=d;x=px;z=pz;}
  }
  surface.x=x;surface.z=z;return true;
}

function candidate(point, surfacePoint, normal, radius, kind, inside) {
  const distance = Math.hypot(point.x - surfacePoint.x, point.y - surfacePoint.y, point.z - surfacePoint.z);
  const signed = inside ? -distance : distance;
  const contact = { point: { ...point }, surfacePoint: { ...surfacePoint }, normal: { ...normal }, kind };
  const penetration = radius - signed;
  if (penetration > 0.01) {
    contact.penetration = penetration;
    contact.correctedPoint = add(surfacePoint, normal, radius + 0.01);
    const corrected = contact.correctedPoint;
    // A triangle edge can border a higher neighbour: never project a pin below solid ground.
    corrected.z = Math.max(corrected.z, getSeabedHeight(corrected.x, corrected.y) + 0.01);
  }
  return { gap: signed - radius, distance, contact };
}

/** Find one real blue-ocean solid contact for an eight-link adult arm. Regular
 * contacts keep the existing axis point verbatim. Penetrations additionally
 * provide correctedPoint so the solver can project the link before pinning it.
 * @param {{borders?:object[]}} world @param {Point3[]} arm
 * @param {{radius?:number,taper?:number,tolerance?:number}} [options]
 * @returns {SurfaceContact|null}
 */
export function findSquidSurfaceContact(world, arm, options = {}) {
  if (!options || typeof options !== "object") return null;
  const { radius = 45, taper = 0.84, tolerance = 1 } = options;
  if (!world || !Array.isArray(arm) || arm.length !== 9 || !arm.every(finite)
    || ![radius, taper, tolerance].every(Number.isFinite) || radius <= 0 || taper <= 0 || taper > 1 || tolerance < 0) return null;
  const padding=radius+tolerance+6.25,bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};
  for(const point of arm){bounds.minX=Math.min(bounds.minX,point.x);bounds.maxX=Math.max(bounds.maxX,point.x);bounds.minY=Math.min(bounds.minY,point.y);bounds.maxY=Math.max(bounds.maxY,point.y);}
  // Broad phase once per arm, rather than scanning hundreds of cliff faces for
  // every one of the bounded 256 capsule samples.
  const walls = stoneFaces(world).filter(wall=>wall.maxX>=bounds.minX-padding&&wall.minX<=bounds.maxX+padding&&wall.maxY>=bounds.minY-padding&&wall.minY<=bounds.maxY+padding), cache = new Map();
  let queries = 0;
  const evaluate = (linkIndex, along) => {
    if (queries++ >= 256) return null;
    const a = arm[linkIndex], b = arm[linkIndex + 1], point = add(a, sub(b, a), along);
    if (point.x < BLUE_OCEAN_START_X || point.x > NEW_PERIMETER_BOUNDS.maxX + radius
      || point.y < NEW_PERIMETER_BOUNDS.minY - radius || point.y > NEW_PERIMETER_BOUNDS.maxY + radius) return null;
    const localRadius = radius * taper ** linkIndex * (1 - (1 - taper) * along);
    let best = null;
    const accept = (entry) => { if (!best || entry.gap < best.gap) best = entry; };
    const forest = getForestCollision(world, point, localRadius + tolerance + 6.25);
    if (forest) accept(candidate(point, forest.point, forest.normal, localRadius, "forest", forest.inside));
    for (const wall of walls) {
      const extent=localRadius+tolerance+6.25;
      if(point.x<wall.minX-extent||point.x>wall.maxX+extent||point.y<wall.minY-extent||point.y>wall.maxY+extent||point.z<wall.low-extent||point.z>wall.high+extent)continue;
      const along=((point.x-wall.a.x)*wall.dx+(point.y-wall.a.y)*wall.dy)/wall.length2,t=clamp(along,0,1);
      const surface={x:wall.a.x+wall.dx*t,y:wall.a.y+wall.dy*t,z:clamp(point.z,wall.low,wall.high)},opening=archSurface(point,surface,wall);
      const signed=(point.x-wall.a.x)*wall.normal.x+(point.y-wall.a.y)*wall.normal.y;
      const inside=!opening&&signed<0&&along>=0&&along<=1&&point.z>=wall.low&&point.z<=wall.high;
      const delta=sub(point,surface),distance=Math.hypot(delta.x,delta.y,delta.z);if(!inside&&distance>extent)continue;
      const edge=opening||along<0||along>1||point.z<wall.low||point.z>wall.high;
      const normal=!inside&&edge&&distance>1e-8?{x:delta.x/distance,y:delta.y/distance,z:delta.z/distance}:wall.normal;
      accept(candidate(point,surface,normal,localRadius,"stone",inside));
    }
    const { minX, minY, step, columns, rows } = SEABED_GRID;
    const extent = localRadius + tolerance + 6.25;
    const inside = point.z < getSeabedHeight(point.x, point.y) - 0.00001;
    let terrain = null;
    for (let column = clamp(Math.floor((point.x - extent - minX) / step), 0, columns - 2);
      column <= clamp(Math.floor((point.x + extent - minX) / step), 0, columns - 2); column++) {
      for (let row = clamp(Math.floor((point.y - extent - minY) / step), 0, rows - 2);
        row <= clamp(Math.floor((point.y + extent - minY) / step), 0, rows - 2); row++) {
        for (const face of terrainCell(column, row, cache)) {
          if (!inside && point.z > face.high + extent) continue;
          const surface = closestTriangle(point, face.a, face.b, face.c);
          if (surface.x < BLUE_OCEAN_START_X) continue;
          const entry = candidate(point, surface, face.normal, localRadius, "seabed", inside);
          if ((inside || entry.gap <= tolerance + 6.25) && (!terrain || entry.distance < terrain.distance)) terrain = entry;
        }
      }
    }
    if (terrain) accept(terrain);
    if (best) Object.assign(best.contact, { linkIndex, along });
    return best;
  };
  let result = null;
  for (let link = 0; link < 8; link++) {
    const length = Math.hypot(arm[link + 1].x - arm[link].x, arm[link + 1].y - arm[link].y, arm[link + 1].z - arm[link].z);
    const steps = Math.max(1, Math.ceil(length / 12.5));
    if (steps > 128) return null; // Reject severely stretched, nonphysical input rather than doing unbounded work.
    let nearest = null, nearestAlong = 0;
    for (let sample = 0; sample <= steps; sample++) {
      const along = sample / steps, entry = evaluate(link, along);
      if (entry && (!nearest || entry.gap < nearest.gap)) { nearest = entry; nearestAlong = along; }
    }
    // Refine possible between-sample touches; do not turn a hovering near miss into a grip.
    if (nearest && nearest.gap <= tolerance + 6.25) {
      let low = Math.max(0, nearestAlong - 1 / steps), high = Math.min(1, nearestAlong + 1 / steps);
      for (let iteration = 0; iteration < 8; iteration++) {
        const left = low + (high - low) / 3, right = high - (high - low) / 3;
        const a = evaluate(link, left), b = evaluate(link, right);
        if (a && a.gap < nearest.gap) nearest = a;
        if (b && b.gap < nearest.gap) nearest = b;
        if ((a?.gap ?? Infinity) < (b?.gap ?? Infinity)) high = right; else low = left;
      }
      if (nearest.gap <= tolerance && (!result || nearest.gap < result.gap)) result = nearest;
    }
  }
  return result?.contact ?? null;
}
