import { START_VIEW, VIEW_WIDTH, WIDTH, TICKS_PER_SECOND, DAY_TICKS, NIGHT_TICKS, TRI_PORTAL_OPEN_TICKS, CREATURES, quarryHeight } from './simulation.js';

export const WATCH_BRIDGE = { left: START_VIEW + 111, right: START_VIEW + 281, y: 112 };
export const WATCH_SIGNAL = (WATCH_BRIDGE.left + WATCH_BRIDGE.right) / 2;
export const WATCH_TOWER_BUILDING = { width: 72, height: 96, wall: 4 };
export const WATCH_TOWER_ROOM_LAYOUT = 2;
export const WATCH_TOWER_ROOM = {
  left: 6, right: 74, door: 40, ground: 52,
  width: 80, height: 58, scale: 3
};
export const WATCH_TOWER_CHAIRS = [
  { id: 'left-end', label: 'Left end chair', x: 6, direction: 1, front: false },
  { id: 'left-front', label: 'Left table chair', x: 26, direction: 1, front: true },
  { id: 'right-front', label: 'Right table chair', x: 54, direction: -1, front: true },
  { id: 'right-end', label: 'Right end chair', x: 74, direction: -1, front: false }
];
export const WATCH_BOUNDS = { left: 0, right: WIDTH - 1 };
export const WATCH_PORTALS = [
  { side: -1, x: WATCH_BOUNDS.left + 26 },
  { side: 1, x: WATCH_BOUNDS.right - 26 }
];
export const WATCH_HEALTH = 10;
export const WATCH_DAY = DAY_TICKS;
export const WATCH_NIGHT = NIGHT_TICKS;
const WATCH_GUARD_POSITIONS = 8;
const WATCH_VETERAN_UNLOCK = 3;
const WATCH_RAIDER_LIMIT = 12;
export const WATCH_ENEMY_NAME = CREATURES.opus;
export const WATCH_OPUS_REACH = 12;
export const WATCH_SWING_TICKS = 10;
export const WATCH_FIRST_FLYER_NIGHT = 40;
export const WATCH_FLYER_HEALTH = 8;
export const WATCH_FLYER_ALTITUDE = 42;
export const WATCH_FLYERS_PER_SIDE = 2;
const WATCH_FLYER_CRAWL_TICKS = 72;
const WATCH_FLYER_FLIGHT_TICKS = 90;
const WATCH_FIRST_SPRAYER_NIGHT = 20;
const WATCH_RECURRING_SPRAYER_NIGHT = 30;
export const WATCH_SPRAYER_HEALTH = 24;
export const WATCH_SPRAYER_BURSTS = 3;
export const WATCH_SPRAY_FLIGHT = 26;
export const WATCH_SPRAY_SPLASH = 14;
export const WATCH_SPRAY_REACH = 78;
const WATCH_SPRAYER_DUE = TRI_PORTAL_OPEN_TICKS + 52;
const WATCH_SPRAYER_REACH = 32;
const WATCH_NO_ACTION = -TICKS_PER_SECOND;
const WATCH_GUARD_STATS = [
  { range: 88, damage: 1, cooldown: 22 },
  { range: 112, damage: 2, cooldown: 19 }
];
const WATCH_USE_RANGE = 19;
const WATCH_SPEED = 2.05;
const WATCH_GUARD_SPEED = 1.1;
const WATCH_GUARD_RETURN_SPEED = 1.35;
const WATCH_GUARD_RETURN_MARGIN = 9;
const CAMP_APPROACH_RANGE = 120;
const CAMP_CLEARANCE_RANGE = 92;
const CAMP_RETREAT_DISTANCE = 32;
const WATCH_POSTS = [
  { side: -1, name: 'West', wallX: WATCH_BRIDGE.left - 44 },
  { side: 1, name: 'East', wallX: WATCH_BRIDGE.right + 44 }
];
export const WATCH_FORWARD_WALLS = WATCH_POSTS.map(({ side, name, wallX }) =>
  ({ side, name: `${name} forward`, wallX: wallX + side * 82, forward: true }));
