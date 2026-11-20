import { Quarry, WIDTH, HEIGHT, VIEW_WIDTH, WORLD_AREAS, START_VIEW, TICKS_PER_SECOND, COPPER, SAND, WATER, ICHOR, BASALT, EMBER, PATINA, ROCK, GRASS, ERASE, CREATURES, SCENERY, BOSSES, TRI_PORTAL } from './simulation.js';
import { QuarryRenderer, drawToolIcon } from './art.js';
import { CreekWatch, WATCH_HEALTH, WATCH_BOUNDS, WATCH_CAMPS, WATCH_CAMP_GROUPS, WATCH_FORWARD_WALLS, WATCH_MARKET_ITEMS, WATCH_PORTALS, WATCH_SIGNAL, WATCH_TOWER_ROOM, WATCH_VENDORS } from './watch.js';
import { listWatchSlots, loadWatchSlot, saveWatchSlot, WATCH_SAVE_NAME_LIMIT } from './watch-saves.js';
import { drawCreekWatch, drawWatchMarketIcon, drawWatchVendorPortrait } from './watch-art.js';

function sceneryHint(entity, label) {
  const surface = entity === 'dock' ? 'water or land' : 'dry ground';
  return `Click or tap above ${surface} to place a ${label}.`;
}

const BOSS_HINTS = {
  'copper-giant': 'Click above dry ground to awaken the Copper Giant.',
  'lake-terror': 'Click above water or ichor to summon the Lake’s Corrupt Terror.',
  'sky-eye': 'Click an open patch of sky to summon the Eye of the Sky.'
};

const TOOLS = [
  { key: '1', material: COPPER, label: 'Copper', hint: 'Drag to pour copper ore.' },
  { key: '2', material: SAND, label: 'Sand', hint: 'Drag to pour falling sand.' },
  { key: '3', material: WATER, label: 'Water', hint: 'Drag to pour water into the quarry.' },
  { key: '4', material: BASALT, label: 'Basalt', hint: 'Drag to build walls and dams.' },
  { key: '5', material: EMBER, label: 'Embers', hint: 'Drag to scatter hot embers.' },
  { key: '6', material: ERASE, label: 'Eraser', hint: 'Drag to erase materials, creatures, bosses, and placed scenery.' },
  { key: 'b', breaker: true, label: 'Break', hint: 'Chip off falling fragments. Set the brush to 1 px for a single pixel.' },
  { key: '7', entity: 'lizard', label: CREATURES.lizard, hint: 'Click or tap to place a swimming copperback.' },
  { key: '8', entity: 'duck', label: CREATURES.duck, hint: 'Click or tap to place a duck on land or water.' },
  { key: '9', entity: 'tri', label: 'Tri', hint: 'Plant on dry ground. Tri slowly spreads across the map.' },
  { material: PATINA, label: 'Patina', hint: 'Drag to pour weathered copper.' },
  { material: ROCK, label: 'Rock', hint: 'Drag to paint solid rock.' },
  { material: GRASS, label: 'Grass', hint: 'Drag to paint grassy ground.' },
  ...Object.entries(SCENERY).map(([entity, { label }]) => ({
    entity, scenery: true, label, hint: sceneryHint(entity, label)
  })),
  { entity: 'portal', scenery: true, label: TRI_PORTAL.label, hint: 'Place on dry ground. Tri Portals open and release Blobs at night.' },
  ...Object.entries(BOSSES).map(([entity, { label }]) => ({ entity, boss: true, label, hint: BOSS_HINTS[entity] }))
];
const TRI_TOOLS = [
  ...TOOLS.map((tool) => {
    if (tool.material === ERASE || tool.breaker || tool.entity === 'tri' || tool.entity === 'portal' || tool.boss) return tool;
    if (tool.material === WATER) {
      return { ...tool, material: ICHOR, label: 'Ichor', hint: 'Drag to pour glossy, slow-flowing ichor.' };
    }
    const label = `Tri ${tool.label}`;
    const hint = tool.scenery ? sceneryHint(tool.entity, label)
      : tool.entity ? `Click or tap to place a ${label}.` : `Drag to paint ${label.toLowerCase()}.`;
    return { ...tool, label, hint, converted: true };
  }),
  ...['blob', 'ling', 'brain', 'opus'].map((entity) => ({
    entity, label: CREATURES[entity], hint: `Click or tap to place a ${CREATURES[entity]}.`
  }))
];
const FPS = TICKS_PER_SECOND;
const INTERVAL = 1000 / FPS;
const world = document.querySelector('#world');
const brush = document.querySelector('#brush');
const brushSize = document.querySelector('#brush-size');
const hint = document.querySelector('#world-hint');
const eventStatus = document.querySelector('#world-event');
const pauseButton = document.querySelector('#pause');
const resetButton = document.querySelector('#reset');
const pauseMark = pauseButton.querySelector('.pause-mark');
const pauseLabel = document.querySelector('#pause-label');
const live = document.querySelector('#live');
const liveLabel = document.querySelector('#live-label');
const timer = document.querySelector('#timer');
const clearDialog = document.querySelector('#clear-dialog');
const guide = document.querySelector('#guide');
const waterCount = document.querySelector('#water-count');
const ichorCount = document.querySelector('#ichor-count');
const copperCount = document.querySelector('#copper-count');
const cameraSlider = document.querySelector('#camera');
const panWest = document.querySelector('#pan-west');
const panEast = document.querySelector('#pan-east');
const areaName = document.querySelector('#area-name');
const paletteButtons = Array.from(document.querySelectorAll('[data-tool-palette]'));
const toolbox = document.querySelector('.toolbox');
const categoryButtons = Array.from(document.querySelectorAll('[data-tool-category]'));
const toolGroups = new Map(['materials', 'life', 'scenery', 'bosses'].map((group) => [group, {
  section: document.querySelector(`#${group}-section`), list: document.querySelector(`#${group}`)
}]));
const weatherButtons = Array.from(document.querySelectorAll('[data-weather]'));
const skyButtons = document.querySelectorAll('[data-sky-mode]');
const skyPhase = document.querySelector('#sandbox-sky-phase');
const modeButtons = Array.from(document.querySelectorAll('[data-game-mode]'));
const menu = document.querySelector('#start-menu');
const menuCanvas = document.querySelector('#menu-scene');
const menuButtons = Array.from(document.querySelectorAll('[data-menu-play]'));
const gameSurfaces = document.querySelectorAll('[data-in-game]');
const reducedMenuMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const sandboxView = document.querySelectorAll('[data-sandbox-view]');
const watchView = document.querySelectorAll('[data-watch-view]');
const headingTitle = document.querySelector('#title');
const modeDescription = document.querySelector('#mode-description');
const watchAction = document.querySelector('#watch-use');
const watchTower = document.querySelector('#watch-tower');
const watchPanelTitle = document.querySelector('#watch-label');
const watchPanelDescription = document.querySelector('#watch-description');
const watchMapRoute = document.querySelector('.watch-route');
const watchMapDestinations = document.querySelector('.watch-destinations');
const watchTrain = document.querySelector('#watch-train');
const watchSwing = document.querySelector('#watch-swing');
const watchMessage = document.querySelector('#watch-message');
const watchCoins = document.querySelector('#watch-coins');
const watchHealth = document.querySelector('#watch-health');
const watchHealthLabel = document.querySelector('#watch-health-label');
const watchBankLabels = [document.querySelector('#watch-west'), document.querySelector('#watch-east')];
const watchArea = document.querySelector('#watch-area');
const watchPosition = document.querySelector('#watch-position');
const watchPortalState = document.querySelector('#watch-portal-state');
const watchMarketRoute = document.querySelector('[data-watch-destination="market"]');
const watchDestinations = { west: WATCH_PORTALS[0].x + 31, tower: WATCH_SIGNAL, east: WATCH_PORTALS[1].x - 31,
  forwardWest: WATCH_FORWARD_WALLS[0].wallX, forwardEast: WATCH_FORWARD_WALLS[1].wallX, market: WATCH_VENDORS[0].x };
