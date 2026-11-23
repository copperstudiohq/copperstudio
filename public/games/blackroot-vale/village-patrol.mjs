import { doorSweepOccupied, houseToWorld, worldToHouse } from './house-plan.mjs';
import { canStand, houseAt, VILLAGE_HOUSES, walkSurface } from './layout.mjs';
import { clearTrack, riderPath } from './rider-navigation.mjs';
import { trailElevation } from './terrain.mjs';

const SPEED = 1.66;
const CHECK_SECONDS = 3.8;
const SPACING = .07;
const GUARD_CLEARANCE = .86;
const SIDESTEPS = [.84, -.84, 1.42, -1.42, 1.96, -1.96];
const road = [[-8.4, 111], [-4, 94], [-1.4, 77], [0, 59], [0, 42], [0, 29]];
const roadStops = road.map(([x, z]) => [{ x: x - .78, z }, { x: x + .78, z: z + 1.25 }]);

export function villagePatrolDelay(first, random = Math.random) {
  const [earliest, latest] = first ? [72_000, 112_000] : [155_000, 255_000];
  return Math.round(earliest + (latest - earliest) * random());
}

function connect(from, to, canWalk) {
  const path = riderPath(from, to, canWalk, .78, SPACING);
  if (path.at(-1) === to) return path;
  return clearTrack(path.at(-1) ?? from, to, canWalk, SPACING) ? [...path, to] : null;
}

function planPatrol(obstacles, random) {
  const canWalk = (x, z) => !houseAt(x, z) && canStand(x, z, obstacles, undefined, .46);
  const legs = [];
  let previous = roadStops[0];
  function add(targets, house = null) {
    const paths = targets.map((target, index) => connect(previous[index], target, canWalk));
    if (paths.some((path) => !path)) return false;
    legs.push({ paths, house, outside: targets[0], stopped: [0, 0] });
    previous = targets;
    return true;
  }
  if (!previous.every(({ x, z }) => canWalk(x, z)) || !roadStops.slice(1).every((stop) => add(stop))) return [];

  const candidates = [...VILLAGE_HOUSES];
  let checked = 0;
  while (checked < 2 && candidates.length) {
    const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
    const [house] = candidates.splice(index, 1);
    const outside = houseToWorld(0, house.d / 2 + 1.46, house);
    for (const side of [-1, 1]) {
      const watch = houseToWorld(side * 1.46, house.d / 2 + 1.86, house);
      if (canWalk(watch.x, watch.z) && add([outside, watch], house)) {
        checked++;
        break;
      }
    }
  }
  if (!checked || ![...roadStops].reverse().every((stop) => add(stop))) return [];
  return legs;
}

