import {initializeCaveWorms,updateCaveWorms} from './cave-sand-worms.js';
import {getSaltCave,stepSaltCavePlayer} from './salt-cave.js';
import {saltSeepExposure} from './salt-cave-seeps.js';
import {initializeEquipment,updateEquipment,nearbyCopperCargo,interactCopperCargo} from './copper-yoyo.js';
import {initializeCrafting,nearbySalvage,interactSalvage} from './crafting.js';
import {getStructureSupport,resolveStructureMovement,insideUniversalBase,nearbyBaseDoor,interactBaseDoor} from './base-building.js';
import {activeWorldRocks} from './rock-chipping.js';
import {updateBuildPreview} from './tool-actions.js';
import {initializeSulfurLizards,updateSulfurLizards,resolveSulfurLizardBodies} from './sulfur-lizards.js';
import {initializeSandWorms,updateSandWorms,resolveSandWormBodies,notifySandWormJump,clearSandWormHunt} from './sand-worm.js';
import {beginSandWormEncounter,updateSandWormEncounter,releaseSandWormEncounter} from './sand-worm-encounter.js';
import {SULFURIC_LAND,getSulfuricGround,resolveSulfuricRocks} from './sulfuric-biome.js';
import {updateWoodlons,resolveWoodlonBodies} from './woodlons.js';
import {getBasinCave,basinCaveBarrier,stepBasinCavePlayer,playerIsUnderwater} from './basin-caves.js';
import { initializeRedFish, updateRedFish } from './red-fish.js';
import {initializeTuskjawSharks,updateTuskjawSharks} from './tuskjaw-shark.js';
import {updatePenguins,resolvePenguinBodies} from './alien-penguins.js';
import {initializePenguinNests,clearPenguinDefense} from './penguin-nests.js';
import {initializePenguinBrood} from './penguin-lifecycle.js';
import {initializeHogwongHunters} from './hogwong-hunting.js';
import {initializeWildlifeLifecycle,updateWildlifeLifecycle,getWildlifeRenderPopulation} from './wildlife-lifecycle.js';
import { updateHogwongs,resolveHogwongBodies } from './tundra-hogwongs.js';
import { updateVoidFish } from './void-fish.js';
import { updateFrostHounds } from './frost-hounds.js';
import { applyLanternStings } from './lantern-stingers.js';
import { updateLanternJellyfish } from './lantern-jellyfish.js';
import {resolveWreckCollision} from './wreck-collision.js';
import {resolveWorldRockMovement} from './world-rock-collision.js';
import {getOrangeCliffSurface,resolveOrangeCliffMovement} from './orange-cliff-surface.js';
import {resolveLargeGlacierWreckCollision} from './large-glacier-wreck.js';
import {resolveBasinMerchCollision} from './basin-merch-collision.js';
import {resolveCrobanMangoCollision} from './croban-mango-collision.js';
import {resolveBasinWalls} from './icy-basin.js';
import {initializeSurvival,nearbyEdiblePlant,harvestLeaf,nearbyPenguinEgg,takePenguinEgg,updateSurvival} from './survival.js';
import {getIceSurfaceHeight,highestIceAt} from './ice-surface.js';
import {
  EYE_HEIGHT,
  PLAYER_RADIUS,
  SEABED_LEVEL,
  WATER_LEVEL,
  getIceDepth,
  getIceSection,
  getPlatformVertices,
  pointInPolygon,
} from "./terrain.js";
import { loadPreparedWorld } from "./prepared-world.js";
import { confineToWorld, getBiome, getWorldBiome } from "./biomes.js";
import {isOceanBiome} from './shell-field.js';
import { getCrabCollider } from "./crab-size.js";
import { updateCrabMovement } from "./crab-movement.js";
import { updateFauna } from "./fauna.js";
import {groundCentipedeStart} from './centipede.js';
import { getSeabedHeight } from "./seabed.js";
import {getJellyfishSpiresCollision} from './jellyfish-spires.js';
import {submarineBlocksPlayer} from './submarine-player.js';
import { getIceSpikeCollision } from "./ice-spikes.js";
import { resolveSquidMovement, resolveSquidBodies } from "./squid-collision.js";
import { updateSquids } from "./squid-physics.js";
import { updateBestiary } from "./bestiary.js";
import { updateAdultSquids, releaseAdultSquid } from "./adult-squid.js";
import { updateCentipedeEncounter, releaseCentipedeEncounter } from "./centipede-encounter.js";
import { getForestHeight, getForestCollision, resolveForestMovement } from "./forest-terrain.js";
import { updateTreeStalkers, resetTreeStalkers } from "./tree-stalker.js";
import { beginTreeStalkerEncounter, updateTreeStalkerEncounter, releaseTreeStalkerEncounter } from "./tree-stalker-encounter.js";

export { EYE_HEIGHT, SEABED_LEVEL, WATER_LEVEL } from "./terrain.js";
export const SURFACE_FEET = WATER_LEVEL - EYE_HEIGHT + 9;

