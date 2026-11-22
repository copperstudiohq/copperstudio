import { doorSweepOccupied, houseToWorld, worldToHouse } from './house-plan.mjs';
import { walkSurface, WOODLAND_HOUSE as cabin, WOODLAND_OUTHOUSE as outhouse } from './layout.mjs';

const home = { ...houseToWorld(1.42, -1.08, cabin), yaw: cabin.yaw - .61, accent: '#79553b' };
const cabinInside = houseToWorld(0, .87, cabin);
const cabinOutside = houseToWorld(0, cabin.d / 2 + 1.20, cabin);
const outhouseOutside = houseToWorld(0, outhouse.d / 2 + 1.85, outhouse);
const outhouseInside = houseToWorld(0, .10, outhouse);
const bench = outhouse.room.furnishings[0];
const seat = {
  ...houseToWorld(bench.x, bench.z + .025, outhouse), yaw: outhouse.yaw,
  seatHeight: bench.h, accent: home.accent, resting: true,
};
seat.y = walkSurface(seat.x, seat.z);
const route = [
  { point: cabinInside, opens: cabin },
  { point: cabinOutside, through: cabin, closes: cabin },
  { point: outhouseOutside, opens: outhouse },
  { point: outhouseInside, through: outhouse, closes: outhouse, sitFor: 5.8 },
  { point: outhouseInside, opens: outhouse },
  { point: outhouseOutside, through: outhouse, closes: outhouse },
  { point: cabinOutside, opens: cabin },
  { point: cabinInside, through: cabin, closes: cabin },
  { point: home },
];

const WALK_SPEED = 1.24;
const VISIT_INTERVAL = 120;

export function woodlandDoorwayDuck(x, z) {
  const local = worldToHouse(x, z, outhouse);
  const distance = Math.max(0, Math.abs(local.x) - .42, Math.abs(local.z) - outhouse.d / 2 - .45);
  const t = Math.min(1, distance / .92);
  return 1 - t * t * (3 - 2 * t);
}

export function createWoodlandResident({ canStep, moveDoor, outhouseFree }) {
  const position = {};
  let visiting;
  let segment;
  let untilNextVisit;
  let sittingFor;

  function reset() {
    Object.assign(position, home, { y: walkSurface(home.x, home.z), stride: 0, walking: false });
    visiting = false;
    segment = 0;
    untilNextVisit = VISIT_INTERVAL;
    sittingFor = 0;
  }
  reset();

  function advanceRoute(seconds, nearby, elapsed) {
    if (nearby || visiting) untilNextVisit = Math.max(0, untilNextVisit - elapsed);
    if (!visiting) {
      if (!nearby || untilNextVisit > 0) return;
      visiting = true;
      untilNextVisit = VISIT_INTERVAL;
    }
    if (sittingFor > 0) {
      sittingFor = Math.max(0, sittingFor - seconds);
      return;
    }
    const { point, opens, through, closes, sitFor } = route[segment];
    const dx = point.x - position.x;
    const dz = point.z - position.z;
    const distance = Math.hypot(dx, dz);
    if (distance > .003) {
      if (through && !moveDoor(through, true)) return;
      const step = Math.min(seconds * WALK_SPEED, distance);
      const x = position.x + dx * step / distance;
      const z = position.z + dz * step / distance;
      if (!canStep(x, z)) return;
      const turn = Math.atan2(dx, dz) - position.yaw;
      const angle = Math.atan2(Math.sin(turn), Math.cos(turn));
      const yaw = position.yaw + Math.sign(angle) * Math.min(Math.abs(angle), seconds * 7.5);
      Object.assign(position, { x, z, yaw, stride: position.stride + step, walking: true });
      return;
    }
    if (point === outhouseOutside && opens === outhouse && !outhouseFree()) return;
    if (opens && !moveDoor(opens, true)) return;
    if (closes && !moveDoor(closes, false)) return;
    if (++segment === route.length) {
      position.yaw = home.yaw;
      segment = 0;
      visiting = false;
    } else sittingFor = sitFor ?? 0;
  }

  return {
    position,
    seat,
    reset,
    get visiting() { return visiting; },
    get sitting() { return sittingFor > 0; },
    blocks(x, z) {
      return Math.hypot(x - position.x, z - position.z) < .62;
    },
    inDoorway(house) {
      return (house === cabin || house === outhouse) && doorSweepOccupied(worldToHouse(position.x, position.z, house), house);
    },
    advance(seconds, nearby, elapsed = seconds) {
      const { x, y, z, yaw, walking } = position;
      const wasVisiting = visiting;
      const wasSitting = sittingFor > 0;
      position.walking = false;
      advanceRoute(seconds, nearby, elapsed);
      if (!wasVisiting && !visiting) return false;
      const height = walkSurface(position.x, position.z);
      position.y = Math.abs(height - y) < .002 ? height : y + (height - y) * (1 - Math.exp(-seconds * 17));
      return walking || position.walking || wasSitting !== (sittingFor > 0)
        || x !== position.x || y !== position.y || z !== position.z || yaw !== position.yaw;
    },
  };
}
