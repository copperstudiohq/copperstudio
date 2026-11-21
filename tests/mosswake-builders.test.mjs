import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_BUILDER_COST, WATCH_BUILDER_REPAIR_TICKS, WATCH_CAMPS,
  WATCH_DAY, WATCH_HEALTH, WATCH_SIGNAL } from '../public/games/mosswake-creek/watch.js';

function builderWatch() {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  watch.coins = 300;
  return watch;
}

function hireBuilder(watch, camp = WATCH_CAMPS[0]) {
  watch.player.x = camp.x;
  assert.ok(watch.use('builder'));
  return watch.builders.at(-1);
}

function stepUntil(watch, condition, limit = WATCH_DAY) {
  for (let tick = 0; tick < limit && !condition(); tick++) watch.step();
  assert.ok(condition(), 'The builder did not reach its expected state in time.');
}

test('builders cost exactly three copper, emerge from the selected tent and do not create an archer', () => {
  for (const camp of WATCH_CAMPS) {
    const watch = builderWatch();
    watch.player.x = camp.x;
    const action = watch.getBuilderAction();
    assert.equal(action.kind, 'hire-builder');
    assert.equal(action.cost, WATCH_BUILDER_COST);
    assert.equal(action.camp, camp);
    assert.equal(action.post.side, -1);
    watch.coins = 2;
    assert.equal(watch.use('builder'), false);
    assert.equal(watch.coins, 2);
    assert.deepEqual(watch.builders, []);
    watch.coins++;
    const builder = hireBuilder(watch, camp);
    assert.equal(watch.coins, 0);
    assert.deepEqual(builder, { side: -1, x: camp.x, direction: -camp.side,
      stride: 0, walking: false, returning: false, working: false, workAt: watch.tick });
    assert.equal(watch.posts.reduce((count, post) => count + post.guards.length, 0), 0);
    assert.equal(watch.getAction().kind, 'hire', 'ordinary archer recruitment remains separate');
    watch.step();
    assert.notEqual(builder.x, camp.x, 'the visible builder walks out of its hiring camp');
    assert.equal(builder.walking, true);
  }
});

test('builder banks balance independently of the archer roster and have no recruitment limit', () => {
  const watch = builderWatch();
  watch.posts[0].guards = Array.from({ length: 9 }, () => ({ rank: 0 }));
  const expected = Array.from({ length: 20 }, (_, index) => index % 2 ? 1 : -1);
  for (const side of expected) assert.equal(hireBuilder(watch, WATCH_CAMPS[3]).side, side);
  assert.deepEqual(watch.builders.map(({ side }) => side), expected);
  assert.equal(watch.builders.filter(({ side }) => side === -1).length, 10);
  assert.equal(watch.builders.filter(({ side }) => side === 1).length, 10);
  assert.equal(watch.coins, 240);
  assert.equal(watch.posts[0].guards.length, 9);
});

test('builder recruitment requires a running watch at an open tent and cannot charge indoors or under shelter', () => {
  const ready = new CreekWatch();
  ready.player.x = WATCH_CAMPS[0].x;
  assert.equal(ready.getBuilderAction(), null);
  assert.equal(ready.use('builder'), false);
  assert.equal(ready.status, 'ready');
  const watch = builderWatch();
  watch.player.x = WATCH_SIGNAL;
  assert.equal(watch.use('builder'), false);
  watch.player.x = WATCH_CAMPS[0].x;
  watch.phase = 'night';
  watch.spawnOpus(-1, WATCH_CAMPS[0].x - 20);
  assert.equal(watch.getAction().kind, 'shelter');
  assert.equal(watch.getBuilderAction(), null);
  assert.equal(watch.use('builder'), false);
  watch.raiders = [];
  watch.phase = 'day';
  watch.insideTower = watch.towerUpgraded = true;
  assert.equal(watch.getBuilderAction(), null);
  assert.equal(watch.use('builder'), false);
  assert.deepEqual(watch.builders, []);
  assert.equal(watch.coins, 300);
});

test('builders must travel to a repair site, then spend two full seconds there before each free health point', () => {
  const watch = builderWatch(), wall = watch.posts[0];
  Object.assign(wall, { tier: 2, health: 1 });
  watch.coins = 3;
  const builder = hireBuilder(watch);
  watch.player.x = WATCH_SIGNAL;
  while (!builder.working && watch.tick < WATCH_DAY) {
    assert.equal(wall.health, 1, 'travel cannot repair a distant wall');
    watch.step();
  }
  assert.equal(builder.working, true);
  assert.equal(builder.x, wall.wallX + 20);
  assert.equal(builder.walking, false);
  assert.equal(builder.returning, false);
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_REPAIR_TICKS);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS - 1; tick++) watch.step();
  assert.equal(wall.health, 1);
  watch.step();
  assert.equal(wall.health, 2);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS; tick++) watch.step();
  assert.equal(wall.health, 3);
  assert.equal(watch.coins, 0, 'ongoing labor has no additional coin charge');
  assert.equal(watch.shots.length, 0);
  assert.equal(watch.huntedPigeons, 0);
  assert.deepEqual(watch.loot, []);
});

