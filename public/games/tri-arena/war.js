import { ArenaGame, CREATURE_CATALOG, COLOSSEUM_CATALOG, DRILL_MINE_CATALOG, BOSS_CATALOG, COPPER_TRON, COPPER_FORTRESS, COPPER_MEGA_DRILL, COPPER_SPIDER_DRONE, COPPER_MINE_WALKER } from './simulation.js';
import { spiderDrillPoint, SPIDER_DRILL_IDS } from './spider-drone-combat.js';
import { mineWalkerDrillPoint } from './mine-walker-combat.js';
import { pendingMineWalkerCrew } from './mine-walker-occupants.js';
import { insideMineWalkerRoom, mineWalkerLocal, mineWalkerPoint } from './mine-walker-collision.js';
import { MINE_WALKER_LAYOUT, MINE_WALKER_FOOTPRINT_RADIUS, initializeMineWalkerFeet } from './mine-walker-layout.js';
import { FORTRESS_LAYOUT } from './fortress-layout.js';
import { OCTO_NOSE, updateOctoNose } from './war-guests.js';
import { WAR_PLAYER, equipWarPlayer } from './war-player.js';
import { MEGA_DRILL_LAYOUT, megaDrillPoint } from './mega-drill-layout.js';
import { getMegaDrillSegmentPoses, megaDrillRoomLocal, megaDrillRoomPoint } from './mega-drill-motion.js';
import { pendingMegaDrillCrew } from './mega-drill-occupants.js';
import { drillMineContains } from './drill-mine-layout.js';
import { MECH_SPIDER_TANK_ULTRA, spawnUltraCrew } from './mech-ultra-combat.js';
import { getUltraEncounterPose, ULTRA_CINEMATIC_DURATION } from './mech-ultra-encounter.js';
import { ultraArenaActive, ultraCoverBlocks, ultraInLava, ultraHullBlocks } from './mech-ultra-collision.js';
import { ultraDrillTip } from './mech-ultra-layout.js';
import { advanceUltraRoofMissile, ultraRoofBlastReaches } from './mech-ultra-roof-combat.js';
import { ULTRA_ROOF_MISSILE_KIND } from './mech-ultra-roof-missiles.js';
import { getUltraPatrolMobility } from './mech-ultra-motion.js';

export const WAR_LIMITS = Object.freeze({ total: 18, perTeam: 9, maxSeconds: 300, stalemateSeconds: 45 });
export const WAR_CATALOG = Object.freeze([...CREATURE_CATALOG, ...COLOSSEUM_CATALOG,
  ...DRILL_MINE_CATALOG.filter(entry => !COLOSSEUM_CATALOG.some(existing => existing.id === entry.id)),
  ...BOSS_CATALOG, COPPER_TRON, COPPER_FORTRESS, COPPER_MEGA_DRILL, COPPER_SPIDER_DRONE, COPPER_MINE_WALKER, MECH_SPIDER_TANK_ULTRA, OCTO_NOSE, WAR_PLAYER]
  .map(entry => Object.freeze({ ...entry, name: entry.name ?? entry.title })));
const TYPES = new Map(WAR_CATALOG.map(entry => [entry.id, entry]));
const TEAMS = ['blue', 'red'];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const wrap = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
const AIM_HEIGHT = { blob: .55, ling: 1.06, brain: 2, gardener: 3.25, trider: 3.4, spreader: 1.35,
  'copper-robot': 1.5, 'miner-bot': 1.5, knight: 1.5, 'copper-drill-worm': .95, 'copper-head-catapult': 1.1, 'copper-drill-hound': 1.25,
  'copper-repair-drone': .3, 'copper-giant': 2.73, 'frost-triram': 2, 'lake-terror': 1.7,
  'sky-eye': 3, 'trilom-leader': 2.2, 'trilom-wraith': 2.2, 'copper-fortress': 2, 'copper-mega-drill': 4.15, 'copper-spider-drone': 2.4, 'copper-mine-walker': 10.8, 'octo-nose': 1.8, 'war-player': 1.3 };
const PLACEMENT_RADIUS = { 'copper-fortress': 5.3, 'copper-tron-1000': 5.8, 'copper-giant': 2.8,
  'frost-triram': 3, 'lake-terror': 3.2, 'sky-eye': 3, gardener: 1.7, trider: 2.5, spreader: 1.8,
  'copper-drill-worm': 3.6, 'copper-drill-hound': 3.1, 'copper-head-catapult': 1.8, 'copper-spider-drone': 4.8, 'copper-mine-walker': MINE_WALKER_FOOTPRINT_RADIUS };
const placementRadius = type => type === MECH_SPIDER_TANK_ULTRA.id ? 34 : PLACEMENT_RADIUS[type] ?? .8;
const isMegaDrill = type => type === COPPER_MEGA_DRILL.id;

/** Only the long machine needs a box; existing deployment circles keep their behaviour. */
function deploymentsOverlap(a, b) {
  if (!isMegaDrill(a.type) && !isMegaDrill(b.type)) return distance(a, b) < placementRadius(a.type) + placementRadius(b.type) + .25;
  const halfX = MEGA_DRILL_LAYOUT.width / 2, halfZ = MEGA_DRILL_LAYOUT.length / 2;
  if (isMegaDrill(a.type) && isMegaDrill(b.type)) return Math.abs(a.x - b.x) < halfX * 2 + .25 && Math.abs(a.z - b.z) < halfZ * 2 + .25;
  const box = isMegaDrill(a.type) ? a : b, circle = box === a ? b : a;
  return Math.hypot(Math.max(0, Math.abs(circle.x - box.x) - halfX), Math.max(0, Math.abs(circle.z - box.z) - halfZ)) < placementRadius(circle.type) + .25;
}

