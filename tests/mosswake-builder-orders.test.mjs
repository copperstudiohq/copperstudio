import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_BUILDER_REPAIR_IDS, WATCH_BUILDER_REPAIR_TICKS,
  WATCH_CAMPS, WATCH_DAY, WATCH_HEALTH, WATCH_SIGNAL } from '../public/games/mosswake-creek/watch.js';

function crewWatch(count = 1) {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  watch.coins = count * 3;
  watch.player.x = WATCH_CAMPS[0].x;
  for (let index = 0; index < count; index++) assert.ok(watch.use('builder'));
  watch.player.x = WATCH_SIGNAL + 150;
  watch.coins = 20;
  return watch;
}

function step(watch, count = 1) {
  for (let tick = 0; tick < count; tick++) watch.step();
}

function until(watch, condition, limit = WATCH_DAY) {
  for (let tick = 0; tick < limit && !condition(); tick++) watch.step();
  assert.ok(condition(), 'The ordered repair did not reach its expected state.');
}

function atWall(watch, wall = watch.posts[0], builder = watch.builders[0], health = 1, tier = 2) {
  Object.assign(wall, { tier, health });
  builder.x = wall.wallX - wall.side * 20;
  return wall;
}

function startWork(watch) {
  assert.ok(watch.orderBuilders('fix walls'));
  watch.step();
  assert.ok(watch.builders.some(({ working }) => working));
}

test('new builders wait for an explicit order and reset removes every old order and repair credit', () => {
  const watch = crewWatch(), wall = atWall(watch);
  assert.equal(watch.builderOrder, 'idle');
  assert.deepEqual(watch.builderPaidRepairs, []);
  step(watch, WATCH_BUILDER_REPAIR_TICKS * 3);
  assert.equal(wall.health, 1);
  assert.equal(watch.coins, 20);
  assert.equal(watch.builders[0].working, false);
  assert.ok(watch.orderBuilders('fix walls'));
  watch.builderPaidRepairs = ['west-wall'];
  watch.reset();
  assert.equal(watch.builderOrder, 'idle');
  assert.deepEqual(watch.builderPaidRepairs, []);
  assert.deepEqual(watch.builders, []);
});

test('local typed orders recognize repair, stop and negated repair phrases without spending coins', () => {
  const watch = crewWatch();
  for (const input of ['fix walls', 'repair defenses', 'fix stuff', 'fix stuf', 'Please fix the walls!', 'REPAIR ALL DEFENCES']) {
    assert.ok(watch.orderBuilders(input), input);
    assert.equal(watch.builderOrder, 'repair');
    assert.equal(watch.coins, 20);
  }
  for (const input of ['stop repairs', 'stop fixing', 'wait', 'return home', "don't fix walls", 'do not repair defenses', 'never fix stuff', 'no repairs']) {
    assert.ok(watch.setBuilderOrder('repair'));
    assert.ok(watch.orderBuilders(input), input);
    assert.equal(watch.builderOrder, 'idle');
    assert.equal(watch.coins, 20);
  }
  for (const input of ['', 'build a free tower', 'a'.repeat(121), null, {}, 5]) {
    assert.equal(watch.orderBuilders(input), false);
    assert.equal(watch.builderOrder, 'idle');
    assert.equal(watch.coins, 20);
    assert.deepEqual(watch.builderPaidRepairs, []);
  }
});

test('orders require hired builders in a running outdoor watch and invalid orders preserve current work', () => {
  const ready = new CreekWatch();
  assert.equal(ready.setBuilderOrder('repair'), false);
  ready.start();
  assert.equal(ready.orderBuilders('fix walls'), false);
  const watch = crewWatch();
  assert.ok(watch.setBuilderOrder('repair'));
  watch.insideTower = true;
  assert.equal(watch.setBuilderOrder('idle'), false);
  assert.equal(watch.builderOrder, 'repair');
  watch.insideTower = false;
  assert.equal(watch.setBuilderOrder('free repairs'), false);
  assert.equal(watch.orderBuilders('paint the walls'), false);
  assert.equal(watch.builderOrder, 'repair');
  assert.equal(watch.coins, 20);
  watch.status = 'lost';
  assert.equal(watch.orderBuilders('fix walls'), false);
});

