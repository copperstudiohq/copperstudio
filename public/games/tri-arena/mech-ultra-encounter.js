import { MECH_SPIDER_TANK_ULTRA, ULTRA_ORIGIN, spawnUltraCrew } from './mech-ultra-combat.js';
import { MEGA_DRILL_LAYOUT } from './mega-drill-layout.js';

/** These are visual props, never fifteen additional combat AI actors. */
export const ULTRA_CRASH_SPOT = Object.freeze({ x: 0, y: 1.5, z: -42 });
export const ULTRA_DRONE_COUNT = 15;
export const ULTRA_DRONE_FLIGHT_SECONDS = 3;
export const ULTRA_DRONE_IMPACT_SECONDS = .5;
export const ULTRA_DRONE_ARRIVAL_INTERVAL = ULTRA_DRONE_FLIGHT_SECONDS + ULTRA_DRONE_IMPACT_SECONDS;
export const ULTRA_DRONE_INGRESS = Object.freeze({ x: -12, y: 620, z: -50 });
export const ULTRA_SURFACE_HEIGHT = 608;
export const ULTRA_CINEMATIC_GRAVITY = 9.81;
export const ULTRA_TOP_HOLE = Object.freeze({ minX: -30, maxX: 30, minZ: ULTRA_CRASH_SPOT.z - 24, maxZ: ULTRA_CRASH_SPOT.z + 24 });
export const ULTRA_MINER_SLIP_SECONDS = .3;
export const ULTRA_MINER_FALL_SECONDS = Math.sqrt(2 * (ULTRA_SURFACE_HEIGHT - ULTRA_CRASH_SPOT.y) / ULTRA_CINEMATIC_GRAVITY);
export const ULTRA_MINER_FALL_INTERVAL = .45;
export const ULTRA_MINER_STAGE_SECONDS = 13;
export const ULTRA_MEGA_DRIVE_SECONDS = 4.5;
export const ULTRA_MEGA_TIP_SECONDS = 2;
export const ULTRA_MEGA_FALL_WINDOW = 11.5;
export const ULTRA_MEGA_IMPACT_ROOT_Y = ULTRA_CRASH_SPOT.y + MEGA_DRILL_LAYOUT.tipZ;
export const ULTRA_MEGA_FALL_SECONDS = Math.sqrt(2 * (ULTRA_SURFACE_HEIGHT - ULTRA_MEGA_IMPACT_ROOT_Y) / ULTRA_CINEMATIC_GRAVITY);
export const MECH_ULTRA_TIMELINE = Object.freeze([
  ['expansion', 3], ['shake', 2], ['roof-drones', ULTRA_DRONE_COUNT * ULTRA_DRONE_ARRIVAL_INTERVAL], ['rim-miners', 4],
  ['falling-miners', ULTRA_MINER_STAGE_SECONDS], ['mega-drill', ULTRA_MEGA_DRIVE_SECONDS + ULTRA_MEGA_TIP_SECONDS + ULTRA_MEGA_FALL_WINDOW], ['rumble', 4], ['drill-arm', 4],
  ['fabricator-arm', 4], ['head', 5], ['legs', 5],
].map(([stage, duration], index, entries) => Object.freeze({ stage, duration, index,
  start: entries.slice(0, index).reduce((sum, entry) => sum + entry[1], 0) })));
export const ULTRA_CINEMATIC_DURATION = MECH_ULTRA_TIMELINE.reduce((sum, entry) => sum + entry.duration, 0);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const finiteElapsed = value => Math.max(0, Number.isFinite(value) ? value : 0);
const arrivalAge = (elapsed, start, index, interval) => {
  const age = elapsed - start - index * interval;
  return Math.abs(age) < 1e-9 ? 0 : age;
};
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const stageByName = Object.fromEntries(MECH_ULTRA_TIMELINE.map(entry => [entry.stage, entry]));
const stageProgress = (elapsed, name) => {
  const stage = stageByName[name];
  return clamp((elapsed - stage.start) / stage.duration);
};