/** @typedef {{id:string,x:number,y:number,rx:number,ry:number,seed:number,depth?:number,kind?:string,z?:number}} Platform */
/** @typedef {{id:string,x:number,y:number,z:number,kind:string,label:string,collected:boolean}} Discovery */
/** @typedef {{x:number,y:number,z:number,heading:number,warmth:number,oxygen:number,health:number,hunger:number,jumpTime:number,jumpBaseZ?:number,falling?:boolean,fallVelocity?:number,saltCaveId?:string,wetTime:number,jumping:boolean,swimming:boolean,underwater:boolean}} Player */
/** @typedef {{mapId:string,seed:number,plants:import('./plant-renderer.js').PreparedPlant[],seaweed:import('./seaweed-renderer.js').SeaweedPatch[],forest:typeof import('./forest-data.js').PREPARED_FOREST,bestiary:Record<string,{firstSeenAt:number}>,treeStalkers:import('./tree-stalker.js').TreeStalker[],treeStalkerEncounter:import('./tree-stalker-encounter.js').TreeStalkerEncounter|null,player:Player,platforms:Platform[],submergedIce:Platform[],sandWormEncounter:import('./sand-worm-encounter.js').SandWormEncounter|null,wormRumble:number,sandWormThreat:{active:boolean,distance:number,message:string,kind?:string},sandWorms:import('./sand-worm.js').SandWorm[],sulfurLizards:import('./sulfur-lizards.js').SulfurLizard[],tuskjawSharks:import('./tuskjaw-shark.js').TuskjawShark[],redFish:import('./red-fish.js').RedFish[],crabs:import('./archipelago.js').Crab[],borders:import('./biomes.js').Border[],iceSpikes:import('./ice-spikes.js').IceSpike[],tubeCoral:import('./flora.js').TubeCoral[],hangingPlants:import('./flora.js').HangingPlant[],isopods:import('./fauna.js').Isopod[],squids:import('./squid-physics.js').Squid[],adultSquids:import('./squid-physics.js').Squid[],squidEncounter:import('./adult-squid.js').SquidEncounter|null,centipedeEncounter:import('./centipede-encounter.js').CentipedeEncounter|null,centipedes:import('./fauna.js').Centipede[],threat:{active:boolean,distance:number,message:string,kind?:'adult-squid'|'tree-stalker'|'tuskjaw-shark'|'sand-worm'},biome:string,items:Discovery[],ship:{x:number,y:number},beacons:{x:number,y:number}[],collected:number,complete:boolean,elapsed:number,notice:string,noticeTime:number,respawns:number,lastJumpInput:boolean}} World */
/** @typedef {{x:number,y:number,jump?:boolean,ascend?:boolean,dive?:boolean,swimVertical?:number}} Input */

const WALK_SPEED = 150;
const JUMP_SPEED = 205;
const JUMP_DURATION = 0.8;
const SWIM_SPEED = 110;
const VERTICAL_SPEED = 90;
const DEEP_VERTICAL_SPEED = 300;
const LEDGE_REACH = 14;
const INTERACTION_RADIUS = 65;
const FOREST_FALL_GRAVITY = 400;

/** Load an independent expedition from the same prepared level every time. @returns {World} */
export function createWorld() {
  const world=initializeSurvival(loadPreparedWorld());
  initializeEquipment(world);
  initializeCrafting(world);
  initializePenguinNests(world);
  initializePenguinBrood(world);
  initializeRedFish(world);
  initializeTuskjawSharks(world);
  initializeSulfurLizards(world);
  initializeSandWorms(world);
  initializeCaveWorms(world);
  for(const hunter of world.centipedes)groundCentipedeStart(hunter,world.platforms);
  initializeHogwongHunters(world);
  return initializeWildlifeLifecycle(world);
}

/** @param {World} world @param {number} x @param {number} y @returns {Platform | undefined} */
export function getPlatformAt(world, x, y) {
  const support=getStructureSupport(world,x,y);
  if(support!==null&&world.player.z>=support-8)return{id:'built-structure-floor',kind:'structure',x,y,z:support,rx:0,ry:0,seed:0};
  const ice = highestIceAt(world.platforms, x, y);
  const cliff=orangeCliffSupport(world,x,y);
  const z=getLandHeight(world,x,y,cliff?.z??null);
  if(cliff&&cliff.z>=SURFACE_FEET&&cliff.z>=z-1e-6&&(!ice||cliff.z>getIceSurfaceHeight(ice,x,y)))
    return{id:`orange-cliff-${cliff.triangleId}`,kind:'orange-cliff',x,y,z:cliff.z,rx:0,ry:0,seed:0};
  if (ice) return ice;
  return z !== null && z >= SURFACE_FEET
    ? { id: getSulfuricGround(x,y)!==null?SULFURIC_LAND.id:world.forest.id, kind: getSulfuricGround(x,y)!==null?'sulfuric-land':'forest', x, y, z, rx: 0, ry: 0, seed: 0 } : undefined;
}

/** A finite apron is a ceiling, rather than a ground column, while the feet
 * are below its bottom. Its separate body sweep owns any head contact. */
function orangeCliffSupport(world,x,y){
  const surface=getOrangeCliffSurface(x,y,world.borders);
  return surface&&Number.isFinite(surface.low)&&world.player?.z<surface.low-1e-6?null:surface;
}

function getLandHeight(world,x,y,cliffHeight=orangeCliffSupport(world,x,y)?.z??null){
  const forest=getForestHeight(world,x,y),sulfur=getSulfuricGround(x,y);
  const land=forest===null?sulfur:sulfur===null?forest:Math.max(forest,sulfur);
  return cliffHeight===null?land:land===null?cliffHeight:Math.max(land,cliffHeight);
}

function groundHeight(world, x, y) {
  return Math.max(getSeabedHeight(x, y), getLandHeight(world, x, y) ?? -Infinity);
}

/** Follow the baked hills while keeping steep faces solid at walking height. */
function groundForestWalker(world, from) {
  const player = world.player;
  let height = getLandHeight(world, player.x, player.y);
  if (height === null || player.swimming) return;
  const dx = player.x - from.x, dy = player.y - from.y, length = Math.hypot(dx, dy);
  const passable = (fraction) => {
    const ground = getLandHeight(world, from.x + dx * fraction, from.y + dy * fraction);
    const ceiling = player.falling ? Math.max(player.z + 2, from.z)
      : player.jumping ? player.z : from.z + 2 + length * fraction * 0.75;
    return ground === null || ground <= ceiling;
  };
  if (!passable(1)) {
    let safe = 0, blocked = 1;
    for (let iteration = 0; iteration < 16; iteration++) {
      const middle = (safe + blocked) / 2;
      if (passable(middle)) safe = middle; else blocked = middle;
    }
    player.x = from.x + dx * safe; player.y = from.y + dy * safe;
    height = getLandHeight(world, player.x, player.y);
  }
  if (height !== null && !player.jumping && !player.falling) player.z = height;
}

