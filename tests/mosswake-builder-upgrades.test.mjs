import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_BUILDER_REPAIR_TICKS, WATCH_BUILDER_UPGRADE_TICKS,
  WATCH_CAMPS, WATCH_DAY, WATCH_SIGNAL } from '../public/games/mosswake-creek/watch.js';

function upgradeWatch(count = 1) {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  watch.coins = count * 3;
  watch.player.x = WATCH_CAMPS[0].x;
  for (let index = 0; index < count; index++) assert.ok(watch.use('builder'));
  watch.player.x = WATCH_SIGNAL + 120;
  watch.coins = 1000;
  return watch;
}

function atWall(watch, wall = watch.posts[0], builder = watch.builders[0], tier = 1) {
  Object.assign(wall, { tier, health: tier === 1 ? 6 : tier === 2 ? 11 : 30 });
  builder.x = wall.wallX - wall.side * 20;
  return wall;
}

function step(watch, count = 1) {
  for (let tick = 0; tick < count; tick++) watch.step();
}

function until(watch, condition, limit = WATCH_DAY) {
  for (let tick = 0; tick < limit && !condition(); tick++) watch.step();
  assert.ok(condition(), 'The builder upgrade did not reach its expected state.');
}

function begin(watch) {
  assert.ok(watch.orderBuilders('upgrade walls'));
  watch.step();
}

test('typed upgrade orders, negated upgrades and stop-work phrases are local and never charge immediately', () => {
  const watch = upgradeWatch();
  for (const command of ['upgrade walls', 'auto upgrade', 'Please upgrade all walls!', 'AUTO-UPGRADE']) {
    assert.ok(watch.orderBuilders(command));
    assert.equal(watch.builderOrder, 'upgrade');
    assert.equal(watch.coins, 1000);
  }
  for (const command of ['stop upgrades', 'stop upgrading', 'stop work', "don't upgrade walls", 'do not auto upgrade', 'no upgrades']) {
    assert.ok(watch.setBuilderOrder('upgrade'));
    assert.ok(watch.orderBuilders(command));
    assert.equal(watch.builderOrder, 'idle');
    assert.equal(watch.coins, 1000);
  }
  assert.equal(watch.orderBuilders('upgrade the signal tower for free'), false);
  assert.equal(watch.builderOrder, 'idle');
  assert.equal(watch.coins, 1000);
});

test('all four existing walls upgrade in two separate four-second stages costing five and two hundred copper each', () => {
  const watch = upgradeWatch(4), walls = [...watch.posts, ...watch.forwardWalls];
  atWall(watch, walls[0], watch.builders[0]);
  atWall(watch, walls[1], watch.builders[1]);
  atWall(watch, walls[2], watch.builders[2]);
  atWall(watch, walls[3], watch.builders[3]);
  watch.coins = 4 * 205;
  begin(watch);
  assert.ok(watch.builders.every(({ working, workAt }) => working && workAt === watch.tick + WATCH_BUILDER_UPGRADE_TICKS));
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.ok(walls.every(({ tier }) => tier === 1));
  assert.equal(watch.coins, 820);
  watch.step();
  assert.ok(walls.every(({ tier, health }) => tier === 2 && health === 11));
  assert.equal(watch.coins, 800);
  assert.ok(watch.builders.every(({ working }) => !working));
  assert.deepEqual(watch.builderPaidRepairs, []);
  watch.step();
  assert.ok(watch.builders.every(({ workAt }) => workAt === watch.tick + WATCH_BUILDER_UPGRADE_TICKS));
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.ok(walls.every(({ tier }) => tier === 2));
  assert.equal(watch.coins, 800);
  watch.step();
  assert.ok(walls.every(({ tier, health }) => tier === 3 && health === 30));
  assert.equal(watch.coins, 0);
  assert.deepEqual(watch.builderPaidRepairs, []);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS * 2);
  assert.ok(walls.every(({ tier }) => tier === 3));
  assert.equal(watch.coins, 0);
});

test('camp travel cannot count toward the four-second upgrade timer or spend coins remotely', () => {
  const watch = upgradeWatch(), wall = watch.posts[0];
  Object.assign(wall, { tier: 1, health: 6 });
  watch.coins = 5;
  begin(watch);
  while (!watch.builders[0].working && watch.tick < WATCH_DAY) {
    assert.equal(wall.tier, 1);
    assert.equal(watch.coins, 5);
    watch.step();
  }
  const builder = watch.builders[0];
  assert.equal(builder.working, true);
  assert.equal(builder.x, wall.wallX + 20);
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_UPGRADE_TICKS);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 5);
  watch.step();
  assert.equal(wall.tier, 2);
  assert.equal(watch.coins, 0);
});