test('builders share their bank defenses with one worker per job and preserve each tower tier', () => {
  const watch = builderWatch(), wall = watch.posts[0], forward = watch.forwardWalls[0];
  Object.assign(wall, { tier: 2, health: 1 });
  Object.assign(forward, { tier: 3, health: 1 });
  for (let index = 0; index < 5; index++) hireBuilder(watch);
  const west = watch.builders.filter(({ side }) => side === -1);
  west[0].x = wall.wallX + 20;
  west[1].x = forward.wallX + 20;
  west[2].x = wall.wallX + 20;
  watch.player.x = WATCH_SIGNAL;
  watch.step();
  assert.equal(west.filter(({ working }) => working).length, 2);
  assert.equal(west[0].x, wall.wallX + 20);
  assert.equal(west[1].x, forward.wallX + 20);
  assert.equal(west[2].working, false);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS; tick++) watch.step();
  assert.equal(wall.health, 2);
  assert.equal(forward.health, 2);
  assert.equal(wall.tier, 2);
  assert.equal(forward.tier, 3);
  assert.equal(watch.forwardWalls[1].tier, 0);
  assert.equal(watch.forwardWalls[1].health, 0);
});

test('workers on opposite banks share the central signal as one job and never over-repair it', () => {
  const watch = builderWatch();
  const west = hireBuilder(watch), east = hireBuilder(watch);
  west.x = WATCH_SIGNAL - 15;
  east.x = WATCH_SIGNAL + 15;
  watch.signal = WATCH_HEALTH - 1;
  watch.player.x = WATCH_SIGNAL + 100;
  watch.step();
  assert.equal(watch.builders.filter(({ working }) => working).length, 1);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS; tick++) watch.step();
  assert.equal(watch.signal, WATCH_HEALTH);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS * 3; tick++) watch.step();
  assert.equal(watch.signal, WATCH_HEALTH);
  assert.equal(watch.builders.some(({ working }) => working), false);
});

test('builders repair existing damaged towers to their cap without buying walls, upgrades or gear', () => {
  const watch = builderWatch(), builder = hireBuilder(watch), wall = watch.posts[0];
  watch.coins = 0;
  watch.player.x = WATCH_SIGNAL;
  Object.assign(wall, { tier: 3, health: 29 });
  builder.x = wall.wallX + 20;
  for (let tick = 0; tick <= WATCH_BUILDER_REPAIR_TICKS * 2; tick++) watch.step();
  assert.equal(wall.health, 30);
  assert.equal(wall.tier, 3);
  assert.equal(watch.posts[1].tier, 0);
  assert.equal(watch.posts[1].health, 0);
  assert.ok(watch.forwardWalls.every(({ tier, health }) => tier === 0 && health === 0));
  assert.equal(watch.coins, 0);
  assert.deepEqual(watch.gear, []);
  assert.equal(watch.towerUpgraded, false);
  Object.assign(wall, { tier: 1, health: 5 });
  builder.x = wall.wallX + 20;
  builder.working = false;
  for (let tick = 0; tick <= WATCH_BUILDER_REPAIR_TICKS * 2; tick++) watch.step();
  assert.equal(wall.tier, 1);
  assert.equal(wall.health, 6);
});

test('workers leave enough time to return before dusk and an early bell waits for workers even with no archers', () => {
  const watch = builderWatch(), builder = hireBuilder(watch), wall = watch.posts[0];
  Object.assign(wall, { tier: 2, health: 1 });
  watch.player.x = WATCH_SIGNAL;
  assert.equal(watch.startNight(), false);
  assert.equal(watch.phase, 'day');
  assert.equal(watch.recallingGuards, true);
  stepUntil(watch, () => watch.phase === 'night');
  assert.equal(builder.x, watch.builderHome(builder));
  assert.equal(builder.working, false);
  assert.equal(builder.returning, false);
  assert.equal(builder.walking, false);
  assert.equal(wall.health, 1, 'early recall interrupts repair work');
  watch.finishNight();
  watch.phaseTick = WATCH_DAY - 10;
  const home = watch.builderHome(builder);
  builder.x = home;
  for (let tick = 0; tick < 10; tick++) watch.step();
  assert.equal(watch.phase, 'night');
  assert.equal(builder.x, home);
  assert.equal(builder.working, false, 'a job is not started without travel, work and return time');
  assert.equal(wall.health, 1);
});

test('nighttime recruits walk home without repairing, then retreat if the outer wall falls', () => {
  const watch = builderWatch(), wall = watch.posts[0], forward = watch.forwardWalls[0];
  Object.assign(wall, { tier: 2, health: 3 });
  Object.assign(forward, { tier: 3, health: 1 });
  watch.phase = 'night';
  const builder = hireBuilder(watch);
  watch.player.x = WATCH_SIGNAL;
  for (let tick = 0; tick < 20; tick++) watch.step();
  assert.equal(builder.returning, true);
  assert.equal(builder.walking, true);
  assert.equal(builder.working, false);
  assert.equal(wall.health, 3);
  assert.equal(forward.health, 1);
  builder.x = watch.builderHome(builder);
  watch.step();
  assert.equal(builder.walking, false);
  watch.strikeDefense(forward, 1);
  const oldX = builder.x;
  watch.step();
  assert.ok(builder.x > oldX, 'a west-bank worker retreats toward the surviving inner defense');
  assert.equal(builder.returning, true);
  assert.equal(builder.working, false);
  assert.equal(forward.health, 0);
});

test('entering the tower room pauses builder travel, animation, repair cooldown and health', () => {
  const watch = builderWatch(), builder = hireBuilder(watch), wall = watch.posts[0];
  Object.assign(wall, { tier: 3, health: 10 });
  builder.x = wall.wallX + 20;
  watch.step();
  assert.equal(builder.working, true);
  watch.towerUpgraded = true;
  watch.player.x = WATCH_SIGNAL;
  assert.ok(watch.use('tower'));
  const snapshot = JSON.stringify(watch);
  for (let tick = 0; tick < WATCH_BUILDER_REPAIR_TICKS * 3; tick++) watch.step();
  assert.equal(JSON.stringify(watch), snapshot);
});