function clearForestFall(player) {
  delete player.falling;
  delete player.fallVelocity;
}

/** Sweep descending jump feet onto real land; a lower hillside cannot pull
 * the explorer down when the original jump arc finishes above its surface.
 * @param {World} world @param {{x:number,y:number,z:number}} from
 */
function resolveJumpLanding(world, from) {
  const player = world.player;
  if (!player.jumping) return;
  const progress = Math.min(1, player.jumpTime / JUMP_DURATION);
  const dx = player.x - from.x, dy = player.y - from.y, dz = player.z - from.z;
  const sample = (fraction) => {
    const x = from.x + dx * fraction, y = from.y + dy * fraction;
    const support = getPlatformAt(world, x, y);
    return { x, y, height: support ? getIceSurfaceHeight(support,x,y) : null,
      feet: from.z + dz * fraction };
  };
  if (progress >= 0.5) {
    const samples = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 4));
    let low = 0;
    for (let index = 0; index <= samples; index++) {
      const fraction = index / samples, candidate = sample(fraction);
      if (candidate.height !== null && candidate.feet <= candidate.height) {
        let high = fraction, safe = low;
        for (let iteration = 0; iteration < 24 && high > safe; iteration++) {
          const middle = (safe + high) / 2, probe = sample(middle);
          if (probe.height !== null && probe.feet <= probe.height) high = middle;
          else safe = middle;
        }
        const contact = sample(high);
        // A taller side wall blocks horizontal motion; it is not a landing
        // surface reached from above during this descending frame.
        if (contact.height !== null && contact.height <= from.z + 1e-6) {
          Object.assign(player, { x: contact.x, y: contact.y, z: contact.height,
            jumping: false, jumpTime: 0 });
          delete player.jumpBaseZ;
          return;
        }
      }
      low = fraction;
    }
  }
  if (progress < 1) return;
  const origin = player.jumpBaseZ ?? from.z;
  Object.assign(player, { jumping: false, jumpTime: 0 });
  delete player.jumpBaseZ;
  if (getPlatformAt(world, player.x, player.y) || origin > 5) {
    player.falling = true;
    player.fallVelocity = -48 * Math.PI / JUMP_DURATION;
  }
}

/** Elevated forest edges fall under gravity; flat ice retains its surface entry. */
function resolveForestFall(world, from, jumpOrigin) {
  const player = world.player;
  if (player.swimming) return;
  const support = getPlatformAt(world, player.x, player.y);
  if (player.falling) {
    const ground = support ? getIceSurfaceHeight(support,player.x,player.y) : null;
    if (ground !== null && player.fallVelocity <= 0 && player.z <= ground) {
      player.z = ground;
      clearForestFall(player);
    } else if (!support && player.z <= SURFACE_FEET) enterWater(world);
    return;
  }
  if (support) return;
  const previousGround = getLandHeight(world, from.x, from.y);
  if ((previousGround ?? jumpOrigin ?? 0) <= 5) return;
  player.falling = true;
  player.fallVelocity = player.jumping
    ? Math.cos(Math.min(1, player.jumpTime / JUMP_DURATION) * Math.PI) * 48 * Math.PI / JUMP_DURATION : 0;
  player.jumping = false;
  player.jumpTime = 0;
  delete player.jumpBaseZ;
}

/** Find the nearest polygon edge and its outward normal. @param {{x:number,y:number}[]} vertices @param {number} x @param {number} y */
function nearestEdge(vertices, x, y) {
  let nearest = { x: 0, y: 0, distance: Infinity, nx: 0, ny: 0 };
  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;
    const t = Math.max(
      0,
      Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSquared),
    );
    const px = a.x + dx * t;
    const py = a.y + dy * t;
    const distance = Math.hypot(x - px, y - py);
    if (distance < nearest.distance) {
      const length = Math.sqrt(lengthSquared);
      nearest = { x: px, y: py, distance, nx: dy / length, ny: -dx / length };
    }
  }
  return nearest;
}

/** Ice sections widen upward, so the player's head determines body clearance. @param {World} world @param {number} x @param {number} y @param {number} z */
function blockingIce(world, x, y, z) {
  if (z >= 0) return null;
  if(getBasinCave(x,y,z,EYE_HEIGHT+PLAYER_RADIUS,PLAYER_RADIUS))return null;
  const caveBarrier=basinCaveBarrier(x,y,z,EYE_HEIGHT,PLAYER_RADIUS);if(caveBarrier)return{caveBarrier};
  const head = z + EYE_HEIGHT + PLAYER_RADIUS;
  for (const floe of [...world.platforms, ...world.submergedIce]) {
    const top = floe.z ?? 0;
    if (
      head <= top - getIceDepth(floe) ||
      z >= top ||
      Math.abs(x - floe.x) > floe.rx + PLAYER_RADIUS ||
      Math.abs(y - floe.y) > floe.ry + PLAYER_RADIUS
    )
      continue;
    const vertices = getIceSection(floe, Math.min(top, head) - top);
    const edge = nearestEdge(vertices, x, y);
    const inside = pointInPolygon(vertices, x, y);
    if (inside || edge.distance < PLAYER_RADIUS)
      return { floe, vertices, edge, inside };
  }
  const spikeHit = getIceSpikeCollision(world.iceSpikes ?? [], x, y, z, EYE_HEIGHT, PLAYER_RADIUS);
  return spikeHit ? { spikeHit } : null;
}

