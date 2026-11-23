import * as T from './vendor/three.module.js';
import { battlefieldAction, battlefieldHeight, BATTLEFIELD_NAME, BATTLEFIELD_SPAWN, canWalkBattlefield, createBattlefield } from './battlefield.mjs';
import { blubBarks } from './blub-dialogue.mjs';
import { createBlubVoice } from './blub-voice.mjs';
import { canWalkDungeon, dungeonAction, dungeonFloor, DUNGEON_NAME, DUNGEON_SPAWN, DUNGEON_STAIRS } from './dungeon-plan.mjs';
import { createDungeon } from './dungeon.mjs';
import { createSouthField } from './field.mjs';
import { createForest } from './forest.mjs';
import { doorSweepOccupied, houseToWorld, PLAYER_EYE_HEIGHT, worldToHouse } from './house-plan.mjs';
import { canStand, doorwayAt, houseAt, regionAt, VIEWS, walkSurface, WOODLAND_HOUSE, WOODLAND_OUTHOUSE, ZONES } from './layout.mjs';
import { createOrcJourney, PRISONER_NAME } from './orc-journey.mjs';
import { createRiderEncounter, RIDER_MAX_HEALTH } from './rider-encounter.mjs';
import { RIDER_NAME } from './rider.mjs';
import { createSaveStore } from './save-game.mjs';
import { bindSaveMenu } from './save-menu.mjs';
import { createSky } from './sky.mjs';
import { bindSoundSettings } from './sound-settings.mjs';
import { loadSurfaces } from './surfaces.mjs';
import { createTerrain, trailElevation } from './terrain.mjs';
import { createTower } from './tower.mjs';
import { createRoadGuard, GUARD_NAME } from './tower-guards.mjs';
import { inThroneRoom, towerAction, towerLanding, towerWalkHeight, THRONE_ROOM, TOWER_NAME, TOWER_SPAWN } from './tower-plan.mjs';
import { createVillage } from './village.mjs';
import { createVillagePatrol } from './village-patrol.mjs';
import { createVillager } from './villagers.mjs';
import { createWoodlandResident, woodlandDoorwayDuck } from './woodland-resident.mjs';

const world = document.getElementById('world');
const viewport = document.getElementById('viewport');
const placeName = document.getElementById('place-name');
const placeKicker = document.getElementById('place-kicker');
const doorButton = document.getElementById('door-action');
const doorLabel = document.getElementById('door-action-label');
const huntNotice = document.getElementById('hunt-notice');
const encounterCue = document.getElementById('encounter-cue');
const healthMeter = document.getElementById('hunt-health');
const healthValue = document.getElementById('hunt-health-value');
const dungeonStatus = document.getElementById('dungeon-status');
const prisonerSpeech = document.getElementById('prisoner-speech');
const blubActivity = document.getElementById('blub-activity');
const soundSettings = document.getElementById('sound-settings');
const saveMenu = document.getElementById('save-menu');
const voice = createBlubVoice();
bindSoundSettings(soundSettings, voice.setVolume);
for (const [menu, other] of [[saveMenu, soundSettings], [soundSettings, saveMenu]]) {
  menu.addEventListener('toggle', () => { if (menu.open) other.open = false; });
}
const talkLabel = 'Talk to ' + PRISONER_NAME;
const towerHints = {
  'Lower gallery': 'Watch for Opsing Guards. Take the stairs on the left.',
  'Guard hall': 'The arch leads to the throne room. The stairs on the right lead to the crown.',
  'Broken crown': 'Find the service stair across the broken crown.',
};
const placeButtons = [...document.querySelectorAll('.places button')];
const MOVEMENT_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
const openDoorAngle = (house) => (house.doorOutward ? -1 : 1) * Math.PI / 2;

let player = { ...VIEWS.village };
let currentRegion = '';
let renderWorld = null;

function locationName(region, house) {
  return house?.name ?? ({
    dungeon: DUNGEON_NAME, tower: TOWER_NAME, battlefield: BATTLEFIELD_NAME, throne: THRONE_ROOM.name,
  }[region] ?? ZONES[region]);
}

function displayLocation(region, house) {
  const location = house?.id ?? region;
  if (location === currentRegion) return;
  currentRegion = location;
  world.dataset.view = region;
  placeName.textContent = locationName(region, house);
  placeKicker.textContent = house ? ZONES[region] : {
    village: 'The southern edge',
    forest: 'Beyond the last lantern',
    field: 'Below the distant ridge',
    dungeon: 'Beneath the ruined tower',
    tower: 'Lower gallery',
    throne: TOWER_NAME,
    battlefield: 'Beyond the ruined tower',
  }[region];
  for (const button of placeButtons) button.setAttribute('aria-pressed', String(button.dataset.view === region));
}

for (const button of placeButtons) {
  button.addEventListener('click', () => {
    player = { ...VIEWS[button.dataset.view] };
    displayLocation(button.dataset.view);
    renderWorld?.();
  });
}

