/** Deterministic, renderer-independent arena combat. Distances are world metres. */
import { getArenaBounds, getArenaSpawnRadius } from './arena-config.js';
import { EYE_HEIGHT, SWORD_REACH } from './sword-config.js';
import { startPlayerJump, updatePlayerJump } from './player-jump.js';
import { GROUND_SUPPORT_PROFILES, supportId } from './ground-support.js';
import { FORTRESS_LAYOUT, FORTRESS_CANNON_MOUNTS, FORTRESS_CREW_SEATS } from './fortress-layout.js';
import { COPPER_MEGA_DRILL, initializeMegaDrill, updateMegaDrill, megaDrillReactorDamage,
  fabricateMegaDrillRobot, spawnMegaDrillDrone } from './mega-drill-combat.js';
import { megaDrillFloor, separateMegaDrillPlayer } from './mega-drill-collision.js';
import { pendingMegaDrillCrew, spawnMegaDrillCrew, syncMegaDrillOccupant,
  updateMegaDrillOccupant, releaseMegaDrillOccupants } from './mega-drill-occupants.js';
export { COPPER_MEGA_DRILL } from './mega-drill-combat.js';
import { MINER_BOT, DRILL_MINE_MIX, MINERS_PER_TUNNEL, MINE_MINER_TOTAL, MINE_ACTOR_LIMIT,
  mineMinerSpawn, mineTunnelSpawn, startMineEmergence, advanceMineEmergence,
  constrainMineMegaPose, mineMegaPoseAllowed } from './drill-mine-encounters.js';
import { DRILL_MINE_TUNNELS, separateDrillMineActor } from './drill-mine-layout.js';
import { COPPER_SPIDER_DRONE, initializeSpiderDrone, updateSpiderDrone } from './spider-drone-combat.js';
export { COPPER_SPIDER_DRONE } from './spider-drone-combat.js';
import { COPPER_MINE_WALKER, initializeMineWalker, updateMineWalker } from './mine-walker-combat.js';
export { COPPER_MINE_WALKER } from './mine-walker-combat.js';
import { mineWalkerFloor, separateMineWalkerPlayer, updateMineWalkerClimb, detachMineWalkerClimb } from './mine-walker-collision.js';
import { MINE_WALKER_FOOTPRINT_RADIUS } from './mine-walker-layout.js';
import { pendingMineWalkerCrew, spawnMineWalkerCrew, syncMineWalkerOccupant,
  updateMineWalkerOccupant, releaseMineWalkerOccupants } from './mine-walker-occupants.js';
import { MECH_SPIDER_TANK_ULTRA, initializeMechUltra, updateMechUltra,
  constrainUltraOccupant, releaseUltraOccupants } from './mech-ultra-combat.js';
import { updateUltraCrewStation } from './mech-ultra-crew.js';
import { advanceUltraRoofMissile, ultraRoofBlastReaches } from './mech-ultra-roof-combat.js';
import { ULTRA_ROOF_MISSILE_KIND } from './mech-ultra-roof-missiles.js';
import { beginUltraEncounter, advanceUltraEncounter } from './mech-ultra-encounter.js';
import { ultraRimMinerSpawn, ultraRimSpecialSpawn } from './mech-ultra-spawns.js';
import { ultraFloor, separateUltraPlayer, separateUltraCover, ultraCoverBlocks, ultraInLava, ultraHullBlocks } from './mech-ultra-collision.js';
export { MECH_SPIDER_TANK_ULTRA } from './mech-ultra-combat.js';

const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const length = (x, z) => Math.hypot(x, z);
const wrapAngle = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const TYPES = {
  'miner-bot': MINER_BOT,
  ling: { name: 'Tri Ling', hp: 44, radius: 0.65, speed: 3.5, range: 1.6, windup: 0.58, recovery: 0.95, damage: 13, score: 100 },
  brain: { name: 'Tri Brain', hp: 65, radius: 0.95, speed: 2.5, range: 12, windup: 0.9, recovery: 1.5, damage: 17, score: 180 },
  gardener: { name: 'The Gardener', hp: 155, radius: 1.2, speed: 2.25, range: 3.2, windup: 1.05, recovery: 1.5, damage: 26, score: 350 },
  blob: { name: 'Tri Blob', hp: 24, radius: 0.5, speed: 2.8, range: 1.2, windup: 0.65, recovery: 1.05, damage: 9, score: 65 },
  trider: { name: 'Trider', hp: 180, radius: 1.15, speed: 2.65, range: 3.3, windup: 0.9, recovery: 1.4, damage: 21, score: 400 },
  spreader: { name: 'Tri Spreader', hp: 110, radius: 1.65, speed: 1.05, range: 3, windup: 1.25, recovery: 6.55, damage: 8, score: 320 },
  'copper-robot': { name: 'Robot', hp: 90, radius: .65, speed: 3.1, range: 2, windup: .7, recovery: 1.1, damage: 16, score: 160 },
  knight: { name: 'Robot with shield', hp: 115, radius: .65, speed: 2.85, range: 2.3, windup: .8, recovery: 1.2, damage: 19, score: 200 },
  'copper-drill-worm': { name: 'Copper Drill Worm', hp: 190, radius: 1.25, speed: 2.4, range: 8, windup: .95, recovery: 1.5, damage: 24, score: 420 },
  'copper-head-catapult': { name: 'Copper Head Catapult', hp: 210, radius: 1.15, speed: 1.8, range: 16, windup: 1.25, recovery: 2.4, damage: 22, score: 460 },
  'copper-drill-hound': { name: 'Copper Drill Hound', hp: 165, radius: .95, speed: 4.3, range: 5.5, windup: .75, recovery: 1.2, damage: 22, score: 440 },
  'copper-repair-drone': { name: 'Copper Repair Drone', hp: 50, radius: .45, speed: 4, range: 3, windup: 0, recovery: 2, damage: 0, score: 150 },
};
export const COLOSSEUM_CATALOG = Object.freeze([
  { id: 'copper-robot', mode: 'copper', name: 'Robot', description: 'A copper arena robot with a close-range blade.', attackHelp: 'Sidestep its raised blade and cut during recovery.' },
  { id: 'knight', mode: 'knight', name: 'Robot with shield', description: 'An armored robot with a held shield and a deliberate sword strike.', attackHelp: 'Cut exposed limbs or break the shield pixels, then close in during recovery.' },
  { id: 'copper-drill-worm', mode: 'copper', name: 'Copper Drill Worm', unlockWave: 11, description: 'A segmented copper crawler with a spinning forward drill.', attackHelp: 'Sidestep its marked drill lunge or sever the drill to disable its attacks.' },
  { id: 'copper-head-catapult', mode: 'copper', name: 'Copper Head Catapult', unlockWave: 11, description: 'A copper crawler that lobs shield-robot heads toward a marked position.', attackHelp: 'Move away during its windup or cut the launcher before it throws.' },
  { id: 'copper-drill-hound', mode: 'copper', name: 'Copper Drill Hound', unlockWave: 15, description: 'A fast copper wolf body with a rotating drill head. Rarely carries a robot rider.', attackHelp: 'Sidestep its committed drill pounce. Cut the drill or strike the mount and rider independently.' },
  { id: 'copper-repair-drone', mode: 'copper', name: 'Copper Repair Drone', unlockWave: 10, description: 'A small flying repair assistant deployed by the Copper Fortress.', attackHelp: 'Destroy it to stop nearby copper machines repairing their attached armor.' },
].map(Object.freeze));
export const DRILL_MINE_CATALOG = Object.freeze([MINER_BOT, ...COLOSSEUM_CATALOG
  .filter(entry => ['copper-drill-worm', 'copper-drill-hound'].includes(entry.id)).map(entry => Object.freeze({ ...entry, unlockWave: 1 }))]);
const DRILL_MINE_TYPES = DRILL_MINE_CATALOG.map(entry => entry.id);
const COLOSSEUM_TYPES = Object.freeze(COLOSSEUM_CATALOG.map(entry => entry.id));
const COLOSSEUM_LATE_TYPES = Object.freeze(['copper-drill-worm', 'copper-head-catapult']);
const HOUND_TYPE = 'copper-drill-hound';
const COLOSSEUM_EXCLUSIVE_TYPES = Object.freeze([...COLOSSEUM_LATE_TYPES, HOUND_TYPE, 'copper-repair-drone']);
const RIDER_SEAT = Object.freeze({ x: 0, y: .95, z: -.15, scale: .8 });
const SPATIAL_EXTENTS = Object.freeze({ 'copper-tron-1000': 6.8, 'copper-drill-worm': 3.6, [HOUND_TYPE]: 3.25, 'copper-fortress': 6.8, 'copper-mega-drill': 17.2, 'copper-spider-drone': 4.8, 'copper-mine-walker': MINE_WALKER_FOOTPRINT_RADIUS, [MECH_SPIDER_TANK_ULTRA.id]: 130 });
const HOUND_LEG_IDS = Object.freeze(Array.from({ length: 4 }, (_, index) => `hound-leg-${index}`));
const HOUND_MAX_DROP = .57;
function validateArena(arenaId, colosseumMode) {
  if (!['bonefields', 'colosseum', 'drill-mine'].includes(arenaId)) throw new RangeError(`Unknown arena: ${String(arenaId)}`);
  if (!['copper', 'knight'].includes(colosseumMode)) throw new RangeError(`Unknown Colosseum mode: ${String(colosseumMode)}`);
}
function copyVoxelState(value, label, maxCount = 32000, maxEntries = 64) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(`Voxel ${label} state must be a count map.`);
  const entries = Object.entries(value);
  if (entries.length > maxEntries || entries.some(([id, entry]) => id.length > 64 || !entry
    || !Number.isSafeInteger(entry.remaining) || !Number.isSafeInteger(entry.total)
    || entry.remaining < 0 || entry.total < entry.remaining || entry.total > maxCount)) {
    throw new TypeError(`Voxel ${label} state contains invalid attached-pixel counts.`);
  }
  return Object.fromEntries(entries.map(([id, entry]) => [id, { remaining: entry.remaining, total: entry.total }]));
}
function copyEnemyVoxelState(enemy, value, label) {
  const ultra = enemy.type === MECH_SPIDER_TANK_ULTRA.id;
  return copyVoxelState(value, label, ultra ? 160000 : enemy.type === COPPER_MEGA_DRILL.id ? 768000 : 32000,
    ultra ? 512 : enemy.type === COPPER_MINE_WALKER.id ? 128 : 64);
}
export const CREATURE_CATALOG = Object.freeze([
  { id: 'blob', name: 'Tri Blob', description: 'A small, sliding pink body with one restless Tri eye.', attackHelp: 'Aim low. Step back while it gathers itself for a bite.' },
  { id: 'ling', name: 'Tri Ling', description: 'A pink watcher carried on four bending blue legs.', attackHelp: 'Dodge its bite and cut its legs to slow its pursuit.' },
  { id: 'brain', name: 'Tri Brain', description: 'A floating pink growth with a central eye and blue tentacles.', attackHelp: 'Watch its eye wind up, then sidestep the approaching bolts.' },
  { id: 'gardener', name: 'The Gardener', description: 'A tall, legless pink guardian with a long head and one centered eye.', attackHelp: 'Leave room when it raises its arms, then strike during recovery.' },
  { id: 'trider', name: 'Trider', description: 'A tall pink watcher raised on eight light-blue and dark-blue tentacles.', attackHelp: 'Its eye marks the raised body. Dodge its close lash or sever supporting tentacles.' },
  { id: 'spreader', name: 'Tri Spreader', description: 'A huge, mouthless pink blob with one orange-irised Tri eye.', attackHelp: 'Its spray infects a ten-metre square and launches living blobs. Leave the pink ground and cut down the source.' },
].map(Object.freeze));
/** Arena-scaled health preserves the source bosses' identities and attack patterns. */
export const BOSS_CATALOG = Object.freeze([
  { id: 'copper-giant', name: 'Copper Giant', hp: 520, radius: 2.2, speed: 2.2, range: 5.2, windup: 1.1, recovery: 1.3, damage: 25, score: 1500, attacks: ['smash', 'shockwave', 'sweep', 'lightning'] },
  { id: 'lake-terror', name: 'The Lake’s Corrupt Terror', hp: 650, radius: 2, speed: 3.3, range: 11, windup: 1, recovery: 1.1, damage: 28, score: 1800, attacks: ['lunge', 'eyes', 'burrow'] },
  { id: 'frost-triram', name: 'Frost Triram', hp: 780, radius: 2.1, speed: 2.6, range: 10, windup: 1.05, recovery: 1.4, damage: 27, score: 2100, attacks: ['charge', 'slam', 'summon', 'ice', 'freeze', 'regenerate'] },
  { id: 'sky-eye', name: 'Eye of the Sky', hp: 900, radius: 2.3, speed: 2, range: 12, windup: 1.2, recovery: 1.2, damage: 26, score: 2400, attacks: ['eyes', 'grab', 'summon'] },
  { id: 'trilom-leader', name: 'Trilom Leader', hp: 1050, radius: 1.4, speed: 2.2, range: 13, windup: 1.05, recovery: 1.2, damage: 24, score: 2700, attacks: ['souls', 'banish', 'summon'] },
  { id: 'trilom-wraith', name: 'Trilom Wraith', hp: 1150, radius: 1.6, speed: 2.8, range: 13, windup: 0.95, recovery: 1.1, damage: 25, score: 3000, attacks: ['ghosts', 'spirits'] },
].map((boss) => Object.freeze({ ...boss, attacks: Object.freeze(boss.attacks) })));
export const COPPER_TRON = Object.freeze({ id: 'copper-tron-1000', name: 'Copper Tron 1000', hp: 900, radius: 2.4,
  speed: 3.6, range: 7, windup: .7, recovery: 1.1, damage: 8, score: 2800,
  attacks: Object.freeze(['fabricate', 'machine-gun', 'leap']) });
export const COPPER_FORTRESS = Object.freeze({ id: 'copper-fortress', name: 'Copper Fortress', hp: 10000, radius: 4.5,
  speed: .7, range: 15, windup: 1.2, recovery: 2.8, damage: 24, score: 6000,
  attacks: Object.freeze(['cannons', 'catapult']) });
const BOSSES = Object.fromEntries([...BOSS_CATALOG, COPPER_TRON, COPPER_FORTRESS, COPPER_MEGA_DRILL, COPPER_SPIDER_DRONE, COPPER_MINE_WALKER, MECH_SPIDER_TANK_ULTRA].map((boss) => [boss.id, boss]));
const COPPER_BOSSES = Object.freeze([BOSS_CATALOG[0], COPPER_TRON, COPPER_FORTRESS, COPPER_MEGA_DRILL]);
export const DRILL_MINE_BOSSES = Object.freeze([COPPER_SPIDER_DRONE, COPPER_MINE_WALKER, Object.freeze({ ...COPPER_MEGA_DRILL, unlockWave: 10 }), MECH_SPIDER_TANK_ULTRA]);
const COLOSSEUM_MIX = Object.freeze(['copper-robot', 'copper-robot', 'copper-robot', 'knight']);
const TRON_LEG_ANGLES = Object.freeze([Math.PI, Math.PI / 3, -Math.PI / 3]);
/** Both legacy Colosseum aliases share the robot roster and its Copper Giant. */
export function availableBossCatalog({ arenaId = 'bonefields', colosseumMode = 'copper' } = {}) {
  validateArena(arenaId, colosseumMode);
  return arenaId === 'drill-mine' ? DRILL_MINE_BOSSES : arenaId === 'bonefields' ? BOSS_CATALOG : COPPER_BOSSES;
}
const MAX_ACTORS = 18, MAX_PROJECTILES = 64, MAX_HAZARDS = 48;
const MAX_SCORE = Number.MAX_SAFE_INTEGER;

/** Stable encounter rolls use both halves of a safe integer wave number. */
function encounterRoll(wave, slot, salt = 0) {
  let value = (wave >>> 0) ^ Math.imul(Math.floor(wave / 0x100000000), 0x9e3779b1)
    ^ Math.imul(slot + 1, 0x85ebca6b) ^ salt;
  value = Math.imul(value ^ (value >>> 16), 0x7feb352d);
  value = Math.imul(value ^ (value >>> 15), 0x846ca68b);
  return ((value ^ (value >>> 16)) >>> 0) / 0x100000000;
}