test('upgrade mode repairs damage first, then starts fresh four-second reinforcement and tower work', () => {
  const watch = upgradeWatch(), wall = atWall(watch), builder = watch.builders[0];
  wall.health = 5;
  watch.coins = 207;
  begin(watch);
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_REPAIR_TICKS);
  step(watch, WATCH_BUILDER_REPAIR_TICKS);
  assert.equal(wall.health, 6);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 205);
  assert.equal(builder.working, false);
  watch.step();
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_UPGRADE_TICKS);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 205);
  watch.step();
  assert.equal(wall.tier, 2);
  assert.equal(watch.coins, 200);
  assert.equal(builder.working, false);
  watch.step();
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_UPGRADE_TICKS);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS);
  assert.equal(wall.tier, 3);
  assert.equal(wall.health, 30);
  assert.equal(watch.coins, 0);
});

test('an affordable repair on the same bank has priority over a nearer healthy-wall upgrade', () => {
  const watch = upgradeWatch(), inner = atWall(watch), forward = watch.forwardWalls[0];
  Object.assign(forward, { tier: 1, health: 5 });
  const before = watch.builders[0].x;
  begin(watch);
  assert.ok(watch.builders[0].x < before, 'the west-bank builder travels outward to the damaged forward wall');
  assert.equal(watch.builders[0].working, false);
  until(watch, () => forward.health === 6);
  assert.equal(inner.tier, 1);
  assert.equal(watch.coins, 998);
  assert.equal(watch.builders[0].working, false);
});

test('repair mode cannot upgrade healthy walls, and upgrade mode never buys unbuilt walls or other purchases', () => {
  const watch = upgradeWatch(), wall = atWall(watch);
  assert.ok(watch.setBuilderOrder('repair'));
  step(watch, WATCH_BUILDER_UPGRADE_TICKS * 3);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 1000);
  const empty = upgradeWatch();
  begin(empty);
  step(empty, WATCH_BUILDER_UPGRADE_TICKS * 3);
  assert.ok([...empty.posts, ...empty.forwardWalls].every(({ tier, health }) => tier === 0 && health === 0));
  assert.equal(empty.towerUpgraded, false);
  assert.deepEqual(empty.gear, []);
  assert.equal(empty.builders.length, 1);
  assert.ok(empty.posts.every(({ guards }) => guards.length === 0));
  assert.equal(empty.coins, 1000);
});

test('unaffordable upgrade jobs wait without spending, then complete at the exact five and two-hundred thresholds', () => {
  const watch = upgradeWatch(), wall = atWall(watch);
  watch.coins = 4;
  begin(watch);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS * 2);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 4);
  assert.equal(watch.builders[0].working, false);
  watch.coins = 5;
  until(watch, () => wall.tier === 2);
  assert.equal(watch.coins, 0);
  watch.coins = 199;
  step(watch, WATCH_BUILDER_UPGRADE_TICKS * 2);
  assert.equal(wall.tier, 2);
  assert.equal(watch.coins, 199);
  watch.coins = 200;
  until(watch, () => wall.tier === 3);
  assert.equal(watch.coins, 0);
});

test('simultaneous upgrades and disappearing funds never overdraw or complete an unpaid stage', () => {
  const watch = upgradeWatch(2);
  const west = atWall(watch, watch.posts[0], watch.builders[0]);
  const east = atWall(watch, watch.posts[1], watch.builders[1]);
  watch.coins = 5;
  begin(watch);
  assert.ok(watch.builders.every(({ working }) => working));
  step(watch, WATCH_BUILDER_UPGRADE_TICKS);
  assert.equal(west.tier, 2);
  assert.equal(east.tier, 1);
  assert.equal(watch.coins, 0);
  const interrupted = upgradeWatch(), wall = atWall(interrupted);
  interrupted.coins = 5;
  begin(interrupted);
  step(interrupted, WATCH_BUILDER_UPGRADE_TICKS - 1);
  interrupted.coins = 4;
  interrupted.step();
  assert.equal(wall.tier, 1);
  assert.equal(interrupted.coins, 4);
  assert.equal(interrupted.builders[0].working, false);
});

test('reissuing an upgrade order preserves its timer, while mode changes and stopping cancel unpaid progress', () => {
  const watch = upgradeWatch(), wall = atWall(watch), builder = watch.builders[0];
  watch.coins = 205;
  begin(watch);
  const deadline = builder.workAt;
  step(watch, 75);
  assert.ok(watch.orderBuilders('auto upgrade'));
  assert.equal(builder.workAt, deadline);
  assert.equal(builder.working, true);
  assert.ok(watch.setBuilderOrder('repair'));
  assert.equal(builder.workAt, watch.tick);
  assert.equal(builder.working, false);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 205);
  assert.ok(watch.setBuilderOrder('upgrade'));
  until(watch, () => builder.working);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.ok(watch.orderBuilders('stop work'));
  step(watch, WATCH_BUILDER_UPGRADE_TICKS);
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 205);
});

