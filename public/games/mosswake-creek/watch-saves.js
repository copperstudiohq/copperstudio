import { CreekWatch, WATCH_AIM_SEED, WATCH_ARROW_LIFETIME, WATCH_ARROW_STICK_TICKS, WATCH_BOUNDS, WATCH_BUILDER_REPAIR_IDS, WATCH_BUILDER_REPAIR_TICKS, WATCH_BUILDER_UPGRADE_TICKS, WATCH_CAMP_HINT, WATCH_DAY, WATCH_ENEMY_NAME, WATCH_FIRST_FLYER_NIGHT, WATCH_FLYER_ALTITUDE, WATCH_FLYER_HEALTH, WATCH_FLYERS_PER_SIDE, WATCH_HEALTH, WATCH_MARKET_ITEMS, WATCH_NIGHT, WATCH_PIGEONS, WATCH_SIGNAL, WATCH_SPRAYER_BURSTS, WATCH_SPRAYER_HEALTH, WATCH_SPRAY_FLIGHT, WATCH_SPRAY_REACH, WATCH_SPRAY_SPLASH, WATCH_TOWER_CHAIRS, WATCH_TOWER_ROOM, WATCH_TOWER_ROOM_LAYOUT, WATCH_WALL_TOWER_HEALTH, hasWatchSprayer } from './watch.js';
import { TICKS_PER_SECOND } from './simulation.js';

const WATCH_SAVE_PREFIX = 'mosswake.creek-watch.slot.';
const WATCH_SAVE_VERSION = 1;
const LEGACY_TOWER_ROOM = { left: 34, right: 350, door: 54 };
export const WATCH_SAVE_NAME_LIMIT = 40;

function readWatchRecord(storage, id) {
  const text = storage.getItem(WATCH_SAVE_PREFIX + id);
  if (text === null) throw new Error('This save slot is no longer available.');
  let record;
  try {
    record = JSON.parse(text);
  } catch {
    throw new Error('This save slot contains damaged game data.');
  }
  if (record?.version !== WATCH_SAVE_VERSION) throw new Error('This save uses an unsupported format.');
  if (!validWatchSaveName(record.name) || !validWatchCount(record.savedAt) || !validWatchState(record.state)) {
    throw new Error('This save slot contains damaged game data.');
  }
  if (record.state.towerRoomLayout === undefined || record.state.towerRoomLayout === 1) {
    // Preserve the old doorway and each side's relative position in the smaller room.
    const x = record.state.interiorX === undefined ? LEGACY_TOWER_ROOM.door : record.state.interiorX;
    const oldEdge = x <= LEGACY_TOWER_ROOM.door ? LEGACY_TOWER_ROOM.left : LEGACY_TOWER_ROOM.right;
    const newEdge = x <= LEGACY_TOWER_ROOM.door ? WATCH_TOWER_ROOM.left : WATCH_TOWER_ROOM.right;
    const interiorX = WATCH_TOWER_ROOM.door + (x - LEGACY_TOWER_ROOM.door)
      * (newEdge - WATCH_TOWER_ROOM.door) / (oldEdge - LEGACY_TOWER_ROOM.door);
    record.state = { ...record.state, interiorX, towerRoomLayout: WATCH_TOWER_ROOM_LAYOUT };
    if (!validWatchState(record.state)) throw new Error('This save slot contains damaged game data.');
  }
  return record;
}

function validWatchSaveName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= WATCH_SAVE_NAME_LIMIT;
}

const validWatchCount = (value) => Number.isSafeInteger(value) && value >= 0;
const validWatchStamp = (value) => Number.isSafeInteger(value) && value >= -TICKS_PER_SECOND;
const validWatchSide = (value) => value === -1 || value === 1;
const validWatchX = (value) => Number.isFinite(value) && value >= WATCH_BOUNDS.left && value <= WATCH_BOUNDS.right;
const validWatchFlag = (value) => typeof value === 'boolean';
const optionalWatchField = (value, isValid) => value === undefined || isValid(value);
const validWatchList = (items, limit, isValid) => Array.isArray(items) && items.length <= limit
  && items.every((item) => item && isValid(item));
