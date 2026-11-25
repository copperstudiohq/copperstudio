import {
  STARS, WEATHER, DIETS, BODY_SHAPES, PATTERNS, MOTION, ACTIVITY, STAGES, SPECIES_LIMIT, SPECIES_CAPACITY,
  LARGE_EVOLUTION_MINIMUM, LARGE_SPECIES_LIMIT, largeEvolutionProgress,
  DEFAULT_PALETTE, PLANET_SIZES, MAX_PLANETS, MAX_PONDS, MAX_CREATURES, MAX_TREES, TREE_GROWTH,
  STEP, newSystem, addPlanet, addPond, applyTerrainStroke, basinWaterAt, climateLimit, spawnCells, tick, orbitAU, paintTerrain, planetPalette, planetSize, planetTemperature, pondDistance,
  longitudeDistance, wrap, clamp, camouflageAt, comfortableTemperature, creatureMaturity, creatureSize, grassProfile, grassSeedSource, habitatAt, habitatSurface, iceCover, landGrassPercentage, landPopulation,
  extraLimbCount, limbCount, pondPlantStage, releasePlantCells,
  seedGrass, setFounderTemperature, shoreAdaptation, speciesTraits, starAppearance, systemRandom, treeSpecies,
} from './model.mjs';
import { HABITAT_LAYERS, Scene } from './scenes.mjs';
import { drawAnimalModel } from './animal-model.mjs';
import { CALL_SECONDS, MAX_SPECIES_CALLS, SpeciesAudio, putSpeciesCall, speciesCall } from './species-calls.mjs';
import { mountLineage } from './lineage.mjs';
import { createSlotStore } from './slot-store.mjs';
import { createBackup, readBackup } from './save-backup.mjs';
import { mountPopulationHistory } from './population-history.mjs';

const paths = {
  orbit: '<circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-40 12 12)"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
  drop: '<path d="M12 2.9c3.2 4.5 7 8.1 7 12a7 7 0 1 1-14 0c0-3.9 3.8-7.5 7-12Z"/><path d="M8 15a4 4 0 0 0 3 3.9"/>',
  save: '<path d="M4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M7 3v6h9V3M7 21v-7h10v7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sliders: '<path d="M4 7h5m4 0h7M4 12h10m4 0h2M4 17h2m4 0h10M9 5v4m5 1v4m-8 1v4"/>',
  pointer: '<path d="m5 3 13 10-7 1-3 6L5 3Z"/>',
  pause: '<path d="M9 5v14m6-14v14" stroke-width="2.7"/>',
  play: '<path d="m8 5 11 7-11 7V5Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  left: '<path d="M20 12H4m7 7-7-7 7-7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  reset: '<path d="M4 11a8 8 0 1 1 2 6M4 5v6h6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2m3-7 2 2m10 10 2 2m0-14-2 2M7 17l-2 2"/>',
  rain: '<path d="M4 15a4 4 0 0 1 1-7 5 5 0 0 1 9-2 5 5 0 0 1 5 9M8 15l-2 4m6-4-2 4m6-4-2 4"/>',
  storm: '<path d="M5 16a4 4 0 0 1 0-8 5 5 0 0 1 9-2 5 5 0 0 1 5 9m-6-3-4 5h4l-2 5"/>',
  snow: '<path d="M12 3v18M4 7l16 10M20 7 4 17M9 5l3 3 3-3m-6 14 3-3 3 3"/>',
  wave: '<path d="M3 8c3-4 6 4 9 0s6 4 9 0M3 15c3-4 6 4 9 0s6 4 9 0"/>',
  land: '<path d="m2 19 7-11 4 6 3-4 6 9H2Z"/>',
  sprout: '<path d="M12 21v-8m0 4C6 17 3 14 3 8c5 0 9 3 9 8Zm0-3c0-6 3-9 9-9 0 6-3 9-9 9Z"/>',
  cells: '<path d="M10 4c5-2 10 1 10 6 1 5-3 9-8 10-4 1-8-2-8-7 0-4 2-7 6-9Z"/><circle cx="12" cy="12" r="3"/>',
  spark: '<path d="M12 2c0 6 4 10 10 10-6 0-10 4-10 10 0-6-4-10-10-10 6 0 10-4 10-10Z"/>',
  hunt: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
  temperature: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 10v6"/>',
};
const svg = (name) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
const icon = (name) => '<span data-icon="' + name + '" aria-hidden="true">' + svg(name) + '</span>';
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const $ = (selector) => document.querySelector(selector);
for (const glyph of document.querySelectorAll('[data-icon]')) glyph.innerHTML = svg(glyph.dataset.icon);

const canvas = $('#scene');
const scene = new Scene(canvas);
const speciesAudio = new SpeciesAudio();
const inspector = $('#inspector-body');
const dialog = $('#save-dialog');
const slots = createSlotStore();
const lineageDialog = $('#lineage-dialog');
const historyDialog = $('#history-dialog');
const openHistory = mountPopulationHistory(historyDialog);
let system = newSystem();
const planetDesign = { ...DEFAULT_PALETTE, size: 'medium' };
let view = 'system';
let planetId = null;
let pondId = null;
let tool = null;
let selected = null;
let tracking = null;
let habitatLayer = 'natural';
const habitatSamples = new WeakMap();
let pointer = null;
let keyboard = false;
let brush = .055;
let batch = 8;
let rate = 1;
let paused = false;
let gesture = null;
let ignoreClick = false;
let cameras = new Map();
let landCameras = new Map();
let pondCameras = new Map();
const terrainHistory = new WeakMap();
let toastTimeout;
let accumulator = 0;
let previousTime = performance.now();
let uiTime = 0;
let slotListing = 0;
let slotOperation = false;
const LAND_ZOOM = [.65, 1, 1.55, 2.35, 3.6];
const POND_ZOOM = [1, 1.55, 2.4, 3.6];
const GLOBE_ZOOM = [.82, 1, 1.35, 1.8, 2.7, 4.2];

const planetNow = () => system.planets.find((planet) => planet.id === planetId);
const pondNow = () => planetNow()?.ponds.find((pond) => pond.id === pondId);
function selectedCreature() {
  if (selected === null) return undefined;
  if (view === 'pond') return pondNow()?.creatures.find((cell) => cell.id === selected);
  return planetNow()?.walkers.find((cell) => cell.pondId + '/' + cell.id === selected);
}
const openLineage = mountLineage(lineageDialog, planetNow);
const defaultCamera = () => ({ lon: 0, lat: .06 });
const cameraNow = () => {
  if (!cameras.has(planetId)) cameras.set(planetId, defaultCamera());
  return cameras.get(planetId);
};
const globeCenter = ({ lon, lat }) => ({ x: wrap(.5 + lon / (Math.PI * 2)), y: .5 - lat / Math.PI });

function defaultLandCamera() {
  const pond = pondNow() ?? planetNow().ponds[0];
  if (pond) return { x: pond.x, y: pond.y, zoom: pond.radiusScale ? 1 : LAND_ZOOM[0] };
  return globeCenter(cameraNow());
}
const landCameraNow = () => {
  if (!landCameras.has(planetId)) landCameras.set(planetId, defaultLandCamera());
  return landCameras.get(planetId);
};
const defaultPondCamera = () => ({ x: .5, y: .5, zoom: 1 });
const pondCameraNow = () => {
  if (!pondCameras.has(pondId)) pondCameras.set(pondId, defaultPondCamera());
  return pondCameras.get(pondId);
};
const weatherIcons = { clear: 'sun', rain: 'rain', storm: 'storm', snow: 'snow' };
const hints = {
  system: 'Click a planet to explore its surface.',
  surface: 'Drag to rotate. Click water to enter a pond.',
  pond: 'Click an organism to inspect it. Zoom in for a closer look.',
  land: 'Drag to pan. Click an organism to inspect it.',
  seeds: 'Click dry ground to scatter seeds from an existing grass patch.',
  planet: 'Click inside the outer ring to place a planet.',
  'place-pond': 'Click dry land to place a pond.',
  ocean: 'Drag to carve a basin. Rain fills it.',
  stone: 'Drag to paint stone. Toggle off to rotate.',
  cells: 'Click in the water to release creature cells.',
  'plant-cells': 'Click in the water to release plant cells.',
  probe: 'Click ground or water to sample that spot.',
};

function notify(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.toggleAttribute('data-error', error);
  toast.hidden = false;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { toast.hidden = true; }, 3100);
}

function renderNavigation() {
  const planet = planetNow();
  const pond = pondNow();
  const colors = planet ? planetPalette(planet) : DEFAULT_PALETTE;
  const views = {
    system: ['orbit', 'Solar system', system.name, 'Place planets and explore the worlds you create.', 'Orbital view'],
    surface: ['globe', 'Planet surface', planet?.name, 'Carve basins, bring rain, and watch life climb out of the water.', 'Globe view'],
    pond: ['drop', 'Pond ecosystem', 'Pond', 'Grow algae and watch creatures evolve underwater.', 'Underwater'],
    land: ['sprout', 'Land ecosystem', planet?.name, 'Watch animals pair and hatch as grass adapts to its habitat.', 'Surface habitat'],
  };
  const [symbol, location, title, description, viewLabel] = views[view];
  $('#location').innerHTML = icon(symbol) + location;
  $('#scene-title').textContent = title;
  $('#scene-description').textContent = description;
  $('#view-label').textContent = viewLabel;
  $('#back').hidden = view === 'system';
  $('#reset-view').hidden = view === 'system';
  $('#map-zoom').hidden = view === 'system';
  if (view !== 'system') renderZoom();
  $('#back-label').textContent = view === 'pond' || view === 'land' ? planet?.name : 'System';
  $('#map-legend').innerHTML = view === 'surface' ? legend(colors.water, 'Water') + legend(colors.stone, 'Stone') :
    view === 'pond' || view === 'land' ? legend(colors.water, 'Water') +
      legend(grassProfile(planet).color, view === 'pond' ? 'Algae' : 'Grass') : '';
  for (const button of document.querySelectorAll('[data-nav]')) {
    const name = button.dataset.nav;
    button.disabled = ((name === 'surface' || name === 'land') && !planet) || (name === 'pond' && !pond);
    if (name === view) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  }
  const canvasLabel = { system: 'Solar system map', surface: 'Planet surface map', pond: 'Pond ecosystem', land: 'Land ecosystem map' }[view];
  const cameraHelp = view === 'surface' ? ' Use Shift and arrow keys to rotate the globe. Use plus and minus to zoom.' :
    view === 'land' || view === 'pond' ? ' Use Shift and arrow keys to pan. Use plus and minus to zoom.' : '';
  canvas.setAttribute('aria-label', canvasLabel + '. Use arrow keys to move the cursor and Enter to interact.' + cameraHelp);
  $('#scene-frame').dataset.view = view;
}