function insideMegaDrill(actor, owner) {
  const height = finite(actor.elevation) - finite(owner.elevation);
  if (height < MEGA_DRILL_LAYOUT.deckHeight - .25 || height >= MEGA_DRILL_LAYOUT.roofY) return false;
  return getMegaDrillSegmentPoses(owner.wormDistance).some(pose => {
    const local = megaDrillRoomLocal(owner, pose, actor.x, actor.z);
    return Math.abs(local.x) < MEGA_DRILL_LAYOUT.width / 2 - .15 && Math.abs(local.z) <= 3.05;
  });
}

/** Army sandbox layered over the same enemy abilities as the player modes. */
export class WarGame extends ArenaGame {
  resetRun() {
    super.resetRun(); this.warActive = false; this.activeSource = null; this.activeTarget = null;
    this.pendingWarHits = new Map(); this.warTick = 0; this.hitSerial = 0; this.warPlayer = null;
  }

  startWar({ arenaId = 'colosseum' } = {}) {
    if (!['bonefields', 'colosseum', 'drill-mine'].includes(arenaId)) throw new RangeError(`Unknown arena: ${String(arenaId)}`);
    this.resetRun(); this.warActive = true; this.nextPlacementId = 1;
    Object.assign(this.state, { gameMode: 'war', playMode: 'war', arenaId, mode: 'war-setup', wave: 1,
      wavePlan: { hpScale: 1, speedScale: 1, damageScale: 1 },
      war: { phase: 'setup', roster: [], winner: null, elapsed: 0, counts: { blue: 0, red: 0 }, kills: { blue: 0, red: 0 },
        playerId: null, playerTeam: null, playerActive: false } });
    this.spectator = this.state.player; this.lastWarDamage = 0; this.emit('start', this.state.player);
    return this.state;
  }

  requireSetup() {
    if (!this.warActive || this.state.war.phase !== 'setup') throw new RangeError('Edit the army setup before changing units.');
  }

  requireTeam(team) { if (!TEAMS.includes(team)) throw new RangeError('Choose the blue or red army.'); }

  requireWarType(type) {
    const definition = TYPES.get(type);
    if (!definition) throw new RangeError(`Unknown war creature: ${String(type)}`);
    if (definition.exclusiveArena && definition.exclusiveArena !== this.state.arenaId) {
      throw new RangeError(`${definition.name} is exclusive to Drill Mine War battles.`);
    }
  }

  placeWarUnit({ team, type, x, z } = {}) {
    this.requireSetup(); this.requireTeam(team);
    this.requireWarType(type);
    const roster = this.state.war.roster, count = roster.filter(unit => unit.team === team).length;
    if (type === WAR_PLAYER.id && roster.some(unit => unit.type === WAR_PLAYER.id)) throw new RangeError('Only one Player can join a War battle.');
    if (isMegaDrill(type) && roster.some(unit => unit.team === team && isMegaDrill(unit.type))) throw new RangeError('Each army can deploy only one Copper Mega Drill.');
    if (type === MECH_SPIDER_TANK_ULTRA.id && roster.some(unit => unit.team === team && unit.type === type)) throw new RangeError('Each army can deploy only one Mech Spider Tank Ultra.');
    if (count >= WAR_LIMITS.perTeam || roster.length >= WAR_LIMITS.total) throw new RangeError('Each army can contain at most 9 units (18 total).');
    if ((x !== undefined && !Number.isFinite(x)) || (z !== undefined && !Number.isFinite(z))) throw new RangeError('Placement coordinates must be finite numbers.');
    const sign = team === 'blue' ? -1 : 1, radius = placementRadius(type);
    const margin = type === COPPER_FORTRESS.id ? 8 : Math.max(1, radius);
    const valid = point => type === MECH_SPIDER_TANK_ULTRA.id
      ? sign * point.x >= 45 && Math.abs(point.x) <= 140 && Math.abs(point.z) <= 110
      : (this.state.arenaId !== 'drill-mine' || (isMegaDrill(type)
      ? this.isMegaDrillPoseAllowed({ ...point, angle: team === 'blue' ? 0 : Math.PI, wormDistance: 0 })
      : drillMineContains(point.x, point.z, radius))) && (isMegaDrill(type)
      ? sign * point.x >= MEGA_DRILL_LAYOUT.width / 2 + .5 && Math.abs(point.x) <= this.arenaBounds.x - MEGA_DRILL_LAYOUT.width / 2 - .5
        && point.z + MEGA_DRILL_LAYOUT.rearZ >= -this.arenaBounds.z && point.z + MEGA_DRILL_LAYOUT.tipZ <= this.arenaBounds.z
      : sign * point.x >= .5 && Math.abs(point.x) <= this.arenaBounds.x - margin && Math.abs(point.z) <= this.arenaBounds.z - margin);
    const vacant = point => roster.every(other => !deploymentsOverlap({ type, ...point }, other));
    let point;
    if (x !== undefined || z !== undefined) {
      point = { x: x ?? sign * 12, z: z ?? 0 };
      if (!valid(point)) throw new RangeError(type === MECH_SPIDER_TANK_ULTRA.id
        ? 'Place Ultra beyond the island on its army’s side of the expanded cavern.'
        : `Place the ${team} army inside its ${team === 'blue' ? 'left' : 'right'} half of the arena.`);
      if (!vacant(point)) throw new RangeError('That position overlaps another unit. Leave room for its body.');
    } else {
      // Search actual empty positions rather than using roster length: removing a
      // middle slot must not place the next unit on an existing army member.
      for (const z of type === MECH_SPIDER_TANK_ULTRA.id ? [-12, 30, -50] : isMegaDrill(type) ? [0, -4, 4, -7.5, 7.5] : type === COPPER_MINE_WALKER.id ? [0, -8, 8] : [-8, 0, 8, -16, 16]) {
        for (const offset of type === MECH_SPIDER_TANK_ULTRA.id ? [65, 100, 130] : isMegaDrill(type) ? [16, 24, 8, 20, 12] : type === COPPER_MINE_WALKER.id ? [18, 16, 12, 20] : [6, 12, 18, 24]) {
          const candidate = { x: sign * offset, z };
          if (valid(candidate) && vacant(candidate)) { point = candidate; break; }
        }
        if (point) break;
      }
      if (!point) throw new RangeError('No clear placement remains on that side. Remove a unit or choose a smaller creature.');
    }
    const unit = { id: `war-${this.nextPlacementId++}`, type, team, ...point };
    roster.push(unit); this.createWarActor(unit); this.syncUltraWarArena(); this.updateWarCounts(); return unit;
  }

