import { squidLocalToWorld } from './squid-frame.js';

export const SQUID_PREY_RESPAWN_SECONDS = 12;
const GROUPS = ['penguins', 'hogwongs', 'voidFish', 'frostHounds', 'jellyfish', 'redFish', 'tuskjawSharks', 'sulfurLizards', 'sandWorms', 'crabs', 'isopods', 'squids', 'centipedes', 'treeStalkers', 'adultSquids'];
const states = new WeakMap();
const finite = p => p && [p.x,p.y,p.z].every(Number.isFinite);
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const copy = p => ({x:p.x,y:p.y,z:p.z});
export const unavailablePrey = animal => Boolean(animal?.lifecycleInactive || animal?.squidHeldBy || animal?.squidRespawnIn > 0);

function stateFor(world) {
  let state = states.get(world);
  if (!state || state.adults !== world.adultSquids) {
    state = { adults:world.adultSquids, homes:new Map(), hunts:new Map(), cooldown:new Map(), scan:new Map() };
    for (const group of GROUPS) for (const animal of world[group] ?? [])
      if (finite(animal)) state.homes.set(animal, structuredClone(animal));
    states.set(world,state);
  }
  return state;
}

/** Translate the whole animal, including its physical limbs and old solver pose. */
function place(animal, point) {
  const delta={x:point.x-animal.x,y:point.y-animal.y,z:point.z-animal.z},seen=new Set();
  const visit = value => {
    if (!value || typeof value!=='object' || seen.has(value)) return;
    seen.add(value);
    if (finite(value)) for(const axis of ['x','y','z']) {
      value[axis]+=delta[axis];
      for(const prefix of ['p','s']) if(Number.isFinite(value[prefix+axis]))value[prefix+axis]+=delta[axis];
    }
    for(const key of ['tentacles','segments','feet','points']) {
      const children=value[key];if(Array.isArray(children))children.flat().forEach(visit);
    }
  };
  visit(animal);
}

function restore(state, animal) {
  const home=state.homes.get(animal);
  if(!home)return;
  // Feeding restores navigation, while the independent life-cycle clock owns
  // age, growth, courtship and whether this original adult slot is alive.
  const lifecycle=Object.fromEntries(Object.entries(animal).filter(([key])=>key.startsWith('lifecycle')));
  for(const key of Object.keys(animal))delete animal[key];
  Object.assign(animal,structuredClone(home),lifecycle);
}

export function updateSquidPreyRespawns(world,dt) {
  const state=stateFor(world);
  for (const [squid] of state.hunts) if (unavailablePrey(squid)) cancel(state,squid);
  for(const [animal] of state.homes) if(animal.squidRespawnIn>0) {
    animal.squidRespawnIn=Math.max(0,animal.squidRespawnIn-dt);
    if(!animal.squidRespawnIn)restore(state,animal);
  }
  for(const [squid,left]of state.cooldown)state.cooldown.set(squid,Math.max(0,left-dt));
}

function cancel(state,squid) {
  const hunt=state.hunts.get(squid);
  if(hunt?.prey.squidHeldBy===squid.id)restore(state,hunt.prey);
  state.hunts.delete(squid);delete squid.feeding;squid.huntingPrey=false;
}

/** All wildlife species are eligible, but only reachable, unclaimed animals
 * can be grabbed. Scan once a second; never regenerate or remove descriptors. */