for (const { name, side, camps } of WATCH_CAMP_GROUPS) {
  const marker = document.createElement('button');
  // Arrive within recruiting range with the whole group in view.
  const x = (side === -1 ? camps.at(-1) : camps[0]).x + side * 12;
  const destination = `camp-${side}`;
  marker.type = 'button';
  marker.className = 'watch-camp-marker';
  marker.dataset.watchDestination = destination;
  marker.style.left = `${x / WATCH_BOUNDS.right * 100}%`;
  marker.title = `Walk to the ${name.toLowerCase()} camps`;
  marker.setAttribute('aria-label', marker.title);
  watchDestinations[destination] = x;
  watchPosition.before(marker);
}
const watchRenderOptions = {
  skipDecoration: ({ x, type }) => type === 'hut' || type === 'dock'
    || WATCH_CAMPS.some((camp) => Math.abs(camp.x - x) <= 44)
};
const watchMoveButtons = document.querySelectorAll('[data-watch-move], [data-watch-destination]');
const watchMoveKeys = { a: -1, d: 1, arrowleft: -1, arrowright: 1 };
const watchSavesDialog = document.querySelector('#watch-saves');
const watchSaveForm = document.querySelector('#watch-save-form');
const watchSaveName = document.querySelector('#watch-save-name');
const watchSaveStatus = document.querySelector('#watch-save-status');
const watchSlotList = document.querySelector('#watch-slot-list');
const watchMarketDialog = document.querySelector('#watch-market');
const watchMarketTitle = document.querySelector('#watch-market-title');
const watchMarketTrade = document.querySelector('#watch-merchant-trade');
const watchMarketPortrait = document.querySelector('#watch-merchant-portrait');
const watchMarketBalance = document.querySelector('#watch-market-balance');
const watchMarketStock = document.querySelector('#watch-market-stock');
const watchMarketStatus = document.querySelector('#watch-market-status');
const quarry = new Quarry();
const renderer = new QuarryRenderer(world);
let watch = new CreekWatch();
const formatter = new Intl.NumberFormat();

