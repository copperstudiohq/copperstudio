import { START_VIEW, VIEW_WIDTH, WIDTH, TICKS_PER_SECOND, DAY_TICKS, NIGHT_TICKS, TRI_PORTAL_OPEN_TICKS, CREATURES, quarryHeight } from './simulation.js';

export const WATCH_BRIDGE = { left: START_VIEW + 111, right: START_VIEW + 281, y: 112 };
export const WATCH_SIGNAL = (WATCH_BRIDGE.left + WATCH_BRIDGE.right) / 2;
export const WATCH_SIGNAL_TENT_COST = 7;
export const WATCH_SIGNAL_TOWER_COST = 100;
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
export const WATCH_PLAYER_HEALTH = 5;
export const WATCH_COIN_TOSS_TICKS = 14;
const WATCH_HURT_COOLDOWN = TICKS_PER_SECOND;
export const WATCH_DAY = DAY_TICKS;
export const WATCH_NIGHT = NIGHT_TICKS;
export const WATCH_AIM_SEED = 0x43524545;
export const WATCH_ARROW_GRAVITY = 0.22;
export const WATCH_ARROW_LIFETIME = 180;
export const WATCH_ARROW_STICK_TICKS = 18;
export const WATCH_WALL_TOWER_COST = 200;
export const WATCH_WALL_TOWER_HEALTH = 30;
export const WATCH_WALL_TOWER_PLATFORM = 32;
export const WATCH_BUILDER_COST = 3;
export const WATCH_BUILDER_REPAIR_TICKS = 2 * TICKS_PER_SECOND;
export const WATCH_BUILDER_UPGRADE_TICKS = 4 * TICKS_PER_SECOND;
export const WATCH_BUILDER_REPAIR_IDS = Object.freeze(['west-wall', 'east-wall', 'west-forward', 'east-forward', 'signal']);
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
export const WATCH_TREE_HITS = 3;
export const WATCH_TREE_FALL_TICKS = 24;
export const WATCH_WOOD_PRICE = 2;
const WATCH_TREE_RANGE = 13;
const WATCH_CHOP_INTERVAL = 8;
export const WATCH_TREES = [86, 150, 211, 276, 340, 456, 574, 633, 693, 777, 868,
  1135, 1215, 1269, 1321, 1417, 1508, 1567, 1626, 1684, 1741, 1819].map((x, index) => ({
  x, height: 58 + (index * 11 % 22), wood: 3 + index % 3
}));
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