const watchWallCapacity = (tier) => tier === 3 ? WATCH_WALL_TOWER_HEALTH : tier === 2 ? 11 : tier === 1 ? 6 : 0;
const validWatchWall = ({ tier, health }) => [0, 1, 2, 3].includes(tier)
  && validWatchCount(health) && health <= watchWallCapacity(tier);
const watchSprayers = (state) => state.sprayers === undefined
  ? state.sprayer == null ? [] : [state.sprayer] : state.sprayers;
const validFlyerAltitude = (value) => Number.isFinite(value) && value >= 0 && value <= WATCH_FLYER_ALTITUDE;
const LEGACY_SHOT_FIELDS = new Set(['from', 'to', 'end', 'kind', 'altitude', 'missed']);
const BALLISTIC_SHOT_FIELDS = new Set([...LEGACY_SHOT_FIELDS, 'ballistic', 'x', 'y', 'vx', 'vy', 'damage', 'stuck']);
const BUILDER_FIELDS = new Set(['side', 'x', 'direction', 'stride', 'walking', 'returning', 'working', 'workAt']);

function validWatchBuilder(builder, tick, phase, order) {
  const { side, x, direction, stride, walking, returning, working, workAt } = builder;
  return Object.keys(builder).length === BUILDER_FIELDS.size
    && Object.keys(builder).every((key) => BUILDER_FIELDS.has(key))
    && validWatchSide(side) && validWatchX(x) && validWatchSide(direction) && validWatchCount(stride)
    && validWatchFlag(walking) && validWatchFlag(returning) && validWatchFlag(working)
    && validWatchCount(workAt) && workAt <= tick + (order === 'upgrade' ? WATCH_BUILDER_UPGRADE_TICKS : WATCH_BUILDER_REPAIR_TICKS)
    && (!working || phase === 'day' && !walking && !returning);
}

function validBuilderRepairCredit(id, posts, forwardWalls, signal) {
  if (!WATCH_BUILDER_REPAIR_IDS.includes(id)) return false;
  if (id === 'signal') return signal < WATCH_HEALTH;
  const wall = { 'west-wall': posts?.[0], 'east-wall': posts?.[1],
    'west-forward': forwardWalls?.[0], 'east-forward': forwardWalls?.[1] }[id];
  return wall && validWatchWall(wall) && wall.tier > 0 && wall.health < watchWallCapacity(wall.tier);
}

function validWatchShot(shot, tick) {
  const { from, to, end, kind, altitude, missed, ballistic, x, y, vx, vy, damage, stuck } = shot;
  if (!validWatchX(from) || !validWatchX(to) || !validWatchCount(end)
      || ![undefined, 'pigeon', 'raid'].includes(kind)
      || !(altitude === undefined || kind === 'raid' && validFlyerAltitude(altitude))
      || !optionalWatchField(missed, validWatchFlag)) return false;
  // Old arrows already dealt their damage before the slot was written. They
  // retain their brief visual lifetime without becoming new physical attacks.
  if (ballistic === undefined) return end <= tick + 9
    && Object.keys(shot).every((key) => LEGACY_SHOT_FIELDS.has(key));
  return ballistic === true && (kind === 'raid' || kind === 'pigeon')
    && Object.keys(shot).every((key) => BALLISTIC_SHOT_FIELDS.has(key))
    && validWatchX(x) && Number.isFinite(y) && y >= -256 && y <= 256
    && Number.isFinite(vx) && Math.abs(vx) <= 16 && Number.isFinite(vy) && Math.abs(vy) <= 64
    && [1, 2].includes(damage) && validWatchFlag(stuck)
    && end > tick && end <= tick + (stuck ? WATCH_ARROW_STICK_TICKS : WATCH_ARROW_LIFETIME);
}

