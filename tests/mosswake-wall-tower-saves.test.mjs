import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_WALL_TOWER_HEALTH } from '../public/games/mosswake-creek/watch.js';
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

function runningWatch() {
  const watch = new CreekWatch();
  watch.start();
  return watch;
}

function roundTrip(watch) {
  const storage = memoryStorage();
  const id = saveWatchSlot(storage, watch, 'Wall towers');
  const loaded = loadWatchSlot(storage, id);
  assert.deepEqual(loaded, watch);
  assert.equal(JSON.parse(storage.getItem(storage.key(0))).version, 1);
  return { loaded, storage, id };
}

test('all four wall towers round-trip through existing version-one named slots', () => {
  const watch = runningWatch();
  for (const wall of [...watch.posts, ...watch.forwardWalls]) {
    wall.tier = 3;
    wall.health = WATCH_WALL_TOWER_HEALTH;
  }
  const { loaded, storage, id } = roundTrip(watch);
  assert.equal(listWatchSlots(storage).unreadable, 0);
  assert.equal(listWatchSlots(storage).slots[0].id, id);
  assert.ok(loaded.marketOpen);
  assert.deepEqual([...loaded.posts, ...loaded.forwardWalls].map(({ tier, health }) => ({ tier, health })),
    Array.from({ length: 4 }, () => ({ tier: 3, health: WATCH_WALL_TOWER_HEALTH })));
});

test('damaged and destroyed saved towers retain their tier and repair to tower strength after loading', () => {
  for (const bank of ['posts', 'forwardWalls']) {
    for (const index of [0, 1]) {
      for (const health of [0, 7]) {
        const watch = runningWatch();
        const wall = watch[bank][index];
        wall.tier = 3;
        wall.health = health;
        watch.player.x = wall.wallX;
        watch.coins = 2;
        const { loaded } = roundTrip(watch);
        assert.equal(loaded[bank][index].health, health);
        assert.equal(loaded.getAction().kind, 'repair');
        assert.ok(loaded.use());
        assert.equal(loaded[bank][index].tier, 3);
        assert.equal(loaded[bank][index].health, WATCH_WALL_TOWER_HEALTH);
        assert.equal(loaded.coins, 0);
        roundTrip(loaded);
      }
    }
  }
});

test('legacy version-one slots keep unbuilt, ordinary and reinforced walls loadable', () => {
  for (const [tier, health] of [[0, 0], [1, 0], [1, 6], [2, 0], [2, 11]]) {
    const watch = runningWatch();
    for (const wall of [...watch.posts, ...watch.forwardWalls]) Object.assign(wall, { tier, health });
    const { storage, id } = roundTrip(watch);
    const key = storage.key(0);
    const record = JSON.parse(storage.getItem(key));
    delete record.state.forwardWalls; // Early Watch versions had only the inner walls.
    storage.setItem(key, JSON.stringify(record));
    const loaded = loadWatchSlot(storage, id);
    assert.deepEqual(loaded.posts.map(({ tier, health }) => ({ tier, health })), [{ tier, health }, { tier, health }]);
    assert.deepEqual(loaded.forwardWalls.map(({ tier, health }) => ({ tier, health })),
      [{ tier: 0, health: 0 }, { tier: 0, health: 0 }]);
    assert.equal(listWatchSlots(storage).unreadable, 0);
  }
});

test('saved tower validation rejects impossible tiers or health on either bank and wall type', () => {
  const invalid = [
    { tier: 3, health: WATCH_WALL_TOWER_HEALTH + 1 },
    { tier: 3, health: -1 },
    { tier: 3, health: 0.5 },
    { tier: 3, health: '30' },
    { tier: 3, health: null },
    { tier: 4, health: WATCH_WALL_TOWER_HEALTH },
    { tier: '3', health: WATCH_WALL_TOWER_HEALTH },
    { tier: 2, health: 12 },
    { tier: 1, health: 7 },
    { tier: 0, health: 1 }
  ];
  for (const bank of ['posts', 'forwardWalls']) {
    for (const index of [0, 1]) {
      for (const fields of invalid) {
        const { storage, id } = roundTrip(runningWatch());
        const key = storage.key(0);
        const record = JSON.parse(storage.getItem(key));
        Object.assign(record.state[bank][index], fields);
        storage.setItem(key, JSON.stringify(record));
        assert.throws(() => loadWatchSlot(storage, id), /damaged game data/);
        assert.equal(listWatchSlots(storage).unreadable, 1);
      }
    }
  }
});
