import { START_VIEW, VIEW_WIDTH, WIDTH, TICKS_PER_SECOND, DAY_TICKS, NIGHT_TICKS, TRI_PORTAL_OPEN_TICKS, CREATURES, quarryHeight } from './simulation.js';

export const WATCH_BRIDGE = { left: START_VIEW + 111, right: START_VIEW + 281, y: 112 };
export const WATCH_SIGNAL = (WATCH_BRIDGE.left + WATCH_BRIDGE.right) / 2;
export const WATCH_BOUNDS = { left: 0, right: WIDTH - 1 };
export const WATCH_PORTALS = [
  { side: -1, x: WATCH_BOUNDS.left + 26 },
  { side: 1, x: WATCH_BOUNDS.right - 26 }
];
export const WATCH_HEALTH = 10;
export const WATCH_DAY = DAY_TICKS;
export const WATCH_NIGHT = NIGHT_TICKS;
const WATCH_GUARD_LIMIT = 3;
const WATCH_RAIDER_LIMIT = 12;
export const WATCH_ENEMY_NAME = CREATURES.opus;
export const WATCH_OPUS_REACH = 12;
const WATCH_NO_ACTION = -TICKS_PER_SECOND;
const WATCH_GUARD_STATS = [
  { range: 88, damage: 1, cooldown: 22 },
  { range: 112, damage: 2, cooldown: 19 }
];
const WATCH_USE_RANGE = 19;
const WATCH_SPEED = 2.05;
const CAMP_APPROACH_RANGE = 120;
const CAMP_CLEARANCE_RANGE = 92;
const CAMP_RETREAT_DISTANCE = 32;
const WATCH_POSTS = [
  { side: -1, name: 'West', wallX: WATCH_BRIDGE.left - 44 },
  { side: 1, name: 'East', wallX: WATCH_BRIDGE.right + 44 }
];
export const WATCH_PIGEONS = WATCH_POSTS.flatMap(({ side, wallX }) =>
  [49, 94, 143].map((offset) => ({ side, x: wallX + side * offset })));
export const WATCH_CAMP_GROUPS = [
  { name: 'West', side: -1, camps: [
    { x: VIEW_WIDTH + 24, style: 'ridge' }, { x: VIEW_WIDTH + 117, style: 'lean-to' }
  ] },
  { name: 'East', side: 1, camps: [
    { x: 3 * VIEW_WIDTH + 224, style: 'patchwork' }, { x: 3 * VIEW_WIDTH + 308, style: 'sagging' }
  ] }
];
export const WATCH_CAMPS = WATCH_CAMP_GROUPS.flatMap(({ side, camps }) => camps.map((camp) => ({ ...camp, side })));
export const WATCH_CAMP_HINT = 'Use either tent marker to walk to its two recruiting camps.';
const WATCH_CACHES = [36, 82, 144, 208, 312, 446, 630, 740, 798, 857, 917]
  .flatMap((distance) => [WATCH_SIGNAL - distance, WATCH_SIGNAL + distance]);

export function watchGround(x) {
  if (x >= WATCH_BRIDGE.left && x <= WATCH_BRIDGE.right) return WATCH_BRIDGE.y;
  return quarryHeight(Math.round(x));
}

export function watchOpusWall(opus, posts) {
  const post = posts[opus.side === -1 ? 0 : 1];
  return post.health > 0 && (opus.x - post.wallX) * opus.side >= 0 ? post : null;
}

export function watchPigeonPose(pigeon, tick) {
  const phase = tick / 24 + pigeon.x;
  const velocity = Math.cos(phase);
  return { x: pigeon.x + Math.round(5 * Math.sin(phase)), direction: velocity < 0 ? -1 : 1,
    walking: Math.abs(velocity) > 0.25 };
}

function walkWatchGuard(guard, from, target, speed) {
  const distance = target - from;
  guard.walking = distance !== 0;
  if (!guard.walking) return;
  guard.direction = Math.sign(distance);
  guard.x = Math.abs(distance) <= speed ? target : from + guard.direction * speed;
  guard.stride = (guard.stride ?? 0) + 1;
}

export class CreekWatch {
  constructor() {
    this.reset();
  }