function validWatchState(state) {
  if (!state) return false;
  const { status, phase, day, tick, phaseTick, coins, signal, player, posts, raiders, aimSeed = WATCH_AIM_SEED,
    shots, loot, huntedPigeons = 0, queue, message, flyers = [], flyerQueue = [], forwardWalls, builders = [], gear = [], weapon = null,
    swingAt = -TICKS_PER_SECOND, recallingGuards = false, builderOrder = 'idle', builderPaidRepairs = [], towerUpgraded = false,
    insideTower = false, seatedChair = null, towerRoomLayout = 1,
    interiorX = towerRoomLayout === 1 ? LEGACY_TOWER_ROOM.door : WATCH_TOWER_ROOM.door } = state;
  const room = towerRoomLayout === 1 ? LEGACY_TOWER_ROOM : WATCH_TOWER_ROOM;
  const chair = WATCH_TOWER_CHAIRS.find((seat) => seat.id === seatedChair);
  const sprayers = watchSprayers(state);
  if (!['ready', 'running', 'lost'].includes(status) || (phase !== 'day' && phase !== 'night')
      || !validWatchCount(day) || day === 0 || !validWatchCount(tick) || !validWatchCount(phaseTick)
      || phaseTick > (phase === 'day' ? WATCH_DAY : WATCH_NIGHT) || phaseTick > tick
      || !validWatchCount(coins) || !validWatchCount(signal) || signal > WATCH_HEALTH
      || !Number.isInteger(aimSeed) || aimSeed < 0 || aimSeed > 0xffffffff
      || (status === 'lost' ? signal !== 0 : signal === 0) || typeof message !== 'string' || message.length > 500
      || !validWatchCount(huntedPigeons) || huntedPigeons >= 2 ** WATCH_PIGEONS.length
      || !validWatchFlag(recallingGuards) || (recallingGuards && phase !== 'day')
      || !['idle', 'repair', 'upgrade'].includes(builderOrder)
      || !validWatchList(builderPaidRepairs, WATCH_BUILDER_REPAIR_IDS.length,
        (id) => validBuilderRepairCredit(id, posts, forwardWalls, signal))
      || new Set(builderPaidRepairs).size !== builderPaidRepairs.length
      || !validWatchFlag(towerUpgraded) || !validWatchFlag(insideTower)
      || (towerRoomLayout !== 1 && towerRoomLayout !== WATCH_TOWER_ROOM_LAYOUT)
      || !Number.isFinite(interiorX) || interiorX < room.left || interiorX > room.right
      || (insideTower && (!towerUpgraded || status !== 'running' || phase !== 'day' || player?.x !== WATCH_SIGNAL))
      || (seatedChair !== null && (!chair || !insideTower || towerRoomLayout !== WATCH_TOWER_ROOM_LAYOUT
        || interiorX !== chair.x || player?.direction !== chair.direction))) return false;

  return !(state.sprayers !== undefined && Object.hasOwn(state, 'sprayer'))
    && validWatchList(sprayers, 2, (sprayer) => phase === 'night' && hasWatchSprayer(day) && validSprayer(sprayer, tick))
    && new Set(sprayers.map(({ side }) => side)).size === sprayers.length
    && validWatchList(flyers, WATCH_FLYERS_PER_SIDE * 2, (flyer) =>
      phase === 'night' && day >= WATCH_FIRST_FLYER_NIGHT && validFlyer(flyer, tick))
    && validWatchList(flyerQueue, WATCH_FLYERS_PER_SIDE * 2, ({ side, due }) =>
      phase === 'night' && day >= WATCH_FIRST_FLYER_NIGHT && validWatchSide(side)
      && validWatchCount(due) && due <= WATCH_NIGHT)
    && flyerQueue.every(({ due }, index) => index === 0 || flyerQueue[index - 1].due <= due)
    && [-1, 1].every((side) => flyers.filter((flyer) => flyer.side === side).length
      + flyerQueue.filter((entry) => entry.side === side).length <= WATCH_FLYERS_PER_SIDE)
    && player && validWatchX(player.x) && validWatchSide(player.direction) && validWatchCount(player.step)
    && validWatchList(builders, Infinity, (builder) => validWatchBuilder(builder, tick, phase, builderOrder))
    && optionalWatchField(forwardWalls, (walls) => validWatchList(walls, 2, validWatchWall) && walls.length === 2)
    && validWatchList(gear, Object.keys(WATCH_MARKET_ITEMS).length,
      (id) => typeof id === 'string' && Object.hasOwn(WATCH_MARKET_ITEMS, id)) && new Set(gear).size === gear.length
    && (weapon === null || (gear.includes(weapon) && WATCH_MARKET_ITEMS[weapon].damage > 0))
    && validWatchStamp(swingAt) && swingAt <= tick
    && validWatchList(posts, 2, (post) => validWatchWall(post)
      && validWatchList(post.guards, Infinity, ({ rank, direction, fireAt, shotAt, x, stride, returning, walking, carriedCoins = 0 }) =>
        [0, 1].includes(rank) && validWatchSide(direction) && validWatchCount(fireAt) && validWatchStamp(shotAt)
        && optionalWatchField(x, validWatchX) && optionalWatchField(stride, validWatchCount)
        && optionalWatchField(returning, validWatchFlag) && optionalWatchField(walking, validWatchFlag)
        && validWatchCount(carriedCoins)
        && (!walking || validWatchCount(stride))))
    && posts.length === 2
    && validWatchList(raiders, 128, ({ side, x, stride, hp, attackAt, struckAt, kind, rank }) =>
      validWatchSide(side) && validWatchX(x) && validWatchCount(stride)
      && validWatchCount(hp) && hp >= 1 && hp <= 5 && validWatchCount(attackAt) && validWatchStamp(struckAt)
      && (kind === undefined ? rank === undefined : kind === 'infected' && [0, 1].includes(rank)
        && phase === 'night' && day >= WATCH_FIRST_FLYER_NIGHT && struckAt <= tick))
    && validWatchList(shots, Infinity, (shot) => validWatchShot(shot, tick))
    && validWatchList(loot, Infinity, ({ x, amount, forPlayer = false }) =>
      validWatchX(x) && validWatchCount(amount) && amount > 0 && validWatchFlag(forPlayer))
    && loot.filter((piece) => !piece.forPlayer).length <= 128
    && validWatchList(queue, 64, ({ side, due }) => validWatchSide(side) && validWatchCount(due) && due <= WATCH_NIGHT)
    && queue.every(({ due }, index) => index === 0 || queue[index - 1].due <= due);
}

