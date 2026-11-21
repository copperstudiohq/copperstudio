import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_BOUNDS, WATCH_BUILDER_REPAIR_TICKS, WATCH_SIGNAL } from '../public/games/mosswake-creek/watch.js';
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

function builder(side, x) {
  return { side, x, direction: -side, stride: 0, walking: false,
    returning: false, working: false, workAt: 0 };
}

function preparedWatch() {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  for (const wall of watch.posts) Object.assign(wall, { tier: 2, health: 4 });
  return watch;
}

function roundTrip(watch) {
  const storage = memoryStorage();
  const id = saveWatchSlot(storage, watch, 'Builders at work');
  const loaded = loadWatchSlot(storage, id);
  assert.deepEqual(loaded, watch);
  assert.equal(JSON.parse(storage.getItem(storage.key(0))).version, 1);
  return { loaded, storage, id };
}

function stepTogether(watch, loaded, count) {
  for (let tick = 0; tick < count; tick++) {
    watch.step();
    loaded.step();
    assert.deepEqual(loaded, watch, `Builder continuation ${tick}`);
  }
}

test('builders on both banks preserve their travel and continue the same repairs after loading', () => {
  const watch = preparedWatch();
  watch.builders = watch.posts.map((post) => builder(post.side, post.wallX + post.side * 40));
  watch.step();
  assert.ok(watch.builders.every(({ walking }) => walking));
  const { loaded } = roundTrip(watch);
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS * 4);
  assert.ok(watch.posts.every(({ health }) => health > 4));
});

test('a save midway through a repair preserves the scheduled hammer tick and never repeats completed repairs', () => {
  const watch = preparedWatch();
  const wall = watch.posts[0];
  wall.health = 10;
  watch.builders = [builder(wall.side, wall.wallX)];
  for (let tick = 0; tick < 20 && !watch.builders[0].working; tick++) watch.step();
  assert.ok(watch.builders[0].working);
  assert.ok(watch.builders[0].workAt > watch.tick);
  const { loaded } = roundTrip(watch);
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS + 1);
  assert.equal(watch.posts[0].health, 11);
  const finished = roundTrip(loaded).loaded;
  stepTogether(loaded, finished, WATCH_BUILDER_REPAIR_TICKS * 2);
  assert.equal(finished.posts[0].health, 11);
});

test('an early-bell recall saved while builders return reaches the same night without losing workers', () => {
  const watch = preparedWatch();
  watch.builders = [builder(-1, WATCH_BOUNDS.left + 40), builder(1, WATCH_BOUNDS.right - 40)];
  assert.equal(watch.startNight(), false);
  assert.equal(watch.recallingGuards, true);
  watch.step();
  assert.ok(watch.builders.every(({ returning, walking }) => returning && walking));
  const { loaded } = roundTrip(watch);
  for (let tick = 0; tick < 2000 && watch.phase === 'day'; tick++) stepTogether(watch, loaded, 1);
  assert.equal(watch.phase, 'night');
  assert.equal(watch.builders.length, 2);
  roundTrip(watch);
  stepTogether(watch, loaded, 20);
});

test('saving inside the tower room freezes builder travel, repair timing and all exterior progress', () => {
  const watch = preparedWatch();
  watch.builders = [builder(-1, watch.posts[0].wallX)];
  watch.step();
  watch.towerUpgraded = watch.insideTower = true;
  watch.player.x = WATCH_SIGNAL;
  const { loaded } = roundTrip(watch);
  const before = structuredClone(loaded);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS * 3; tick++) loaded.step();
  assert.deepEqual(structuredClone(loaded), before);
  assert.ok(watch.use('tower'));
  assert.ok(loaded.use('tower'));
  stepTogether(watch, loaded, WATCH_BUILDER_REPAIR_TICKS + 1);
});

test('old version-one saves without builders load with an empty builder roster', () => {
  const { storage, id } = roundTrip(preparedWatch());
  const key = storage.key(0);
  const record = JSON.parse(storage.getItem(key));
  delete record.state.builders;
  const legacy = JSON.stringify(record);
  storage.setItem(key, legacy);
  const loaded = loadWatchSlot(storage, id);
  assert.deepEqual(loaded.builders, []);
  assert.equal(storage.getItem(key), legacy, 'Reading a legacy slot must not rewrite it');
  assert.equal(listWatchSlots(storage).unreadable, 0);
  loaded.step();
  roundTrip(loaded);
});

test('invalid builder fields, positions, timing and incompatible work flags are rejected', () => {
  const changes = [
    (unit) => { delete unit.workAt; },
    (unit) => { unit.target = 'unvalidated target'; },
    (unit) => { unit.side = 0; },
    (unit) => { unit.direction = 2; },
    (unit) => { unit.x = WATCH_BOUNDS.left - 1; },
    (unit) => { unit.x = WATCH_BOUNDS.right + 1; },
    (unit) => { unit.x = null; },
    (unit) => { unit.stride = -1; },
    (unit) => { unit.stride = 0.5; },
    (unit) => { unit.walking = 1; },
    (unit) => { unit.returning = 'false'; },
    (unit) => { unit.working = null; },
    (unit) => { unit.workAt = -1; },
    (unit) => { unit.workAt = 0.5; },
    (unit, state) => { unit.workAt = state.tick + WATCH_BUILDER_REPAIR_TICKS + 1; },
    (unit) => { unit.working = unit.walking = true; },
    (unit) => { unit.working = unit.returning = true; },
    (unit, state) => { unit.working = true; state.phase = 'night'; }
  ];
  for (const change of changes) {
    const watch = preparedWatch();
    watch.builders = [builder(-1, watch.posts[0].wallX)];
    const { storage, id } = roundTrip(watch);
    const key = storage.key(0);
    const record = JSON.parse(storage.getItem(key));
    change(record.state.builders[0], record.state);
    storage.setItem(key, JSON.stringify(record));
    assert.throws(() => loadWatchSlot(storage, id), /damaged game data/);
    assert.equal(listWatchSlots(storage).unreadable, 1);
  }
  for (const builders of [null, {}, [null]]) {
    const { storage, id } = roundTrip(preparedWatch());
    const key = storage.key(0);
    const record = JSON.parse(storage.getItem(key));
    record.state.builders = builders;
    storage.setItem(key, JSON.stringify(record));
    assert.throws(() => loadWatchSlot(storage, id), /damaged game data/);
  }
});