/** A pure clock-to-pose mapping keeps animation deterministic and pause-safe. */
export function getUltraEncounterPose(requestedElapsed) {
  const elapsed = finiteElapsed(requestedElapsed);
  const entry = MECH_ULTRA_TIMELINE.find(stage => elapsed < stage.start + stage.duration);
  const stage = entry?.stage ?? 'battle', stageTime = entry ? elapsed - entry.start : elapsed - ULTRA_CINEMATIC_DURATION;
  return { stage, stageIndex: entry?.index ?? MECH_ULTRA_TIMELINE.length, stageTime,
    progress: entry ? clamp(stageTime / entry.duration) : 1, complete: !entry,
    caveScale: 1 + 4 * stageProgress(elapsed, 'expansion'),
    shake: stage === 'shake' || stage === 'rumble' || stage === 'drill-arm',
    droneProgress: stageProgress(elapsed, 'roof-drones'), minersAtRim: stageProgress(elapsed, 'rim-miners'),
    minersFalling: stageProgress(elapsed, 'falling-miners'), megaDrillProgress: stageProgress(elapsed, 'mega-drill'),
    drillArmReveal: stageProgress(elapsed, 'drill-arm'), fabricatorArmReveal: stageProgress(elapsed, 'fabricator-arm'),
    headReveal: stageProgress(elapsed, 'head'), legsReveal: stageProgress(elapsed, 'legs') };
}

const FLIGHT_CONTROLS = Object.freeze([ULTRA_DRONE_INGRESS,
  Object.freeze({ x: -8, y: 620, z: -42 }), Object.freeze({ x: 20, y: 35, z: -83 }), ULTRA_CRASH_SPOT]);

/** Powered, banked flight through the top opening, with a brief terminal crash. */
function droneFlight(progress) {
  const t = clamp(progress), inverse = 1 - t, point = {}, tangent = {};
  const [a, b, c, d] = FLIGHT_CONTROLS;
  for (const axis of ['x', 'y', 'z']) {
    point[axis] = inverse ** 3 * a[axis] + 3 * inverse ** 2 * t * b[axis] + 3 * inverse * t ** 2 * c[axis] + t ** 3 * d[axis];
    tangent[axis] = 3 * inverse ** 2 * (b[axis] - a[axis]) + 6 * inverse * t * (c[axis] - b[axis]) + 3 * t ** 2 * (d[axis] - c[axis]);
  }
  return { ...point, yaw: Math.atan2(tangent.x, tangent.z),
    pitch: Math.atan2(tangent.y, Math.hypot(tangent.x, tangent.z)), roll: Math.sin(t * Math.PI) * -.42 };
}

export function getUltraCinematicDrones(requestedElapsed) {
  const elapsed = finiteElapsed(requestedElapsed), start = stageByName['roof-drones'].start;
  const types = ['copper-repair-drone', 'copper-spider-drone', 'copper-mine-walker'];
  return Array.from({ length: ULTRA_DRONE_COUNT }, (_, index) => {
    const age = arrivalAge(elapsed, start, index, ULTRA_DRONE_ARRIVAL_INTERVAL);
    const progress = clamp(age / ULTRA_DRONE_FLIGHT_SECONDS), pose = droneFlight(progress);
    const crashed = age >= ULTRA_DRONE_FLIGHT_SECONDS;
    const settle = crashed ? smooth((age - ULTRA_DRONE_FLIGHT_SECONDS) / ULTRA_DRONE_IMPACT_SECONDS) : 0;
    const angle = index * 2.399963, radius = .6 + Math.floor(index / 5) * 1.2;
    return { id: index, index, type: types[Math.floor(index / 5)], progress,
      active: age >= 0 && !crashed, visible: age >= 0, crashed,
      x: lerp(pose.x, ULTRA_CRASH_SPOT.x + Math.sin(angle) * radius, settle),
      y: lerp(pose.y, .3 + index % 5 * .3 + Math.floor(index / 5) * .15, settle),
      z: lerp(pose.z, ULTRA_CRASH_SPOT.z + Math.cos(angle) * radius, settle),
      yaw: pose.yaw + Math.sin(angle) * .8 * settle,
      pitch: lerp(pose.pitch, -.25 + index % 3 * .27, settle),
      roll: lerp(pose.roll, (index % 2 ? -1 : 1) * (.4 + index % 3 * .2), settle),
      impact: age < 0 ? 0 : crashed ? clamp(1 - (age - ULTRA_DRONE_FLIGHT_SECONDS) / ULTRA_DRONE_IMPACT_SECONDS)
        : smooth((progress - .92) / .08) };
  });
}

