import { EYE_HEIGHT, WATER_LEVEL } from './terrain.js';
import { closestSquidSegments } from './squid-collision.js';
import { getLanternMotion } from './lantern-motion.js';

export const LANTERN_ARMS = 6;
export const LANTERN_LINKS = 7;
export const LANTERN_STING_DAMAGE = 18;
export const LANTERN_STING_INTERVAL = 1.25;

/** Authoritative waving tentacle centerline, in simulation coordinates (Z up).
 * Rendering and stinger contacts share every bend, including motion phase. */
export function lanternTentaclePoint(fish, arm, joint, target = {}, reducedMotion = false) {
  const motion = getLanternMotion(fish,reducedMotion), t = motion.armTime, phase = motion.armPhase;
  const angle = arm*Math.PI*2/LANTERN_ARMS, w = joint/LANTERN_LINKS, r = fish.headRadius;
  target.x = fish.x+Math.cos(angle)*r*.72+Math.sin(t*.8+phase+angle+joint*.48)*r*.30*w*motion.armAmplitude;
  target.y = fish.y+Math.sin(angle)*r*.72+Math.cos(t*.65+phase+angle+joint*.5)*r*.26*w*motion.armAmplitude;
  target.z = fish.z-r*.18-fish.tentacleLength*w;
  return target;
}

/** Only the trailing, pale-tipped five links of each giant's tentacles sting.
 * A shared contact cooldown prevents overlapping arms from multiplying damage. */
export function applyLanternStings(world, dt, reducedMotion = false) {
  if (!Number.isFinite(dt) || dt <= 0) return false;
  world.lanternStingCooldown = Math.max(0,(world.lanternStingCooldown ?? 0)-dt);
  const player = world.player;
  if (!player?.swimming || player.z+EYE_HEIGHT >= WATER_LEVEL || world.lanternStingCooldown > 1e-8
    || !Number.isFinite(player.health) || player.health <= 0) return false;
  const feet = {x:player.x,y:player.y,z:player.z+5};
  const head = {...feet,z:player.z+EYE_HEIGHT-5};
  const a = {}, b = {};
  for (const fish of world.jellyfish ?? []) {
    if (!fish.giant || fish.squidHeldBy || fish.squidRespawnIn > 0) continue;
    if (Math.hypot(player.x-fish.x,player.y-fish.y)>fish.headRadius*1.1+12
      || head.z<fish.z-fish.tentacleLength-fish.headRadius || feet.z>fish.z) continue;
    for (let arm=0;arm<LANTERN_ARMS;arm++) for (let link=2;link<LANTERN_LINKS;link++) {
      lanternTentaclePoint(fish,arm,link,a,reducedMotion);lanternTentaclePoint(fish,arm,link+1,b,reducedMotion);
      const pair=closestSquidSegments(feet,head,a,b);
      const radius=5+fish.headRadius*.035*(1-link/LANTERN_LINKS*.55);
      if (Math.hypot(pair.a.x-pair.b.x,pair.a.y-pair.b.y,pair.a.z-pair.b.z)>radius) continue;
      player.health=Math.max(0,player.health-LANTERN_STING_DAMAGE);
      world.lanternStingCooldown=LANTERN_STING_INTERVAL;
      return true;
    }
  }
  return false;
}