function validSprayer(sprayer, tick) {
  const { side, x, hp, attackAt, sprayAt, burstsLeft, spray } = sprayer;
  if (!validWatchSide(side) || !validWatchX(x) || !validWatchCount(hp) || hp > WATCH_SPRAYER_HEALTH
      || !validWatchCount(attackAt) || !validWatchCount(sprayAt)
      || !validWatchCount(burstsLeft) || burstsLeft > WATCH_SPRAYER_BURSTS) return false;
  return spray === null || (spray && validWatchX(spray.from) && Number.isFinite(spray.reach)
    && spray.reach >= 0 && spray.reach <= WATCH_SPRAY_REACH && validWatchX(spray.from - side * spray.reach)
    && validWatchCount(spray.at) && spray.at <= tick && tick - spray.at < WATCH_SPRAY_FLIGHT + WATCH_SPRAY_SPLASH);
}

function validFlyer(flyer, tick) {
  const { side, x, hp, mode, altitude, stride, direction, modeAt, attackAt, struckAt } = flyer;
  return validWatchSide(side) && validWatchX(x) && validWatchCount(hp) && hp >= 1 && hp <= WATCH_FLYER_HEALTH
    && ['crawl', 'fly', 'dive'].includes(mode) && validFlyerAltitude(altitude)
    && (mode === 'crawl' ? altitude === 0 : altitude > 0)
    && validWatchCount(stride) && validWatchSide(direction)
    && validWatchCount(modeAt) && modeAt <= tick + 3 * TICKS_PER_SECOND
    && validWatchCount(attackAt) && attackAt <= tick + 44
    && validWatchStamp(struckAt) && struckAt <= tick;
}

