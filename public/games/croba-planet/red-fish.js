import { PREPARED_RED_FISH } from './red-fish-data.js';
import { PREPARED_RED_FISH_VARIANTS } from './red-fish-variant-data.js';
import {PREPARED_SHELL_FIELD_FISH} from './shell-field-placements.js';
import {shellFieldClearance} from './shell-field.js';
import { WATER_LEVEL, WORLD_BOUNDS, BLUE_OCEAN_START_X, getIceDepth, getIceSection, getPlatformVertices, pointInPolygon } from './terrain.js';
import { ARCTIC_GARDEN_REGIONS } from './arctic-gardens.js';
import { getSeabedHeight } from './seabed.js';
import { getForestCollision } from './forest-terrain.js';
import { findIsopodSurfaceContact } from './isopod-surface.js';
import { wreckBodyPenetration } from './wreck-collision.js';
import { getIceSpikeCollision } from './ice-spikes.js';
import { updateRedFishTendrils } from './red-fish-tendril-physics.js';

/** @typedef {{id:string,x:number,y:number,z:number,homeX:number,homeY:number,homeZ:number,
 * heading:number,pitch?:number,seed:number,lengthMeters:number,variant:'small'|'large'|'gray'|'glow',
 * habitat:'starter'|'orange-grass-field'|'blue-ocean'|'shell-field',vx?:number,vy?:number,vz?:number,
 * squidHeldBy?:string,squidRespawnIn?:number,tendrilNodes?:import('./red-fish-tendril-physics.js').TendrilNode[][]}} RedFish */

const grass = ARCTIC_GARDEN_REGIONS.find(region => region.id === 'orange-grass-field');
const states = new WeakMap(), iceLists = new WeakMap(), spikeIndexes = new WeakMap();
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const wrap = n => Math.atan2(Math.sin(n), Math.cos(n));
const MARGIN = 1;
// All rendered fish fit within the 70 m renderer budget, plus a full-model
// margin. Outside 80 m, stagger safe short steps at 4 Hz instead of running
// expensive obstacle avoidance and filament physics on every simulation tick.
export const RED_FISH_ACTIVE_DISTANCE=2000,RED_FISH_DISTANT_INTERVAL=.25;
const finitePoint=p=>p&&[p.x,p.y,p.z].every(Number.isFinite);
const distantPhase=fish=>{
 let hash=2166136261;for(const letter of fish.id??'')hash=Math.imul(hash^letter.charCodeAt(0),16777619)>>>0;
 return hash/4294967296*RED_FISH_DISTANT_INTERVAL;
};

/** Conservative full-model sphere, in simulation units (25 units = one metre). */
export function getRedFishRadius(fish) { return .64 * fish.lengthMeters * 25; }

function edgeDistance(vertices, x, y) {
  let distance = Infinity;
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length], dx = b.x - a.x, dy = b.y - a.y;
    const t = clamp(((x-a.x)*dx + (y-a.y)*dy) / (dx*dx + dy*dy), 0, 1);
    distance = Math.min(distance, Math.hypot(x-a.x-dx*t, y-a.y-dy*t));
  }
  return distance;
}

function nearbySpikes(world,x,y,radius) {
  let cells=spikeIndexes.get(world);
  if (!cells) {
    cells=new Map();spikeIndexes.set(world,cells);
    for (const spike of world.iceSpikes ?? []) {
      const r=spike.radius;
      for(let cx=Math.floor((spike.x-r)/100);cx<=Math.floor((spike.x+r)/100);cx++)
        for(let cy=Math.floor((spike.y-r)/100);cy<=Math.floor((spike.y+r)/100);cy++) {
          const key=`${cx}:${cy}`, list=cells.get(key) ?? [];
          if(!cells.has(key))cells.set(key,list);list.push(spike);
        }
    }
  }
  const found=new Set();
  for(let cx=Math.floor((x-radius)/100);cx<=Math.floor((x+radius)/100);cx++)
    for(let cy=Math.floor((y-radius)/100);cy<=Math.floor((y+radius)/100);cy++)
      for(const spike of cells.get(`${cx}:${cy}`) ?? [])found.add(spike);
  return [...found];
}