/** Boss rotation and bounded growth remain deterministic at arbitrarily late waves. */
export function getWavePlan(requestedWave, { arenaId = 'bonefields', colosseumMode = 'copper' } = {}) {
  validateArena(arenaId, colosseumMode);
  const wave = clamp(Math.floor(finite(requestedWave, 1)), 1, Number.MAX_SAFE_INTEGER);
  if (arenaId === 'drill-mine') {
    if (wave === 50) return { wave, boss: MECH_SPIDER_TANK_ULTRA, extraBosses: [], composition: [], hpScale: 1, speedScale: 1, damageScale: 1, final: true };
    const scheduled = [...(wave % 10 === 0 ? [DRILL_MINE_BOSSES[2]] : []),
      ...(wave >= 6 ? [COPPER_MINE_WALKER] : []), ...(wave >= 4 ? [COPPER_SPIDER_DRONE] : [])];
    const boss = scheduled[0] ?? null;
    const encounters = Array.from({ length: Math.min(boss ? 8 : 14, 4 + Math.floor((wave - 1) * 1.25)) },
      (_, index) => DRILL_MINE_MIX[(index + wave - 1) % DRILL_MINE_MIX.length]).filter(type => type !== MINER_BOT.id);
    return { wave, boss, extraBosses: scheduled.slice(1), composition: [...Array(MINE_MINER_TOTAL).fill(MINER_BOT.id), ...encounters],
      hpScale: 1 + Math.min(2.2, (wave - 1) * .022), speedScale: 1 + Math.min(.45, (wave - 1) * .0075), damageScale: 1 + Math.min(1.2, (wave - 1) * .014) };
  }
  const bosses = availableBossCatalog({ arenaId, colosseumMode });
  const giantWave = wave % 5 === 0;
  const tronWave = arenaId === 'colosseum' && wave % 3 === 0;
  const boss = arenaId === 'colosseum' ? giantWave ? BOSS_CATALOG[0] : tronWave ? COPPER_TRON : null
    : giantWave ? bosses[(Math.floor(wave / 5) - 1) % bosses.length] : null;
  const extraBosses = [...(tronWave && giantWave ? [COPPER_TRON] : []),
    ...(arenaId === 'colosseum' && wave % 10 === 0 ? [COPPER_FORTRESS] : []),
    ...(arenaId === 'colosseum' && wave === 30 ? [COPPER_MEGA_DRILL] : [])];
  const lings = Array(Math.min(7, 2 + wave)).fill('ling');
  lings[lings.length - 1] = 'blob';
  if (wave >= 4) lings[lings.length - 2] = 'trider';
  if (wave >= 6) lings[lings.length - 3] = 'spreader';
  const composition = arenaId === 'colosseum' ? Array.from({ length: Math.min(boss ? 8 : 14, 3 + Math.floor((wave - 1) * 1.25)) },
    (_, index) => COLOSSEUM_MIX[(index + (wave - 1) % COLOSSEUM_MIX.length) % COLOSSEUM_MIX.length]) : [
    ...lings,
    ...Array(Math.min(4, Math.ceil(wave / 2))).fill('brain'),
    ...Array(Math.min(3, Math.floor((wave - 1) / 2))).fill('gardener'),
  ].slice(0, boss ? 8 : 14);
  if (arenaId === 'colosseum' && wave >= 11) {
    const unlocked = [...COLOSSEUM_LATE_TYPES, ...(wave >= 15 ? [HOUND_TYPE] : [])];
    for (let slot = 0; slot < Math.floor(composition.length / 3); slot++) {
      if (encounterRoll(wave, slot) < .55) {
        composition[composition.length - slot - 1] = unlocked[Math.floor(encounterRoll(wave, slot, 0x51ed270b) * unlocked.length)];
      }
    }
    // Keep the same weighted robot sequence even when special slots interrupt it.
    let robot = (wave - 1) % COLOSSEUM_MIX.length;
    for (let index = 0; index < composition.length; index++) if (COLOSSEUM_MIX.includes(composition[index])) {
      composition[index] = COLOSSEUM_MIX[robot]; robot = (robot + 1) % COLOSSEUM_MIX.length;
    }
  }
  return { wave, boss, composition, ...(arenaId === 'colosseum' ? { extraBosses } : {}), hpScale: 1 + Math.min(2.2, (wave - 1) * 0.022),
    speedScale: 1 + Math.min(0.45, (wave - 1) * 0.0075), damageScale: 1 + Math.min(1.2, (wave - 1) * 0.014) };
}
export const UPGRADE_CATALOG = Object.freeze([
  { id: 'sword', title: 'Overclocked blade', description: '+35% blade power. Wider voxel cuts.', maxLevel: 5 },
  { id: 'heart', title: 'Reinforced chassis', description: '+30 maximum health and a full repair.', maxLevel: 10 },
  { id: 'dash', title: 'Flux thrusters', description: '25% shorter dash cooldown and +15 maximum energy.', maxLevel: 5 },
  { id: 'haste', title: 'Quickdraw servos', description: 'Recover from each sword swing 0.04 seconds sooner.', maxLevel: 5 },
  { id: 'stride', title: 'Long-stride actuators', description: '+0.7 metres per second movement speed.', maxLevel: 6 },
  { id: 'armor', title: 'Layered copper plating', description: 'Reduce all incoming damage by 8% per level.', maxLevel: 5 },
  { id: 'capacitor', title: 'Rapid-charge capacitor', description: '+20% energy regeneration per level.', maxLevel: 5 },
  { id: 'leech', title: 'Salvage siphon', description: 'Recover 2 more health for every creature defeated.', maxLevel: 5 },
  { id: 'kick', title: 'Impact pistons', description: '+6 kick damage, stronger knockback and faster recovery.', maxLevel: 5 },
  { id: 'repair', title: 'Field repair', description: 'Fully restore health and energy. Always available.', maxLevel: null },
].map(Object.freeze));
const UPGRADE_IDS = UPGRADE_CATALOG.map(upgrade => upgrade.id);

export class ArenaGame {
  get arenaBounds() { return this.state.ultraEncounter ? { x: 179, z: 149 } : getArenaBounds(this.state.arenaId); }
  get arenaSpawnRadius() { return getArenaSpawnRadius(this.state.arenaId); }
  get actorLimit() {
    return this.state.arenaId === 'drill-mine' && !this.isPractice()
      && ['endless', 'survival'].includes(this.state.gameMode) ? MINE_ACTOR_LIMIT : MAX_ACTORS;
  }
  constructor({ random = Math.random } = {}) {
    if (typeof random !== 'function') throw new TypeError('ArenaGame random must be a function.');
    this.random = random;
    this.events = [];
    this.nextId = 1;
    this.lastDirection = { x: 0, z: 1 };
    this.swordDamage = 28;
    this.dashInterval = 1.4;
    this.state = this.createState();
  }

  createState() {
    return {
      mode: 'menu', gameMode: 'endless', arenaId: 'bonefields', colosseumMode: 'copper', wave: 0, maxWaves: null, endless: true, practice: false, practiceTarget: null, score: 0, kills: 0, elapsed: 0,
      upgradeLevels: Object.fromEntries(UPGRADE_IDS.map(id => [id, 0])),
      player: { x: 0, z: 0, angle: 0, elevation: 0, groundHeight: 0, groundActorId: null, jumpVelocity: 0, hp: 100, maxHp: 100, stamina: 100, maxStamina: 100,
        attackCooldown: 0, dashCooldown: 0, kickCooldown: 0, dashTime: 0, invulnerable: 0, blocking: false, slowTime: 0,
        attackDuration: .38, dashDuration: 1.4, kickDuration: 2.5, moveSpeed: 7.3, armor: 0,
        staminaRegen: 29, killHealing: 3, kickDamage: 14, kickKnockback: 19, bladePower: 1 },
      enemies: [], projectiles: [], hazards: [], upgrades: [], wavePlan: null, survival: null, ultraEncounter: null,
    };
  }

  resetRun() {
    this.state = this.createState();
    this.events = [];
    this.nextId = 1;
    this.swordDamage = 28;
    this.dashInterval = 1.4;
    this.lastDirection = { x: 0, z: 1 };
    this.dashDirection = { x: 0, z: 1 };
  }

  start({ gameMode = 'endless', arenaId = 'bonefields', colosseumMode = 'copper' } = {}) {
    if (!['endless', 'survival'].includes(gameMode)) throw new RangeError(`Unknown game mode: ${String(gameMode)}`);
    validateArena(arenaId, colosseumMode);
    this.resetRun();
    this.state.gameMode = gameMode;
    this.state.arenaId = arenaId;
    this.state.colosseumMode = colosseumMode;
    this.state.mode = 'playing';
    this.emit('start', this.state.player);
    if (gameMode === 'survival') {
      this.state.wave = 1;
      this.state.wavePlan = getWavePlan(1, this.state);
      this.state.survival = { elapsed: 0, level: 1, nextSpawnIn: 2.8, nextBossIn: availableBossCatalog(this.state).length ? 60 : null,
        totalSpawned: 0, bossesSpawned: 0, nextMilestoneIn: 30,
        ...(arenaId === 'colosseum' ? { tronsSpawned: 0, lastTronLevel: 0, nextTronIn: 60,
          fortressesSpawned: 0, fortressCrewSpawned: 0, repairDronesSpawned: 0, lastFortressLevel: 0, nextFortressIn: 270,
          megaDrillsSpawned: 0, megaCrewSpawned: 0, nextMegaDrillIn: 870 } : {}),
        ...(arenaId === 'drill-mine' ? { megaDrillsSpawned: 0, megaCrewSpawned: 0, repairDronesSpawned: 0, lastMegaDrillLevel: 0, nextMegaDrillIn: 270,
          spiderDronesSpawned: 0, lastSpiderDroneLevel: 0, nextSpiderDroneIn: 90,
          mineWalkersSpawned: 0, mineWalkerCrewSpawned: 0, lastMineWalkerLevel: 0, nextMineWalkerIn: 150,
          mineEncounterIndex: 0, mineTunnelIndex: 0, mineSpecialIndex: 0 } : {}) };
      if (arenaId === 'drill-mine') this.state.survival.nextBossIn = 90;
      if (arenaId === 'drill-mine') {
        for (let tunnel = 0; tunnel < DRILL_MINE_TUNNELS.length; tunnel++) this.spawnMineMinerBatch(tunnel);
        for (const type of this.state.wavePlan.composition.filter(type => type !== MINER_BOT.id)) {
          this.state.enemies.push(this.createMineEnemy(type, this.state.survival.mineSpecialIndex++));
          this.state.survival.totalSpawned++;
        }
      } else this.spawnSurvivalEnemies(3);
    } else this.spawnWave();
  }

  returnToMenu() {
    this.resetRun();
    this.emit('start', this.state.player);
  }

  startBossPractice(type, { arenaId = 'bonefields', colosseumMode = 'copper' } = {}) {
    const index = BOSS_CATALOG.findIndex((boss) => boss.id === type);
    if (!Object.hasOwn(BOSSES, type)) throw new RangeError(`Unknown arena boss: ${String(type)}`);
    validateArena(arenaId, colosseumMode);
    if (BOSSES[type].exclusiveArena && BOSSES[type].exclusiveArena !== arenaId) throw new RangeError(`${BOSSES[type].name} belongs to the Drill Mine.`);
    if (!availableBossCatalog({ arenaId, colosseumMode }).some(boss => boss.id === type)) {
      if (arenaId === 'drill-mine') throw new RangeError('Drill Mine boss practice only allows its Spider Drone, Mine Walker and Mega Drill.');
      throw new RangeError(arenaId === 'colosseum' ? 'Colosseum boss practice only allows Copper Giant and Copper Tron 1000.'
        : 'Copper Tron 1000 belongs to the Colosseum preview.');
    }
    this.beginPractice(type, { arenaId, colosseumMode }, type === MECH_SPIDER_TANK_ULTRA.id ? 50 : type === COPPER_MINE_WALKER.id ? 6 : type === COPPER_SPIDER_DRONE.id ? 4 : type === COPPER_MEGA_DRILL.id ? arenaId === 'drill-mine' ? 10 : 30 : type === COPPER_FORTRESS.id ? 10 : type === COPPER_TRON.id ? 3 : (index + 1) * 5);
  }

  startCreaturePractice(type, { arenaId = 'bonefields', colosseumMode = 'copper' } = {}) {
    if (!Object.hasOwn(TYPES, type)) throw new RangeError(`Unknown arena creature: ${String(type)}`);
    validateArena(arenaId, colosseumMode);
    if (arenaId === 'drill-mine' && !DRILL_MINE_TYPES.includes(type)) throw new RangeError('Drill Mine practice only allows its miners, worms and hounds.');
    if (arenaId !== 'drill-mine' && type === MINER_BOT.id) throw new RangeError('Miner Bot belongs to the Drill Mine.');
    if (arenaId === 'colosseum' && !COLOSSEUM_TYPES.includes(type)) {
      throw new RangeError('Colosseum practice only allows its copper creatures.');
    }
    if (!['colosseum', 'drill-mine'].includes(arenaId) && COLOSSEUM_EXCLUSIVE_TYPES.includes(type)) throw new RangeError(`${TYPES[type].name} belongs to the Colosseum.`);
    this.beginPractice(type, { arenaId, colosseumMode }, 1);
  }

  beginPractice(type, { arenaId, colosseumMode }, wave) {
    this.resetRun();
    Object.assign(this.state, { arenaId, colosseumMode, mode: 'playing', practice: true,
      gameMode: 'practice', practiceTarget: type, wave: wave - 1 });
    this.emit('start', this.state.player);
    this.spawnWave();
  }

  isPractice() {
    return this.state.practice || this.state.gameMode === 'practice';
  }

  spawnWave() {
    const state = this.state;
    state.wave = Math.min(Number.MAX_SAFE_INTEGER, state.wave + 1);
    state.projectiles = [];
    state.hazards = [];
    state.upgrades = [];
    const normalPlan = getWavePlan(state.wave, state);
    const plan = this.isPractice() ? { ...normalPlan, boss: BOSSES[state.practiceTarget] ?? null,
      extraBosses: [], composition: Object.hasOwn(BOSSES, state.practiceTarget) ? [] : [state.practiceTarget] } : normalPlan;
    state.wavePlan = plan;
    if (state.arenaId === 'drill-mine' && plan.boss?.id === MECH_SPIDER_TANK_ULTRA.id) {
      beginUltraEncounter(this, { practice: this.isPractice() }); return;
    }
    const composition = this.isPractice() ? [state.practiceTarget]
      : [...plan.composition, ...(plan.boss ? [plan.boss.id] : []), ...(plan.extraBosses ?? []).map(boss => boss.id)].slice(0, this.actorLimit);
    const spread = state.practice ? 1 : Math.min(1, (state.wave - 1) / 3);
    const radiusX = 14 + (this.arenaSpawnRadius.x - 14) * spread;
    const radiusZ = 9 + (this.arenaSpawnRadius.z - 9) * spread;
    let minerIndex = 0, mineEncounterIndex = 0;
    state.enemies = composition.map((type, index) => {
      if (type === COPPER_MEGA_DRILL.id) return this.createEnemy(type, state.arenaId === 'drill-mine' ? -17.5 : -18, 0);
      if (type === COPPER_MINE_WALKER.id) return this.createEnemy(type, this.isPractice() ? 0 : 16, this.isPractice() ? 14 : 3);
      if (type === COPPER_SPIDER_DRONE.id) return this.createEnemy(type, this.isPractice() || state.wave >= 6 ? 0 : 18, this.isPractice() ? 12 : state.wave >= 6 ? -18 : 0);
      if (this.isPractice()) return this.createEnemy(type, 0, type === COPPER_FORTRESS.id ? 14 : 7);
      if (state.arenaId === 'drill-mine') return this.createMineEnemy(type, type === MINER_BOT.id ? minerIndex++ : mineEncounterIndex++);
      const angle = index / composition.length * TAU + finite(this.random(), 0.5) * 0.25;
      return this.createEnemy(type, Math.sin(angle) * radiusX, Math.cos(angle) * radiusZ);
    });
    for (const enemy of [...state.enemies]) if (enemy.type === HOUND_TYPE && state.arenaId !== 'drill-mine') this.maybeMountRider(enemy);
    for (const enemy of [...state.enemies]) if (enemy.type === COPPER_FORTRESS.id) this.spawnFortressCrew(enemy);
    for (const enemy of [...state.enemies]) if (enemy.type === COPPER_MEGA_DRILL.id) this.spawnMegaDrillCrew(enemy);
    for (const enemy of [...state.enemies]) if (enemy.type === COPPER_MINE_WALKER.id) this.spawnMineWalkerCrew(enemy);
  }

  /** Mode subclasses may supply an isolated definition without adding wave types. */
  enemyStats(type) {
    return Object.hasOwn(TYPES, type) ? TYPES[type] : Object.hasOwn(BOSSES, type) ? BOSSES[type] : null;
  }

  createMineEnemy(type, index) {
    const point = this.mineEntrance(type, index);
    const enemy = startMineEmergence(this.createEnemy(type, point.x, point.z), point.tunnel, point.exit);
    if (point.formationSlot != null) enemy.formationSlot = point.formationSlot;
    return enemy;
  }

  mineEntrance(type, index) {
    const tunnelIndex = index % DRILL_MINE_TUNNELS.length;
    if (type === MINER_BOT.id) return this.mineMinerPoint(tunnelIndex, Math.floor(index / DRILL_MINE_TUNNELS.length) % MINERS_PER_TUNNEL);
    if (this.state.ultraEncounter?.defeated) return ultraRimSpecialSpawn(index, this.enemyStats(type).radius);
    const point = mineTunnelSpawn(tunnelIndex, this.enemyStats(type).radius), tunnel = point.tunnel;
    const distance = length(tunnel.exit.x - tunnel.spawn.x, tunnel.exit.z - tunnel.spawn.z);
    const dx = (tunnel.exit.x - tunnel.spawn.x) / distance, dz = (tunnel.exit.z - tunnel.spawn.z) / distance;
    // Heavier creatures emerge ahead of the miner formation, in two separate lanes.
    const lateral = Math.floor(index / DRILL_MINE_TUNNELS.length) % 2 ? 1.5 : -1.5;
    return { ...point, x: point.x + dx * 6 - dz * lateral, z: point.z + dz * 6 + dx * lateral,
      exit: { x: tunnel.exit.x - dz * lateral, z: tunnel.exit.z + dx * lateral } };
  }

  mineMinerPoint(tunnelIndex, slot) {
    return this.state.ultraEncounter?.defeated ? ultraRimMinerSpawn(tunnelIndex, slot) : mineMinerSpawn(tunnelIndex, slot);
  }

  mineEntranceIsClear(points, radius) {
    const player = this.state.player;
    return points.every(point => length(point.x - player.x, point.z - player.z) > radius + .62
      && this.state.enemies.every(enemy => enemy.hp <= 0
        || length(point.x - enemy.x, point.z - enemy.z) >= radius + enemy.radius + .05));
  }

  /** A blocked or full tunnel keeps its entire ten-member batch pending. */
  spawnMineMinerBatch(tunnelIndex, reserved = 0) {
    if (this.state.arenaId !== 'drill-mine' || this.isPractice() || this.state.gameMode !== 'survival'
      || Math.min(this.actorLimit - reserved - this.state.enemies.length, this.availableActorSlots()) < MINERS_PER_TUNNEL) return 0;
    const points = Array.from({ length: MINERS_PER_TUNNEL }, (_, slot) => this.mineMinerPoint(tunnelIndex, slot));
    if (!this.mineEntranceIsClear(points, MINER_BOT.radius)) return 0;
    for (let slot = 0; slot < MINERS_PER_TUNNEL; slot++) {
      this.state.enemies.push(this.createMineEnemy(MINER_BOT.id, slot * DRILL_MINE_TUNNELS.length + tunnelIndex));
    }
    this.state.survival.totalSpawned = Math.min(MAX_SCORE, this.state.survival.totalSpawned + MINERS_PER_TUNNEL);
    return MINERS_PER_TUNNEL;
  }

  constrainMegaDrillPose(pose) { return this.state.arenaId === 'drill-mine' ? constrainMineMegaPose(pose) : pose; }
  isMegaDrillPoseAllowed(pose) { return this.state.arenaId !== 'drill-mine' || mineMegaPoseAllowed(pose); }

  constrainArenaActor(actor, previous) {
    if (this.state.ultraEncounter) {
      if (actor !== this.state.player && !actor.boss && !actor.pinnedCrew && !actor.mounted && !actor.spirit
        && actor.megaDrillId == null && actor.mineWalkerId == null && !['brain', 'copper-repair-drone'].includes(actor.type)) {
        separateUltraCover(actor, previous ?? actor);
      }
      return;
    }
    if (this.state.arenaId === 'drill-mine') separateDrillMineActor(actor, previous, Math.min(4.9, actor.radius ?? .42));
  }