function legend(color, label) {
  return '<span><i class="dot" style="--color:' + color + '"></i>' + label + '</span>';
}

function section(title, contents, extra = '') {
  return '<section class="panel-part"><div class="part-heading"><h3>' + escape(title) + '</h3>' +
    (extra ? '<span>' + extra + '</span>' : '') + '</div>' + contents + '</section>';
}

function action(name, label, symbol, active = false, disabled = false) {
  return '<button class="primary" type="button" data-tool="' + name + '" aria-pressed="' + active + '"' +
    (disabled ? ' disabled' : '') + '>' + icon(active ? 'close' : symbol) + label + '</button>';
}

function populationHistoryButton() {
  return '<button class="secondary wide population-open" type="button" data-open-history>' + icon('clock') + 'Population history</button>';
}

function bodySystem() {
  const star = starAppearance(system);
  const swatches = Object.entries(STARS).map(([key, item]) =>
    '<button class="swatch" type="button" data-star="' + key + '" aria-pressed="' + (!system.sunTint && key === system.sun) +
    '" style="--color:' + item.color + '"><i></i>' + item.name + '</button>').join('');
  const planets = system.planets.map((planet) => '<button type="button" data-open-planet="' + escape(planet.id) +
    '"><span class="planet-avatar" style="--color:' + planetPalette(planet).stone + '"></span><span><strong>' + escape(planet.name) +
    '</strong><small>' + orbitAU(planet.orbit) + ' AU · ' + planetSize(planet).name + ' · ' + planetTemperature(planet) +
    '°C' + (climateLimit(planet.orbit) ? ' · ' + climateLimit(planet.orbit) : '') + '</small></span>' + icon('chevron') + '</button>').join('');
  const colors = '<div class="field-row palette">' + colorField('stone-color', 'Stone color', planetDesign.stone) +
    colorField('water-color', 'Water color', planetDesign.water) + '</div>';
  const sizes = selectField('planet-size', 'Planet size', Object.fromEntries(Object.entries(PLANET_SIZES)
    .map(([key, size]) => [key, size.name])), planetDesign.size);
  return section('Sun color', '<div class="star-current" style="--color:' + star.color + ';--core:' + star.core + ';--rim:' + star.rim +
    '"><div class="star-avatar"></div><div><strong>Solara</strong><small>' + star.name + ' star</small></div>' +
    '<input id="sun-tint" type="color" value="' + star.color + '" aria-label="Custom sun color" title="Custom sun color"></div>' +
    '<div class="swatches">' + swatches + '</div>') +
    section('Planets', colors + sizes + action('planet', tool === 'planet' ? 'Cancel placement' : 'Place planet', 'plus', tool === 'planet', system.planets.length >= MAX_PLANETS) +
      '<div class="object-list">' + planets + '</div>', system.planets.length + ' / ' + MAX_PLANETS);
}

function updateSunPreview() {
  const star = starAppearance(system);
  const preview = inspector.querySelector('.star-current');
  preview.style.setProperty('--color', star.color);
  preview.style.setProperty('--core', star.core);
  preview.style.setProperty('--rim', star.rim);
  preview.querySelector('small').textContent = star.name + ' star';
  if ($('#sun-tint').value !== star.color) $('#sun-tint').value = star.color;
  for (const preset of inspector.querySelectorAll('[data-star]')) {
    preset.setAttribute('aria-pressed', !system.sunTint && preset.dataset.star === system.sun);
  }
}

function colorField(id, label, value) {
  return '<div class="field"><label for="' + id + '">' + label + '</label><input id="' + id +
    '" type="color" value="' + escape(value) + '"></div>';
}

function selectField(id, label, options, selected) {
  const choices = Object.entries(options).map(([value, text]) =>
    '<option value="' + value + '"' + (value === selected ? ' selected' : '') + '>' + text + '</option>').join('');
  return '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + choices + '</select></div>';
}

function bodySurface(planet) {
  const waterColor = planetPalette(planet).water;
  const weather = Object.entries(WEATHER).map(([key, item]) =>
    '<button type="button" data-weather="' + key + '" aria-pressed="' + (key === planet.weather) + '">' +
    icon(weatherIcons[key]) + item.name + '</button>').join('');
  const brushes = Object.entries({ ocean: 'Carve basin', stone: 'Restore stone' }).map(([key, label]) =>
    '<button type="button" data-tool="' + key + '" aria-pressed="' + (key === tool) + '">' +
    icon(key === 'ocean' ? 'wave' : 'land') + label + '</button>').join('');
  const ponds = planet.ponds.map((pond) => '<button type="button" data-open-pond="' + escape(pond.id) +
    '"><span class="pond-avatar" style="--color:' + waterColor + '">' + icon('drop') + '</span><span><strong>Pond' +
    '</strong><small data-pond-count="' + escape(pond.id) + '">' + pond.creatures.length + ' living creatures</small></span>' +
    icon('chevron') + '</button>').join('');
  return section('Terrain brush', '<div class="switches">' + brushes + '</div>' +
    range('brush', 'Brush size', 2, 14, .5, Math.round(brush * 1000) / 10, '%') + '<p id="basin-status" hidden></p>' +
    '<div class="terrain-history"><button type="button" class="secondary" data-terrain-history="undo">Undo brush</button>' +
    '<button type="button" class="secondary" data-terrain-history="redo">Redo brush</button></div>') +
    section('Weather', '<p id="local-climate" class="climate-readout"></p>' + climateNotice(planet) +
      '<p id="planet-ice" hidden></p><div class="switches">' + weather + '</div>' +
      '<label class="weather-cycle"><input type="checkbox" id="auto-weather"' + (planet.autoWeather ? ' checked' : '') + '>Cycle weather</label>',
      '<span id="ambient-temperature">' + planetTemperature(planet) + '°C</span>') +
    section('Ponds', action('place-pond', tool === 'place-pond' ? 'Cancel placement' : 'Place pond', 'plus',
      tool === 'place-pond', planet.ponds.length >= MAX_PONDS) + '<div class="object-list">' + ponds + '</div>',
    planet.ponds.length + ' / ' + MAX_PONDS) +
    '<div class="panel-part"><button class="secondary wide" type="button" data-open-land>' +
    icon('sprout') + 'Explore land</button>' + populationHistoryButton() + '</div><div id="creature-panel" hidden></div>';
}

function bodyLand(planet) {
  const layers = Object.fromEntries(Object.entries(HABITAT_LAYERS).map(([key, layer]) => [key, layer.name]));
  return section('Local conditions', '<p id="local-climate" class="climate-readout"></p>' + climateNotice(planet) +
      '<p id="habitat-sample" hidden></p><p id="ocean-algae-count" hidden></p>' +
      '<details class="designer-options"><summary>Habitat map</summary>' + selectField('habitat-layer', 'Map layer', layers, habitatLayer) +
      '<div id="habitat-key" class="habitat-key" hidden><span></span><i aria-hidden="true"></i><span></span></div>' +
      action('probe', 'Sample habitat', 'temperature', tool === 'probe') +
      '<button type="button" class="secondary wide habitat-clear" data-clear-sample hidden>Clear sample</button></details>') +
    section('Small species', '<div class="species-list" id="species-list"></div><p id="species-note">Land animals arrive from ponds.</p>' +
      populationHistoryButton(),
    '<span id="species-total">0 / ' + SPECIES_LIMIT + '</span>') +
    section('Large species', '<p id="large-species-progress"></p><div class="species-list" id="large-species-list"></div>' +
      '<button class="secondary wide lineage-button" type="button" data-large-lineage hidden>' + icon('cells') +
      'View evolution tree</button>', '<span id="large-species-total">0 / ' + LARGE_SPECIES_LIMIT + '</span>') +
    section('Grass', action('seeds', 'Scatter grass seeds', 'sprout', tool === 'seeds', !grassSeedSource(planet)) +
      '<p id="grass-seed-note">Grow plant cells into algae in a pond. Grass seeds become available after grass roots on the shore.</p>' +
      '<p id="grass-cover"></p><p id="soil-nutrients"></p>', grassProfile(planet).name) +
    section('Trees', '<div class="species-list" id="tree-species"></div><p id="tree-note">Trees take root after grass matures.</p>',
      '<span id="tree-total">0 / ' + MAX_TREES + '</span>') +
    '<div id="creature-panel" hidden></div>';
}

function range(id, label, min, max, step, value, suffix = '') {
  return '<div class="field"><label for="' + id + '">' + label + '<output id="' + id +
    '-output" for="' + id + '">' + escape(value) + suffix + '</output></label><input type="range" id="' + id +
    '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + escape(value) + '"></div>';
}

function climateNotice(planet) {
  const limit = climateLimit(planet.orbit);
  return limit ? '<p class="climate-limit">' + limit + ' at this distance from Solara.</p>' : '';
}

