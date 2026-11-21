import test from 'node:test';
import assert from 'node:assert/strict';
import { CreekWatch, WATCH_HEALTH, WATCH_WALL_TOWER_COST, WATCH_WALL_TOWER_HEALTH,
  WATCH_WALL_TOWER_PLATFORM, watchGround } from '../public/games/mosswake-creek/watch.js';

function towerWatch() {
  const watch = new CreekWatch();
  watch.start();
  watch.loot = [];
  return watch;
}

function addGuards(watch, post, count = 3) {
  for (let index = 0; index < count; index++) {
    post.guards.push({ rank: 0, direction: post.side, fireAt: 0, shotAt: -36, carriedCoins: 0 });
  }
}

test('every bank and forward wall upgrades from a reinforced palisade for exactly 200 copper', () => {
  for (const [group, index] of [['posts', 0], ['posts', 1], ['forwardWalls', 0], ['forwardWalls', 1]]) {
    const watch = towerWatch(), wall = watch[group][index];
    watch.player.x = wall.wallX;
    watch.coins = 1000;
    assert.equal(watch.getAction().kind, 'build');
    assert.ok(watch.use());
    assert.equal(wall.tier, 1);
    assert.equal(watch.getAction().kind, 'reinforce');
    assert.ok(watch.use());
    assert.deepEqual(watch.getAction(), { kind: 'wall-tower', post: wall, label: 'Build wall tower', cost: WATCH_WALL_TOWER_COST });
    watch.coins = 199;
    assert.equal(watch.use(), false);
    assert.equal(watch.coins, 199);
    assert.equal(wall.tier, 2);
    assert.equal(wall.health, 11);
    watch.coins = 200;
    assert.ok(watch.use());
    assert.equal(watch.coins, 0);
    assert.equal(wall.tier, 3);
    assert.equal(wall.health, WATCH_WALL_TOWER_HEALTH);
    assert.equal(watch.maxWall(wall), 30);
    assert.notEqual(watch.getAction()?.kind, 'wall-tower');
    assert.match(watch.message, /wall tower built/);
    assert.equal(watch.towerUpgraded, false, 'wall towers never buy the separate dining room');
  }
});

test('damaged reinforced palisades must be repaired before their wall-tower upgrade', () => {
  const watch = towerWatch(), wall = watch.posts[0];
  Object.assign(wall, { tier: 2, health: 3 });
  watch.player.x = wall.wallX;
  watch.coins = 202;
  assert.equal(watch.getAction().kind, 'repair');
  assert.ok(watch.use());
  assert.equal(wall.health, 11);
  assert.equal(watch.coins, 200);
  assert.equal(watch.getAction().kind, 'wall-tower');
  assert.ok(watch.use());
  assert.equal(wall.health, 30);
  assert.equal(watch.coins, 0);
});

test('damaged and destroyed wall towers keep their upgrade and repair to full strength on all four sites', () => {
  for (const health of [0, 12, 29]) {
    for (const group of ['posts', 'forwardWalls']) {
      for (const index of [0, 1]) {
        const watch = towerWatch(), wall = watch[group][index];
        Object.assign(wall, { tier: 3, health });
        watch.player.x = wall.wallX;
        watch.coins = 2;
        assert.equal(watch.getAction().label, 'Repair wall tower');
        assert.ok(watch.use());
        assert.equal(wall.tier, 3);
        assert.equal(wall.health, 30);
        assert.equal(watch.coins, 0);
        assert.match(watch.message, /wall tower repaired/);
        assert.notEqual(watch.getAction()?.kind, 'wall-tower');
      }
    }
  }
  const watch = towerWatch(), wall = watch.posts[0];
  Object.assign(wall, { tier: 3, health: 0 });
  watch.player.x = wall.wallX;
  watch.gear.push('repair-kit');
  watch.coins = 1;
  assert.equal(watch.getAction().cost, 1);
  assert.ok(watch.use());
  assert.equal(wall.health, 30);
});

test('wall towers intercept raids, retain their tier when broken and preserve the market unlock', () => {
  const watch = towerWatch();
  for (const wall of watch.forwardWalls) Object.assign(wall, { tier: 3, health: 30 });
  const wall = watch.forwardWalls[0];
  watch.spawnOpus(-1, wall.wallX - 12);
  watch.moveRaider(watch.raiders[0]);
  assert.equal(wall.health, 29);
  assert.equal(watch.signal, WATCH_HEALTH);
  watch.strikeDefense(wall, 29);
  assert.equal(wall.health, 0);
  assert.equal(wall.tier, 3);
  assert.equal(watch.marketOpen, true);
  assert.match(watch.message, /wall tower fell/);
});