  syncUltraWarArena() {
    if (this.state.war.roster.some(unit => unit.type === MECH_SPIDER_TANK_ULTRA.id)) {
      this.state.ultraEncounter ||= { ...getUltraEncounterPose(ULTRA_CINEMATIC_DURATION),
        elapsed: ULTRA_CINEMATIC_DURATION, practice: false, war: true, complete: true };
    } else delete this.state.ultraEncounter;
  }

  createWarActor(unit) {
    this.requireWarType(unit.type);
    const actor = this.createEnemy(unit.type, unit.x, unit.z, { team: unit.team });
    const angle = isMegaDrill(unit.type) ? unit.team === 'blue' ? 0 : Math.PI : unit.team === 'blue' ? Math.PI / 2 : -Math.PI / 2;
    Object.assign(actor, { team: unit.team, setupId: unit.id, angle });
    if (actor.type === MECH_SPIDER_TANK_ULTRA.id) Object.assign(actor, { x: unit.x, z: unit.z });
    if (actor.type === COPPER_MINE_WALKER.id) initializeMineWalkerFeet(actor);
    if (actor.legAngle !== undefined) actor.legAngle = actor.angle;
    if (unit.type === WAR_PLAYER.id) {
      this.warPlayer = equipWarPlayer(this, actor);
      this.state.war.playerId = actor.id; this.state.war.playerTeam = actor.team;
    }
    this.state.enemies.push(actor); return actor;
  }

  removeWarUnit(id) {
    this.requireSetup(); const roster = this.state.war.roster, index = roster.findIndex(unit => unit.id === id);
    if (index < 0) return false;
    if (roster[index].type === WAR_PLAYER.id) {
      this.warPlayer = null; this.state.player = this.spectator;
      Object.assign(this.state.war, { playerId: null, playerTeam: null, playerActive: false });
      this.state.upgradeLevels = this.createState().upgradeLevels; this.applyUpgradeStats();
    }
    roster.splice(index, 1); this.state.enemies = this.state.enemies.filter(actor => actor.setupId !== id);
    this.syncUltraWarArena(); this.updateWarCounts(); return true;
  }

  clearWarTeam(team) {
    this.requireSetup(); if (team !== undefined && team !== 'all') this.requireTeam(team);
    const ids = this.state.war.roster.filter(unit => team === undefined || team === 'all' || unit.team === team).map(unit => unit.id);
    for (const id of ids) this.removeWarUnit(id); return ids.length;
  }

  startWarBattle() {
    this.requireSetup();
    for (const unit of this.state.war.roster) this.requireWarType(unit.type);
    if (TEAMS.some(team => !this.state.war.roster.some(unit => unit.team === team))) throw new RangeError('Place at least one unit in each army.');
    const roster = this.state.war.roster.map(unit => ({ ...unit })), arenaId = this.state.arenaId;
    this.startWar({ arenaId }); this.state.war.roster = roster;
    this.state.mode = 'playing'; this.state.war.phase = 'battle';
    for (const unit of roster) this.createWarActor(unit);
    this.syncUltraWarArena();
    for (const actor of [...this.state.enemies]) {
      if (actor.type === COPPER_FORTRESS.id) this.spawnFortressCrew(actor);
      if (isMegaDrill(actor.type)) this.spawnMegaDrillCrew(actor);
      if (actor.type === COPPER_MINE_WALKER.id) this.spawnMineWalkerCrew(actor);
      if (actor.type === MECH_SPIDER_TANK_ULTRA.id) this.withSource(actor, () => spawnUltraCrew(this, actor));
      if (actor.type === 'copper-drill-hound') this.maybeMountRider(actor);
    }
    this.state.war.playerActive = Boolean(this.warPlayer?.hp > 0);
    this.updateWarCounts(); return true;
  }

  resetWarBattle({ edit = false } = {}) {
    if (!this.warActive) return false;
    const roster = this.state.war.roster.map(unit => ({ ...unit })), arenaId = this.state.arenaId;
    this.startWar({ arenaId }); this.state.war.roster = roster;
    this.nextPlacementId = Math.max(0, ...roster.map(unit => Number(unit.id.slice(4)))) + 1;
    for (const unit of roster) this.createWarActor(unit);
    this.syncUltraWarArena(); this.updateWarCounts(); if (!edit) this.startWarBattle(); return true;
  }

  createEnemy(type, x, z, data = {}) {
    const team = data.team ?? this.activeSource?.team;
    const actor = super.createEnemy(type, x, z, team ? { ...data, team } : data);
    if (team) { actor.team = team; actor.warLastDamagedAt = this.state.elapsed; }
    if (type === OCTO_NOSE.id) Object.assign(actor, { hp: OCTO_NOSE.hp, maxHp: OCTO_NOSE.hp, octoHelping: false, repairTargetId: null });
    return actor;
  }