  createEnemy(type, x, z, spawnData = {}) {
    const stats = this.enemyStats(type);
    if (!stats) throw new RangeError(`Unknown arena creature: ${String(type)}`);
    if (stats.exclusiveArena && stats.exclusiveArena !== this.state.arenaId) throw new RangeError(`${stats.name} belongs to the Drill Mine.`);
    const mine = this.state.arenaId === 'drill-mine';
    const owned = mine && this.state.enemies.some(owner => owner.id === spawnData.ownerId && owner.hp > 0
      && (owner.type === MECH_SPIDER_TANK_ULTRA.id && Object.hasOwn(TYPES, type)
        || ['copper-robot', 'knight', 'copper-repair-drone'].includes(type)
          && (owner.type === COPPER_MEGA_DRILL.id || type === 'copper-repair-drone' && owner.type === COPPER_SPIDER_DRONE.id)));
    if (this.state.gameMode !== 'war' && mine && !DRILL_MINE_TYPES.includes(type) && !DRILL_MINE_BOSSES.some(boss => boss.id === type) && !owned) throw new RangeError(`Drill Mine cannot naturally spawn ${stats.name}.`);
    if (this.state.gameMode !== 'war' && !mine && type === MINER_BOT.id) throw new RangeError('Miner Bot belongs to the Drill Mine.');
    if (this.state.gameMode !== 'war' && !['colosseum', 'drill-mine'].includes(this.state.arenaId) && COLOSSEUM_EXCLUSIVE_TYPES.includes(type)) throw new RangeError(`${stats.name} belongs to the Colosseum.`);
    if (this.state.gameMode !== 'war' && [COPPER_TRON.id, COPPER_FORTRESS.id, ...(!mine ? [COPPER_MEGA_DRILL.id] : [])].includes(type) && this.state.arenaId !== 'colosseum') throw new RangeError(`${stats.name} belongs to the Colosseum preview.`);
    if (this.state.gameMode !== 'war' && this.state.arenaId === 'colosseum' && !COLOSSEUM_TYPES.includes(type)
      && !availableBossCatalog(this.state).some(boss => boss.id === type)) {
      throw new RangeError(`Colosseum cannot spawn ${stats.name}.`);
    }
    const plan = this.state.wavePlan ?? getWavePlan(this.state.wave, this.state);
    const hp = [COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, COPPER_SPIDER_DRONE.id, COPPER_MINE_WALKER.id, MECH_SPIDER_TANK_ULTRA.id, 'copper-repair-drone'].includes(type) ? stats.hp : Math.round(stats.hp * plan.hpScale);
    const enemy = { id: this.nextId++, type, name: stats.name ?? type, boss: Boolean(BOSSES[type]),
      x: clamp(x, -this.arenaBounds.x + 1, this.arenaBounds.x - 1), z: clamp(z, -this.arenaBounds.z + 1, this.arenaBounds.z - 1), angle: Math.atan2(-x, -z), hp, maxHp: hp, radius: stats.radius,
      phase: 'chase', phaseTime: 0, impulseX: 0, impulseZ: 0, crippled: false,
      legsLost: 0, severedParts: [], removedFraction: 0, bossClock: 0, attackIndex: 0,
      attackName: '', shielded: type === 'trilom-leader', speedScale: plan.speedScale, damageScale: plan.damageScale,
      elevation: 0, moveTime: 0, sprayCooldown: type === 'spreader' ? 3 : 0 };
    if (Object.hasOwn(GROUND_SUPPORT_PROFILES, type)) Object.assign(enemy, {
      bodyDrop: 0, dropVelocity: 0, bodyDropTarget: 0, supportsLost: 0,
    });
    if (type === 'knight') Object.assign(enemy, { guarding: true, guardAmount: 1, guardTime: 0, supportRole: null, supportTargetId: null });
    if (type === HOUND_TYPE) Object.assign(enemy, { bodyDrop: 0, dropVelocity: 0, bodyDropTarget: 0,
      supportsLost: 0, pounceVelocity: 0, pouncing: false });
    if (type === COPPER_FORTRESS.id) Object.assign(enemy, {
      x: clamp(enemy.x, -this.arenaBounds.x + 8, this.arenaBounds.x - 8), z: clamp(enemy.z, -this.arenaBounds.z + 8, this.arenaBounds.z - 8),
      cannonOpen: [0, 0, 0, 0], hatchOpen: 1, reactorDestroyed: false, repairMaxHp: 10000,
      crewSpawned: false, crewIds: [], dronesSpawned: 0, droneCooldown: 6,
    });
    if (type === 'copper-repair-drone') Object.assign(enemy, { elevation: 2, repairCooldown: 2, repairTargetId: null });
    if (type === COPPER_MEGA_DRILL.id) initializeMegaDrill(enemy, this.arenaBounds);
    if (type === COPPER_SPIDER_DRONE.id) { initializeSpiderDrone(enemy); enemy.droneCooldown = 5; }
    if (type === COPPER_MINE_WALKER.id) initializeMineWalker(enemy);
    if (type === MECH_SPIDER_TANK_ULTRA.id) initializeMechUltra(enemy);
    if (type === COPPER_TRON.id) Object.assign(enemy, { legAngle: enemy.angle, supportHeight: 5.2, bodyDrop: 0, dropVelocity: 0,
      balanceState: null, balanceTiltX: 0, balanceTiltZ: 0, balanceTargetX: 0, balanceTargetZ: 0, partialDropTarget: 0,
      gunAvailable: true, weaponState: null, weaponsRemaining: {}, structureState: null, supportsLost: 0,
      fabricating: false, fabricationTime: 0, fabricateCooldown: 9, fabricated: 0,
      gunCooldown: 1, shotClock: 0, burstTime: 0, jumpCooldown: 1, jumpsUsed: 0, jumping: false, jumpProgress: 0,
      missileCooldown: 6, missileWindup: 0, missileFlash: 0,
      retreating: false, animationPhase: 'idle' });
    this.emit('spawn', enemy, { id: enemy.id, enemyType: type, boss: enemy.boss, ...spawnData });
    return enemy;
  }

  /** Riders are real independent actors, so their vital cuts cannot kill the mount. */
  maybeMountRider(mount, reservedSlots = 0) {
    if (this.isPractice() || mount.type !== HOUND_TYPE || mount.hp <= 0 || mount.riderId
      || this.availableActorSlots(mount) <= reservedSlots || clamp(finite(this.random(), 1), 0, 1) >= .05) return false;
    const roll = clamp(finite(this.random(), .5), 0, .999999);
    const type = COLOSSEUM_MIX[Math.floor(roll * COLOSSEUM_MIX.length)];
    const rider = this.createEnemy(type, mount.x, mount.z);
    Object.assign(rider, { mountId: mount.id, mounted: true, modelScale: RIDER_SEAT.scale });
    mount.riderId = rider.id;
    this.state.enemies.push(rider);
    this.updateMountedRider(rider);
    if (this.state.survival) this.state.survival.totalSpawned = Math.min(MAX_SCORE, this.state.survival.totalSpawned + 1);
    return true;
  }

  updateMountedRider(rider) {
    const mount = this.state.enemies.find(enemy => enemy.id === rider.mountId && enemy.hp > 0);
    if (!mount) { this.dismountRider(rider); return false; }
    const sine = Math.sin(mount.angle), cosine = Math.cos(mount.angle);
    rider.x = mount.x + RIDER_SEAT.x * cosine + RIDER_SEAT.z * sine;
    rider.z = mount.z - RIDER_SEAT.x * sine + RIDER_SEAT.z * cosine;
    rider.elevation = mount.elevation + RIDER_SEAT.y - finite(mount.bodyDrop);
    rider.impulseX = 0; rider.impulseZ = 0;
    return true;
  }