test('two home guards stand level with the active tower deck while remaining guards stay on the ground', () => {
  for (const side of [-1, 1]) {
    const watch = towerWatch(), post = watch.posts[side === -1 ? 0 : 1];
    Object.assign(post, { tier: 3, health: 30 });
    addGuards(watch, post);
    for (const index of [0, 1]) {
      const x = watch.guardPosition(post, index), elevation = watch.guardElevation(post, index);
      assert.equal(watchGround(x) - elevation, watchGround(post.wallX) - WATCH_WALL_TOWER_PLATFORM);
      assert.ok(Math.abs(x - post.wallX) <= 8);
    }
    assert.equal(watch.guardElevation(post, 2), 0);
    const forward = watch.forwardWalls[side === -1 ? 0 : 1];
    Object.assign(forward, { tier: 1, health: 6 });
    assert.equal(watch.guardElevation(post, 0), 0, 'the outermost live wall determines the guard station');
    Object.assign(forward, { tier: 3, health: 30 });
    assert.equal(watchGround(watch.guardPosition(post, 0)) - watch.guardElevation(post, 0),
      watchGround(forward.wallX) - WATCH_WALL_TOWER_PLATFORM);
    post.guards[0].x = watch.guardX(post, 0) + 1;
    assert.equal(watch.guardElevation(post, 0), 0, 'patrolling and returning guards climb only after reaching home');
    forward.health = 0;
    assert.equal(watch.guardElevation(post, 0), 0);
    post.guards[0].x = watch.guardX(post, 0);
    assert.equal(watchGround(watch.guardPosition(post, 0)) - watch.guardElevation(post, 0),
      watchGround(post.wallX) - WATCH_WALL_TOWER_PLATFORM);
    post.health = 0;
    assert.equal(watch.guardElevation(post, 0), 0, 'broken towers provide no floating garrison');
  }
});

test('tower archers release physical arrows at deck height and still hit moving enemies only on arrival', () => {
  for (const side of [-1, 1]) {
    const watch = towerWatch(), post = watch.posts[side === -1 ? 0 : 1];
    Object.assign(post, { tier: 3, health: 30 });
    addGuards(watch, post, 1);
    watch.phase = 'night';
    watch.queue = [];
    watch.aimSeed = 0;
    watch.spawnOpus(side, post.wallX + side * 60);
    const enemy = watch.raiders[0];
    enemy.hp = 5;
    watch.fireGuards();
    assert.equal(enemy.hp, 5);
    assert.equal(watch.shots.length, 1);
    assert.equal(watch.shots[0].y, watchGround(post.wallX) - WATCH_WALL_TOWER_PLATFORM - 16);
    assert.ok(watch.shots[0].vy < 0);
    for (let tick = 0; tick < 100 && watch.shots.some((shot) => !shot.stuck); tick++) {
      watch.tick++;
      watch.moveRaider(enemy);
      watch.stepArrows();
    }
    assert.equal(enemy.hp, 4);
    assert.ok(watch.tick > 5);
  }
});

test('Tri Flyers can dive onto raised tower guards rather than making the garrison immune', () => {
  for (const side of [-1, 1]) {
    const watch = towerWatch(), post = watch.posts[side === -1 ? 0 : 1];
    Object.assign(post, { tier: 3, health: 30 });
    addGuards(watch, post, 1);
    watch.day = 40;
    watch.phase = 'night';
    const x = watch.guardPosition(post, 0), altitude = watch.guardElevation(post, 0);
    assert.ok(altitude > 4);
    assert.equal(watch.nearestFlyerGuard(x).altitude, altitude);
    watch.spawnFlyer(side, x);
    Object.assign(watch.flyers[0], { mode: 'dive', altitude: 42 });
    for (let tick = 0; tick < 20 && post.guards.length; tick++) watch.moveFlyer(watch.flyers[0]);
    assert.equal(post.guards.length, 0);
    assert.equal(watch.raiders[0].kind, 'infected');
    assert.equal(watch.raiders[0].x, x);
    assert.equal(watch.flyers[0].mode, 'crawl');
  }
});

test('arrow aim predicts diving Flyers at their tower guard landing height while ground dives still end at zero', () => {
  for (const side of [-1, 1]) {
    const watch = towerWatch(), post = watch.posts[side === -1 ? 0 : 1];
    Object.assign(post, { tier: 3, health: 30 });
    addGuards(watch, post, 1);
    watch.day = 40;
    watch.phase = 'night';
    const x = watch.guardPosition(post, 0), platform = watch.guardElevation(post, 0);
    watch.spawnFlyer(side, x + side * 20);
    const flyer = watch.flyers[0];
    Object.assign(flyer, { mode: 'dive', altitude: 42 });
    const predict = (ticks) => watch.arrowTargetPose(flyer, flyer.x, flyer.altitude, ticks, 'raid');
    assert.equal(predict(1).altitude, 40, 'the prediction follows the same two-pixel descent as live flight');
    assert.equal(predict(100).altitude, platform, 'aim stops at the elevated guard rather than passing through the deck');
    assert.equal(predict(100).x, x);
    flyer.altitude = platform - 6;
    assert.equal(predict(1).altitude, platform - 4, 'a retargeted dive below a platform approaches the guard from below');
    assert.equal(predict(100).altitude, platform);
    post.health = 0;
    assert.equal(predict(100).altitude, 0, 'a broken tower returns its soldiers and their predicted landing point to ground');
    post.guards = [];
    assert.equal(predict(100).altitude, 0, 'a dive without a soldier still ends on the ground');
  }
});