test('a manual reinforcement cancels the old site timer before automatic tower work can start', () => {
  const watch = upgradeWatch(), wall = atWall(watch), builder = watch.builders[0];
  watch.coins = 205;
  begin(watch);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  watch.player.x = wall.wallX;
  assert.equal(watch.getAction().kind, 'reinforce');
  assert.ok(watch.use());
  assert.equal(wall.tier, 2);
  assert.equal(watch.coins, 200);
  assert.equal(builder.working, false);
  assert.equal(builder.workAt, watch.tick);
  watch.step();
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_UPGRADE_TICKS);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.equal(wall.tier, 2);
  assert.equal(watch.coins, 200);
  watch.step();
  assert.equal(wall.tier, 3);
  assert.equal(watch.coins, 0);
});

test('damage and manual full repair invalidate an upgrade timer instead of carrying it into the next job', () => {
  const watch = upgradeWatch(), wall = atWall(watch), builder = watch.builders[0];
  begin(watch);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  watch.strikeDefense(wall, 1);
  assert.equal(builder.working, false);
  assert.equal(builder.workAt, watch.tick);
  watch.step();
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_REPAIR_TICKS);
  watch.player.x = wall.wallX;
  assert.ok(watch.use());
  assert.equal(wall.health, 6);
  assert.equal(builder.working, false);
  assert.equal(builder.workAt, watch.tick);
  watch.step();
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_UPGRADE_TICKS);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.equal(wall.tier, 1);
  watch.step();
  assert.equal(wall.tier, 2);
});

test('a four-second job is rejected near dusk even when a two-second repair would still fit', () => {
  const watch = upgradeWatch(), wall = atWall(watch), builder = watch.builders[0];
  watch.coins = 5;
  watch.phaseTick = WATCH_DAY - 120;
  assert.equal(watch.canBuilderVisit(builder, builder.x, watch.builderHome(builder)), true);
  assert.equal(watch.canBuilderVisit(builder, builder.x, watch.builderHome(builder), WATCH_BUILDER_UPGRADE_TICKS), false);
  begin(watch);
  assert.equal(builder.working, false);
  until(watch, () => watch.phase === 'night');
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 5);
  assert.equal(watch.builderOrder, 'upgrade');
  watch.finishNight();
  watch.loot = [];
  until(watch, () => wall.tier === 2);
  assert.equal(watch.coins, 3, 'the next day adds three copper, then pays only one five-copper upgrade');
});

test('retargeting to another wall budgets a full new job rather than borrowing an almost-finished timer', () => {
  const watch = upgradeWatch(), inner = atWall(watch), builder = watch.builders[0];
  begin(watch);
  builder.workAt = watch.tick + 1;
  watch.phaseTick = WATCH_DAY - 200;
  const home = watch.builderHome(builder);
  assert.equal(watch.canBuilderVisit(builder, builder.x, home, WATCH_BUILDER_UPGRADE_TICKS), true);
  const otherSite = watch.forwardWalls[0].wallX + 20;
  assert.equal(watch.canBuilderVisit(builder, otherSite, home, WATCH_BUILDER_REPAIR_TICKS), false);
  assert.equal(inner.tier, 1);
});

test('an early bell cancels unpaid upgrade work and the persistent order resumes with a fresh daytime timer', () => {
  const watch = upgradeWatch(), wall = atWall(watch), builder = watch.builders[0];
  watch.coins = 5;
  begin(watch);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.equal(watch.startNight(), false);
  until(watch, () => watch.phase === 'night');
  assert.equal(wall.tier, 1);
  assert.equal(watch.coins, 5);
  assert.equal(builder.working, false);
  assert.equal(watch.builderOrder, 'upgrade');
  watch.finishNight();
  watch.loot = [];
  until(watch, () => builder.working);
  assert.equal(builder.workAt, watch.tick + WATCH_BUILDER_UPGRADE_TICKS);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS - 1);
  assert.equal(wall.tier, 1);
  watch.step();
  assert.equal(wall.tier, 2);
  assert.equal(watch.coins, 3);
});

test('only one builder upgrades each wall, even with surplus workers standing at the same site', () => {
  const watch = upgradeWatch(5), inner = watch.posts[0], forward = watch.forwardWalls[0];
  const west = watch.builders.filter(({ side }) => side === -1);
  atWall(watch, inner, west[0]);
  atWall(watch, forward, west[1]);
  west[2].x = west[0].x;
  watch.coins = 10;
  begin(watch);
  assert.equal(west.filter(({ working }) => working).length, 2);
  step(watch, WATCH_BUILDER_UPGRADE_TICKS);
  assert.equal(inner.tier, 2);
  assert.equal(forward.tier, 2);
  assert.equal(watch.coins, 0);
});