function captureWatchState(watch) {
  const { status, phase, day, tick, phaseTick, coins, signal, player, posts, raiders, aimSeed = WATCH_AIM_SEED,
    shots, loot, huntedPigeons = 0, queue, message, flyers = [], flyerQueue = [], forwardWalls, builders = [], gear = [], weapon = null,
    swingAt = -TICKS_PER_SECOND, recallingGuards = false, builderOrder = 'idle', builderPaidRepairs = [], towerUpgraded = false,
    insideTower = false, seatedChair = null, towerRoomLayout = WATCH_TOWER_ROOM_LAYOUT, interiorX = WATCH_TOWER_ROOM.door } = watch;
  return { status, phase, day, tick, phaseTick, coins, signal, player, raiders, shots, loot, huntedPigeons, queue, message, aimSeed,
    sprayers: watchSprayers(watch), flyers, flyerQueue, builders, builderOrder, builderPaidRepairs,
    gear, weapon, swingAt, recallingGuards, towerUpgraded, insideTower, seatedChair, towerRoomLayout, interiorX,
    forwardWalls: forwardWalls?.map(({ tier, health }) => ({ tier, health })),
    posts: posts.map(({ tier, health, guards }) => ({ tier, health, guards })) };
}

export function listWatchSlots(storage) {
  const slots = [];
  let unreadable = 0;
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(WATCH_SAVE_PREFIX)) continue;
    const id = key.slice(WATCH_SAVE_PREFIX.length);
    try {
      const { name, savedAt, state } = readWatchRecord(storage, id);
      const { day, phase, coins, status } = state;
      slots.push({ id, name, savedAt, day, phase, coins, status });
    } catch {
      unreadable++;
    }
  }
  return { slots: slots.sort((a, b) => b.savedAt - a.savedAt), unreadable };
}

export function saveWatchSlot(storage, watch, name, id) {
  const title = name.trim();
  if (!validWatchSaveName(title)) throw new Error(`Enter a slot name up to ${WATCH_SAVE_NAME_LIMIT} characters.`);
  const state = captureWatchState(watch);
  if (state.towerRoomLayout !== WATCH_TOWER_ROOM_LAYOUT || !validWatchState(state)) {
    throw new Error('The current watch cannot be saved.');
  }
  if (id && storage.getItem(WATCH_SAVE_PREFIX + id) === null) throw new Error('This save slot is no longer available.');
  const savedId = id ?? crypto.randomUUID();
  storage.setItem(WATCH_SAVE_PREFIX + savedId, JSON.stringify({ version: WATCH_SAVE_VERSION, name: title, savedAt: Date.now(), state }));
  return savedId;
}

export function loadWatchSlot(storage, id) {
  const { state } = readWatchRecord(storage, id);
  const watch = new CreekWatch();
  const { posts, forwardWalls, ...progress } = captureWatchState(state);
  progress.message = progress.message.replace(/\b(?:Ichor Wisps|Wisps|Tri Raiders)\b/gi, WATCH_ENEMY_NAME);
  if (progress.message === 'The tent marker leads to the camp beside the lake bridge. Guards alternate west and east.') {
    progress.message = WATCH_CAMP_HINT;
  }
  const restoredPosts = watch.posts.map((post, index) => ({ ...post, ...posts[index] }));
  const restoredWalls = watch.forwardWalls.map((wall, index) => ({ ...wall, ...forwardWalls?.[index] }));
  return Object.assign(watch, progress, { posts: restoredPosts, forwardWalls: restoredWalls });
}