export const WATCH_VENDORS = [
  { id: 'tools', name: 'Rowan', trade: 'Tool seller', x: WATCH_SIGNAL + 59 },
  { id: 'arms', name: 'Bram', trade: 'Weaponsmith', x: WATCH_SIGNAL + 98 }
];
export const WATCH_MARKET_ITEMS = {
  sword: { vendor: 'tools', name: 'Sword', cost: 5, damage: 2, reach: 23, cooldown: 16 },
  'repair-kit': { vendor: 'tools', name: 'Repair Kit', cost: 4, description: 'Repair palisades for 1 copper.' },
  'copper-sword': { vendor: 'arms', name: 'Copper Sword', cost: 9, damage: 3, reach: 30, cooldown: 14 },
  'copper-hammer': { vendor: 'arms', name: 'Copper Battle Hammer', cost: 12, damage: 4, reach: 25, cooldown: 27, targets: 2 }
};
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

export function hasWatchSprayer(day) {
  return day === WATCH_FIRST_SPRAYER_NIGHT || day >= WATCH_RECURRING_SPRAYER_NIGHT;
}

export function watchTowerTarget(watch, side) {
  return WATCH_SIGNAL + (watch.towerUpgraded ? side * WATCH_TOWER_BUILDING.width / 2 : 0);
}

export function watchRaidWall(raider, posts, forwardWalls = []) {
  const bank = raider.side === -1 ? 0 : 1;
  const forward = forwardWalls[bank];
  if (forward?.health > 0 && (raider.x - forward.wallX) * raider.side >= 0) return forward;
  const post = posts[bank];
  return post.health > 0 && (raider.x - post.wallX) * raider.side >= 0 ? post : null;
}

export function watchIchorLandings(sprayer) {
  const { from, reach } = sprayer.spray;
  return [0.48, 0.74, 1].map((fraction) => Math.round(from - sprayer.side * reach * fraction));
}