  enemyStats(type) {
    if (this.warActive && type === OCTO_NOSE.id) return OCTO_NOSE;
    return this.warActive && type === WAR_PLAYER.id ? WAR_PLAYER : super.enemyStats(type);
  }

  isWarPlayerActive() {
    return Boolean(this.warActive && this.state.war.playerActive && this.warPlayer?.hp > 0
      && ['playing', 'paused'].includes(this.state.mode));
  }

  isPlayerTarget(enemy) {
    return !this.warActive || Boolean(this.isWarPlayerActive() && enemy !== this.warPlayer && enemy.team !== this.warPlayer.team);
  }

  availableActorSlots(owner, { forMegaCrew = false, forWalkerCrew = false } = {}) {
    if (!this.warActive) return super.availableActorSlots(owner, { forMegaCrew, forWalkerCrew });
    const total = this.state.enemies.filter(actor => actor.hp > 0).length;
    const own = this.state.enemies.filter(actor => actor.hp > 0 && actor.team === owner?.team).length;
    const reserved = (forMegaCrew ? 0 : pendingMegaDrillCrew(this, owner?.team))
      + (forWalkerCrew ? 0 : pendingMineWalkerCrew(this, owner?.team));
    return Math.max(0, Math.min(WAR_LIMITS.total - total, WAR_LIMITS.perTeam - own - reserved));
  }

  areAllies(a, b) { return !this.warActive || a.team === b.team; }

  withSource(owner, callback) {
    const previous = this.activeSource; this.activeSource = owner;
    try { return callback(); } finally { this.activeSource = previous; }
  }
  summonMinions(owner, ...args) { return this.withSource(owner, () => super.summonMinions(owner, ...args)); }
  launchBlobs(owner, ...args) { return this.withSource(owner, () => super.launchBlobs(owner, ...args)); }
  fabricateTronRobots(owner) { return this.withSource(owner, () => super.fabricateTronRobots(owner)); }
  spawnFortressCrew(owner) { return this.withSource(owner, () => super.spawnFortressCrew(owner)); }
  spawnFortressDrone(owner) { return this.withSource(owner, () => super.spawnFortressDrone(owner)); }
  spawnMegaDrillCrew(owner) { return this.withSource(owner, () => super.spawnMegaDrillCrew(owner)); }
  spawnMineWalkerCrew(owner) { return this.withSource(owner, () => super.spawnMineWalkerCrew(owner)); }
  spawnSpiderDrone(owner) { return this.withSource(owner, () => super.spawnSpiderDrone(owner)); }
  maybeMountRider(owner, ...args) { return this.withSource(owner, () => super.maybeMountRider(owner, ...args)); }

  nearestFoe(actor) {
    const ownerFor = occupant => this.state.enemies.find(owner => owner.hp > 0
      && (owner.id === occupant.megaDrillId || owner.id === occupant.mineWalkerId));
    const inside = (occupant, owner) => owner.type === COPPER_MINE_WALKER.id ? insideMineWalkerRoom(owner, occupant) : insideMegaDrill(occupant, owner);
    const controllerHull = actor.pinnedCrew ? ownerFor(actor) : null;
    return this.state.enemies.filter(other => {
      if (other.hp <= 0 || other.team === actor.team) return false;
      if (other.pinnedCrew && other.fortressId != null && this.state.enemies.some(fortress => fortress.id === other.fortressId && fortress.hp > 0)) return false;
      if (controllerHull && !inside(other, controllerHull)) return false;
      const occupiedHull = ownerFor(other);
      return !occupiedHull || !inside(other, occupiedHull) || inside(actor, occupiedHull);
    })
      .sort((a, b) => distance(actor, a) - distance(actor, b) || a.id - b.id)[0] ?? null;
  }