let paused = false;
let selected = TOOLS[0];
let cursor = null;
let stroke = null;
let keyboardAim = false;
let dirty = true;
let lastFrame = 0;
let lag = 0;
let lastReadoutTick = -1;
let camera = START_VIEW;
let cameraTarget = START_VIEW;
let variantMode = false;
let gameMode = 'sandbox';
let watchQuarry;
let watchRenderer;
let menuQuarry;
let menuRenderer;
let menuVisualTick = -1;
let walkTarget = null;
const pausedByMode = { sandbox: false, watch: false };
const walkKeys = new Set();

const toolButtons = new Map();

function toolGroup(tool) {
  return tool.boss ? 'bosses' : tool.scenery ? 'scenery' : tool.entity ? 'life' : 'materials';
}

function selectTool(tool) {
  selected = tool;
  stroke = null;
  for (const [option, button] of toolButtons) button.setAttribute('aria-pressed', String(option === tool));
  const category = toolGroup(tool);
  for (const [group, { section }] of toolGroups) {
    section.hidden = category !== group;
  }
  for (const button of categoryButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.toolCategory === category));
  }
  hint.textContent = tool.hint;
  dirty = true;
}

function renderTools() {
  const tools = variantMode ? TRI_TOOLS : TOOLS;
  toolButtons.clear();
  for (const { list } of toolGroups.values()) list.replaceChildren();
  for (const tool of tools) {
    const button = document.createElement('button');
    const icon = document.createElement('canvas');
    const label = document.createElement('span');
    button.type = 'button';
    button.className = 'tool';
    const shortcutKey = tool.key?.toUpperCase();
    button.title = shortcutKey ? `${tool.label} (${shortcutKey})` : tool.label;
    icon.width = icon.height = 24;
    icon.setAttribute('aria-hidden', 'true');
    label.textContent = tool.label;
    button.append(icon, label);
    if (shortcutKey) {
      const shortcut = document.createElement('kbd');
      button.setAttribute('aria-keyshortcuts', tool.material === ERASE ? '6 E' : shortcutKey);
      shortcut.textContent = shortcutKey;
      shortcut.setAttribute('aria-hidden', 'true');
      button.append(shortcut);
    }
    toolGroups.get(toolGroup(tool)).list.append(button);
    const iconType = tool.breaker ? 'break' : tool.material === ERASE ? 'erase' : tool.entity ?? tool.material;
    drawToolIcon(icon, iconType, tool.converted);
    button.addEventListener('click', () => selectTool(tool));
    toolButtons.set(tool, button);
  }
  const counterpart = tools.find((tool) => {
    if (selected.key) return tool.key === selected.key;
    if (selected.entity) return tool.entity === selected.entity;
    return tool.material === selected.material;
  });
  selectTool(counterpart ?? tools.find((tool) => toolGroup(tool) === toolGroup(selected)));
}
for (const icon of document.querySelectorAll('canvas[data-icon]')) drawToolIcon(icon, icon.dataset.icon);
renderTools();
for (const button of paletteButtons) {
  button.addEventListener('click', () => {
    const showTri = button.dataset.toolPalette === 'tri';
    if (showTri === variantMode) return;
    variantMode = showTri;
    toolbox.classList.toggle('variant-mode', variantMode);
    for (const option of paletteButtons) option.setAttribute('aria-pressed', String(option === button));
    renderTools();
  });
}
for (const button of categoryButtons) {
  button.addEventListener('click', () => {
    const category = button.dataset.toolCategory;
    const tools = variantMode ? TRI_TOOLS : TOOLS;
    if (toolGroup(selected) !== category) selectTool(tools.find((tool) => toolGroup(tool) === category));
  });
}

function updateBrush() {
  brushSize.value = `${brush.value} px`;
  const fraction = (brush.valueAsNumber - Number(brush.min)) / (Number(brush.max) - Number(brush.min));
  brush.style.setProperty('--fill', `${fraction * 100}%`);
  dirty = true;
}

function syncWeather() {
  for (const button of weatherButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.weather === quarry.weather));
  }
}

function syncSkyMode() {
  for (const button of skyButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.skyMode === quarry.skyMode));
  }
}

