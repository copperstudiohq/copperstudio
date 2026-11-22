import * as T from './vendor/three.module.js';
import { DISTANT_TOWER, VIEWS } from './layout.mjs';
import { createRider } from './rider.mjs';
import { clearTrack, riderPath } from './rider-navigation.mjs';

const START_Z = 242;
const villageRoad = [[-4, 92], [-2.6, 78], [-1.5, 62], [-.4, 45], [.1, 28], [.51, 12], [.53, -2], [-.47, -19]];
const VIEW = VIEWS.field;
const towerBearing = VIEW.x + (DISTANT_TOWER.x - VIEW.x) * (START_Z - VIEW.z) / (DISTANT_TOWER.z - VIEW.z);
const WALK_SPEED = 5.5;
const HUNT_SPEED = 6.35;
const CHASE_RANGE = 42;
const SWORD_REACH = 2.38;
const STRIKE_MOMENT = .62;
const STRIKE_DURATION = 1.07;
export const RIDER_MAX_HEALTH = 3;

export function riderDelay(isFirst, random = Math.random) {
  const [min, max] = isFirst ? [34_000, 65_000] : [155_000, 285_000];
  return Math.round(min + (max - min) * random());
}

export function riderRoute() {
  const approach = [[towerBearing, START_Z], [-18, 193], [-17, 151], [-9, 116]];
  const path = new T.CatmullRomCurve3([...approach, ...villageRoad].map(([x, z]) => new T.Vector3(x, 0, z)));
  path.arcLengthDivisions = 600;
  return path;
}