test('a wall job charges only after two full seconds at the site and subsequent health points use its credit', () => {
  const watch = crewWatch(), wall = atWall(watch);
  startWork(watch);
  assert.equal(watch.coins, 20);
  assert.deepEqual(watch.builderPaidRepairs, []);
  step(watch, WATCH_BUILDER_REPAIR_TICKS - 1);
  assert.equal(wall.health, 1);
  assert.equal(watch.coins, 20);
  watch.step();
  assert.equal(wall.health, 2);
  assert.equal(watch.coins, 18);
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  step(watch, WATCH_BUILDER_REPAIR_TICKS * 2);
  assert.equal(wall.health, 4);
  assert.equal(watch.coins, 18);
  until(watch, () => wall.health === 11);
  assert.equal(watch.coins, 18);
  assert.deepEqual(watch.builderPaidRepairs, []);
  wall.health = 10;
  until(watch, () => wall.health === 11);
  assert.equal(watch.coins, 16, 'new damage after a completed repair requires a fresh job payment');
  assert.deepEqual(watch.builderPaidRepairs, []);
});

test('each of the four wall sites has a separate repair payment, discounted to one copper by a Repair Kit', () => {
  assert.deepEqual(WATCH_BUILDER_REPAIR_IDS, ['west-wall', 'east-wall', 'west-forward', 'east-forward', 'signal']);
  for (const kit of [false, true]) {
    const watch = crewWatch(4), walls = [...watch.posts, ...watch.forwardWalls];
    if (kit) watch.gear.push('repair-kit');
    atWall(watch, walls[0], watch.builders[0]);
    atWall(watch, walls[1], watch.builders[1]);
    atWall(watch, walls[2], watch.builders[2], 1, 3);
    atWall(watch, walls[3], watch.builders[3], 1, 3);
    const fee = kit ? 1 : 2;
    watch.coins = fee * 4;
    startWork(watch);
    step(watch, WATCH_BUILDER_REPAIR_TICKS);
    assert.ok(walls.every(({ health }) => health === 2));
    assert.equal(watch.coins, 0);
    assert.deepEqual([...watch.builderPaidRepairs].sort(), WATCH_BUILDER_REPAIR_IDS.slice(0, 4).sort());
    step(watch, WATCH_BUILDER_REPAIR_TICKS);
    assert.ok(walls.every(({ health }) => health === 3));
    assert.equal(watch.coins, 0);
  }
});

test('a shared signal-tower repair costs three copper once, including with a Repair Kit', () => {
  const watch = crewWatch(2);
  watch.gear.push('repair-kit');
  watch.signal = WATCH_HEALTH - 2;
  watch.builders[0].x = WATCH_SIGNAL - 15;
  watch.builders[1].x = WATCH_SIGNAL + 15;
  watch.coins = 3;
  startWork(watch);
  assert.equal(watch.builders.filter(({ working }) => working).length, 1);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.equal(watch.signal, WATCH_HEALTH - 1);
  assert.equal(watch.coins, 0);
  assert.deepEqual(watch.builderPaidRepairs, ['signal']);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.equal(watch.signal, WATCH_HEALTH);
  assert.equal(watch.coins, 0);
  assert.deepEqual(watch.builderPaidRepairs, []);
});

