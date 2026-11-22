import { houseToWorld } from './house-plan.mjs';
import { houseAt, HOUSES, regionAt, walkSurface } from './layout.mjs';
import { clearTrack, riderPath } from './rider-navigation.mjs';

const MEAL_DURATION = 5.4;
const RECOVERY_MEALS = 3;
const TRACK_SPACING = .21;
const fixedStops = ['outside', 'inside', 'aisle', 'chair'];
const phases = ['entering', 'eating', 'leaving'];
const hosts = HOUSES.filter((house) => house.room.mealSeat).map((house) => {
  const seat = house.room.mealSeat;
  return {
    house, chair: houseToWorld(seat.x, seat.z, house),
    aisle: houseToWorld(0, seat.z, house),
    inside: houseToWorld(0, house.d / 2 - 1.03, house),
    outside: houseToWorld(0, house.d / 2 + 1.12, house),
    yaw: house.yaw - seat.side * Math.PI / 2,
  };
});

export function createOrcMeals(canWalk, openDoor) {
  let visit = null;
  let delay = 4;
  let nextHost = 0;
  let mealsEaten = 0;
  let walking = false;
  const walkOutside = (x, z) => !houseAt(x, z) && canWalk(x, z);

  function sitAtTable(position, host) {
    const { x, z } = host.chair;
    Object.assign(position, { x, z, y: walkSurface(x, z), yaw: host.yaw });
  }

  function planVisit(position) {
    for (let i = 0; i < hosts.length; i++) {
      const host = hosts[(nextHost + i) % hosts.length];
      const path = riderPath(position, host.outside, walkOutside, .8, TRACK_SPACING);
      const last = path.at(-1) ?? position;
      if (!clearTrack(last, host.outside, walkOutside, TRACK_SPACING)) continue;
      nextHost = (nextHost + i + 1) % hosts.length;
      return {
        host, phase: 'entering', time: 0,
        path: [...path, host.outside, host.inside, host.aisle, host.chair],
      };
    }
    return null;
  }

  return {
    get activity() { return visit && { house: visit.host.house, phase: visit.phase }; },
    get active() { return visit !== null; },
    get walking() { return walking; },
    get eating() { return visit?.phase === 'eating' ? visit.time / MEAL_DURATION : null; },
    get recovery() { return Math.min(1, mealsEaten / RECOVERY_MEALS); },
    snapshot() {
      return {
        delay, nextHost, mealsEaten,
        visit: visit && {
          house: visit.host.house.id, phase: visit.phase, time: visit.time,
          path: visit.path.map((point) => fixedStops.find((key) => point === visit.host[key]) ?? [point.x, point.z]),
        },
      };
    },
    restore(saved, position) {
      visit = null;
      walking = false;
      delay = Number.isFinite(saved?.delay) ? Math.min(48, Math.max(0, saved.delay)) : 4;
      nextHost = Number.isInteger(saved?.nextHost) && hosts[saved.nextHost] ? saved.nextHost : 0;
      mealsEaten = Number.isSafeInteger(saved?.mealsEaten) ? Math.max(0, saved.mealsEaten) : 0;
      const planned = saved?.visit;
      if (!planned) return;
      const host = hosts.find(({ house }) => house.id === planned.house);
      if (!host || !phases.includes(planned.phase) || !Array.isArray(planned.path) || planned.path.length > 300) return;
      const path = [];
      for (const point of planned.path) {
        if (fixedStops.includes(point)) path.push(host[point]);
        else if (Array.isArray(point) && point.length === 2 && point.every((value) => Number.isFinite(value) && Math.abs(value) < 280)) {
          path.push({ x: point[0], z: point[1] });
        } else return;
      }
      const time = Number.isFinite(planned.time) ? Math.min(MEAL_DURATION, Math.max(0, planned.time)) : 0;
      visit = { host, phase: planned.phase, time, path };
      if (position && visit.phase === 'eating') sitAtTable(position, host);
    },
    interrupt() {
      if (!visit) return;
      // An interrupted visit can still be the next place he gets a meal.
      if (visit.phase !== 'leaving') nextHost = hosts.indexOf(visit.host);
      visit = null;
      walking = false;
      delay = 5;
    },
    advance(elapsed, position) {
      walking = false;
      if (!visit) {
        if (regionAt(position.z) !== 'village' || houseAt(position.x, position.z)) return null;
        delay = Math.max(0, delay - elapsed);
        if (delay > 0) return null;
        visit = planVisit(position);
        if (!visit) {
          delay = 5;
          return null;
        }
      }
      const { host, path } = visit;
      if (visit.phase === 'eating') {
        visit.time += elapsed;
        if (visit.time >= MEAL_DURATION) {
          mealsEaten++;
          visit.phase = 'leaving';
          path.push(host.aisle, host.inside, host.outside);
        }
        return 0;
      }

      const target = path[0];
      if (!target) {
        if (visit.phase === 'entering') {
          sitAtTable(position, host);
          visit.phase = 'eating';
        } else {
          visit = null;
          delay = mealsEaten < RECOVERY_MEALS ? 7 : 48;
        }
        return 0;
      }
      const crossing = visit.phase === 'entering' ? target === host.inside : target === host.outside;
      if (crossing && !openDoor(host.house)) return 0;
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= .001) {
        path.shift();
        return 0;
      }
      const step = Math.min(distance, elapsed * 2.65);
      const x = position.x + dx / distance * step;
      const z = position.z + dz / distance * step;
      if (!canWalk(x, z)) return 0;
      Object.assign(position, { x, z, y: walkSurface(x, z), yaw: Math.atan2(dx, dz) });
      walking = true;
      return step;
    },
  };
}