export function chooseSquidPrey(world,squid,dt,playerPriority=false) {
  const state=stateFor(world);
  let hunt=state.hunts.get(squid);
  if(hunt && (unavailablePrey(squid) || !finite(hunt.prey)
    || hunt.prey.lifecycleInactive || hunt.prey.squidRespawnIn>0 || hunt.prey.squidHeldBy && hunt.prey.squidHeldBy!==squid.id
    || playerPriority && !hunt.held || (hunt.age+=dt)>25)) { cancel(state,squid);hunt=null; }
  if(!hunt && !playerPriority && !unavailablePrey(squid) && !state.cooldown.get(squid)) {
    const scan=(state.scan.get(squid)??0)-dt;state.scan.set(squid,scan);
    if(scan<=0) {
      state.scan.set(squid,1);
      const choices=GROUPS.flatMap(group=>world[group]??[]).filter(prey=>prey!==squid && finite(prey)
        && !unavailablePrey(prey) && prey.id!==world.squidEncounter?.squidId
        && prey.id!==world.treeStalkerEncounter?.stalkerId && prey.id!==world.centipedeEncounter?.hunterId && prey.id!==world.sandWormEncounter?.wormId
        && distance(squid,prey)<1100).sort((a,b)=>distance(squid,a)-distance(squid,b)).slice(0,4);
      if(choices.length) {
        squid.foragingChoice=(squid.foragingChoice??0)+1;
        const prey=choices[((squid.seed??0)+squid.foragingChoice)%choices.length];
        if(!state.homes.has(prey))state.homes.set(prey,structuredClone(prey));
        hunt={prey,held:false,age:0,target:copy(prey),armIndex:null,phase:'pursuing',elapsed:0};
        state.hunts.set(squid,hunt);
      }
    }
  }
  if(!hunt){squid.huntingPrey=false;return null;}
  if(!hunt.held)hunt.target=copy(hunt.prey);
  squid.huntingPrey=true;
  squid.feeding={squidId:squid.id,preyId:hunt.prey.id,phase:hunt.phase,progress:hunt.elapsed/2};
  return hunt;
}

export function advanceSquidFeeding(world,squid,dt,mouth) {
  const state=stateFor(world),hunt=state.hunts.get(squid);
  if(!hunt)return;
  if(!hunt.held) {
    const arm=squid.tentacles[squid.activeArm];
    if(!arm || hunt.prey.squidHeldBy)return;
    const redFish=Number.isFinite(hunt.prey.lengthMeters)&&["small","large","gray","glow"].includes(hunt.prey.variant);
    const preyRadius=redFish?hunt.prey.lengthMeters*.64*25:hunt.prey.headRadius??(hunt.prey.size??hunt.prey.scale??1)*22;
    if(distance(arm.at(-1),hunt.prey)>preyRadius+(squid.armRadius??18)*.84**8+25)return;
    hunt.held=true;hunt.armIndex=squid.activeArm;hunt.prey.squidHeldBy=squid.id;
    hunt.phase='pulling';hunt.elapsed=0;
    squid.surfaceGrips[hunt.armIndex]=null;
  }
  if(hunt.phase==='pulling') {
    const target=squidLocalToWorld(squid,0,-.32*squid.headRadius*(squid.headYScale??1.12),squid.headRadius*1.55);
    const gap=distance(hunt.target,target),amount=Math.min(1,dt*180/(gap||1));
    for(const axis of ['x','y','z'])hunt.target[axis]+=(target[axis]-hunt.target[axis])*amount;
    const tip=squid.tentacles[hunt.armIndex].at(-1);place(hunt.prey,tip);
    if(gap<12 && distance(tip,target)<65){hunt.phase='eating';hunt.elapsed=0;}
  } else {
    hunt.elapsed+=dt;
    const point=copy(hunt.prey),gap=distance(point,mouth),amount=Math.min(1,dt*110/(gap||1));
    for(const axis of ['x','y','z'])point[axis]+=(mouth[axis]-point[axis])*amount;
    place(hunt.prey,point);hunt.target=copy(point);
    if(hunt.elapsed>=2) {
      delete hunt.prey.squidHeldBy;hunt.prey.squidRespawnIn=SQUID_PREY_RESPAWN_SECONDS;
      state.hunts.delete(squid);state.cooldown.set(squid,6);
      delete squid.feeding;squid.huntingPrey=false;
    }
  }
}