  targetPoint(attacker, target) {
    let point = { x: target.x, z: target.z, y: target.elevation + (AIM_HEIGHT[target.type] ?? 1.3) - finite(target.bodyDrop) };
    if (target.type === COPPER_TRON.id && target.bodyDrop < 2.4) {
      const angle = finite(target.legAngle, target.angle), candidates = [Math.PI, Math.PI / 3, -Math.PI / 3]
        .map((leg, index) => {
          if (target.structureState?.[`leg-${index}`]?.remaining === 0) return null;
          const radius = index === 0 ? 5 : 4.05, x = Math.sin(leg) * radius, z = Math.cos(leg) * radius - .35;
          return { x: target.x + Math.cos(angle) * x + Math.sin(angle) * z,
            z: target.z - Math.sin(angle) * x + Math.cos(angle) * z, y: target.elevation + 1.3 };
        }).filter(Boolean).sort((a, b) => distance(attacker, a) - distance(attacker, b));
      if (candidates[0]) point = candidates[0];
    } else if (target.type === COPPER_MINE_WALKER.id) {
      const feet = target.walkerFeet.filter((_, index) => target.structureState?.[`walker-leg-${index}`]?.remaining !== 0)
        .sort((a, b) => distance(attacker, a) - distance(attacker, b));
      if (feet[0]) point = { ...feet[0] };
      else {
        const local = mineWalkerLocal(target, attacker.x, attacker.z), halfX = MINE_WALKER_LAYOUT.width / 2, halfZ = MINE_WALKER_LAYOUT.depth / 2;
        const edge = Math.abs(local.x / halfX) > Math.abs(local.z / halfZ)
          ? { x: Math.sign(local.x || 1) * halfX, z: clamp(local.z, -halfZ, halfZ), y: MINE_WALKER_LAYOUT.floorY + .6 }
          : { x: clamp(local.x, -halfX, halfX), z: Math.sign(local.z || 1) * halfZ, y: MINE_WALKER_LAYOUT.floorY + .6 };
        point = mineWalkerPoint(target, edge);
      }
    } else if (target.type === COPPER_SPIDER_DRONE.id) {
      const tips = SPIDER_DRILL_IDS.map((id, index) => {
        if (target.structureState?.[`spider-leg-${index}`]?.remaining === 0) return null;
        const tip = spiderDrillPoint(target, index);
        return this.canEnemyDamage(target, id) ? tip : { x: target.x + (tip.x - target.x) * .77,
          z: target.z + (tip.z - target.z) * .77, y: finite(target.elevation) + 1.05 };
      }).filter(Boolean).sort((a, b) => distance(attacker, a) - distance(attacker, b));
      if (tips.length) point = tips[0];
      else {
        const gap = Math.max(.01, distance(attacker, target));
        point.x += (attacker.x - target.x) / gap * 1.6; point.z += (attacker.z - target.z) / gap * 1.6;
      }
    } else if (isMegaDrill(target.type)) {
      const halfX = MEGA_DRILL_LAYOUT.width / 2, halfZ = MEGA_DRILL_LAYOUT.hullLength / MEGA_DRILL_LAYOUT.rooms.length / 2;
      let nearest = Infinity;
      for (const pose of getMegaDrillSegmentPoses(target.wormDistance)) {
        const local = megaDrillRoomLocal(target, pose, attacker.x, attacker.z);
        const edge = { x: clamp(local.x, -halfX, halfX), z: clamp(local.z, -halfZ, halfZ) };
        if (Math.abs(local.x) < halfX && Math.abs(local.z) < halfZ) {
          const faces = [{ gap: local.x + halfX, x: -halfX, z: local.z }, { gap: halfX - local.x, x: halfX, z: local.z },
            { gap: local.z + halfZ, x: local.x, z: -halfZ }, { gap: halfZ - local.z, x: local.x, z: halfZ }];
          Object.assign(edge, faces.sort((a, b) => a.gap - b.gap)[0]);
        }
        const candidate = megaDrillRoomPoint(target, pose, edge.x, edge.z), gap = distance(attacker, candidate);
        if (gap < nearest) { nearest = gap; point = { ...candidate, y: target.elevation + 2 }; }
      }
    } else if (target.type === COPPER_FORTRESS.id) {
      const local = this.fortressLocal(target, attacker.x, attacker.z), halfX = FORTRESS_LAYOUT.width / 2, halfZ = FORTRESS_LAYOUT.depth / 2;
      const edge = Math.abs(local.x / halfX) > Math.abs(local.z / halfZ)
        ? { x: Math.sign(local.x) * halfX, z: clamp(local.z, -halfZ, halfZ), y: 2 }
        : { x: clamp(local.x, -halfX, halfX), z: Math.sign(local.z) * halfZ, y: 2 };
      point = this.fortressPoint(target, edge);
    } else {
      const d = Math.max(.01, distance(attacker, target)), radius = Math.min(target.radius, Math.max(0, d - .5));
      point.x += (attacker.x - target.x) / d * radius; point.z += (attacker.z - target.z) / d * radius;
    }
    return point;
  }

  update(delta, input = {}) {
    if (!this.warActive) return super.update(delta, input);
    if (this.state.mode !== 'playing' || this.state.war.phase !== 'battle') return;
    const dt = clamp(finite(delta), 0, .05); this.warTick++;
    for (const hit of [...this.pendingWarHits.values()]) if (hit.tick < this.warTick) this.applyWarHit(hit.event, null);
    if (this.state.mode !== 'playing') return;
    this.state.elapsed += dt; this.state.war.elapsed = this.state.elapsed;
    const floor = this.isWarPlayerActive() ? this.updatePlayerMovement(dt, input) : null;
    for (const actor of [...this.state.enemies]) {
      if (actor.playerControlled) continue;
      actor.warStrikeCooldown = Math.max(0, finite(actor.warStrikeCooldown) - dt);
      actor.warSlowTime = Math.max(0, finite(actor.warSlowTime) - dt);
      const foe = this.nearestFoe(actor); if (actor.hp <= 0 || !foe) continue;
      const point = this.targetPoint(actor, foe), proxy = { ...foe, x: point.x, z: point.z, elevation: Math.max(0, point.y - 1.3) };
      const player = this.state.player, speed = actor.speedScale;
      this.activeSource = actor; this.activeTarget = foe; this.state.player = proxy;
      if (actor.warSlowTime > 0) actor.speedScale *= .55;
      try {
        if (actor.type === OCTO_NOSE.id) updateOctoNose(this, actor, dt);
        else super.updateEnemy(actor, dt);
        if (actor.type === 'knight') this.updateKnightGuard(actor, dt);
      }
      finally {
        foe.x += proxy.x - point.x; foe.z += proxy.z - point.z;
        actor.speedScale = speed; this.state.player = player; this.activeSource = null; this.activeTarget = null;
      }
    }
    this.separateEnemies();
    if (this.isWarPlayerActive()) {
      this.separatePlayer(); this.resolvePlayerFloor(floor.wasGrounded, floor.height);
    }
    for (const actor of this.state.enemies) {
      if (actor.mounted) this.updateMountedRider(actor);
      if (actor.megaDrillId != null) this.syncMegaDrillOccupant(actor);
      if (actor.mineWalkerId != null) this.syncMineWalkerOccupant(actor);
      if (actor.pinnedCrew && actor.fortressId != null) this.updateFortressCrew(actor);
    }
    this.updateWarLava(dt);
    this.updateProjectiles(dt); this.updateHazards(dt); this.removeDead(); this.updateWarCounts(); this.checkWave();
  }