export function watchRecruitPose(camp, tick) {
  const phase = (tick + camp.x * 3) % 240;
  if (phase < 128) return { x: 16, direction: 1, walking: false };
  const direction = phase < 184 ? -1 : 1;
  const travel = Math.min(phase - 128, 240 - phase);
  return { x: 16 - Math.round(travel * 22 / 56), direction, walking: true };
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
    this.towerUpgraded = false;
    this.insideTower = false;
    this.seatedChair = null;
    this.towerRoomLayout = WATCH_TOWER_ROOM_LAYOUT;
    this.interiorX = WATCH_TOWER_ROOM.door;
    this.player = { x: WATCH_SIGNAL, direction: 1, step: 0 };
    this.posts = WATCH_POSTS.map((post) => ({ ...post, tier: 0, health: 0, guards: [] }));
    this.forwardWalls = WATCH_FORWARD_WALLS.map((wall) => ({ ...wall, tier: 0, health: 0 }));
    this.gear = [];
    this.weapon = null;
    this.swingAt = WATCH_NO_ACTION;
    this.raiders = [];
    this.sprayers = [];
    this.flyers = [];
    this.flyerQueue = [];
    this.shots = [];
    this.loot = [];
    this.huntedPigeons = 0;
    this.recallingGuards = false;
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

  get bloodMoon() {
    return this.phase === 'night' && this.day % 10 === 0;
  }

  get marketOpen() {
    return this.forwardWalls.every(({ tier }) => tier > 0);
  }

  // Older integrations address the west Sprayer through the singular name.
  get sprayer() { return this.sprayers[0] ?? null; }

  set sprayer(value) {
    if (value === null) this.sprayers = [];
    else if (this.sprayers.length) this.sprayers[0] = value;
    else this.sprayers = [value];
  }

  get enemies() {
    return this.raiders.concat(this.flyers, this.sprayers.filter(({ hp }) => hp > 0));
  }

  get canSwing() {
    const item = WATCH_MARKET_ITEMS[this.weapon];
    return this.status === 'running' && !this.insideTower && item?.damage > 0 && this.tick - this.swingAt >= item.cooldown;
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
    for (const raider of this.enemies) {
      if ((raider.side !== camp.side && !this.flyers.includes(raider)) || raider.hp <= 0) continue;
      // Positive distance means the raider is still on the portal side of the camp.
      const distance = (raider.x - camp.x) * camp.side;
      const remaining = distance >= 0 ? CAMP_APPROACH_RANGE - distance : CAMP_CLEARANCE_RANGE + distance;
      progress = Math.max(progress, remaining / CAMP_RETREAT_DISTANCE);
    }
    return Math.min(1, progress);
  }

  getAction() {
    if (this.status !== 'running') return null;
    if (this.insideTower) {
      if (this.seatedChair !== null) return { kind: 'tower-stand', label: 'Stand up', cost: 0 };
      let chair;
      for (const candidate of WATCH_TOWER_CHAIRS) {
        const distance = Math.abs(candidate.x - this.interiorX);
        if (distance <= 5 && (!chair || distance < Math.abs(chair.x - this.interiorX))) chair = candidate;
      }
      return chair ? { kind: 'tower-sit', chair, label: `Sit on ${chair.label.toLowerCase()}`, cost: 0 }
        : { kind: 'tower-exit', label: 'Leave tower room', cost: 0 };
    }
    const player = this.player.x;
    const atSignal = Math.abs(player - WATCH_SIGNAL) <= WATCH_USE_RANGE;
    if (atSignal && this.phase === 'day') {
      if (this.signal < WATCH_HEALTH) return { kind: 'signal', label: 'Repair signal tower', cost: 3 };
      return { kind: 'bell', label: this.recallingGuards ? 'Waiting for guards to return' : 'Ring the dusk bell', cost: 0 };
    }
    if (this.marketOpen) {
      const vendor = WATCH_VENDORS.find(({ x }) => Math.abs(player - x) <= WATCH_USE_RANGE);
      if (vendor) return { kind: 'market', vendor, label: `Browse ${vendor.name}’s goods`, cost: 0 };
    }
    const camp = WATCH_CAMPS.find(({ x }) => Math.abs(player - x) <= WATCH_USE_RANGE);
    const wall = this.posts.find(({ wallX }) => Math.abs(player - wallX) <= WATCH_USE_RANGE)
      ?? this.forwardWalls.find(({ wallX }) => Math.abs(player - wallX) <= WATCH_USE_RANGE);
    if (wall && (!camp || Math.abs(player - wall.wallX) <= Math.abs(player - camp.x))) {
      if (!wall.tier || (!wall.forward && !wall.health)) {
        return { kind: 'build', post: wall, label: `Build ${wall.name.toLowerCase()} palisade`, cost: wall.forward ? 5 : 4 };
      }
      const repairCost = this.gear.includes('repair-kit') ? 1 : 2;
      if (wall.health < this.maxWall(wall)) return { kind: 'repair', post: wall, label: 'Repair palisade', cost: repairCost };
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

  getTowerAction() {
    if (this.status !== 'running') return null;
    if (this.insideTower) return { kind: 'tower-exit', label: 'Leave tower room', cost: 0 };
    if (this.phase !== 'day' || Math.abs(this.player.x - WATCH_SIGNAL) > WATCH_USE_RANGE) return null;
    return this.towerUpgraded ? { kind: 'tower-enter', label: 'Enter tower room', cost: 0 }
      : { kind: 'tower-upgrade', label: 'Upgrade tower room', cost: 100 };
  }

  getCampAction() {
    const [west, east] = this.posts;
    const post = west.guards.length <= east.guards.length ? west : east;
    return { kind: 'hire', post, label: `Hire ${post.name.toLowerCase()} guard`, cost: 3 };
  }

  getTrainingAction() {
    if (this.getAction()?.kind !== 'hire') return null;
    const recruits = this.posts.reduce((count, { guards }) => count + guards.length, 0);
    if (recruits < WATCH_VETERAN_UNLOCK) return null;
    for (const post of this.posts) {
      const guard = post.guards.find((unit) => unit.rank === 0);
      if (guard) return { kind: 'train', post, guard, label: `Train ${post.name.toLowerCase()} veteran`, cost: 4 };
    }
    return null;
  }

  maxWall(post) {
    return post.tier === 2 ? 11 : 6;
  }

  buyMarketItem(id) {
    const action = this.getAction();
    if (!Object.hasOwn(WATCH_MARKET_ITEMS, id) || action?.kind !== 'market') return false;
    const item = WATCH_MARKET_ITEMS[id];
    if (item.vendor !== action.vendor.id) return false;
    if (!this.gear.includes(id)) {
      if (this.coins < item.cost) {
        this.message = `You need ${item.cost} copper for the ${item.name}.`;
        return false;
      }
      this.coins -= item.cost;
      this.gear.push(id);
    }
    if (item.damage) this.weapon = id;
    this.message = item.damage ? `${item.name} equipped.` : `${item.name} purchased.`;
    return true;
  }

  swing() {
    if (!this.canSwing) return false;
    this.swingAt = this.tick;
    const item = WATCH_MARKET_ITEMS[this.weapon];
    const { x, direction } = this.player;
    const targets = this.raiders.concat(this.flyers).filter((enemy) => enemy.hp > 0
      && (enemy.altitude ?? 0) <= 24 && Math.abs(enemy.x - x) <= item.reach
      && (enemy.x - x) * direction >= 0);
    for (const sprayer of this.sprayers) {
      const distance = (sprayer.x - x) * direction;
      if (sprayer.hp > 0 && distance >= 0 && distance <= item.reach + 23) targets.push(sprayer);
    }
    targets.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
    for (const enemy of targets.slice(0, item.targets ?? 1)) this.damageEnemy(enemy, item.damage);
    this.removeDefeatedOpus();
    return true;
  }

  use(kind) {
    if (this.status === 'ready') return kind === 'train' || kind === 'tower' ? false : this.start();
    const action = kind === 'train' ? this.getTrainingAction()
      : kind === 'tower' ? this.getTowerAction() : this.getAction();
    if (!action) {
      if (this.status === 'running' && kind !== 'train') this.message = 'Walk up to a camp, a palisade, or the signal tower.';
      return false;
    }
    if (action.kind === 'shelter') {
      this.message = 'The recruit will come out when the Tri pass.';
      return false;
    }
    if (action.kind === 'market') return false;
    if (this.coins < action.cost) {
      this.message = `You need ${action.cost} copper for that.`;
      return false;
    }
    const { post } = action;
    this.coins -= action.cost;
    switch (action.kind) {
      case 'tower-upgrade':
        this.towerUpgraded = true;
        this.message = 'Tower room built. You can enter during the day.';
        break;
      case 'tower-enter':
        this.insideTower = true;
        this.seatedChair = null;
        this.interiorX = WATCH_TOWER_ROOM.door;
        this.player.x = WATCH_SIGNAL;
        this.message = 'Walk to a chair and press E to sit. Leave tower room returns outside; the watch is paused indoors.';
        break;
      case 'tower-sit':
        this.seatedChair = action.chair.id;
        this.interiorX = action.chair.x;
        this.player.direction = action.chair.direction;
        this.message = `You sat on the ${action.chair.label.toLowerCase()}. Press E or move to stand up.`;
        break;
      case 'tower-stand':
        this.seatedChair = null;
        this.message = 'You stood up. Use Leave tower room to return outside.';
        break;
      case 'tower-exit':
        this.insideTower = false;
        this.seatedChair = null;
        this.player.x = WATCH_SIGNAL;
        this.message = 'You left the tower room. The watch continues.';
        break;
      case 'bell':
        this.startNight();
        return true;
      case 'signal':
        this.signal = WATCH_HEALTH;
        this.message = 'Signal tower repaired. Ring the bell when you’re ready.';
        break;
      case 'hire':
        post.guards.push({ rank: 0, direction: post.side, fireAt: this.tick + 8, shotAt: WATCH_NO_ACTION, carriedCoins: 0 });
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
        this.message = post.forward && this.marketOpen ? 'Both forward palisades are built. The bridge market is open.'
          : `${post.name} palisade built.`;
        break;
    }
    return true;
  }

  startNight() {
    if (this.insideTower) return false;
    if (!this.posts.every((post) => post.guards.every((guard, index) =>
      this.guardPosition(post, index) === this.guardX(post, index)))) {
      this.recallingGuards = true;
      this.message = 'Guards are returning to their defenses. The portals will open when everyone is home.';
      return false;
    }
    this.recallingGuards = false;
    for (const post of this.posts) {
      for (const guard of post.guards) {
        guard.returning = false;
        guard.walking = false;
      }
    }
    this.phase = 'night';
    this.phaseTick = 0;
    this.queue = [];
    this.flyerQueue = [];
    const raidersPerPortal = Math.min(WATCH_RAIDER_LIMIT, this.day + 1);
    for (const { side } of WATCH_PORTALS) {
      const first = TRI_PORTAL_OPEN_TICKS + 4 + (side === 1 ? 22 : 0);
      for (let index = 0; index < raidersPerPortal; index++) {
        this.queue.push({ side, due: first + index * 46 });
      }
      if (this.day >= WATCH_FIRST_FLYER_NIGHT) {
        for (let index = 0; index < WATCH_FLYERS_PER_SIDE; index++) {
          this.flyerQueue.push({ side, due: TRI_PORTAL_OPEN_TICKS + 110 + index * 220 + (side === 1 ? 18 : 0) });
        }
      }
    }
    this.queue.sort((a, b) => a.due - b.due);
    this.flyerQueue.sort((a, b) => a.due - b.due);
    const event = this.bloodMoon ? 'Blood moon' : 'Night';
    this.message = this.day >= WATCH_FIRST_FLYER_NIGHT
      ? `${event} ${this.day}. Tri Flyers and Ichor Sprayers are coming from both portals. Keep the Flyers off your guards.`
      : hasWatchSprayer(this.day) ? `${event} ${this.day}. Ichor Sprayers are coming from both portals.`
      : `${event} ${this.day}. ${WATCH_ENEMY_NAME} are coming through both portals.`;
    return true;
  }

  finishNight() {
    this.raiders.length = 0;
    this.sprayers.length = 0;
    this.flyers.length = 0;
    this.flyerQueue.length = 0;
    this.queue.length = 0;
    this.phase = 'day';
    this.phaseTick = 0;
    this.day++;
    this.huntedPigeons = 0;
    this.recallingGuards = false;
    for (const post of this.posts) for (const guard of post.guards) guard.returning = false;
    this.coins += 3;
    this.stockCaches();
    this.message = `Dawn of day ${this.day}. You earned 3 copper. Repair and prepare for the next raid.`;
  }

  step(direction = 0) {
    if (this.status !== 'running') return;
    if (this.insideTower) {
      if (direction) {
        this.seatedChair = null;
        this.interiorX = Math.max(WATCH_TOWER_ROOM.left,
          Math.min(WATCH_TOWER_ROOM.right, this.interiorX + direction * WATCH_SPEED));
        this.player.direction = direction;
        this.player.step++;
      }
      return;
    }
    this.tick++;
    this.phaseTick = this.phase === 'day' ? Math.min(WATCH_DAY, this.phaseTick + 1) : this.phaseTick + 1;
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
      if (this.phaseTick >= WATCH_DAY) this.recallingGuards = true;
      if (this.phaseTick === WATCH_DAY - 10 * TICKS_PER_SECOND) {
        this.message = 'Dusk in 10 seconds. The guards are securing their posts.';
      }
      this.patrolGuards();
      if (this.recallingGuards) this.startNight();
      return;
    }
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => walkWatchGuard(guard, this.guardPosition(post, index), this.guardX(post, index), WATCH_GUARD_RETURN_SPEED));
    }
    while (this.queue[0]?.due <= this.phaseTick) {
      const { side } = this.queue.shift();
      const portal = WATCH_PORTALS[side === -1 ? 0 : 1];
      this.spawnOpus(side, portal.x);
    }
    while (this.flyerQueue[0]?.due <= this.phaseTick) {
      const { side } = this.flyerQueue.shift();
      this.spawnFlyer(side, WATCH_PORTALS[side === -1 ? 0 : 1].x);
    }
    for (const raider of this.raiders) this.moveRaider(raider);
    this.stepIchorSprayer();
    for (const flyer of this.flyers) if (flyer.hp > 0) this.moveFlyer(flyer);
    if (this.signal <= 0) {
      this.status = 'lost';
      this.message = 'The raid extinguished the signal. Start a new watch to try again.';
      return;
    }
    this.fireGuards();
    this.removeDefeatedOpus();
    if (this.phaseTick >= WATCH_NIGHT || (this.phaseTick > TICKS_PER_SECOND * 6
        && this.queue.length === 0 && this.flyerQueue.length === 0 && this.raiders.length === 0
        && this.flyers.length === 0 && !this.sprayers.some((sprayer) => sprayer.hp > 0 || sprayer.spray))) this.finishNight();
  }

  spawnOpus(side, x) {
    const hp = this.day < 3 ? 2 : Math.min(5, 3 + Math.floor((this.day - 3) / 4));
    this.raiders.push({ side, x, stride: 0, hp, attackAt: 0, struckAt: WATCH_NO_ACTION });
  }

  moveRaider(raider) {
    if (raider.hp <= 0) return;
    const post = watchRaidWall(raider, this.posts, this.forwardWalls);
    const target = post?.wallX ?? watchTowerTarget(this, raider.side);
    const distance = Math.abs(raider.x - target);
    if (distance > WATCH_OPUS_REACH) {
      const speed = 1.58 + 0.18 * Math.sin(this.tick / 16 + raider.x / 36);
      raider.x += Math.sign(target - raider.x) * Math.min(distance - WATCH_OPUS_REACH, speed);
      raider.stride++;
    } else if (this.tick >= raider.attackAt) {
      raider.struckAt = this.tick;
      raider.attackAt = this.tick + (post ? 44 : 36);
      this.strikeDefense(post, 1);
    }
  }

  spawnFlyer(side, x) {
    if (this.day < WATCH_FIRST_FLYER_NIGHT || this.phase !== 'night'
        || this.flyers.length >= WATCH_FLYERS_PER_SIDE * WATCH_PORTALS.length) return false;
    this.flyers.push({ side, x, hp: WATCH_FLYER_HEALTH, mode: 'crawl', altitude: 0,
      direction: -side, stride: 0, modeAt: this.tick + WATCH_FLYER_CRAWL_TICKS,
      attackAt: 0, struckAt: WATCH_NO_ACTION });
    return true;
  }

  nearestFlyerGuard(x) {
    let target;
    let nearest = Infinity;
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => {
        const position = this.guardPosition(post, index);
        const distance = Math.abs(position - x);
        if (distance >= nearest) return;
        nearest = distance;
        target = { post, guard, x: position };
      });
    }
    return target;
  }

  moveFlyer(flyer) {
    if (flyer.hp <= 0) return;
    if (flyer.mode === 'crawl') {
      const previousX = flyer.x;
      this.moveRaider(flyer);
      flyer.direction = Math.sign(flyer.x - previousX) || flyer.direction;
      if (this.tick < flyer.modeAt) return;
      flyer.mode = 'fly';
      flyer.altitude = 1;
      flyer.modeAt = this.tick + WATCH_FLYER_FLIGHT_TICKS;
      return;
    }

    // Retarget live guard objects, so another bat cannot infect an old roster index.
    const soldier = this.nearestFlyerGuard(flyer.x);
    const wall = watchRaidWall(flyer, this.posts, this.forwardWalls);
    const targetX = soldier?.x ?? wall?.wallX ?? watchTowerTarget(this, flyer.side);
    const distance = targetX - flyer.x;
    flyer.direction = Math.sign(distance) || flyer.direction;
    flyer.x += Math.sign(distance) * Math.min(Math.abs(distance), 2.4);
    flyer.stride++;
    if (flyer.mode === 'fly') {
      flyer.altitude = Math.min(WATCH_FLYER_ALTITUDE, flyer.altitude + 1.4);
      if (this.tick >= flyer.modeAt && Math.abs(targetX - flyer.x) <= 8) {
        flyer.mode = 'dive';
        flyer.modeAt = this.tick;
      }
      return;
    }

    flyer.altitude = Math.max(0, flyer.altitude - 2);
    const touching = soldier && Math.abs(soldier.x - flyer.x) <= 6 && flyer.altitude <= 4;
    if (touching) this.infectGuard(soldier);
    if (touching || flyer.altitude === 0) {
      flyer.mode = 'crawl';
      flyer.altitude = 0;
      flyer.modeAt = this.tick + WATCH_FLYER_CRAWL_TICKS;
    }
  }

  infectGuard({ post, guard, x }) {
    const index = post.guards.indexOf(guard);
    if (index < 0) return false;
    // Preserve each remaining soldier's real position when the roster closes up.
    post.guards.forEach((unit, position) => { unit.x = this.guardPosition(post, position); });
    post.guards.splice(index, 1);
    if (guard.carriedCoins > 0) {
      const pile = this.loot.find((piece) => piece.forPlayer && piece.x === x);
      if (pile) pile.amount += guard.carriedCoins;
      else this.loot.push({ x, amount: guard.carriedCoins, forPlayer: true });
      guard.carriedCoins = 0;
    }
    this.spawnOpus(post.side, x);
    Object.assign(this.raiders.at(-1), { kind: 'infected', rank: guard.rank });
    this.message = 'A Tri Flyer infected a guard. The hunched pink soldier has joined the Tri!';
    return true;
  }

  stepIchorSprayer() {
    if (!hasWatchSprayer(this.day) || this.phaseTick < WATCH_SPRAYER_DUE) return;
    if (!this.sprayers.length) {
      this.sprayers = WATCH_PORTALS.map(({ side, x }) => ({ side, x, hp: WATCH_SPRAYER_HEALTH, attackAt: 0,
        sprayAt: this.tick + 3 * TICKS_PER_SECOND + (side === 1 ? 18 : 0), burstsLeft: WATCH_SPRAYER_BURSTS, spray: null }));
      this.message = 'Ichor Sprayers have emerged from both portals.';
    }
    for (const sprayer of this.sprayers) this.moveIchorSprayer(sprayer);
  }

  moveIchorSprayer(sprayer) {
    if (sprayer.spray) {
      const age = this.tick - sprayer.spray.at;
      if (age < WATCH_SPRAY_FLIGHT) return;
      if (age === WATCH_SPRAY_FLIGHT) {
        for (const landing of watchIchorLandings(sprayer)) this.spawnOpus(sprayer.side, landing);
      }
      if (age >= WATCH_SPRAY_FLIGHT + WATCH_SPRAY_SPLASH) sprayer.spray = null;
    }
    if (sprayer.hp === 0) return;

    const post = watchRaidWall(sprayer, this.posts, this.forwardWalls);
    const target = post?.wallX ?? watchTowerTarget(this, sprayer.side);
    const distance = Math.abs(sprayer.x - target);
    if (sprayer.burstsLeft && this.tick >= sprayer.sprayAt) {
      const reach = Math.max(0, Math.min(WATCH_SPRAY_REACH, distance - WATCH_OPUS_REACH));
      sprayer.spray = { from: sprayer.x, reach, at: this.tick };
      sprayer.sprayAt = this.tick + 5 * TICKS_PER_SECOND;
      sprayer.burstsLeft--;
    } else if (distance > WATCH_SPRAYER_REACH) {
      const speed = 1.14 + 0.47 * Math.sin(this.tick / 8);
      sprayer.x += Math.sign(target - sprayer.x) * Math.min(distance - WATCH_SPRAYER_REACH, speed);
    } else if (this.tick >= sprayer.attackAt) {
      this.strikeDefense(post, 2);
      sprayer.attackAt = this.tick + 74;
    }
  }

  strikeDefense(post, damage) {
    if (post) {
      post.health = Math.max(0, post.health - damage);
      if (!post.health) this.message = `${post.name} palisade fell. The raid is heading for the signal.`;
    } else {
      this.signal = Math.max(0, this.signal - damage);
    }
  }

  guardX(post, index) {
    const forward = this.forwardWalls[post.side === -1 ? 0 : 1];
    const wallX = forward.health ? forward.wallX : post.wallX;
    return wallX - post.side * (17 + (index % WATCH_GUARD_POSITIONS) * 8);
  }

  guardPosition(post, index) {
    return post.guards[index].x ?? this.guardX(post, index);
  }

  patrolGuards() {
    const claimed = new Set();
    const remaining = WATCH_DAY - this.phaseTick;
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => {
        const home = this.guardX(post, index);
        const position = this.guardPosition(post, index);
        this.collectGuardCoins(guard, position);
        this.dropGuardCoins(guard, position);
        const returnTicks = Math.ceil(Math.abs(position - home) / WATCH_GUARD_RETURN_SPEED);
        const mustReturn = this.recallingGuards || remaining <= returnTicks + WATCH_GUARD_RETURN_MARGIN;
        if (mustReturn) {
          guard.returning = true;
          walkWatchGuard(guard, position, home, WATCH_GUARD_RETURN_SPEED);
          this.collectGuardCoins(guard, this.guardPosition(post, index));
          this.dropGuardCoins(guard, this.guardPosition(post, index));
          return;
        }
        if (guard.carriedCoins > 0) {
          // A moving player may make delivery unsafe; keep the bag and head home.
          const delivering = this.canGuardVisit(position, this.player.x, home);
          guard.returning = !delivering;
          walkWatchGuard(guard, position, delivering ? this.player.x : home,
            delivering ? WATCH_GUARD_SPEED : WATCH_GUARD_RETURN_SPEED);
          const from = this.guardPosition(post, index);
          this.collectGuardCoins(guard, from);
          this.dropGuardCoins(guard, from);
          return;
        }
        if (this.tick - guard.shotAt < 9) {
          guard.walking = false;
          return;
        }
        // Claim actual loot objects, so collection or player pickups cannot shift target indexes.
        let piece;
        let nearest = Infinity;
        for (const coin of this.loot) {
          const distance = Math.abs(coin.x - position);
          if (coin.forPlayer || claimed.has(coin) || distance >= nearest || !this.canGuardVisit(position, coin.x, home)) continue;
          piece = coin;
          nearest = distance;
        }
        if (piece) claimed.add(piece);
        const outer = post.wallX + post.side * (151 + (index % WATCH_GUARD_POSITIONS) * 8);
        const target = piece ? piece.x : !guard.returning && this.canGuardVisit(position, outer, home) ? outer : home;
        walkWatchGuard(guard, position, target, WATCH_GUARD_SPEED);
        const from = this.guardPosition(post, index);
        this.collectGuardCoins(guard, from);
        this.dropGuardCoins(guard, from);
        if (piece) guard.returning = false;
        else if (from === target) guard.returning = target === outer;
        if (Math.abs(from - home) < 21 || guard.fireAt > this.tick) return;

        for (const [bird, pigeon] of WATCH_PIGEONS.entries()) {
          if (pigeon.side !== post.side || (this.huntedPigeons & (1 << bird))) continue;
          const { x: to } = watchPigeonPose(pigeon, this.tick);
          if (Math.abs(to - from) > 42) continue;
          this.huntedPigeons |= 1 << bird;
          if (this.loot.length < 60) this.loot.push({ x: to, amount: 1 });
          this.shootWatchArrow(guard, from, to, 44, 'pigeon');
          this.message = 'A guard hunted a pigeon. Guards will bring its copper to you.';
          break;
        }
      });
    }
  }

  canGuardVisit(from, target, home) {
    const travel = Math.ceil(Math.abs(target - from) / WATCH_GUARD_SPEED);
    const back = Math.ceil(Math.abs(target - home) / WATCH_GUARD_RETURN_SPEED);
    return travel + back + WATCH_GUARD_RETURN_MARGIN < WATCH_DAY - this.phaseTick;
  }

  collectGuardCoins(guard, x) {
    let amount = 0;
    this.loot = this.loot.filter((piece) => {
      if (piece.forPlayer || Math.abs(piece.x - x) > 6) return true;
      amount += piece.amount;
      return false;
    });
    if (amount) {
      guard.carriedCoins = (guard.carriedCoins ?? 0) + amount;
      if (!this.recallingGuards) this.message = `A guard picked up ${amount} copper and will bring it to you.`;
    }
  }

  dropGuardCoins(guard, x) {
    const amount = guard.carriedCoins;
    if (!(amount > 0) || Math.abs(x - this.player.x) > 6) return;
    const pile = this.loot.find((piece) => piece.forPlayer && piece.x === this.player.x);
    if (pile) pile.amount += amount;
    else this.loot.push({ x: this.player.x, amount, forPlayer: true });
    guard.carriedCoins = 0;
    this.message = `A guard dropped ${amount} copper at your feet.`;
  }

  shootWatchArrow(guard, from, to, cooldown, kind, altitude = 0) {
    guard.direction = Math.sign(to - from) || guard.direction;
    guard.shotAt = this.tick;
    guard.fireAt = this.tick + cooldown;
    this.shots.push({ from, to, end: this.tick + 9, kind, ...(altitude > 0 ? { altitude } : {}) });
  }

  damageEnemy(enemy, damage) {
    const alive = enemy.hp > 0;
    enemy.hp = Math.max(0, enemy.hp - damage);
    if (alive && this.sprayers.includes(enemy) && !enemy.hp) {
      if (this.loot.length < 60) this.loot.push({ x: enemy.x, amount: 6 });
      this.message = 'The Ichor Sprayer fell and dropped 6 copper.';
    }
  }

  removeDefeatedOpus() {
    this.raiders = this.raiders.filter((raider) => {
      if (raider.hp > 0) return true;
      if (this.loot.length < 60) this.loot.push({ x: raider.x, amount: 1 });
      return false;
    });
    this.flyers = this.flyers.filter((flyer) => {
      if (flyer.hp > 0) return true;
      if (this.loot.length < 60) this.loot.push({ x: flyer.x, amount: 2 });
      return false;
    });
  }

  fireGuards() {
    const enemies = this.enemies;
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => {
        if (guard.fireAt > this.tick) return;
        const from = this.guardPosition(post, index);
        const { range, damage, cooldown } = WATCH_GUARD_STATS[guard.rank];
        let target;
        let closest = Infinity;
        for (const raider of enemies) {
          if (raider.hp <= 0 || (raider.side !== post.side && !this.flyers.includes(raider))
              || Math.hypot(raider.x - from, raider.altitude ?? 0) > range) continue;
          const distance = Math.abs(raider.x - WATCH_SIGNAL);
          if (distance >= closest) continue;
          target = raider;
          closest = distance;
        }
        if (!target) return;
        this.damageEnemy(target, damage);
        this.shootWatchArrow(guard, from, target.x, cooldown, 'raid', target.altitude ?? 0);
      });
    }
  }
}