  reset() {
    this.status = 'ready';
    this.phase = 'day';
    this.day = 1;
    this.tick = 0;
    this.phaseTick = 0;
    this.coins = 6;
    this.signal = WATCH_HEALTH;
    this.player = { x: WATCH_SIGNAL, direction: 1, step: 0 };
    this.posts = WATCH_POSTS.map((post) => ({ ...post, tier: 0, health: 0, guards: [] }));
    this.raiders = [];
    this.shots = [];
    this.loot = [];
    this.huntedPigeons = 0;
    this.stockCaches();
    this.queue = [];
    this.message = 'Build palisades and hire guards before the first raid.';
  }

  stockCaches() {
    for (const x of WATCH_CACHES) {
      if (!this.loot.some((piece) => piece.x === x)) this.loot.push({ x, amount: 1 });
    }
  }

  get duration() {
    return this.phase === 'day' ? WATCH_DAY : WATCH_NIGHT;
  }

  get secondsLeft() {
    return Math.max(0, Math.ceil((this.duration - this.phaseTick) / TICKS_PER_SECOND));
  }

  get phaseProgress() {
    return Math.min(1, this.phaseTick / this.duration);
  }

  get portalOpening() {
    return this.phase === 'night' ? Math.min(1, this.phaseTick / TRI_PORTAL_OPEN_TICKS) : 0;
  }

  get camera() {
    return Math.round(Math.max(WATCH_BOUNDS.left,
      Math.min(WIDTH - VIEW_WIDTH, this.player.x - VIEW_WIDTH / 2)));
  }

  start() {
    if (this.status !== 'ready') return false;
    this.status = 'running';
    this.message = WATCH_CAMP_HINT;
    return true;
  }

  campShelterProgress(camp) {
    if (this.phase !== 'night') return 0;
    let progress = 0;
    for (const raider of this.raiders) {
      if (raider.side !== camp.side || raider.hp <= 0) continue;
      // Positive distance means the raider is still on the portal side of the camp.
      const distance = (raider.x - camp.x) * camp.side;
      const remaining = distance >= 0 ? CAMP_APPROACH_RANGE - distance : CAMP_CLEARANCE_RANGE + distance;
      progress = Math.max(progress, remaining / CAMP_RETREAT_DISTANCE);
    }
    return Math.min(1, progress);
  }

  getAction() {
    if (this.status !== 'running') return null;
    const player = this.player.x;
    const atSignal = Math.abs(player - WATCH_SIGNAL) <= WATCH_USE_RANGE;
    if (atSignal && this.phase === 'day') {
      if (this.signal < WATCH_HEALTH) return { kind: 'signal', label: 'Repair signal tower', cost: 3 };
      return { kind: 'bell', label: 'Ring the dusk bell', cost: 0 };
    }
    const camp = WATCH_CAMPS.find(({ x }) => Math.abs(player - x) <= WATCH_USE_RANGE);
    const wall = this.posts.find(({ wallX }) => Math.abs(player - wallX) <= WATCH_USE_RANGE);
    if (wall && (!camp || Math.abs(player - wall.wallX) <= Math.abs(player - camp.x))) {
      if (!wall.health) return { kind: 'build', post: wall, label: `Build ${wall.name.toLowerCase()} palisade`, cost: 4 };
      if (wall.health < this.maxWall(wall)) return { kind: 'repair', post: wall, label: 'Repair palisade', cost: 2 };
      if (wall.tier === 1) return { kind: 'reinforce', post: wall, label: 'Reinforce palisade', cost: 5 };
    }
    if (camp) {
      if (this.campShelterProgress(camp) > 0) {
        return { kind: 'shelter', label: 'Recruit taking shelter', cost: 0 };
      }
      return this.getCampAction();
    }
    return null;
  }

  getCampAction() {
    // Guards stay in the roster, so their saved count also preserves the next bank.
    const count = this.posts.reduce((total, post) => total + post.guards.length, 0);
    const next = this.posts[count % this.posts.length];
    // Older saves may have filled one bank first. Keep its cap and fill the other.
    const post = next.guards.length < WATCH_GUARD_LIMIT ? next
      : this.posts.find((bank) => bank.guards.length < WATCH_GUARD_LIMIT);
    if (post) {
      return { kind: 'hire', post, label: `Hire ${post.name.toLowerCase()} guard`, cost: 3 };
    }
    for (const bank of this.posts) {
      const guard = bank.guards.find((unit) => unit.rank === 0);
      if (guard) return { kind: 'train', post: bank, guard, label: `Train ${bank.name.toLowerCase()} veteran`, cost: 4 };
    }
    return null;
  }