/** Slide a swimmer outside a wall without crossing the glacier's body. @param {World} world @param {number} x @param {number} y @param {number} z */
function outsideIce(world, x, y, z) {
  for (let pass = 0; pass < 3; pass += 1) {
    const obstacle = blockingIce(world, x, y, z);
    if (!obstacle) break;
    if(obstacle.caveBarrier){
      let safe=0,blocked=1;for(let i=0;i<16;i++){const t=(safe+blocked)/2;if(blockingIce(world,world.player.x+(x-world.player.x)*t,world.player.y+(y-world.player.y)*t,z))blocked=t;else safe=t;}
      x=world.player.x+(x-world.player.x)*safe;y=world.player.y+(y-world.player.y)*safe;break;
    }
    if (obstacle.spikeHit) {
      ({ x, y } = obstacle.spikeHit.escape);
      continue;
    }
    const { edge, inside } = obstacle;
    let nx = inside ? edge.x - x : x - edge.x;
    let ny = inside ? edge.y - y : y - edge.y;
    const length = Math.hypot(nx, ny);
    if (length > 1e-8) {
      nx /= length;
      ny /= length;
    } else {
      nx = edge.nx;
      ny = edge.ny;
    }
    x = edge.x + nx * (PLAYER_RADIUS + 0.01);
    y = edge.y + ny * (PLAYER_RADIUS + 0.01);
  }
  return { x, y };
}

/** Crab bodies are solid and passive; their legs leave room to pass. @param {World} world */
function resolveCrabBodies(world) {
  const player = world.player;
  const head = player.z + EYE_HEIGHT + PLAYER_RADIUS;
  for (const crab of getWildlifeRenderPopulation(world,'crab')) {
    if (crab.lifecycleInactive || crab.squidHeldBy || crab.squidRespawnIn > 0) continue;
    const collider = getCrabCollider(crab);
    if (head <= collider.bottom || player.z >= collider.top)
      continue;
    const dx = player.x - crab.x;
    const dy = player.y - crab.y;
    const distance = Math.hypot(dx, dy);
    const radius = collider.radius + PLAYER_RADIUS;
    if (distance >= radius) continue;
    const heading = Number.isFinite(player.heading) ? player.heading : 0;
    const nx = distance > 1e-8 ? dx / distance : Math.cos(heading);
    const ny = distance > 1e-8 ? dy / distance : Math.sin(heading);
    player.x = crab.x + nx * (radius + 0.01);
    player.y = crab.y + ny * (radius + 0.01);
  }
}

/** @param {World} world @param {string} message */
function announce(world, message) {
  world.notice = message;
  world.noticeTime = 6;
}

/** @param {World} world */
function enterWater(world) {
  const player = world.player;
  Object.assign(player, {
    swimming: true,
    underwater: false,
    jumping: false,
    jumpTime: 0,
    z: SURFACE_FEET,
  });
  delete player.jumpBaseZ;
  clearForestFall(player);
  Object.assign(player, outsideIce(world, player.x, player.y, player.z));
  announce(
    world,
    "You’re swimming. Hold C or Shift to dive; hold Space to rise. Watch your oxygen underwater.",
  );
}

/** @param {World} world */
function rescue(world, reason = "Oxygen depleted") {
  releaseAdultSquid(world);
  releaseCentipedeEncounter(world);
  releaseTreeStalkerEncounter(world);
  releaseSandWormEncounter(world);
  resetTreeStalkers(world);
  clearPenguinDefense(world);
  clearSandWormHunt(world);
  Object.assign(world.player, {
    x: world.spawn?.x ?? 0,
    y: world.spawn?.y ?? 50,
    z: world.spawn?.z ?? 0,
    hunger: 65,
    warmth: 75,
    oxygen: 100,
    health: 100,
    jumpTime: 0,
    wetTime: 0,
    jumping: false,
    swimming: false,
    underwater: false,
  });
  delete world.player.jumpBaseZ;
  clearForestFall(world.player);
  world.biome = "arctic";
  world.lanternStingCooldown = 0;
  world.threat = { active: false, distance: Infinity, message: "" };
  world.respawns += 1;
  announce(
    world,
    `${reason}. Your rescue tether brought you back to the crash site. Your discoveries are saved.`,
  );
}

/** @param {World} world @returns {boolean} */
export function jumpPlayer(world) {
  const player = world.player;
  if (
    world.sandWormEncounter || world.centipedeEncounter || world.squidEncounter ||
    player.swimming || player.falling ||
    player.jumping ||
    !getPlatformAt(world, player.x, player.y)
  )
    return false;
  player.jumping = true;
  player.jumpTime = 0;
  player.jumpBaseZ = player.z;
  notifySandWormJump(world);
  return true;
}