function arrowBoxEntry(x, y, nextX, nextY, left, top, right, bottom) {
  let enter = 0, leave = 1;
  for (const [start, change, min, max] of [[x, nextX - x, left, right], [y, nextY - y, top, bottom]]) {
    if (Math.abs(change) < 1e-9) {
      if (start < min || start > max) return null;
      continue;
    }
    const first = (min - start) / change, last = (max - start) / change;
    enter = Math.max(enter, Math.min(first, last));
    leave = Math.min(leave, Math.max(first, last));
    if (enter > leave) return null;
  }
  return enter;
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
    this.wood = 0;
    this.treeCuts = {};
    this.signal = WATCH_HEALTH;
    this.playerHealth = WATCH_PLAYER_HEALTH;
    this.playerHurtAt = WATCH_NO_ACTION;
    this.signalTent = false;
    this.towerUpgraded = false;
    this.insideTower = false;
    this.seatedChair = null;
    this.towerRoomLayout = WATCH_TOWER_ROOM_LAYOUT;
    this.interiorX = WATCH_TOWER_ROOM.door;
    this.player = { x: WATCH_SIGNAL, direction: 1, step: 0 };
    this.posts = WATCH_POSTS.map((post) => ({ ...post, tier: 0, health: 0, guards: [] }));
    this.forwardWalls = WATCH_FORWARD_WALLS.map((wall) => ({ ...wall, tier: 0, health: 0 }));
    this.builders = [];
    this.builderOrder = 'idle';
    this.builderPaidRepairs = [];
    this.gear = [];
    this.weapon = null;
    this.swingAt = WATCH_NO_ACTION;
    this.raiders = [];
    this.sprayers = [];
    this.flyers = [];
    this.flyerQueue = [];
    this.shots = [];
    this.aimSeed = WATCH_AIM_SEED;
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
      if (this.signal < WATCH_HEALTH) return { kind: 'signal', label: `Repair ${this.signalName.toLowerCase()}`,
        cost: this.builderPaidRepairs.includes('signal') ? 0 : 3 };
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
      const fundedRepair = this.builderPaidRepairs.includes(this.builderRepairId(wall));
      if (!wall.tier || (!wall.forward && !wall.health && wall.tier < 3 && !fundedRepair)) {
        return { kind: 'build', post: wall, label: `Build ${wall.name.toLowerCase()} palisade`, cost: wall.forward ? 5 : 4 };
      }
      const repairCost = fundedRepair ? 0 : this.gear.includes('repair-kit') ? 1 : 2;
      if (wall.health < this.maxWall(wall)) return { kind: 'repair', post: wall,
        label: wall.tier === 3 ? 'Repair wall tower' : 'Repair palisade', cost: repairCost };
      if (wall.tier === 1) return { kind: 'reinforce', post: wall, label: 'Reinforce palisade', cost: 5 };
      if (wall.tier === 2) return { kind: 'wall-tower', post: wall, label: 'Build wall tower', cost: WATCH_WALL_TOWER_COST };
    }
    if (camp) {
      if (this.campShelterProgress(camp) > 0) {
        return { kind: 'shelter', label: 'Recruit taking shelter', cost: 0 };
      }
      return this.getCampAction();
    }
    const tree = WATCH_TREES.find(({ x }) => Math.abs(player - x) <= WATCH_TREE_RANGE
      && (this.treeCuts[x]?.hits ?? 0) < WATCH_TREE_HITS);
    if (tree) return { kind: 'chop', tree, label: 'Chop birch', cost: 0 };
    return null;
  }

  get signalName() {
    if (this.towerUpgraded) return 'Signal tower';
    return this.signalTent ? 'Signal tent' : 'Blue campfire';
  }

  getTowerAction() {
    if (this.status !== 'running') return null;
    if (this.insideTower) return { kind: 'tower-exit', label: 'Leave tower room', cost: 0 };
    if (this.phase !== 'day' || Math.abs(this.player.x - WATCH_SIGNAL) > WATCH_USE_RANGE) return null;
    if (this.towerUpgraded) return { kind: 'tower-enter', label: 'Enter tower room', cost: 0 };
    return this.signalTent ? { kind: 'tower-upgrade', label: 'Build signal tower', cost: WATCH_SIGNAL_TOWER_COST }
      : { kind: 'signal-tent', label: 'Build signal tent', cost: WATCH_SIGNAL_TENT_COST };
  }

  getCampAction() {
    const [west, east] = this.posts;
    const post = west.guards.length <= east.guards.length ? west : east;
    return { kind: 'hire', post, label: `Hire ${post.name.toLowerCase()} guard`, cost: 3 };
  }

  getBuilderAction() {
    if (this.getAction()?.kind !== 'hire') return null;
    let camp;
    for (const candidate of WATCH_CAMPS) {
      const distance = Math.abs(candidate.x - this.player.x);
      if (distance <= WATCH_USE_RANGE && this.campShelterProgress(candidate) === 0
          && (!camp || distance < Math.abs(camp.x - this.player.x))) camp = candidate;
    }
    if (!camp) return null;
    const west = this.builders.filter(({ side }) => side === -1).length;
    const post = this.posts[west <= this.builders.length - west ? 0 : 1];
    return { kind: 'hire-builder', post, camp, label: `Hire ${post.name.toLowerCase()} builder`, cost: WATCH_BUILDER_COST };
  }

  setBuilderOrder(order) {
    if (!['repair', 'upgrade', 'idle'].includes(order)) {
      this.message = 'Tell builders “fix walls”, “upgrade walls” or “stop work”.';
      return false;
    }
    if (this.status !== 'running' || this.insideTower) {
      this.message = 'Give builder orders outside in a running watch.';
      return false;
    }
    if (!this.builders.length) {
      this.message = 'Hire a builder at a recruiting camp before giving an order.';
      return false;
    }
    if (this.builderOrder !== order) {
      for (const builder of this.builders) {
        builder.working = false;
        builder.workAt = this.tick;
      }
    }
    this.builderOrder = order;
    if (order === 'idle') {
      this.builders.forEach((builder, index) => {
        builder.working = false;
        builder.returning = builder.x !== this.builderHome(builder, index);
        builder.walking = builder.returning;
        builder.workAt = this.tick;
      });
    }
    this.message = order === 'upgrade'
      ? `Builders ordered to repair, then upgrade existing walls by day: 5 copper to reinforce and ${WATCH_WALL_TOWER_COST} for a wall tower. Upgrades are paid after four seconds of work at the wall.`
      : order === 'repair'
      ? `Builders ordered to repair existing defenses by day. Each wall job costs ${this.gear.includes('repair-kit') ? 1 : 2} copper; the signal tower costs 3. Payment is due when work first restores health.`
      : 'Builders stopped working and are returning home. Unfinished paid repairs keep their credit.';
    return true;
  }

  orderBuilders(input) {
    if (typeof input !== 'string' || input.length > 120) {
      this.message = 'Use a builder command of up to 120 characters: “fix walls”, “upgrade walls” or “stop work”.';
      return false;
    }
    const command = input.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
    const workWords = /\b(?:fix|fixing|repair|repairs|repairing|upgrade|upgrades|upgrading)\b/.test(command);
    const negative = /\b(?:do not|dont|not|never|no|cancel)\b/.test(command);
    if (/\b(?:stop (?:work|fixing|repair|repairs|repairing|upgrade|upgrades|upgrading)|return home)\b/.test(command)
        || /^(?:please )?(?:wait|stop)$/.test(command) || workWords && negative) return this.setBuilderOrder('idle');
    if (/\b(?:upgrade (?:all |the |our )?walls|auto upgrade)\b/.test(command)) return this.setBuilderOrder('upgrade');
    if (/\b(?:fix|repair) (?:all |the |our )?(?:walls|defenses|defences|stuff|stuf)\b/.test(command)) return this.setBuilderOrder('repair');
    this.message = 'Tell builders “fix walls”, “upgrade walls” or “stop work”.';
    return false;
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
    return post.tier === 3 ? WATCH_WALL_TOWER_HEALTH : post.tier === 2 ? 11 : 6;
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

  sellWood(amount) {
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > this.wood || this.getAction()?.kind !== 'market') return false;
    const proceeds = amount * WATCH_WOOD_PRICE;
    if (!Number.isSafeInteger(this.coins + proceeds)) return false;
    this.wood -= amount;
    this.coins += proceeds;
    this.message = `Sold ${amount} wood for ${proceeds} copper.`;
    return true;
  }

  chopTree(tree) {
    const cut = this.treeCuts[tree.x];
    if (cut && (cut.hits >= WATCH_TREE_HITS || this.tick - cut.at < WATCH_CHOP_INTERVAL)) return false;
    const hits = (cut?.hits ?? 0) + 1;
    this.treeCuts[tree.x] = { hits, at: this.tick, direction: this.player.x <= tree.x ? 1 : -1 };
    if (hits === WATCH_TREE_HITS) {
      this.wood += tree.wood;
      this.message = `Birch felled. Collected ${tree.wood} wood.`;
    } else {
      this.message = `Birch chopped ${hits}/${WATCH_TREE_HITS}.`;
    }
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
    if (this.status === 'ready') return kind === 'train' || kind === 'tower' || kind === 'builder' ? false : this.start();
    const action = kind === 'train' ? this.getTrainingAction()
      : kind === 'tower' ? this.getTowerAction() : kind === 'builder' ? this.getBuilderAction() : this.getAction();
    if (!action) {
      if (this.status === 'running' && kind !== 'train') this.message = 'Walk up to a tree, a camp, or a station.';
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
      case 'chop':
        return this.chopTree(action.tree);
      case 'signal-tent':
        this.signalTent = true;
        this.message = 'Signal tent built. The blue torch is lit.';
        break;
      case 'tower-upgrade':
        this.signalTent = false;
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
        this.clearBuilderRepair(this);
        this.message = `${this.signalName} repaired. Ring the bell when you’re ready.`;
        break;
      case 'hire':
        post.guards.push({ rank: 0, direction: post.side, fireAt: this.tick + 8, shotAt: WATCH_NO_ACTION, carriedCoins: 0 });
        this.message = `Guard hired and sent to the ${post.name.toLowerCase()} bank.`;
        break;
      case 'hire-builder':
        this.builders.push({ side: post.side, x: action.camp.x, direction: -action.camp.side,
          stride: 0, walking: false, returning: false, working: false, workAt: this.tick });
        this.message = `Builder hired at the camp and sent to the ${post.name.toLowerCase()} bank. Tell builders “fix walls” when you want repairs.`;
        break;
      case 'train':
        action.guard.rank = 1;
        this.message = `${post.name} veteran trained. Veterans shoot farther and deal double damage.`;
        break;
      case 'repair':
        post.health = this.maxWall(post);
        this.clearBuilderRepair(post);
        this.message = `${post.name} ${post.tier === 3 ? 'wall tower' : 'palisade'} repaired.`;
        break;
      case 'reinforce':
        post.tier = 2;
        post.health = this.maxWall(post);
        this.clearBuilderRepair(post);
        this.message = `${post.name} palisade reinforced.`;
        break;
      case 'wall-tower':
        post.tier = 3;
        post.health = this.maxWall(post);
        this.clearBuilderRepair(post);
        this.message = `${post.name} wall tower built. Two posted guards can shoot from its raised platform.`;
        break;
      case 'build':
        post.tier = 1;
        post.health = this.maxWall(post);
        this.clearBuilderRepair(post);
        this.message = post.forward && this.marketOpen ? 'Both forward palisades are built. The bridge market is open.'
          : `${post.name} palisade built.`;
        break;
    }
    return true;
  }

  startNight() {
    if (this.insideTower) return false;
    if (!this.posts.every((post) => post.guards.every((guard, index) =>
      this.guardPosition(post, index) === this.guardX(post, index)))
      || !this.builders.every((builder, index) => builder.x === this.builderHome(builder, index))) {
      this.recallingGuards = true;
      this.message = `${this.builders.length ? 'Guards and builders' : 'Guards'} are returning to their defenses. The portals will open when everyone is home.`;
      return false;
    }
    this.recallingGuards = false;
    for (const post of this.posts) {
      for (const guard of post.guards) {
        guard.returning = false;
        guard.walking = false;
      }
    }
    for (const builder of this.builders) {
      builder.returning = builder.walking = builder.working = false;
      builder.workAt = this.tick;
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
    this.playerHealth = WATCH_PLAYER_HEALTH;
    this.playerHurtAt = WATCH_NO_ACTION;
    this.huntedPigeons = 0;
    this.recallingGuards = false;
    for (const post of this.posts) for (const guard of post.guards) guard.returning = false;
    for (const builder of this.builders) builder.returning = builder.working = false;
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
      if (Math.abs(piece.x - this.player.x) > 6 || (piece.tossAt !== undefined && this.tick - piece.tossAt < WATCH_COIN_TOSS_TICKS)) return true;
      this.coins += piece.amount;
      return false;
    });
    this.shots = this.shots.filter(({ end }) => end > this.tick);
    if (this.phase === 'day') {
      this.stepArrows();
      this.removeDefeatedOpus();
      if (this.phaseTick >= WATCH_DAY) this.recallingGuards = true;
      if (this.phaseTick === WATCH_DAY - 10 * TICKS_PER_SECOND) {
        this.message = 'Dusk in 10 seconds. The guards are securing their posts.';
      }
      this.patrolGuards();
      this.stepBuilders();
      if (this.recallingGuards) this.startNight();
      return;
    }
    for (const post of this.posts) {
      post.guards.forEach((guard, index) => walkWatchGuard(guard, this.guardPosition(post, index), this.guardX(post, index), WATCH_GUARD_RETURN_SPEED));
    }
    this.stepBuilders();
    while (this.queue[0]?.due <= this.phaseTick) {
      const { side } = this.queue.shift();
      const portal = WATCH_PORTALS[side === -1 ? 0 : 1];
      this.spawnOpus(side, portal.x);
    }
    while (this.flyerQueue[0]?.due <= this.phaseTick) {
      const { side } = this.flyerQueue.shift();
      this.spawnFlyer(side, WATCH_PORTALS[side === -1 ? 0 : 1].x);
    }
    for (const raider of this.raiders) {
      this.moveRaider(raider);
      if (this.status === 'lost') return;
    }
    this.stepIchorSprayer();
    for (const flyer of this.flyers) {
      if (flyer.hp > 0 && this.signal > 0) this.moveFlyer(flyer);
      if (this.status === 'lost') return;
    }
    if (this.signal <= 0) {
      this.status = 'lost';
      this.message = 'The raid extinguished the signal. Start a new watch to try again.';
      return;
    }
    this.stepArrows();
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

  hurtPlayer(enemy, coinsToDrop, name) {
    if (this.status !== 'running' || this.insideTower || this.phase !== 'night'
        || this.tick - this.playerHurtAt < WATCH_HURT_COOLDOWN) return false;
    this.playerHurtAt = this.tick;
    this.playerHealth = Math.max(0, this.playerHealth - 1);
    const amount = Math.min(this.coins, coinsToDrop);
    if (amount) {
      const from = this.player.x;
      const direction = Math.sign(from - enemy.x) || -enemy.side;
      const x = from + direction * 17;
      const landing = x < WATCH_BOUNDS.left || x > WATCH_BOUNDS.right ? from - direction * 17 : x;
      this.coins -= amount;
      this.loot.push({ x: landing, amount, forPlayer: true, tossAt: this.tick, tossFrom: from });
    }
    if (this.playerHealth === 0) {
      this.status = 'lost';
      this.message = `${name} struck you down. Start a new watch or load a save.`;
    } else {
      this.message = amount ? `${name} hit you and knocked loose ${amount} copper.` : `${name} hit you.`;
    }
    return true;
  }

  moveRaider(raider) {
    if (raider.hp <= 0) return;
    if (this.tick >= raider.attackAt && Math.abs(raider.x - this.player.x) <= 10
        && this.hurtPlayer(raider, 1, raider.mode === 'crawl' ? 'A Tri Flyer' : 'A Tri Opus')) {
      raider.struckAt = this.tick;
      raider.attackAt = this.tick + 36;
      return;
    }
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
        target = { post, guard, x: position, altitude: this.guardElevation(post, index) };
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
    const playerDistance = Math.abs(this.player.x - flyer.x);
    const divesAtPlayer = soldier
      ? flyer.mode === 'dive' && playerDistance <= 6 && playerDistance < Math.abs(soldier.x - flyer.x)
      : playerDistance <= 64;
    const targetX = divesAtPlayer ? this.player.x : soldier?.x ?? wall?.wallX ?? watchTowerTarget(this, flyer.side);
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

    const targetAltitude = divesAtPlayer ? 0 : soldier?.altitude ?? 0;
    flyer.altitude += Math.sign(targetAltitude - flyer.altitude) * Math.min(2, Math.abs(targetAltitude - flyer.altitude));
    const touching = !divesAtPlayer && soldier && Math.abs(soldier.x - flyer.x) <= 6 && Math.abs(flyer.altitude - targetAltitude) <= 4;
    const hitPlayer = divesAtPlayer && Math.abs(this.player.x - flyer.x) <= 6 && flyer.altitude <= 13
      && this.hurtPlayer(flyer, 2, 'A diving Tri Flyer');
    if (touching) this.infectGuard(soldier);
    if (hitPlayer || touching || flyer.altitude === 0) {
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
      if (!post.health) this.message = `${post.name} ${post.tier === 3 ? 'wall tower' : 'palisade'} fell. The raid is heading for the signal.`;
    } else {
      this.signal = Math.max(0, this.signal - damage);
    }
    this.resetBuilderWork(post ?? this);
  }

  guardWall(post) {
    const forward = this.forwardWalls[post.side === -1 ? 0 : 1];
    return forward.health ? forward : post;
  }

  guardX(post, index) {
    const wall = this.guardWall(post);
    if (wall.tier === 3 && wall.health > 0 && index < 2) return wall.wallX - post.side * (index ? 8 : -4);
    return wall.wallX - post.side * (17 + (index % WATCH_GUARD_POSITIONS) * 8);
  }

  guardPosition(post, index) {
    return post.guards[index].x ?? this.guardX(post, index);
  }

  guardElevation(post, index) {
    const wall = this.guardWall(post);
    return index < 2 && wall.tier === 3 && wall.health > 0
      && this.guardPosition(post, index) === this.guardX(post, index)
      ? WATCH_WALL_TOWER_PLATFORM + watchGround(this.guardX(post, index)) - watchGround(wall.wallX) : 0;
  }

  builderHome(builder, index = this.builders.indexOf(builder)) {
    const bank = builder.side === -1 ? 0 : 1;
    const wall = this.forwardWalls[bank].health > 0 ? this.forwardWalls[bank]
      : this.posts[bank].health > 0 ? this.posts[bank] : null;
    const spacing = Math.max(0, index) % 4 * 8;
    return wall ? wall.wallX - builder.side * (38 + spacing)
      : watchTowerTarget(this, builder.side) + builder.side * (24 + spacing);
  }

  builderRepairJobs(side) {
    const bank = side === -1 ? 0 : 1;
    const jobs = [this.posts[bank], this.forwardWalls[bank]]
      .filter((wall) => wall.tier > 0 && wall.health < this.maxWall(wall))
      .map((wall) => ({ defense: wall, id: this.builderRepairId(wall), kind: 'repair', duration: WATCH_BUILDER_REPAIR_TICKS,
        cost: this.builderRepairCost(wall),
        x: wall.wallX - side * 20, direction: side }));
    if (this.signal < WATCH_HEALTH) jobs.push({ defense: this,
      id: 'signal', kind: 'repair', duration: WATCH_BUILDER_REPAIR_TICKS,
      cost: 3, x: watchTowerTarget(this, side) + side * 15, direction: -side });
    return jobs;
  }

  builderWorkJobs(side) {
    const jobs = this.builderRepairJobs(side);
    if (this.builderOrder !== 'upgrade') return jobs;
    const bank = side === -1 ? 0 : 1;
    for (const wall of [this.posts[bank], this.forwardWalls[bank]]) {
      if (![1, 2].includes(wall.tier) || wall.health !== this.maxWall(wall)) continue;
      jobs.push({ defense: wall, id: this.builderRepairId(wall), kind: wall.tier === 1 ? 'reinforce' : 'wall-tower',
        cost: wall.tier === 1 ? 5 : WATCH_WALL_TOWER_COST, duration: WATCH_BUILDER_UPGRADE_TICKS,
        x: wall.wallX - side * 20, direction: side });
    }
    return jobs;
  }

  builderRepairId(defense) {
    if (defense === this) return 'signal';
    const post = this.posts.indexOf(defense);
    if (post >= 0) return WATCH_BUILDER_REPAIR_IDS[post];
    const forward = this.forwardWalls.indexOf(defense);
    return forward >= 0 ? WATCH_BUILDER_REPAIR_IDS[forward + 2] : null;
  }

  builderRepairCost(defense) {
    return defense === this ? 3 : this.gear.includes('repair-kit') ? 1 : 2;
  }

  clearBuilderRepair(defense) {
    const id = this.builderRepairId(defense);
    this.builderPaidRepairs = this.builderPaidRepairs.filter((credit) => credit !== id);
    this.resetBuilderWork(defense);
  }

  resetBuilderWork(defense) {
    for (const builder of this.builders) {
      if (defense !== this && builder.side !== defense.side) continue;
      const site = defense === this ? watchTowerTarget(this, builder.side) + builder.side * 15
        : defense.wallX - builder.side * 20;
      if (builder.x !== site) continue;
      builder.working = false;
      builder.workAt = this.tick;
    }
  }

  pruneBuilderRepairs() {
    const active = new Set([...this.builderRepairJobs(-1), ...this.builderRepairJobs(1)].map(({ id }) => id));
    this.builderPaidRepairs = this.builderPaidRepairs.filter((id) => active.has(id));
  }

  payBuilderRepair(job) {
    if (this.builderPaidRepairs.includes(job.id)) return true;
    if (this.coins < job.cost) return false;
    this.coins -= job.cost;
    this.builderPaidRepairs.push(job.id);
    const name = job.defense === this ? 'signal tower' : `${job.defense.name.toLowerCase()} ${job.defense.tier === 3 ? 'wall tower' : 'palisade'}`;
    this.message = `Builders spent ${job.cost} copper to start repairing the ${name}.`;
    return true;
  }

  finishBuilderUpgrade(job) {
    const wall = job.defense;
    const tier = job.kind === 'reinforce' ? 1 : job.kind === 'wall-tower' ? 2 : null;
    if (wall.tier !== tier || wall.health !== this.maxWall(wall) || this.coins < job.cost) return false;
    this.coins -= job.cost;
    wall.tier++;
    wall.health = this.maxWall(wall);
    this.clearBuilderRepair(wall);
    this.message = job.kind === 'reinforce'
      ? `Builders reinforced the ${wall.name.toLowerCase()} palisade for ${job.cost} copper.`
      : `Builders completed the ${wall.name.toLowerCase()} wall tower for ${job.cost} copper.`;
    return true;
  }

  canBuilderVisit(builder, target, home, duration = WATCH_BUILDER_REPAIR_TICKS) {
    const travel = Math.ceil(Math.abs(target - builder.x) / WATCH_GUARD_SPEED);
    const back = Math.ceil(Math.abs(target - home) / WATCH_GUARD_RETURN_SPEED);
    const work = builder.working && builder.x === target ? Math.max(0, builder.workAt - this.tick) : duration;
    return travel + work + back + WATCH_GUARD_RETURN_MARGIN < WATCH_DAY - this.phaseTick;
  }

  stepBuilders() {
    this.pruneBuilderRepairs();
    const claimed = new Set();
    const jobs = { '-1': this.builderWorkJobs(-1), '1': this.builderWorkJobs(1) };
    this.builders.forEach((builder, index) => {
      const home = this.builderHome(builder, index);
      const returnTicks = Math.ceil(Math.abs(builder.x - home) / WATCH_GUARD_RETURN_SPEED);
      const mustReturn = !['repair', 'upgrade'].includes(this.builderOrder) || this.phase !== 'day' || this.recallingGuards
        || WATCH_DAY - this.phaseTick <= returnTicks + WATCH_GUARD_RETURN_MARGIN;
      let job;
      let nearest = Infinity;
      let priority = Infinity;
      if (!mustReturn) {
        for (const candidate of jobs[builder.side]) {
          const distance = Math.abs(candidate.x - builder.x);
          const category = candidate.kind === 'repair' ? 0 : 1;
          const funded = candidate.kind === 'repair' && this.builderPaidRepairs.includes(candidate.id);
          if (claimed.has(candidate.defense) || category > priority || category === priority && distance >= nearest
              || !funded && this.coins < candidate.cost
              || !this.canBuilderVisit(builder, candidate.x, home, candidate.duration)) continue;
          job = candidate;
          nearest = distance;
          priority = category;
        }
      }
      const wasWorking = builder.working;
      builder.working = false;
      if (!job) {
        builder.returning = builder.x !== home;
        walkWatchGuard(builder, builder.x, home, WATCH_GUARD_RETURN_SPEED);
        if (builder.x === home) builder.returning = false;
        builder.workAt = this.tick;
        return;
      }
      claimed.add(job.defense);
      builder.returning = false;
      walkWatchGuard(builder, builder.x, job.x, WATCH_GUARD_SPEED);
      if (builder.walking || !wasWorking) builder.workAt = this.tick + job.duration;
      if (builder.x !== job.x) return;
      builder.walking = false;
      builder.working = true;
      builder.direction = job.direction;
      if (this.tick < builder.workAt) return;
      if (job.kind !== 'repair') {
        this.finishBuilderUpgrade(job);
        return;
      }
      if (!this.payBuilderRepair(job)) return;
      if (job.defense === this) this.signal = Math.min(WATCH_HEALTH, this.signal + 1);
      else job.defense.health = Math.min(this.maxWall(job.defense), job.defense.health + 1);
      if (job.defense === this ? this.signal === WATCH_HEALTH : job.defense.health === this.maxWall(job.defense)) this.clearBuilderRepair(job.defense);
      builder.workAt = this.tick + WATCH_BUILDER_REPAIR_TICKS;
    });
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
          this.shootWatchArrow(guard, from, to, 44, 'pigeon', 0, pigeon);
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

  arrowTargetPose(target, to, altitude, flightTicks, kind) {
    if (kind === 'pigeon') {
      const x = target ? watchPigeonPose(target, this.tick + flightTicks).x : to;
      return { x, altitude: 0, height: 5 };
    }
    if (!target) return { x: to, altitude, height: 12 };
    const wall = watchRaidWall(target, this.posts, this.forwardWalls);
    const destination = wall?.wallX ?? watchTowerTarget(this, target.side);
    const sprayer = this.sprayers.includes(target);
    if (this.flyers.includes(target) && target.mode !== 'crawl') {
      const soldier = this.nearestFlyerGuard(target.x);
      const goal = soldier?.x ?? destination;
      const x = target.x + Math.sign(goal - target.x) * Math.min(Math.abs(goal - target.x), 2.4 * flightTicks);
      const landingAltitude = soldier?.altitude ?? 0;
      const predictedAltitude = target.mode === 'dive'
        ? altitude + Math.sign(landingAltitude - altitude) * Math.min(Math.abs(landingAltitude - altitude), 2 * flightTicks)
        : Math.min(WATCH_FLYER_ALTITUDE, altitude + 1.4 * flightTicks);
      return { x, altitude: predictedAltitude, height: 10 };
    }
    const speed = sprayer ? 1.14 + 0.47 * Math.sin(this.tick / 8)
      : 1.58 + 0.18 * Math.sin(this.tick / 16 + target.x / 36);
    const reach = sprayer ? WATCH_SPRAYER_REACH : WATCH_OPUS_REACH;
    const waiting = sprayer && target.spray ? Math.max(0, WATCH_SPRAY_FLIGHT - (this.tick - target.spray.at)) : 0;
    const travel = Math.min(Math.max(0, Math.abs(destination - target.x) - reach), speed * Math.max(0, flightTicks - waiting));
    return { x: target.x + Math.sign(destination - target.x) * travel, altitude, height: sprayer ? 32 : 12 };
  }

  shootWatchArrow(guard, from, to, cooldown, kind, altitude = 0, target = null, elevation = 0) {
    guard.direction = Math.sign(to - from) || guard.direction;
    guard.shotAt = this.tick;
    guard.fireAt = this.tick + cooldown;
    // One saved PRNG step per arrow keeps aiming identical after a save/load.
    this.aimSeed = (this.aimSeed + 0x6d2b79f5) >>> 0;
    let value = this.aimSeed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const roll = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    const veteran = guard.rank === 1;
    const range = kind === 'pigeon' ? 42 : WATCH_GUARD_STATS[guard.rank].range;
    const distance = Math.min(1, Math.hypot(to - from, altitude - elevation) / range);
    const accuracy = (veteran ? 0.98 : 0.9) - distance * (veteran ? 0.1 : 0.2)
      - Math.min(1, altitude / WATCH_FLYER_ALTITUDE) * 0.04;
    const hit = roll < accuracy;
    const flightTicks = Math.max(22, Math.min(40, Math.ceil(Math.hypot(to - from, altitude - elevation) / 3) + 8));
    const aim = this.arrowTargetPose(target, to, altitude, flightTicks, kind);
    let endpoint = aim.x;
    if (!hit) {
      const offset = 12 + Math.floor((roll - accuracy) / (1 - accuracy) * 14);
      const sign = this.aimSeed & 1 ? 1 : -1;
      const candidates = [aim.x + sign * offset, aim.x - sign * offset]
        .filter((x) => x >= WATCH_BOUNDS.left && x <= WATCH_BOUNDS.right);
      endpoint = candidates.find((x) => (x - from) * guard.direction >= 0) ?? candidates[0];
    }
    endpoint = Math.max(WATCH_BOUNDS.left, Math.min(WATCH_BOUNDS.right, endpoint));
    const x = Math.max(WATCH_BOUNDS.left, Math.min(WATCH_BOUNDS.right, from + guard.direction * 4));
    const y = watchGround(from) - elevation - 16;
    const targetY = watchGround(endpoint) - aim.altitude - aim.height;
    this.shots.push({ from, to: endpoint, end: this.tick + WATCH_ARROW_LIFETIME, kind,
      ballistic: true, x, y, vx: (endpoint - x) / flightTicks,
      vy: (targetY - y) / flightTicks - WATCH_ARROW_GRAVITY * flightTicks / 2,
      damage: WATCH_GUARD_STATS[guard.rank].damage, stuck: false,
      ...(altitude > 0 ? { altitude } : {}), ...(!hit ? { missed: true } : {}) });
    return hit;
  }

  stepArrows() {
    for (const shot of this.shots) {
      // Old save arrows already dealt damage when fired. Keep them visual-only.
      if (!shot.ballistic || shot.stuck || shot.end <= this.tick) continue;
      const nextX = shot.x + shot.vx;
      const nextVy = Math.min(64, shot.vy + WATCH_ARROW_GRAVITY);
      const nextY = shot.y + (shot.vy + nextVy) / 2;
      let collision;
      const consider = (t, kind, target) => {
        if (t !== null && t >= 0 && t <= 1 && (!collision || t < collision.t)) collision = { t, kind, target };
      };
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const sprayer = this.sprayers.includes(enemy);
        const flyer = this.flyers.includes(enemy);
        const ground = watchGround(enemy.x) - (enemy.altitude ?? 0);
        const radius = sprayer ? 24 : flyer ? 9 : enemy.kind === 'infected' ? 10 : 7;
        const height = sprayer ? 62 : flyer ? 17 : 21;
        consider(arrowBoxEntry(shot.x, shot.y, nextX, nextY,
          enemy.x - radius, ground - height, enemy.x + radius, ground - 2), 'enemy', enemy);
      }
      if (this.phase === 'day') {
        for (const [bird, pigeon] of WATCH_PIGEONS.entries()) {
          if (this.huntedPigeons & (1 << bird)) continue;
          const { x } = watchPigeonPose(pigeon, this.tick), ground = watchGround(x);
          consider(arrowBoxEntry(shot.x, shot.y, nextX, nextY, x - 5, ground - 9, x + 5, ground - 1), 'pigeon', { bird, x });
        }
      }
      for (const [value, next, min, max] of [[shot.x, nextX, WATCH_BOUNDS.left, WATCH_BOUNDS.right], [shot.y, nextY, -256, 256]]) {
        if (next < min || next > max) consider(((next < min ? min : max) - value) / (next - value), 'edge');
      }
      // Half-pixel terrain sampling prevents a fast arrow skipping a narrow crest.
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(nextX - shot.x), Math.abs(nextY - shot.y)) * 2));
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const x = shot.x + (nextX - shot.x) * t, y = shot.y + (nextY - shot.y) * t;
        if (x < WATCH_BOUNDS.left || x > WATCH_BOUNDS.right) break;
        if (y >= watchGround(x)) { consider(t, 'ground'); break; }
      }
      const progress = collision?.t ?? 1;
      shot.x += (nextX - shot.x) * progress;
      shot.y += (nextY - shot.y) * progress;
      shot.vy = nextVy;
      if (!collision) continue;
      if (collision.kind === 'ground') {
        shot.y = watchGround(shot.x);
        shot.stuck = true;
        shot.end = this.tick + WATCH_ARROW_STICK_TICKS;
      } else {
        shot.end = this.tick;
        if (collision.kind === 'enemy') this.damageEnemy(collision.target, shot.damage);
        if (collision.kind === 'pigeon') {
          const { bird, x } = collision.target;
          this.huntedPigeons |= 1 << bird;
          if (this.loot.length < 60) this.loot.push({ x, amount: 1 });
          this.message = 'A guard hunted a pigeon. Guards will bring its copper to you.';
        }
      }
    }
    this.shots = this.shots.filter(({ end }) => end > this.tick);
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
        const elevation = this.guardElevation(post, index);
        const { range, cooldown } = WATCH_GUARD_STATS[guard.rank];
        let target;
        let closest = Infinity;
        for (const raider of enemies) {
          if (raider.hp <= 0 || (raider.side !== post.side && !this.flyers.includes(raider))
              || Math.hypot(raider.x - from, (raider.altitude ?? 0) - elevation) > range) continue;
          const distance = Math.abs(raider.x - WATCH_SIGNAL);
          if (distance >= closest) continue;
          target = raider;
          closest = distance;
        }
        if (!target) return;
        this.shootWatchArrow(guard, from, target.x, cooldown, 'raid', target.altitude ?? 0, target, elevation);
      });
    }
  }
}