export function getUltraCinematicMiners(requestedElapsed) {
  const elapsed = finiteElapsed(requestedElapsed), start = stageByName['falling-miners'].start;
  return Array.from({ length: 10 }, (_, index) => {
    const age = arrivalAge(elapsed, start, index, ULTRA_MINER_FALL_INTERVAL);
    const fallTime = index < 5 ? clamp(age, 0, ULTRA_MINER_FALL_SECONDS) : 0;
    const fall = fallTime / ULTRA_MINER_FALL_SECONDS, rimX = index < 5 ? (index - 2) * 9 : (index - 7) * 9 + 4.5;
    const slip = index < 5 ? smooth((age + ULTRA_MINER_SLIP_SECONDS) / ULTRA_MINER_SLIP_SECONDS) : 0;
    const holeEntryZ = ULTRA_TOP_HOLE.minZ + .8;
    return { id: index, index, progress: fall, visible: elapsed >= stageByName['rim-miners'].start,
      active: index < 5 && age >= 0 && age < ULTRA_MINER_FALL_SECONDS,
      slipping: index < 5 && age >= -ULTRA_MINER_SLIP_SECONDS && age < 0,
      roofSupported: index >= 5 || age < 0, fallen: index < 5 && fall === 1,
      x: lerp(rimX, ULTRA_CRASH_SPOT.x + (index - 2) * .4, fall),
      y: ULTRA_SURFACE_HEIGHT - .5 * ULTRA_CINEMATIC_GRAVITY * fallTime ** 2,
      z: age < 0 || index >= 5 ? lerp(ULTRA_TOP_HOLE.minZ - 2, holeEntryZ, slip) : lerp(holeEntryZ, ULTRA_CRASH_SPOT.z, fall),
      yaw: 0, pitch: lerp(-.2, -Math.PI / 2, smooth(fall)), roll: Math.sin(fall * Math.PI) * (index % 2 ? -.3 : .3),
      impact: index < 5 && age >= ULTRA_MINER_FALL_SECONDS ? clamp(1 - (age - ULTRA_MINER_FALL_SECONDS) / .5) : 0,
      lookingDown: true, falling: index < 5 && age >= 0 };
  });
}