/** Pull a surfacing swimmer over a nearby lip of ice. @param {World} world @param {number} x @param {number} y @param {number} vertical @param {boolean} diving */
function climbLedge(world, x, y, vertical, diving) {
  const player = world.player;
  if (diving || player.z < SURFACE_FEET - 10) return false;
  // The body radius meets a rock toe before its centre enters the top face.
  // Probe the existing short hand reach, then plant the feet just inside that
  // same visible ledge. Deeply embedded or higher faces are never pulled up.
  const travel=Math.hypot(x-player.x,y-player.y);
  if(travel>1e-6||vertical>0){
    const vx=travel>1e-6?(x-player.x)/travel:Math.cos(player.heading??0);
    const vy=travel>1e-6?(y-player.y)/travel:Math.sin(player.heading??0);
    for(let reach=0;reach<=LEDGE_REACH;reach++){
      const edge=getOrangeCliffSurface(x+vx*reach,y+vy*reach,world.borders);
      if(!edge||edge.z<SURFACE_FEET||edge.z>player.z+LEDGE_REACH||edge.normal.z<1/Math.sqrt(1+.65**2))continue;
      const px=x+vx*(reach+PLAYER_RADIUS+1),py=y+vy*(reach+PLAYER_RADIUS+1);
      const top=getOrangeCliffSurface(px,py,world.borders);
      if(!top||top.z<SURFACE_FEET||top.z>player.z+LEDGE_REACH||top.normal.z<1/Math.sqrt(1+.65**2))continue;
      const candidate={x:px,y:py,z:top.z},clear=resolveOrangeCliffMovement(candidate,candidate,EYE_HEIGHT,PLAYER_RADIUS,world.borders);
      if(Math.hypot(clear.x-px,clear.y-py)>1e-4||Math.abs(clear.z-top.z)>1e-4)continue;
      Object.assign(player,candidate,{swimming:false,underwater:false,wetTime:0,jumping:false,jumpTime:0});
      clearForestFall(player);delete player.jumpBaseZ;
      return true;
    }
  }
  const forestHeight = getLandHeight(world, x, y);
  if (forestHeight !== null && forestHeight >= SURFACE_FEET && forestHeight <= player.z + LEDGE_REACH) {
    Object.assign(player, { x, y, z: forestHeight, swimming: false, underwater: false,
      wetTime: 0, jumping: false, jumpTime: 0 });
    return true;
  }
  for (const floe of world.platforms) {
    if (
      Math.abs(x - floe.x) > floe.rx + LEDGE_REACH ||
      Math.abs(y - floe.y) > floe.ry + LEDGE_REACH
    )
      continue;
    const vertices = getPlatformVertices(floe);
    const edge = nearestEdge(vertices, x, y);
    const movingIntoLand =
      (x !== player.x || y !== player.y) &&
      (pointInPolygon(vertices, x, y) ||
        (edge.x - player.x) * (x - player.x) +
          (edge.y - player.y) * (y - player.y) >
          0);
    if (edge.distance > LEDGE_REACH || (vertical <= 0 && !movingIntoLand))
      continue;
    const towardCenter = Math.hypot(floe.x - edge.x, floe.y - edge.y);
    Object.assign(player, {
      x: edge.x + ((floe.x - edge.x) / towardCenter) * 10,
      y: edge.y + ((floe.y - edge.y) / towardCenter) * 10,
      z: 0,
      swimming: false,
      underwater: false,
      wetTime: 0,
      jumping: false,
      jumpTime: 0,
    });
    player.z = getIceSurfaceHeight(floe,player.x,player.y);
    announce(world, "Back on the ice. The ocean is still yours to explore.");
    return true;
  }
  return false;
}

/** Block steep seabed faces until the swimmer rises above them. Gentle hills support the feet. */
function outsideSeabed(world, player, x, y, z) {
  const dx = x - player.x;
  const dy = y - player.y;
  const distance = Math.hypot(dx, dy);
  const passable = (fraction) => {
    const px = player.x + dx * fraction, py = player.y + dy * fraction;
    if (groundHeight(world, px, py) > z + distance * fraction * 0.65 + 0.001) return false;
    if (blockingOceanStructure(px,py,z)) return false;
    // Stay a full player radius outside a vertical coastal wall. The submerged
    // beach itself still supports ordinary feet-on-sand swimming and entry.
    if (getForestHeight(world, px, py) === null) for (const height of [5, EYE_HEIGHT / 2, EYE_HEIGHT - 5]) {
      const hit = getForestCollision(world, { x: px, y: py, z: z + height }, PLAYER_RADIUS);
      if (hit && hit.penetration > 0.001) return false;
    }
    return true;
  };
  if (!passable(1)) {
    let safe = 0;
    let blocked = 1;
    for (let iteration = 0; iteration < 18; iteration += 1) {
      const middle = (safe + blocked) / 2;
      if (passable(middle)) safe = middle;
      else blocked = middle;
    }
    x = player.x + dx * safe;
    y = player.y + dy * safe;
  }
  return { x, y, z: Math.max(z, groundHeight(world, x, y)) };
}

/** Test the swimmer's body against actual volcanic rock and submarine metal. */
function blockingOceanStructure(x,y,z){
  return submarineBlocksPlayer(x,y,z)||[PLAYER_RADIUS,EYE_HEIGHT/2,EYE_HEIGHT-PLAYER_RADIUS].some(height=>
    getJellyfishSpiresCollision({x,y,z:z+height},PLAYER_RADIUS)?.penetration>.001);
}

/** @param {World} world @param {Input} input @param {number} dx @param {number} dy @param {number} delta */
function swim(world, input, dx, dy, delta) {
  const player = world.player;
  const analog = Number.isFinite(input.swimVertical) ? input.swimVertical : 0;
  const vertical = Math.max(
    -1,
    Math.min(
      1,
      analog + (input.ascend || input.jump ? 1 : 0) - (input.dive ? 1 : 0),
    ),
  );
  const x = player.x + dx * SWIM_SPEED * delta;
  const y = player.y + dy * SWIM_SPEED * delta;
  const verticalSpeed = isOceanBiome(getWorldBiome(world, player.x, player.y, true))
    ? DEEP_VERTICAL_SPEED : VERTICAL_SPEED;
  let z = Math.max(
    groundHeight(world, player.x, player.y),
    Math.min(SURFACE_FEET, player.z + vertical * verticalSpeed * delta),
  );
  if (climbLedge(world, x, y, vertical, Boolean(input.dive) || vertical < 0))
    return;

  // Stop at both submerged tops and undersides instead of crossing solid ice.
  if (z !== player.z && blockingIce(world, player.x, player.y, z)) {
    let safe = player.z;
    let blocked = z;
    for (let iteration = 0; iteration < 16; iteration += 1) {
      const middle = (safe + blocked) / 2;
      if (blockingIce(world, player.x, player.y, middle)) blocked = middle;
      else safe = middle;
    }
    z = safe;
  }
  if(z!==player.z&&blockingOceanStructure(player.x,player.y,z)){
    let safe=player.z,blocked=z;
    for(let i=0;i<16;i++){const middle=(safe+blocked)/2;if(blockingOceanStructure(player.x,player.y,middle))blocked=middle;else safe=middle;}
    z=safe;
  }
  const clear = outsideIce(world, x, y, z);
  Object.assign(player, outsideSeabed(world, player, clear.x, clear.y, z));
  player.wetTime += delta;
}