  maxWall(post) {
    return post.tier === 2 ? 11 : 6;
  }

  use() {
    if (this.status === 'ready') return this.start();
    const action = this.getAction();
    if (!action) {
      if (this.status === 'running') this.message = 'Walk up to a camp, a palisade, or the signal tower. Each bank can hold three veterans.';
      return false;
    }
    if (action.kind === 'shelter') {
      this.message = 'The recruit will come out when the Tri pass.';
      return false;
    }
    if (this.coins < action.cost) {
      this.message = `You need ${action.cost} copper for that.`;
      return false;
    }
    const { post } = action;
    this.coins -= action.cost;
    switch (action.kind) {
      case 'bell':
        this.startNight();
        return true;
      case 'signal':
        this.signal = WATCH_HEALTH;
        this.message = 'Signal tower repaired. Ring the bell when you’re ready.';
        break;
      case 'hire':
        post.guards.push({ rank: 0, direction: post.side, fireAt: this.tick + 8, shotAt: WATCH_NO_ACTION });
        this.message = `Guard hired and sent to the ${post.name.toLowerCase()} bank.`;
        break;
      case 'train':
        action.guard.rank = 1;
        this.message = `${post.name} veteran trained. Veterans shoot farther and deal double damage.`;
        break;
      case 'repair':
        post.health = this.maxWall(post);
        this.message = `${post.name} palisade repaired.`;
        break;
      case 'reinforce':
        post.tier = 2;
        post.health = this.maxWall(post);
        this.message = `${post.name} palisade reinforced.`;
        break;
      case 'build':
        post.tier = 1;
        post.health = this.maxWall(post);
        this.message = `${post.name} palisade built.`;
        break;
    }
    return true;
  }

  startNight() {
    this.phase = 'night';
    this.phaseTick = 0;
    this.queue = [];
    const raidersPerPortal = Math.min(WATCH_RAIDER_LIMIT, this.day + 1);
    for (const { side } of WATCH_PORTALS) {
      const first = TRI_PORTAL_OPEN_TICKS + 4 + (side === 1 ? 22 : 0);
      for (let index = 0; index < raidersPerPortal; index++) {
        this.queue.push({ side, due: first + index * 46 });
      }
    }
    this.queue.sort((a, b) => a.due - b.due);
    this.message = `Night ${this.day}. ${WATCH_ENEMY_NAME} are coming through both portals.`;
  }

  finishNight() {
    this.raiders.length = 0;
    this.queue.length = 0;
    this.phase = 'day';
    this.phaseTick = 0;
    this.day++;
    this.huntedPigeons = 0;
    this.coins += 3;
    this.stockCaches();
    this.message = `Dawn of day ${this.day}. You earned 3 copper. Repair and prepare for the next raid.`;
  }