  dismountRider(rider) {
    const mount = this.state.enemies.find(enemy => enemy.id === rider.mountId);
    if (mount) {
      mount.riderId = null;
      const offset = mount.radius + rider.radius + .2;
      rider.x = clamp(mount.x + Math.cos(mount.angle) * offset, -this.arenaBounds.x + .2, this.arenaBounds.x - .2);
      rider.z = clamp(mount.z - Math.sin(mount.angle) * offset, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
    }
    rider.mountId = null; rider.mounted = false; rider.modelScale = 1;
    rider.dismountVelocity = 0;
  }

  fortressPoint(fortress, point) {
    const sine = Math.sin(fortress.angle), cosine = Math.cos(fortress.angle);
    return { x: fortress.x + cosine * point.x + sine * point.z,
      z: fortress.z - sine * point.x + cosine * point.z, y: fortress.elevation + finite(point.y) };
  }

  fortressLocal(fortress, x, z) {
    const dx = x - fortress.x, dz = z - fortress.z, sine = Math.sin(fortress.angle), cosine = Math.cos(fortress.angle);
    return { x: cosine * dx - sine * dz, z: sine * dx + cosine * dz };
  }

  spawnFortressCrew(fortress) {
    if (this.isPractice() || fortress.crewSpawned || fortress.hp <= 0 || this.availableActorSlots(fortress) < 4) return 0;
    fortress.crewSpawned = true;
    FORTRESS_CREW_SEATS.forEach((seat, index) => {
      const point = this.fortressPoint(fortress, seat), crew = this.createEnemy(COLOSSEUM_MIX[index], point.x, point.z, { crewOf: fortress.id });
      Object.assign(crew, { fortressId: fortress.id, crewOf: fortress.id, crewSeat: index, pinnedCrew: true, controlling: true, modelScale: seat.scale,
        elevation: point.y, angle: fortress.angle + seat.angle });
      this.state.enemies.push(crew); fortress.crewIds.push(crew.id);
      if (this.state.survival) { this.state.survival.totalSpawned++; this.state.survival.fortressCrewSpawned++; }
    });
    return 4;
  }

  updateFortressCrew(crew) {
    const fortress = this.state.enemies.find(actor => actor.id === crew.fortressId && actor.hp > 0);
    if (!fortress) {
      crew.fortressId = null; crew.crewOf = null; crew.pinnedCrew = false; crew.controlling = false; crew.modelScale = 1; crew.dismountVelocity = 0;
      return false;
    }
    const seat = FORTRESS_CREW_SEATS[crew.crewSeat], point = this.fortressPoint(fortress, seat);
    crew.x = point.x; crew.z = point.z; crew.elevation = point.y;
    crew.impulseX = 0; crew.impulseZ = 0;
    return true;
  }

  spawnFortressDrone(fortress) {
    if (this.isPractice() || fortress.hp <= 0 || fortress.dronesSpawned >= 2 || this.availableActorSlots(fortress) < 1) return false;
    const point = this.fortressPoint(fortress, { x: fortress.dronesSpawned ? 4.8 : -4.8, y: 2, z: -1 });
    const drone = this.createEnemy('copper-repair-drone', point.x, point.z, { ownerId: fortress.id });
    drone.ownerId = fortress.id; this.state.enemies.push(drone); fortress.dronesSpawned++;
    if (this.state.survival) { this.state.survival.totalSpawned++; this.state.survival.repairDronesSpawned++; }
    return true;
  }

  spawnSpiderDrone(owner) {
    if (this.isPractice() || owner.hp <= 0 || this.availableActorSlots(owner) < 1) return false;
    const count = this.state.enemies.filter(actor => actor.hp > 0 && actor.type === 'copper-repair-drone' && actor.ownerId === owner.id).length;
    if (count >= 2) return false;
    const point = this.fortressPoint(owner, { x: count ? 3.2 : -3.2, z: -1 });
    const drone = this.createEnemy('copper-repair-drone', point.x, point.z, { ownerId: owner.id, team: owner.team });
    drone.ownerId = owner.id; this.state.enemies.push(drone);
    if (this.state.survival) { this.state.survival.totalSpawned++; this.state.survival.repairDronesSpawned++; }
    this.emit('fabricate', owner, { id: owner.id, enemyType: owner.type, count: 1 }); return true;
  }

  emit(type, position, extra = {}) {
    this.events.push({ type, x: position.x, z: position.z, angle: position.angle ?? 0, ...extra });
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  update(delta, input = {}) {
    if (this.state.mode !== 'playing') return;
    const dt = clamp(finite(delta), 0, 0.05);
    const floor = this.updatePlayerMovement(dt, input);
    this.state.elapsed = Math.min(MAX_SCORE, this.state.elapsed + dt);
    if (this.state.ultraEncounter && !this.state.ultraEncounter.complete) {
      advanceUltraEncounter(this, dt); this.separatePlayer();
      this.resolvePlayerFloor(floor.wasGrounded, floor.height); this.updateUltraLava(); return;
    }
    for (const enemy of this.state.enemies) {
      this.updateEnemy(enemy, dt);
      if (enemy.type === 'knight') this.updateKnightGuard(enemy, dt);
    }
    this.separateEnemies();
    this.separatePlayer();
    this.resolvePlayerFloor(floor.wasGrounded, floor.height);
    for (const enemy of this.state.enemies) if (enemy.mounted) this.updateMountedRider(enemy);
    for (const enemy of this.state.enemies) {
      if (enemy.pinnedCrew && enemy.fortressId != null) this.updateFortressCrew(enemy);
      if (enemy.megaDrillId != null) this.syncMegaDrillOccupant(enemy);
      if (enemy.mineWalkerId != null) this.syncMineWalkerOccupant(enemy);
    }
    this.updateProjectiles(dt);
    this.updateHazards(dt);
    this.updateUltraLava();
    if (this.state.gameMode === 'survival' && this.state.mode === 'playing') this.updateSurvival(dt);
    else this.checkWave();
  }

  /** Unprotected contact with the surrounding lava uses the normal damage cooldown. */
  updateUltraLava() {
    if (this.state.ultraEncounter && ultraInLava(this.state.player)) this.hurtPlayer(18, this.state.player);
  }

  /** Shared human movement/cooldowns, also used by a possessed War fighter. */
  updatePlayerMovement(dt, input = {}) {
    const player = this.state.player;
    this.previousPlayerPosition = { x: player.x, z: player.z };
    for (const name of ['attackCooldown', 'dashCooldown', 'kickCooldown', 'dashTime', 'invulnerable', 'slowTime']) {
      player[name] = Math.max(0, player[name] - dt);
    }
    player.angle = finite(input.angle, player.angle);
    player.blocking = Boolean(input.block) && player.dashTime <= 0;
    player.stamina = Math.min(player.maxStamina, player.stamina + dt * player.staminaRegen * (player.blocking ? 7 / 29 : 1));
    let x = finite(input.x), z = finite(input.z);
    const magnitude = length(x, z);
    if (magnitude > 1) { x /= magnitude; z /= magnitude; }
    if (magnitude > 0.01) this.lastDirection = { x: x / Math.max(1e-9, length(x, z)), z: z / Math.max(1e-9, length(x, z)) };
    if (this.updatePlayerClimb(dt, { ...input, x, z })) return { wasGrounded: false, height: player.elevation };
    const floor = this.playerFloor(player.x, player.z), wasGrounded = Math.abs(player.elevation - floor.height) < .05 && player.jumpVelocity <= 0;
    player.groundHeight = floor.height; player.groundActorId = floor.id;
    player.elevation -= floor.height;
    updatePlayerJump(player, dt);
    player.elevation += floor.height;
    if (player.dashTime > 0) {
      x = this.dashDirection.x; z = this.dashDirection.z;
    }
    const speed = player.dashTime > 0 ? 23 : player.moveSpeed * (player.blocking ? 3.2 / 7.3 : 1) * (player.slowTime > 0 ? 0.55 : 1);
    player.x = clamp(player.x + x * speed * dt, -this.arenaBounds.x, this.arenaBounds.x);
    player.z = clamp(player.z + z * speed * dt, -this.arenaBounds.z, this.arenaBounds.z);
    this.constrainArenaActor(player, this.previousPlayerPosition);
    this.resolvePlayerFloor(wasGrounded, floor.height);
    return { wasGrounded, height: floor.height };
  }

  updatePlayerClimb(dt, input) {
    const player = this.state.player;
    if (player.mineWalkerClimb) {
      const owner = this.state.enemies.find(enemy => enemy.id === player.mineWalkerClimb.ownerId && enemy.hp > 0);
      if (!owner) { detachMineWalkerClimb(player); return false; }
      return updateMineWalkerClimb(owner, player, dt, input);
    }
    return this.state.enemies.some(enemy => enemy.type === COPPER_MINE_WALKER.id && enemy.hp > 0
      && updateMineWalkerClimb(enemy, player, dt, input));
  }

  isPlayerTarget() { return true; }

  attack(options = {}) {
    const player = this.state.player;
    if (this.state.mode !== 'playing' || player.attackCooldown > 0 || player.stamina < 8) return false;
    player.attackCooldown = player.attackDuration;
    player.stamina -= 8;
    player.blocking = false;
    const pitch = clamp(finite(options.pitch), -1.2, 1.2);
    const vertical = options.vertical === true;
    const cutTilt = clamp(finite(options.cutTilt, vertical ? Math.PI / 2 : 0), -Math.PI, Math.PI);
    this.emit('slash', player, { pitch, vertical, cutTilt });
    for (const enemy of this.state.enemies) {
      if (!this.isPlayerTarget(enemy)) continue;
      const dx = enemy.x - player.x, dz = enemy.z - player.z;
      const distance = length(dx, dz);
      const angle = Math.atan2(dx, dz);
      // Spatial queries are conservative: actual posed voxels enforce blade reach
      // and arc, including limbs extending away from an actor's center.
      const spatialCut = options.spatialCuts === true;
      const reach = spatialCut ? SWORD_REACH + (SPATIAL_EXTENTS[enemy.type] ?? enemy.radius) : 2.8 + enemy.radius;
      if (distance <= reach && (spatialCut || distance < 0.65 || Math.abs(wrapAngle(angle - player.angle)) < 1.3)) {
        if (enemy.type === 'knight') this.updateKnightGuard(enemy, 0, true);
        const originY = EYE_HEIGHT + player.elevation;
        const cut = { cutHeight: clamp(finite(options.cutHeight, originY + Math.tan(pitch) * distance), 0.12, enemy.type === MECH_SPIDER_TANK_ULTRA.id ? 80 : 14),
          cutTilt, pitch,
          originX: player.x, originY, originZ: player.z, spatialCuts: options.spatialCuts === true };
        this.damageEnemy(enemy, this.swordDamage, 6.5, 'sword', cut);
      }
    }
    this.removeDead();
    return true;
  }

  dash(direction = this.lastDirection) {
    const player = this.state.player;
    if (this.state.mode !== 'playing' || player.dashCooldown > 0 || player.stamina < 22) return false;
    const angle = finite(direction, player.angle);
    let x = typeof direction === 'number' ? Math.sin(angle) : finite(direction?.x);
    let z = typeof direction === 'number' ? Math.cos(angle) : finite(direction?.z);
    let distance = length(x, z);
    if (distance < 0.01) { x = Math.sin(player.angle); z = Math.cos(player.angle); distance = 1; }
    this.dashDirection = { x: x / distance, z: z / distance };
    player.dashCooldown = this.dashInterval;
    player.dashTime = 0.19;
    player.invulnerable = Math.max(player.invulnerable, 0.25);
    player.stamina -= 22;
    player.blocking = false;
    detachMineWalkerClimb(player);
    this.emit('dash', player);
    return true;
  }

  jump() {
    if (this.state.mode !== 'playing') return false;
    const player = this.state.player, floor = player.mineWalkerClimb ? player.elevation : finite(player.groundHeight);
    player.elevation -= floor;
    const jumped = startPlayerJump(player);
    player.elevation += floor;
    if (jumped) detachMineWalkerClimb(player);
    return jumped;
  }

  kick() {
    const player = this.state.player;
    if (this.state.mode !== 'playing' || player.kickCooldown > 0 || player.stamina < 25) return false;
    player.kickCooldown = player.kickDuration;
    player.stamina -= 25;
    this.emit('kick', player);
    for (const enemy of this.state.enemies) {
      if (!this.isPlayerTarget(enemy)) continue;
      if (length(enemy.x - player.x, enemy.z - player.z) > 3.4 + enemy.radius) continue;
      this.damageEnemy(enemy, player.kickDamage, player.kickKnockback, 'kick');
      if (enemy.hp > 0 && !enemy.boss) {
        if (enemy.type === 'spreader') {
          this.state.hazards = this.state.hazards.filter(hazard => hazard.ownerId !== enemy.id || hazard.delay === 0);
          enemy.sprayCooldown = Math.max(enemy.sprayCooldown, 1.5);
        }
        enemy.phase = 'recover'; enemy.phaseTime = 1.1;
      }
    }
    this.removeDead();
    return true;
  }

  damageEnemy(enemy, amount, knockback, weapon = 'sword', cut = {}) {
    if (enemy.hp <= 0) return;
    if (enemy.shielded) { this.emit('shield', enemy, { id: enemy.id, enemyType: enemy.type }); return; }
    amount = Math.max(0, finite(amount));
    if (weapon === 'sword' && cut.spatialCuts) amount = 0;
    const damage = Math.min(enemy.hp, amount);
    enemy.hp = Math.max(0, enemy.hp - amount);
    const player = this.state.player;
    const dx = enemy.x - player.x, dz = enemy.z - player.z;
    const distance = Math.max(0.01, length(dx, dz));
    const impulse = (cut.spatialCuts ? 0 : knockback) * (enemy.boss ? 0.15 : 1);
    enemy.impulseX = dx / distance * impulse;
    enemy.impulseZ = dz / distance * impulse;
    const hit = { enemyType: enemy.type, amount, id: enemy.id, weapon,
      attackAngle: player.angle, damageRatio: damage / enemy.maxHp,
      healthRatio: enemy.hp / enemy.maxHp, severed: false };
    if (weapon === 'sword') this.emit('cut', enemy, { ...hit, cutHeight: 1.88, cutTilt: 0, ...cut, bladePower: this.swordDamage / 28 });
    if (!cut.spatialCuts) this.emit('hit', enemy, hit);
    if (damage > 0 && enemy.attackName === 'regenerate') { enemy.attackName = ''; enemy.phase = 'recover'; enemy.phaseTime = 0.8; }
    if (enemy.hp === 0) this.finishKill(enemy, weapon);
  }

  finishKill(enemy, weapon = 'sword') {
    if (enemy.defeated) return;
    if (enemy.riderId) {
      const rider = this.state.enemies.find(actor => actor.id === enemy.riderId && actor.hp > 0);
      if (rider) this.dismountRider(rider);
    }
    if (enemy.mountId != null) {
      const mount = this.state.enemies.find(actor => actor.id === enemy.mountId);
      if (mount) mount.riderId = null;
    }
    enemy.defeated = true;
    enemy.hp = 0;
    if (enemy.type === COPPER_FORTRESS.id) for (const crew of this.state.enemies) {
      if (crew.fortressId === enemy.id && crew.hp > 0) this.updateFortressCrew(crew);
    }
    if (enemy.type === COPPER_MEGA_DRILL.id) releaseMegaDrillOccupants(this, enemy);
    if (enemy.type === COPPER_MINE_WALKER.id) releaseMineWalkerOccupants(this, enemy);
    if (enemy.type === MECH_SPIDER_TANK_ULTRA.id) releaseUltraOccupants(this, enemy);
    if (enemy.type === MECH_SPIDER_TANK_ULTRA.id && this.state.ultraEncounter) this.state.ultraEncounter.defeated = true;
    this.state.kills = Math.min(MAX_SCORE, this.state.kills + 1);
    this.state.score = Math.min(MAX_SCORE, this.state.score + this.enemyStats(enemy.type).score * this.state.wave);
    const player = this.state.player;
    player.hp = Math.min(player.maxHp, player.hp + player.killHealing + (enemy.boss ? 22 : 0));
    this.emit('kill', enemy, { enemyType: enemy.type, id: enemy.id, attackAngle: player.angle, weapon, boss: enemy.boss });
    if (enemy.boss || enemy.type === 'spreader') {
      this.state.hazards = this.state.hazards.filter((hazard) => hazard.ownerId !== enemy.id);
      // A fired roof rocket is already ballistic; unopened launch wells and
      // the boss's other owned projectiles still disappear with the boss.
      this.state.projectiles = this.state.projectiles.filter((bolt) => bolt.ownerId !== enemy.id
        || (bolt.kind === ULTRA_ROOF_MISSILE_KIND && bolt.launched === true));
    }
  }

  /** Apply the renderer's actual voxel connectivity result, rather than inferring cuts from HP. */
  applySliceResult(id, result = {}) {
    const enemy = this.state.enemies.find((actor) => actor.id === id && actor.hp > 0);
    if (!enemy || enemy.shielded || this.state.mode !== 'playing') return false;
    let reactorDamage = 0;
    if (result.weaponState !== undefined) {
      enemy.weaponState = copyEnemyVoxelState(enemy, result.weaponState, 'weapon');
      enemy.weaponsRemaining = Object.fromEntries(Object.entries(enemy.weaponState).map(([key, entry]) => [key, entry.remaining]));
      if (enemy.type === COPPER_TRON.id) enemy.gunAvailable = this.canEnemyDamage(enemy, 'machine-gun');
    }
    if (result.structureState !== undefined) {
      enemy.structureState = copyEnemyVoxelState(enemy, result.structureState, 'structure');
      const reactor = enemy.structureState[FORTRESS_LAYOUT.reactorId];
      if (enemy.type === COPPER_FORTRESS.id && !enemy.reactorDestroyed && reactor?.total > 0 && reactor.remaining === 0) {
        enemy.reactorDestroyed = true; enemy.repairMaxHp = 3000; reactorDamage = 7000;
      }
      if (enemy.type === COPPER_MEGA_DRILL.id) reactorDamage += megaDrillReactorDamage(enemy);
      if (enemy.type === MECH_SPIDER_TANK_ULTRA.id) for (let index = 0; index < 5; index++) {
        const id = `ultra-reactor-${index}`, state = enemy.structureState[id];
        if (state?.total > 0 && state.remaining === 0 && !enemy.ultra.reactorsDestroyed.includes(id)) {
          enemy.ultra.reactorsDestroyed.push(id); reactorDamage += 200000000;
        }
      }
      if (enemy.type === COPPER_TRON.id) enemy.supportsLost = ['leg-0', 'leg-1', 'leg-2']
        .filter(id => Object.hasOwn(enemy.structureState, id) && enemy.structureState[id].remaining === 0).length;
      if (enemy.type === HOUND_TYPE && HOUND_LEG_IDS.some(key => Object.hasOwn(enemy.structureState, key))) {
        enemy.supportsLost = HOUND_LEG_IDS.filter(key => enemy.structureState[key]?.remaining === 0).length;
        enemy.bodyDropTarget = HOUND_MAX_DROP * enemy.supportsLost / 4;
        if (enemy.supportsLost >= 3 && ['windup', 'strike'].includes(enemy.phase)) {
          enemy.phase = 'recover'; enemy.phaseTime = .5; enemy.pouncing = false;
        }
      }
      const profile = GROUND_SUPPORT_PROFILES[enemy.type];
      if (profile) {
        const ids = Array.from({ length: profile.count }, (_, index) => supportId(index));
        if (ids.some(key => Object.hasOwn(enemy.structureState, key))) {
          enemy.supportsLost = ids.filter(key => enemy.structureState[key]?.remaining === 0).length;
          enemy.bodyDropTarget = profile.maxDrop * enemy.supportsLost / profile.count;
        }
      }
      if (enemy.riderId && enemy.structureState.saddle?.remaining === 0) {
        const rider = this.state.enemies.find(actor => actor.id === enemy.riderId && actor.hp > 0);
        if (rider) this.dismountRider(rider);
      }
    }
    if (result.balanceState !== undefined) enemy.balanceState = copyEnemyVoxelState(enemy, result.balanceState, 'balance');
    if (enemy.type === COPPER_TRON.id && (result.balanceState !== undefined || result.structureState !== undefined)) {
      let x = 0, z = 0, damage = 0;
      for (let index = 0; index < 3; index++) {
        const leg = enemy.balanceState?.[`leg-${index}`];
        const lost = leg?.total > 0 ? 1 - leg.remaining / leg.total : 0;
        x += Math.sin(TRON_LEG_ANGLES[index]) * lost; z += Math.cos(TRON_LEG_ANGLES[index]) * lost; damage += lost;
      }
      const scale = Math.min(.1, length(x, z) * .1) / Math.max(1e-9, length(x, z));
      enemy.balanceTargetX = z * scale; enemy.balanceTargetZ = -x * scale;
      enemy.partialDropTarget = Math.min(.08, damage * .04 + enemy.supportsLost * .02);
    }
    const parts = Array.isArray(result.severedParts) ? result.severedParts.filter((part) => typeof part === 'string').slice(0, 32) : [];
    const newParts = [...new Set(parts)].filter((part) => !enemy.severedParts.includes(part));
    enemy.severedParts.push(...newParts);
    const removedFraction = clamp(finite(result.removedFraction), 0, 1);
    enemy.removedFraction = clamp(enemy.removedFraction + removedFraction, 0, 1);
    if (removedFraction > 0 || result.absorbedHits?.length > 0) enemy.needsVoxelRepair = true;
    if (Number.isFinite(result.repairedCells)) enemy.needsVoxelRepair = result.repairedCells >= 16;
    const legsLost = clamp(Math.floor(finite(result.legsLost)), 0, 8);
    if (newParts.length || legsLost > 0) {
      enemy.legsLost = Math.min(8, enemy.legsLost + legsLost);
      enemy.crippled ||= enemy.legsLost > 0;
      this.emit('sever', enemy, { id, enemyType: enemy.type, severedParts: newParts, legsLost,
        attackAngle: this.state.player.angle, angle: this.state.player.angle, weapon: 'sword' });
    }
    // Displayed integrity tracks the torso, never detached limb or weapon mass.
    // Spatial sword deaths require a real vital cut or a disconnected torso.
    const fortress = [COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, MECH_SPIDER_TANK_ULTRA.id].includes(enemy.type);
    const damageFraction = clamp(finite([COPPER_TRON.id, COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, MECH_SPIDER_TANK_ULTRA.id].includes(enemy.type) ? result.mainBodyFraction : result.bodyDamageFraction), 0, 1);
    if (removedFraction > 0 || damageFraction > 0 || reactorDamage > 0) {
      const before = enemy.hp;
      enemy.hp = Math.max(fortress ? 0 : 1, enemy.hp - Math.ceil(enemy.maxHp * damageFraction * 1.5) - reactorDamage);
      const amount = before - enemy.hp;
      this.emit('hit', enemy, { id, enemyType: enemy.type, amount, weapon: 'sword',
        attackAngle: this.state.player.angle, damageRatio: amount / enemy.maxHp, healthRatio: enemy.hp / enemy.maxHp });
      if (enemy.attackName === 'regenerate') { enemy.attackName = ''; enemy.phase = 'recover'; enemy.phaseTime = 0.8; }
    }
    if (fortress ? enemy.hp === 0 : result.critical === true || (enemy.type !== COPPER_TRON.id && result.structuralFatal === true)) this.finishKill(enemy);
    this.removeDead();
    return true;
  }

  removeDead() {
    this.state.enemies = this.state.enemies.filter((enemy) => enemy.hp > 0);
    this.checkWave();
  }

  hurtPlayer(amount, source) {
    const player = this.state.player;
    if (player.invulnerable > 0 || this.state.mode !== 'playing') return false;
    amount *= 1 - player.armor;
    const contact = source.attackContact ?? source;
    const incomingAngle = Math.atan2(contact.x - player.x, contact.z - player.z);
    if (player.blocking && player.stamina >= 12 && Math.abs(wrapAngle(incomingAngle - player.angle)) < 1.65) {
      amount *= 0.15;
      player.stamina -= 12;
    }
    amount = Math.ceil(amount);
    player.hp = Math.max(0, player.hp - amount);
    player.invulnerable = 0.55;
    this.emit('hurt', player, { amount });
    if (player.hp === 0) this.state.mode = 'dead';
    return true;
  }

  /** A physical shield pose, not invulnerability: the eye, legs and shield remain cuttable. */
  updateKnightGuard(enemy) {
    enemy.guarding = enemy.hp > 0 && enemy.structureState?.shield?.remaining !== 0;
    enemy.guardAmount = enemy.guarding ? 1 : 0;
    enemy.guardTime = 0;
  }

  canEnemyDamage(enemy, weaponId) {
    const weapons = enemy.weaponState;
    if (!weapons || Object.keys(weapons).length === 0) return true;
    if (weaponId && Object.hasOwn(weapons, weaponId)) return weapons[weaponId].remaining > 0;
    return Object.values(weapons).some(weapon => weapon.remaining > 0);
  }

  availableActorSlots(owner, { forMegaCrew = false, forWalkerCrew = false } = {}) {
    return Math.max(0, this.actorLimit - this.state.enemies.length - (forMegaCrew ? 0 : pendingMegaDrillCrew(this))
      - (forWalkerCrew ? 0 : pendingMineWalkerCrew(this)) - this.mineSurvivalReservations());
  }

  spawnMegaDrillCrew(owner) { return spawnMegaDrillCrew(this, owner); }
  syncMegaDrillOccupant(actor) { return syncMegaDrillOccupant(this, actor); }
  spawnMineWalkerCrew(owner) { return spawnMineWalkerCrew(this, owner); }
  syncMineWalkerOccupant(actor) { return syncMineWalkerOccupant(this, actor); }

  areAllies() { return true; }

  canFabricateArm(enemy, arm) {
    if (this.isPractice()) return false;
    const weapon = enemy.weaponState?.[`fabricator-${arm}`];
    return !weapon || (weapon.total > 0 && weapon.remaining === weapon.total);
  }

  tronMuzzle(enemy, x, y, z) {
    const legAngle = finite(enemy.legAngle, enemy.angle), torsoYaw = enemy.angle - legAngle;
    const yawX = Math.cos(torsoYaw) * x + Math.sin(torsoYaw) * z;
    const yawZ = -Math.sin(torsoYaw) * x + Math.cos(torsoYaw) * z;
    const cx = Math.cos(enemy.balanceTiltX), sx = Math.sin(enemy.balanceTiltX);
    const cz = Math.cos(enemy.balanceTiltZ), sz = Math.sin(enemy.balanceTiltZ);
    const tx = yawX * cz - y * sz, ty = yawX * sz + y * cz;
    const ry = ty * cx - yawZ * sx, rz = ty * sx + yawZ * cx;
    return { x: enemy.x + Math.cos(legAngle) * tx + Math.sin(legAngle) * rz,
      z: enemy.z - Math.sin(legAngle) * tx + Math.cos(legAngle) * rz,
      y: enemy.supportHeight - enemy.bodyDrop + ry + enemy.elevation };
  }

  updateShieldSupport(enemy, dt, speed) {
    const player = this.state.player;
    const allies = this.state.enemies.filter(ally => ally !== enemy && ally.hp > 0 && this.areAllies(enemy, ally)
      && [COPPER_TRON.id, 'copper-giant', 'copper-robot', 'knight'].includes(ally.type)
      && (ally.type === COPPER_TRON.id ? ['machine-gun', 'missile-cannon-0', 'missile-cannon-1', 'missile-cannon-2']
        .some(id => this.canEnemyDamage(ally, id)) : this.canEnemyDamage(ally, 'sword')));
    allies.sort((a, b) => length(a.x - enemy.x, a.z - enemy.z) - length(b.x - enemy.x, b.z - enemy.z));
    const ally = allies[0];
    enemy.phase = 'chase'; enemy.phaseTime = 0; enemy.attackName = '';
    enemy.supportTargetId = ally?.id ?? null;
    enemy.supportRole = ally ? enemy.structureState?.shield?.remaining === 0 ? 'follow' : 'shield' : 'unarmed';
    if (!ally) return;
    const dx = player.x - ally.x, dz = player.z - ally.z, distance = Math.max(.001, length(dx, dz));
    const offset = Math.min(ally.radius + enemy.radius + .35, Math.max(.8, distance * .5)) * (enemy.supportRole === 'shield' ? 1 : -1);
    const targetX = clamp(ally.x + dx / distance * offset, -this.arenaBounds.x + .2, this.arenaBounds.x - .2);
    const targetZ = clamp(ally.z + dz / distance * offset, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
    const moveX = targetX - enemy.x, moveZ = targetZ - enemy.z, moveDistance = length(moveX, moveZ);
    if (moveDistance > .15) {
      const travel = Math.min(moveDistance, speed * dt);
      enemy.x += moveX / moveDistance * travel; enemy.z += moveZ / moveDistance * travel;
    }
    enemy.angle = Math.atan2(player.x - enemy.x, player.z - enemy.z);
  }

  updateEnemy(enemy, dt) {
    if (enemy.hp <= 0) return;
    const previous = { x: enemy.x, z: enemy.z, elevation: enemy.elevation };
    if (enemy.tunnelEntry) {
      if (enemy.type === HOUND_TYPE) this.updateHoundGravity(enemy, dt);
      if (Object.hasOwn(GROUND_SUPPORT_PROFILES, enemy.type)) this.updateGroundDrop(enemy, dt);
      const mobility = enemy.type === HOUND_TYPE ? enemy.supportsLost === 4 ? .15 : enemy.supportsLost >= 3 ? .4 : 1 : this.groundMobility(enemy);
      advanceMineEmergence(enemy, dt, this.enemyStats(enemy.type), mobility);
      if (this.state.ultraEncounter) this.constrainArenaActor(enemy, previous);
      return;
    }
    this.advanceEnemy(enemy, dt);
    if (enemy.ultraRoom != null || enemy.ultraFalling || enemy.ultraSupportOwnerId != null
      || enemy.groundActorId != null && this.state.enemies.some(owner => owner.id === enemy.groundActorId && owner.type === MECH_SPIDER_TANK_ULTRA.id)) {
      constrainUltraOccupant(this, enemy, previous);
    }
    if (enemy.type !== COPPER_MEGA_DRILL.id && enemy.megaDrillId == null) this.constrainArenaActor(enemy, previous);
  }

  advanceEnemy(enemy, dt) {
    if (enemy.hp <= 0) return;
    const pinnedCrew = enemy.fortressId != null && this.updateFortressCrew(enemy);
    if (enemy.type === HOUND_TYPE) this.updateHoundGravity(enemy, dt);
    const mounted = enemy.mountId != null && this.updateMountedRider(enemy);
    if (Object.hasOwn(GROUND_SUPPORT_PROFILES, enemy.type)) this.updateGroundDrop(enemy, dt);
    if (!mounted && enemy.dismountVelocity !== undefined) {
      enemy.elevation = Math.max(0, enemy.elevation + enemy.dismountVelocity * dt - 7 * dt ** 2);
      enemy.dismountVelocity -= 14 * dt;
      if (enemy.elevation === 0) delete enemy.dismountVelocity;
    }
    // A robot lowered from Ultra's hand must land before chasing a target on
    // the moving boss; otherwise it can walk off the safe island in midair.
    if (enemy.ultraDeploying) {
      if (enemy.elevation > 0) { enemy.phase = 'recover'; enemy.attackName = ''; return; }
      delete enemy.ultraDeploying;
    }
    if (enemy.ultraCrew && updateUltraCrewStation(this, enemy, dt)) return;
    if (enemy.megaDrillId != null && updateMegaDrillOccupant(this, enemy, dt)) return;
    if (enemy.mineWalkerId != null && updateMineWalkerOccupant(this, enemy, dt)) return;
    if (enemy.launch) { this.updateBlobLaunch(enemy, dt); return; }
    if (enemy.type === COPPER_FORTRESS.id) { this.updateFortress(enemy, dt); return; }
    if (enemy.type === COPPER_MEGA_DRILL.id) { updateMegaDrill(this, enemy, dt, COLOSSEUM_MIX); return; }
    if (enemy.type === COPPER_SPIDER_DRONE.id) {
      if (!this.isPractice()) {
        enemy.droneCooldown = Math.max(0, enemy.droneCooldown - dt);
        if (enemy.droneCooldown === 0) enemy.droneCooldown = this.spawnSpiderDrone(enemy) ? 8 : 1;
      }
      updateSpiderDrone(this, enemy, dt); return;
    }
    if (enemy.type === COPPER_MINE_WALKER.id) { updateMineWalker(this, enemy, dt); return; }
    if (enemy.type === MECH_SPIDER_TANK_ULTRA.id) { updateMechUltra(this, enemy, dt); return; }
    if (enemy.type === 'copper-repair-drone') { this.updateRepairDrone(enemy, dt); return; }
    if (enemy.type === COPPER_TRON.id) { this.updateCopperTron(enemy, dt); return; }
    if (enemy.boss) { this.updateBoss(enemy, dt); return; }
    const player = this.state.player, stats = TYPES[enemy.type];
    const mobility = enemy.type === HOUND_TYPE ? enemy.supportsLost === 4 ? .15 : enemy.supportsLost >= 3 ? .4 : 1 : this.groundMobility(enemy);
    const speed = mounted || pinnedCrew ? 0 : stats.speed * finite(enemy.speedScale, 1) * (enemy.crippled ? 0.7 : 1) * mobility;
    enemy.x = clamp(enemy.x + enemy.impulseX * dt, -this.arenaBounds.x + .2, this.arenaBounds.x - .2);
    enemy.z = clamp(enemy.z + enemy.impulseZ * dt, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
    enemy.impulseX *= Math.exp(-7 * dt);
    enemy.impulseZ *= Math.exp(-7 * dt);
    const dx = player.x - enemy.x, dz = player.z - enemy.z;
    const distance = Math.max(0.001, length(dx, dz));
    enemy.phaseTime = Math.max(0, enemy.phaseTime - dt);
    if (enemy.type === 'knight' && !this.canEnemyDamage(enemy, 'sword')) { this.updateShieldSupport(enemy, dt, speed); return; }
    if (enemy.type === 'spreader') { this.updateSpreader(enemy, dt, distance, dx, dz, speed); return; }
    if (enemy.type === 'copper-drill-worm' || enemy.type === 'copper-head-catapult' || enemy.type === HOUND_TYPE) {
      this.updateCopperSiege(enemy, dt, { distance, dx, dz, speed, stats }); return;
    }
    if (enemy.type === 'blob') enemy.elevation = 0;
    if (enemy.phase === 'windup') {
      if (enemy.phaseTime === 0) {
        enemy.phase = 'strike'; enemy.phaseTime = 0.18;
        if (enemy.type === 'brain') {
          this.fireProjectiles(enemy, 1, { speed: 10, homing: false, damage: stats.damage });
        } else if (this.canEnemyDamage(enemy, 'sword') && distance <= stats.range + 0.6
          && (!this.state.ultraEncounter || Math.abs(finite(enemy.elevation) - finite(player.elevation)) < 2.4)
          && Math.abs(wrapAngle(Math.atan2(dx, dz) - enemy.angle)) < 1.55) {
          this.hurtPlayer(stats.damage * finite(enemy.damageScale, 1), enemy);
        }
      }
      return;
    }
    if (enemy.phase === 'strike') {
      if (enemy.phaseTime === 0) { enemy.phase = 'recover'; enemy.phaseTime = stats.recovery; }
      return;
    }
    if (enemy.phase === 'recover') {
      if (enemy.phaseTime === 0) enemy.phase = 'chase';
      return;
    }
    enemy.angle = Math.atan2(dx, dz);
    if (enemy.type === 'brain' && distance < 5) {
      enemy.x -= dx / distance * speed * 0.75 * dt;
      enemy.z -= dz / distance * speed * 0.75 * dt;
    } else if (distance > stats.range) {
      enemy.x += dx / distance * speed * dt;
      enemy.z += dz / distance * speed * dt;
      if (enemy.type === 'blob') {
        enemy.moveTime += dt;
        enemy.elevation = Math.max(0, Math.sin(enemy.moveTime * 6.2)) * 0.14;
      }
    } else {
      enemy.phase = 'windup'; enemy.phaseTime = stats.windup;
      enemy.attackName = enemy.type === 'trider' ? 'lash' : enemy.type === 'blob' ? 'bite' : '';
    }
    enemy.x = clamp(enemy.x, -this.arenaBounds.x + .2, this.arenaBounds.x - .2);
    enemy.z = clamp(enemy.z, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
  }

  /** Lost paw supports settle the body under gravity; airborne pounces fall independently. */
  updateHoundGravity(enemy, dt) {
    if (enemy.elevation > 0 || enemy.pounceVelocity > 0) {
      enemy.elevation = Math.max(0, enemy.elevation + enemy.pounceVelocity * dt - 7 * dt ** 2);
      enemy.pounceVelocity -= 14 * dt;
      if (enemy.elevation === 0) enemy.pounceVelocity = 0;
    }
    this.updateGroundDrop(enemy, dt);
  }

  updateGroundDrop(enemy, dt) {
    if (enemy.mounted) { enemy.bodyDrop = 0; enemy.dropVelocity = 0; return; }
    if (enemy.bodyDrop < enemy.bodyDropTarget) {
      enemy.bodyDrop = Math.min(enemy.bodyDropTarget, enemy.bodyDrop + enemy.dropVelocity * dt + 6 * dt ** 2);
      enemy.dropVelocity = Math.min(4, enemy.dropVelocity + 12 * dt);
      if (enemy.bodyDrop === enemy.bodyDropTarget) enemy.dropVelocity = 0;
    }
  }

  groundMobility(enemy) {
    const profile = GROUND_SUPPORT_PROFILES[enemy.type];
    return profile && enemy.supportsLost >= profile.count ? .12 : 1;
  }

  updateFortress(enemy, dt) {
    const player = this.state.player;
    enemy.bossClock += dt; enemy.phaseTime = Math.max(0, enemy.phaseTime - dt);
    const local = this.fortressLocal(enemy, player.x, player.z), aboard = Math.abs(local.x) < FORTRESS_LAYOUT.width / 2 + .5
      && local.z > FORTRESS_LAYOUT.ramp.minZ - .2 && local.z < FORTRESS_LAYOUT.depth / 2 + .5;
    if (!aboard) {
      const dx = player.x - enemy.x, dz = player.z - enemy.z, distance = Math.max(.01, length(dx, dz));
      enemy.angle += clamp(wrapAngle(Math.atan2(dx, dz) - enemy.angle), -.12 * dt, .12 * dt);
      if (distance > 16) {
        enemy.x = clamp(enemy.x + dx / distance * .7 * dt, -this.arenaBounds.x + 8, this.arenaBounds.x - 8);
        enemy.z = clamp(enemy.z + dz / distance * .7 * dt, -this.arenaBounds.z + 8, this.arenaBounds.z - 8);
      }
    }
    enemy.elevation = .025 + Math.sin(enemy.bossClock * .7) * .025;
    if (!this.isPractice()) {
      this.spawnFortressCrew(enemy);
      enemy.droneCooldown = Math.max(0, enemy.droneCooldown - dt);
      if (enemy.droneCooldown === 0 && this.spawnFortressDrone(enemy)) enemy.droneCooldown = 4;
    }
    const open = enemy.attackName === 'cannons' && ['windup', 'strike'].includes(enemy.phase) ? 1 : 0;
    enemy.cannonOpen = enemy.cannonOpen.map(value => value + (open - value) * Math.min(1, dt * 6));
    if (enemy.phase === 'windup') {
      if (enemy.phaseTime === 0) { this.fireFortressAttack(enemy); enemy.phase = 'strike'; enemy.phaseTime = .45; }
      return;
    }
    if (enemy.phase === 'strike') {
      if (enemy.phaseTime === 0) { enemy.phase = 'recover'; enemy.phaseTime = 2.8; }
      return;
    }
    if (enemy.phase === 'recover') { if (enemy.phaseTime === 0) enemy.phase = 'chase'; return; }
    const cannons = FORTRESS_CANNON_MOUNTS.some((_, index) => this.canEnemyDamage(enemy, `fortress-cannon-${index}`));
    const catapult = this.canEnemyDamage(enemy, 'fortress-catapult');
    if (!cannons && !catapult) return;
    enemy.attackName = catapult && (!cannons || enemy.attackIndex % 2) ? 'catapult' : 'cannons';
    enemy.attackIndex++; enemy.phase = 'windup'; enemy.phaseTime = enemy.attackName === 'cannons' ? 1.2 : 1.5;
    enemy.targetX = player.x; enemy.targetZ = player.z; enemy.targetY = 1.3 + player.elevation;
    this.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: enemy.attackName });
  }

  fireFortressAttack(enemy) {
    const player = this.state.player, local = this.fortressLocal(enemy, player.x, player.z);
    if (Math.abs(local.x) < FORTRESS_LAYOUT.width / 2 && Math.abs(local.z) < FORTRESS_LAYOUT.depth / 2
      && player.elevation >= enemy.elevation + FORTRESS_LAYOUT.deckHeight - .25) return;
    if (enemy.attackName === 'catapult') {
      const point = this.fortressPoint(enemy, FORTRESS_LAYOUT.catapultLaunch ?? { x: 0, y: FORTRESS_LAYOUT.wallTop + 1.2, z: 1.1 });
      const dx = enemy.targetX - point.x, dz = enemy.targetZ - point.z, distance = length(dx, dz);
      const flightTime = clamp(distance / 7, 1, 2.4), gravity = 10;
      this.fireProjectiles(enemy, 1, { ...point, kind: 'copper-head', weaponId: 'fortress-catapult', damage: 28,
        angle: Math.atan2(dx, dz), speed: distance / flightTime,
        vy: (enemy.targetY - point.y + .5 * gravity * flightTime ** 2) / flightTime,
        targetX: enemy.targetX, targetZ: enemy.targetZ, flightTime, life: flightTime + .8 });
    } else FORTRESS_CANNON_MOUNTS.forEach((mount, index) => {
      const extension = FORTRESS_LAYOUT.cannonExtension * enemy.cannonOpen[index] + FORTRESS_LAYOUT.cannonMuzzle;
      const point = this.fortressPoint(enemy, { x: mount.x + Math.sin(mount.angle) * extension,
        y: mount.y, z: mount.z + Math.cos(mount.angle) * extension });
      const dx = enemy.targetX - point.x, dz = enemy.targetZ - point.z, distance = Math.max(.2, length(dx, dz));
      const direction = enemy.angle + mount.angle;
      if ((dx * Math.sin(direction) + dz * Math.cos(direction)) / distance < .1) return;
      this.fireProjectiles(enemy, 1, { ...point, kind: 'copper', weaponId: `fortress-cannon-${index}`,
        angle: Math.atan2(dx, dz), speed: 9, vy: (enemy.targetY - point.y) * 9 / distance, damage: 24, arming: .12, life: 4 });
    });
  }

  updateRepairDrone(drone, dt) {
    drone.bossClock += dt; drone.repairCooldown = Math.max(0, drone.repairCooldown - dt);
    const targets = this.state.enemies.filter(actor => actor !== drone && actor.hp > 0 && this.areAllies(drone, actor)
      && (COLOSSEUM_TYPES.includes(actor.type) || DRILL_MINE_TYPES.includes(actor.type)
        || COPPER_BOSSES.some(boss => boss.id === actor.type) || DRILL_MINE_BOSSES.some(boss => boss.id === actor.type))
      && actor.type !== 'copper-repair-drone'
      && (actor.hp < (actor.repairMaxHp ?? actor.maxHp) || actor.needsVoxelRepair));
    targets.sort((a, b) => (a.hp / (a.repairMaxHp ?? a.maxHp)) - (b.hp / (b.repairMaxHp ?? b.maxHp))
      || length(a.x - drone.x, a.z - drone.z) - length(b.x - drone.x, b.z - drone.z));
    const target = targets[0] ?? this.state.enemies.find(actor => actor.id === drone.ownerId && actor.hp > 0);
    drone.repairTargetId = targets[0]?.id ?? null; drone.elevation = 2 + Math.sin(drone.bossClock * 2) * .15;
    if (!target) return;
    const dx = target.x - drone.x, dz = target.z - drone.z, distance = Math.max(.01, length(dx, dz));
    drone.angle = Math.atan2(dx, dz); drone.phase = 'chase';
    if (distance > 3) {
      const travel = Math.min(distance - 3, 4 * dt);
      drone.x = clamp(drone.x + dx / distance * travel, -this.arenaBounds.x + 1, this.arenaBounds.x - 1);
      drone.z = clamp(drone.z + dz / distance * travel, -this.arenaBounds.z + 1, this.arenaBounds.z - 1);
    } else if (targets[0] && drone.repairCooldown === 0) {
      target.hp = Math.min(target.repairMaxHp ?? target.maxHp, target.hp + 25);
      target.needsVoxelRepair = false; drone.repairCooldown = 2; drone.phase = 'strike';
      this.emit('repair', drone, { id: target.id, sourceId: drone.id, cells: 16, amount: 25, targetX: target.x, targetZ: target.z });
    }
  }

  updateCopperSiege(enemy, dt, { distance, dx, dz, speed, stats }) {
    const hound = enemy.type === HOUND_TYPE, worm = enemy.type !== 'copper-head-catapult', weaponId = worm ? 'drill' : 'launcher';
    const move = direction => {
      enemy.x = clamp(enemy.x + dx / distance * speed * dt * direction, -this.arenaBounds.x + .5, this.arenaBounds.x - .5);
      enemy.z = clamp(enemy.z + dz / distance * speed * dt * direction, -this.arenaBounds.z + .5, this.arenaBounds.z - .5);
    };
    if (!this.canEnemyDamage(enemy, weaponId)) {
      if (hound) enemy.pouncing = false;
      enemy.phase = 'chase'; enemy.attackName = ''; enemy.angle = Math.atan2(dx, dz);
      if (distance > (worm ? 4 : 10)) move(1);
      return;
    }
    if (enemy.phase === 'windup') {
      if (enemy.phaseTime === 0) {
        enemy.phase = 'strike'; enemy.phaseTime = hound ? .45 : worm ? .55 : .25; enemy.strikeHit = false;
        if (hound) {
          enemy.pouncing = enemy.supportsLost < 3 && enemy.elevation === 0;
          if (enemy.pouncing) enemy.pounceVelocity = 3.15;
          else enemy.phaseTime = .2;
        }
        if (!worm) this.lobCopperHead(enemy);
      }
      return;
    }
    if (enemy.phase === 'strike') {
      if (enemy.phaseTime === 0) {
        if (hound) enemy.pouncing = false;
        enemy.phase = 'recover'; enemy.phaseTime = stats.recovery; return;
      }
      if (worm) {
        const travel = hound && !enemy.pouncing ? 0 : (hound ? 14 : 12) * finite(enemy.speedScale, 1)
          * (enemy.crippled ? .7 : 1) * this.groundMobility(enemy) * dt;
        enemy.x = clamp(enemy.x + Math.sin(enemy.angle) * travel, -this.arenaBounds.x + .5, this.arenaBounds.x - .5);
        enemy.z = clamp(enemy.z + Math.cos(enemy.angle) * travel, -this.arenaBounds.z + .5, this.arenaBounds.z - .5);
        const reach = hound ? 2.9 : 3.35;
        const tipX = enemy.x + Math.sin(enemy.angle) * reach, tipZ = enemy.z + Math.cos(enemy.angle) * reach;
        if (!enemy.strikeHit && length(this.state.player.x - tipX, this.state.player.z - tipZ) < 1.05
          && Math.abs(1.3 + this.state.player.elevation - ((hound ? 1.43 : .95) + enemy.elevation - finite(enemy.bodyDrop))) < 1) {
          enemy.strikeHit = this.hurtPlayer(stats.damage * finite(enemy.damageScale, 1), enemy);
        }
      }
      return;
    }
    if (enemy.phase === 'recover') { if (enemy.phaseTime === 0) enemy.phase = 'chase'; return; }
    enemy.angle = Math.atan2(dx, dz);
    if (distance > (hound && enemy.supportsLost >= 3 ? 3.2 : stats.range)) { move(1); return; }
    if (!worm && distance < 9.5) {
      const beforeX = enemy.x, beforeZ = enemy.z; move(-1);
      if (length(enemy.x - beforeX, enemy.z - beforeZ) > .00001) return;
    }
    enemy.attackName = worm ? 'drill' : 'lob'; enemy.phase = 'windup'; enemy.phaseTime = stats.windup;
    enemy.targetX = this.state.player.x; enemy.targetZ = this.state.player.z;
    enemy.targetY = 1.3 + this.state.player.elevation;
  }

  lobCopperHead(enemy) {
    const x = enemy.x + Math.sin(enemy.angle), z = enemy.z + Math.cos(enemy.angle), y = 2.8 + enemy.elevation - finite(enemy.bodyDrop);
    const dx = enemy.targetX - x, dz = enemy.targetZ - z, distance = length(dx, dz);
    const flightTime = clamp(distance / 8, .8, 1.8), gravity = 10;
    this.fireProjectiles(enemy, 1, { kind: 'copper-head', weaponId: 'launcher', x, y, z,
      angle: Math.atan2(dx, dz), speed: distance / flightTime, damage: TYPES[enemy.type].damage,
      vy: (enemy.targetY - y + .5 * gravity * flightTime ** 2) / flightTime,
      gravity, targetX: enemy.targetX, targetZ: enemy.targetZ, flightTime, life: flightTime + .8 });
  }

  /** The factory idles at distance, defends itself close up and loses real capabilities to cuts. */
  updateCopperTron(enemy, dt) {
    const player = this.state.player;
    enemy.bossClock += dt;
    const balanceEase = 1 - Math.exp(-5 * dt);
    enemy.balanceTiltX += (enemy.balanceTargetX - enemy.balanceTiltX) * balanceEase;
    enemy.balanceTiltZ += (enemy.balanceTargetZ - enemy.balanceTiltZ) * balanceEase;
    enemy.phaseTime = Math.max(0, enemy.phaseTime - dt);
    for (const key of ['fabricateCooldown', 'gunCooldown', 'jumpCooldown']) enemy[key] = Math.max(0, enemy[key] - dt);
    if (enemy.supportsLost === 3 && enemy.bodyDrop < 3.8) {
      enemy.dropVelocity = Math.min(8, enemy.dropVelocity + 10 * dt);
      enemy.bodyDrop = Math.min(3.8, enemy.bodyDrop + enemy.dropVelocity * dt);
    } else if (enemy.supportsLost < 3) enemy.bodyDrop += (enemy.partialDropTarget - enemy.bodyDrop) * balanceEase;
    if (enemy.jumping) {
      const jump = enemy.jump;
      jump.age = Math.min(jump.duration, jump.age + dt);
      enemy.jumpProgress = jump.age / jump.duration;
      enemy.x = jump.startX + (jump.targetX - jump.startX) * enemy.jumpProgress;
      enemy.z = jump.startZ + (jump.targetZ - jump.startZ) * enemy.jumpProgress;
      enemy.elevation = Math.max(0, jump.velocityY * jump.age - 8 * jump.age ** 2);
      enemy.animationPhase = 'jump';
      if (enemy.jumpProgress === 1) {
        enemy.jumping = false; enemy.jump = null; enemy.elevation = 0;
        enemy.phase = 'recover'; enemy.phaseTime = .9; enemy.jumpCooldown = 1.5;
        this.emit('land', enemy, { id: enemy.id, enemyType: enemy.type });
      }
      this.updateTronMissiles(enemy, dt);
      return;
    }
    const startX = enemy.x, startZ = enemy.z;
    enemy.x = clamp(enemy.x + enemy.impulseX * dt, -this.arenaBounds.x + 2, this.arenaBounds.x - 2);
    enemy.z = clamp(enemy.z + enemy.impulseZ * dt, -this.arenaBounds.z + 2, this.arenaBounds.z - 2);
    enemy.impulseX *= Math.exp(-7 * dt); enemy.impulseZ *= Math.exp(-7 * dt);
    const dx = player.x - enemy.x, dz = player.z - enemy.z, distance = Math.max(.001, length(dx, dz));
    enemy.angle = Math.atan2(dx, dz);
    enemy.retreating = distance < 7 && enemy.gunAvailable && enemy.supportsLost < 3;
    if (enemy.retreating) {
      const speed = COPPER_TRON.speed * enemy.speedScale * (enemy.crippled ? .7 : 1);
      enemy.x = clamp(enemy.x - dx / distance * speed * dt, -this.arenaBounds.x + 2, this.arenaBounds.x - 2);
      enemy.z = clamp(enemy.z - dz / distance * speed * dt, -this.arenaBounds.z + 2, this.arenaBounds.z - 2);
    }
    if (length(enemy.x - startX, enemy.z - startZ) > .00001) enemy.legAngle = enemy.angle;
    if (enemy.fabricating) {
      enemy.fabricationTime = Math.max(0, enemy.fabricationTime - dt);
      if (enemy.fabricationTime === 0) {
        enemy.fabricating = false;
        this.fabricateTronRobots(enemy);
      }
    } else if (enemy.fabricateCooldown === 0 && enemy.attackName !== 'leap'
      && [0, 1].some(arm => this.canFabricateArm(enemy, arm))) {
      enemy.fabricating = true; enemy.fabricationTime = 1.2; enemy.fabricateCooldown = 9;
      this.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: 'fabricate' });
    }
    if (!enemy.gunAvailable && enemy.attackName === 'machine-gun') {
      enemy.phase = 'recover'; enemy.phaseTime = .4; enemy.attackName = ''; enemy.burstTime = 0;
    }
    if (enemy.phase === 'windup' && enemy.phaseTime === 0) {
      if (enemy.attackName === 'leap') {
        if (enemy.jumpsUsed >= 3) {
          enemy.phase = 'recover'; enemy.phaseTime = .9; enemy.attackName = '';
          enemy.animationPhase = 'idle';
          this.updateTronMissiles(enemy, dt);
          return;
        }
        const away = distance < 9 ? -1 : 1, duration = 1.4;
        enemy.jump = { age: 0, duration, velocityY: 8 * duration, startX: enemy.x, startZ: enemy.z,
          targetX: clamp(enemy.x + dx / distance * away * 10, -this.arenaBounds.x + 2, this.arenaBounds.x - 2),
          targetZ: clamp(enemy.z + dz / distance * away * 10, -this.arenaBounds.z + 2, this.arenaBounds.z - 2) };
        enemy.legAngle = enemy.angle;
        enemy.jumping = true; enemy.jumpsUsed++; enemy.jumpProgress = 0; enemy.animationPhase = 'jump';
        enemy.phase = 'strike'; enemy.phaseTime = duration;
        this.emit('leap', enemy, { id: enemy.id, enemyType: enemy.type });
        return;
      }
      enemy.phase = 'strike'; enemy.burstTime = 1.1; enemy.shotClock = 0;
    }
    if (enemy.phase === 'strike' && enemy.attackName === 'machine-gun' && enemy.gunAvailable) {
      enemy.burstTime = Math.max(0, enemy.burstTime - dt);
      enemy.shotClock -= dt;
      if (enemy.shotClock <= 0) {
        const bodyY = enemy.supportHeight - enemy.bodyDrop;
        const muzzle = this.tronMuzzle(enemy, 0, Math.max(.65 - bodyY, -1.96), 2.97);
        this.fireProjectiles(enemy, 1, { kind: 'copper', speed: 18, damage: COPPER_TRON.damage, life: 2.4,
          ...muzzle, vy: clamp((1.3 + player.elevation - muzzle.y) * 18 / Math.max(.2, distance - 2.97), -18, 18), weaponId: 'machine-gun' });
        enemy.shotClock = .1;
      }
      if (enemy.burstTime === 0) { enemy.phase = 'recover'; enemy.phaseTime = 1.1; enemy.gunCooldown = 2.1; }
    } else if (enemy.phase === 'recover' && enemy.phaseTime === 0) {
      enemy.phase = 'chase'; enemy.attackName = '';
    } else if (enemy.phase === 'chase') {
      const shoot = enemy.gunAvailable && distance < 7 && enemy.gunCooldown === 0;
      const leap = !enemy.gunAvailable && enemy.jumpsUsed < 3 && enemy.supportsLost < 3 && enemy.jumpCooldown === 0 && !enemy.fabricating;
      if (shoot || leap) {
        enemy.attackName = shoot ? 'machine-gun' : 'leap'; enemy.phase = 'windup'; enemy.phaseTime = .7;
        this.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: enemy.attackName });
      }
    }
    enemy.animationPhase = enemy.attackName === 'leap' && enemy.phase === 'windup' ? 'jump'
      : enemy.phase === 'strike' ? 'shoot' : enemy.fabricating ? 'fabricate' : enemy.retreating ? 'retreat' : 'idle';
    this.updateTronMissiles(enemy, dt);
  }

  updateTronMissiles(enemy, dt) {
    enemy.missileFlash = Math.max(0, enemy.missileFlash - dt);
    enemy.missileCooldown = Math.max(0, enemy.missileCooldown - dt);
    const surviving = [0, 1, 2].filter(index => this.canEnemyDamage(enemy, `missile-cannon-${index}`));
    if (!surviving.length) { enemy.missileWindup = 0; return; }
    if (enemy.missileWindup > 0) {
      enemy.missileWindup = Math.max(0, enemy.missileWindup - dt);
      if (enemy.missileWindup === 0) {
        for (const index of surviving) {
          const muzzle = this.tronMuzzle(enemy, (index - 1) * .6, 1.36, -3.2);
          this.fireProjectiles(enemy, 1, { kind: 'copper-missile', weaponId: `missile-cannon-${index}`,
            ...muzzle, angle: enemy.angle + Math.PI, vy: Math.sin(enemy.balanceTiltX) * 6.5,
            speed: 6.5, damage: 18, homing: true, turnRate: 1.1, arming: .5, life: 8 });
        }
        enemy.missileCooldown = 8; enemy.missileFlash = .4;
      }
    } else if (enemy.missileCooldown === 0) {
      enemy.missileWindup = 1.1;
      this.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: 'missiles' });
    }
    if (enemy.missileWindup > 0 || enemy.missileFlash > 0) enemy.animationPhase = 'missile';
  }

  fabricateTronRobots(owner) {
    if (this.isPractice()) return 0;
    let count = 0;
    for (let arm = 0; arm < 2 && this.availableActorSlots(owner) > 0; arm++) {
      if (!this.canFabricateArm(owner, arm)) continue;
      const ordinal = this.state.survival ? this.survivalRegularCount() : owner.fabricated;
      const angle = owner.angle + (arm ? 1 : -1) * 1.1;
      const robot = this.createEnemy(COLOSSEUM_MIX[ordinal % COLOSSEUM_MIX.length],
        owner.x + Math.sin(angle) * 3.8, owner.z + Math.cos(angle) * 3.8);
      robot.ownerId = owner.id; robot.fabricatorArm = arm;
      this.state.enemies.push(robot); owner.fabricated = Math.min(1e9, owner.fabricated + 1); count++;
      if (this.state.survival) this.state.survival.totalSpawned = Math.min(MAX_SCORE, this.state.survival.totalSpawned + 1);
    }
    this.emit('fabricate', owner, { id: owner.id, enemyType: owner.type, count });
    return count;
  }

  /** The source Spreader paints a 10m square every eight seconds and throws living blobs. */
  updateSpreader(enemy, dt, distance, dx, dz, speed) {
    const stats = TYPES.spreader;
    if (enemy.phase === 'windup') {
      if (enemy.phaseTime === 0) {
        enemy.phase = 'strike'; enemy.phaseTime = 0.2;
        const launched = this.launchBlobs(enemy);
        this.emit('spray', enemy, { id: enemy.id, enemyType: enemy.type, launched });
      }
      return;
    }
    if (enemy.phase === 'strike') {
      if (enemy.phaseTime === 0) { enemy.phase = 'recover'; enemy.phaseTime = stats.recovery; }
      return;
    }
    if (enemy.phase === 'recover') {
      if (enemy.phaseTime === 0) enemy.phase = 'chase';
    }
    enemy.angle = Math.atan2(dx, dz);
    if (distance > stats.range) {
      enemy.x = clamp(enemy.x + dx / distance * speed * dt, -this.arenaBounds.x + .2, this.arenaBounds.x - .2);
      enemy.z = clamp(enemy.z + dz / distance * speed * dt, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
    }
    if (enemy.phase === 'recover') return;
    enemy.sprayCooldown = Math.max(0, enemy.sprayCooldown - dt);
    if (enemy.sprayCooldown === 0) {
      enemy.attackName = 'spray'; enemy.phase = 'windup'; enemy.phaseTime = stats.windup;
      this.addHazard(enemy, 'infection', enemy.x, enemy.z,
        { radius: 5, halfSize: 5, delay: stats.windup, life: stats.windup + 8, damage: stats.damage });
    }
  }

  launchBlobs(owner, requestedCount = 3) {
    if (this.isPractice()) return 0;
    const count = Math.min(3, Math.max(0, Math.floor(finite(requestedCount))), this.availableActorSlots(owner));
    for (let index = 0; index < count; index += 1) {
      const angle = owner.angle + (index - (count - 1) / 2) * 0.45;
      const blob = this.createEnemy('blob', owner.x, owner.z);
      blob.ownerId = owner.id;
      blob.elevation = 1.8;
      blob.launch = { x: blob.x, z: blob.z, y: 1.8, age: 0, duration: 1.1,
        targetX: clamp(blob.x + Math.sin(angle) * 4.5, -this.arenaBounds.x + 1, this.arenaBounds.x - 1),
        targetZ: clamp(blob.z + Math.cos(angle) * 4.5, -this.arenaBounds.z + 1, this.arenaBounds.z - 1) };
      this.state.enemies.push(blob);
    }
    return count;
  }

  updateBlobLaunch(enemy, dt) {
    const launch = enemy.launch;
    launch.age = Math.min(launch.duration, launch.age + dt);
    const fraction = launch.age / launch.duration;
    enemy.x = launch.x + (launch.targetX - launch.x) * fraction;
    enemy.z = launch.z + (launch.targetZ - launch.z) * fraction;
    enemy.elevation = Math.max(0, launch.y * (1 - fraction) + Math.sin(Math.PI * fraction) * 1.8);
    if (fraction === 1) { enemy.elevation = 0; delete enemy.launch; }
  }

  updateBoss(enemy, dt) {
    const player = this.state.player, stats = this.enemyStats(enemy.type);
    enemy.bossClock += dt;
    if (enemy.type === 'trilom-leader') enemy.shielded = enemy.bossClock % 8 < 3;
    enemy.x = clamp(enemy.x + enemy.impulseX * dt, -this.arenaBounds.x + 1.5, this.arenaBounds.x - 1.5);
    enemy.z = clamp(enemy.z + enemy.impulseZ * dt, -this.arenaBounds.z + 1.5, this.arenaBounds.z - 1.5);
    enemy.impulseX *= Math.exp(-7 * dt); enemy.impulseZ *= Math.exp(-7 * dt);
    if (!this.canEnemyDamage(enemy)) { enemy.phase = 'recover'; enemy.attackName = ''; enemy.phaseTime = .8; return; }
    enemy.phaseTime = Math.max(0, enemy.phaseTime - dt);
    const dx = player.x - enemy.x, dz = player.z - enemy.z;
    const distance = Math.max(0.001, length(dx, dz));
    if (enemy.phase === 'windup') {
      if (enemy.phaseTime === 0) {
        enemy.phase = 'strike'; enemy.phaseTime = 0.22;
        this.executeBossAttack(enemy);
      }
      return;
    }
    if (enemy.phase === 'strike') {
      if (['charge', 'lunge', 'burrow'].includes(enemy.attackName)) {
        const speed = (enemy.type === 'frost-triram' ? 17 : 13) * (enemy.crippled ? 0.7 : 1) * this.groundMobility(enemy);
        enemy.x = clamp(enemy.x + Math.sin(enemy.angle) * speed * dt, -this.arenaBounds.x + 1.5, this.arenaBounds.x - 1.5);
        enemy.z = clamp(enemy.z + Math.cos(enemy.angle) * speed * dt, -this.arenaBounds.z + 1.5, this.arenaBounds.z - 1.5);
        if (length(player.x - enemy.x, player.z - enemy.z) < enemy.radius + 0.7) this.hurtPlayer(stats.damage * enemy.damageScale, enemy);
      }
      if (enemy.phaseTime === 0) {
        enemy.phase = 'recover'; enemy.phaseTime = enemy.attackName === 'regenerate' ? 3 : stats.recovery;
      }
      return;
    }
    if (enemy.phase === 'recover') {
      if (enemy.attackName === 'regenerate') enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.045 * dt);
      if (enemy.phaseTime === 0) enemy.phase = 'chase';
      return;
    }
    enemy.angle = Math.atan2(dx, dz);
    if (distance > stats.range) {
      const speed = stats.speed * enemy.speedScale * (enemy.crippled ? 0.7 : 1) * this.groundMobility(enemy);
      enemy.x = clamp(enemy.x + dx / distance * speed * dt, -this.arenaBounds.x + 1.5, this.arenaBounds.x - 1.5);
      enemy.z = clamp(enemy.z + dz / distance * speed * dt, -this.arenaBounds.z + 1.5, this.arenaBounds.z - 1.5);
      return;
    }
    enemy.attackName = stats.attacks[enemy.attackIndex % stats.attacks.length];
    enemy.attackIndex += 1;
    enemy.targetX = player.x; enemy.targetZ = player.z;
    enemy.phase = 'windup'; enemy.phaseTime = stats.windup;
    this.emit('bossattack', enemy, { id: enemy.id, enemyType: enemy.type, attackName: enemy.attackName });
    if (['lightning', 'smash', 'slam', 'freeze', 'grab', 'banish'].includes(enemy.attackName)) {
      const frost = enemy.attackName === 'freeze' || enemy.attackName === 'slam';
      const radius = enemy.attackName === 'smash' ? 3.2 : enemy.attackName === 'freeze' ? 3.7 : 2.5;
      const position = enemy.attackName === 'smash' ? enemy : player;
      this.addHazard(enemy, frost ? 'frost' : 'lightning', position.x, position.z,
        { radius, delay: stats.windup, life: stats.windup + (frost ? 3 : 0.4), damage: stats.damage,
          warningOnly: enemy.attackName === 'grab' || enemy.attackName === 'banish' });
      if (enemy.attackName === 'lightning') {
        for (const offset of [-3.5, 3.5]) this.addHazard(enemy, 'lightning', player.x + offset, player.z,
          { radius: 2, delay: stats.windup + 0.35, life: stats.windup + 0.75, damage: 23 });
      }
    }
  }

  executeBossAttack(enemy) {
    if (!this.canEnemyDamage(enemy)) return;
    const player = this.state.player;
    const attack = enemy.attackName, stats = this.enemyStats(enemy.type);
    if (['charge', 'lunge', 'burrow'].includes(attack)) {
      enemy.phaseTime = attack === 'charge' ? 0.75 : 0.65;
      if (attack === 'burrow') {
        this.addHazard(enemy, 'frost', enemy.targetX, enemy.targetZ,
          { radius: 2.2, delay: 0.25, life: 1.1, damage: 22 });
      }
    } else if (attack === 'shockwave') {
      this.addHazard(enemy, 'shockwave', enemy.x, enemy.z,
        { radius: 0.4, speed: 7.2, maxRadius: 24, delay: 0.25, life: 3.8, damage: stats.damage });
    } else if (attack === 'sweep') {
      if (length(player.x - enemy.x, player.z - enemy.z) < 6) this.hurtPlayer(stats.damage * enemy.damageScale, enemy);
    } else if (['eyes', 'souls', 'ghosts', 'ice'].includes(attack)) {
      const kind = attack === 'ghosts' ? 'ghost' : attack === 'souls' ? 'soul' : attack === 'ice' ? 'ice' : 'eye';
      this.fireProjectiles(enemy, attack === 'souls' ? 2 : 3,
        { kind, homing: attack !== 'ice', speed: attack === 'ice' ? 11 : 6.5, damage: stats.damage * 0.65 });
    } else if (['summon', 'spirits'].includes(attack)) {
      this.summonMinions(enemy, attack === 'spirits' ? 3 : 2, attack === 'spirits');
    } else if (attack === 'grab' || attack === 'banish') {
      const distance = length(player.x - enemy.x, player.z - enemy.z);
      if (distance < (attack === 'grab' ? 10 : 6) && this.hurtPlayer(stats.damage * enemy.damageScale, enemy)) {
        player.x = clamp(player.x + Math.sin(enemy.angle) * 4, -this.arenaBounds.x, this.arenaBounds.x);
        player.z = clamp(player.z + Math.cos(enemy.angle) * 4, -this.arenaBounds.z, this.arenaBounds.z);
      }
    } else if (attack === 'regenerate') enemy.phaseTime = 0.3;
  }

  summonMinions(owner, count, spirit = false) {
    if (this.isPractice()) return 0;
    const available = this.availableActorSlots(owner);
    for (let index = 0; index < Math.min(count, available); index += 1) {
      const angle = owner.angle + (index - count / 2) * 1.2;
      const minion = this.createEnemy('ling', owner.x + Math.sin(angle) * 3, owner.z + Math.cos(angle) * 3);
      minion.ownerId = owner.id;
      minion.spirit = spirit;
      if (spirit) { minion.name = 'Evil Tri Spirit'; minion.speedScale *= 1.15; }
      this.state.enemies.push(minion);
    }
  }

  fireProjectiles(owner, count, options = {}) {
    if (!this.canEnemyDamage(owner, options.weaponId)) return;
    const available = Math.max(0, MAX_PROJECTILES - this.state.projectiles.length);
    for (let index = 0; index < Math.min(count, available); index += 1) {
      const angle = finite(options.angle, owner.angle) + (index - (count - 1) / 2) * 0.24;
      const speed = finite(options.speed, 8);
      this.state.projectiles.push({ id: this.nextId++, ownerId: owner.id, x: finite(options.x, owner.x), z: finite(options.z, owner.z),
        vx: Math.sin(angle) * speed, vz: Math.cos(angle) * speed, speed,
        radius: options.kind === 'copper' ? .14 : options.kind === 'copper-missile' ? .26 : options.kind === 'copper-head' ? .42 : options.kind === 'ice' ? 0.25 : 0.32,
        damage: finite(options.damage, this.enemyStats(owner.type).damage) * finite(owner.damageScale, 1),
        life: clamp(finite(options.life, options.homing ? 5 : 3), .1, owner.type === MECH_SPIDER_TANK_ULTRA.id ? 9 : options.kind === 'copper-missile' ? 8 : 5),
        homing: options.homing === true, turnRate: clamp(finite(options.turnRate, 1.4), .1, 4), kind: options.kind ?? 'eye',
        ...(options.kind === 'copper-missile' ? { homingTime: 3.5, lockLost: false } : {}),
        ...(options.kind === 'copper-head' ? { gravity: 10, age: 0, targetX: options.targetX, targetZ: options.targetZ, flightTime: options.flightTime, impactRadius: 1.1 } : {}),
        ...(options.arming > 0 ? { arming: Math.min(2, options.arming) } : {}),
        ...(Number.isFinite(options.y) ? { y: options.y, vy: finite(options.vy) }
          : owner.ultraRoom != null ? { y: finite(owner.elevation) + 1.3, vy: 0 } : {}) });
    }
  }

  addHazard(owner, type, x, z, options = {}) {
    if (this.state.hazards.length >= MAX_HAZARDS) return;
    this.state.hazards.push({ id: this.nextId++, ownerId: owner.id, type,
      x: clamp(finite(x), -this.arenaBounds.x, this.arenaBounds.x), z: clamp(finite(z), -this.arenaBounds.z, this.arenaBounds.z), radius: 2,
      delay: 1, life: 2, damage: 20, hit: false, tick: 0, ...options,
      damage: finite(options.damage, 20) * finite(owner.damageScale, 1) });
  }

  updateHazards(dt) {
    const player = this.state.player;
    for (const hazard of this.state.hazards) {
      hazard.life -= dt;
      hazard.delay = Math.max(0, hazard.delay - dt);
      if (hazard.delay > 0) continue;
      if (hazard.warningOnly) continue;
      if (hazard.type === 'shockwave') hazard.radius = Math.min(hazard.maxRadius, hazard.radius + hazard.speed * dt);
      const distance = length(player.x - hazard.x, player.z - hazard.z);
      const airborne = player.elevation > .65 && ['infection', 'frost', 'shockwave'].includes(hazard.type);
      const inside = !airborne && (hazard.type === 'infection'
        ? Math.abs(player.x - hazard.x) < hazard.halfSize && Math.abs(player.z - hazard.z) < hazard.halfSize
        : hazard.type === 'shockwave' ? Math.abs(distance - hazard.radius) < 0.8 : distance < hazard.radius);
      if (hazard.type === 'frost' || hazard.type === 'infection') {
        const infection = hazard.type === 'infection';
        hazard.tick = Math.max(0, hazard.tick - dt);
        if (inside && player.invulnerable <= 0) player.slowTime = infection ? 0.65 : 0.5;
        if (inside && hazard.tick === 0) {
          this.hurtPlayer(hazard.damage * (infection ? 1 : 0.35), hazard);
          hazard.tick = infection ? 1 : 0.8;
        }
      } else if (inside && !hazard.hit) {
        this.hurtPlayer(hazard.damage, hazard);
        hazard.hit = true;
      }
    }
    this.state.hazards = this.state.hazards.filter((hazard) => hazard.life > 0);
  }

  playerFloor(x, z) {
    let floor = { height: 0, id: null };
    for (const fortress of this.state.enemies) {
      if (fortress.type === MECH_SPIDER_TANK_ULTRA.id && fortress.hp > 0) {
        const height = ultraFloor(fortress, this.state.player, x, z);
        if (height > floor.height) floor = { height, id: fortress.id };
        continue;
      }
      if (fortress.type === COPPER_MINE_WALKER.id && fortress.hp > 0) {
        const height = mineWalkerFloor(fortress, this.state.player, x, z);
        if (height > floor.height) floor = { height, id: fortress.id };
        continue;
      }
      if (fortress.type === COPPER_MEGA_DRILL.id && fortress.hp > 0) {
        const height = megaDrillFloor(fortress, this.state.player, x, z);
        if (height > floor.height) floor = { height, id: fortress.id };
        continue;
      }
      if (fortress.type !== COPPER_FORTRESS.id || fortress.hp <= 0) continue;
      const point = this.fortressLocal(fortress, x, z), ramp = FORTRESS_LAYOUT.ramp;
      let height = 0;
      if (Math.abs(point.x - ramp.x) <= ramp.width / 2 && point.z >= ramp.minZ && point.z <= ramp.maxZ
        && fortress.structureState?.[ramp.id]?.remaining !== 0) {
        height = fortress.elevation + ramp.bottomY + (ramp.topY - ramp.bottomY) * (point.z - ramp.minZ) / (ramp.maxZ - ramp.minZ);
      } else if (Math.abs(point.x) < FORTRESS_LAYOUT.width / 2 - .15 && Math.abs(point.z) < FORTRESS_LAYOUT.depth / 2
        && fortress.structureState?.['fortress-floor']?.remaining !== 0
        && (this.state.player.groundActorId === fortress.id || this.state.player.elevation >= FORTRESS_LAYOUT.deckHeight + fortress.elevation - .25)) {
        height = FORTRESS_LAYOUT.deckHeight + fortress.elevation;
      }
      if (height > floor.height) floor = { height, id: fortress.id };
    }
    return floor;
  }

  resolvePlayerFloor(wasGrounded, previousHeight = this.state.player.groundHeight) {
    const player = this.state.player;
    if (player.mineWalkerClimb) {
      if (this.state.enemies.some(enemy => enemy.id === player.mineWalkerClimb.ownerId && enemy.hp > 0)) return;
      detachMineWalkerClimb(player);
    }
    const floor = this.playerFloor(player.x, player.z);
    if ((wasGrounded && player.jumpVelocity <= 0 && floor.height >= previousHeight - .35)
      || (player.jumpVelocity <= 0 && player.elevation <= floor.height)) {
      player.elevation = floor.height; player.jumpVelocity = 0;
    }
    player.groundHeight = floor.height; player.groundActorId = floor.id;
  }

  separateFortressPlayer(fortress) {
    const player = this.state.player, height = player.elevation - fortress.elevation, radius = .42;
    const walls = FORTRESS_LAYOUT.panelAabbs.filter(panel => fortress.structureState?.[panel.id]?.remaining !== 0);
    FORTRESS_LAYOUT.gates.forEach((gate, index) => {
      const open = index < 4 ? fortress.cannonOpen[index] : fortress.hatchOpen;
      if (open > .7 || fortress.structureState?.[gate.id]?.remaining === 0) return;
      const side = Math.abs(Math.sin(gate.angle)) > .5;
      const halfThickness = FORTRESS_LAYOUT.wallThickness / 2;
      walls.push({ minX: gate.x - (side ? halfThickness : gate.width / 2), maxX: gate.x + (side ? halfThickness : gate.width / 2),
        minZ: gate.z - (side ? gate.width / 2 : halfThickness), maxZ: gate.z + (side ? gate.width / 2 : halfThickness),
        minY: gate.y - gate.height / 2, maxY: gate.y + gate.height / 2 });
    });
    const goal = this.fortressLocal(fortress, player.x, player.z);
    const previous = this.previousPlayerPosition ?? player;
    const point = this.fortressLocal(fortress, previous.x, previous.z);
    const steps = Math.max(1, Math.ceil(length(goal.x - point.x, goal.z - point.z) / .2));
    const dx = (goal.x - point.x) / steps, dz = (goal.z - point.z) / steps;
    for (let step = 0; step < steps; step++) {
      point.x += dx; point.z += dz;
      for (const wall of walls) {
        if (height + 1.8 <= wall.minY || height >= wall.maxY) continue;
        const x = clamp(point.x, wall.minX, wall.maxX), z = clamp(point.z, wall.minZ, wall.maxZ);
        const awayX = point.x - x, awayZ = point.z - z, distance = length(awayX, awayZ);
        if (distance >= radius) continue;
        if (distance > .00001) {
          point.x += awayX / distance * (radius - distance); point.z += awayZ / distance * (radius - distance);
        } else {
          const exits = [{ distance: point.x - wall.minX, x: wall.minX - radius, z: point.z },
            { distance: wall.maxX - point.x, x: wall.maxX + radius, z: point.z },
            { distance: point.z - wall.minZ, x: point.x, z: wall.minZ - radius },
            { distance: wall.maxZ - point.z, x: point.x, z: wall.maxZ + radius }].sort((a, b) => a.distance - b.distance);
          point.x = exits[0].x; point.z = exits[0].z;
        }
      }
    }
    const world = this.fortressPoint(fortress, point); player.x = world.x; player.z = world.z;
  }

  /** Bodies block walking; an active dash can pass through before contact resolves. */
  separatePlayer() {
    const player = this.state.player;
    if (this.state.ultraEncounter) separateUltraCover(player, this.previousPlayerPosition ?? player);
    for (const enemy of this.state.enemies) if (enemy.type === MECH_SPIDER_TANK_ULTRA.id && enemy.hp > 0) separateUltraPlayer(enemy, player, this.previousPlayerPosition ?? player);
    for (const enemy of this.state.enemies) if (enemy.type === COPPER_MEGA_DRILL.id && enemy.hp > 0) separateMegaDrillPlayer(enemy, player, this.previousPlayerPosition);
    for (const enemy of this.state.enemies) if (enemy.type === COPPER_MINE_WALKER.id && enemy.hp > 0) separateMineWalkerPlayer(enemy, player, this.previousPlayerPosition ?? player);
    for (const enemy of this.state.enemies) if (enemy !== player && enemy.type === COPPER_FORTRESS.id && enemy.hp > 0) this.separateFortressPlayer(enemy);
    if (player.dashTime > 0) { this.constrainArenaActor(player, this.previousPlayerPosition ?? player); return; }
    for (let pass = 0; pass < 3; pass += 1) {
      for (const enemy of this.state.enemies) {
        if (enemy === player || enemy.hp <= 0 || [COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, COPPER_MINE_WALKER.id, MECH_SPIDER_TANK_ULTRA.id].includes(enemy.type) || enemy.pinnedCrew || enemy.launch || enemy.jumping || enemy.mounted
          || (enemy.dismountVelocity !== undefined && enemy.elevation > .65)) continue;
        if (enemy.type === COPPER_TRON.id && enemy.bodyDrop < 2.4) {
          const legAngle = finite(enemy.legAngle, enemy.angle);
          for (let leg = 0; leg < 3; leg++) {
            if (enemy.structureState?.[`leg-${leg}`]?.remaining === 0) continue;
            const radius = leg === 0 ? 5 : 4.05, angle = TRON_LEG_ANGLES[leg];
            const x = Math.sin(angle) * radius, z = Math.cos(angle) * radius - .35;
            this.separatePlayerCircle(player, enemy.x + Math.cos(legAngle) * x + Math.sin(legAngle) * z,
              enemy.z - Math.sin(legAngle) * x + Math.cos(legAngle) * z, .8);
          }
        } else {
          this.separatePlayerCircle(player, enemy.x, enemy.z, enemy.radius);
        }
      }
    }
    player.x = clamp(player.x, -this.arenaBounds.x, this.arenaBounds.x);
    player.z = clamp(player.z, -this.arenaBounds.z, this.arenaBounds.z);
    this.constrainArenaActor(player, this.previousPlayerPosition ?? player);
  }

  separatePlayerCircle(player, centerX, centerZ, radius) {
    const dx = player.x - centerX, dz = player.z - centerZ;
    const distance = length(dx, dz), clearance = radius + .42;
    if (distance >= clearance) return;
    const angle = distance > .0001 ? Math.atan2(dx, dz) : player.angle + Math.PI;
    const origin = { x: player.x, z: player.z };
    let closest = null, closestDistance = Infinity;
    for (let direction = 0; direction < 8; direction++) {
      const heading = angle + direction * Math.PI / 4;
      const x = centerX + Math.sin(heading) * (clearance + .001);
      const z = centerZ + Math.cos(heading) * (clearance + .001);
      if (Math.abs(x) > this.arenaBounds.x || Math.abs(z) > this.arenaBounds.z) continue;
      const movement = length(x - origin.x, z - origin.z);
      if (movement < closestDistance) { closest = { x, z }; closestDistance = movement; }
    }
    if (closest) { player.x = closest.x; player.z = closest.z; }
  }

  separateEnemies() {
    const enemies = this.state.enemies;
    for (let i = 0; i < enemies.length; i += 1) {
      for (let j = i + 1; j < enemies.length; j += 1) {
        const a = enemies[i], b = enemies[j];
        if (a.playerControlled || b.playerControlled || a.ultraRoom != null || b.ultraRoom != null || [COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, COPPER_MINE_WALKER.id, MECH_SPIDER_TANK_ULTRA.id].includes(a.type) || [COPPER_FORTRESS.id, COPPER_MEGA_DRILL.id, COPPER_MINE_WALKER.id, MECH_SPIDER_TANK_ULTRA.id].includes(b.type) || a.pinnedCrew || b.pinnedCrew
          || a.launch || b.launch || a.jumping || b.jumping || a.mounted || b.mounted) continue;
        const dx = b.x - a.x, dz = b.z - a.z, distance = length(dx, dz);
        const overlap = a.radius + b.radius - distance;
        if (overlap <= 0) continue;
        const nx = distance > 0.001 ? dx / distance : 1;
        const nz = distance > 0.001 ? dz / distance : 0;
        const shift = overlap * 0.25;
        a.x = clamp(a.x - nx * shift, -this.arenaBounds.x + .2, this.arenaBounds.x - .2); a.z = clamp(a.z - nz * shift, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
        b.x = clamp(b.x + nx * shift, -this.arenaBounds.x + .2, this.arenaBounds.x - .2); b.z = clamp(b.z + nz * shift, -this.arenaBounds.z + .2, this.arenaBounds.z - .2);
      }
    }
    if (this.state.arenaId === 'drill-mine') for (const enemy of enemies) if (enemy.type !== COPPER_MEGA_DRILL.id && enemy.megaDrillId == null) this.constrainArenaActor(enemy, enemy);
  }

  updateProjectiles(dt) {
    const player = this.state.player;
    const playerHeight = 1.3 + finite(player.elevation);
    const ultraHulls = this.state.ultraEncounter ? this.state.enemies.filter(actor => actor.type === MECH_SPIDER_TANK_ULTRA.id && actor.hp > 0) : [];
    for (const bolt of this.state.projectiles) {
      if (bolt.kind === ULTRA_ROOF_MISSILE_KIND) {
        advanceUltraRoofMissile(this, bolt, dt, (impact, rocket) => {
          if (ultraRoofBlastReaches(this, player, impact, rocket.impactRadius)) this.hurtPlayer(rocket.damage, impact);
        });
        continue;
      }
      const previous = { x: bolt.x, y: finite(bolt.y, 1.3), z: bolt.z };
      if (bolt.arming > 0) bolt.arming = Math.max(0, bolt.arming - dt);
      if (bolt.kind === 'copper-missile' && bolt.homing) {
        if (!(bolt.arming > 0)) bolt.homingTime = Math.max(0, bolt.homingTime - dt);
        if (bolt.homingTime === 0 || length(bolt.x - player.x, bolt.z - player.z) <= 5) {
          bolt.homing = false; bolt.lockLost = true;
        }
      }
      if (bolt.homing && !(bolt.arming > 0)) {
        const desired = Math.atan2(player.x - bolt.x, player.z - bolt.z);
        const current = Math.atan2(bolt.vx, bolt.vz);
        const angle = current + clamp(wrapAngle(desired - current), -bolt.turnRate * dt, bolt.turnRate * dt);
        bolt.vx = Math.sin(angle) * bolt.speed; bolt.vz = Math.cos(angle) * bolt.speed;
        if (Number.isFinite(bolt.y) || player.elevation > 0) {
          bolt.y = finite(bolt.y, 1.3);
          const timeToPlayer = Math.max(.25, length(player.x - bolt.x, player.z - bolt.z) / bolt.speed);
          const vy = clamp((playerHeight - bolt.y) / timeToPlayer, -bolt.speed, bolt.speed);
          bolt.vy = finite(bolt.vy) + clamp(vy - finite(bolt.vy), -bolt.speed * dt * 2, bolt.speed * dt * 2);
        }
      }
      bolt.x += bolt.vx * dt; bolt.z += bolt.vz * dt; bolt.life -= dt;
      if (Number.isFinite(bolt.y)) {
        const gravity = finite(bolt.gravity);
        bolt.y += finite(bolt.vy) * dt - .5 * gravity * dt ** 2;
        if (gravity > 0) { bolt.vy -= gravity * dt; bolt.age += dt; if (bolt.y < .1) bolt.life = 0; }
      }
      if (bolt.kind === 'copper-missile' && bolt.homing && length(bolt.x - player.x, bolt.z - player.z) <= 5) {
        bolt.homing = false; bolt.lockLost = true;
      }
      if (this.state.ultraEncounter && ultraCoverBlocks(previous, { x: bolt.x, y: finite(bolt.y, 1.3), z: bolt.z })) {
        bolt.life = 0; continue;
      }
      if (ultraHulls.length) {
        const owner = this.state.enemies.find(actor => actor.id === bolt.ownerId) ?? { team: bolt.team };
        if (ultraHulls.some(hull => this.areAllies(owner, hull)
          && ultraHullBlocks(hull, previous, { x: bolt.x, y: finite(bolt.y, 1.3), z: bolt.z }))) {
          bolt.life = 0; continue;
        }
      }
      if (!(bolt.arming > 0) && length(bolt.x - player.x, bolt.z - player.z) < 0.65 + bolt.radius
        && Math.abs(finite(bolt.y, 1.3) - playerHeight) < .8 + bolt.radius) {
        this.hurtPlayer(bolt.damage, { x: bolt.x - bolt.vx, z: bolt.z - bolt.vz });
        bolt.life = 0;
      }
    }
    this.state.projectiles = this.state.projectiles.filter((bolt) => bolt.life > 0 && Math.abs(bolt.x) < this.arenaBounds.x + 2 && Math.abs(bolt.z) < this.arenaBounds.z + 2);
  }

  checkWave() {
    if (this.state.ultraEncounter && !this.state.ultraEncounter.complete) return;
    if (this.state.gameMode === 'survival') return;
    if (this.state.mode !== 'playing' || this.state.enemies.length > 0) return;
    this.state.projectiles = [];
    this.state.hazards = [];
    this.state.score = Math.min(MAX_SCORE, this.state.score + this.state.wave * 250);
    const player = this.state.player;
    player.hp = Math.min(player.maxHp, player.hp + 20);
    player.stamina = player.maxStamina;
    this.state.mode = 'upgrade';
    this.state.upgrades = this.upgradeChoices();
    this.emit('waveclear', player);
  }

  survivalSpawnPoint() {
    const player = this.state.player, survival = this.state.survival;
    const random = clamp(finite(this.random(), .5), 0, 1);
    const heading = player.angle + random * TAU + survival.totalSpawned * 2.399963;
    let best = null, bestClearance = -Infinity;
    for (let attempt = 0; attempt < 16; attempt++) {
      const angle = heading + attempt * TAU / 16, radius = 10 + random * 5;
      const x = clamp(player.x + Math.sin(angle) * radius, -this.arenaBounds.x + 2, this.arenaBounds.x - 2);
      const z = clamp(player.z + Math.cos(angle) * radius, -this.arenaBounds.z + 2, this.arenaBounds.z - 2);
      if (length(x - player.x, z - player.z) < 8) continue;
      const clearance = this.state.enemies.reduce((nearest, enemy) => Math.min(nearest, length(x - enemy.x, z - enemy.z) - enemy.radius), 10);
      if (clearance > bestClearance) { best = { x, z }; bestClearance = clearance; }
      if (clearance > 3) break;
    }
    // Every corner of the rectangular arena has a free inward annulus.
    return best ?? { x: 0, z: 0 };
  }

  spawnSurvivalEnemies(count) {
    if (this.isPractice()) return 0;
    if (this.state.arenaId === 'drill-mine') return this.spawnMineSurvivalEnemies(count);
    const survival = this.state.survival;
    const colosseum = this.state.arenaId === 'colosseum';
    const pool = colosseum ? [...COLOSSEUM_MIX, ...(survival.level >= 11 ? COLOSSEUM_LATE_TYPES : []), ...(survival.level >= 15 ? [HOUND_TYPE] : [])] : ['blob', 'ling', 'ling', 'brain', ...(survival.level >= 2 ? ['gardener', 'trider'] : []),
      ...(survival.level >= 3 ? ['spreader'] : [])];
    // Keep one actor slot free for the first scheduled boss.
    const fortressPending = colosseum && survival.level % 10 === 0 && survival.lastFortressLevel !== survival.level;
    const megaPending = colosseum && survival.level >= 30 && !survival.megaDrillsSpawned;
    const reserved = Number(survival.bossesSpawned === 0) + Number(colosseum && survival.tronsSpawned === 0)
      + (fortressPending ? 5 : 0) + Number(megaPending);
    const available = Math.max(0, Math.min(this.actorLimit - reserved - this.state.enemies.length, this.availableActorSlots()));
    for (let index = 0; index < Math.min(count, available) && this.state.enemies.length < this.actorLimit - reserved; index++) {
      const roll = clamp(finite(this.random(), .5), 0, .999999);
      const type = colosseum ? pool[this.survivalRegularCount() % pool.length]
        : pool[(survival.totalSpawned + Math.floor(roll * pool.length)) % pool.length];
      const point = this.survivalSpawnPoint();
      const enemy = this.createEnemy(type, point.x, point.z);
      this.state.enemies.push(enemy);
      survival.totalSpawned = Math.min(MAX_SCORE, survival.totalSpawned + 1);
      if (type === HOUND_TYPE) this.maybeMountRider(enemy, reserved);
    }
  }

  spawnMineSurvivalEnemies(count) {
    const survival = this.state.survival;
    const reserved = this.mineSurvivalReservations();
    let spawned = 0;
    for (let encounter = 0; encounter < count; encounter++) {
      const type = DRILL_MINE_MIX[survival.mineEncounterIndex % DRILL_MINE_MIX.length];
      if (type === MINER_BOT.id) {
        const amount = this.spawnMineMinerBatch(survival.mineTunnelIndex, reserved);
        if (!amount) break;
        spawned += amount;
        survival.mineTunnelIndex = (survival.mineTunnelIndex + 1) % DRILL_MINE_TUNNELS.length;
      } else {
        if (Math.min(this.actorLimit - reserved - this.state.enemies.length, this.availableActorSlots()) < 1) break;
        const point = this.mineEntrance(type, survival.mineSpecialIndex);
        if (!this.mineEntranceIsClear([point], this.enemyStats(type).radius)) break;
        this.state.enemies.push(this.createMineEnemy(type, survival.mineSpecialIndex++));
        survival.totalSpawned = Math.min(MAX_SCORE, survival.totalSpawned + 1);
        spawned++;
      }
      survival.mineEncounterIndex = (survival.mineEncounterIndex + 1) % DRILL_MINE_MIX.length;
    }
    return spawned;
  }

  survivalRegularCount() {
    const s = this.state.survival;
    return s.totalSpawned - s.bossesSpawned - finite(s.tronsSpawned) - finite(s.fortressesSpawned) - finite(s.megaDrillsSpawned)
      - finite(s.fortressCrewSpawned) - finite(s.repairDronesSpawned) - finite(s.megaCrewSpawned) - finite(s.spiderDronesSpawned)
      - finite(s.mineWalkersSpawned) - finite(s.mineWalkerCrewSpawned);
  }

  /** Future bosses and their real crews cannot lose their slots to miner batches or drones. */
  mineSurvivalReservations() {
    const survival = this.state.survival;
    if (!survival || this.state.arenaId !== 'drill-mine' || this.isPractice()) return 0;
    if (this.state.ultraEncounter && !this.state.ultraEncounter.defeated) return 0;
    const level = Math.max(survival.level, Math.min(10000, 1 + Math.floor((this.state.elapsed + 1e-8) / 30)));
    return Number(level >= 4 && survival.lastSpiderDroneLevel !== level)
      + 6 * Number(level >= 6 && survival.lastMineWalkerLevel !== level)
      + 3 * Number(level % 10 === 0 && survival.lastMegaDrillLevel !== level);
  }

  updateSurvival(dt) {
    if (this.isPractice()) return;
    const state = this.state, survival = state.survival;
    if (state.ultraEncounter && !state.ultraEncounter.complete) return;
    survival.elapsed = state.elapsed;
    const level = Math.max(state.ultraEncounter?.defeated ? 51 : 1, Math.min(10000, 1 + Math.floor((state.elapsed + 1e-8) / 30)));
    const milestone = level > survival.level;
    if (milestone) {
      survival.level = level; state.wave = level; state.wavePlan = getWavePlan(level, state);
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 15);
      state.player.stamina = Math.min(state.player.maxStamina, state.player.stamina + 25);
    }
    if (state.arenaId === 'drill-mine' && level >= 50 && !state.ultraEncounter) {
      survival.level = 50; state.wave = 50; state.wavePlan = getWavePlan(50, state);
      survival.nextSpawnIn = null; survival.nextBossIn = null; survival.nextMilestoneIn = null;
      beginUltraEncounter(this); return;
    }
    if (survival.nextSpawnIn == null) survival.nextSpawnIn = .7;
    survival.nextMilestoneIn = Math.max(0, (Math.floor((state.elapsed + 1e-8) / 30) + 1) * 30 - state.elapsed);
    if (state.ultraEncounter && !state.ultraEncounter.defeated) {
      survival.nextSpawnIn = null; survival.nextBossIn = null;
      if (milestone) this.offerSurvivalMilestone(level);
      return;
    }
    if (state.arenaId === 'colosseum') {
      survival.nextMegaDrillIn = survival.megaDrillsSpawned ? null : Math.max(0, 870 - state.elapsed);
      if (level >= 30 && !survival.megaDrillsSpawned && state.enemies.length < this.actorLimit) {
        const mega = this.createEnemy(COPPER_MEGA_DRILL.id, -18, 0); state.enemies.push(mega);
        survival.megaDrillsSpawned = 1; survival.totalSpawned++; survival.nextMegaDrillIn = null;
        this.spawnMegaDrillCrew(mega);
        this.emit('survivalmegadrill', mega, { enemyType: mega.type, name: mega.name });
      }
    }
    const mine = state.arenaId === 'drill-mine';
    if (mine) {
      const eligible = level % 10 === 0 && survival.lastMegaDrillLevel !== level;
      if (eligible && state.enemies.length < this.actorLimit) {
        const mega = this.createEnemy(COPPER_MEGA_DRILL.id, -17.5, 0); state.enemies.push(mega);
        survival.megaDrillsSpawned++; survival.lastMegaDrillLevel = level; survival.totalSpawned++; this.spawnMegaDrillCrew(mega);
        this.emit('survivalmegadrill', mega, { enemyType: mega.type, name: mega.name });
      }
      const nextLevel = eligible && survival.lastMegaDrillLevel !== level ? level : (Math.floor(level / 10) + 1) * 10;
      survival.nextMegaDrillIn = Math.max(0, (nextLevel - 1) * 30 - state.elapsed);
      const walkerEligible = level >= 6 && survival.lastMineWalkerLevel !== level;
      if (walkerEligible && state.enemies.length < this.actorLimit) {
        const walker = this.createEnemy(COPPER_MINE_WALKER.id, 16, 3); state.enemies.push(walker);
        survival.mineWalkersSpawned++; survival.lastMineWalkerLevel = level; survival.totalSpawned++; this.spawnMineWalkerCrew(walker);
        this.emit('survivalboss', walker, { enemyType: walker.type, name: walker.name });
      }
      const nextWalkerLevel = walkerEligible && survival.lastMineWalkerLevel !== level ? level : Math.max(6, level + 1);
      survival.nextMineWalkerIn = Math.max(0, (nextWalkerLevel - 1) * 30 - state.elapsed);
      const spiderEligible = level >= 4 && survival.lastSpiderDroneLevel !== level;
      if (spiderEligible && state.enemies.length < this.actorLimit) {
        const spider = this.createEnemy(COPPER_SPIDER_DRONE.id, level >= 6 ? 0 : state.player.x > 0 ? -18 : 18, level >= 6 ? -18 : 0);
        state.enemies.push(spider); survival.spiderDronesSpawned++; survival.lastSpiderDroneLevel = level; survival.totalSpawned++;
        this.emit('survivalboss', spider, { enemyType: spider.type, name: spider.name });
      }
      const nextSpiderLevel = spiderEligible && survival.lastSpiderDroneLevel !== level ? level : Math.max(4, level + 1);
      survival.nextSpiderDroneIn = Math.max(0, (nextSpiderLevel - 1) * 30 - state.elapsed);
      survival.nextBossIn = Math.min(survival.nextMegaDrillIn, survival.nextSpiderDroneIn, survival.nextMineWalkerIn);
    }
    const bosses = availableBossCatalog(state);
    if (!mine) survival.nextBossIn = bosses.length ? Math.max(0, (survival.bossesSpawned + 1) * 60 - state.elapsed) : null;
    if (!mine && survival.nextBossIn !== null && survival.nextBossIn < 1e-8 && state.enemies.length < this.actorLimit) {
      const boss = state.arenaId === 'colosseum' ? BOSS_CATALOG[0] : bosses[survival.bossesSpawned % bosses.length];
      const point = this.survivalSpawnPoint();
      state.enemies.push(this.createEnemy(boss.id, point.x, point.z));
      survival.bossesSpawned = Math.min(1e9, survival.bossesSpawned + 1);
      survival.totalSpawned = Math.min(MAX_SCORE, survival.totalSpawned + 1);
      survival.nextBossIn = Math.max(0, (survival.bossesSpawned + 1) * 60 - state.elapsed);
      this.emit('survivalboss', point, { enemyType: boss.id, name: boss.name });
    }
    if (state.arenaId === 'colosseum') {
      if (level % 3 === 0 && survival.lastTronLevel !== level && state.enemies.length < this.actorLimit) {
        const point = this.survivalSpawnPoint();
        state.enemies.push(this.createEnemy(COPPER_TRON.id, point.x, point.z));
        survival.tronsSpawned = Math.min(1e9, survival.tronsSpawned + 1);
        survival.lastTronLevel = level;
        survival.totalSpawned = Math.min(MAX_SCORE, survival.totalSpawned + 1);
        this.emit('survivaltron', point, { enemyType: COPPER_TRON.id, name: COPPER_TRON.name });
      }
      const nextTronLevel = level % 3 === 0 && survival.lastTronLevel !== level ? level : (Math.floor(level / 3) + 1) * 3;
      survival.nextTronIn = Math.max(0, (nextTronLevel - 1) * 30 - state.elapsed);
      if (level % 10 === 0 && survival.lastFortressLevel !== level && state.enemies.length <= this.actorLimit - 5) {
        const point = this.survivalSpawnPoint(), fortress = this.createEnemy(COPPER_FORTRESS.id, point.x, point.z);
        state.enemies.push(fortress); survival.fortressesSpawned++; survival.lastFortressLevel = level; survival.totalSpawned++;
        this.spawnFortressCrew(fortress);
        this.emit('survivalfortress', fortress, { enemyType: fortress.type, name: fortress.name });
      }
      const nextFortressLevel = level % 10 === 0 && survival.lastFortressLevel !== level ? level : (Math.floor(level / 10) + 1) * 10;
      survival.nextFortressIn = Math.max(0, (nextFortressLevel - 1) * 30 - state.elapsed);
    }
    survival.nextSpawnIn = Math.max(0, survival.nextSpawnIn - dt);
    if (survival.nextSpawnIn === 0) {
      this.spawnSurvivalEnemies(Math.min(3, 1 + Math.floor((level - 1) / 4)));
      survival.nextSpawnIn = Math.max(.7, 2.8 - (level - 1) * .12);
    }
    if (milestone) this.offerSurvivalMilestone(level);
  }

  offerSurvivalMilestone(level) {
    this.state.mode = 'upgrade'; this.state.upgrades = this.upgradeChoices();
    this.emit('survivalmilestone', this.state.player, { level, upgradeId: null, amount: 15, energy: 25 });
  }

  chooseUpgrade(id) {
    if (this.state.mode !== 'upgrade') return false;
    const upgrade = UPGRADE_CATALOG.find(entry => entry.id === id);
    if (!upgrade) throw new RangeError(`Unknown arena upgrade: ${String(id)}`);
    const level = this.state.upgradeLevels[id];
    if (upgrade.maxLevel !== null && level >= upgrade.maxLevel) return false;
    this.state.upgradeLevels[id] = Math.min(1e9, level + 1);
    this.applyUpgradeStats();
    const player = this.state.player;
    if (id === 'heart' || id === 'repair') player.hp = player.maxHp;
    if (this.state.gameMode === 'survival') {
      if (id === 'repair') player.stamina = player.maxStamina;
      this.state.upgrades = []; this.state.mode = 'playing';
      return true;
    }
    player.stamina = player.maxStamina;
    player.x = 0; player.z = 0;
    player.elevation = 0; player.groundHeight = 0; player.groundActorId = null; player.jumpVelocity = 0;
    player.attackCooldown = 0; player.dashCooldown = 0; player.kickCooldown = 0;
    player.dashTime = 0; player.invulnerable = 1; player.blocking = false; player.slowTime = 0;
    this.state.mode = 'playing';
    this.spawnWave();
    return true;
  }

  applyUpgradeStats() {
    const levels = this.state.upgradeLevels, player = this.state.player;
    this.swordDamage = Math.min(500, 28 * 1.35 ** levels.sword);
    this.dashInterval = Math.max(.35, 1.4 * .75 ** levels.dash);
    Object.assign(player, { bladePower: this.swordDamage / 28, maxHp: 100 + 30 * levels.heart,
      maxStamina: 100 + 15 * levels.dash, dashDuration: this.dashInterval,
      attackDuration: Math.max(.18, .38 - .04 * levels.haste), kickDuration: Math.max(1.1, 2.5 - .28 * levels.kick),
      moveSpeed: Math.min(11.5, 7.3 + .7 * levels.stride), armor: Math.min(.4, .08 * levels.armor),
      staminaRegen: 29 * Math.min(2, 1 + .2 * levels.capacitor), killHealing: 3 + 2 * levels.leech,
      kickDamage: 14 + 6 * levels.kick, kickKnockback: 19 + 2 * levels.kick });
    player.hp = Math.min(player.hp, player.maxHp);
    player.stamina = Math.min(player.stamina, player.maxStamina);
  }

  upgradeChoices() {
    const player = this.state.player, levels = this.state.upgradeLevels;
    return UPGRADE_CATALOG.map(upgrade => {
      const level = levels[upgrade.id], capped = upgrade.maxLevel !== null && level >= upgrade.maxLevel;
      const next = capped ? level : level + 1;
      const effects = {
        sword: `Blade power ${player.bladePower.toFixed(2)}× → ${(Math.min(500, 28 * 1.35 ** next) / 28).toFixed(2)}×. Wider physical cuts.`,
        heart: `Maximum health ${player.maxHp} → ${100 + 30 * next}. Fully restores health.`,
        dash: `Dash recovery ${player.dashDuration.toFixed(2)}s → ${Math.max(.35, 1.4 * .75 ** next).toFixed(2)}s. Energy ${player.maxStamina} → ${100 + 15 * next}.`,
        haste: `Sword recovery ${player.attackDuration.toFixed(2)}s → ${Math.max(.18, .38 - .04 * next).toFixed(2)}s.`,
        stride: `Movement ${player.moveSpeed.toFixed(1)} → ${Math.min(11.5, 7.3 + .7 * next).toFixed(1)} m/s.`,
        armor: `Damage reduction ${Math.round(player.armor * 100)}% → ${Math.min(40, 8 * next)}%. Also protects while blocking.`,
        capacitor: `Energy recovery ${player.staminaRegen.toFixed(1)} → ${(29 * Math.min(2, 1 + .2 * next)).toFixed(1)}/s.`,
        leech: `Health per defeat ${player.killHealing} → ${3 + 2 * next}. Bosses restore 22 extra.`,
        kick: `Kick damage ${player.kickDamage} → ${14 + 6 * next}. Recovery ${player.kickDuration.toFixed(2)}s → ${Math.max(1.1, 2.5 - .28 * next).toFixed(2)}s.`,
        repair: `Restore health ${Math.ceil(player.hp)}/${player.maxHp} and energy ${Math.ceil(player.stamina)}/${player.maxStamina}. Permanent upgrades stay installed.`,
      };
      return { ...upgrade, level, capped, description: `${capped ? 'Maximum reached. ' : ''}${effects[upgrade.id]}` };
    });
  }

  pause() {
    if (this.state.mode === 'playing') this.state.mode = 'paused';
    else if (this.state.mode === 'paused') this.state.mode = 'playing';
  }
}