/** One real-sized machine drives from supported surface rock into the top hole before gravity takes over. */
export function getUltraCinematicMegaDrill(requestedElapsed) {
  const elapsed = finiteElapsed(requestedElapsed), stage = stageByName['mega-drill'], age = elapsed - stage.start;
  const driveProgress = clamp(age / ULTRA_MEGA_DRIVE_SECONDS);
  const tipProgress = clamp((age - ULTRA_MEGA_DRIVE_SECONDS) / ULTRA_MEGA_TIP_SECONDS);
  const fallAge = Math.max(0, age - ULTRA_MEGA_DRIVE_SECONDS - ULTRA_MEGA_TIP_SECONDS);
  const fallTime = Math.min(ULTRA_MEGA_FALL_SECONDS, fallAge), fallProgress = fallTime / ULTRA_MEGA_FALL_SECONDS;
  const crashed = age >= ULTRA_MEGA_DRIVE_SECONDS + ULTRA_MEGA_TIP_SECONDS + ULTRA_MEGA_FALL_SECONDS;
  const pitch = -Math.PI / 2 * smooth(tipProgress), angle = -pitch;
  const y = ULTRA_SURFACE_HEIGHT - .5 * ULTRA_CINEMATIC_GRAVITY * fallTime ** 2;
  const z = tipProgress === 0 ? lerp(-105, -70, driveProgress)
    : tipProgress < 1 ? lerp(-70, -49, smooth(tipProgress))
      : lerp(-49, ULTRA_CRASH_SPOT.z - MEGA_DRILL_LAYOUT.drillAxisY, fallProgress);
  const tip = { x: 0, y: y + MEGA_DRILL_LAYOUT.drillAxisY * Math.cos(angle) - MEGA_DRILL_LAYOUT.tipZ * Math.sin(angle),
    z: z + MEGA_DRILL_LAYOUT.drillAxisY * Math.sin(angle) + MEGA_DRILL_LAYOUT.tipZ * Math.cos(angle) };
  const phase = age < 0 ? 'waiting' : crashed ? 'wreck' : age < ULTRA_MEGA_DRIVE_SECONDS ? 'driving'
    : age < ULTRA_MEGA_DRIVE_SECONDS + ULTRA_MEGA_TIP_SECONDS ? 'tipping' : 'falling';
  return { phase, visible: age >= 0, active: age >= 0 && !crashed, crashed,
    progress: clamp(age / stage.duration), driveProgress, tipProgress, fallProgress,
    roofSupported: phase === 'driving', noseOverHole: tip.x >= ULTRA_TOP_HOLE.minX && tip.x <= ULTRA_TOP_HOLE.maxX
      && tip.z >= ULTRA_TOP_HOLE.minZ && tip.z <= ULTRA_TOP_HOLE.maxZ,
    x: 0, y, z, yaw: 0, pitch, roll: 0, tip,
    impact: crashed ? clamp(1 - (fallAge - ULTRA_MEGA_FALL_SECONDS) / .5) : 0 };
}

function spawnBoss(game, encounter) {
  if (encounter.bossId != null) return;
  const boss = game.createEnemy(MECH_SPIDER_TANK_ULTRA.id, ULTRA_ORIGIN.x, ULTRA_ORIGIN.z);
  game.state.enemies.push(boss); encounter.bossId = boss.id;
  spawnUltraCrew(game, boss);
  if (game.state.survival) {
    game.state.survival.bossesSpawned++;
    game.state.survival.totalSpawned++;
  }
  game.emit('ultrabattle', boss, { id: boss.id, enemyType: boss.type });
}

export function beginUltraEncounter(game, { practice = false } = {}) {
  if (game.state.arenaId !== 'drill-mine') throw new RangeError('Mech Spider Tank Ultra belongs to the Drill Mine.');
  const elapsed = practice ? ULTRA_CINEMATIC_DURATION : 0;
  const encounter = { elapsed, practice, bossId: null, crashSpot: { ...ULTRA_CRASH_SPOT },
    ...getUltraEncounterPose(elapsed) };
  game.state.ultraEncounter = encounter;
  game.state.enemies = []; game.state.projectiles = []; game.state.hazards = [];
  Object.assign(game.state.player, { groundActorId: null, groundHeight: 0, elevation: 0, jumpVelocity: 0 });
  game.state.player.x = clamp(game.state.player.x, -35, 35);
  game.state.player.z = clamp(game.state.player.z, -29, 29);
  game.emit('ultraencounter', game.state.player, { stage: encounter.stage, practice });
  if (practice) spawnBoss(game, encounter);
  return encounter;
}

export function advanceUltraEncounter(game, dt) {
  const encounter = game.state.ultraEncounter;
  if (!encounter || encounter.complete || game.state.mode !== 'playing') return;
  const previous = encounter.stageIndex;
  encounter.elapsed = Math.min(ULTRA_CINEMATIC_DURATION, encounter.elapsed + Math.max(0, dt));
  Object.assign(encounter, getUltraEncounterPose(encounter.elapsed));
  if (encounter.stageIndex !== previous) game.emit('ultrastage', game.state.player, { stage: encounter.stage });
  if (encounter.complete) spawnBoss(game, encounter);
}
