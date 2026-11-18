import { START_VIEW, VIEW_WIDTH, TICKS_PER_SECOND, quarryHeight } from './simulation.js';

export const WATCH_NIGHTS = 5;
export const WATCH_SIGNAL = START_VIEW + 84;
export const WATCH_BRIDGE = { left: START_VIEW + 111, right: START_VIEW + 281, y: 112 };
export const WATCH_BOUNDS = { left: START_VIEW - 205, right: START_VIEW + 505 };
export const WATCH_HEALTH = 10;
const WATCH_DAY = 32 * TICKS_PER_SECOND;
const WATCH_NIGHT = 27 * TICKS_PER_SECOND;
const WATCH_USE_RANGE = 19;
const WATCH_SPEED = 1.65;
const WATCH_CACHES = [-150, -108, -67, -18, 18, 74, 138, 210, 254, 304, 358]
  .map((offset) => WATCH_SIGNAL + offset);
const WATCH_POSTS = [
  { side: -1, name: 'West', wallX: START_VIEW + 28, campX: START_VIEW - 32 },
  { side: 1, name: 'East', wallX: START_VIEW + 322, campX: START_VIEW + 276 }
];

export function watchGround(x) {
  if (x >= WATCH_BRIDGE.left && x <= WATCH_BRIDGE.right) return WATCH_BRIDGE.y;
  return quarryHeight(Math.round(x));
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

  get camera() {
    return Math.round(Math.max(WATCH_BOUNDS.left - 12,
      Math.min(WATCH_BOUNDS.right - VIEW_WIDTH + 12, this.player.x - VIEW_WIDTH / 2)));
  }

  start() {
    if (this.status !== 'ready') return false;
    this.status = 'running';
    this.message = 'Walk over copper coins to pick them up.';
    return true;
  }

  getAction() {
    if (this.status !== 'running') return null;
    const player = this.player.x;
    const atSignal = Math.abs(player - WATCH_SIGNAL) <= WATCH_USE_RANGE;
    if (atSignal && this.phase === 'day') {
      if (this.signal < WATCH_HEALTH) return { kind: 'signal', label: 'Repair signal house', cost: 3 };
      return { kind: 'bell', label: 'Ring the dusk bell', cost: 0 };
    }
    for (const post of this.posts) {
      if (Math.abs(player - post.wallX) <= WATCH_USE_RANGE) {
        if (!post.health) return { kind: 'build', post, label: `Build ${post.name.toLowerCase()} palisade`, cost: 4 };
        if (post.health < this.maxWall(post)) return { kind: 'repair', post, label: 'Repair palisade', cost: 2 };
        if (post.tier === 1) return { kind: 'reinforce', post, label: 'Reinforce palisade', cost: 5 };
      }
      if (Math.abs(player - post.campX) <= WATCH_USE_RANGE && post.guards.length < 3) {
        return { kind: 'hire', post, label: `Hire ${post.name.toLowerCase()} guard`, cost: 3 };
      }
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
      if (this.status === 'running') this.message = 'Walk up to a palisade, hiring lantern, or the signal house.';
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
        this.message = 'Signal house repaired. Ring the bell when you’re ready.';
        break;
      case 'hire':
        post.guards.push({ fireAt: this.tick + 10 + post.guards.length * 8 });
        this.message = `${post.name} guard hired.`;
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
    for (let index = 0; index < this.day + 1; index++) {
      for (const post of this.posts) {
        this.queue.push({ side: post.side, due: 44 + index * 46 + (post.side === 1 ? 22 : 0) });
      }
    }
    this.message = `Night ${this.day}. Tri raiders are approaching both banks.`;
  }

  finishNight() {
    this.raiders.length = 0;
    this.queue.length = 0;
    if (this.day === WATCH_NIGHTS) {
      this.status = 'won';
      this.message = 'The signal stayed lit through all five nights.';
      return;
    }
    this.day++;
    this.phase = 'day';
    this.phaseTick = 0;
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
      return;
    }
    while (this.queue[0]?.due <= this.phaseTick) {
      const { side } = this.queue.shift();
      this.raiders.push({ side, x: side === -1 ? WATCH_BOUNDS.left + 2 : WATCH_BOUNDS.right - 2,
        hp: this.day < 3 ? 2 : 3, attackAt: 0 });
    }
    for (const raider of this.raiders) this.moveRaider(raider);
    if (this.signal <= 0) {
      this.status = 'lost';
      this.message = 'The raiders extinguished the signal. Start a new watch to try again.';
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
    const post = this.posts[raider.side === -1 ? 0 : 1];
    const outsideWall = (raider.x - post.wallX) * raider.side >= 0;
    const blocked = outsideWall && post.health > 0;
    const target = blocked ? post.wallX : WATCH_SIGNAL;
    const distance = Math.abs(raider.x - target);
    if (distance > 5) {
      raider.x += Math.sign(target - raider.x) * Math.min(distance - 5, 1.12 + this.day * 0.13);
    } else if (this.tick >= raider.attackAt) {
      raider.attackAt = this.tick + (blocked ? 38 : 31);
      if (blocked) {
        post.health--;
        if (post.health === 0) this.message = `${post.name} palisade fell. Raiders are heading for the signal.`;
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
        const target = this.raiders.find((raider) =>
          raider.side === post.side && raider.hp > 0 && Math.abs(raider.x - from) < 61);
        if (!target) return;
        target.hp--;
        guard.fireAt = this.tick + 27;
        this.shots.push({ from, to: target.x, end: this.tick + 9 });
      });
    }
  }
}
