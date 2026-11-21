import { clearTrack, riderPath } from './rider-navigation.mjs';

const FOLLOW_DISTANCE = 2.05;
const TRACK_SPACING = .22;
const MAX_TRAIL_POINTS = 96;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

export function createOrcCompanion() {
  const trail = [];
  let path = [];
  let replanIn = 0;
  let direct = false;
  let running = false;
  let moving = false;

  function plan(position, player, canWalk) {
    direct = clearTrack(position, player, canWalk, TRACK_SPACING);
    replanIn = .28;
    if (direct) {
      path = [player];
      return;
    }
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      if (distance(position, point) < .35 || !clearTrack(position, point, canWalk, TRACK_SPACING)) continue;
      trail.splice(0, i);
      path = [point];
      return;
    }
    path = riderPath(position, player, canWalk, .58, TRACK_SPACING);
    replanIn = 1;
  }

  return {
    get walking() { return moving; },
    get running() { return running; },
    reset() {
      trail.length = 0;
      path = [];
      replanIn = 0;
      direct = moving = running = false;
    },
    advance(elapsed, position, player, canWalk, heightAt) {
      moving = running = false;
      if (!player) return 0;
      const tail = trail.at(-1);
      if (!tail || distance(tail, player) > .46) {
        trail.push({ x: player.x, z: player.z });
        if (trail.length > MAX_TRAIL_POINTS) trail.shift();
      }
      replanIn -= elapsed;
      if (replanIn <= 0) plan(position, player, canWalk);
      const target = direct ? player : path[0];
      if (!target) return 0;
      const length = distance(position, target);
      const gap = distance(position, player);
      const pace = gap > 9 ? 8.3 : gap > 3.6 ? 5.35 : 3.15;
      const step = Math.min(elapsed * pace, length - (direct ? FOLLOW_DISTANCE : 0));
      if (step <= 0) {
        if (!direct) path.shift();
        return 0;
      }
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const x = position.x + dx / length * step;
      const z = position.z + dz / length * step;
      if (!canWalk(x, z)) {
        path = [];
        direct = false;
        replanIn = .15;
        return 0;
      }
      Object.assign(position, { x, y: heightAt(x, z), z, yaw: Math.atan2(dx, dz) });
      if (!direct && step === length) path.shift();
      moving = true;
      running = pace > 4;
      return step;
    },
  };
}

export function companionArrival(player, canWalk, heightAt) {
  const forwardX = -Math.sin(player.yaw);
  const forwardZ = -Math.cos(player.yaw);
  for (const [ahead, side] of [[2.6, -1.25], [2.6, 1.25], [-2.6, 0], [0, 2.4]]) {
    const x = player.x + forwardX * ahead - forwardZ * side;
    const z = player.z + forwardZ * ahead + forwardX * side;
    if (canWalk(x, z) && clearTrack(player, { x, z }, canWalk, TRACK_SPACING)) {
      return { x, y: heightAt(x, z), z, yaw: Math.atan2(player.x - x, player.z - z) };
    }
  }
  return { x: player.x, y: heightAt(player.x, player.z), z: player.z, yaw: player.yaw + Math.PI };
}
