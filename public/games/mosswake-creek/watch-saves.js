import { CreekWatch, WATCH_BOUNDS, WATCH_CAMP_HINT, WATCH_DAY, WATCH_ENEMY_NAME, WATCH_HEALTH, WATCH_MARKET_ITEMS, WATCH_NIGHT, WATCH_PIGEONS, WATCH_SIGNAL, WATCH_SPRAYER_BURSTS, WATCH_SPRAYER_HEALTH, WATCH_SPRAY_FLIGHT, WATCH_SPRAY_REACH, WATCH_SPRAY_SPLASH, WATCH_TOWER_CHAIRS, WATCH_TOWER_ROOM, WATCH_TOWER_ROOM_LAYOUT, hasWatchSprayer } from './watch.js';
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
const validWatchWall = ({ tier, health }) => [0, 1, 2].includes(tier)
  && validWatchCount(health) && health <= (tier === 2 ? 11 : tier === 1 ? 6 : 0);

function validWatchState(state) {
  if (!state) return false;
  const { status, phase, day, tick, phaseTick, coins, signal, player, posts, raiders,
    shots, loot, huntedPigeons = 0, queue, message, sprayer = null, forwardWalls, gear = [], weapon = null,
    swingAt = -TICKS_PER_SECOND, recallingGuards = false, towerUpgraded = false,
    insideTower = false, seatedChair = null, towerRoomLayout = 1,
    interiorX = towerRoomLayout === 1 ? LEGACY_TOWER_ROOM.door : WATCH_TOWER_ROOM.door } = state;
  const room = towerRoomLayout === 1 ? LEGACY_TOWER_ROOM : WATCH_TOWER_ROOM;
  const chair = WATCH_TOWER_CHAIRS.find((seat) => seat.id === seatedChair);
  if (!['ready', 'running', 'lost'].includes(status) || (phase !== 'day' && phase !== 'night')
      || !validWatchCount(day) || day === 0 || !validWatchCount(tick) || !validWatchCount(phaseTick)
      || phaseTick > (phase === 'day' ? WATCH_DAY : WATCH_NIGHT) || phaseTick > tick
      || !validWatchCount(coins) || !validWatchCount(signal) || signal > WATCH_HEALTH
      || (status === 'lost' ? signal !== 0 : signal === 0) || typeof message !== 'string' || message.length > 500
      || !validWatchCount(huntedPigeons) || huntedPigeons >= 2 ** WATCH_PIGEONS.length
      || !validWatchFlag(recallingGuards) || (recallingGuards && phase !== 'day')
      || !validWatchFlag(towerUpgraded) || !validWatchFlag(insideTower)
      || (towerRoomLayout !== 1 && towerRoomLayout !== WATCH_TOWER_ROOM_LAYOUT)
      || !Number.isFinite(interiorX) || interiorX < room.left || interiorX > room.right
      || (insideTower && (!towerUpgraded || status !== 'running' || phase !== 'day' || player?.x !== WATCH_SIGNAL))
      || (seatedChair !== null && (!chair || !insideTower || towerRoomLayout !== WATCH_TOWER_ROOM_LAYOUT
        || interiorX !== chair.x || player?.direction !== chair.direction))) return false;

  return (sprayer === null || (phase === 'night' && hasWatchSprayer(day) && validSprayer(sprayer, tick)))
    && player && validWatchX(player.x) && validWatchSide(player.direction) && validWatchCount(player.step)
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
    && validWatchList(raiders, 64, ({ side, x, stride, hp, attackAt, struckAt }) =>
      validWatchSide(side) && validWatchX(x) && validWatchCount(stride)
      && validWatchCount(hp) && hp >= 1 && hp <= 5 && validWatchCount(attackAt) && validWatchStamp(struckAt))
    && validWatchList(shots, Infinity, ({ from, to, end, kind }) => validWatchX(from) && validWatchX(to) && validWatchCount(end)
      && (kind === undefined || kind === 'pigeon' || kind === 'raid'))
    && validWatchList(loot, Infinity, ({ x, amount, forPlayer = false }) =>
      validWatchX(x) && validWatchCount(amount) && amount > 0 && validWatchFlag(forPlayer))
    && loot.filter((piece) => !piece.forPlayer).length <= 128
    && validWatchList(queue, 64, ({ side, due }) => validWatchSide(side) && validWatchCount(due) && due <= WATCH_NIGHT)
    && queue.every(({ due }, index) => index === 0 || queue[index - 1].due <= due);
}

function validSprayer(sprayer, tick) {
  const { side, x, hp, attackAt, sprayAt, burstsLeft, spray } = sprayer;
  if (side !== -1 || !validWatchX(x) || !validWatchCount(hp) || hp > WATCH_SPRAYER_HEALTH
      || !validWatchCount(attackAt) || !validWatchCount(sprayAt)
      || !validWatchCount(burstsLeft) || burstsLeft > WATCH_SPRAYER_BURSTS) return false;
  return spray === null || (spray && validWatchX(spray.from) && Number.isFinite(spray.reach)
    && spray.reach >= 0 && spray.reach <= WATCH_SPRAY_REACH && validWatchX(spray.from + spray.reach)
    && validWatchCount(spray.at) && spray.at <= tick && tick - spray.at < WATCH_SPRAY_FLIGHT + WATCH_SPRAY_SPLASH);
}

function captureWatchState(watch) {
  const { status, phase, day, tick, phaseTick, coins, signal, player, posts, raiders,
    shots, loot, huntedPigeons = 0, queue, message, sprayer = null, forwardWalls, gear = [], weapon = null,
    swingAt = -TICKS_PER_SECOND, recallingGuards = false, towerUpgraded = false,
    insideTower = false, seatedChair = null, towerRoomLayout = WATCH_TOWER_ROOM_LAYOUT, interiorX = WATCH_TOWER_ROOM.door } = watch;
  return { status, phase, day, tick, phaseTick, coins, signal, player, raiders, shots, loot, huntedPigeons, queue, message, sprayer,
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