export function createRiderHunt(canRide) {
  const road = riderRoute();
  const length = road.getLength();
  const points = road.getSpacedPoints(140);
  const tangent = new T.Vector3();
  const position = new T.Vector3();
  let stage = 'idle';
  let health = RIDER_MAX_HEALTH;
  let yaw = Math.PI;
  let distance = 0;
  let age = 0;
  let cycle = 0;
  let pace = 0;
  let strike = null;
  let hitFor = 0;
  let recovery = 0;
  let shelteredFor = 0;
  let huntFor = 0;
  let endOfRoadFor = 0;
  let retreatFor = 0;
  let join = null;
  let path = [];
  let pathTarget = null;
  let planIn = 0;

  function followRoad(next, backwards = false) {
    distance = T.MathUtils.clamp(next, 0, length);
    road.getPointAt(distance / length, position);
    road.getTangentAt(distance / length, tangent);
    yaw = Math.atan2(tangent.x, tangent.z) + (backwards ? Math.PI : 0);
  }

  function rotateToward(target, seconds) {
    const desired = Math.atan2(target.x - position.x, target.z - position.z);
    const error = Math.atan2(Math.sin(desired - yaw), Math.cos(desired - yaw));
    yaw += T.MathUtils.clamp(error, -5 * seconds, 5 * seconds);
  }

  function inSwordReach(target) {
    return target.exposed && Math.hypot(target.x - position.x, target.z - position.z) <= SWORD_REACH
      && clearTrack(position, target, canRide);
  }

  function facing(target) {
    return (target.x - position.x) * Math.sin(yaw) + (target.z - position.z) * Math.cos(yaw) > -.22;
  }

  function navigate(target, seconds, speed) {
    planIn -= seconds;
    if (!pathTarget || (planIn <= 0 && (
      path.length === 0 || Math.hypot(pathTarget.x - target.x, pathTarget.z - target.z) > 1.2
    ))) {
      path = riderPath(position, target, canRide);
      pathTarget = { x: target.x, z: target.z };
      planIn = .65;
    }
    const next = path[0];
    if (!next) return 0;
    const dx = next.x - position.x;
    const dz = next.z - position.z;
    const range = Math.hypot(dx, dz);
    if (range < .22) {
      path.shift();
      return 0;
    }
    rotateToward(next, seconds);
    const step = Math.min(range, speed * seconds);
    const x = position.x + dx / range * step;
    const z = position.z + dz / range * step;
    if (!canRide(x, z)) {
      path = [];
      return 0;
    }
    position.set(x, 0, z);
    return speed;
  }

  function beginDeparture() {
    stage = 'depart';
    strike = null;
    retreatFor = 0;
    let closest = 0;
    for (let i = 1; i < points.length; i++) {
      if (position.distanceToSquared(points[i]) < position.distanceToSquared(points[closest])) closest = i;
    }
    join = { point: points[closest], distance: closest * length / (points.length - 1) };
    path = [];
    pathTarget = null;
  }

  function hunt(seconds, target) {
    huntFor += seconds;
    recovery = Math.max(0, recovery - seconds);
    if (target.sheltered) shelteredFor += seconds;
    else shelteredFor = 0;

    if (shelteredFor >= 6.5 || huntFor >= 44) {
      beginDeparture();
      return 0;
    }

    if (strike !== null) {
      const before = strike;
      strike += seconds;
      if (before < STRIKE_MOMENT) rotateToward(target, seconds);
      if (before < STRIKE_MOMENT && strike >= STRIKE_MOMENT && facing(target) && inSwordReach(target)) {
        health -= 1;
        hitFor = .9;
        if (!health) stage = 'captured';
      }
      if (strike >= STRIKE_DURATION) {
        strike = null;
        recovery = .68;
      }
      return 0;
    }

    if (inSwordReach(target)) {
      rotateToward(target, seconds);
      if (recovery <= 0 && facing(target)) strike = 0;
      return 0;
    }

    const range = Math.hypot(target.x - position.x, target.z - position.z);
    if (target.exposed && range < CHASE_RANGE) {
      endOfRoadFor = 0;
      return navigate(target, seconds, HUNT_SPEED);
    }
    if (target.sheltered) return 0;
    if (endOfRoadFor >= 13) beginDeparture();
    endOfRoadFor += seconds;
    return 0;
  }

  return {
    get stage() { return stage; },
    get health() { return health; },
    get attacking() { return strike !== null && strike < STRIKE_MOMENT; },
    get struck() { return hitFor > 0; },
    get active() { return stage !== 'idle' && stage !== 'captured'; },
    get frame() {
      return { x: position.x, z: position.z, yaw, age, cycle, pace, swing: strike === null ? null : strike / STRIKE_DURATION };
    },
    snapshot() {
      if (!this.active) return { stage: 'idle' };
      return {
        stage, health, x: position.x, z: position.z, yaw, distance, age, cycle, pace,
        strike, hitFor, recovery, shelteredFor, huntFor, endOfRoadFor, retreatFor,
        joinIndex: join ? points.indexOf(join.point) : -1,
      };
    },
    restore(saved) {
      this.reset();
      if (!['approach', 'hunt', 'depart'].includes(saved?.stage)
        || !Number.isInteger(saved.health) || saved.health < 1 || saved.health > RIDER_MAX_HEALTH
        || ![saved.x, saved.z, saved.yaw].every(Number.isFinite) || Math.hypot(saved.x, saved.z) > 280) return;
      const time = (value, maximum) => Number.isFinite(value) ? Math.min(maximum, Math.max(0, value)) : 0;
      stage = saved.stage;
      health = saved.health;
      position.set(saved.x, 0, saved.z);
      yaw = saved.yaw;
      distance = time(saved.distance, length);
      age = time(saved.age, 180);
      cycle = time(saved.cycle, 300);
      pace = time(saved.pace, 1);
      strike = saved.strike === null ? null : time(saved.strike, STRIKE_DURATION);
      hitFor = time(saved.hitFor, .9);
      recovery = time(saved.recovery, .68);
      shelteredFor = time(saved.shelteredFor, 6.5);
      huntFor = time(saved.huntFor, 44);
      endOfRoadFor = time(saved.endOfRoadFor, 13);
      retreatFor = time(saved.retreatFor, 8);
      const index = saved.joinIndex;
      join = Number.isInteger(index) && points[index] ? { point: points[index], distance: index * length / (points.length - 1) } : null;
      pathTarget = null;
      path = [];
      planIn = 0;
    },
    start() {
      if (stage !== 'idle') return;
      stage = 'approach';
      health = RIDER_MAX_HEALTH;
      age = cycle = pace = huntFor = endOfRoadFor = shelteredFor = recovery = hitFor = 0;
      strike = join = pathTarget = null;
      path = [];
      followRoad(0);
    },
    reset() {
      stage = 'idle';
      health = RIDER_MAX_HEALTH;
      strike = null;
      hitFor = 0;
    },
    advance(seconds, target) {
      if (!this.active) return;
      age += seconds;
      hitFor = Math.max(0, hitFor - seconds);
      let speed = 0;
      if (stage === 'approach') {
        followRoad(distance + WALK_SPEED * seconds);
        speed = WALK_SPEED;
        const seenOnRoad = position.z <= 101 && target.exposed
          && Math.hypot(target.x - position.x, target.z - position.z) < 24;
        if (seenOnRoad || distance >= length) stage = 'hunt';
      } else if (stage === 'hunt') {
        speed = hunt(seconds, target);
      } else if (stage === 'depart') {
        retreatFor += seconds;
        if (join) {
          speed = navigate(join.point, seconds, WALK_SPEED);
          if (position.distanceToSquared(join.point) < .48) {
            distance = join.distance;
            join = null;
          } else if (retreatFor >= 8) this.reset();
        } else {
          followRoad(distance - WALK_SPEED * seconds, true);
          speed = WALK_SPEED;
          if (distance <= 0) this.reset();
        }
      }
      pace = T.MathUtils.lerp(pace, speed / 11.6, Math.min(1, seconds * 8));
      cycle += seconds * (speed > 0 ? .48 + pace * 1.29 : pace);
    },
  };
}

