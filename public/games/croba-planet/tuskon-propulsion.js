import {WATER_LEVEL} from './terrain.js';

/** Metres in the common model frame: Y up, +Z toward the head. */
export const TUSKON_SIPHON_OUTLETS=Object.freeze([
  Object.freeze([-1.38,-.63,-3.6]),Object.freeze([1.38,-.63,-3.6]),
]);
export const TUSKON_SIPHON_AHEAD=Object.freeze([
  Object.freeze([-1.26,-.59,-3.1]),Object.freeze([1.26,-.59,-3.1]),
]);

/** The simulation owns the phase; redraws cannot advance thrust or its wake. */
export function tuskonJetPulse(phase){
  return Math.max(0,Math.sin(Number.isFinite(phase)?phase:0))**2;
}

export function tuskonCruiseSpeed(phase,pursuing=false){
  return (pursuing?180:85)*(.84+.48*tuskonJetPulse(phase));
}

/** Read the actual movement result: blocked or captured animals emit no wake.
 * @param {object} animal @param {boolean} [reducedMotion] @param {object} [target] */
export function getTuskonPropulsionState(animal,reducedMotion=false,target={}){
  const moving=animal&&Number.isFinite(animal.speed)&&animal.speed>1
    &&Number.isFinite(animal.z)&&animal.z+30<WATER_LEVEL
    &&!animal.squidHeldBy&&!(animal.squidRespawnIn>0);
  target.active=Boolean(moving);
  target.pulse=moving?tuskonJetPulse(animal.phase):0;
  target.phase=reducedMotion?0:Number.isFinite(animal?.phase)?animal.phase:0;
  target.length=moving?(reducedMotion?1.1:.65+target.pulse*(animal.state==='pursuing'?4.1:2.5)):0;
  return target;
}