function bodyPond(pond) {
  const { genome, algaeDesign } = pond;
  const look = '<details class="designer-options"><summary>Body and colors</summary>' +
    '<div class="field-row">' + colorField('tint', 'Membrane', genome.color) + colorField('nucleus', 'Nucleus', genome.nucleus) + '</div>' +
    '<div class="field-row">' + selectField('shape', 'Shape', BODY_SHAPES, genome.shape) +
    selectField('pattern', 'Pattern', PATTERNS, genome.pattern) + '</div>' +
    range('size', 'Body size', .7, 1.8, .1, genome.size, '×') + '</details>';
  const traits = '<details class="designer-options"><summary>Behavior and inheritance</summary>' +
    '<div class="field-row">' + selectField('diet', 'Feeding', DIETS, genome.diet) +
    selectField('motion', 'Locomotion', MOTION, genome.motion) + '</div>' +
    selectField('activity', 'Activity rhythm', ACTIVITY, genome.activity) +
    range('founder-thermal', 'Comfort temperature', -10, 55, 1, comfortableTemperature({ thermal: pond.founderThermal }), '°C') +
    range('speed', 'Swim speed', .5, 1.8, .1, genome.speed, '×') +
    range('senses', 'Sensing range', .5, 1.8, .1, genome.senses, '×') +
    range('metabolism', 'Energy use', .6, 1.5, .1, genome.metabolism, '×') +
    range('caution', 'Predator caution', 0, 100, 1, Math.round(genome.caution * 100), '%') +
    range('sociability', 'Social instinct', 0, 100, 1, Math.round(genome.sociability * 100), '%') +
    range('mutation', 'Mutation chance', 0, 95, 1, Math.round(genome.mutation * 100), '%') + '</details>';
  const plantDesign = '<details class="designer-options"><summary>Plant cell traits</summary>' +
    range('algae-growth', 'Growth rate', .6, 1.5, .1, algaeDesign.growth, '×') +
    range('algae-width', 'Colony width', .5, 1.7, .1, algaeDesign.width, '×') +
    range('algae-pigment', 'Hue shift', -24, 24, 1, algaeDesign.pigment, '°') +
    range('algae-moisture', 'Shore moisture preference', 20, 100, 1, Math.round(algaeDesign.moisture * 100), '%') + '</details>';
  return section('First cell designer', climateNotice(planetNow()) + '<div class="field"><label for="strain">Strain name <span>Optional</span></label>' +
    '<input id="strain" type="text" maxlength="24" value="' + escape(genome.strain) + '"></div>' +
    look + traits +
    range('batch', 'Cells per release', 1, 24, 1, batch) +
    action('cells', tool === 'cells' ? 'Cancel release' : 'Release creature cells', 'plus', tool === 'cells'), '<span id="pond-temperature"></span>') +
    section('Algae', plantDesign + action('plant-cells', 'Release plant cells', 'sprout', tool === 'plant-cells') +
      '<p id="pond-plant-count"></p><p id="water-nutrients"></p><p id="pond-ice" hidden></p><div id="pond-shore" class="shore-adaptation" hidden>' +
      '<label for="shore-progress">Shore adaptation</label><progress id="shore-progress" max="100"></progress>' +
      '<p id="shore-result" hidden>Grass has rooted near this pond.</p></div>') +
    section('Forms observed', '<div class="evolution">' + STAGES.map((stage, index) =>
      '<div class="stage" data-stage="' + index + '"><i class="dot" style="--color:' + stage.color + '"></i>' +
      stage.name + '</div>').join('') + '</div><p id="stage-count"></p>') +
    '<div id="creature-panel" hidden></div>';
}

function renderInspector() {
  const title = { system: 'System controls', surface: 'Planet controls', pond: 'Pond controls', land: 'Habitat controls' }[view];
  $('#inspector-title').textContent = title;
  $('#inspector-icon').innerHTML = svg({ system: 'sliders', surface: 'globe', pond: 'cells', land: 'sprout' }[view]);
  if (view === 'system') inspector.innerHTML = bodySystem();
  if (view === 'surface') inspector.innerHTML = bodySurface(planetNow());
  if (view === 'pond') inspector.innerHTML = bodyPond(pondNow());
  if (view === 'land') inspector.innerHTML = bodyLand(planetNow());
  renderHabitatKey();
}

function renderHabitatKey() {
  const key = $('#habitat-key');
  if (!key) return;
  const layer = HABITAT_LAYERS[habitatLayer];
  key.hidden = !layer.labels;
  if (!layer.labels) return;
  key.firstElementChild.textContent = layer.labels[0];
  key.lastElementChild.textContent = layer.labels[1];
  key.querySelector('i').style.background = 'linear-gradient(90deg, ' + layer.colors.join(', ') + ')';
}

function renderTool() {
  const frame = $('#scene-frame');
  if (tool) frame.dataset.tool = tool;
  else delete frame.dataset.tool;
  const emptyWorld = view === 'surface' && !planetNow().ponds.length;
  const emptyPond = view === 'pond' && !pondNow().discovered.length;
  const emptySystem = view === 'system' && !system.planets.length;
  $('#interaction-hint > span:last-child').textContent = tracking ? (view === 'pond' ? 'Following the creature, including if it climbs out.' :
    'Following the creature. Drag to take over the camera.') : !tool && emptySystem ? 'Choose Place planet, then click an orbit.' :
    !tool && emptyWorld ? 'Drag to rotate. Place a pond to start.' :
      !tool && emptyPond ? 'Release plant or creature cells into the pond.' : hints[tool ?? view];
  for (const button of inspector.querySelectorAll('[data-tool]')) {
    const key = button.dataset.tool;
    const active = key === tool;
    button.setAttribute('aria-pressed', active);
    const labels = {
      planet: ['Place planet', 'Cancel placement'],
      'place-pond': ['Place pond', 'Cancel placement'],
      cells: ['Release creature cells', 'Cancel release'],
      'plant-cells': ['Release plant cells', 'Cancel plant release'],
      seeds: ['Scatter grass seeds', 'Finish planting'],
      probe: ['Sample habitat', 'Stop sampling'],
    }[key];
    if (labels) button.innerHTML = icon(active ? 'close' : ['seeds', 'plant-cells'].includes(key) ? 'sprout' : key === 'probe' ? 'temperature' : 'plus') + labels[Number(active)];
  }
}

function setTool(next) {
  if (next) tracking = null;
  tool = next;
  clearGesture();
  renderTool();
  if (next) canvas.focus({ preventScroll: canvas.getBoundingClientRect().top >= 0 && canvas.getBoundingClientRect().bottom <= innerHeight });
}

function setView(next, id) {
  speciesAudio.cancelRecording();
  if ((next === 'surface' || next === 'land') && id) {
    if (planetId !== id) pondId = null;
    planetId = id;
  }
  if (next === 'pond' && id) pondId = id;
  if (((next === 'surface' || next === 'land') && !planetNow()) || (next === 'pond' && !pondNow())) next = 'system';
  view = next;
  tool = null;
  selected = null;
  tracking = null;
  clearGesture();
  pointer = null;
  renderNavigation();
  renderInspector();
  renderTool();
  updateMetrics();
  draw(performance.now());
}

function metric(label, value, symbol) {
  return '<div class="stat">' + icon(symbol) + '<span>' + label + '</span><strong>' + value + '</strong></div>';
}

function lineageButton(kind, id, pond = '') {
  return '<button type="button" class="secondary lineage-button" data-lineage-kind="' + escape(kind) +
    '" data-lineage-id="' + escape(id) + '" data-lineage-pond="' + escape(pond) + '">' + icon('cells') + 'View lineage</button>';
}

function trackingButton(cell) {
  if (view === 'surface') return '<button type="button" class="secondary" data-watch-land>' + icon('land') + 'Watch on land</button>';
  const active = tracking?.id === cell.id && tracking.pondId === (cell.pondId ?? pondId);
  return '<button type="button" class="secondary" data-track-creature aria-pressed="' + active + '">' + icon('pointer') + 'Follow creature</button>';
}

function describeCreature(cell, status = '') {
  const strain = cell.genome.strain.trim();
  const species = cell.species ? speciesTraits(cell) : null;
  const { anatomy } = cell;
  const legs = limbCount(anatomy);
  const extra = extraLimbCount(anatomy);
  const fins = anatomy.fins > .22 ? 'Fin size ' + anatomy.fins.toFixed(2) + '×' : '';
  const shell = anatomy.armor > .18 ? 'Armor ' + anatomy.armor.toFixed(2) + '×' : '';
  const traits = [legs ? legs + ' legs' : '', fins, shell, ancestryLabel(cell)].filter(Boolean);
  if (extra) traits.push(extra + (extra === 1 ? ' extra limb' : ' extra limbs'));
  if (view !== 'pond') traits.push('Hydration ' + Math.round((cell.hydration ?? 1) * 100) + '%');
  if (anatomy.rainCup > .18) traits.push('Rain-catching head cup');
  if (anatomy.tongue > .18) traits.push('Long drinking tongue');
  if (anatomy.neck > .65) traits.push('Long neck');
  if (anatomy.horns > .22) traits.push('Horns');
  if (anatomy.frill > .21) traits.push('Head frill');
  if (anatomy.ridge > .22) traits.push('Back spines');
  const maturity = creatureMaturity(cell);
  if (maturity < 1) traits.push('Maturity ' + Math.floor(maturity * 100) + '%');
  if (cell.stage >= 2) traits.push('Color match ' + Math.round(camouflageAt(planetNow(), cell, view === 'pond') * 100) + '%');
  if (cell.genome.sociability > .57) traits.push('Social');
  if (cell.genome.activity !== 'flexible' && ACTIVITY[cell.genome.activity]) traits.push(ACTIVITY[cell.genome.activity]);
  return section((species?.name ?? STAGES[cell.stage].name) + ' #' + cell.id,
    (cell.stage >= 2 || anatomy.tissue > .46
      ? '<canvas class="creature-model" width="368" height="150" role="img" aria-label="Creature close-up"></canvas>' : '') +
    '<div class="creature-stats">' + (strain ? '<span>' + escape(strain) + '</span>' : '') +
    '<span>' + DIETS[species?.diet ?? cell.genome.diet] + '</span><span>Generation ' + cell.gen +
    '</span><span>Energy ' + cell.energy.toFixed(2) + '</span>' +
    '<span>Speed ' + cell.genome.speed.toFixed(1) + '×</span><span>Senses ' + cell.genome.senses.toFixed(1) + '×</span>' +
    '<span>Size ' + creatureSize(cell).toFixed(2) + '×</span><span>Comfort ' + comfortableTemperature(anatomy) + '°C</span>' +
    '<span>Caution ' + Math.round(cell.genome.caution * 100) + '%</span>' +
    traits.map((trait) => '<span>' + escape(trait) + '</span>').join('') +
    (status ? '<span>' + escape(status) + '</span>' : '') + '</div><div class="organism-actions">' +
    lineageButton('animal', cell.id, cell.pondId ?? pondId) + trackingButton(cell) + '</div>' +
    '<div class="species-call"><h4>Species call</h4><p class="small" data-species-note></p>' +
    '<div class="organism-actions"><button class="secondary" type="button" data-call="record">Record call</button>' +
    '<button class="secondary" type="button" data-call="play">Play call</button>' +
    '<button class="secondary" type="button" data-call="sound">Enable calls</button>' +
    '<button class="secondary" type="button" data-call="remove">Remove call</button></div></div>');
}

