import { START_VIEW, VIEW_WIDTH, WIDTH, TICKS_PER_SECOND, DAY_TICKS, NIGHT_TICKS, TRI_PORTAL_OPEN_TICKS, quarryHeight } from './simulation.js';

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
export const WATCH_WISP_REACH = 12;
const WATCH_NO_ACTION = -TICKS_PER_SECOND;
const WATCH_GUARD_STATS = [
  { range: 88, damage: 1, cooldown: 22 },
  { range: 112, damage: 2, cooldown: 19 }
];
const WATCH_USE_RANGE = 19;
const WATCH_SPEED = 2.05;
const WATCH_POSTS = [
  { side: -1, name: 'West', wallX: WATCH_BRIDGE.left - 44 },
  { side: 1, name: 'East', wallX: WATCH_BRIDGE.right + 44 }
];
export const WATCH_CAMPS = [{ x: WATCH_BRIDGE.left - 86, side: -1 }];
const WATCH_CACHES = [36, 82, 144, 208, 312, 446, 630, 740, 798, 857, 917]
  .flatMap((distance) => [WATCH_SIGNAL - distance, WATCH_SIGNAL + distance]);

export function watchGround(x) {
  if (x >= WATCH_BRIDGE.left && x <= WATCH_BRIDGE.right) return WATCH_BRIDGE.y;
  return quarryHeight(Math.round(x));
}

export function watchWispWall(wisp, posts) {
  const post = posts[wisp.side === -1 ? 0 : 1];
  return post.health > 0 && (wisp.x - post.wallX) * wisp.side >= 0 ? post : null;
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
    this.message = 'The tent marker leads to the camp beside the lake bridge. Guards alternate west and east.';
    return true;
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
    if (camp) return this.getCampAction();
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
      if (this.status === 'running') this.message = 'Walk up to the camp, a palisade, or the signal tower. Each bank can hold three veterans.';
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
    this.message = `Night ${this.day}. Ichor Wisps are coming through both portals.`;
  }

  finishNight() {
    this.raiders.length = 0;
    this.queue.length = 0;
    this.phase = 'day';
    this.phaseTick = 0;
    this.day++;
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
      else if (this.phaseTick === WATCH_DAY - 10 * TICKS_PER_SECOND) {
        this.message = 'Dusk in 10 seconds. The edge portals are about to open.';
      }
      return;
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
      this.message = 'The wisps extinguished the signal. Start a new watch to try again.';
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
    const post = watchWispWall(raider, this.posts);
    const target = post?.wallX ?? WATCH_SIGNAL;
    const distance = Math.abs(raider.x - target);
    if (distance > WATCH_WISP_REACH) {
      const speed = 1.58 + 0.18 * Math.sin(this.tick / 16 + raider.x / 36);
      raider.x += Math.sign(target - raider.x) * Math.min(distance - WATCH_WISP_REACH, speed);
      raider.stride++;
    } else if (this.tick >= raider.attackAt) {
      raider.struckAt = this.tick;
      raider.attackAt = this.tick + (post ? 44 : 36);
      if (post) {
        post.health--;
        if (post.health === 0) this.message = `${post.name} palisade fell. Wisps are heading for the signal.`;
      } else {
        this.signal = Math.max(0, this.signal - 1);
      }
    }
  }

  guardX(post, index) {
    return post.wallX - post.side * (17 + index * 8);
  }

  fireGuards() {
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => {
        if (guard.fireAt > this.tick) return;
        const from = this.guardX(post, index);
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
        guard.direction = Math.sign(target.x - from) || guard.direction;
        guard.shotAt = this.tick;
        guard.fireAt = this.tick + cooldown;
        this.shots.push({ from, to: target.x, end: this.tick + 9 });
      });
    }
  }
}