export function createRiderEncounter(scene, { wake, random = Math.random, earth, canRide }) {
  const actor = createRider(scene, earth);
  const hunt = createRiderHunt(canRide);
  let eligible = false;
  let timer = null;
  let due = 0;
  let remaining = riderDelay(true, random);

  function pose() {
    const { x, z, yaw, age, cycle, pace, swing } = hunt.frame;
    actor.pose(x, z, yaw, age, { cycle, pace, swing, armed: true });
  }

  function schedule() {
    if (!eligible || timer !== null || hunt.stage !== 'idle') return;
    due = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      if (!eligible) return;
      hunt.start();
      remaining = riderDelay(false, random);
      pose();
      wake();
    }, remaining);
  }

  return {
    get stage() { return hunt.stage; },
    get health() { return hunt.health; },
    get attacking() { return hunt.attacking; },
    get struck() { return hunt.struck; },
    get active() { return hunt.active; },
    snapshot() {
      return { hunt: hunt.snapshot(), remaining: timer === null ? remaining : Math.max(0, due - performance.now()) };
    },
    restore(saved) {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      eligible = false;
      remaining = Number.isFinite(saved?.remaining) ? Math.max(0, Math.min(285_000, saved.remaining)) : riderDelay(true, random);
      hunt.restore(saved?.hunt);
      if (hunt.active) pose();
      else actor.hide();
    },
    setEligible(value) {
      if (value === eligible) return;
      eligible = value;
      if (!value && timer !== null) {
        clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, due - performance.now());
      }
      schedule();
    },
    advance(seconds, target) {
      if (!hunt.active) return;
      hunt.advance(seconds, target);
      if (hunt.stage === 'idle') {
        actor.hide();
        schedule();
      } else pose();
    },
    reset() {
      hunt.reset();
      actor.hide();
      schedule();
    },
    within(x, z, range) {
      if (hunt.stage === 'idle') return false;
      const frame = hunt.frame;
      return Math.hypot(frame.x - x, frame.z - z) < range;
    },
  };
}
