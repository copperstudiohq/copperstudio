import { EYE_HEIGHT } from "./terrain.js";

export const CENTIPEDE_BITE_SECONDS = 0.6;
export const CENTIPEDE_EATING_SECONDS = 1.8;
export const CENTIPEDE_RESCUE_COOLDOWN = 4;
const states = new WeakMap();
const finitePoint = (p) => p && [p.x, p.y, p.z].every(Number.isFinite);
const copy = (p) => ({ x: p.x, y: p.y, z: p.z });
const widthOf = (hunter) => hunter.lengthMeters >= 50 ? 21.25 : 7.5;

/** @typedef {{x:number,y:number,z:number}} Point3 */
/** @typedef {{hunterId:string,phase:'bitten'|'eating',elapsed:number,progress:number,target:Point3,cameraPosition?:Point3}} CentipedeEncounter */

/** The same local X-forward/Y-up frame used by the physical head's renderer. */
function framePoint(hunter, forward, up) {
  const origin = hunter?.segments?.[0] ?? hunter;
  if (!finitePoint(origin)) return null;
  const heading = Number.isFinite(hunter.heading) ? hunter.heading : 0;
  const pitch = Number.isFinite(hunter.pitch) ? hunter.pitch : 0;
  const horizontal = forward * Math.cos(pitch) - up * Math.sin(pitch);
  return { x: origin.x + Math.cos(heading) * horizontal,
    y: origin.y + Math.sin(heading) * horizontal,
    z: origin.z + forward * Math.sin(pitch) + up * Math.cos(pitch) };
}

/** Actual centre of the mandibles in simulation coordinates, including climbs. */
export function getCentipedeMouth(hunter) {
  return framePoint(hunter, widthOf(hunter ?? {}) * 1.8, widthOf(hunter ?? {}) * 0.4);
}

/** Start one lethal bite; terrain, water, jump and shelter checks stay in fauna. */
export function beginCentipedeEncounter(world, hunter) {
  if (!world || !finitePoint(world.player) || !hunter || typeof hunter.id !== "string"
    || world.sandWormEncounter || world.centipedeEncounter || world.squidEncounter || world.treeStalkerEncounter) return false;
  const target = getCentipedeMouth(hunter);
  if (!target) return false;
  const start = { x: world.player.x, y: world.player.y, z: world.player.z + EYE_HEIGHT };
  world.centipedeEncounter = { hunterId: hunter.id, phase: "bitten", elapsed: 0, progress: 0,
    target, cameraPosition: copy(start) };
  world.player.health = 0;
  states.set(world, { encounter: world.centipedeEncounter, start, age: 0, finished: false });
  return true;
}

function blend(a, b, amount) {
  const t = Math.max(0, Math.min(1, amount)), smooth = t * t * (3 - 2 * t);
  return { x: a.x + (b.x - a.x) * smooth, y: a.y + (b.y - a.y) * smooth,
    z: a.z + (b.z - a.z) * smooth };
}

/** Clear the sequence on rescue/cancel and give its frozen head a short cooldown. */
export function releaseCentipedeEncounter(world) {
  if (!world || typeof world !== "object") return;
  const hunterId = world.centipedeEncounter?.hunterId;
  const hunter = world.centipedes?.find((entry) => entry?.id === hunterId);
  if (hunter) hunter.attackCooldown = Math.max(hunter.attackCooldown || 0, CENTIPEDE_RESCUE_COOLDOWN);
  world.centipedeEncounter = null;
  states.delete(world);
}

/** Advance only the cinematic camera. Player feet remain on their safe terrain.
 * Returns true once after the bite and eating phases have both completed.
 */
export function updateCentipedeEncounter(world, dt) {
  if (!world || !Number.isFinite(dt) || dt <= 0 || !world.centipedeEncounter) return false;
  const encounter = world.centipedeEncounter;
  const hunter = world.centipedes?.find((entry) => entry?.id === encounter.hunterId);
  const target = getCentipedeMouth(hunter);
  if (!hunter || !target || !finitePoint(world.player)) { releaseCentipedeEncounter(world); return false; }
  let state = states.get(world);
  if (!state || state.encounter !== encounter) {
    const start = finitePoint(encounter.cameraPosition) ? copy(encounter.cameraPosition)
      : { x: world.player.x, y: world.player.y, z: world.player.z + EYE_HEIGHT };
    state = { encounter, start, age: 0, finished: false }; states.set(world, state);
  }
  if (state.finished) return false;
  state.age += Math.min(dt, 0.05);
  const width = widthOf(hunter), origin = hunter.segments?.[0] ?? hunter;
  const outside = framePoint(hunter, width * 1.8 + 45, width * 0.4);
  encounter.target = target;
  if (state.age < CENTIPEDE_BITE_SECONDS - 1e-9) {
    encounter.phase = "bitten"; encounter.elapsed = state.age;
    encounter.progress = Math.min(1, state.age / CENTIPEDE_BITE_SECONDS);
    const raised = { ...state.start, z: Math.max(state.start.z, origin.z + width * 3.2) };
    const forward = framePoint(hunter, width * 2.8, width * 3.2);
    const points = [state.start, raised, forward, outside], part = encounter.progress * 3;
    const index = Math.min(2, Math.floor(part));
    encounter.cameraPosition = blend(points[index], points[index + 1], part - index);
  } else {
    encounter.phase = "eating";
    encounter.elapsed = Math.max(0, state.age - CENTIPEDE_BITE_SECONDS);
    encounter.progress = Math.min(1, encounter.elapsed / CENTIPEDE_EATING_SECONDS);
    encounter.cameraPosition = blend(outside, target, encounter.progress);
  }
  encounter.cameraPosition.z = Math.max(origin.z + 5, encounter.cameraPosition.z);
  if (state.age + 1e-9 >= CENTIPEDE_BITE_SECONDS + CENTIPEDE_EATING_SECONDS) {
    encounter.progress = 1; state.finished = true; return true;
  }
  return false;
}