/** A complete large animal must remain inside its authored grass habitat. */
export function redFishInHabitat(fish, x = fish.x, y = fish.y) {
  if(fish.habitat==='shell-field')return fish.variant!=='glow'&&shellFieldClearance(x,y)>getRedFishRadius(fish)+MARGIN;
  if(fish.variant==='glow'&&shellFieldClearance(x,y)>=-getRedFishRadius(fish)-MARGIN)return false;
  if (fish.habitat === 'blue-ocean') return x > BLUE_OCEAN_START_X + getRedFishRadius(fish) + MARGIN;
  if (fish.variant !== 'large' && fish.habitat !== 'orange-grass-field') return true;
  return pointInPolygon(grass.boundary, x, y)
    && edgeDistance(grass.boundary, x, y) > getRedFishRadius(fish) + MARGIN;
}

/** Collision uses the actual seabed, glaciers, spikes, rock triangles and wreck.
 * A sphere includes the dangling filaments at every swimming orientation.
 */
export function redFishWaterClear(world, fish, x = fish.x, y = fish.y, z = fish.z) {
  const radius = getRedFishRadius(fish) + MARGIN;
  if (![x,y,z,radius].every(Number.isFinite) || radius <= 0 || z + radius >= WATER_LEVEL
    || x-radius <= WORLD_BOUNDS.minX || x+radius >= WORLD_BOUNDS.maxX
    || y-radius <= WORLD_BOUNDS.minY || y+radius >= WORLD_BOUNDS.maxY || !redFishInHabitat(fish,x,y)) return false;
  if (z-radius <= getSeabedHeight(x,y)) return false;
  let ice = iceLists.get(world);
  if (!ice) {
    ice = [...(world.platforms ?? []), ...(world.submergedIce ?? [])].map(chunk => {
      const vertices=getPlatformVertices(chunk);
      return {chunk,minX:Math.min(...vertices.map(p=>p.x)),maxX:Math.max(...vertices.map(p=>p.x)),
        minY:Math.min(...vertices.map(p=>p.y)),maxY:Math.max(...vertices.map(p=>p.y))};
    });
    iceLists.set(world,ice);
  }
  for (const {chunk,minX,maxX,minY,maxY} of ice) {
    const top = chunk.z ?? 0, bottom = top - getIceDepth(chunk);
    if (z+radius < bottom || z-radius > top || x+radius < minX || x-radius > maxX
      || y+radius < minY || y-radius > maxY) continue;
    const section = getIceSection(chunk, Math.min(0,z+radius-top));
    if (pointInPolygon(section,x,y) || edgeDistance(section,x,y) < radius) return false;
  }
  const centre = {x,y,z};
  if (getIceSpikeCollision(nearbySpikes(world,x,y,radius),x,y,z-radius,radius*2,radius)) return false;
  if (getForestCollision(world,centre,radius)) return false;
  if (wreckBodyPenetration(world.ship,centre,{radius,height:radius*2,bottom:-radius}) > 0) return false;
  return !findIsopodSurfaceContact(world,centre,radius);
}

/** Clone literal placements; initialization and reset never choose new spawns. */
export function initializeRedFish(world) {
  world.redFish = [...PREPARED_RED_FISH, ...PREPARED_RED_FISH_VARIANTS,...PREPARED_SHELL_FIELD_FISH].map(fish => ({...fish,vx:0,vy:0,vz:0,pitch:0}));
  return world.redFish;
}

function direction(heading,pitch) {
  const c = Math.cos(pitch);
  return {x:Math.cos(heading)*c,y:Math.sin(heading)*c,z:Math.sin(pitch)};
}

function targetFor(fish,time) {
  const large = fish.variant === 'large', radius = large ? 220 : 85, phase = fish.seed + time * (large ? .011 : .06);
  return {x:fish.homeX + Math.cos(phase)*radius,y:fish.homeY + Math.sin(phase*.87)*radius,
    z:fish.homeZ + Math.sin(phase*.73)*(large ? 30 : 20)};
}

function escapeCourse(world,fish,state,goalHeading,speed) {
  const reach=Math.max(getRedFishRadius(fish)*1.2,speed*2);
  let best=-Infinity;
  for(const turn of [0,.5,-.5,1,-1,1.6,-1.6,2.3,-2.3,Math.PI]) {
    for(const pitch of [0,.4,-.4,.8,-.8,1.2,-1.2]) {
      const heading=fish.heading+turn,d=direction(heading,pitch);
      // Check the very next physical step too. A clear distant ray endpoint can
      // lie beyond a narrow tooth while the first step is still obstructed.
      const first=speed*.05;
      if(!redFishWaterClear(world,fish,fish.x+d.x*first,fish.y+d.y*first,fish.z+d.z*first))continue;
      let clear=0;
      for(let i=1;i<=4;i++) {
        const distance=reach*i/4;
        if(!redFishWaterClear(world,fish,fish.x+d.x*distance,fish.y+d.y*distance,fish.z+d.z*distance))break;
        clear=distance;
      }
      if(clear===0)continue;
      const score=clear/reach*3+Math.cos(wrap(heading-goalHeading))*.4-Math.abs(turn)*.07-Math.abs(pitch)*.1;
      if(score>best) {
        best=score;state.escapeHeading=heading;state.escapePitch=pitch;
      }
    }
  }
  if(best===-Infinity)return false;
  // Commit to the open corridor while turning. Re-picking a different side on
  // every blocked frame can balance the two turns forever at a glacial corner.
  state.escapeUntil=state.time+(fish.variant==='large'?5:2.5);
  return true;
}