function showCreature(panel, cell, status) {
  updateOrganismPanel(panel, describeCreature(cell, status));
  const species = speciesTraits(cell);
  const clip = speciesCall(planetNow(), species.id);
  const note = panel.querySelector('[data-species-note]');
  const marked = scene.focusSpecies === species.id ? scene.speciesMarkers.length : 0;
  const callText = species.name + ' · ' + (clip ? 'Call recorded' : CALL_SECONDS + ' seconds max') +
    (marked ? ' · ' + marked + ' marked' : '');
  if (note.textContent !== callText) note.textContent = callText;
  const recording = speciesAudio.capture?.state;
  const button = panel.querySelector('[data-call="record"]');
  const label = recording === 'waiting' ? 'Cancel recording' : recording === 'recording' ? 'Stop recording' :
    recording === 'saving' ? 'Saving call…' : clip ? 'Record again' : 'Record call';
  if (button.textContent !== label) button.textContent = label;
  button.disabled = recording === 'saving';
  panel.querySelector('[data-call="play"]').hidden = !clip;
  panel.querySelector('[data-call="play"]').disabled = Boolean(recording);
  panel.querySelector('[data-call="remove"]').hidden = !clip;
  panel.querySelector('[data-call="remove"]').disabled = Boolean(recording);
  panel.querySelector('[data-call="sound"]').textContent = speciesAudio.enabled ? 'Mute calls' : 'Enable calls';
  const preview = panel.querySelector('.creature-model');
  if (!preview) return;
  const ctx = preview.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, preview.width, preview.height);
  drawAnimalModel(ctx, cell, preview.width / 2, preview.height * .65, .17, 2.35 / creatureSize(cell), 1, view !== 'pond');
}

async function handleSpeciesCall(action) {
  const planet = planetNow();
  const cell = selectedCreature();
  if (!planet || !cell) return;
  const species = speciesTraits(cell);
  const existing = speciesCall(planet, species.id);
  try {
    if (action === 'sound') {
      if (speciesAudio.enabled) speciesAudio.mute();
      else await speciesAudio.enable();
    } else if (action === 'play' && existing) {
      await speciesAudio.enable();
      await speciesAudio.play(existing);
    } else if (action === 'remove' && existing) {
      planet.speciesCalls = planet.speciesCalls.filter((clip) => clip !== existing);
    } else if (action === 'record') {
      if (speciesAudio.capture) {
        speciesAudio.stopRecording();
      } else {
        if (!existing && planet.speciesCalls?.length >= MAX_SPECIES_CALLS) throw new Error('This planet already has eight species calls.');
        void speciesAudio.enable().catch(() => {});
        const recording = speciesAudio.record(updateMetrics);
        updateMetrics();
        const audio = await recording;
        if (audio) {
          putSpeciesCall(planet, { species: species.id, audio });
          notify('Call recorded for ' + species.name + '.');
        }
      }
    }
  } catch (error) {
    notify(action === 'play' ? 'Pond could not play this recording. Try recording it again.' : error.message, true);
  } finally {
    updateMetrics();
  }
}

function ancestryLabel(cell) {
  if (cell.coParent) return 'Parents #' + cell.parent + ' + #' + cell.coParent.id;
  return cell.parent === null || cell.parent === undefined ? '' : 'Parent #' + cell.parent;
}

function describeEgg(egg) {
  return section('Incubating egg',
    '<div class="creature-stats"><span>Generation ' + egg.child.gen + '</span><span>' +
    Math.min(100, Math.floor(egg.progress * 100 / egg.duration)) + '% incubated</span><span>' +
    escape(ancestryLabel(egg.child)) + '</span>' + (egg.tended ? '<span>Parent tending nearby</span>' : '') + '</div>' +
    lineageButton('animal', egg.child.id, egg.child.pondId));
}

function selectedPatch(patches) {
  return patches.find((patch) => 'plant/' + patch.seed === selected);
}

function describePlant(patch, planet, underwater, lineagePondId = underwater ? pondId : '') {
  const stage = underwater ? (pondPlantStage(patch) === 'cell' ? 'Plant cell' : lineagePondId ? 'Algae' : 'Ocean algae') : 'Grass';
  const profile = grassProfile(planet);
  const blades = clamp(Math.round((profile.blades + patch.genes.blades) * 1.7), 9, 25);
  const traits = ['Generation ' + patch.generation, 'Growth ' + patch.genes.growth.toFixed(2) + '×'];
  if (underwater) traits.push('Colony width ' + patch.genes.width.toFixed(2) + '×');
  else {
    traits.push(blades + ' blades', 'Height ' + patch.genes.height.toFixed(2) + '×',
      'Preferred moisture ' + Math.round(patch.genes.moisture * 100) + '%');
    if (patch.pollenParent !== null) traits.push('Wind-pollinated');
    if (patch.shaded) traits.push('In the shade of taller grass');
  }
  if (patch.algaeParent) traits.push('Descended from pond algae');
  return section(stage, '<div class="creature-stats">' + traits.map((trait) => '<span>' + trait + '</span>').join('') + '</div>' +
    lineageButton(patch.type, patch.seed, lineagePondId));
}

function updateOrganismPanel(panel, html) {
  if (panel.dataset.markup === html) return;
  const previous = panel.querySelector('[data-lineage-id]');
  const next = document.createElement('template');
  next.innerHTML = html;
  const incoming = next.content.querySelector('[data-lineage-id]');
  if (previous && incoming && previous.outerHTML === incoming.outerHTML &&
      panel.querySelector('h3').textContent === next.content.querySelector('h3').textContent) {
    panel.querySelector('.creature-stats').replaceWith(next.content.querySelector('.creature-stats'));
    const trackingButton = panel.querySelector('[data-track-creature]');
    if (trackingButton) trackingButton.setAttribute('aria-pressed', next.content.querySelector('[data-track-creature]').getAttribute('aria-pressed'));
  } else {
    panel.replaceChildren(next.content);
  }
  panel.dataset.markup = html;
}

function updateSpeciesRoster(list, groups, adults) {
  const signature = [...groups.keys()].sort().join(',');
  if (list.dataset.groups !== signature) {
    list.dataset.groups = signature;
    list.innerHTML = [...groups.values()].sort((a, b) => a.id.localeCompare(b.id)).map((species) =>
      '<button type="button" data-species="' + escape(species.id) + '"><i class="species-dot" style="--color:' + escape(species.color) +
      '"></i><span><strong>' + escape(species.name) + '</strong><small data-species-details></small></span>' +
      '<span class="species-number" data-species-count></span></button>').join('');
  }
  for (const button of list.querySelectorAll('[data-species]')) {
    const group = groups.get(button.dataset.species);
    const label = group.count + ' / ' + SPECIES_CAPACITY;
    const display = button.querySelector('[data-species-count]');
    if (display.textContent !== label) display.textContent = label;
    const living = adults.get(group.id)?.count ?? 0;
    const eggs = group.count - living;
    const details = DIETS[group.diet] + (eggs ? ' · ' + living + ' active · ' + eggs + (eggs === 1 ? ' egg' : ' eggs') : '');
    const caption = button.querySelector('[data-species-details]');
    if (caption.textContent !== details) caption.textContent = details;
    button.querySelector('.species-dot').style.setProperty('--color', group.color);
  }
}

function updateTreeRoster(planet) {
  const list = $('#tree-species');
  const groups = new Map();
  for (const tree of planet.trees) {
    const group = groups.get(tree.variant);
    if (group) group.count++;
    else groups.set(tree.variant, { seed: tree.seed, count: 1 });
  }
  const markup = [...groups].sort(([a], [b]) => a - b).map(([variant, group]) => {
    const species = treeSpecies(planet, variant);
    return '<button type="button" data-tree="' + group.seed + '"><i class="species-dot" style="--color:hsl(' + species.hue +
      ' 55% 57%)"></i><span><strong>' + escape(species.name) + '</strong></span><span class="species-number">' + group.count + '</span></button>';
  }).join('');
  if (list.dataset.markup !== markup) {
    list.innerHTML = markup;
    list.dataset.markup = markup;
  }
  $('#tree-total').textContent = planet.trees.length + ' / ' + MAX_TREES;
  $('#tree-note').hidden = Boolean(planet.trees.length);
}

