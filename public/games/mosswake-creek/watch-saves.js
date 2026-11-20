import { CreekWatch, WATCH_BOUNDS, WATCH_DAY, WATCH_HEALTH, WATCH_NIGHT } from './watch.js';
import { TICKS_PER_SECOND } from './simulation.js';

const WATCH_SAVE_PREFIX = 'mosswake.creek-watch.slot.';
const WATCH_SAVE_VERSION = 1;
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
  return record;
}

function validWatchSaveName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= WATCH_SAVE_NAME_LIMIT;
}

const validWatchCount = (value) => Number.isSafeInteger(value) && value >= 0;
const validWatchStamp = (value) => Number.isSafeInteger(value) && value >= -TICKS_PER_SECOND;
const validWatchSide = (value) => value === -1 || value === 1;
const validWatchX = (value) => Number.isFinite(value) && value >= WATCH_BOUNDS.left && value <= WATCH_BOUNDS.right;
const validWatchList = (items, limit, isValid) => Array.isArray(items) && items.length <= limit
  && items.every((item) => item && isValid(item));

function validWatchState(state) {
  if (!state) return false;
  const { status, phase, day, tick, phaseTick, coins, signal, player, posts, raiders, shots, loot, queue, message } = state;
  if (!['ready', 'running', 'lost'].includes(status) || (phase !== 'day' && phase !== 'night')
      || !validWatchCount(day) || day === 0 || !validWatchCount(tick) || !validWatchCount(phaseTick)
      || phaseTick > (phase === 'day' ? WATCH_DAY : WATCH_NIGHT) || phaseTick > tick
      || !validWatchCount(coins) || !validWatchCount(signal) || signal > WATCH_HEALTH
      || (status === 'lost' ? signal !== 0 : signal === 0) || typeof message !== 'string' || message.length > 500) return false;

  return player && validWatchX(player.x) && validWatchSide(player.direction) && validWatchCount(player.step)
    && validWatchList(posts, 2, ({ tier, health, guards }) =>
      [0, 1, 2].includes(tier) && validWatchCount(health) && health <= (tier === 2 ? 11 : tier === 1 ? 6 : 0)
      && validWatchList(guards, 3, ({ rank, direction, fireAt, shotAt }) =>
        [0, 1].includes(rank) && validWatchSide(direction) && validWatchCount(fireAt) && validWatchStamp(shotAt)))
    && posts.length === 2
    && validWatchList(raiders, 64, ({ side, x, stride, hp, attackAt, struckAt }) =>
      validWatchSide(side) && validWatchX(x) && validWatchCount(stride)
      && validWatchCount(hp) && hp >= 1 && hp <= 5 && validWatchCount(attackAt) && validWatchStamp(struckAt))
    && validWatchList(shots, 64, ({ from, to, end }) => validWatchX(from) && validWatchX(to) && validWatchCount(end))
    && validWatchList(loot, 128, ({ x, amount }) => validWatchX(x) && validWatchCount(amount) && amount > 0)
    && validWatchList(queue, 64, ({ side, due }) => validWatchSide(side) && validWatchCount(due) && due <= WATCH_NIGHT)
    && queue.every(({ due }, index) => index === 0 || queue[index - 1].due <= due);
}

function captureWatchState(watch) {
  const { status, phase, day, tick, phaseTick, coins, signal, player, posts, raiders, shots, loot, queue, message } = watch;
  return { status, phase, day, tick, phaseTick, coins, signal, player, raiders, shots, loot, queue, message,
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
  if (!validWatchState(state)) throw new Error('The current watch cannot be saved.');
  if (id && storage.getItem(WATCH_SAVE_PREFIX + id) === null) throw new Error('This save slot is no longer available.');
  const savedId = id ?? crypto.randomUUID();
  storage.setItem(WATCH_SAVE_PREFIX + savedId, JSON.stringify({ version: WATCH_SAVE_VERSION, name: title, savedAt: Date.now(), state }));
  return savedId;
}

export function loadWatchSlot(storage, id) {
  const { state } = readWatchRecord(storage, id);
  const watch = new CreekWatch();
  const { posts, ...progress } = captureWatchState(state);
  const restoredPosts = watch.posts.map((post, index) => ({ ...post, ...posts[index] }));
  return Object.assign(watch, progress, { posts: restoredPosts });
}