  step(direction = 0) {
    if (this.status !== 'running') return;
    this.tick++;
    this.phaseTick++;
    if (direction) {
      this.player.x = Math.max(WATCH_BOUNDS.left, Math.min(WATCH_BOUNDS.right, this.player.x + direction * WATCH_SPEED));
      this.player.direction = direction;
      this.player.step++;
    }
    this.loot = this.loot.filter((piece) => {
      if (Math.abs(piece.x - this.player.x) > 6) return true;
      this.coins += piece.amount;
      return false;
    });
    this.shots = this.shots.filter(({ end }) => end > this.tick);
    if (this.phase === 'day') {
      if (this.phaseTick >= WATCH_DAY) this.startNight();
      else {
        if (this.phaseTick === WATCH_DAY - 10 * TICKS_PER_SECOND) {
          this.message = 'Dusk in 10 seconds. The guards are heading back to their posts.';
        }
        this.patrolGuards();
      }
      return;
    }
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => walkWatchGuard(guard, this.guardPosition(post, index), this.guardX(post, index), 1.35));
    }
    while (this.queue[0]?.due <= this.phaseTick) {
      const { side } = this.queue.shift();
      const portal = WATCH_PORTALS[side === -1 ? 0 : 1];
      const hp = this.day < 3 ? 2 : Math.min(5, 3 + Math.floor((this.day - 3) / 4));
      this.raiders.push({ side, x: portal.x, stride: 0, hp, attackAt: 0, struckAt: WATCH_NO_ACTION });
    }
    for (const raider of this.raiders) this.moveRaider(raider);
    if (this.signal <= 0) {
      this.status = 'lost';
      this.message = `The ${WATCH_ENEMY_NAME} extinguished the signal. Start a new watch to try again.`;
      return;
    }
    this.fireGuards();
    this.raiders = this.raiders.filter((raider) => {
      if (raider.hp > 0) return true;
      if (this.loot.length < 60) this.loot.push({ x: raider.x, amount: 1 });
      return false;
    });
    if (this.phaseTick >= WATCH_NIGHT || (this.phaseTick > TICKS_PER_SECOND * 6
        && this.queue.length === 0 && this.raiders.length === 0)) this.finishNight();
  }

  moveRaider(raider) {
    const post = watchOpusWall(raider, this.posts);
    const target = post?.wallX ?? WATCH_SIGNAL;
    const distance = Math.abs(raider.x - target);
    if (distance > WATCH_OPUS_REACH) {
      const speed = 1.58 + 0.18 * Math.sin(this.tick / 16 + raider.x / 36);
      raider.x += Math.sign(target - raider.x) * Math.min(distance - WATCH_OPUS_REACH, speed);
      raider.stride++;
    } else if (this.tick >= raider.attackAt) {
      raider.struckAt = this.tick;
      raider.attackAt = this.tick + (post ? 44 : 36);
      if (post) {
        post.health--;
        if (post.health === 0) this.message = `${post.name} palisade fell. ${WATCH_ENEMY_NAME} are heading for the signal.`;
      } else {
        this.signal = Math.max(0, this.signal - 1);
      }
    }
  }

  guardX(post, index) {
    return post.wallX - post.side * (17 + index * 8);
  }

  guardPosition(post, index) {
    return post.guards[index].x ?? this.guardX(post, index);
  }

  patrolGuards() {
    const dusk = this.phaseTick >= WATCH_DAY - 10 * TICKS_PER_SECOND;
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => {
        const home = this.guardX(post, index);
        if (!dusk && this.tick - guard.shotAt < 9) {
          guard.walking = false;
          return;
        }
        const outer = post.wallX + post.side * (151 + index * 8);
        const target = dusk || guard.returning ? home : outer;
        walkWatchGuard(guard, this.guardPosition(post, index), target, 1.1);
        const from = this.guardPosition(post, index);
        if (from === target) guard.returning = !dusk && target === outer;
        if (dusk || Math.abs(from - home) < 21 || guard.fireAt > this.tick) return;

        for (const [bird, pigeon] of WATCH_PIGEONS.entries()) {
          if (pigeon.side !== post.side || (this.huntedPigeons & (1 << bird))) continue;
          const { x: to } = watchPigeonPose(pigeon, this.tick);
          if (Math.abs(to - from) > 42) continue;
          this.huntedPigeons |= 1 << bird;
          if (this.loot.length < 60) this.loot.push({ x: to, amount: 1 });
          this.shootWatchArrow(guard, from, to, 44, 'pigeon');
          this.message = 'A guard hunted a pigeon. Pick up the copper it dropped.';
          break;
        }
      });
    }
  }

  shootWatchArrow(guard, from, to, cooldown, kind) {
    guard.direction = Math.sign(to - from) || guard.direction;
    guard.shotAt = this.tick;
    guard.fireAt = this.tick + cooldown;
    this.shots.push({ from, to, end: this.tick + 9, kind });
  }

  fireGuards() {
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => {
        if (guard.fireAt > this.tick) return;
        const from = this.guardPosition(post, index);
        const { range, damage, cooldown } = WATCH_GUARD_STATS[guard.rank];
        let target;
        let closest = Infinity;
        for (const raider of this.raiders) {
          if (raider.hp <= 0 || raider.side !== post.side || Math.abs(raider.x - from) > range) continue;
          const distance = Math.abs(raider.x - WATCH_SIGNAL);
          if (distance >= closest) continue;
          target = raider;
          closest = distance;
        }
        if (!target) return;
        target.hp -= damage;
        this.shootWatchArrow(guard, from, target.x, cooldown, 'raid');
      });
    }
  }
}