function steer(world,fish,state,dt) {
  const large = fish.variant === 'large', speed = (large ? .22 : fish.variant === 'gray' ? .4 : .6)*25;
  const goal = targetFor(fish,state.time), dx = goal.x-fish.x, dy = goal.y-fish.y;
  let heading = Math.atan2(dy,dx), pitch = clamp(Math.atan2(goal.z-fish.z,Math.hypot(dx,dy)),-.5,.5);
  let escaping=state.escapeUntil>state.time;
  if (escaping) { heading=state.escapeHeading;pitch=state.escapePitch; }
  // Look ahead with the full body before approaching a shore or ice tooth. A
  // bounded turn can happen in clear water without displacing the animal.
  const look = getRedFishRadius(fish) + speed * 1.3;
  const desired = direction(heading,pitch);
  if (!escaping && !redFishWaterClear(world,fish,fish.x+desired.x*look,fish.y+desired.y*look,fish.z+desired.z*look)
    && escapeCourse(world,fish,state,heading,speed)) {
    heading=state.escapeHeading;pitch=state.escapePitch;escaping=true;
  }
  const turnRate = large ? .75 : 1.8;
  fish.heading = wrap(fish.heading+clamp(wrap(heading-fish.heading),-turnRate*dt,turnRate*dt));
  fish.pitch = (fish.pitch ?? 0)+clamp(pitch-(fish.pitch ?? 0),-dt,dt);
  const d = direction(fish.heading,fish.pitch), step = speed*dt;
  const x=fish.x+d.x*step,y=fish.y+d.y*step,z=fish.z+d.z*step;
  if (redFishWaterClear(world,fish,x,y,z)) {
    fish.x=x;fish.y=y;fish.z=z;
    fish.vx=d.x*speed;fish.vy=d.y*speed;fish.vz=d.z*speed;
  } else {
    fish.vx=fish.vy=fish.vz=0;
    if (escaping && Math.abs(wrap(heading-fish.heading))<.01 && Math.abs(pitch-fish.pitch)<.01)
      state.escapeUntil=state.time; // The corridor ended; do not wait out its timer against a wall.
    if (!escaping) escapeCourse(world,fish,state,heading,speed);
  }
}

/** Authoritative swimming: heading=atan2(vy,vx), pitch positive up. Render
 * front is -Z, so yaw=-heading-PI/2. No random spawns or positional clamps.
 */
export function updateRedFish(world, delta) {
  if (!Number.isFinite(delta) || delta <= 0 || world.paused) return;
  const dt = Math.min(delta,.05),player=world.player,hasPlayer=finitePoint(player);
  const prey=new Set();
  for(const group of [world.adultSquids,world.squids])for(const squid of group??[])
    if(squid.feeding?.preyId)prey.add(squid.feeding.preyId);
  for (const fish of world.redFish ?? []) {
    if (fish.squidHeldBy || fish.squidRespawnIn > 0) continue;
    let state=states.get(fish);
    if (!state) { state={time:0,distantPhase:distantPhase(fish)};state.distantAge=state.distantPhase;states.set(fish,state); }
    state.time+=dt;
    const nearby=!hasPlayer||Math.hypot(fish.x-player.x,fish.y-player.y,fish.z-player.z-36)
      <=RED_FISH_ACTIVE_DISTANCE+getRedFishRadius(fish);
    if(!nearby&&!prey.has(fish.id)){
      state.distantAge+=dt;
      if(state.distantAge<RED_FISH_DISTANT_INTERVAL)continue;
      state.distantAge%=RED_FISH_DISTANT_INTERVAL;
    }else state.distantAge=state.distantPhase;
    // Never catch up a large distant time debt: re-entering visible range takes
    // only this normal physical step; the existing filament solver resumes nearby.
    steer(world,fish,state,dt);
    updateRedFishTendrils(world,fish,dt);
  }
}