  /** Lava remains an arena hazard for both armies, including a possessed human. */
  updateWarLava(dt) {
    if (!ultraArenaActive(this.state)) return;
    for (const actor of this.state.enemies) {
      actor.warLavaCooldown = Math.max(0, finite(actor.warLavaCooldown) - dt);
      if (actor.hp <= 0 || actor.boss || actor.ultraRoom != null || actor.spirit
        || ['brain', 'copper-repair-drone'].includes(actor.type) || !ultraInLava(actor) || actor.warLavaCooldown > 0) continue;
      const lava = { type: 'lava', team: actor.team === 'blue' ? 'red' : 'blue', x: actor.x, z: actor.z, environmental: true };
      this.damageWarActor(actor, 18, lava); actor.warLavaCooldown = .55;
    }
  }

  hurtPlayer(amount, source) {
    if (!this.warActive) return super.hurtPlayer(amount, source);
    const attacker = this.activeSource ?? source, target = this.activeTarget;
    if (!target || target.hp <= 0 || this.areAllies(attacker, target) || attacker.warStrikeCooldown > 0) return false;
    if (target.playerControlled) return this.damageWarActor(target, amount, attacker);
    const origin = attacker.type === MECH_SPIDER_TANK_ULTRA.id ? ultraDrillTip(attacker)
      : attacker.type === COPPER_MINE_WALKER.id ? attacker.attackContact ?? mineWalkerDrillPoint(attacker)
      : attacker.type === COPPER_SPIDER_DRONE.id ? attacker.attackContact ?? spiderDrillPoint(attacker) : isMegaDrill(attacker.type)
      ? megaDrillPoint(attacker, { x: 0, y: MEGA_DRILL_LAYOUT.drillAxisY, z: MEGA_DRILL_LAYOUT.tipZ })
      : { x: attacker.x, z: attacker.z, y: attacker.elevation + Math.min(2.7, AIM_HEIGHT[attacker.type] ?? 1.4) - finite(attacker.bodyDrop) };
    const point = this.targetPoint(origin, target);
    const event = { type: 'warhit', hitId: ++this.hitSerial, id: target.id, targetId: target.id, attackerId: attacker.id,
      x: target.x, z: target.z, originX: origin.x, originY: origin.y, originZ: origin.z,
      attackAngle: Math.atan2(point.x - origin.x, point.z - origin.z), pitch: Math.atan2(point.y - origin.y, Math.max(.2, distance(origin, point))),
      cutTilt: attacker.attackIndex % 2 ? Math.PI / 2 : 0, reach: 3.6, arc: 1.2, bladePower: attacker.boss ? 1.7 : 1,
      amount: Math.max(0, finite(amount)), team: attacker.team, weapon: 'sword' };
    this.pendingWarHits.set(event.hitId, { event, attacker, target, tick: this.warTick });
    this.events.push(event); attacker.warStrikeCooldown = .25; return true;
  }

  applyWarHit(event, result) {
    const hit = this.pendingWarHits?.get(event.hitId); if (!hit) return false;
    this.pendingWarHits.delete(event.hitId);
    if (hit.target.hp <= 0) { this.checkWave(); return false; }
    this.withSource(hit.attacker, () => {
      if (hit.target.playerControlled) { this.damageWarActor(hit.target, event.amount, hit.attacker); return; }
      if (result) {
        if (result.removedFraction > 0 || result.absorbedHits?.length > 0 || result.legsLost > 0) this.lastWarDamage = this.state.elapsed;
        const physicalBoss = [COPPER_TRON.id, COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, MECH_SPIDER_TANK_ULTRA.id].includes(hit.target.type);
        this.applySliceResult(hit.target.id, physicalBoss ? result : { ...result, bodyDamageFraction: 0 });
        if (!physicalBoss && hit.target.hp > 0 && result.removedFraction > 0 && !result.absorbedHits?.length) this.damageWarActor(hit.target, event.amount, hit.attacker);
      } else this.damageWarActor(hit.target, event.amount, hit.attacker);
    });
    this.removeDead(); return true;
  }

  applySliceResult(id, result = {}) {
    const actor = this.state.enemies.find(enemy => enemy.id === id && enemy.hp > 0), before = actor?.hp;
    if (this.warActive && actor?.playerControlled) return false;
    const progress = result.removedFraction > 0 || result.absorbedHits?.length > 0 || result.legsLost > 0;
    if (this.warActive && actor && !actor.shielded && this.state.mode === 'playing' && progress) this.recordWarDamage(actor);
    const source = !this.activeSource && this.isWarPlayerActive() && actor?.team !== this.warPlayer.team ? this.warPlayer : this.activeSource;
    const applied = source ? this.withSource(source, () => super.applySliceResult(id, result)) : super.applySliceResult(id, result);
    if (this.warActive && applied && actor.hp < before) this.recordWarDamage(actor);
    return applied;
  }

  recordWarDamage(actor) {
    actor.warLastDamagedAt = this.state.elapsed; this.lastWarDamage = this.state.elapsed;
  }

  damageWarActor(target, amount, source) {
    if (target.hp <= 0 || target.shielded || !source || this.areAllies(source, target)) return false;
    if (target.playerControlled) {
      const player = this.state.player, before = target.hp; this.state.player = target;
      let applied;
      try {
        applied = super.hurtPlayer(amount, source);
        if (target.hp < before) this.recordWarDamage(target);
        if (target.hp === 0) { this.state.mode = 'playing'; this.withSource(source, () => this.finishKill(target, 'war')); }
      } finally { this.state.player = player; }
      return applied;
    }
    const damage = Math.min(target.hp, Math.ceil(Math.max(0, finite(amount)))); if (!damage) return false;
    target.hp -= damage; this.recordWarDamage(target);
    this.emit('hit', target, { id: target.id, enemyType: target.type, amount: damage, weapon: 'war', healthRatio: target.hp / target.maxHp });
    if (target.hp === 0) this.withSource(source, () => this.finishKill(target, 'war'));
    return true;
  }