test('stopping and resuming a partially funded repair neither heals remotely nor charges for the same job twice', () => {
  const watch = crewWatch(), wall = atWall(watch);
  watch.coins = 2;
  startWork(watch);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.equal(wall.health, 2);
  assert.equal(watch.coins, 0);
  assert.ok(watch.orderBuilders('stop repairs'));
  assert.equal(watch.builders[0].working, false);
  step(watch, WATCH_BUILDER_REPAIR_TICKS * 2);
  assert.equal(wall.health, 2);
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  assert.equal(watch.builders[0].x, watch.builderHome(watch.builders[0]));
  assert.ok(watch.orderBuilders('fix stuf'));
  until(watch, () => wall.health === 3);
  assert.equal(watch.coins, 0);
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
});

test('recall before the first repair spends nothing, while paid repair credits survive the night and resume at dawn', () => {
  const watch = crewWatch(), wall = atWall(watch);
  watch.coins = 2;
  startWork(watch);
  step(watch, WATCH_BUILDER_REPAIR_TICKS - 1);
  assert.equal(watch.startNight(), false);
  until(watch, () => watch.phase === 'night');
  assert.equal(watch.coins, 2);
  assert.equal(wall.health, 1);
  assert.deepEqual(watch.builderPaidRepairs, []);
  assert.equal(watch.builderOrder, 'repair');
  watch.finishNight();
  watch.loot = [];
  until(watch, () => wall.health === 2);
  assert.equal(watch.coins, 3, 'only the dawn allowance and one repair payment affect the wallet');
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  watch.startNight();
  until(watch, () => watch.phase === 'night');
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  watch.finishNight();
  watch.loot = [];
  const coins = watch.coins;
  until(watch, () => wall.health === 3);
  assert.equal(watch.coins, coins, 'continuing the paid job next day has no second payment');
});

test('simultaneous first repairs cannot overspend the shared wallet or heal an unpaid defense', () => {
  const watch = crewWatch(2);
  const west = atWall(watch, watch.posts[0], watch.builders[0]);
  const east = atWall(watch, watch.posts[1], watch.builders[1]);
  watch.coins = 2;
  startWork(watch);
  assert.equal(watch.builders.filter(({ working }) => working).length, 2);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.equal(west.health, 2);
  assert.equal(east.health, 1);
  assert.equal(watch.coins, 0);
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.equal(west.health, 3, 'the already-funded job can continue with an empty wallet');
  assert.equal(east.health, 1);
  assert.equal(watch.coins, 0);
  watch.coins = 2;
  until(watch, () => east.health === 2);
  assert.equal(watch.coins, 0);
  assert.ok(watch.builderPaidRepairs.includes('east-wall'));
});

test('insufficient funds keep unfunded workers idle without changing defenses or buying anything', () => {
  const watch = crewWatch(), wall = atWall(watch);
  watch.coins = 1;
  assert.ok(watch.orderBuilders('fix walls'));
  step(watch, WATCH_BUILDER_REPAIR_TICKS * 3);
  assert.equal(wall.health, 1);
  assert.equal(watch.coins, 1);
  assert.equal(watch.builders[0].working, false);
  assert.deepEqual(watch.builderPaidRepairs, []);
  assert.equal(watch.posts[1].tier, 0);
  assert.deepEqual(watch.gear, []);
});

test('manual repairs, rebuilds and upgrades clear only their own builder payment credit', () => {
  for (const state of [
    { tier: 1, health: 5, action: 'repair' },
    { tier: 0, health: 0, action: 'build' },
    { tier: 1, health: 6, action: 'reinforce' },
    { tier: 2, health: 11, action: 'wall-tower' }
  ]) {
    const watch = crewWatch(), wall = watch.posts[0];
    Object.assign(wall, { tier: state.tier, health: state.health });
    Object.assign(watch.posts[1], { tier: 2, health: 1 });
    watch.builderPaidRepairs = ['west-wall', 'east-wall'];
    watch.player.x = wall.wallX;
    watch.coins = 300;
    assert.equal(watch.getAction().kind, state.action);
    assert.ok(watch.use());
    assert.deepEqual(watch.builderPaidRepairs, ['east-wall']);
    assert.equal(wall.health, watch.maxWall(wall));
  }
  const watch = crewWatch();
  watch.signal = 5;
  watch.builderPaidRepairs = ['signal'];
  watch.player.x = WATCH_SIGNAL;
  assert.equal(watch.getAction().kind, 'signal');
  assert.ok(watch.use());
  assert.equal(watch.signal, WATCH_HEALTH);
  assert.deepEqual(watch.builderPaidRepairs, []);
});