function updateMetrics() {
  $('#day').textContent = 'Day ' + String(1 + Math.floor(system.clock / 10)).padStart(3, '0');
  const planet = planetNow();
  const pond = pondNow();
  const readout = $('#local-climate');
  if (readout) {
    const camera = view === 'land' ? landCameraNow() : cameraNow();
    const sample = view === 'land' && habitatSamples.get(planet);
    const place = view === 'land' ? sample || camera : { x: wrap(.5 + camera.lon / (2 * Math.PI)), y: .5 - camera.lat / Math.PI };
    const surface = view === 'land' ? habitatSurface(planet, place) : '';
    const water = surface === 'Pond water' || surface === 'Ocean';
    const local = habitatAt(planet, place, water);
    const daylight = local.light > .65 ? 'Day' : local.light < .30 ? 'Night' : 'Twilight';
    const label = local.season + ' · ' + daylight + ' · ' + Math.round(local.temperature) + '°C' +
      (view === 'land' && !water ? ' · ' + Math.round(local.moisture * 100) + '% soil moisture' : '');
    if (readout.textContent !== label) readout.textContent = label;
    if (view === 'land') {
      const details = $('#habitat-sample');
      details.hidden = !sample;
      const sampleLabel = 'Sample · ' + surface + ' · ' + Math.round(local.light * 100) + '% daylight';
      if (details.textContent !== sampleLabel) details.textContent = sampleLabel;
      inspector.querySelector('[data-clear-sample]').hidden = !sample;
    }
  }
  let metrics;
  if (view === 'system') {
    const pockets = system.planets.flatMap((world) => world.ponds);
    const walkers = system.planets.reduce((sum, world) => sum + world.walkers.length, 0);
    metrics = [['Planets', system.planets.length, 'globe'], ['Ponds', pockets.length, 'drop'],
      ['Living creatures', walkers + pockets.reduce((sum, pocket) => sum + pocket.creatures.length, 0), 'cells']];
  } else if (view === 'surface') {
    renderTerrainHistory(planet);
    $('#ambient-temperature').textContent = planetTemperature(planet) + '°C';
    for (const button of inspector.querySelectorAll('[data-weather]')) {
      button.setAttribute('aria-pressed', button.dataset.weather === planet.weather);
    }
    let filled = 0;
    let dry = 0;
    if (planet.basinWater) {
      for (const [i, height] of planet.terrain.entries()) {
        if (height >= 0) continue;
        filled += planet.basinWater[i] ?? 0;
        dry += Number(planet.basinWater[i] < 1);
      }
    }
    const ocean = Math.round(filled / planet.terrain.length * 100);
    const frost = Math.round(iceCover(planet) * 100);
    $('#planet-ice').hidden = frost < 4 || (!filled && !planet.ponds.length);
    $('#planet-ice').textContent = 'Surface ice ' + frost + '%';
    metrics = [['Ocean coverage', ocean + '%', 'wave'], ['Ponds', planet.ponds.length, 'drop'],
      ['On land', planet.walkers.filter((cell) => !cell.climb).length, 'land']];
    const basin = $('#basin-status');
    basin.hidden = !dry;
    basin.textContent = ['rain', 'storm'].includes(planet.weather) ? 'Rain is filling the basins.' : 'Choose Rain to fill the basins.';
    for (const element of inspector.querySelectorAll('[data-pond-count]')) {
      const pocket = planet.ponds.find((item) => item.id === element.dataset.pondCount);
      element.textContent = pocket.creatures.length + ' living creatures';
    }
    describeSelectedWalker(planet);
  } else if (view === 'land') {
    const oceanAlgae = planet.oceanAlgae.filter((patch) => basinWaterAt(planet, patch.x, patch.y) >= .14).length;
    $('#ocean-algae-count').hidden = !oceanAlgae;
    $('#ocean-algae-count').textContent = 'Ocean algae patches ' + oceanAlgae;
    const groups = landPopulation(planet);
    const reserved = landPopulation(planet, { includeEggs: true });
    const largeAnimals = landPopulation(planet, { large: true });
    const largeSlots = landPopulation(planet, { includeEggs: true, large: true });
    updateSpeciesRoster($('#species-list'), reserved, groups);
    updateSpeciesRoster($('#large-species-list'), largeSlots, largeAnimals);
    $('#species-total').textContent = reserved.size + ' / ' + SPECIES_LIMIT;
    $('#species-note').textContent = reserved.size ? 'Select a species to find an animal or egg.' : 'Land animals arrive from ponds.';
    $('#large-species-total').textContent = largeSlots.size + ' / ' + LARGE_SPECIES_LIMIT;
    const unlocked = planet.largeLineages.length > 0;
    $('#large-species-progress').hidden = unlocked;
    $('#large-species-progress').textContent = largeEvolutionProgress(groups) + ' of ' + SPECIES_LIMIT +
      ' small species have at least ' + LARGE_EVOLUTION_MINIMUM + ' living members.';
    inspector.querySelector('[data-large-lineage]').hidden = !unlocked;
    updateTreeRoster(planet);
    const coverage = landGrassPercentage(planet) + '% of dry ground covered';
    const grassCover = $('#grass-cover');
    if (grassCover.textContent !== coverage) grassCover.textContent = coverage;
    const hasGrassSeed = Boolean(grassSeedSource(planet));
    inspector.querySelector('[data-tool="seeds"]').disabled = !hasGrassSeed;
    $('#grass-seed-note').hidden = hasGrassSeed;
    if (!hasGrassSeed && tool === 'seeds') setTool(null);
    $('#soil-nutrients').textContent = 'Soil nutrients ' + Math.round(planet.nutrients * 100) + '%';
    metrics = [['Land animals', planet.walkers.length + ' / ' +
      (SPECIES_LIMIT + (unlocked ? LARGE_SPECIES_LIMIT : 0)) * SPECIES_CAPACITY, 'land'], ['Eggs', planet.eggs.length, 'drop'],
      ['Grass patches', planet.plants.length, 'sprout'], ['Land hunts', planet.landHunts, 'hunt']];
    describeSelectedWalker(planet);
  } else {
    $('#pond-temperature').textContent = Math.round(habitatAt(planet, pond, true).temperature) + '°C';
    const plantCount = $('#pond-plant-count');
    const counts = { cell: 0, algae: 0 };
    for (const patch of pond.algae) counts[pondPlantStage(patch)]++;
    const plantLabel = pond.algae.length ? 'Cells ' + counts.cell + ' · Algae ' + counts.algae :
      'Plant cells grow into algae.';
    if (plantCount.textContent !== plantLabel) plantCount.textContent = plantLabel;
    $('#water-nutrients').textContent = 'Water nutrients ' + Math.round(pond.nutrients * 100) + '%';
    const frost = Math.round(iceCover(planet, pond.y) * 100);
    $('#pond-ice').hidden = frost < 4;
    $('#pond-ice').textContent = 'Surface ice ' + frost + '%';
    const shore = $('#pond-shore');
    shore.hidden = !pond.algae.length && !pond.rooted;
    $('#shore-progress').value = Math.floor(shoreAdaptation(pond) * 100);
    $('#shore-result').hidden = !pond.rooted;
    metrics = [['In the pond', pond.creatures.length, 'cells'], ['Births', pond.births, 'spark'],
      ['Successful hunts', pond.hunts, 'hunt'], ['Climbed out', pond.climbed, 'land']];
    for (const element of inspector.querySelectorAll('[data-stage]')) {
      const discovered = pond.discovered.includes(Number(element.dataset.stage));
      element.toggleAttribute('data-discovered', discovered);
      element.setAttribute('aria-label', STAGES[Number(element.dataset.stage)].name + (discovered ? ', discovered' : ', undiscovered'));
    }
    $('#stage-count').textContent = pond.discovered.length + ' forms evolved in this pond';
    const panel = $('#creature-panel');
    panel.hidden = selected === null;
    if (selected !== null && !lineageDialog.open) {
      const plant = selectedPatch(pond.algae);
      const cell = pond.creatures.find((item) => item.id === selected);
      const walker = planet.walkers.some((item) => item.pondId === pond.id && item.id === selected);
      if (cell) showCreature(panel, cell, cell.behavior);
      else updateOrganismPanel(panel, plant ? describePlant(plant, planet, true) :
        section('Organism', walker ? '<p>This creature climbed onto the planet.</p><button type="button" class="secondary" data-watch-land>' +
          icon('land') + 'Watch on land</button>' : '<p>This organism is gone.</p>'));
    }
  }
  const html = metrics.map((values) => metric(...values)).join('');
  const summary = $('#summary');
  if (summary.innerHTML !== html) summary.innerHTML = html;
}

function describeSelectedWalker(planet) {
  const panel = $('#creature-panel');
  panel.hidden = selected === null;
  if (selected === null || lineageDialog.open) return;
  const plant = selectedPatch(planet.plants);
  const ocean = view === 'land' && planet.oceanAlgae.find((patch) => 'ocean/' + patch.seed === selected && basinWaterAt(planet, patch.x, patch.y) >= .14);
  const tree = planet.trees.find((item) => 'tree/' + item.seed === selected);
  const egg = planet.eggs.find((item) => 'egg/' + item.child.pondId + '/' + item.child.id === selected);
  const cell = planet.walkers.find((item) => {
    const id = item.pondId + '/' + item.id;
    return id === selected || 'egg/' + id === selected;
  });
  if (cell) {
    selected = cell.pondId + '/' + cell.id;
    return showCreature(panel, cell, cell.climb ? 'Climbing out' : cell.behavior ?? 'Exploring');
  }
  updateOrganismPanel(panel, egg ? describeEgg(egg) : plant ? describePlant(plant, planet, false) :
    ocean ? describePlant(ocean, planet, true, '') :
    tree ? section(treeSpecies(planet, tree.variant).name, '<p>' + Math.min(100, Math.floor(tree.age / TREE_GROWTH * 100)) + '% grown</p>') :
    section('Organism', '<p>This organism is gone.</p>'));
}

