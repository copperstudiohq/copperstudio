import { ULTRA_ROOF_MISSILE_KIND, ULTRA_ROOF_MISSILES as CONFIG, ULTRA_ROOF_MOUNTS,
  ultraRoofMuzzle, planUltraRoofFlight, ultraRoofFlightPoint, ultraRoofCoverImpact } from './mech-ultra-roof-missiles.js';
import { ultraHullBlocks } from './mech-ultra-collision.js';

const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const point = value => ({ x: value.x, y: finite(value.y), z: value.z });
const hulls = game => game.state.enemies.filter(actor => actor.hp > 0 && actor.ultra);

/** Queue physical rockets in their launch wells; each target locks before ignition. */
export function queueUltraRoofSalvo(game, owner, target = game.state.player) {
  if (owner.hp <= 0 || !owner.ultra || game.state.mode !== 'playing') return 0;
  if (![target?.x, target?.z].every(Number.isFinite)) throw new TypeError('A roof salvo requires a finite target position.');
  const spread = [[-2, -.7], [.9, 1.9], [2, -1.1], [-.8, -2]];
  let count = 0;
  for (const mount of ULTRA_ROOF_MOUNTS) {
    if (game.state.projectiles.length >= CONFIG.projectileCap) break;
    if (!game.canEnemyDamage(owner, mount.id)) continue;
    const origin = ultraRoofMuzzle(owner, mount.index), [dx, dz] = spread[mount.index];
    const bounds = game.arenaBounds;
    const targetX = Math.max(-bounds.x + 1, Math.min(bounds.x - 1, target.x + dx));
    const targetZ = Math.max(-bounds.z + 1, Math.min(bounds.z - 1, target.z + dz));
    game.state.projectiles.push({ id: game.nextId++, ownerId: owner.id, team: owner.team,
      kind: ULTRA_ROOF_MISSILE_KIND, index: mount.index, weaponId: mount.id, targetId: target.id,
      ...origin, vx: 0, vy: 0, vz: 0, gravity: CONFIG.gravity, radius: .45,
      age: -CONFIG.warningSeconds - mount.index * CONFIG.staggerSeconds, life: 9,
      targetX, targetY: 0, targetZ, impactRadius: CONFIG.impactRadius,
      damage: CONFIG.damage * finite(owner.damageScale, 1), launched: false });
    count++;
  }
  if (count) game.emit('ultraroofsalvo', owner, { id: owner.id, count });
  return count;
}

/** Far-lava barrages remain separate from the close, locked drill attack. */
export function updateUltraRoofLaunchers(game, owner, dt) {
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Roof launcher time must be finite and nonnegative.');
  if (game.state.mode !== 'playing' || owner.hp <= 0) return 0;
  const state = owner.ultra;
  state.roofOpen ??= [0, 0, 0, 0]; state.roofFlash ??= [0, 0, 0, 0];
  const pending = game.state.projectiles.filter(bolt => bolt.ownerId === owner.id && bolt.kind === ULTRA_ROOF_MISSILE_KIND && !bolt.launched);
  for (let index = 0; index < 4; index++) {
    state.roofFlash[index] = Math.max(0, state.roofFlash[index] - dt);
    const desired = pending.some(bolt => bolt.index === index) || state.roofFlash[index] > 0 ? 1 : 0;
    state.roofOpen[index] += (desired - state.roofOpen[index]) * Math.min(1, dt * 8);
  }
  state.roofCooldown = Math.max(0, finite(state.roofCooldown, 3) - dt);
  const target = game.state.player;
  const distance = Math.hypot(owner.x - target.x, owner.z - target.z);
  if (state.roofCooldown > 0 || pending.length || distance < 52 || state.phase !== 'ready'
    || !['outbound', 'patrol'].includes(state.navigation)) return 0;
  const count = queueUltraRoofSalvo(game, owner, target);
  if (count) state.roofCooldown = CONFIG.cooldownSeconds;
  return count;
}

