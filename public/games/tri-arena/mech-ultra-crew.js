import { ULTRA_CREW_SEATS, ULTRA_MAIN_ROOMS, ultraLocalPoint, ultraPoint } from './mech-ultra-layout.js';
import { ultraFloor } from './mech-ultra-collision.js';

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;

function intruderInRoom(owner, target, room) {
  if (!target || target.hp <= 0) return false;
  const point = ultraLocalPoint(owner, { x: target.x, y: finite(target.elevation), z: target.z }, room.frame);
  return point.y >= room.floorY - .42 && point.y < Math.min(room.roofY - .25, room.floorY + 2.8)
    && Math.abs(point.x - room.x) < room.width / 2 - .3 && Math.abs(point.z - room.z) < room.depth / 2 - .3;
}

/** Return via the front deck and side walks rather than crossing the open stairwell. */
function returnWaypoint(point, station) {
  const behind = point.z < -2.4, rearStation = station.z < -2.4;
  if (behind && (!rearStation || Math.sign(point.x) !== Math.sign(station.x))) return { x: point.x, z: 0 };
  if (rearStation && !behind && Math.abs(point.x - station.x) > .05) return { x: station.x, z: Math.max(0, point.z) };
  return station;
}

/** Real crew hold their assigned lookout until an intruder physically enters that room. */
export function updateUltraCrewStation(game, actor, dt) {
  if (!actor.ultraCrew || actor.ultraFalling) return false;
  const station = ULTRA_CREW_SEATS.find(seat => seat.id === actor.ultraStationId);
  const owner = game.state.enemies.find(candidate => candidate.id === actor.ownerId && candidate.hp > 0 && candidate.ultra);
  const room = station && ULTRA_MAIN_ROOMS[station.roomIndex];
  if (!owner || !room || actor.ultraRoom !== station.roomIndex) return false;
  const floorY = finite(owner.elevation) + room.floorY;
  if (Math.abs(finite(actor.elevation) - floorY) > .45
    || Math.abs(ultraFloor(owner, actor, actor.x, actor.z) - floorY) > .45) return false;
  if (station.role === 'window-watcher' && intruderInRoom(owner, game.state.player, room)) {
    if (actor.ultraCrewMode !== 'defend') { actor.phase = 'chase'; actor.phaseTime = 0; actor.attackName = ''; }
    actor.ultraCrewMode = 'defend';
    return false;
  }

  actor.phase = 'recover'; actor.phaseTime = 0; actor.attackName = '';
  actor.x += finite(actor.impulseX) * dt; actor.z += finite(actor.impulseZ) * dt;
  actor.impulseX = finite(actor.impulseX) * Math.exp(-7 * dt); actor.impulseZ = finite(actor.impulseZ) * Math.exp(-7 * dt);
  const point = ultraLocalPoint(owner, { x: actor.x, y: actor.elevation, z: actor.z }, station.frame);
  const waypoint = returnWaypoint(point, station), target = ultraPoint(owner, { ...waypoint, y: station.y }, station.frame);
  const dx = target.x - actor.x, dz = target.z - actor.z, distance = Math.hypot(dx, dz);
  const speed = finite(game.enemyStats(actor.type)?.speed, 2.5) * finite(actor.speedScale, 1)
    * (actor.crippled ? .7 : 1) * finite(game.groundMobility?.(actor), 1);
  if (distance > 1e-6) {
    const travel = Math.min(distance, Math.max(0, speed) * dt), x = actor.x + dx / distance * travel, z = actor.z + dz / distance * travel;
    // A cut deck can invalidate the return path between updates. Walking stops
    // at that edge while the existing occupant/falling code handles support.
    if (Math.abs(ultraFloor(owner, { ...actor, elevation: floorY }, x, z) - floorY) <= .45) {
      actor.x = x; actor.z = z;
    }
    actor.angle = Math.atan2(dx, dz); actor.ultraCrewMode = 'returning';
  } else {
    actor.angle = finite(owner.angle) + finite(station.angle);
    actor.ultraCrewMode = station.role === 'control-operator' ? 'operator' : 'watch';
  }
  return true;
}