  finishKill(enemy, weapon) {
    if (!this.warActive) return super.finishKill(enemy, weapon);
    if (enemy.defeated) return;
    if (enemy.playerControlled) {
      enemy.defeated = true; enemy.hp = 0; this.state.war.playerActive = false;
      if (this.activeSource?.team && this.activeSource.team !== enemy.team) this.state.war.kills[this.activeSource.team]++;
      this.recordWarDamage(enemy);
      this.emit('warplayerdown', enemy, { id: enemy.id, team: enemy.team }); return;
    }
    const player = this.state.player;
    this.state.player = this.activeSource?.playerControlled && this.activeSource.hp > 0 ? this.activeSource : this.spectator;
    try { super.finishKill(enemy, weapon); } finally { this.state.player = player; }
    if (this.activeSource?.team && this.activeSource.team !== enemy.team) this.state.war.kills[this.activeSource.team]++;
    this.lastWarDamage = this.state.elapsed;
  }

  fireProjectiles(owner, count, options = {}) {
    if (this.warActive && this.activeTarget) {
      const target = this.targetPoint(owner, this.activeTarget), speed = finite(options.speed, 8);
      const y = finite(options.y, owner.elevation + (AIM_HEIGHT[owner.type] ?? 1.3) - finite(owner.bodyDrop));
      const travel = Math.max(.25, Math.hypot(target.x - finite(options.x, owner.x), target.z - finite(options.z, owner.z)) / speed);
      // Arena bolts aimed at a human implicitly use its height. Army targets may
      // be a tall Trider or a low Blob; explicit lob/muzzle trajectories win.
      options = { ...options, y, vy: finite(options.vy, (target.y - y) / travel) };
    }
    const first = this.state.projectiles.length; super.fireProjectiles(owner, count, options);
    if (this.warActive) for (const bolt of this.state.projectiles.slice(first)) { bolt.team = owner.team; bolt.targetId = this.activeTarget?.id; }
  }
  addHazard(owner, ...args) {
    const first = this.state.hazards.length; super.addHazard(owner, ...args);
    if (this.warActive) for (const hazard of this.state.hazards.slice(first)) { hazard.team = owner.team; hazard.hitIds = []; hazard.warTicks = {}; }
  }

  updateProjectiles(dt) {
    if (!this.warActive) return super.updateProjectiles(dt);
    const ultraHulls = this.state.enemies.filter(actor => actor.type === MECH_SPIDER_TANK_ULTRA.id && actor.hp > 0);
    for (const bolt of this.state.projectiles) {
      const owner = this.state.enemies.find(actor => actor.id === bolt.ownerId) ?? { team: bolt.team, x: bolt.x - bolt.vx, z: bolt.z - bolt.vz };
      const foes = this.state.enemies.filter(actor => actor.hp > 0 && actor.team !== bolt.team);
      if (bolt.kind === ULTRA_ROOF_MISSILE_KIND) {
        advanceUltraRoofMissile(this, bolt, dt, (impact, rocket) => {
          const source = { ...owner, x: impact.x, z: impact.z };
          for (const victim of foes) if (ultraRoofBlastReaches(this, victim, impact, rocket.impactRadius)) {
            this.damageWarActor(victim, rocket.damage, source);
          }
        });
        continue;
      }
      const target = foes.find(actor => actor.id === bolt.targetId) ?? foes.sort((a, b) => distance(a, bolt) - distance(b, bolt))[0];
      if (bolt.arming > 0) bolt.arming = Math.max(0, bolt.arming - dt);
      if (target && bolt.kind === 'copper-missile' && bolt.homing) {
        if (!(bolt.arming > 0)) bolt.homingTime = Math.max(0, bolt.homingTime - dt);
        if (bolt.homingTime === 0 || distance(bolt, target) <= 5) { bolt.homing = false; bolt.lockLost = true; }
      }
      if (target && bolt.homing && !(bolt.arming > 0)) {
        const angle = Math.atan2(bolt.vx, bolt.vz), desired = Math.atan2(target.x - bolt.x, target.z - bolt.z);
        const turn = angle + clamp(wrap(desired - angle), -bolt.turnRate * dt, bolt.turnRate * dt);
        bolt.vx = Math.sin(turn) * bolt.speed; bolt.vz = Math.cos(turn) * bolt.speed;
        bolt.y = finite(bolt.y, 1.3);
        const height = target.elevation + (AIM_HEIGHT[target.type] ?? 1.3) - finite(target.bodyDrop);
        const vy = clamp((height - bolt.y) / Math.max(.25, distance(target, bolt) / bolt.speed), -bolt.speed, bolt.speed);
        bolt.vy = finite(bolt.vy) + clamp(vy - finite(bolt.vy), -bolt.speed * dt * 2, bolt.speed * dt * 2);
      }
      const previous = { x: bolt.x, y: finite(bolt.y, 1.3), z: bolt.z };
      bolt.x += bolt.vx * dt; bolt.z += bolt.vz * dt; bolt.life -= dt;
      if (Number.isFinite(bolt.y)) {
        bolt.y += finite(bolt.vy) * dt - .5 * finite(bolt.gravity) * dt ** 2;
        if (bolt.gravity) { bolt.vy -= bolt.gravity * dt; bolt.age += dt; if (bolt.y < .1) bolt.life = 0; }
      }
      if (ultraArenaActive(this.state) && ultraCoverBlocks(previous, { ...bolt, y: finite(bolt.y, 1.3) })) { bolt.life = 0; continue; }
      if (ultraHulls.some(hull => hull.team === bolt.team && ultraHullBlocks(hull, previous, { x: bolt.x, y: finite(bolt.y, 1.3), z: bolt.z }))) {
        bolt.life = 0; continue;
      }
      if (target && bolt.kind === 'copper-missile' && bolt.homing && distance(bolt, target) <= 5) {
        bolt.homing = false; bolt.lockLost = true;
      }
      if (!(bolt.arming > 0)) for (const victim of foes) {
        const height = victim.elevation + (AIM_HEIGHT[victim.type] ?? 1.3) - finite(victim.bodyDrop);
        const radius = victim.playerControlled ? .65 : victim.radius;
        const heightTolerance = victim.playerControlled ? .8 + bolt.radius : Math.max(.9, victim.radius);
        if (distance(bolt, victim) > radius + bolt.radius || Math.abs(finite(bolt.y, 1.3) - height) > heightTolerance) continue;
        this.damageWarActor(victim, bolt.damage, owner); bolt.life = 0; break;
      }
    }
    this.state.projectiles = this.state.projectiles.filter(bolt => bolt.life > 0 && Math.abs(bolt.x) < this.arenaBounds.x + 2 && Math.abs(bolt.z) < this.arenaBounds.z + 2);
  }