function interact(point) {
  const planet = planetNow();
  const pond = pondNow();
  const position = view === 'surface' ? scene.surfaceAt(point, cameraNow(), planet) :
    view === 'pond' ? scene.pondAt(point, pondCameraNow()) : scene.normalized(point);
  if (view === 'system' && tool === 'planet') {
    const orbit = scene.orbitAt(point);
    const result = orbit ? addPlanet(system, orbit.orbit, orbit.angle, planetDesign) : { error: 'Place your planet farther from the sun.' };
    if (result.error) return notify(result.error, true);
    setTool(null);
    renderInspector();
    updateMetrics();
    const limit = climateLimit(result.planet.orbit);
    return notify(result.planet.name + ' is in orbit.' + (limit ? ' ' + limit + '.' : ''));
  }
  if (view === 'surface' && tool === 'place-pond') {
    if (!position) return notify('Click a spot on the planet to place your pond.', true);
    const result = addPond(planet, position.x, position.y);
    if (result.error) return notify(result.error, true);
    setTool(null);
    renderInspector();
    updateMetrics();
    return notify('Pond added. Click the water to look inside.');
  }
  if (view === 'pond' && tool === 'cells') {
    const count = spawnCells(pond, pond.genome, batch, position, systemRandom(system));
    if (!count) return notify(pond.creatures.length >= MAX_CREATURES ? 'This pond is full.' : 'Release your cells in the water.', true);
    setTool(null);
    updateMetrics();
    return notify(count + (count === 1 ? ' cell released.' : ' cells released.'));
  }
  if (view === 'pond' && tool === 'plant-cells') {
    const added = releasePlantCells(pond, position, systemRandom(system));
    if (!added) return notify('Choose open water for more plant cells.', true);
    setTool(null);
    updateMetrics();
    return notify(added + (added === 1 ? ' plant cell released.' : ' plant cells released.'));
  }
  if (view === 'land' && tool === 'seeds') {
    const parent = grassSeedSource(planet);
    if (!parent) return notify('Wait for shore grass to grow before collecting seeds.', true);
    const added = seedGrass(planet, scene.landAt(point, landCameraNow(), planet), { parent }, systemRandom(system));
    updateMetrics();
    return notify(added ? added + (added === 1 ? ' grass patch seeded.' : ' grass patches seeded.') :
      'Choose open, dry ground for more grass.', !added);
  }
  if (view === 'land' && tool === 'probe') {
    habitatSamples.set(planet, scene.landAt(point, landCameraNow(), planet));
    updateMetrics();
    return;
  }
  if (tool === 'ocean' || tool === 'stone') {
    if (!position) return;
    const stroke = new Map();
    paintTerrain(planet, position.x, position.y, brush, tool === 'ocean', stroke);
    commitTerrainStroke(planet, stroke);
    updateMetrics();
    return;
  }
  const hit = scene.hit(point);
  if (view === 'system' && hit) return setView('surface', hit.id);
  if (view === 'surface') {
    const pool = position && planet.ponds.find((item) => pondDistance(item, position.x, position.y) <= 1.06);
    if (pool) return setView('pond', pool.id);
  }
  if (view !== 'system') {
    if (selected !== hit?.id) {
      stopTracking();
      speciesAudio.cancelRecording();
    }
    selected = hit?.id ?? null;
    updateMetrics();
  }
}

function showOnLand(cell, follow) {
  if (view !== 'land') setView('land');
  else if (selected !== cell.pondId + '/' + cell.id) speciesAudio.cancelRecording();
  const camera = landCameraNow();
  Object.assign(camera, { x: cell.x, y: cell.y });
  selected = cell.pondId + '/' + cell.id;
  tracking = follow ? { pondId: cell.pondId, id: cell.id } : null;
  renderTool();
  updateMetrics();
}

function stopTracking() {
  if (!tracking) return;
  tracking = null;
  inspector.querySelector('[data-track-creature]')?.setAttribute('aria-pressed', 'false');
  renderTool();
}

function updateTracking(elapsed) {
  if ((view === 'land' || view === 'surface') && selected !== null) {
    const branch = planetNow().largeLineages.find(({ ancestor }) => ancestor.pondId + '/' + ancestor.id === selected);
    if (branch) {
      selected = branch.founder.pondId + '/' + branch.founder.id;
      if (tracking) tracking.id = branch.founder.id;
    }
  }
  if (!tracking) return;
  const easing = 1 - Math.exp(-elapsed * 10);
  const swimmer = view === 'pond' && pondNow().creatures.find((cell) => cell.id === tracking.id);
  if (swimmer) {
    const camera = pondCameraNow();
    camera.x += (swimmer.x - camera.x) * easing;
    camera.y += (swimmer.y - camera.y) * easing;
    return;
  }
  const cell = planetNow().walkers.find((item) => item.id === tracking.id && item.pondId === tracking.pondId);
  if (!cell) return stopTracking();
  if (view === 'pond') {
    showOnLand(cell, true);
    return notify('Your creature reached land.');
  }
  const camera = landCameraNow();
  camera.x = wrap(camera.x + longitudeDistance(camera.x, cell.x) * easing);
  camera.y += (cell.y - camera.y) * easing;
}

function paintBetween(from, to) {
  if (!to) return;
  if (!from) from = to;
  const planet = planetNow();
  const dx = longitudeDistance(from.x, to.x);
  const distance = Math.hypot(dx, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / (brush * .45)));
  for (let index = 1; index <= steps; index++) {
    const fraction = index / steps;
    const x = wrap(from.x + dx * fraction);
    const y = from.y + (to.y - from.y) * fraction;
    paintTerrain(planet, x, y, brush, tool === 'ocean', gesture.terrainStroke);
  }
}

function renderTerrainHistory(planet) {
  const history = terrainHistory.get(planet);
  for (const button of inspector.querySelectorAll('[data-terrain-history]')) {
    button.disabled = !history?.[button.dataset.terrainHistory].length;
  }
}

function commitTerrainStroke(planet, stroke) {
  if (!stroke?.size) return;
  let history = terrainHistory.get(planet);
  if (!history) {
    history = { undo: [], redo: [] };
    terrainHistory.set(planet, history);
  }
  history.undo.push(stroke);
  if (history.undo.length > 16) history.undo.shift();
  history.redo.length = 0;
  if (planet === planetNow()) renderTerrainHistory(planet);
}

function replayTerrainStroke(action) {
  clearGesture();
  const planet = planetNow();
  const history = terrainHistory.get(planet);
  const stroke = history?.[action].pop();
  if (!stroke) return;
  const undo = action === 'undo';
  applyTerrainStroke(planet, stroke, undo ? 'before' : 'after');
  history[undo ? 'redo' : 'undo'].push(stroke);
  updateMetrics();
}

inspector.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const data = button.dataset;
  if (data.largeLineage !== undefined) {
    openLineage({ kind: 'large-tree' });
    return;
  }
  if (data.call) {
    void handleSpeciesCall(data.call);
    return;
  }
  if (data.tree) {
    const tree = planetNow()?.trees.find((item) => item.seed === Number(data.tree));
    if (tree) {
      stopTracking();
      speciesAudio.cancelRecording();
      Object.assign(landCameraNow(), { x: tree.x, y: tree.y });
      selected = 'tree/' + tree.seed;
      updateMetrics();
    }
    return;
  }
  if (data.openHistory !== undefined) return openHistory(planetNow(), system.clock, system.planets);
  if (data.clearSample !== undefined) {
    habitatSamples.delete(planetNow());
    updateMetrics();
    inspector.querySelector('[data-tool="probe"]').focus({ preventScroll: true });
    return;
  }
  if (data.terrainHistory) return replayTerrainStroke(data.terrainHistory);
  if (data.watchLand !== undefined) {
    const cell = planetNow().walkers.find((item) => view === 'pond' ? item.pondId === pondId && item.id === selected :
      item.pondId + '/' + item.id === selected);
    if (cell) showOnLand(cell, true);
    return;
  }
  if (data.trackCreature !== undefined) {
    const cell = view === 'pond' ? pondNow().creatures.find((item) => item.id === selected) :
      planetNow().walkers.find((item) => item.pondId + '/' + item.id === selected);
    if (!cell) return;
    tracking = tracking ? null : { pondId: cell.pondId ?? pondId, id: cell.id };
    renderTool();
    updateMetrics();
    return;
  }
  if (data.lineageKind) {
    if (!openLineage({ kind: data.lineageKind, id: Number(data.lineageId), pondId: data.lineagePond || undefined })) {
      notify('This lineage is unavailable.', true);
    }
    return;
  }
  if (data.tool) return setTool(tool === data.tool ? null : data.tool);
  if (data.openLand !== undefined) {
    landCameras.set(planetId, globeCenter(cameraNow()));
    return setView('land');
  }
  if (data.species) {
    const planet = planetNow();
    const cell = planet.walkers.find((item) => item.species === data.species && !item.climb) ??
      planet.walkers.find((item) => item.species === data.species);
    if (cell) return showOnLand(cell, false);
    const egg = planet.eggs.find((item) => item.child.species === data.species);
    if (!egg) return;
    stopTracking();
    Object.assign(landCameraNow(), { x: egg.x, y: egg.y });
    selected = 'egg/' + egg.child.pondId + '/' + egg.child.id;
    updateMetrics();
    return;
  }
  if (data.openPlanet) return setView('surface', data.openPlanet);
  if (data.openPond) return setView('pond', data.openPond);
  if (data.weather) {
    const planet = planetNow();
    planet.weather = data.weather;
    planet.autoWeather = false;
    $('#auto-weather').checked = false;
    updateMetrics();
  }
  if (data.star) {
    system.sun = data.star;
    delete system.sunTint;
    updateSunPreview();
  }
});