function firstHullImpact(game, from, to) {
  let first = null;
  for (const hull of hulls(game)) {
    if (!ultraHullBlocks(hull, from, to)) continue;
    let low = 0, high = 1;
    for (let iteration = 0; iteration < 10; iteration++) {
      const t = (low + high) / 2;
      const middle = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, z: from.z + (to.z - from.z) * t };
      if (ultraHullBlocks(hull, from, middle)) high = t; else low = t;
    }
    if (first && first.t <= high) continue;
    const t = Math.max(0, high - .002);
    first = { t: high, x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t,
      z: from.z + (to.z - from.z) * t, hullId: hull.id };
  }
  return first;
}

/** Rock cover and intact cabin armor shelter actors from the blast. */
export function ultraRoofBlastReaches(game, actor, impact, radius = CONFIG.impactRadius) {
  const height = finite(actor.elevation), size = actor.playerControlled ? .42 : finite(actor.radius, .42);
  const tall = actor.boss ? Math.max(4, size * 3) : 2.4;
  if (Math.hypot(actor.x - impact.x, actor.z - impact.z) > radius + size
    || impact.y > height + tall + radius || impact.y < height - radius) return false;
  const from = { ...point(impact), y: Math.max(.35, impact.y) };
  const to = { x: actor.x, y: height + Math.min(1.2, tall / 2), z: actor.z };
  if (ultraRoofCoverImpact(from, to)) return false;
  return !hulls(game).some(hull => hull.id !== actor.id && ultraHullBlocks(hull, from, to));
}

/** Advance one rocket with bounded continuous cover tests. Damage is engine-specific. */
export function advanceUltraRoofMissile(game, bolt, dt, damage) {
  if (bolt.kind !== ULTRA_ROOF_MISSILE_KIND) return false;
  if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Roof missile time must be finite and nonnegative.');
  if (!(bolt.life > 0)) return true;
  let remaining = dt;
  if (!bolt.launched) {
    const owner = game.state.enemies.find(actor => actor.id === bolt.ownerId && actor.hp > 0 && actor.ultra);
    if (!owner || !game.canEnemyDamage(owner, bolt.weaponId)) { bolt.life = 0; return true; }
    const origin = ultraRoofMuzzle(owner, bolt.index);
    Object.assign(bolt, origin);
    const wait = Math.min(remaining, Math.max(0, -bolt.age));
    bolt.age += wait; bolt.life -= wait; remaining -= wait;
    if (bolt.age < -1e-9) return true;
    Object.assign(bolt, planUltraRoofFlight(origin, { x: bolt.targetX, y: bolt.targetY, z: bolt.targetZ }), { age: 0, launched: true });
    owner.ultra.roofFlash ??= [0, 0, 0, 0]; owner.ultra.roofFlash[bolt.index] = .4;
    game.emit('ultrarooflaunch', origin, { id: bolt.id, ownerId: owner.id, index: bolt.index, y: origin.y });
  }
  while (remaining > 1e-9 && bolt.life > 0) {
    const step = Math.min(.025, remaining); remaining -= step;
    const from = point(bolt), age = Math.min(bolt.flightTime, bolt.age + step);
    const to = ultraRoofFlightPoint(bolt, age);
    const cover = ultraRoofCoverImpact(from, to), hull = firstHullImpact(game, from, to);
    const hit = cover && (!hull || cover.t <= hull.t) ? cover : hull;
    bolt.age = age; bolt.life -= step;
    Object.assign(bolt, to); bolt.vy = (bolt.targetY - bolt.startY + .5 * bolt.gravity * bolt.flightTime ** 2) / bolt.flightTime - bolt.gravity * age;
    if (hit || age >= bolt.flightTime - 1e-9) {
      const impact = hit || to;
      Object.assign(bolt, point(impact)); bolt.life = 0;
      game.emit('ultraroofimpact', impact, { id: bolt.id, y: impact.y, radius: bolt.impactRadius, blocked: Boolean(hit) });
      damage(impact, bolt); break;
    }
  }
  return true;
}
