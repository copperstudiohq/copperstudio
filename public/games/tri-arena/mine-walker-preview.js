import * as THREE from './assets/three.module.js';
import { createCreature, animateModel } from './models.js';
import { VoxelBody } from './voxel-body.js';
import { MineWalkerLighting } from './mine-walker-lighting.js';
import { MINE_WALKER_LAYOUT, MINE_WALKER_CREW_SEATS, initializeMineWalkerFeet, advanceMineWalkerFeet, mineWalkerHoverHeight } from './mine-walker-layout.js';

/** A separate inspection scene uses the same models, voxel surfaces and hovering motion as combat. */
function boot() {
  const canvas = document.querySelector('#model-view');
  const status = document.querySelector('#model-status');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101c24);
  scene.fog = new THREE.FogExp2(0x101c24, .006);
  const sky = new THREE.HemisphereLight(0xe7f6ff, 0x71878c, 2.3); scene.add(sky);
  const sun = new THREE.DirectionalLight(0xffe3ba, 3.5);
  sun.position.set(12, 30, 18); sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 80 });
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.001;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x80caff, 2); fill.position.set(-15, 16, -10); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160),
    new THREE.MeshStandardMaterial({ color: 0x263c45, roughness: .86 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.04; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(100, 50, 0x42616b, 0x304851); grid.position.y = -.025; scene.add(grid);
  const camera = new THREE.PerspectiveCamera(48, 1, .1, 250);
  const interiorLighting = new MineWalkerLighting(scene);
  const orbit = { theta: .72, phi: 1.12, radius: 46, target: new THREE.Vector3(0, 7.5, -1) };
  let model, voxels, crew = [], time = 0, running = true, cutaway = false;
  let previous = performance.now(), pointer = null, frameId = 0;
  let aspectFraming = 1;
  const actor = { x: 0, z: 0, angle: 0, elevation: mineWalkerHoverHeight(0) };
  initializeMineWalkerFeet(actor);

  function clearModel() {
    if (model) { scene.remove(model); voxels.dispose(); }
    for (const member of crew) { scene.remove(member.model); member.voxels.dispose(); }
    crew = [];
  }
  function rebuild() {
    clearModel();
    model = createCreature('copper-mine-walker');
    if (cutaway) for (const part of model.userData.previewCutawayParts || []) part.removeFromParent();
    voxels = new VoxelBody(model); scene.add(model);
    crew = MINE_WALKER_CREW_SEATS.map(seat => {
      const miner = createCreature('miner-bot'); miner.scale.setScalar(seat.scale ?? 1);
      const body = new VoxelBody(miner); scene.add(miner);
      return { model: miner, voxels: body, seat };
    });
    status.textContent = `${MINE_WALKER_LAYOUT.roofY.toFixed(1)} m tall · 5 Miner Bots · 5 computers · Drag to inspect`;
    pose(0);
  }
  function pose(dt) {
    const previousX = actor.x;
    actor.x = Math.sin(time * .24) * 3;
    actor.elevation = mineWalkerHoverHeight(time);
    const speed = dt > 0 ? Math.abs(actor.x - previousX) / dt : 0;
    advanceMineWalkerFeet(actor, dt, { moving: running && speed > .015 });
    model.position.set(actor.x, actor.elevation, actor.z); model.rotation.y = actor.angle;
    animateModel(model, time, speed, 'chase', { walkerFeet: actor.walkerFeet, elevation: actor.elevation,
      partState: voxels.partState(), phaseTime: 0 });
    voxels.syncPose();
    for (const member of crew) {
      const { seat, model: miner, voxels: body } = member;
      const sine = Math.sin(actor.angle), cosine = Math.cos(actor.angle);
      miner.position.set(actor.x + seat.x * cosine + seat.z * sine, actor.elevation + seat.y,
        actor.z - seat.x * sine + seat.z * cosine);
      miner.rotation.y = actor.angle + (seat.angle ?? 0);
      animateModel(miner, time, 0, 'chase', { controlling: true, partState: body.partState() }); body.syncPose();
    }
    interiorLighting.update([{ model, voxels }], camera.position);
  }
  function updateCamera() {
    const horizontal = Math.sin(orbit.phi) * orbit.radius;
    camera.position.set(orbit.target.x + Math.sin(orbit.theta) * horizontal,
      orbit.target.y + Math.cos(orbit.phi) * orbit.radius,
      orbit.target.z + Math.cos(orbit.theta) * horizontal);
    camera.lookAt(orbit.target);
  }
  function resize() {
    const width = innerWidth, height = innerHeight;
    renderer.setSize(width, height, false); camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const nextFraming = Math.max(1, .9 / camera.aspect);
    orbit.radius = THREE.MathUtils.clamp(orbit.radius * nextFraming / aspectFraming, 7, 150);
    aspectFraming = nextFraming; updateCamera();
  }
  function setCutaway(enabled) {
    if (cutaway === enabled) return;
    cutaway = enabled; document.querySelector('#toggle-cutaway').setAttribute('aria-pressed', String(enabled));
    sky.intensity = enabled ? .3 : 2.3;
    sun.intensity = enabled ? .25 : 3.5;
    fill.intensity = enabled ? .12 : 2;
    document.querySelector('#toggle-cutaway').textContent = enabled ? 'Close cutaway' : 'Open cutaway'; rebuild();
  }
  function setView(view) {
    for (const button of document.querySelectorAll('[data-view]')) button.setAttribute('aria-pressed', String(button.dataset.view === view));
    if (view === 'interior') {
      setCutaway(true); orbit.theta = 2; orbit.phi = .55; orbit.radius = 17.5 * aspectFraming; orbit.target.set(0, 11.9, -.4);
    } else if (view === 'ladder') {
      setCutaway(false); orbit.theta = 2.75; orbit.phi = 1.3; orbit.radius = 32 * aspectFraming; orbit.target.set(0, 6.5, -3.5);
    } else if (view === 'underside') {
      setCutaway(false);
      orbit.theta = .6; orbit.phi = 1.82; orbit.radius = 19 * aspectFraming; orbit.target.set(0, 9.5, 0);
    } else { setCutaway(false); orbit.theta = .72; orbit.phi = 1.12; orbit.radius = 46 * aspectFraming; orbit.target.set(0, 7.5, -1); }
    updateCamera();
  }
  for (const button of document.querySelectorAll('[data-view]')) button.addEventListener('click', () => setView(button.dataset.view));
  document.querySelector('#toggle-cutaway').addEventListener('click', () => setCutaway(!cutaway));
  document.querySelector('#toggle-walk').addEventListener('click', event => {
    running = !running; event.currentTarget.setAttribute('aria-pressed', String(running));
    event.currentTarget.textContent = running ? 'Pause hovering' : 'Resume hovering';
  });
  canvas.addEventListener('pointerdown', event => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    orbit.theta -= (event.clientX - pointer.x) * .007;
    orbit.phi = THREE.MathUtils.clamp(orbit.phi - (event.clientY - pointer.y) * .007, .12, 2.3);
    pointer.x = event.clientX; pointer.y = event.clientY; updateCamera();
  });
  const release = () => { pointer = null; };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('wheel', event => {
    event.preventDefault(); orbit.radius = THREE.MathUtils.clamp(orbit.radius * Math.exp(event.deltaY * .001), 7, 150); updateCamera();
  }, { passive: false });
  canvas.addEventListener('keydown', event => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') orbit.theta -= .12;
    if (event.key === 'ArrowRight') orbit.theta += .12;
    if (event.key === 'ArrowUp') orbit.phi = Math.max(.12, orbit.phi - .1);
    if (event.key === 'ArrowDown') orbit.phi = Math.min(2.3, orbit.phi + .1);
    if (event.key === '+' || event.key === '=') orbit.radius = Math.max(7, orbit.radius * .9);
    if (event.key === '-') orbit.radius = Math.min(150, orbit.radius * 1.1);
    updateCamera();
  });
  addEventListener('resize', resize);
  function frame(now) {
    const dt = Math.min(.05, Math.max(0, (now - previous) / 1000)); previous = now;
    if (running && !document.hidden) { time += dt; pose(dt); }
    renderer.render(scene, camera); frameId = requestAnimationFrame(frame);
  }
  rebuild(); resize(); updateCamera(); frameId = requestAnimationFrame(frame);
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    cancelAnimationFrame(frameId); clearModel(); interiorLighting.dispose(); renderer.dispose();
    floor.geometry.dispose(); floor.material.dispose(); grid.geometry.dispose(); grid.material.dispose();
  }, { once: true });
}

try { boot(); }
catch (error) {
  console.error('[mine-walker-preview] Model viewer failed:', error);
  const message = document.querySelector('#model-error'); message.hidden = false;
  message.textContent = 'The model could not load. Reload the page, or return to the game and try Mine Practice.';
  document.querySelector('#model-status').textContent = 'Model unavailable';
}