async function startWorld() {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.10;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;

  const scene = new T.Scene();
  scene.fog = new T.FogExp2('#384d53', .018);
  scene.add(new T.HemisphereLight('#bfdaf4', '#9e907b', 1.27));
  const moonlight = new T.DirectionalLight('#b5d1ff', 2.25);
  moonlight.castShadow = true;
  moonlight.shadow.mapSize.set(1536, 1536);
  moonlight.shadow.autoUpdate = false;
  moonlight.shadow.bias = -.00024;
  moonlight.shadow.normalBias = .075;
  moonlight.shadow.intensity = .72;
  Object.assign(moonlight.shadow.camera, { left: -31, right: 31, top: 30, bottom: -30, near: 8, far: 124 });
  moonlight.shadow.camera.updateProjectionMatrix();
  scene.add(moonlight, moonlight.target);
  const fill = new T.DirectionalLight('#9db5bf', .50);
  fill.position.set(-20, 18, 29);
  scene.add(fill);
  const surfaces = await loadSurfaces(renderer);
  const sky = createSky(scene);
  createTerrain(scene, surfaces);
  const rooms = createVillage(scene, surfaces);
  const obstacles = createForest(scene, surfaces);
  obstacles.push(...createSouthField(scene));
  const openDoors = new Set();
  const woodlandResident = createWoodlandResident({
    canStep: canWoodlandResidentStep,
    moveDoor: requestHouseDoor,
    outhouseFree: () => (area !== null || houseAt(player.x, player.z) !== WOODLAND_OUTHOUSE)
      && (prisoner.area !== 'village' || houseAt(prisoner.position.x, prisoner.position.z) !== WOODLAND_OUTHOUSE),
  });
  const woodlandActor = createVillager(scene, WOODLAND_HOUSE, woodlandResident.position);
  const seatedWoodlandActor = createVillager(scene, WOODLAND_HOUSE, woodlandResident.seat);
  poseWoodlandResident(0);
  const prisoner = createOrcJourney(
    (x, z) => !houseAt(x, z) && canWalkOverworld(x, z),
    Math.random,
    canWalkOverworld,
    (house) => {
      setHouseDoor(house, true);
      return openDoors.has(house.id);
    },
  );
  const riderObstacles = obstacles.filter(({ x, z }) => Math.abs(x) < 118 && z > -82 && z < 262);
  const rider = createRiderEncounter(scene, {
    wake: () => { villagePatrol.setEligible(false); walk(); },
    earth: surfaces.barren,
    canRide: (x, z) => !houseAt(x, z) && canStand(x, z, riderObstacles),
  });
  const villagePatrol = createVillagePatrol({
    obstacles,
    canStep: canVillageGuardStep,
    moveDoor: requestHouseDoor,
    isDoorOpen: (house) => openingDoors.has(house.id),
    wake: () => { rider.setEligible(false); walk(); },
  });
  const roadGuards = [0, 1].map((index) => createRoadGuard(scene, surfaces.barren, index));
  healthMeter.max = RIDER_MAX_HEALTH;
  const hearthLight = new T.PointLight('#ff8847', 0, 10, 2);
  const candleLight = new T.PointLight('#ffc184', 0, 9.5, 2);
  scene.add(hearthLight, candleLight);

  const camera = new T.PerspectiveCamera(62, 1, .13, 1040);
  camera.rotation.order = 'YXZ';
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', '3D world. Use W A S D to move, drag to look, and E to use a nearby door.');
  canvas.tabIndex = 0;

  let walking = false;
  let isAvailable = true;
  let lastTime = 0;
  let visualY = walkSurface(player.x, player.z) + PLAYER_EYE_HEIGHT;
  const keys = new Set();
  const touchKeys = new Map();
  let drag = null;
  const shadowAnchor = new T.Vector2(Infinity, Infinity);
  const openingDoors = new Set();
  const doorChanges = new Map();
  let litRoom = null;
  let diningVisible = false;
  let keepersBusy = false;
  let riderNearby = false;
  let dungeon = null;
  let tower = null;
  let towerSky = null;
  let battlefield = null;
  let battlefieldSky = null;
  let area = null;
  let standingHeight = visualY - PLAYER_EYE_HEIGHT;
  let guardsAlert = false;
  let guardStriking = false;
  let speechArea = null;
  let speechUntil = 0;
  let remarksAfter = 0;
  const saves = createSaveStore();
  let autoRevision = saves.read('auto').record?.revision ?? null;
  let autoState = '';
  let refreshSaves;

  function snapshotWorld() {
    const region = area === 'tower' && inThroneRoom(player.z, standingHeight) ? 'throne' : area ?? regionAt(player.z);
    return {
      area, player: { ...player, height: standingHeight },
      place: locationName(region, !area && houseAt(player.x, player.z)),
      doors: [...openingDoors], gates: [...(dungeon?.openCells ?? [])], openingGate: dungeon?.openingGate ?? null,
      blub: prisoner.snapshot(), rider: rider.snapshot(), patrol: villagePatrol.snapshot(),
    };
  }

  function autosave(force = false) {
    if (!isAvailable) return 'unavailable';
    const state = snapshotWorld();
    const serialized = JSON.stringify(state);
    if (!force && serialized === autoState) return 'ready';
    const { status, record } = saves.write('auto', state, force ? undefined : autoRevision);
    if (record) {
      autoRevision = record.revision;
      autoState = serialized;
    }
    refreshSaves?.();
    return status;
  }

  function clearInteriorAtLoad(spot) {
    const house = houseAt(spot.x, spot.z);
    if (!house || canWalkOverworld(spot.x, spot.z)) return spot;
    for (const distance of [.28, .56, .84, 1.12, 1.40]) {
      for (let direction = 0; direction < 8; direction++) {
        const angle = direction * Math.PI / 4;
        const x = spot.x + distance * Math.sin(angle);
        const z = spot.z + distance * Math.cos(angle);
        if (houseAt(x, z) === house && canWalkOverworld(x, z)) return { ...spot, x, z };
      }
    }
    return { ...spot, ...houseToWorld(0, house.d / 2 - .92, house) };
  }

  function restoreWorld(state) {
    area = state.area;
    const desiredDoors = new Set(state.doors);
    openDoors.clear();
    openingDoors.clear();
    doorChanges.clear();
    keepersBusy = false;
    woodlandResident.reset();
    poseWoodlandResident(0);
    villagePatrol.restore(state.patrol);
    poseVillagePatrol();
    for (const [id, room] of rooms) {
      room.keeper?.reset();
      room.poseKeeper?.(0);
      const open = desiredDoors.has(id);
      room.hinge.rotation.y = open ? openDoorAngle(room.house) : 0;
      if (!open) continue;
      openDoors.add(id);
      openingDoors.add(id);
    }
    prisoner.restore(state.blub);
    if (prisoner.area === 'village') Object.assign(prisoner.position, clearInteriorAtLoad(prisoner.position));
    if (area || prisoner.active || state.gates.length || state.openingGate) dungeon ??= createDungeon(surfaces);
    dungeon?.restoreGates(state.gates, state.openingGate);
    if (area === 'tower' || prisoner.area === 'tower') prepareTower();
    tower?.reset();
    if (area === 'battlefield' || prisoner.area === 'battlefield') prepareBattlefield();
    rider.restore(state.rider);
    const { x, z, yaw, pitch, height } = area === null ? clearInteriorAtLoad(state.player) : state.player;
    const floor = movementFloor(x, z, height);
    if (floor !== null) placePlayer({ x, z, yaw, pitch }, floor);
    else {
      const spawn = { dungeon: DUNGEON_SPAWN, tower: TOWER_SPAWN, battlefield: BATTLEFIELD_SPAWN }[area] ?? VIEWS.village;
      placePlayer(spawn, movementFloor(spawn.x, spawn.z, 0) ?? 0);
    }
    guardsAlert = guardStriking = false;
    prisonerSpeech.textContent = '';
    dungeonStatus.removeAttribute('data-danger');
    dungeonStatus.textContent = area === 'battlefield' ? 'Follow the old road to the lantern for Thornwick.' : '';
    speechUntil = 0;
    remarksAfter = performance.now() + 10000;
    for (const button of placeButtons) button.disabled = area !== null;
    currentRegion = '';
    shadowAnchor.set(Infinity, Infinity);
    updatePrisonerModel(performance.now(), true);
    render();
    if (area || prisoner.active || rider.active || openDoors.size) walk();
  }

  function sharesPrisonerArea() {
    const now = area ?? 'village';
    return (prisoner.area === 'cell' ? 'dungeon' : prisoner.area) === now;
  }

  function nearPrisoner(radius) {
    if (!sharesPrisonerArea()) return false;
    const { x, y, z } = prisoner.position;
    return Math.abs(standingHeight - y) < 1.15 && Math.hypot(player.x - x, player.z - z) < radius;
  }

  function canTalkToPrisoner() {
    if (!nearPrisoner(2.6)) return false;
    const dx = prisoner.position.x - player.x;
    const dz = prisoner.position.z - player.z;
    return Math.hypot(dx, dz) < .55 || -dx * Math.sin(player.yaw) - dz * Math.cos(player.yaw) > .12;
  }

  function say(line) {
    prisonerSpeech.textContent = PRISONER_NAME + ' “' + line + '”';
    speechArea = area;
    speechUntil = performance.now() + Math.max(5500, 1500 + line.length * 52);
    void voice.play(line);
  }

  function talkToPrisoner() {
    say(prisoner.talk());
    remarksAfter = performance.now() + (prisoner.following ? 23000 : 13000);
    if (area === 'dungeon' && dungeon.gateOpen) prisoner.start(true);
    walk();
  }

  function placePlayer(view, height) {
    clearMovement();
    voice.stop();
    player = { ...view };
    standingHeight = height;
    visualY = height + PLAYER_EYE_HEIGHT;
  }

  function capturePlayer(byGuards = false) {
    dungeon ??= createDungeon(surfaces);
    dungeon.reset();
    rider.setEligible(false);
    rider.reset();
    area = 'dungeon';
    placePlayer(DUNGEON_SPAWN, 0);
    huntNotice.hidden = true;
    encounterCue.textContent = '';
    for (const button of placeButtons) button.disabled = true;
    dungeonStatus.removeAttribute('data-danger');
    dungeonStatus.textContent = byGuards ? 'The Opsing Guards dragged you back to your cell.'
      : RIDER_NAME + ' captured you.' + (prisoner.area === 'cell' ? ' A small prisoner is chained beside you.' : '');
    autosave();
  }

  function prepareTower() {
    if (!tower) {
      tower = createTower(surfaces);
      towerSky = createSky(tower.scene);
    }
  }

  function enterTower() {
    prepareTower();
    if (prisoner.area !== 'tower') tower.reset();
    guardsAlert = false;
    guardStriking = false;
    area = 'tower';
    placePlayer(TOWER_SPAWN, 0);
    render();
    autosave();
  }

  function enterDungeonStairs() {
    area = 'dungeon';
    placePlayer(DUNGEON_STAIRS, dungeonFloor(DUNGEON_STAIRS.z));
    dungeonStatus.removeAttribute('data-danger');
    dungeonStatus.textContent = '';
    render();
    autosave();
  }

  function prepareBattlefield() {
    if (!battlefield) {
      battlefield = createBattlefield(surfaces);
      battlefieldSky = createSky(battlefield);
    }
  }

  function enterBattlefield() {
    prepareBattlefield();
    area = 'battlefield';
    placePlayer(BATTLEFIELD_SPAWN, battlefieldHeight(BATTLEFIELD_SPAWN.x, BATTLEFIELD_SPAWN.z));
    prisoner.travelWith('battlefield', player);
    dungeonStatus.removeAttribute('data-danger');
    dungeonStatus.textContent = 'Follow the old road to the lantern for Thornwick.';
    render();
    autosave();
  }

  function returnToVillage() {
    area = null;
    placePlayer(VIEWS.village, walkSurface(VIEWS.village.x, VIEWS.village.z));
    prisoner.travelWith('village', player);
    dungeonStatus.textContent = '';
    render();
    autosave();
  }

  function updateHunt() {
    const inside = houseAt(player.x, player.z);
    const { stage, health, attacking, struck } = rider;
    const threatened = stage === 'approach' || stage === 'hunt';
    const eligible = isAvailable && !document.hidden && area === null;
    rider.setEligible(eligible && !villagePatrol.active && !inside
      && regionAt(player.z) !== 'forest' && Math.abs(player.x) < 95 && player.z < 231);
    villagePatrol.setEligible(eligible && !rider.active && Math.abs(player.x) < 52 && player.z > -24 && player.z < 91);
    const check = villagePatrol.inspection;
    const patrolCue = villagePatrol.within(player.x, player.z, 42)
      ? check ? 'Opsing Guards are checking ' + check.name + '.' : 'Opsing Guards are on patrol.'
      : '';
    if (dungeonStatus.textContent !== patrolCue) dungeonStatus.textContent = patrolCue;

    let cue = '';
    let tone = 'warning';
    if (stage === 'depart') {
      cue = RIDER_NAME + ' is leaving.';
      tone = 'shelter';
    } else if (threatened && inside) {
      cue = 'You’re safe inside. Wait for him to leave.';
      tone = 'shelter';
    } else if (stage === 'approach') {
      cue = RIDER_NAME + ' is coming. Hide in a house.';
    } else if (stage === 'hunt') {
      cue = struck ? 'His sword hit you. Get inside a house.'
        : attacking ? 'He’s raising his sword. Get clear!'
          : RIDER_NAME + ' is hunting you. Get inside a house.';
      tone = 'danger';
    }
    huntNotice.hidden = !cue;
    huntNotice.dataset.tone = tone;
    if (encounterCue.textContent !== cue) encounterCue.textContent = cue;
    if (healthMeter.value !== health) {
      healthMeter.value = health;
      healthValue.textContent = health + ' / ' + RIDER_MAX_HEALTH;
    }
    for (const button of placeButtons) button.disabled = threatened;
  }

  function updatePlace() {
    const inside = houseAt(player.x, player.z);
    const nearby = doorwayAt(player.x, player.z);
    const region = regionAt(player.z);
    displayLocation(region, inside);
    const door = nearby && houseToWorld(0, nearby.d / 2, nearby);
    const doorIsAhead = door && (
      Math.hypot(door.x - player.x, door.z - player.z) < .33
      || -(door.x - player.x) * Math.sin(player.yaw) - (door.z - player.z) * Math.cos(player.yaw) > -.12
    );
    doorButton.hidden = !doorIsAhead;
    if (doorIsAhead) {
      const open = openingDoors.has(nearby.id);
      const checkSweep = open || nearby.doorOutward;
      const byPlayer = checkSweep && doorSweepOccupied(worldToHouse(player.x, player.z, nearby), nearby);
      const byBlub = checkSweep && prisonerInDoorway(nearby);
      const byResident = checkSweep && woodlandResident.inDoorway(nearby);
      const byGuard = checkSweep && villagePatrol.inDoorway(nearby);
      const label = byPlayer ? (open ? 'Step back to close' : 'Step back to open')
        : byBlub ? 'Blub is in the doorway' : byGuard ? 'A guard is in the doorway' : byResident ? 'Someone is in the doorway'
          : open ? 'Close door' : 'Open door';
      if (doorLabel.textContent !== label) doorLabel.textContent = label;
      doorButton.disabled = byPlayer || byBlub || byResident || byGuard;
    }
    const next = rooms.get((inside ?? nearby)?.id) ?? null;
    if (next) {
      const now = performance.now() / 1000;
      const local = inside ? worldToHouse(player.x, player.z, inside) : null;
      for (const [index, resident] of next.residents.entries()) {
        if (index !== next.keeper.index || !next.keeper.pose) resident.pose(now, local);
      }
    }
    const mealsInView = Boolean(next?.residents.length > 1 && (inside || openDoors.has(nearby?.id)));
    if (mealsInView && !diningVisible) walk();
    diningVisible = mealsInView;
    if (next !== litRoom) {
      litRoom = next;
      hearthLight.intensity = next?.hearth ? 23 : 0;
      candleLight.intensity = next?.lamp ? 14 : 0;
      if (next?.hearth) hearthLight.position.copy(next.hearth);
      if (next?.lamp) candleLight.position.copy(next.lamp);
    }
  }

  function prisonerInDoorway(house) {
    return prisoner.area === 'village' && (prisoner.following || prisoner.mealActivity)
      && doorSweepOccupied(worldToHouse(prisoner.position.x, prisoner.position.z, house), house);
  }

  function clearHouseDoor(house) {
    return (area !== null || !doorSweepOccupied(worldToHouse(player.x, player.z, house), house))
      && !prisonerInDoorway(house) && !woodlandResident.inDoorway(house) && !villagePatrol.inDoorway(house);
  }

  function requestHouseDoor(house, open) {
    if (openingDoors.has(house.id) === open) return open ? openDoors.has(house.id) : !doorChanges.has(house.id);
    if ((open && !house.doorOutward) || clearHouseDoor(house)) setHouseDoor(house, open);
    return false;
  }

  function canVillageGuardStep(x, z) {
    return (area !== null || Math.hypot(player.x - x, player.z - z) > .68)
      && (prisoner.area !== 'village' || Math.hypot(prisoner.position.x - x, prisoner.position.z - z) > .54)
      && canStand(x, z, obstacles, openDoors);
  }

  function poseVillagePatrol() {
    const frames = villagePatrol.frames;
    roadGuards.forEach((guard, index) => guard.pose(frames[index]));
  }

  function canWoodlandResidentStep(x, z) {
    return (area !== null || Math.hypot(player.x - x, player.z - z) > .62)
      && (prisoner.area !== 'village' || Math.hypot(prisoner.position.x - x, prisoner.position.z - z) > .54)
      && canStand(x, z, obstacles, openDoors);
  }

  function nearWoodlandCabin() {
    return area === null && Math.hypot(player.x - WOODLAND_HOUSE.x, player.z - WOODLAND_HOUSE.z) < 24;
  }

  function poseWoodlandResident(seconds) {
    const { sitting, position } = woodlandResident;
    woodlandActor.root.visible = !sitting;
    seatedWoodlandActor.root.visible = sitting;
    if (sitting) seatedWoodlandActor.pose(seconds);
    else woodlandActor.standAt(seconds, position, woodlandDoorwayDuck(position.x, position.z));
  }

  function advanceDoorKeepers(elapsed, time) {
    keepersBusy = false;
    let visible = false;
    for (const room of rooms.values()) {
      const { house, keeper } = room;
      const open = openDoors.has(house.id);
      if (!keeper || (!open && !keeper.active)) continue;
      if (villagePatrol.inspection === house) {
        if (keeper.active) {
          keeper.reset();
          room.poseKeeper(time / 1000);
        }
        continue;
      }
      const playerLocal = area === null ? worldToHouse(player.x, player.z, house) : null;
      const blub = prisoner.position;
      const blubLocal = prisoner.area === 'village' ? worldToHouse(blub.x, blub.z, house) : null;
      const mayStep = (x, z) => (!playerLocal || Math.hypot(x - playerLocal.x, z - playerLocal.z) > .60)
        && (!blubLocal || Math.hypot(x - blubLocal.x, z - blubLocal.z) > .49);
      const wasVisible = Boolean(keeper.pose);
      if (keeper.advance(elapsed, open, mayStep, () => clearHouseDoor(house))) setHouseDoor(house, false);
      keepersBusy ||= keeper.active;
      if (wasVisible || keeper.pose) {
        room.poseKeeper(time / 1000);
        visible ||= !area && Math.hypot(player.x - house.x, player.z - house.z) < 30;
      }
    }
    return visible;
  }

  function setHouseDoor(house, open) {
    if (openingDoors.has(house.id) === open) return;
    if (open) openingDoors.add(house.id);
    else {
      openingDoors.delete(house.id);
      openDoors.delete(house.id);
    }
    doorChanges.set(house.id, open ? openDoorAngle(house) : 0);
    walk();
  }

  function useDoor() {
    if (!isAvailable) return;
    voice.unlock();
    if (area === 'battlefield') {
      if (battlefieldAction(player)) returnToVillage();
      else if (canTalkToPrisoner()) talkToPrisoner();
      return;
    }
    if (area === 'tower') {
      const action = towerAction(player, standingHeight);
      if (action === 'back') enterDungeonStairs();
      else if (action === 'battlefield') enterBattlefield();
      else if (canTalkToPrisoner()) talkToPrisoner();
      return;
    }
    if (area === 'dungeon') {
      const action = dungeonAction(player, dungeon.gateOpen, dungeon.openCells, prisoner.area === 'cell');
      if (action === 'tower') enterTower();
      else if (action === 'prisoner' || (!action && canTalkToPrisoner())) talkToPrisoner();
      else if (action && !dungeon.opening) {
        dungeon.open(action);
        if (action === 'gate') dungeonStatus.textContent = 'The latch gives way. The stairs are beyond the branching halls.';
        render();
        walk();
      }
      return;
    }
    const house = doorwayAt(player.x, player.z);
    if (!house) {
      if (canTalkToPrisoner()) talkToPrisoner();
      return;
    }
    const closing = openingDoors.has(house.id);
    if ((closing || house.doorOutward) && !clearHouseDoor(house)) return;
    setHouseDoor(house, !closing);
  }

  function moveDoors(elapsed) {
    for (const [id, target] of doorChanges) {
      const { house, hinge } = rooms.get(id);
      if (target === 0 && !clearHouseDoor(house)) {
        setHouseDoor(house, true);
        continue;
      }
      const delta = target - hinge.rotation.y;
      const step = elapsed * 8.2;
      if (Math.abs(delta) > step) {
        hinge.rotation.y += Math.sign(delta) * step;
        continue;
      }
      hinge.rotation.y = target;
      if (target !== 0) openDoors.add(id);
      doorChanges.delete(id);
      moonlight.shadow.needsUpdate = true;
    }
  }

  function updateMoonlight() {
    const x = Math.round(player.x / 6) * 6;
    const z = Math.round(player.z / 6) * 6;
    if (shadowAnchor.x === x && shadowAnchor.y === z) return;
    shadowAnchor.set(x, z);
    moonlight.target.position.set(x, 0, z);
    moonlight.position.set(x + 23, 43, z - 53);
    moonlight.shadow.needsUpdate = true;
  }

  function render() {
    if (!isAvailable) return;
    if (area) {
      diningVisible = false;
      villagePatrol.setEligible(false);
    }
    if (speechArea !== area || performance.now() >= speechUntil) prisonerSpeech.textContent = '';
    const meal = !area && nearPrisoner(22) ? prisoner.mealActivity : null;
    const activity = meal?.phase === 'entering' ? 'Blub is heading to ' + meal.house.name + ' for a meal.'
      : meal?.phase === 'eating' ? 'Blub is eating at ' + meal.house.name + '.' : '';
    if (blubActivity.textContent !== activity) blubActivity.textContent = activity;
    blubActivity.hidden = !activity;
    camera.position.set(player.x, visualY, player.z);
    camera.rotation.set(player.pitch, player.yaw, 0);
    if (area === 'dungeon') {
      displayLocation('dungeon');
      const action = dungeonAction(player, dungeon.gateOpen, dungeon.openCells, prisoner.area === 'cell');
      const label = action === 'tower' ? 'Enter the tower' : action === 'prisoner' ? talkLabel : 'Open cell gate';
      showAction(action && !dungeon.opening ? label : canTalkToPrisoner() ? talkLabel : '');
      renderer.render(dungeon.scene, camera);
      return;
    }
    if (area === 'tower') {
      const atCourt = inThroneRoom(player.z, standingHeight);
      displayLocation(atCourt ? 'throne' : 'tower');
      const landing = atCourt ? TOWER_NAME : towerLanding(standingHeight);
      if (placeKicker.textContent !== landing) placeKicker.textContent = landing;
      const hint = atCourt ? '' : guardStriking ? 'An ' + GUARD_NAME + ' draws back its spear. Dodge!'
        : guardsAlert ? 'An ' + GUARD_NAME + ' sees you. Run!' : towerHints[landing];
      dungeonStatus.toggleAttribute('data-danger', !atCourt && (guardStriking || guardsAlert));
      if (dungeonStatus.textContent !== hint) dungeonStatus.textContent = hint;
      const action = towerAction(player, standingHeight);
      showAction(({ back: 'Return to The Under Neath', battlefield: 'Take the service stair' })[action]
        ?? (canTalkToPrisoner() ? talkLabel : ''));
      towerSky.position.copy(camera.position);
      renderer.render(tower.scene, camera);
      return;
    }
    if (area === 'battlefield') {
      displayLocation('battlefield');
      showAction(battlefieldAction(player) ? 'Follow the road to Thornwick' : canTalkToPrisoner() ? talkLabel : '');
      battlefieldSky.position.copy(camera.position);
      renderer.render(battlefield, camera);
      return;
    }
    sky.position.copy(camera.position);
    updatePlace();
    if (nearWoodlandCabin()) walk();
    if (!doorwayAt(player.x, player.z) && canTalkToPrisoner()) showAction(talkLabel);
    updateHunt();
    updateMoonlight();
    riderNearby = rider.within(player.x, player.z, 131);
    renderer.render(scene, camera);
  }

  function showAction(label) {
    doorButton.hidden = !label;
    doorButton.disabled = false;
    if (label && doorLabel.textContent !== label) doorLabel.textContent = label;
  }

  function resize() {
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    if (width <= 0 || height <= 0) return;
    camera.aspect = width / height;
    camera.fov = camera.aspect < .8 ? 71 : 62;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }

  function pressed(key) {
    return keys.has(key) || [...touchKeys.values()].includes(key);
  }

  function canWalkOverworld(x, z) {
    return !woodlandResident.blocks(x, z) && !villagePatrol.within(x, z, .66) && canStand(x, z, obstacles, openDoors);
  }

  function movementFloor(x, z, fromHeight) {
    if (area === 'tower') {
      return towerWalkHeight(x, z, fromHeight);
    }
    if (area === 'dungeon') {
      return canWalkDungeon(x, z, dungeon.gateOpen, dungeon.openCells, prisoner.area === 'cell') ? dungeonFloor(z) : null;
    }
    if (area === 'battlefield') return canWalkBattlefield(x, z) ? battlefieldHeight(x, z) : null;
    const house = houseAt(x, z);
    const keeper = rooms.get(house?.id)?.keeper?.pose;
    if (keeper) {
      const local = worldToHouse(x, z, house);
      if (Math.hypot(local.x - keeper.x, local.z - keeper.z) < .58) return null;
    }
    return canWalkOverworld(x, z) ? walkSurface(x, z) : null;
  }

  function moveTo(x, z) {
    const floor = movementFloor(x, z, standingHeight);
    if (floor === null) return;
    standingHeight = floor;
    player.x = x;
    player.z = z;
  }

  function updatePrisonerModel(time, force = false) {
    if (!dungeon) return;
    const actor = dungeon.prisoner;
    const room = { tower: tower?.scene, battlefield, village: scene }[prisoner.area] ?? dungeon.scene;
    const changedScene = actor.root.parent !== room;
    if (changedScene) room.add(actor.root);
    if (!force && !changedScene && !sharesPrisonerArea()) return;
    const { x, y, z } = prisoner.position;
    const lift = prisoner.area === 'village' && !houseAt(x, z) ? trailElevation(x, z) : 0;
    actor.pose(time / 1000, { ...prisoner.position, y: y + lift }, {
      seated: prisoner.area === 'cell', moving: prisoner.walking, running: prisoner.running,
      eating: prisoner.eating, recovery: prisoner.recovery,
      stride: prisoner.stride, player: nearPrisoner(3.8) ? player : undefined, snap: force,
    });
  }

  function tick(time) {
    if (!walking) return;
    if (!isAvailable || document.hidden) {
      walking = false;
      return;
    }
    const delta = Math.max(0, (time - lastTime) / 1000);
    const elapsed = Math.min(.04, delta);
    lastTime = time;
    const doorsMoving = doorChanges.size > 0;
    if (doorsMoving) moveDoors(elapsed);
    const turn = Number(pressed('ArrowLeft')) - Number(pressed('ArrowRight'));
    player.yaw += turn * 1.58 * elapsed;
    const forward = Number(pressed('KeyW') || pressed('ArrowUp')) - Number(pressed('KeyS') || pressed('ArrowDown'));
    const right = Number(pressed('KeyD')) - Number(pressed('KeyA'));
    const previousX = player.x;
    const previousZ = player.z;
    if (forward || right) {
      const speed = pressed('ShiftLeft') || pressed('ShiftRight') ? 7.4 : 4.65;
      const step = elapsed * speed / Math.hypot(forward, right);
      const dx = step * (Math.cos(player.yaw) * right - Math.sin(player.yaw) * forward);
      const dz = step * (-Math.sin(player.yaw) * right - Math.cos(player.yaw) * forward);
      if (dx) moveTo(player.x + dx, player.z);
      if (dz) moveTo(player.x, player.z + dz);
    }
    if (area || forward || right) {
      visualY += (standingHeight + PLAYER_EYE_HEIGHT - visualY) * (1 - Math.exp(-elapsed * 17));
    }
    if (rider.active) {
      const sheltered = Boolean(houseAt(player.x, player.z));
      rider.advance(Math.min(.10, delta), {
        x: player.x, z: player.z, sheltered, exposed: !sheltered && player.z > -65,
      });
    }
    if (rider.stage === 'captured') capturePlayer();
    if (area === 'dungeon') {
      const gateWasOpen = dungeon.gateOpen;
      const wasOpening = dungeon.opening;
      dungeon.animate(time / 1000, elapsed);
      if (!gateWasOpen && dungeon.gateOpen && prisoner.start(true)) say(blubBarks.gate);
      if (wasOpening && !dungeon.opening) autosave();
    }
    const companionTarget = !area || area === 'battlefield' ? { x: player.x, z: player.z, area: area ?? 'village' } : null;
    const wasFollowing = prisoner.following;
    const previousRecovery = prisoner.recovery;
    const next = prisoner.advance(elapsed, dungeon?.gateOpen ?? false, companionTarget);
    if (next === 'tower') prepareTower();
    if (next === 'battlefield') {
      if (area === 'tower') say(blubBarks.escaped);
      prepareBattlefield();
    }
    if (!wasFollowing && prisoner.following) {
      if (nearPrisoner(12)) say(blubBarks.joined);
      remarksAfter = time + 23000;
    }
    if (area === 'tower' || prisoner.area === 'tower') {
      const present = area === 'tower';
      const moving = present && (player.x !== previousX || player.z !== previousZ);
      const escapee = prisoner.area === 'tower' ? prisoner.position : null;
      const { alerted, striking, caught, prisonerCaught } =
        tower.animate(time / 1000, elapsed, present ? player : null, standingHeight, moving, escapee);
      if (prisonerCaught) {
        if (nearPrisoner(9)) say(blubBarks.arrested);
        prisoner.caught();
      }
      if (caught) capturePlayer(true);
      else {
        guardsAlert = alerted;
        guardStriking = striking;
      }
    }
    updatePrisonerModel(time);
    if (dungeon && (prisoner.area === 'village' || prisoner.following)
      && nearPrisoner(4.8) && time > Math.max(remarksAfter, speechUntil)) {
      talkToPrisoner();
    }
    if (next || prisoner.recovery !== previousRecovery || prisoner.following !== wasFollowing) autosave();
    const wasPatrolling = villagePatrol.active;
    if (wasPatrolling) {
      villagePatrol.advance(elapsed);
      poseVillagePatrol();
    }
    const keeperVisible = advanceDoorKeepers(elapsed, time);
    const woodlandNear = nearWoodlandCabin();
    const woodlandChanged = (woodlandNear || woodlandResident.visiting) && woodlandResident.advance(elapsed, woodlandNear, delta);
    if (woodlandChanged) poseWoodlandResident(time / 1000);
    const prisonerNearby = prisoner.area === 'village' && nearPrisoner(70);
    if (area || forward || right || turn || doorsMoving || riderNearby || prisonerNearby || diningVisible || keeperVisible
      || (woodlandNear && woodlandChanged)
      || (wasPatrolling && (!villagePatrol.active || villagePatrol.within(player.x, player.z, 116)))
      || prisonerSpeech.textContent || rider.within(player.x, player.z, 131)) render();
    else updateHunt();
    if (area === 'tower' || area === 'dungeon' || keys.size || touchKeys.size || doorChanges.size || rider.active || prisoner.active || diningVisible
      || openDoors.size || keepersBusy || woodlandNear || woodlandResident.visiting || villagePatrol.active
      || (area === 'battlefield' && Math.abs(standingHeight + PLAYER_EYE_HEIGHT - visualY) > .018)) requestAnimationFrame(tick);
    else walking = false;
  }

  function walk() {
    if (walking || !isAvailable) return;
    walking = true;
    lastTime = performance.now();
    requestAnimationFrame(tick);
  }

  function clearMovement() {
    keys.clear();
    touchKeys.clear();
    drag = null;
  }

  document.addEventListener('keydown', (event) => {
    if (!isAvailable || event.altKey || event.ctrlKey || event.metaKey) return;
    if (soundSettings.open && soundSettings.contains(event.target)) return;
    if (saveMenu.open && saveMenu.contains(event.target)) return;
    if (event.code === 'KeyE' && !event.repeat) useDoor();
    if (!MOVEMENT_KEYS.has(event.code)) return;
    if (event.code.startsWith('Arrow')) event.preventDefault();
    keys.add(event.code);
    walk();
  });
  document.addEventListener('keyup', (event) => keys.delete(event.code));
  doorButton.addEventListener('click', useDoor);
  window.addEventListener('blur', clearMovement);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearMovement();
      voice.stop();
      rider.setEligible(false);
      villagePatrol.setEligible(false);
      autosave();
    } else if (isAvailable) {
      lastTime = performance.now();
      render();
      if (area || prisoner.active || rider.active || villagePatrol.active || doorChanges.size || diningVisible || openDoors.size || keepersBusy) walk();
    }
  });
  window.addEventListener('pagehide', () => autosave());

  canvas.addEventListener('pointerdown', (event) => {
    if (drag || !isAvailable || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (drag?.id !== event.pointerId) return;
    player.yaw -= (event.clientX - drag.x) * .0044;
    player.pitch = T.MathUtils.clamp(player.pitch - (event.clientY - drag.y) * .0037, -1.06, 1.08);
    drag.x = event.clientX;
    drag.y = event.clientY;
    render();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(type, (event) => { if (drag?.id === event.pointerId) drag = null; });
  }

  for (const button of document.querySelectorAll('[data-key]')) {
    button.addEventListener('pointerdown', (event) => {
      if (!isAvailable || event.button !== 0) return;
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      touchKeys.set(event.pointerId, button.dataset.key);
      walk();
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      button.addEventListener(type, (event) => touchKeys.delete(event.pointerId));
    }
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    clearMovement();
    isAvailable = false;
    rider.setEligible(false);
    villagePatrol.setEligible(false);
    huntNotice.hidden = true;
    viewport.hidden = true;
    world.classList.remove('has-world');
    doorButton.hidden = true;
    saveMenu.open = false;
    saveMenu.hidden = true;
    if (!area && regionAt(player.z) === 'field') displayLocation('village');
    document.getElementById('fallback-note').hidden = false;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    isAvailable = true;
    viewport.hidden = false;
    world.classList.add('has-world');
    saveMenu.hidden = false;
    document.getElementById('fallback-note').hidden = true;
    shadowAnchor.set(Infinity, Infinity);
    resize();
    if (area || prisoner.active || doorChanges.size || rider.active || villagePatrol.active || diningVisible || openDoors.size || keepersBusy) walk();
  });
  viewport.replaceChildren(canvas);
  world.classList.add('has-world');
  const villageStart = { ...VIEWS.village, height: walkSurface(VIEWS.village.x, VIEWS.village.z) };
  const firstRun = { ...snapshotWorld(), player: villageStart, place: ZONES.village, rider: {}, patrol: {} };
  refreshSaves = bindSaveMenu(saveMenu, saves, {
    save() {
      if (!isAvailable) return 'unavailable';
      const { status, record } = saves.write('manual', snapshotWorld());
      if (record) autosave(true);
      return status;
    },
    load(record) {
      if (!isAvailable) return false;
      restoreWorld(record.state);
      autosave(true);
      canvas.focus({ preventScroll: true });
      return true;
    },
    restart() {
      if (!isAvailable) return 'unavailable';
      restoreWorld(firstRun);
      return autosave(true);
    },
  });
  const latest = saves.latest();
  if (latest) restoreWorld(latest.state);
  window.setInterval(() => {
    if (!document.hidden) autosave();
  }, 8000);
  resize();
  new ResizeObserver(resize).observe(viewport);
  return () => {
    standingHeight = walkSurface(player.x, player.z);
    visualY = standingHeight + PLAYER_EYE_HEIGHT;
    if (prisoner.following) {
      prisoner.travelWith('village', player);
      voice.stop();
      prisonerSpeech.textContent = '';
      walk();
    }
    render();
    autosave();
  };
}

displayLocation('village');
try {
  renderWorld = await startWorld();
} catch (error) {
  console.error('Blackroot Vale could not start its 3D world.', error);
  viewport.replaceChildren();
  world.classList.remove('has-world');
  document.getElementById('fallback-note').hidden = false;
}
