import { blocksPlayer, DOOR_WIDTH } from './house-plan.mjs';
import { clearTrack, riderPath } from './rider-navigation.mjs';

export const VILLAGE_DOOR_WAIT = 2.6;
const WALK_SPEED = 1.85;
const REACH_SECONDS = .40;
const RELEASE_SECONDS = .25;
const ROUTE_SAMPLE = .058;

function pathToLatch(house, resident) {
  const latch = { x: -.29, z: house.d / 2 - 1.92 };
  const clear = (x, z) => Math.abs(x) < house.w / 2 - .42 && Math.abs(z) < house.d / 2 - .42
    && !blocksPlayer({ x, z }, house, true, house.room.furnishings, .285, resident);
  const path = riderPath(resident, latch, clear, .26, ROUTE_SAMPLE);
  if (!clearTrack(path.at(-1) ?? resident, latch, clear, ROUTE_SAMPLE)) return [];
  const candidates = [...path, latch];
  const route = [];
  let from = resident;
  for (let start = 0; start < candidates.length;) {
    let next = candidates.length - 1;
    while (next > start && !clearTrack(from, candidates[next], clear, ROUTE_SAMPLE)) next--;
    from = candidates[next];
    route.push(from);
    start = next + 1;
  }
  return route;
}

export function createDoorKeeper(house) {
  const index = house.room.residents.length > 1 ? 1 : 0;
  const resident = house.room.residents[index];
  const outward = pathToLatch(house, resident);
  const position = { x: resident.x, z: resident.z, yaw: resident.yaw, reach: 0, stride: 0, walking: false };
  const latchYaw = Math.atan2(-DOOR_WIDTH / 2 + .12 - (outward.at(-1)?.x ?? resident.x), .47);
  let phase = 'idle';
  let path = [];
  let elapsedInPhase = 0;
  let stepIndex = 0;

  function reset() {
    phase = 'idle';
    path = [];
    elapsedInPhase = stepIndex = 0;
    Object.assign(position, { x: resident.x, z: resident.z, yaw: resident.yaw, reach: 0, stride: 0, walking: false });
  }

  function goHome() {
    phase = 'returning';
    path = [...outward.slice(0, stepIndex).reverse(), resident];
    stepIndex = 0;
    position.reach = 0;
  }

  function turn(yaw, seconds) {
    const angle = Math.atan2(Math.sin(yaw - position.yaw), Math.cos(yaw - position.yaw));
    position.yaw += Math.sign(angle) * Math.min(Math.abs(angle), seconds * 9);
  }

  return {
    index,
    reset,
    get active() { return phase !== 'idle'; },
    get pose() { return phase !== 'idle' && phase !== 'waiting' ? position : null; },
    advance(seconds, isOpen, mayStep, clearToClose) {
      position.walking = false;
      if (phase === 'idle' && isOpen) phase = 'waiting';
      if (phase === 'idle') return false;
      if (phase === 'waiting') {
        if (!isOpen) reset();
        else if ((elapsedInPhase += seconds) >= VILLAGE_DOOR_WAIT) {
          phase = 'approaching';
          elapsedInPhase = 0;
          path = outward;
        }
        return false;
      }
      if (phase === 'releasing') {
        elapsedInPhase += seconds;
        position.reach = Math.max(0, 1 - elapsedInPhase / RELEASE_SECONDS);
        if (elapsedInPhase >= RELEASE_SECONDS) goHome();
        return false;
      }
      if (phase === 'approaching' && !isOpen) goHome();
      if (phase === 'approaching' || phase === 'returning') {
        const target = path[stepIndex];
        if (!target) {
          if (phase === 'returning') reset();
          else phase = 'at-door';
          return false;
        }
        const dx = target.x - position.x;
        const dz = target.z - position.z;
        const distance = Math.hypot(dx, dz);
        if (distance <= .002) { stepIndex++; return false; }
        const step = Math.min(WALK_SPEED * seconds, distance);
        const x = position.x + dx / distance * step;
        const z = position.z + dz / distance * step;
        if (!mayStep(x, z)) return false;
        turn(Math.atan2(dx, dz), seconds);
        Object.assign(position, { x, z, stride: position.stride + step, walking: true });
        return false;
      }
      if (!isOpen) { goHome(); return false; }
      turn(latchYaw, seconds);
      elapsedInPhase = clearToClose()
        ? Math.min(REACH_SECONDS, elapsedInPhase + seconds)
        : Math.max(0, elapsedInPhase - seconds * 2);
      position.reach = elapsedInPhase / REACH_SECONDS;
      if (elapsedInPhase < REACH_SECONDS) return false;
      phase = 'releasing';
      elapsedInPhase = 0;
      return true;
    },
  };
}