inspector.addEventListener('input', (event) => {
  const input = event.target;
  const genome = pondNow()?.genome;
  const value = Number(input.value);
  if (input.id === 'sun-tint') {
    system.sunTint = input.value;
    updateSunPreview();
  }
  if (input.id === 'stone-color') planetDesign.stone = input.value;
  if (input.id === 'water-color') planetDesign.water = input.value;
  if (input.id === 'planet-size') planetDesign.size = input.value;
  if (input.id === 'habitat-layer' && Object.hasOwn(HABITAT_LAYERS, input.value)) {
    habitatLayer = input.value;
    renderHabitatKey();
  }
  if (input.id === 'auto-weather') planetNow().autoWeather = input.checked;
  if (input.id === 'brush') brush = value / 100;
  if (genome) {
    if (['strain', 'diet', 'nucleus', 'shape', 'pattern', 'motion', 'activity'].includes(input.id)) genome[input.id] = input.value;
    if (['size', 'speed', 'senses', 'metabolism'].includes(input.id)) genome[input.id] = value;
    if (input.id === 'tint') genome.color = input.value;
    if (input.id === 'mutation') genome.mutation = value / 100;
    if (input.id === 'caution') genome.caution = value / 100;
    if (input.id === 'sociability') genome.sociability = value / 100;
    if (input.id === 'founder-thermal') setFounderTemperature(pondNow(), value);
    if (input.id.startsWith('algae-') && Number.isFinite(value)) {
      const trait = input.id.slice(6);
      if (Object.hasOwn(pondNow().algaeDesign, trait)) pondNow().algaeDesign[trait] = trait === 'moisture' ? value / 100 : value;
    }
  }
  if (input.id === 'batch') batch = value;
  const output = $('#' + input.id + '-output');
  if (output) output.value = value + ({
    brush: '%', speed: '×', size: '×', senses: '×', metabolism: '×', mutation: '%', caution: '%', sociability: '%',
    'founder-thermal': '°C',
    'algae-growth': '×', 'algae-width': '×', 'algae-pigment': '°', 'algae-moisture': '%',
  }[input.id] ?? '');
});

document.querySelector('.steps').addEventListener('click', (event) => {
  const button = event.target.closest('[data-nav]');
  if (button) setView(button.dataset.nav);
});
$('#toggle-inspector').addEventListener('click', (event) => {
  const button = event.currentTarget;
  inspector.hidden = !inspector.hidden;
  button.setAttribute('aria-expanded', !inspector.hidden);
  button.setAttribute('aria-label', inspector.hidden ? 'Show controls' : 'Hide controls');
});
$('#back').addEventListener('click', () => setView(view === 'pond' || view === 'land' ? 'surface' : 'system'));
$('#reset-view').addEventListener('click', () => {
  stopTracking();
  if (view === 'land') landCameras.set(planetId, defaultLandCamera());
  else if (view === 'pond') pondCameras.set(pondId, defaultPondCamera());
  else cameras.set(planetId, defaultCamera());
  renderZoom();
});

function mapView() {
  if (view === 'pond') return { camera: pondCameraNow(), steps: POND_ZOOM, label: 'Pond zoom' };
  if (view === 'land') return { camera: landCameraNow(), steps: LAND_ZOOM, label: 'Habitat zoom' };
  return { camera: cameraNow(), steps: GLOBE_ZOOM, label: 'Globe zoom' };
}

function renderZoom() {
  const { camera, steps, label } = mapView();
  const zoom = camera.zoom ?? 1;
  $('#map-zoom').setAttribute('aria-label', label);
  $('#zoom-out').disabled = zoom === steps[0];
  $('#zoom-in').disabled = zoom === steps.at(-1);
  $('#map-zoom-value').textContent = zoom + '×';
  $('#scene-frame').toggleAttribute('data-zoomed', zoom > 1);
}

function zoomView(direction, point) {
  const { camera, steps } = mapView();
  const index = steps.indexOf(camera.zoom ?? 1);
  const zoom = steps[clamp(index + direction, 0, steps.length - 1)];
  if (zoom === (camera.zoom ?? 1)) return;
  const anchor = point && (view === 'pond' ? scene.pondAt(point, camera) : view === 'land' ? scene.landAt(point, camera, planetNow()) : null);
  camera.zoom = zoom;
  if (anchor) {
    stopTracking();
    const offset = scene.normalized(point);
    const bounds = view === 'pond' ? scene.pondBounds(camera) : scene.landBounds(camera, planetNow());
    const width = bounds.width ?? bounds.span;
    const height = bounds.height ?? bounds.span;
    const x = anchor.x + (.5 - offset.x) * width;
    const y = anchor.y + (.5 - offset.y) * height;
    camera.x = view === 'land' ? wrap(x) : clamp(x, width / 2, 1 - width / 2);
    camera.y = clamp(y, height / 2, 1 - height / 2);
  } else if (view === 'pond' && direction > 0 && selected !== null) {
    const pond = pondNow();
    const focus = pond.creatures.find((cell) => cell.id === selected) ?? selectedPatch(pond.algae);
    if (focus) Object.assign(camera, { x: focus.x, y: focus.y });
  }
  renderZoom();
}

$('#zoom-in').addEventListener('click', () => zoomView(1));
$('#zoom-out').addEventListener('click', () => zoomView(-1));

let wheelDistance = 0;
let lastWheelAt = 0;
canvas.addEventListener('wheel', (event) => {
  if (view === 'system' || (!event.ctrlKey && document.activeElement !== canvas) || !event.deltaY) return;
  event.preventDefault();
  const distance = -event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 120 : 1);
  if (event.timeStamp - lastWheelAt > 250 || Math.sign(wheelDistance) !== Math.sign(distance)) wheelDistance = 0;
  lastWheelAt = event.timeStamp;
  wheelDistance += distance;
  if (Math.abs(wheelDistance) < 40) return;
  zoomView(Math.sign(wheelDistance), scene.point(event));
  wheelDistance = 0;
}, { passive: false });

function updateSpeed() {
  const pause = $('#pause');
  const label = paused ? 'Resume simulation' : 'Pause simulation';
  pause.setAttribute('aria-pressed', paused);
  pause.title = label;
  pause.setAttribute('aria-label', label);
  pause.firstElementChild.innerHTML = svg(paused ? 'play' : 'pause');
  $('.live').toggleAttribute('data-paused', paused);
  $('#live-label').textContent = paused ? 'Simulation paused' : 'Simulation live';
  $('#step-forward').hidden = !paused;
  for (const button of document.querySelectorAll('[data-rate]')) {
    button.setAttribute('aria-pressed', !paused && Number(button.dataset.rate) === rate);
  }
}
$('.time-controls').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'step-forward') {
    for (let elapsed = 0; elapsed < 1; elapsed += STEP) tick(system, STEP);
    accumulator = 0;
    updateMetrics();
    return;
  }
  if (button.id === 'pause') paused = !paused;
  if (button.dataset.rate) {
    rate = Number(button.dataset.rate);
    paused = false;
  }
  updateSpeed();
});

function rotateGlobe(dx, dy) {
  const camera = cameraNow();
  const scale = scene.globeGeometry(planetNow(), camera).radius;
  camera.lon = Math.PI * 2 * (wrap((camera.lon - dx / scale) / (Math.PI * 2) + .5) - .5);
  camera.lat = clamp(camera.lat + dy / scale, -1.52, 1.52);
}

function panLand(dx, dy) {
  stopTracking();
  const camera = landCameraNow();
  const bounds = scene.landBounds(camera, planetNow());
  camera.x = wrap(camera.x - dx / scene.width * bounds.width);
  camera.y = clamp(bounds.top + bounds.height / 2 - dy / 600 * bounds.height, bounds.height / 2, 1 - bounds.height / 2);
}

function panPond(dx, dy) {
  stopTracking();
  const camera = pondCameraNow();
  const bounds = scene.pondBounds(camera);
  const half = bounds.span / 2;
  camera.x = clamp(bounds.left + half - dx / scene.width * bounds.span, half, 1 - half);
  camera.y = clamp(bounds.top + half - dy / 600 * bounds.span, half, 1 - half);
}

function moveCamera(dx, dy) {
  if (view === 'pond') panPond(dx, dy);
  else if (view === 'land') panLand(dx, dy);
  else rotateGlobe(dx, dy);
}

function clearGesture() {
  if (gesture?.terrainStroke) commitTerrainStroke(gesture.planet, gesture.terrainStroke);
  gesture = null;
  delete $('#scene-frame').dataset.rotating;
}

canvas.addEventListener('pointerdown', (event) => {
  ignoreClick = false;
  if (view === 'system' || (view === 'pond' && pondCameraNow().zoom === 1) || ![0, 2].includes(event.button) || gesture) return;
  pointer = scene.point(event);
  const mode = ['ocean', 'stone'].includes(tool) && !event.shiftKey && event.button === 0 ? 'paint' : 'rotate';
  const position = mode === 'paint' ? scene.surfaceAt(pointer, cameraNow(), planetNow()) : null;
  gesture = { id: event.pointerId, origin: pointer, point: pointer, position, mode, moved: false,
    planet: planetNow(), terrainStroke: mode === 'paint' ? new Map() : null };
  if (mode === 'paint') paintBetween(position, position);
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  keyboard = false;
  pointer = scene.point(event);
  if (gesture?.id !== event.pointerId) return;
  if (gesture.mode === 'paint') {
    const position = scene.surfaceAt(pointer, cameraNow(), planetNow());
    paintBetween(gesture.position, position);
    gesture.position = position;
    return;
  }
  if (!gesture.moved && Math.hypot(pointer.x - gesture.origin.x, pointer.y - gesture.origin.y) < 5) return;
  gesture.moved = true;
  $('#scene-frame').dataset.rotating = '';
  moveCamera(pointer.x - gesture.point.x, pointer.y - gesture.point.y);
  gesture.point = pointer;
});
canvas.addEventListener('pointerleave', () => { if (!gesture) pointer = null; });
canvas.addEventListener('pointerup', (event) => {
  if (gesture?.id !== event.pointerId) return;
  ignoreClick = gesture.mode === 'paint' || gesture.moved || event.shiftKey;
  clearGesture();
});
canvas.addEventListener('lostpointercapture', (event) => {
  if (gesture?.id === event.pointerId) clearGesture();
});
canvas.addEventListener('contextmenu', (event) => { if (view !== 'system') event.preventDefault(); });
canvas.addEventListener('click', (event) => {
  if (!ignoreClick) interact(scene.point(event));
  ignoreClick = false;
});
canvas.addEventListener('keydown', (event) => {
  if (view !== 'system' && !event.metaKey && !event.ctrlKey && ['+', '=', '-'].includes(event.key)) {
    event.preventDefault();
    zoomView(event.key === '-' ? -1 : 1);
    return;
  }
  if (view === 'surface' && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    replayTerrainStroke(event.shiftKey ? 'redo' : 'undo');
    return;
  }
  const movement = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (movement) {
    event.preventDefault();
    if (view !== 'system' && event.shiftKey) {
      moveCamera(movement[0] * 22, movement[1] * 22);
      return;
    }
    keyboard = true;
    const cursor = pointer ?? { x: scene.width * .5, y: 300 };
    pointer = { x: clamp(cursor.x + movement[0] * 16, 8, scene.width - 8), y: clamp(cursor.y + movement[1] * 16, 8, 592) };
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    interact(pointer ?? { x: scene.width * .5, y: 300 });
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modalOpen() && tool) setTool(null);
});