test('manual repair can finish a funded wall or signal job for free, then fresh damage restores its normal fee', () => {
  for (const kind of ['wall', 'kit-wall', 'signal']) {
    const watch = crewWatch(), wall = watch.posts[0];
    if (kind === 'kit-wall') watch.gear.push('repair-kit');
    const signal = kind === 'signal', fee = signal ? 3 : kind === 'kit-wall' ? 1 : 2;
    const id = signal ? 'signal' : 'west-wall';
    if (signal) {
      watch.signal = 3;
      watch.builders[0].x = WATCH_SIGNAL - 15;
    } else atWall(watch);
    watch.coins = fee;
    startWork(watch);
    step(watch, WATCH_BUILDER_REPAIR_TICKS);
    assert.equal(watch.coins, 0);
    assert.deepEqual(watch.builderPaidRepairs, [id]);
    watch.player.x = signal ? WATCH_SIGNAL : wall.wallX;
    assert.equal(watch.getAction().cost, 0);
    assert.ok(watch.use(), 'the existing job payment also covers manual completion');
    assert.equal(signal ? watch.signal : wall.health, signal ? WATCH_HEALTH : watch.maxWall(wall));
    assert.deepEqual(watch.builderPaidRepairs, []);
    if (signal) watch.signal--;
    else wall.health--;
    assert.equal(watch.getAction().cost, fee);
    assert.equal(watch.use(), false);
    assert.equal(watch.coins, 0);
    watch.coins = fee;
    assert.ok(watch.use());
    assert.equal(watch.coins, 0);
  }
});

test('credited inner-wall ruins finish for free without downgrading, while fresh unpaid ruins keep the normal rebuild', () => {
  for (const side of [-1, 1]) {
    for (const tier of [1, 2]) {
      const watch = crewWatch(), wall = watch.posts[side === -1 ? 0 : 1];
      Object.assign(wall, { tier, health: 0 });
      watch.builderPaidRepairs = [side === -1 ? 'west-wall' : 'east-wall'];
      watch.player.x = wall.wallX;
      watch.coins = 0;
      assert.equal(watch.getAction().kind, 'repair');
      assert.equal(watch.getAction().cost, 0);
      assert.ok(watch.use());
      assert.equal(wall.tier, tier);
      assert.equal(wall.health, watch.maxWall(wall));
      assert.deepEqual(watch.builderPaidRepairs, []);
      assert.equal(watch.coins, 0);
      wall.health = 0;
      assert.equal(watch.getAction().kind, 'build');
      assert.equal(watch.getAction().cost, 4);
      assert.equal(watch.use(), false);
      watch.coins = 4;
      assert.ok(watch.use());
      assert.equal(wall.tier, 1);
      assert.equal(wall.health, 6);
      assert.equal(watch.coins, 0);
    }
  }
});

test('the tower-room pause freezes a repair order, its credit and every future payment', () => {
  const watch = crewWatch(), wall = atWall(watch);
  startWork(watch);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.deepEqual(watch.builderPaidRepairs, ['west-wall']);
  watch.towerUpgraded = watch.insideTower = true;
  watch.player.x = WATCH_SIGNAL;
  const snapshot = JSON.stringify(watch);
  step(watch, WATCH_BUILDER_REPAIR_TICKS * 3);
  assert.equal(JSON.stringify(watch), snapshot);
  assert.equal(wall.health, 2);
});
