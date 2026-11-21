import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_BUILDER_REPAIR_IDS, WATCH_BUILDER_REPAIR_TICKS, WATCH_HEALTH } from '../public/games/mosswake-creek/watch.js';
import { listWatchSlots, loadWatchSlot, saveWatchSlot } from '../public/games/mosswake-creek/watch-saves.js';

function memoryStorage() {
  const entries = new Map();
  return {
    get length() { return entries.size; },
    key: (index) => [...entries.keys()][index] ?? null,
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value)
  };
}

function workingWatch() {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  watch.coins = 9;
  Object.assign(watch.posts[0], { tier: 2, health: 8 });
  watch.builders = [{ side: -1, x: watch.posts[0].wallX, direction: 1, stride: 0,
    walking: false, returning: false, working: false, workAt: 0 }];
  watch.builderOrder = 'repair';
  return watch;
}

function paidPartialWatch() {
  const watch = workingWatch();
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS * 3 && watch.posts[0].health === 8; tick++) watch.step();
  assert.equal(watch.posts[0].health, 9);
  assert.equal(watch.coins, 7);
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  return watch;
}

function roundTrip(watch) {
  const storage = memoryStorage();
  const id = saveWatchSlot(storage, watch, 'Repair order');
  const loaded = loadWatchSlot(storage, id);
  assert.deepEqual(loaded, watch);
  assert.equal(JSON.parse(storage.getItem(storage.key(0))).version, 1);
  return { loaded, storage, id };
}

function stepTogether(watch, loaded, count) {
  for (let tick = 0; tick < count; tick++) {
    watch.step();
    loaded.step();
    assert.deepEqual(loaded, watch, `Paid repair continuation ${tick}`);
  }
}

test('a saved partially paid repair resumes with the same order and completes without a second charge', () => {
  const watch = paidPartialWatch();
  const { loaded } = roundTrip(watch);
  assert.equal(loaded.builderOrder, 'repair');
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS * 3);
  assert.equal(loaded.posts[0].health, 11);
  assert.equal(loaded.coins, 7);
  assert.deepEqual(loaded.builderPaidRepairs, []);
  roundTrip(loaded);
});

test('stopping, saving and restarting a repair preserves its unused payment', () => {
  const watch = paidPartialWatch();
  assert.ok(watch.setBuilderOrder('idle'));
  const { loaded } = roundTrip(watch);
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS * 2);
  assert.equal(loaded.posts[0].health, 9);
  assert.equal(loaded.coins, 7);
  assert.deepEqual(loaded.builderPaidRepairs, ['west-wall']);
  assert.ok(watch.setBuilderOrder('repair'));
  assert.ok(loaded.setBuilderOrder('repair'));
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS * 3);
  assert.equal(loaded.posts[0].health, 11);
  assert.equal(loaded.coins, 7);
  assert.deepEqual(loaded.builderPaidRepairs, []);
});

test('paid work survives a saved recall, night and dawn before continuing without another fee', () => {
  const watch = paidPartialWatch();
  assert.equal(watch.startNight(), false);
  for (let tick = 0; tick < 100 && watch.phase === 'day'; tick++) watch.step();
  assert.equal(watch.phase, 'night');
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  const { loaded } = roundTrip(watch);
  watch.finishNight();
  loaded.finishNight();
  assert.equal(loaded.phase, 'day');
  assert.equal(loaded.builderOrder, 'repair');
  assert.deepEqual(loaded.builderPaidRepairs, ['west-wall']);
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS * 3);
  assert.equal(loaded.posts[0].health, 11);
  assert.equal(loaded.coins, 10, 'Dawn adds three copper and the paid repair charges nothing more');
  assert.deepEqual(loaded.builderPaidRepairs, []);
});

test('legacy builders with no order or payment fields load idle and cannot begin new automatic charges', () => {
  const watch = paidPartialWatch();
  const { storage, id } = roundTrip(watch);
  const key = storage.key(0);
  const record = JSON.parse(storage.getItem(key));
  assert.equal(record.state.builders[0].working, true);
  delete record.state.builderOrder;
  delete record.state.builderPaidRepairs;
  const legacy = JSON.stringify(record);
  storage.setItem(key, legacy);
  const loaded = loadWatchSlot(storage, id);
  assert.equal(loaded.builderOrder, 'idle');
  assert.deepEqual(loaded.builderPaidRepairs, []);
  assert.equal(storage.getItem(key), legacy, 'Reading must not rewrite the legacy slot');
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS * 2; tick++) loaded.step();
  assert.equal(loaded.coins, 7);
  assert.equal(loaded.posts[0].health, 9);
  assert.equal(loaded.builders[0].working, false);
  roundTrip(loaded);
});

test('all five unfinished repair credits remain valid while stopped, at night and after a destroyed wall', () => {
  const watch = new CreekWatch();
  watch.start();
  for (const wall of [...watch.posts, ...watch.forwardWalls]) Object.assign(wall, { tier: 3, health: 0 });
  watch.signal = WATCH_HEALTH - 1;
  watch.builderPaidRepairs = [...WATCH_BUILDER_REPAIR_IDS];
  assert.equal(watch.builderOrder, 'idle');
  roundTrip(watch);
  assert.ok(watch.startNight());
  const { loaded } = roundTrip(watch);
  assert.deepEqual(loaded.builderPaidRepairs, WATCH_BUILDER_REPAIR_IDS);
});

test('orders and credits reject unknown values, duplicates, invalid shapes and already-completed repairs', () => {
  const changes = [
    (state) => { state.builderOrder = 'build'; },
    (state) => { state.builderOrder = null; },
    (state) => { state.builderOrder = 1; },
    (state) => { state.builderPaidRepairs = null; },
    (state) => { state.builderPaidRepairs = {}; },
    (state) => { state.builderPaidRepairs = 'west-wall'; },
    (state) => { state.builderPaidRepairs = ['unknown-wall']; },
    (state) => { state.builderPaidRepairs = [null]; },
    (state) => { state.builderPaidRepairs = [1]; },
    (state) => { state.builderPaidRepairs = ['west-wall', 'west-wall']; },
    (state) => { state.builderPaidRepairs = Array(6).fill('west-wall'); },
    (state) => { state.posts[0].health = 11; },
    (state) => { Object.assign(state.posts[0], { tier: 0, health: 0 }); },
    (state) => { state.builderPaidRepairs = ['west-forward']; },
    (state) => { delete state.forwardWalls; state.builderPaidRepairs = ['west-forward']; },
    (state) => { state.builderPaidRepairs = ['signal']; }
  ];
  for (const change of changes) {
    const { storage, id } = roundTrip(paidPartialWatch());
    const key = storage.key(0);
    const record = JSON.parse(storage.getItem(key));
    change(record.state);
    storage.setItem(key, JSON.stringify(record));
    assert.throws(() => loadWatchSlot(storage, id), /damaged game data/);
    assert.equal(listWatchSlots(storage).unreadable, 1);
  }
});