/** Advance the simulation in seconds, with bounded frame steps. @param {World} world @param {Input} input @param {number} dt @param {{reducedMotion?:boolean,look?:{yaw:number,pitch:number}}} [options] */
export function updateWorld(world, input, dt, options = {}) {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const delta = Math.min(dt, 0.05);
  const player = world.player;
  world.elapsed += delta;
  updateWildlifeLifecycle(world,delta);
  updateLanternJellyfish(world, delta);
  updateCrabMovement(world, delta);
  updateRedFish(world, delta);
  updateCaveWorms(world);
  world.noticeTime = Math.max(0, world.noticeTime - delta);

  if(world.sandWormEncounter){
    const eaten=updateSandWormEncounter(world,delta);updateBestiary(world);
    if(eaten)rescue(world,'Eaten by the Crobonic Artic Sulfur Worm');return;
  }

  if (world.treeStalkerEncounter) {
    const drained = updateTreeStalkerEncounter(world, delta);
    updateBestiary(world);
    if (drained) rescue(world, "Drained by a Tree Stalker");
    return;
  }

  if (world.centipedeEncounter) {
    updateFauna(world, delta);
    updateSquids(world, delta);
    const eaten = updateCentipedeEncounter(world, delta);
    updateBestiary(world);
    if (eaten) rescue(world, "Eaten by the ice centipede");
    return;
  }

  // The gripping tentacle owns movement until the brief feeding sequence ends.
  // Menu/bestiary pause still freezes this branch by withholding simulation ticks.
  if (world.squidEncounter) {
    updateFauna(world, delta);
    updateSquids(world, delta);
    const eaten = updateAdultSquids(world, delta);
    updateBestiary(world);
    player.underwater = playerIsUnderwater(player);
    if (eaten) rescue(world, "Eaten by the adult Artic Crobonic Squid");
    return;
  }

  updateSurvival(world,delta,Boolean(input.x||input.y));
  updateEquipment(world,delta,options.look);

  const rawX = Number.isFinite(input.x) ? input.x : 0;
  const rawY = Number.isFinite(input.y) ? input.y : 0;
  const length = Math.max(1, Math.hypot(rawX, rawY));
  const dx = rawX / length;
  const dy = rawY / length;
  const beforeMovement = { x: player.x, y: player.y, z: player.z };
  const previousSaltCave=player.saltCaveId;
  const previousCave=player.basinCaveId;
  const caveMoved=stepSaltCavePlayer(world,input,dx,dy,delta,getSulfuricGround)||stepBasinCavePlayer(world,input,dx,dy,delta);
  if(!caveMoved){
    // New raised rock can intersect an older expedition pose. Clear that body
    // sideways before swimming/ground support can pull it onto a distant top.
    Object.assign(player,resolveOrangeCliffMovement(player,player,EYE_HEIGHT,PLAYER_RADIUS,world.borders));
    Object.assign(beforeMovement,{x:player.x,y:player.y,z:player.z});
    const jumpPressed = Boolean(input.jump);
    if (jumpPressed && !world.lastJumpInput && !player.swimming)
      jumpPlayer(world);
    world.lastJumpInput = jumpPressed;
    const jumpOrigin = player.jumpBaseZ;
    if (dx || dy) player.heading = Math.atan2(dy, dx);

    if (player.swimming){
      swim(world,input,dx,dy,delta);
      // Like the existing ice hand-pull, a short assisted rock ledge entry is
      // already body-clear. Subsequent sweeps begin at its planted position.
      if(!player.swimming&&getPlatformAt(world,player.x,player.y)?.kind==='orange-cliff')
        Object.assign(beforeMovement,{x:player.x,y:player.y,z:player.z});
    }
    else {
      const speed = player.jumping ? JUMP_SPEED : WALK_SPEED;
      player.x += dx * speed * delta;
      player.y += dy * speed * delta;
      if (player.falling) {
        const velocity = player.fallVelocity ?? 0;
        player.z += velocity * delta - FOREST_FALL_GRAVITY * delta * delta / 2;
        player.fallVelocity = velocity - FOREST_FALL_GRAVITY * delta;
      } else if (player.jumping) {
        player.jumpTime += delta;
        const progress = Math.min(1, player.jumpTime / JUMP_DURATION);
        player.z =
          (player.jumpBaseZ ?? 0) + (progress < 1 ? Math.sin(progress * Math.PI) * 48 : 0);
      }
    }

    resolveJumpLanding(world, beforeMovement);
    groundForestWalker(world, beforeMovement);
    resolveBasinWalls(world);
    if (!player.swimming && !player.jumping && !player.falling) {
      const ice = highestIceAt(world.platforms,player.x,player.y);
      if (ice) player.z = getIceSurfaceHeight(ice,player.x,player.y);
    }
    Object.assign(player, resolveForestMovement(world, beforeMovement, player, EYE_HEIGHT, PLAYER_RADIUS));
    if (!player.swimming && !player.jumping && !player.falling) {
      const forestHeight = getLandHeight(world, player.x, player.y);
      if (forestHeight !== null) player.z = forestHeight;
    }

    resolveWreckCollision(world);
    resolveCrabBodies(world);
    resolveHogwongBodies(world,getWildlifeRenderPopulation(world,'hogwong'));
    resolvePenguinBodies(world);
    resolveWoodlonBodies(world,getWildlifeRenderPopulation(world,'woodlon'));
    resolveLargeGlacierWreckCollision(world,beforeMovement);
    resolveBasinMerchCollision(world);
    resolveCrobanMangoCollision(world);
    resolveSulfuricRocks(player,PLAYER_RADIUS);
    resolveSulfurLizardBodies(world,getWildlifeRenderPopulation(world,'sulfur-lizard'));
    resolveSandWormBodies(world);
    Object.assign(player, resolveSquidMovement(world, beforeMovement, player));
    Object.assign(player,resolveWorldRockMovement(beforeMovement,player,EYE_HEIGHT,PLAYER_RADIUS,activeWorldRocks(world).rocks));
    Object.assign(player,resolveStructureMovement(world,beforeMovement,player));
    const cliffCandidateZ=player.z;
    Object.assign(player,resolveOrangeCliffMovement(beforeMovement,player,EYE_HEIGHT,PLAYER_RADIUS,world.borders));
    if(!player.swimming&&player.z>cliffCandidateZ+1e-6&&beforeMovement.z>=player.z-1e-6){
      player.jumping=false;player.jumpTime=0;delete player.jumpBaseZ;clearForestFall(player);
    }
    if (player.swimming)
      player.z = Math.max(player.z, getSeabedHeight(player.x, player.y));
    const atBorder = confineToWorld(player);
    if (atBorder && world.noticeTime <= 0)
      announce(world, getBiome(player.x) === "arctic"
        ? "Towering icebergs block the edge of the Arctic. Explore east toward the blue ocean."
        : "Stone cliffs mark the ocean’s outer edge. Follow the rocky ledges and climbing slopes along the coast.");
    resolveForestFall(world, beforeMovement, jumpOrigin);
    if (
      !player.swimming &&
      !player.jumping &&
      !player.falling &&
      !getPlatformAt(world, player.x, player.y)
    )
      enterWater(world);

  }
  const saltCave=getSaltCave(player.x,player.y,player.z,EYE_HEIGHT);
  if(saltCave){player.saltCaveId='salt-cave';if(!previousSaltCave)announce(world,'Salt Cave. Scorched mineral halls and hot sulfur seeps. Avoid bubbling patches; they burn your suit.');}
  else delete player.saltCaveId;
  const cave=getBasinCave(player.x,player.y,player.z,EYE_HEIGHT);
  if(cave){player.basinCaveId=cave.cave.id;if(previousCave!==cave.cave.id)announce(world,cave.cave.name+'. A submerged passage opens into a sheltered air pocket and ancient bone nests. Dive down through the low entrance to leave.');}
  else delete player.basinCaveId;
  player.underwater = playerIsUnderwater(player);
  updateBuildPreview(world,options.look);
  const biome = getWorldBiome(world, player.x, player.y, player.underwater);
  if (biome !== world.biome) {
    world.biome = biome;
    announce(world, biome === "purple-forest"
      ? "Violet Spruce Forest biome. Purple woodland, sheltered clearings, and a trail through the hills."
      : biome === 'salt-cave' ? 'Salt Cave. Hot sulfur seeps cloud the mineral halls. Avoid bubbling ground. The cliff and geyser shaft remain your exits.'
      : biome === 'sulfuric-land' ? 'Sulfuric Land. Vast mineral hills, geyser ponds and a burrowing armored sand worm. The southern arch returns to Shell Field.'
      : biome === 'jellyfish-spires' ? 'Jellyfish Spires. Deep volcanic towers rise from charcoal gravel. Purple lantern jellies drift beside barnacle-covered stone.'
      : biome === "blue-ocean"
      ? "Blue ocean biome. Dark water, orange cliffs, and Gold Rock Bugs below the waves."
      : biome === 'shell-field' ? 'Shell Field. A long pale-stone shelf slopes into the deep ocean, with schools of red and gray fish.'
      : biome === "blue-kelp-forest" ? "Blue Kelp Forest. Tall cobalt fronds sway above the cold Arctic seabed."
      : biome === "orange-grass-field" ? "Orange Grass Field. Amber seagrass meadows ripple between the ice islands."
      : biome === "cliff-biome" ? "Cliff Biome. Bare wind-scoured ice above; branching swimmable fissures in the sandy seabed below."
      : biome === "iceberg-tundra" ? "Icy Basin. Frozen white plants and natural ice walls form winding passages through the snow."
      : "Arctic biome. Broken ice, towering glaciers, and one giant hunting centipede.");
  }
  updateSulfurLizards(world,delta);
  const wormBitten=updateSandWorms(world,delta);
  const bitingWorm=wormBitten&&world.sandWorms.find(worm=>worm.id===world.lastSandWormBiterId);
  if(bitingWorm&&player.health<=0&&beginSandWormEncounter(world,bitingWorm)){updateBestiary(world);return;}
  if(wormBitten)announce(world,'Crobonic Artic Sulfur Worm strike! Dodge sideways and leave the mineral ground to escape.');
  updateFauna(world, delta);
  if (world.centipedeEncounter) {
    updateBestiary(world);
    return;
  }
  updateSquids(world, delta);
  resolveSquidBodies(world);
  updateAdultSquids(world, delta, resolveSquidBodies);
  const stalker = updateTreeStalkers(world, delta);
  if (stalker.active && !world.threat?.active) {
    world.threat = { active: true, kind: stalker.kind, distance: stalker.distance, message: stalker.message };
  }
  for (const contact of stalker.contacts) {
    const hunter = world.treeStalkers.find((animal) => animal.id === contact.id);
    if (hunter && beginTreeStalkerEncounter(world, hunter)) break;
  }
  updateBestiary(world);
  if (world.squidEncounter || world.treeStalkerEncounter) {
    player.underwater = playerIsUnderwater(player);
    return;
  }
  updateHogwongs(world,delta);
  updateWoodlons(world,delta,getWildlifeRenderPopulation(world,'woodlon'));
  updatePenguins(world,delta);
  const penguinBitten=world.penguinBitten===true;
  if(penguinBitten)announce(world,'Crobon Birds are defending their eggs! Leave the nest colony to escape.');
  const voidBitten = updateVoidFish(world,delta);
  if (voidBitten) announce(world,"Void Fish bite! Swim up away from the deep seabed to escape.");
  const bitten = updateFrostHounds(world,delta);
  if (bitten) announce(world,"Frost Hound bite! Leave the orange grass field or surface to escape.");
  const sharkBitten=updateTuskjawSharks(world,delta,options);
  if(sharkBitten)announce(world,'Crobonic Tuskon bite! Swim away from its jaws.');
  if(world.sandWormThreat?.active)world.threat={...world.sandWormThreat};
  const stung = applyLanternStings(world,delta,options.reducedMotion);
  if (stung) announce(world,"Giant lantern jellyfish sting! Move away from its trailing stingers.");
  const seepExposure=saltSeepExposure(player),sulfurBurned=seepExposure>0;
  if(sulfurBurned){
    player.health=Math.max(0,player.health-seepExposure*5*delta);
    if(!(world.saltSeepExposure>0))announce(world,'HOT SULFUR SEEP — move away from the bubbling ground or swim higher.');
  }
  world.saltSeepExposure=seepExposure;
  const oxygenUse = isOceanBiome(biome)||biome==='salt-cave' ? 0.2 : 1;
  player.oxygen = Math.max(
    0,
    Math.min(100, player.oxygen + (player.underwater ? -oxygenUse : 24) * delta),
  );
  const nearHeat =
    !player.swimming &&
    (Boolean(insideUniversalBase(world))||Math.hypot(player.x - world.ship.x, player.y - world.ship.y) < (world.ship.heatRadius ?? 130) ||
      world.beacons.some(
        (beacon) => Math.hypot(player.x - beacon.x, player.y - beacon.y) < 70,
      ));
  player.warmth = Math.max(
    0,
    Math.min(100, player.warmth + (nearHeat ? 14 : (biome === "purple-forest"||biome==='sulfuric-land') && !player.swimming ? 0.8 : -0.035) * delta),
  );
  if (nearHeat && player.health > 0 && player.hunger > 0)
    player.health = Math.min(100, player.health + 6 * delta);
  if (player.oxygen <= 0) rescue(world);
  else if (player.health <= 0) rescue(world, player.hunger<=0 ? "Starvation" : sulfurBurned ? "Burned by a hot sulfur seep" : wormBitten ? "Bitten by the Crobonic Artic Sulfur Worm" : penguinBitten ? "Driven off by nesting Crobon Birds" : voidBitten ? "Bitten by a Void Fish" : bitten ? "Bitten by a Frost Hound" : sharkBitten ? "Bitten by a Crobonic Tuskon" : stung ? "Stung by a giant lantern jellyfish" : "Suit breached by an ice centipede");
}

