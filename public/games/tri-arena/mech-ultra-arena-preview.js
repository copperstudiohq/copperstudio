import { ArenaScene } from './scene.js';
import { ArenaGame } from './simulation.js';
import { getUltraEncounterPose, MECH_ULTRA_TIMELINE, ULTRA_CINEMATIC_DURATION } from './mech-ultra-encounter.js';
import { advanceUltraPatrol } from './mech-ultra-motion.js';
import { captureUltraPassenger, carryUltraPassenger } from './mech-ultra-collision.js';
import { updateUltraRoofLaunchers } from './mech-ultra-roof-combat.js';

const STAGE_LABELS = {
  expansion: 'Cave opens', shake: 'Ground shakes', 'roof-drones': 'Drones arrive one at a time',
  'rim-miners': 'Miners inspect the rim', 'falling-miners': 'Five miners slip', 'mega-drill': 'Mega Drill arrives',
  rumble: 'Wreckage rumbles', 'drill-arm': 'Drill arm assembles', 'fabricator-arm': 'Factory arm assembles',
  head: 'Head assembles', legs: 'Legs assemble', battle: 'Boss patrolling the island',
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${(seconds % 60).toFixed(1).padStart(4, '0')}`;
}

function boot() {
  const canvas = document.querySelector('#arena-preview');
  const stageChoice = document.querySelector('#entrance-stage');
  const timeSlider = document.querySelector('#entrance-time');
  const timeOutput = document.querySelector('#entrance-time-label');
  const playButton = document.querySelector('#play-entrance');
  const pauseButton = document.querySelector('#pause-entrance');
  const resetButton = document.querySelector('#reset-entrance');
  const followCamera = document.querySelector('#follow-arrival');
  const bossButton = document.querySelector('#toggle-boss');
  const patrolButton = document.querySelector('#toggle-patrol');
  const arena = new ArenaScene(canvas);
  const game = new ArenaGame();
  game.startBossPractice('mech-spider-tank-ultra', { arenaId: 'drill-mine' });
  const actors = game.state.enemies;
  game.drainEvents();
  game.state.player.invulnerable = 1e9;
  const boss = actors.find(actor => actor.ultra);
  const initialUltra = structuredClone(boss.ultra);
  const initialActors = actors.map(actor => ({ actor, pose: { x: actor.x, z: actor.z, angle: actor.angle,
    elevation: actor.elevation, groundHeight: actor.groundHeight, groundActorId: actor.groundActorId,
    ultraRoom: actor.ultraRoom, ultraSupportOwnerId: actor.ultraSupportOwnerId } }));
  Object.assign(game.state, { gameMode: 'war', mode: 'paused', war: { phase: 'battle', playerActive: false } });
  const orbit = { theta: .6, phi: .55, radius: 330 };
  let elapsed = ULTRA_CINEMATIC_DURATION, playing = false, bossVisible = true, walking = true, battleTime = 0;
  let pointer = null, stopped = false, frame, previous = performance.now(), lastControls = -Infinity;

  arena.positionWarCamera = () => {
    const aspect = innerWidth / innerHeight;
    const radius = orbit.radius * Math.max(1, .9 / aspect);
    arena.camera.aspect = aspect;
    arena.camera.fov = 60;
    arena.camera.far = 1600;
    arena.camera.clearViewOffset();
    arena.camera.position.set(
      Math.sin(orbit.theta) * Math.sin(orbit.phi) * radius,
      Math.cos(orbit.phi) * radius + 15,
      Math.cos(orbit.theta) * Math.sin(orbit.phi) * radius,
    );
    arena.camera.lookAt(0, 8, -6);
    arena.camera.updateProjectionMatrix();
  };
  arena.setArena('drill-mine');
  arena.setWarMode(true);

  for (const entry of [...MECH_ULTRA_TIMELINE, { stage: 'battle' }]) {
    const option = document.createElement('option');
    option.value = entry.stage;
    option.textContent = STAGE_LABELS[entry.stage];
    stageChoice.append(option);
  }
  timeSlider.max = String(ULTRA_CINEMATIC_DURATION);

  function updateState() {
    const pose = getUltraEncounterPose(elapsed);
    game.state.mode = playing || pose.complete ? 'playing' : 'paused';
    game.state.ultraEncounter = {
      ...pose, elapsed, followCamera: followCamera.checked,
      bossId: pose.complete ? actors.find(actor => actor.type === 'mech-spider-tank-ultra')?.id : null,
    };
    game.state.enemies = pose.complete && bossVisible ? actors : [];
    return pose;
  }

  function resetPatrol() {
    for (const { actor, pose } of initialActors) Object.assign(actor, pose);
    boss.ultra = structuredClone(initialUltra);
    game.state.projectiles = [];
    game.drainEvents();
    battleTime = 0;
  }

  function updatePatrol(dt) {
    if (!walking) {
      Object.assign(boss.ultra, { moving: false, walkVelocityX: 0, walkVelocityZ: 0, walkLocalVelocityX: 0, walkLocalVelocityZ: 0 });
      return;
    }
    const passengers = actors.filter(actor => actor !== boss)
      .map(actor => ({ actor, token: captureUltraPassenger(boss, actor) })).filter(entry => entry.token);
    const previousAngle = boss.angle;
    advanceUltraPatrol(boss, dt);
    for (const { actor, token } of passengers) {
      carryUltraPassenger(boss, actor, token);
      actor.angle += boss.angle - previousAngle;
    }
  }

  function updateControls(now, force = false) {
    if (!force && now - lastControls < 100) return;
    lastControls = now;
    const pose = getUltraEncounterPose(elapsed);
    timeSlider.value = elapsed.toFixed(2);
    timeSlider.setAttribute('aria-valuetext', `${formatTime(elapsed)} — ${STAGE_LABELS[pose.stage]}`);
    timeOutput.textContent = `${formatTime(elapsed)} / ${formatTime(ULTRA_CINEMATIC_DURATION)}`;
    stageChoice.value = pose.stage;
    pauseButton.textContent = playing ? 'Pause' : 'Resume';
    pauseButton.disabled = pose.complete;
    bossButton.disabled = !pose.complete;
    patrolButton.disabled = !pose.complete;
    patrolButton.textContent = walking ? 'Pause walking' : 'Resume walking';
    patrolButton.setAttribute('aria-pressed', String(!walking));
    bossButton.setAttribute('aria-pressed', String(bossVisible));
    bossButton.textContent = bossVisible ? 'Hide Ultra' : 'Show Ultra';
  }

  function seek(seconds) {
    playing = false;
    elapsed = Math.max(0, Math.min(ULTRA_CINEMATIC_DURATION, seconds));
    if (elapsed < ULTRA_CINEMATIC_DURATION) resetPatrol();
    updateState();
    arena.time = elapsed + battleTime;
    arena.update(game.state, 0);
    updateControls(performance.now(), true);
  }

  function choose(island) {
    orbit.radius = island ? 210 : 330;
    orbit.phi = island ? .9 : .55;
    document.querySelector('#whole-cave').setAttribute('aria-pressed', String(!island));
    document.querySelector('#island').setAttribute('aria-pressed', String(island));
  }
  document.querySelector('#whole-cave').addEventListener('click', () => choose(false));
  document.querySelector('#island').addEventListener('click', () => choose(true));
  bossButton.addEventListener('click', () => {
    if (elapsed < ULTRA_CINEMATIC_DURATION) return;
    bossVisible = !bossVisible;
    updateState();
    updateControls(performance.now(), true);
  });
  patrolButton.addEventListener('click', () => {
    if (elapsed < ULTRA_CINEMATIC_DURATION) return;
    walking = !walking;
    updateControls(performance.now(), true);
  });
  playButton.addEventListener('click', () => {
    resetPatrol();
    elapsed = 0;
    playing = true;
    updateState();
    updateControls(performance.now(), true);
  });
  pauseButton.addEventListener('click', () => {
    if (elapsed >= ULTRA_CINEMATIC_DURATION) return;
    playing = !playing;
    updateState();
    updateControls(performance.now(), true);
  });
  resetButton.addEventListener('click', () => seek(0));
  stageChoice.addEventListener('change', () => {
    const entry = MECH_ULTRA_TIMELINE.find(entry => entry.stage === stageChoice.value);
    seek(entry ? entry.start + (entry.stage === 'roof-drones' ? 1 : entry.duration / 2) : ULTRA_CINEMATIC_DURATION);
  });
  timeSlider.addEventListener('input', () => seek(Number(timeSlider.value)));
  followCamera.addEventListener('change', () => {
    updateState();
    arena.ultraFollowCamera = null;
  });

  canvas.addEventListener('pointerdown', event => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return;
    orbit.theta -= (event.clientX - pointer.x) * .006;
    orbit.phi = Math.max(.15, Math.min(1.3, orbit.phi + (event.clientY - pointer.y) * .004));
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, () => { pointer = null; });
  }
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    orbit.radius = Math.max(60, Math.min(650, orbit.radius * Math.exp(event.deltaY * .001)));
  }, { passive: false });
  canvas.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') orbit.theta -= .12;
    if (event.key === 'ArrowRight') orbit.theta += .12;
    if (event.key === 'ArrowUp') orbit.phi = Math.max(.15, orbit.phi - .08);
    if (event.key === 'ArrowDown') orbit.phi = Math.min(1.3, orbit.phi + .08);
    if (['+', '='].includes(event.key)) orbit.radius = Math.max(60, orbit.radius * .9);
    if (event.key === '-') orbit.radius = Math.min(650, orbit.radius * 1.1);
  });

  updateState();
  updateControls(previous, true);
  function tick(now) {
    if (stopped) return;
    const dt = Math.min(.05, Math.max(0, (now - previous) / 1000));
    previous = now;
    if (!document.hidden) {
      if (playing) {
        elapsed = Math.min(ULTRA_CINEMATIC_DURATION, elapsed + dt);
        if (elapsed === ULTRA_CINEMATIC_DURATION) playing = false;
      }
      const pose = updateState();
      if (pose.complete) {
        battleTime += dt; updatePatrol(dt);
        if (bossVisible) updateUltraRoofLaunchers(game, boss, dt);
        game.updateProjectiles(dt);
        for (const event of game.drainEvents()) arena.effect(event);
      }
      arena.time = elapsed + battleTime - (playing || pose.complete ? dt : 0);
      arena.update(game.state, dt);
      updateControls(now);
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  addEventListener('pagehide', event => {
    if (event.persisted) return;
    stopped = true;
    cancelAnimationFrame(frame);
    for (const [id, record] of arena.enemies) arena.removeEnemy(id, record);
    arena.dispose();
  }, { once: true });
}

try {
  boot();
} catch (error) {
  console.error('[rain-arena-of-copper] Arena preview failed', error);
  const message = document.querySelector('#model-error');
  message.hidden = false;
  message.textContent = 'The arena preview could not load. Reload the page to try again.';
}