function updateReadouts() {
  const stats = quarry.getStats();
  waterCount.textContent = formatter.format(stats.water);
  ichorCount.textContent = formatter.format(stats.ichor);
  copperCount.textContent = formatter.format(stats.copper);
  const seconds = Math.floor(quarry.tick / FPS);
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const phase = quarry.night ? 'Night' : 'Day';
  const prefix = quarry.skyMode === 'day' ? '' : `${phase.toUpperCase()} · `;
  timer.textContent = `${prefix}${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  timer.dateTime = `PT${seconds}S`;
  if (skyPhase.textContent !== phase) skyPhase.textContent = phase;
  lastReadoutTick = quarry.tick;
}

function setPaused(value) {
  paused = value;
  pausedByMode[gameMode] = value;
  pauseLabel.textContent = paused ? 'Resume' : 'Pause';
  liveLabel.textContent = paused ? 'PAUSED' : 'LIVE';
  live.classList.toggle('paused', paused);
  pauseMark.classList.toggle('play', paused);
  lag = 0;
  dirty = true;
}

function resetWorld(blank) {
  quarry.reset(blank);
  renderer.resetDamage();
  if (!blank) setCamera(START_VIEW, true);
  syncWeather();
  syncSkyMode();
  setPaused(false);
  updateReadouts();
  cursor = null;
  stroke = null;
  dirty = true;
  eventStatus.textContent = blank ? 'World cleared.' : 'Starting quarry restored.';
}

function switchMode(mode) {
  if (mode === gameMode) return;
  gameMode = mode;
  const monitoring = mode === 'watch';
  for (const button of modeButtons) button.setAttribute('aria-pressed', String(button.dataset.gameMode === mode));
  for (const element of sandboxView) element.hidden = monitoring;
  for (const element of watchView) element.hidden = !monitoring;
  document.body.classList.toggle('watch-active', monitoring);
  headingTitle.firstChild.nodeValue = monitoring ? 'Creek Watch' : 'Mosswake Creek';
  modeDescription.textContent = monitoring ? 'Gather copper by day. Defend the lake tower by night.'
    : 'Dig for copper and build dams around Mosswake’s pond.';
  resetButton.title = monitoring ? 'Start a new Creek Watch run' : 'Restore the starting quarry';
  world.setAttribute('aria-label', monitoring ? 'Creek Watch playfield' : 'Editable quarry');
  world.setAttribute('aria-describedby', monitoring ? 'watch-controls' : 'world-hint');
  cursor = null;
  stroke = null;
  walkKeys.clear();
  walkTarget = null;
  setPaused(pausedByMode[mode]);
  if (!monitoring) updateReadouts();
}

function setMenuVisibility(open) {
  menu.hidden = !open;
  for (const element of gameSurfaces) element.hidden = open;
  cursor = null;
  stroke = null;
  walkKeys.clear();
  walkTarget = null;
  lag = 0;
  dirty = true;
  window.scrollTo(0, 0);
}

function drawMainMenu(timestamp) {
  const tick = reducedMenuMotion.matches ? 0 : Math.floor(timestamp / 46);
  if (menuVisualTick === tick) return;
  if (!menuRenderer) {
    menuQuarry = new Quarry();
    menuRenderer = new QuarryRenderer(menuCanvas);
  }
  menuVisualTick = tick;
  menuQuarry.tick = tick;
  menuRenderer.draw(menuQuarry, null, START_VIEW);
}

function setWatchText(element, value) {
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

function drawWatchMode() {
  if (!watchRenderer) {
    watchQuarry = new Quarry();
    watchQuarry.creatures.length = 0;
    watchRenderer = new QuarryRenderer(world);
  }
  watchQuarry.tick = watch.tick;
  watchQuarry.weather = watch.phase === 'night' ? 'storm' : 'rain';
  if (!watch.insideTower) watchRenderer.draw(watchQuarry, null, watch.camera, watchRenderOptions);
  drawCreekWatch(watchRenderer.ctx, watch);
  const active = watch.status === 'running';
  const finished = watch.status === 'lost';
  setWatchText(liveLabel, finished ? 'LOST' : paused ? 'PAUSED' : watch.insideTower ? 'INSIDE' : active ? 'LIVE' : 'READY');
  const phase = watch.bloodMoon ? 'BLOOD MOON' : watch.phase.toUpperCase();
  setWatchText(timer, watch.insideTower ? 'OUTSIDE PAUSED' : `${phase} ${watch.day} · ${watch.secondsLeft}s`);
  timer.dateTime = `PT${watch.secondsLeft}S`;
  setWatchText(watchArea, watch.insideTower ? 'Tower dining room' : WORLD_AREAS[Math.floor(watch.player.x / VIEW_WIDTH)]);
  setWatchText(watchPanelTitle, watch.insideTower ? 'Dining room' : 'Signal tower');
  setWatchText(watchPanelDescription, watch.insideTower ? 'A little room above the creek. The outside watch pauses while you rest.'
    : 'Keep the light burning as long as you can.');
  world.setAttribute('aria-label', watch.insideTower ? 'Tower dining room. Walk with A and D or tap the floor. Press E to leave.' : 'Creek Watch playfield');
  watchMapRoute.hidden = watch.insideTower;
  watchMapDestinations.hidden = watch.insideTower;
  const position = `${(watch.player.x / WATCH_BOUNDS.right * 100).toFixed(2)}%`;
  if (watchPosition.style.left !== position) watchPosition.style.left = position;
  const night = watch.phase === 'night';
  const portalStatus = watch.insideTower ? `Day ${watch.day} · ${watch.secondsLeft}s remaining outside`
    : night ? (watch.portalOpening < 1 ? 'Portals opening' : 'Portals open') : 'Portals dormant';
  if (watchPortalState.dataset.open !== String(night)) watchPortalState.dataset.open = String(night);
  setWatchText(watchPortalState, portalStatus);
  setWatchText(watchCoins, watch.coins);
  watchHealth.value = watch.signal;
  setWatchText(watchHealthLabel, `${watch.signal}/${WATCH_HEALTH}`);
  watch.posts.forEach((post, index) => {
    const wall = post.health ? `Wall ${post.health}/${watch.maxWall(post)}` : 'No wall';
    const forward = watch.forwardWalls[index];
    const defense = forward.tier ? `${wall} · Forward ${forward.health}/${watch.maxWall(forward)}` : wall;
    const guards = `${post.guards.length} ${post.guards.length === 1 ? 'guard' : 'guards'}`;
    const veterans = post.guards.filter(({ rank }) => rank === 1).length;
    setWatchText(watchBankLabels[index], `${defense} · ${guards}${veterans ? ` · ${veterans} veteran${veterans === 1 ? '' : 's'}` : ''}`);
  });
  const action = watch.getAction();
  const cost = action?.cost ? ` · ${action.cost} copper` : '';
  const label = watch.status === 'ready' ? 'Begin watch' : finished ? 'New watch'
    : action ? action.label + cost : 'No station nearby';
  setWatchText(watchAction, label);
  watchAction.disabled = active && (paused || !action || action.kind === 'shelter');
  const tower = watch.getTowerAction();
  watchTower.hidden = !tower || watch.insideTower;
  if (tower) {
    setWatchText(watchTower, `${tower.label}${tower.cost ? ` · ${tower.cost} copper` : ''}`);
    watchTower.disabled = paused;
  }
  const training = action?.kind === 'hire' ? watch.getTrainingAction() : null;
  watchTrain.hidden = !training;
  if (training) {
    setWatchText(watchTrain, `${training.label} · ${training.cost} copper`);
    watchTrain.disabled = paused;
  }
  watchMarketRoute.hidden = !watch.marketOpen;
  watchSwing.hidden = !watch.weapon || watch.insideTower;
  if (watch.weapon) {
    setWatchText(watchSwing, `Swing ${WATCH_MARKET_ITEMS[watch.weapon].name}`);
    watchSwing.disabled = paused || !watch.canSwing;
  }
  for (const button of watchMoveButtons) button.disabled = finished || (paused && active)
    || (watch.insideTower && button.hasAttribute('data-watch-destination'));
  setWatchText(watchMessage, watch.message);
}

function renderWatchMarketStock(vendor, focusItem) {
  setWatchText(watchMarketBalance, `${watch.coins} copper available`);
  watchMarketStock.replaceChildren();
  let nextFocus;
  for (const [id, item] of Object.entries(WATCH_MARKET_ITEMS)) {
    if (item.vendor !== vendor.id) continue;
    const owned = watch.gear.includes(id);
    const equipped = watch.weapon === id;
    const entry = document.createElement('li');
    const icon = document.createElement('canvas');
    icon.width = icon.height = 24;
    icon.setAttribute('aria-hidden', 'true');
    drawWatchMarketIcon(icon, id);
    const info = document.createElement('div');
    const name = document.createElement('strong');
    name.textContent = item.name;
    const detail = document.createElement('small');
    detail.textContent = item.description ?? `${item.damage} damage · ${item.reach} reach${item.targets ? ' · Hits up to two Tri' : ''}`;
    info.append(name, detail);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button';
    button.textContent = equipped ? 'Equipped' : owned ? (item.damage ? 'Equip' : 'Owned') : `Buy · ${item.cost} copper`;
    button.setAttribute('aria-label', `${button.textContent} ${item.name}`);
    button.disabled = equipped || (owned && !item.damage);
    if (id === focusItem && !button.disabled) nextFocus = button;
    button.addEventListener('click', () => {
      watch.buyMarketItem(id);
      setWatchText(watchMarketStatus, watch.message);
      renderWatchMarketStock(vendor, id);
      dirty = true;
    });
    entry.append(icon, info, button);
    watchMarketStock.append(entry);
  }
  if (focusItem) (nextFocus ?? watchMarketDialog.querySelector('.close-button')).focus();
}

function openWatchMarket(vendor) {
  walkKeys.clear();
  walkTarget = null;
  setWatchText(watchMarketTitle, `${vendor.name}’s stall`);
  setWatchText(watchMarketTrade, vendor.trade);
  setWatchText(watchMarketStatus, '');
  watchMarketPortrait.setAttribute('aria-label', `Portrait of ${vendor.name}`);
  drawWatchVendorPortrait(watchMarketPortrait, vendor);
  renderWatchMarketStock(vendor);
  watchMarketDialog.showModal();
}

function swingWatchWeapon() {
  if (!paused && watch.swing()) dirty = true;
}

function useWatchStation(kind) {
  if (watch.status === 'lost') {
    watch.reset();
    walkKeys.clear();
    walkTarget = null;
  }
  if (watch.status === 'ready') setPaused(false);
  if (!paused) {
    const wasInside = watch.insideTower;
    const action = kind === 'train' || kind === 'tower' ? null : watch.getAction();
    if (action?.kind === 'market') openWatchMarket(action.vendor);
    else watch.use(kind);
    if (watch.insideTower !== wasInside) {
      walkKeys.clear();
      walkTarget = null;
      lag = 0;
      world.focus({ preventScroll: true });
    }
  }
  dirty = true;
}

function walkWatchTo(target) {
  if (watch.status === 'ready') {
    watch.start();
    setPaused(false);
  }
  if (paused || watch.status !== 'running') return;
  const bounds = watch.insideTower ? WATCH_TOWER_ROOM : WATCH_BOUNDS;
  walkTarget = Math.max(bounds.left, Math.min(bounds.right, target));
  dirty = true;
}

function watchMotion() {
  const left = walkKeys.has('a') || walkKeys.has('arrowleft');
  const right = walkKeys.has('d') || walkKeys.has('arrowright');
  if (left || right) return Number(right) - Number(left);
  if (walkTarget === null) return 0;
  const distance = walkTarget - (watch.insideTower ? watch.interiorX : watch.player.x);
  if (Math.abs(distance) <= 2) {
    walkTarget = null;
    return 0;
  }
  return Math.sign(distance);
}

function playMode(mode) {
  setMenuVisibility(false);
  switchMode(mode);
  if (mode === 'watch' && watch.start()) setPaused(false);
  world.focus({ preventScroll: true });
}

function reportWatchSaveError(error) {
  console.warn('Creek Watch save operation failed', error);
  watchSaveStatus.textContent = error.name === 'QuotaExceededError' ? 'This browser has no room for another save.'
    : error.name === 'SecurityError' ? 'This browser blocked local saves for this file.'
      : error.message || 'The save operation failed.';
}

function watchSlotButton(label, name, onClick) {
  const button = document.createElement('button');
  button.className = 'button';
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', `${label} ${name}`);
  button.addEventListener('click', () => {
    try {
      onClick();
    } catch (error) {
      reportWatchSaveError(error);
    }
  });
  return button;
}

function renderWatchSlots(message = '') {
  const { slots, unreadable } = listWatchSlots(window.localStorage);
  watchSlotList.replaceChildren();
  for (const slot of slots) {
    const row = document.createElement('li');
    const details = document.createElement('div');
    const title = document.createElement('strong');
    const summary = document.createElement('small');
    details.className = 'watch-slot-details';
    title.textContent = slot.name;
    const phase = slot.phase === 'day' ? 'Day' : 'Night';
    summary.textContent = `${phase} ${slot.day} · ${slot.coins} copper${slot.status === 'lost' ? ' · Tower fell' : ''}`;
    details.append(title, summary);
    row.append(details, watchSlotButton('Load', slot.name, () => {
      if (watch.status === 'running' && watch.tick > 0 && !window.confirm(`Load “${slot.name}” over the current run?`)) return;
      watch = loadWatchSlot(window.localStorage, slot.id);
      watchSavesDialog.close();
      playMode('watch');
      setPaused(false);
    }), watchSlotButton('Update', slot.name, () => {
      if (!window.confirm(`Replace “${slot.name}” with the current run?`)) return;
      saveWatchSlot(window.localStorage, watch, slot.name, slot.id);
      renderWatchSlots(`Updated “${slot.name}”.`);
    }));
    watchSlotList.append(row);
  }
  watchSaveStatus.textContent = message || (unreadable ? 'Some save slots could not be read.' : slots.length ? '' : 'No saves yet.');
}

watchSaveName.maxLength = WATCH_SAVE_NAME_LIMIT;
watchSaveForm.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const name = watchSaveName.value.trim();
    saveWatchSlot(window.localStorage, watch, name);
    watchSaveForm.reset();
    renderWatchSlots(`Saved “${name}”.`);
  } catch (error) {
    reportWatchSaveError(error);
  }
});
for (const button of document.querySelectorAll('[data-open-watch-saves]')) {
  button.addEventListener('click', () => {
    walkKeys.clear();
    walkTarget = null;
    watchSavesDialog.showModal();
    try {
      renderWatchSlots();
    } catch (error) {
      watchSlotList.replaceChildren();
      reportWatchSaveError(error);
    }
  });
}

for (const button of modeButtons) button.addEventListener('click', () => switchMode(button.dataset.gameMode));
for (const button of menuButtons) button.addEventListener('click', () => playMode(button.dataset.menuPlay));
document.querySelector('#menu-return').addEventListener('click', () => {
  setMenuVisibility(true);
  menuButtons.find((button) => button.dataset.menuPlay === gameMode).focus({ preventScroll: true });
});
watchAction.addEventListener('click', () => useWatchStation());
watchTower.addEventListener('click', () => useWatchStation('tower'));
watchTrain.addEventListener('click', () => useWatchStation('train'));
watchSwing.addEventListener('click', swingWatchWeapon);
watchMarketDialog.addEventListener('close', () => world.focus({ preventScroll: true }));
for (const button of watchMoveButtons) {
  button.addEventListener('click', () => {
    if (watch.insideTower && button.hasAttribute('data-watch-destination')) return;
    const target = watchDestinations[button.dataset.watchDestination]
      ?? (walkTarget ?? (watch.insideTower ? watch.interiorX : watch.player.x)) + Number(button.dataset.watchMove) * 47;
    walkWatchTo(target);
  });
}

brush.addEventListener('input', updateBrush);
updateBrush();
syncWeather();
syncSkyMode();
updateReadouts();
for (const button of weatherButtons) {
  button.addEventListener('click', () => {
    quarry.setWeather(button.dataset.weather);
    syncWeather();
    dirty = true;
  });
}
for (const button of skyButtons) {
  button.addEventListener('click', () => {
    quarry.setSkyMode(button.dataset.skyMode);
    syncSkyMode();
    updateReadouts();
    dirty = true;
  });
}
cameraSlider.max = WIDTH - VIEW_WIDTH;
setCamera(START_VIEW, true);
cameraSlider.addEventListener('input', () => setCamera(cameraSlider.valueAsNumber, true));
panWest.addEventListener('click', () => setCamera(cameraTarget - VIEW_WIDTH));
panEast.addEventListener('click', () => setCamera(cameraTarget + VIEW_WIDTH));
pauseButton.addEventListener('click', () => setPaused(!paused));
resetButton.addEventListener('click', () => {
  if (gameMode === 'sandbox') resetWorld(false);
  else {
    watch.reset();
    walkKeys.clear();
    walkTarget = null;
    setPaused(false);
  }
});
document.querySelector('#help').addEventListener('click', () => guide.showModal());
document.querySelector('#clear').addEventListener('click', () => {
  clearDialog.returnValue = 'cancel';
  clearDialog.showModal();
});
clearDialog.addEventListener('close', () => {
  if (clearDialog.returnValue === 'clear') resetWorld(true);
});

function clamp(value, max) {
  return Math.max(0, Math.min(max - 1, value));
}

function setCamera(value, immediate = false) {
  cameraTarget = clamp(value, WIDTH - VIEW_WIDTH + 1);
  if (immediate) camera = cameraTarget;
  const middle = cameraTarget + VIEW_WIDTH / 2;
  const area = WORLD_AREAS[Math.floor(middle / VIEW_WIDTH)];
  cameraSlider.value = cameraTarget;
  cameraSlider.setAttribute('aria-valuetext', area);
  if (areaName.textContent !== area) areaName.textContent = area;
  panWest.disabled = cameraTarget === 0;
  panEast.disabled = cameraTarget === WIDTH - VIEW_WIDTH;
  cursor = null;
  stroke = null;
  dirty = true;
}

function pointerPosition(event) {
  const bounds = world.getBoundingClientRect();
  return {
    x: Math.round(camera) + clamp(Math.floor((event.clientX - bounds.left) * VIEW_WIDTH / bounds.width), VIEW_WIDTH),
    y: clamp(Math.floor((event.clientY - bounds.top) * HEIGHT / bounds.height), HEIGHT)
  };
}

function brushRadius() {
  const size = brush.valueAsNumber;
  return selected.breaker && size === 1 ? 0 : size;
}

function applyAt(point) {
  if (selected.breaker) {
    renderer.breakBrush(quarry, point.x, point.y, brushRadius(), Math.round(camera));
  } else if (selected.entity) {
    let placed;
    let failure = `No room to place ${selected.label} here.`;
    if (selected.boss) {
      if (quarry.bosses.some((boss) => boss.type === selected.entity)) {
        failure = `${selected.label} is already active.`;
      } else {
        placed = quarry.placeBoss(selected.entity, point.x, point.y);
        failure = selected.hint;
      }
    } else if (selected.entity === 'tri') placed = quarry.placeTri(point.x, point.y);
    else if (selected.entity === 'portal') placed = quarry.placePortal(point.x, point.y);
    else if (selected.scenery) placed = quarry.placeScenery(selected.entity, point.x, point.y, { converted: selected.converted });
    else placed = quarry.placeCreature(selected.entity, point.x, point.y, { converted: selected.converted });
    hint.textContent = placed ? selected.hint : failure;
    eventStatus.textContent = placed ? `${selected.label} placed.` : failure;
  } else {
    quarry.paint(selected.material, point.x, point.y, brushRadius(), selected.converted);
  }
  dirty = true;
}

function applySegment(from, to) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (!distance && selected.breaker) return;
  const steps = Math.max(1, Math.ceil(distance / Math.max(1, brush.valueAsNumber / 2)));
  for (let step = 1; step <= steps; step++) {
    const progress = step / steps;
    applyAt({ x: Math.round(from.x + (to.x - from.x) * progress), y: Math.round(from.y + (to.y - from.y) * progress) });
  }
}

world.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || !event.isPrimary) return;
  if (gameMode === 'watch') {
    const bounds = world.getBoundingClientRect();
    world.focus({ preventScroll: true });
    walkWatchTo((watch.insideTower ? 0 : watch.camera) + (event.clientX - bounds.left) * VIEW_WIDTH / bounds.width);
    return;
  }
  keyboardAim = false;
  world.focus({ preventScroll: true });
  cursor = pointerPosition(event);
  applyAt(cursor);
  if (selected.entity) return;
  world.setPointerCapture(event.pointerId);
  stroke = { id: event.pointerId, point: cursor };
});
world.addEventListener('pointermove', (event) => {
  if (!event.isPrimary || gameMode === 'watch') return;
  keyboardAim = false;
  cursor = pointerPosition(event);
  if (stroke?.id === event.pointerId) {
    applySegment(stroke.point, cursor);
    stroke.point = cursor;
  }
  dirty = true;
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  world.addEventListener(name, (event) => {
    if (stroke?.id === event.pointerId) stroke = null;
    if (event.pointerType !== 'mouse') cursor = null;
    dirty = true;
  });
}
world.addEventListener('pointerleave', () => {
  if (!stroke && !keyboardAim) cursor = null;
  dirty = true;
});
world.addEventListener('blur', () => {
  if (keyboardAim) cursor = null;
  keyboardAim = false;
  dirty = true;
});
world.addEventListener('wheel', (event) => {
  if (gameMode === 'watch') return;
  const delta = event.shiftKey ? event.deltaY || event.deltaX : event.deltaX;
  if (!delta) return;
  event.preventDefault();
  const scale = event.deltaMode === 0 ? 1 : 20;
  setCamera(cameraTarget + Math.round(delta * scale));
}, { passive: false });

const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

document.addEventListener('keydown', (event) => {
  if (!menu.hidden || event.altKey || event.ctrlKey || event.metaKey || guide.open || clearDialog.open
      || watchSavesDialog.open || watchMarketDialog.open) return;
  if (event.target instanceof HTMLInputElement) return;
  const key = event.key.toLowerCase();
  if (key === ' ' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault();
    if (!event.repeat) setPaused(!paused);
    return;
  }
  if (gameMode === 'watch') {
    if (Object.hasOwn(watchMoveKeys, key)) {
      event.preventDefault();
      if (watch.status === 'ready') {
        watch.start();
        setPaused(false);
      }
      walkTarget = null;
      walkKeys.add(key);
    } else if (key === 'e' && !event.repeat) {
      event.preventDefault();
      useWatchStation();
    } else if (key === 'f' && !event.repeat) {
      event.preventDefault();
      swingWatchWeapon();
    }
    return;
  }
  const tools = variantMode ? TRI_TOOLS : TOOLS;
  const tool = tools.find((option) => option.key === key || (key === 'e' && option.material === ERASE));
  if (tool) {
    selectTool(tool);
    return;
  }
  if (key === 'a' || key === 'd') {
    event.preventDefault();
    setCamera(cameraTarget + (key === 'a' ? -1 : 1) * Math.round(VIEW_WIDTH / 8));
    return;
  }
  if (event.target !== world) return;
  const direction = directions[event.key];
  if (!direction && key !== 'enter') return;
  event.preventDefault();
  keyboardAim = true;
  const left = Math.round(camera);
  cursor ??= { x: left + Math.floor(VIEW_WIDTH / 2), y: Math.floor(HEIGHT / 2) };
  if (direction) {
    const step = event.shiftKey ? 1 : 4;
    cursor = { x: left + clamp(cursor.x - left + direction[0] * step, VIEW_WIDTH),
      y: clamp(cursor.y + direction[1] * step, HEIGHT) };
    dirty = true;
  } else if (!event.repeat || !selected.entity) {
    applyAt(cursor);
  }
});
document.addEventListener('keyup', (event) => walkKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => walkKeys.clear());

function loop(timestamp) {
  const elapsed = Math.min(timestamp - (lastFrame || timestamp), 120);
  lastFrame = timestamp;
  if (!menu.hidden) {
    drawMainMenu(timestamp);
    requestAnimationFrame(loop);
    return;
  }
  if (gameMode === 'sandbox' && camera !== cameraTarget) {
    const difference = cameraTarget - camera;
    camera = Math.abs(difference) < 0.55 ? cameraTarget : camera + difference * (1 - Math.exp(-elapsed / 60));
    dirty = true;
  }
  if (!paused && !guide.open && !clearDialog.open && !watchSavesDialog.open && !watchMarketDialog.open
      && (gameMode === 'sandbox' || watch.status === 'running')) {
    lag += elapsed;
    while (lag >= INTERVAL) {
      if (gameMode === 'watch') watch.step(watchMotion());
      else {
        if (stroke && !selected.entity && !selected.breaker) applyAt(stroke.point);
        quarry.step();
      }
      lag -= INTERVAL;
      dirty = true;
    }
  }
  if (dirty) {
    if (gameMode === 'watch') drawWatchMode();
    else {
      const radius = selected.entity ? 3 : brushRadius();
      renderer.draw(quarry, cursor && { ...cursor, radius }, Math.round(camera));
      if ((paused && !stroke) || quarry.tick - lastReadoutTick >= 10) updateReadouts();
    }
    dirty = false;
  }
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