function captureSaveView() {
  return {
    view, planetId, pondId, cameras: Object.fromEntries(cameras), landCameras: Object.fromEntries(landCameras),
    pondCameras: Object.fromEntries(pondCameras), designer: { planet: { ...planetDesign }, brush, batch },
  };
}

function applySave(save, message) {
  system = save.system;
  planetId = save.view?.planetId ?? slotPlanetId();
  pondId = save.view?.pondId ?? null;
  const options = save.view?.designer;
  if (options) {
    const palette = planetPalette({ stoneColor: options.planet?.stone, waterColor: options.planet?.water });
    Object.assign(planetDesign, palette);
    if (Object.hasOwn(PLANET_SIZES, options.planet?.size)) planetDesign.size = options.planet.size;
    if (Number.isFinite(options.brush)) brush = clamp(options.brush, .02, .14);
    if (Number.isFinite(options.batch)) batch = clamp(Math.round(options.batch), 1, 24);
  }
  cameras = new Map(system.planets.flatMap((planet) => {
    const camera = save.view?.cameras?.[planet.id];
    return Number.isFinite(camera?.lon) && Number.isFinite(camera?.lat) ?
      [[planet.id, { lon: camera.lon, lat: clamp(camera.lat, -1.52, 1.52), zoom: GLOBE_ZOOM.includes(camera.zoom) ? camera.zoom : 1 }]] : [];
  }));
  landCameras = new Map(system.planets.flatMap((planet) => {
    const camera = save.view?.landCameras?.[planet.id];
    return Number.isFinite(camera?.x) && Number.isFinite(camera?.y) ?
      [[planet.id, { x: wrap(camera.x), y: clamp(camera.y, 0, 1), zoom: LAND_ZOOM.includes(camera.zoom) ? camera.zoom : 1 }]] : [];
  }));
  pondCameras = new Map(system.planets.flatMap((planet) => planet.ponds.flatMap((pond) => {
    const camera = save.view?.pondCameras?.[pond.id];
    return Number.isFinite(camera?.x) && Number.isFinite(camera?.y) ?
      [[pond.id, { x: clamp(camera.x, 0, 1), y: clamp(camera.y, 0, 1), zoom: POND_ZOOM.includes(camera.zoom) ? camera.zoom : 1 }]] : [];
  })));
  accumulator = 0;
  const next = ['system', 'surface', 'pond', 'land'].includes(save.view?.view) ? save.view.view : 'system';
  setView(next);
  dialog.close();
  notify(message);
}
const slotPlanetId = () => system.planets[0]?.id ?? null;
function saveFeedback(message = '') {
  const feedback = $('#save-feedback');
  feedback.textContent = message;
  feedback.hidden = !message;
}

async function renderSlots() {
  const request = ++slotListing;
  const panel = $('#save-slots');
  panel.setAttribute('aria-busy', 'true');
  panel.innerHTML = '<p class="slot-status" role="status">Reading save slots…</p>';
  try {
    const entries = await slots.list();
    if (request !== slotListing || !dialog.open) return;
    panel.innerHTML = entries.map(({ number, name, clock, timestamp, unreadable }) => {
      const valid = typeof name === 'string';
      const details = valid ? name + ' · Day ' + (1 + Math.floor(clock / 10)) +
        (timestamp ? ' · ' + new Date(timestamp).toLocaleDateString() : '') : unreadable ? 'Unreadable save' : 'Empty';
      return '<div class="slot"><div><strong>Slot ' + number + '</strong><small>' + escape(details) +
        '</small></div><button type="button" class="secondary" data-save="' + number + '">' + (valid || unreadable ? 'Overwrite' : 'Save') +
        '</button><button type="button" class="secondary" data-load="' + number + '"' + (valid ? '' : ' disabled') +
        '>Load</button></div>';
    }).join('');
  } catch (error) {
    if (request !== slotListing || !dialog.open) return;
    console.warn('Pond could not list save slots.', error);
    panel.innerHTML = '<p class="slot-status" role="status">Save slots are unavailable. Reopen this menu to retry.</p>';
  } finally {
    if (request === slotListing) panel.removeAttribute('aria-busy');
  }
}

$('#open-saves').addEventListener('click', () => {
  saveFeedback();
  $('#save-system-name').value = system.name;
  dialog.showModal();
  renderSlots();
});
dialog.addEventListener('cancel', (event) => {
  if (slotOperation) event.preventDefault();
});
async function withSaveOperation(button, run) {
  if (slotOperation) return;
  saveFeedback();
  slotOperation = true;
  const enabled = dialog.querySelectorAll('button:enabled, input:enabled');
  for (const action of enabled) action.disabled = true;
  $('#save-slots').setAttribute('aria-busy', 'true');
  try {
    await run();
  } finally {
    for (const action of enabled) action.disabled = false;
    $('#save-slots').removeAttribute('aria-busy');
    slotOperation = false;
    if (dialog.open) button.focus();
  }
}

$('#save-slots').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  const number = Number(button?.dataset.save ?? button?.dataset.load);
  if (!number) return;
  withSaveOperation(button, async () => {
    try {
      if (button.dataset.load) {
        const save = await slots.load(number);
        if (!save) throw new Error('The slot is empty.');
        return applySave(save, 'Slot ' + number + ' loaded.');
      }
      const name = $('#save-system-name').value.trim().slice(0, 40) || system.name;
      await slots.save(number, { ...system, name }, captureSaveView());
      system.name = name;
      dialog.close();
      renderNavigation();
      notify('System saved in slot ' + number + '.');
    } catch (error) {
      console.warn('Pond could not complete the save-slot operation.', error);
      saveFeedback(error?.name === 'QuotaExceededError' ? 'There is no browser storage space for this save.' :
        button.dataset.load ? 'This save slot could not be loaded.' : 'This browser could not save your system.');
    }
  });
});

$('#download-backup').addEventListener('click', () => {
  saveFeedback();
  try {
    const name = $('#save-system-name').value.trim().slice(0, 40) || system.name;
    const { filename, text } = createBackup({ ...system, name }, captureSaveView());
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    dialog.close();
    notify('Backup download started.');
  } catch (error) {
    console.warn('Pond could not create a backup.', error);
    saveFeedback('This browser could not download your backup.');
  }
});

const backupInput = $('#backup-file');
const openBackup = $('#open-backup');
openBackup.addEventListener('click', () => backupInput.click());
backupInput.addEventListener('change', () => {
  const [file] = backupInput.files;
  backupInput.value = '';
  if (!file) return;
  withSaveOperation(openBackup, async () => {
    try {
      applySave(await readBackup(file), 'Backup opened.');
    } catch (error) {
      console.warn('Pond could not open a backup.', error);
      saveFeedback(error.message);
    }
  });
});

function draw(now) {
  const planet = planetNow();
  const pond = pondNow();
  const sceneTool = tool === 'place-pond' ? 'pond' : tool;
  const focus = selectedCreature();
  scene.draw({
    system, planet, pond, view, tool: sceneTool, pointer, selected, brush,
    focusSpecies: focus && speciesTraits(focus).id,
    camera: view === 'surface' ? cameraNow() : undefined,
    landCamera: view === 'land' ? landCameraNow() : undefined,
    pondCamera: view === 'pond' ? pondCameraNow() : undefined,
    habitatLayer, habitatPoint: view === 'land' ? habitatSamples.get(planet) : undefined,
    placementPalette: planetDesign,
    rotating: Boolean(gesture?.moved || gesture?.mode === 'paint'),
    fraction: paused ? 1 : Math.min(1, accumulator / STEP), time: now / 1000,
  });
  if (!paused && !document.hidden) speciesAudio.update(planet, scene.visibleCreatures, now);
  if (keyboard && pointer && document.activeElement === canvas) {
    const ctx = scene.ctx;
    ctx.strokeStyle = '#f0e5ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pointer.x - 5, pointer.y - 5, 10, 10);
  }
}

function frame(now) {
  const elapsed = Math.min(.05, (now - previousTime) / 1000);
  previousTime = now;
  if (modalOpen()) {
    requestAnimationFrame(frame);
    return;
  }
  if (!paused) {
    accumulator = Math.min(accumulator + elapsed * rate, STEP * 6);
    const frameBudget = performance.now() + 9;
    while (accumulator >= STEP) {
      tick(system, STEP);
      accumulator -= STEP;
      if (performance.now() >= frameBudget) break;
    }
  }
  updateTracking(elapsed);
  draw(now);
  if (now - uiTime > 370) {
    uiTime = now;
    updateMetrics();
  }
  requestAnimationFrame(frame);
}

const modalOpen = () => dialog.open || lineageDialog.open || historyDialog.open;
addEventListener('pagehide', () => speciesAudio.cancelRecording());

const startView = new URLSearchParams(location.search).get('view');
if (startView === 'planet' || startView === 'land') setView(startView === 'planet' ? 'surface' : 'land', slotPlanetId());
else setView('system');
requestAnimationFrame(frame);