export function createVillagePatrol({
  obstacles, canStep, moveDoor, isDoorOpen, wake, random = Math.random,
  clock = {
    now: () => performance.now(),
    schedule: (callback, delay) => setTimeout(callback, delay),
    cancel: (timer) => clearTimeout(timer),
  },
}) {
  let eligible = false;
  let timer = null;
  let due = 0;
  let remaining = villagePatrolDelay(true, random);
  let route = [];
  let legIndex = 0;
  let phase = 'road';
  let inspectedFor = 0;
  let blockedFor = 0;
  let doorWasOpen = false;
  const guards = roadStops[0].map((spot) => ({ ...spot, yaw: Math.PI, cycle: 0, walking: false }));

  function schedule() {
    if (!eligible || timer !== null || route.length) return;
    due = clock.now() + remaining;
    timer = clock.schedule(() => {
      timer = null;
      if (!eligible) return;
      remaining = villagePatrolDelay(false, random);
      route = planPatrol(obstacles, random);
      legIndex = 0;
      phase = 'road';
      if (!route.length) {
        schedule();
        return;
      }
      for (const [index, guard] of guards.entries()) {
        Object.assign(guard, roadStops[0][index], { yaw: Math.PI, cycle: 0, walking: false });
      }
      wake();
    }, remaining);
  }

  function turn(guard, desired, seconds) {
    const angle = Math.atan2(Math.sin(desired - guard.yaw), Math.cos(desired - guard.yaw));
    guard.yaw += Math.sign(angle) * Math.min(Math.abs(angle), seconds * 5.8);
  }

  function mayStep(x, z) {
    return (phase !== 'road' || !houseAt(x, z)) && canStep(x, z);
  }

  function step(guard, target, seconds) {
    const dx = target.x - guard.x;
    const dz = target.z - guard.z;
    const distance = Math.hypot(dx, dz);
    if (distance < .00001) return true;
    const stride = Math.min(distance, SPEED * seconds);
    const bearing = Math.atan2(dx, dz);
    const companion = guard === guards[0] ? guards[1] : guards[0];
    const x = guard.x + dx * stride / distance;
    const z = guard.z + dz * stride / distance;
    if (Math.hypot(x - companion.x, z - companion.z) >= GUARD_CLEARANCE) {
      if (!mayStep(x, z)) return false;
      turn(guard, bearing, seconds);
      Object.assign(guard, { x, z, walking: true, cycle: guard.cycle + stride * 6.2 });
      return stride === distance;
    }
    for (const offset of SIDESTEPS) {
      const yaw = bearing + offset;
      const nextX = guard.x + Math.sin(yaw) * stride;
      const nextZ = guard.z + Math.cos(yaw) * stride;
      if (Math.hypot(nextX - companion.x, nextZ - companion.z) < GUARD_CLEARANCE || !mayStep(nextX, nextZ)) continue;
      turn(guard, yaw, seconds);
      Object.assign(guard, { x: nextX, z: nextZ, walking: true, cycle: guard.cycle + stride * 6.2 });
      break;
    }
    return false;
  }

  function nextLeg() {
    phase = 'road';
    if (++legIndex < route.length) return;
    route = [];
    schedule();
  }

  function inspectionHouse() {
    return phase === 'road' ? null : route[legIndex]?.house ?? null;
  }

  return {
    get active() { return route.length > 0; },
    get inspection() { return inspectionHouse(); },
    get frames() {
      if (!route.length) return [];
      return guards.map((guard) => {
        const { x, z } = guard;
        return { ...guard, y: walkSurface(x, z) + (houseAt(x, z) ? 0 : trailElevation(x, z)) };
      });
    },
    within(x, z, radius) {
      return route.length > 0 && guards.some((guard) => Math.hypot(x - guard.x, z - guard.z) < radius);
    },
    inDoorway(house) {
      return inspectionHouse() === house && guards.some((guard) => doorSweepOccupied(worldToHouse(guard.x, guard.z, house), house));
    },
    snapshot() {
      return { remaining: timer === null ? remaining : Math.max(0, due - clock.now()) };
    },
    restore(saved) {
      if (timer !== null) clock.cancel(timer);
      timer = null;
      eligible = false;
      route = [];
      phase = 'road';
      remaining = Number.isFinite(saved?.remaining)
        ? Math.min(255_000, Math.max(0, saved.remaining)) : villagePatrolDelay(true, random);
    },
    setEligible(value) {
      if (eligible === value) return;
      eligible = value;
      if (!value && timer !== null) {
        clock.cancel(timer);
        timer = null;
        remaining = Math.max(0, due - clock.now());
      }
      schedule();
    },
    advance(seconds) {
      if (!route.length) return;
      for (const guard of guards) guard.walking = false;
      const { paths, house, outside, stopped } = route[legIndex];
      const [leader, escort] = guards;
      if (phase === 'road') {
        for (const [index, path] of paths.entries()) {
          const guard = guards[index];
          const companion = guards[1 - index];
          if (path.length > 1 && Math.hypot(path[0].x - companion.x, path[0].z - companion.z) < GUARD_CLEARANCE
            && clearTrack(guard, path[1], mayStep, SPACING)) path.shift();
          if (path.length && step(guard, path[0], seconds)) path.shift();
          stopped[index] = path.length && !guard.walking ? stopped[index] + seconds : 0;
          if (stopped[index] < .85) continue;
          stopped[index] = 0;
          const detour = connect(guard, path.at(-1), (x, z) =>
            Math.hypot(x - companion.x, z - companion.z) >= GUARD_CLEARANCE && mayStep(x, z));
          if (detour) paths[index] = detour;
        }
        if (paths.some((path) => path.length)) return;
        if (!house) {
          nextLeg();
          return;
        }
        phase = 'entering';
        blockedFor = inspectedFor = 0;
        doorWasOpen = isDoorOpen(house);
      }
      turn(escort, house.yaw, seconds);
      if (phase === 'entering') {
        if (!moveDoor(house, true)) return;
        const inside = houseToWorld(0, .52, house);
        const arrived = step(leader, inside, seconds);
        blockedFor = leader.walking ? 0 : blockedFor + seconds;
        if (arrived || blockedFor > 3) phase = 'checking';
      } else if (phase === 'checking') {
        inspectedFor += seconds;
        turn(leader, house.yaw + Math.PI + Math.sin(inspectedFor * 1.7) * .84, seconds);
        if (inspectedFor >= CHECK_SECONDS) phase = 'leaving';
      } else if (moveDoor(house, true) && step(leader, outside, seconds)) {
        if (!doorWasOpen) moveDoor(house, false);
        nextLeg();
      }
    },
  };
}