/** @param {World} world @returns {Discovery | undefined} */
function nearbyDiscovery(world) {
  const player = world.player;
  return world.items.find(
    (item) =>
      !item.collected &&
      Math.hypot(item.x - player.x, item.y - player.y, item.z - player.z) <
        INTERACTION_RADIUS,
  );
}

/** @param {World} world @returns {{text:string,key:'E',kind:'discover'|'wreck'|'harvest'|'egg'|'cargo'|'base-door'} | null} */
export function currentPrompt(world) {
  if (world.player.jumping || world.sandWormEncounter || world.centipedeEncounter || world.squidEncounter || world.treeStalkerEncounter) return null;
  const door=nearbyBaseDoor(world);if(door)return{text:`${door.doorOpen?'Close':'Open'} Universal Base door`,key:'E',kind:'base-door'};
  const cargo=nearbyCopperCargo(world);if(cargo)return{text:world.copperCargo.opened?'Take copper yo-yo':'Open COPPERSTUDIO cargo',key:'E',kind:'cargo'};
  const salvage=nearbySalvage(world);if(salvage)return{text:`Pick up ${salvage.label.toLowerCase()}`,key:'E',kind:'salvage'};
  const item = nearbyDiscovery(world);
  if(item)return {
        text: `Record ${item.label.toLowerCase()}`,
        key: "E",
        kind: item.kind === "wreck" ? "wreck" : "discover",
      };
  if(nearbyPenguinEgg(world))return {text:'Take Crobon Bird egg · colony will attack',key:'E',kind:'egg'};
  const plant=nearbyEdiblePlant(world);
  return plant ? {text:plant.food==='croban-mango'?'Pick a Croban mango':'Rip off an edible leaf',key:'E',kind:'harvest'} : null;
}

/** Record a discovery or collect nearby food/cargo through the shared keyboard/touch action. @param {World} world @returns {boolean} */
export function interact(world) {
  if (!currentPrompt(world)) return false;
  if(nearbyBaseDoor(world))return interactBaseDoor(world);
  if(nearbyCopperCargo(world))return interactCopperCargo(world);
  if(nearbySalvage(world))return interactSalvage(world);
  const item = nearbyDiscovery(world);
  if (!item) return nearbyPenguinEgg(world)?takePenguinEgg(world):harvestLeaf(world);
  item.collected = true;
  world.collected = world.items.filter((entry) => entry.collected).length;
  world.complete = world.collected === world.items.length;
  announce(
    world,
    world.complete
      ? "All three discoveries recorded. Keep exploring the ice and the ocean."
      : `${item.label} recorded. ${world.items.length - world.collected} discoveries remain.`,
  );
  return true;
}

/** Reset in place so the renderer can retain its world reference. @param {World} world @returns {World} */
export function resetWorld(world) {
  Object.assign(world, createWorld());
  initializeWildlifeLifecycle(world);
  return world;
}
