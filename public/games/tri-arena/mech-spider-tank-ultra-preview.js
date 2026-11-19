import * as THREE from './assets/three.module.js';
import { createCreature, animateModel } from './models.js';
import { VoxelBody } from './voxel-body.js';
import { ULTRA_ROOMS, ULTRA_CREW_SEATS, ultraPoint } from './mech-ultra-layout.js';
import { updateUltraHeldRobot } from './mech-ultra-arena.js';
import { MineWalkerLighting } from './mine-walker-lighting.js';

function boot() {
  const canvas = document.querySelector('#model-view');
  const status = document.querySelector('#model-status');
  const roomChoice = document.querySelector('#room-choice');
  const cutawayButton = document.querySelector('#toggle-cutaway');
  const lowerArmButton = document.querySelector('#lower-arm');
  const viewButtons = [...document.querySelectorAll('[data-view]')];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x130e10);
  const sky = new THREE.HemisphereLight(0xd5eaff, 0x80371c, 2);
  scene.add(sky);
  const sun = new THREE.DirectionalLight(0xffd6a4, 3);
  sun.position.set(30, 70, 45);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x6b9ba9, 1.2);
  fill.position.set(-40, 30, -20);
  scene.add(fill);
  const interiorLighting = new MineWalkerLighting(scene);

  const floorGeometry = new THREE.PlaneGeometry(500, 500);
  floorGeometry.rotateX(-Math.PI / 2);
  const lavaMaterial = new THREE.MeshStandardMaterial({
    color: 0x86200a, emissive: 0xf4440d, emissiveIntensity: .55, roughness: .7,
  });
  const lava = new THREE.Mesh(floorGeometry, lavaMaterial);
  lava.position.y = -2;
  scene.add(lava);
  const islandGeometry = new THREE.BoxGeometry(72, 2, 60);
  const islandMaterial = new THREE.MeshStandardMaterial({ color: 0x263339, roughness: .95 });
  const island = new THREE.Mesh(islandGeometry, islandMaterial);
  island.position.set(0, -1, 48);
  scene.add(island);

  const camera = new THREE.PerspectiveCamera(48, 1, .1, 1400);
  const orbit = { theta: .65, phi: 1.15, radius: 115, target: new THREE.Vector3(0, 18, 6) };
  const actor = {
    x: 0, z: 0, angle: 0, elevation: 0, hp: 999999999,
    ultra: {
      phase: 'warning', targetX: 25, targetZ: 35, targetY: 2, slamProgress: 0, armDown: false,
      fabricationPhase: 'building', fabricatedType: 'copper-robot', fabricationProgress: .7,
    },
  };
  let model, voxels, modelRecord;
  let crew = [], cutaway = false, pointer = null, time = 0;
  let previous = performance.now(), frame, activeView = 'exterior';

  function clear() {
    if (model) {
      updateUltraHeldRobot(modelRecord, null);
      scene.remove(model);
      voxels.dispose();
      model.userData.disposeVisuals?.();
    }
    for (const member of crew) {
      scene.remove(member.model);
      member.voxels.dispose();
      member.model.userData.disposeVisuals?.();
    }
    model = null;
    voxels = null;
    modelRecord = null;
    crew = [];
  }

  function rebuild() {
    clear();
    model = createCreature('mech-spider-tank-ultra');
    modelRecord = { model };
    if (cutaway) {
      for (const part of model.userData.previewCutawayParts) part.removeFromParent();
    }
    voxels = new VoxelBody(model);
    scene.add(model);
    crew = ULTRA_CREW_SEATS.map(seat => {
      const miner = createCreature('miner-bot');
      const body = new VoxelBody(miner);
      scene.add(miner);
      return { model: miner, voxels: body, seat };
    });
    status.textContent = `${voxels.originalCount.toLocaleString()} sliceable pixels · 11 connected rooms · Six hits per pixel`;
    pose();
  }

  function pose() {
    animateModel(model, time, 0, 'chase', { ultra: actor.ultra, elevation: 0 });
    voxels.syncPose();
    updateUltraHeldRobot(modelRecord, actor, time);
    for (const member of crew) {
      const point = ultraPoint(actor, member.seat, member.seat.frame);
      member.model.position.set(point.x, point.y, point.z);
      member.model.rotation.y = actor.angle + member.seat.angle;
      animateModel(member.model, time, 0, 'chase', {
        controlling: true, partState: member.voxels.partState(),
      });
      member.voxels.syncPose();
    }
  }

  function updateCamera() {
    const hiddenControl = ULTRA_ROOMS.some(room => room.id === roomChoice.value && room.hiddenControl);
    // Exterior framing must not move an interior camera through the sealed wall.
    const radius = orbit.radius * (hiddenControl ? 1 : Math.max(1, .9 / camera.aspect));
    const horizontal = Math.sin(orbit.phi) * radius;
    camera.position.set(
      orbit.target.x + Math.sin(orbit.theta) * horizontal,
      orbit.target.y + Math.cos(orbit.phi) * radius,
      orbit.target.z + Math.cos(orbit.theta) * horizontal,
    );
    camera.lookAt(orbit.target);
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    updateCamera();
  }

  function setCutaway(enabled) {
    if (cutaway === enabled) return;
    cutaway = enabled;
    cutawayButton.setAttribute('aria-pressed', String(enabled));
    cutawayButton.textContent = enabled ? 'Close cutaway' : 'Open cutaway';
    sky.intensity = enabled ? .6 : 2;
    sun.intensity = enabled ? 1 : 3;
    rebuild();
  }

  function focusRoom(room, resetOrbit = true) {
    if (room.hiddenControl) {
      // Enter the sealed room at eye height instead of looking down at its roof.
      orbit.target.set(-4, room.floorY + 1.9, 3.2);
      if (resetOrbit) Object.assign(orbit, { radius: 9, theta: 1.9, phi: Math.PI / 2 });
      return;
    }
    const point = ultraPoint(actor, { x: room.x, y: room.floorY + 2, z: room.z }, room.frame);
    orbit.target.set(point.x, point.y, point.z);
    if (resetOrbit) {
      orbit.radius = room.frame === 'body' ? 30 : 20;
      orbit.theta = .4;
      orbit.phi = .65;
    }
  }

  function focusArm(name) {
    const frame = name === 'drill' ? 'rightArm' : 'leftArm';
    const point = ultraPoint(actor, { x: 11, y: 2, z: 0 }, frame);
    orbit.target.set(point.x, point.y, point.z);
  }

  function setViewButtons(name) {
    for (const button of viewButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.view === name));
    }
  }

  function view(name) {
    activeView = name;
    roomChoice.value = '';
    setViewButtons(name);
    if (name === 'interior') {
      setCutaway(true);
      orbit.target.set(0, 22, 0);
      Object.assign(orbit, { radius: 64, theta: .55, phi: 1.08 });
    } else if (name === 'drill' || name === 'hand') {
      setCutaway(true);
      focusArm(name);
      Object.assign(orbit, { radius: 42, theta: name === 'drill' ? 1.8 : -1.5, phi: .8 });
    } else {
      setCutaway(false);
      orbit.target.set(0, 18, 6);
      Object.assign(orbit, { radius: 115, theta: .65, phi: 1.15 });
    }
    updateCamera();
  }

  for (const room of ULTRA_ROOMS) {
    const option = document.createElement('option');
    option.value = room.id;
    option.textContent = room.name || room.id.replace(/^ultra-/, '').replaceAll('-', ' ');
    roomChoice.append(option);
  }
  roomChoice.addEventListener('change', () => {
    const room = ULTRA_ROOMS.find(room => room.id === roomChoice.value);
    if (!room) return;
    activeView = null;
    setViewButtons(null);
    setCutaway(!room.hiddenControl);
    focusRoom(room);
    updateCamera();
  });
  for (const button of viewButtons) {
    button.addEventListener('click', () => view(button.dataset.view));
  }
  cutawayButton.addEventListener('click', () => setCutaway(!cutaway));
  lowerArmButton.addEventListener('click', () => {
    actor.ultra.armDown = !actor.ultra.armDown;
    actor.ultra.phase = actor.ultra.armDown ? 'down' : 'warning';
    actor.ultra.slamProgress = Number(actor.ultra.armDown);
    lowerArmButton.setAttribute('aria-pressed', String(actor.ultra.armDown));
    lowerArmButton.textContent = actor.ultra.armDown ? 'Raise drill arm' : 'Lower drill arm';
    pose();
    const room = ULTRA_ROOMS.find(room => room.id === roomChoice.value);
    if (room) focusRoom(room, false);
    else if (activeView === 'drill' || activeView === 'hand') focusArm(activeView);
    updateCamera();
  });

  canvas.addEventListener('pointerdown', event => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return;
    orbit.theta -= (event.clientX - pointer.x) * .007;
    orbit.phi = THREE.MathUtils.clamp(orbit.phi - (event.clientY - pointer.y) * .007, .15, 2.3);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    updateCamera();
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, () => { pointer = null; });
  }
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    orbit.radius = THREE.MathUtils.clamp(orbit.radius * Math.exp(event.deltaY * .001), 6, 350);
    updateCamera();
  }, { passive: false });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') orbit.theta -= .15;
    if (event.key === 'ArrowRight') orbit.theta += .15;
    if (event.key === 'ArrowUp') orbit.phi = Math.max(.15, orbit.phi - .1);
    if (event.key === 'ArrowDown') orbit.phi = Math.min(2.3, orbit.phi + .1);
    if (['+', '='].includes(event.key)) orbit.radius = Math.max(6, orbit.radius * .9);
    if (event.key === '-') orbit.radius = Math.min(350, orbit.radius * 1.1);
    updateCamera();
  });

  addEventListener('resize', resize);
  rebuild();
  resize();
  function tick(now) {
    const dt = Math.min(.05, (now - previous) / 1000);
    previous = now;
    if (!document.hidden) {
      time += dt;
      pose();
      const hiddenControl = roomChoice.value === 'ultra-bridge';
      sky.intensity = hiddenControl ? .05 : 2;
      sun.intensity = hiddenControl ? 0 : 3;
      fill.intensity = hiddenControl ? 0 : 1.2;
      interiorLighting.update([{ model, voxels, hp: actor.hp }], camera.position, { hiddenControlOnly: hiddenControl });
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    cancelAnimationFrame(frame);
    clear();
    renderer.dispose();
    floorGeometry.dispose();
    lavaMaterial.dispose();
    islandGeometry.dispose();
    islandMaterial.dispose();
    interiorLighting.dispose();
  }, { once: true });
}

try {
  boot();
} catch (error) {
  console.error('[rain-arena-of-copper] Ultra model preview failed', error);
  const message = document.querySelector('#model-error');
  message.hidden = false;
  message.textContent = 'Ultra could not load. Reload or return to the game.';
}
