import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_BUILDER_REPAIR_TICKS, WATCH_BUILDER_UPGRADE_TICKS,
  WATCH_WALL_TOWER_HEALTH } from '../public/games/mosswake-creek/watch.js';
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

function midUpgrade(tier = 2, coins = 200) {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  watch.coins = coins;
  const wall = watch.posts[0];
  Object.assign(wall, { tier, health: tier === 1 ? 6 : 11 });
  watch.builders = [{ side: -1, x: wall.wallX + 20, direction: -1, stride: 0,
    walking: false, returning: false, working: false, workAt: 0 }];
  assert.ok(watch.setBuilderOrder('upgrade'));
  for (let tick = 0; tick < 21; tick++) watch.step();
  assert.equal(watch.posts[0].tier, tier);
  assert.equal(watch.coins, coins, 'Travel and unfinished upgrades must not spend copper');
  assert.equal(watch.builders[0].working, true);
  assert.ok(watch.builders[0].workAt - watch.tick > WATCH_BUILDER_REPAIR_TICKS);
  return watch;
}

function roundTrip(watch) {
  const storage = memoryStorage();
  const id = saveWatchSlot(storage, watch, 'Builders upgrading');
  const loaded = loadWatchSlot(storage, id);
  assert.deepEqual(loaded, watch);
  assert.equal(JSON.parse(storage.getItem(storage.key(0))).version, 1);
  return { loaded, storage, id };
}

function stepTogether(watch, loaded, count) {
  for (let tick = 0; tick < count; tick++) {
    watch.step();
    loaded.step();
    assert.deepEqual(loaded, watch, `Upgrade continuation ${tick}`);
  }
}

test('saved four-second upgrades continue identically and atomically spend five or two hundred copper once', () => {
  for (const [tier, cost, health] of [[1, 5, 11], [2, 200, WATCH_WALL_TOWER_HEALTH]]) {
    const watch = midUpgrade(tier, cost);
    const { loaded } = roundTrip(watch);
    const remaining = watch.builders[0].workAt - watch.tick;
    stepTogether(watch, loaded, remaining - 1);
    assert.equal(loaded.posts[0].tier, tier);
    assert.equal(loaded.coins, cost);
    stepTogether(watch, loaded, 1);
    assert.equal(loaded.posts[0].tier, tier + 1);
    assert.equal(loaded.posts[0].health, health);
    assert.equal(loaded.coins, 0);
    assert.deepEqual(loaded.builderPaidRepairs, []);
    const completed = roundTrip(loaded).loaded;
    stepTogether(loaded, completed, WATCH_BUILDER_UPGRADE_TICKS * 2);
    assert.equal(completed.posts[0].tier, tier + 1);
    assert.equal(completed.coins, 0);
  }
});

test('stopping an unpaid upgrade or switching to repairs saves immediately and never charges for unfinished work', () => {
  for (const order of ['idle', 'repair']) {
    const watch = midUpgrade();
    assert.ok(watch.setBuilderOrder(order));
    const { loaded } = roundTrip(watch);
    assert.equal(loaded.builders[0].working, false);
    assert.ok(loaded.builders[0].workAt <= loaded.tick + WATCH_BUILDER_REPAIR_TICKS);
    stepTogether(watch, loaded, WATCH_BUILDER_UPGRADE_TICKS * 2);
    assert.equal(loaded.posts[0].tier, 2);
    assert.equal(loaded.posts[0].health, 11);
    assert.equal(loaded.coins, 200);
    assert.deepEqual(loaded.builderPaidRepairs, []);
  }
});

test('a saved recall and overnight transition preserve the upgrade order without spending until next-day completion', () => {
  const watch = midUpgrade();
  assert.equal(watch.startNight(), false);
  const recalling = roundTrip(watch).loaded;
  for (let tick = 0; tick < 100 && watch.phase === 'day'; tick++) stepTogether(watch, recalling, 1);
  assert.equal(watch.phase, 'night');
  assert.equal(watch.posts[0].tier, 2);
  assert.equal(watch.coins, 200);
  const { loaded } = roundTrip(watch);
  watch.finishNight();
  loaded.finishNight();
  assert.equal(loaded.builderOrder, 'upgrade');
  assert.equal(loaded.coins, 203);
  stepTogether(watch, loaded, WATCH_BUILDER_UPGRADE_TICKS * 3);
  assert.equal(loaded.posts[0].tier, 3);
  assert.equal(loaded.coins, 3);
  roundTrip(loaded);
});

test('upgrade timing accepts the longer deadline while unknown orders and impossible deadlines are rejected', () => {
  for (const order of ['idle', 'repair', 'upgrade']) {
    const watch = midUpgrade();
    watch.builderOrder = order;
    const limit = order === 'upgrade' ? WATCH_BUILDER_UPGRADE_TICKS : WATCH_BUILDER_REPAIR_TICKS;
    watch.builders[0].workAt = watch.tick + limit;
    const { storage, id } = roundTrip(watch);
    const key = storage.key(0);
    const record = JSON.parse(storage.getItem(key));
    record.state.builders[0].workAt++;
    storage.setItem(key, JSON.stringify(record));
    assert.throws(() => loadWatchSlot(storage, id), /damaged game data/);
    assert.equal(listWatchSlots(storage).unreadable, 1);
  }
  for (const order of ['upgrades', 'build', null, 1]) {
    const { storage, id } = roundTrip(midUpgrade());
    const key = storage.key(0);
    const record = JSON.parse(storage.getItem(key));
    record.state.builderOrder = order;
    storage.setItem(key, JSON.stringify(record));
    assert.throws(() => loadWatchSlot(storage, id), /damaged game data/);
  }
});

test('old version-one builder slots still default idle and cannot upgrade or spend copper without an order', () => {
  const watch = midUpgrade(1, 5);
  watch.builderOrder = 'repair';
  watch.builders[0].workAt = watch.tick + WATCH_BUILDER_REPAIR_TICKS;
  const { storage, id } = roundTrip(watch);
  const key = storage.key(0);
  const record = JSON.parse(storage.getItem(key));
  delete record.state.builderOrder;
  delete record.state.builderPaidRepairs;
  const legacy = JSON.stringify(record);
  storage.setItem(key, legacy);
  const loaded = loadWatchSlot(storage, id);
  assert.equal(loaded.builderOrder, 'idle');
  assert.deepEqual(loaded.builderPaidRepairs, []);
  assert.equal(storage.getItem(key), legacy);
  for (let tick = 0; tick < WATCH_BUILDER_UPGRADE_TICKS * 2; tick++) loaded.step();
  assert.equal(loaded.posts[0].tier, 1);
  assert.equal(loaded.coins, 5);
  roundTrip(loaded);
});