  updateHazards(dt) {
    if (!this.warActive) return super.updateHazards(dt);
    for (const hazard of this.state.hazards) {
      hazard.life -= dt; hazard.delay = Math.max(0, hazard.delay - dt);
      if (hazard.delay > 0 || hazard.warningOnly) continue;
      if (hazard.type === 'shockwave') hazard.radius = Math.min(hazard.maxRadius, hazard.radius + hazard.speed * dt);
      for (const actor of this.state.enemies) {
        if (actor.hp <= 0 || actor.team === hazard.team) continue;
        const floor = ['frost', 'infection', 'shockwave'].includes(hazard.type); if (floor && actor.elevation > .65) continue;
        const d = distance(actor, hazard), inside = hazard.type === 'infection'
          ? Math.abs(actor.x - hazard.x) < hazard.halfSize && Math.abs(actor.z - hazard.z) < hazard.halfSize
          : hazard.type === 'shockwave' ? Math.abs(d - hazard.radius) < actor.radius + .5 : d < hazard.radius + actor.radius;
        if (!inside) continue;
        const owner = this.state.enemies.find(other => other.id === hazard.ownerId) ?? { team: hazard.team, x: hazard.x, z: hazard.z };
        if (['frost', 'infection'].includes(hazard.type)) {
          if (actor.playerControlled) actor.slowTime = .65; else actor.warSlowTime = .65;
          if ((hazard.warTicks[actor.id] ?? 0) <= this.state.elapsed) {
            this.damageWarActor(actor, hazard.damage * (hazard.type === 'infection' ? 1 : .35), owner);
            hazard.warTicks[actor.id] = this.state.elapsed + (hazard.type === 'infection' ? 1 : .8);
          }
        } else if (!hazard.hitIds.includes(actor.id)) {
          this.damageWarActor(actor, hazard.damage, owner); hazard.hitIds.push(actor.id);
        }
      }
    }
    this.state.hazards = this.state.hazards.filter(hazard => hazard.life > 0);
  }

  updateWarCounts() {
    if (!this.warActive) return;
    this.state.war.counts = Object.fromEntries(TEAMS.map(team => [team, this.state.enemies.filter(actor => actor.team === team && actor.hp > 0).length]));
  }

  checkWave() {
    if (!this.warActive) return super.checkWave();
    if (this.state.war.phase !== 'battle' || this.state.mode !== 'playing' || this.pendingWarHits.size) return;
    this.updateWarCounts(); const counts = this.state.war.counts;
    // A functional Ultra physically walks out into the lava and back into
    // drill reach. Give that bounded attack cycle time without resetting the
    // damage clock or weakening the global five-minute battle limit.
    const ultraGrace = this.state.enemies.reduce((seconds, actor) => {
      if (actor.hp <= 0 || actor.type !== MECH_SPIDER_TANK_ULTRA.id || !this.canEnemyDamage(actor, 'ultra-drill')) return seconds;
      const mobility = getUltraPatrolMobility(actor);
      return mobility > 0 ? Math.max(seconds, Math.min(WAR_LIMITS.maxSeconds - 1, 90 / mobility)) : seconds;
    }, WAR_LIMITS.stalemateSeconds);
    const timedOut = this.state.elapsed >= WAR_LIMITS.maxSeconds || this.state.elapsed - this.lastWarDamage >= ultraGrace;
    if (counts.blue && counts.red && !timedOut) return;
    this.state.war.winner = timedOut || (!counts.blue && !counts.red) ? 'draw' : counts.blue ? 'blue' : 'red';
    this.state.war.phase = 'finished'; this.state.mode = 'war-result';
    this.state.war.playerActive = false;
    this.emit('warresult', this.spectator, { winner: this.state.war.winner, elapsed: this.state.elapsed });
  }

  damageEnemy(enemy, ...args) {
    if (!this.warActive) return super.damageEnemy(enemy, ...args);
    if (!this.isPlayerTarget(enemy)) return;
    const before = enemy.hp;
    this.withSource(this.warPlayer, () => super.damageEnemy(enemy, ...args));
    if (enemy.hp < before) this.recordWarDamage(enemy);
  }

  attack(...args) { return this.warActive && !this.isWarPlayerActive() ? false : super.attack(...args); }
  dash(...args) { return this.warActive && !this.isWarPlayerActive() ? false : super.dash(...args); }
  kick(...args) { return this.warActive && !this.isWarPlayerActive() ? false : super.kick(...args); }
  jump(...args) { return this.warActive && !this.isWarPlayerActive() ? false : super.jump(...args); }
}
