import { CREATURE_CATALOG, COLOSSEUM_CATALOG, DRILL_MINE_CATALOG } from './simulation.js';
import { WarGame } from './war.js';
import { OctoDialogue } from './octo-dialogue.js';
import { setupOctoVoice } from './octo-voice.js';
import { setupOctoDialogueSync } from './octo-dialogue-sync.js';
import { createOctoChat, replyAsOcto } from './octo-chat.js';
import { ArenaScene, SWING_CONTACT } from './scene.js';
import { GameUI } from './ui.js';
import { resolveSwordContacts } from './sword-contacts.js';
import { positionMineWalkerLadderPractice } from './mine-walker-practice.js';
import { beginUltraEncounter } from './mech-ultra-encounter.js';

class ArenaAudio {
  constructor() { this.enabled = false; this.context = null; }
  async enable(enabled) {
    this.enabled = enabled;
    if (!enabled) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context ||= new AudioContext();
    try { await this.context.resume(); } catch (error) { console.warn('[rain-arena-of-copper] sound unavailable', error); }
    this.play('start');
  }
  play(type) {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    const notes = { slash: [480, 120, 0.12, 'sawtooth'], block: [760, 210, .09, 'square'], hit: [170, 70, 0.07, 'square'], kill: [330, 80, 0.2, 'triangle'], hurt: [100, 45, 0.2, 'sawtooth'], dash: [160, 700, 0.14, 'sine'], kick: [90, 35, 0.2, 'triangle'], waveclear: [440, 880, 0.5, 'sine'], victory: [440, 1760, 0.9, 'triangle'], start: [220, 440, 0.35, 'sine'],
      ultrarooflaunch: [130, 680, .32, 'sawtooth'], ultraroofimpact: [82, 28, .4, 'triangle'], ultraslam: [65, 22, .5, 'triangle'] };
    const note = notes[type];
    if (!note) return;
    const [from, to, duration, shape] = note;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = shape;
    oscillator.frequency.setValueAtTime(from, now);
    oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(gain).connect(this.context.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}

function boot() {
  const canvas = document.querySelector('#arena');
  const game = new WarGame();
  const requestedView = new URLSearchParams(location.search).get('view');
  const ladderPractice = new URLSearchParams(location.search).get('practice') === 'mine-walker-ladder';
  const ultraEntrance = new URLSearchParams(location.search).get('encounter') === 'ultra';
  const ultraPractice = ultraEntrance || new URLSearchParams(location.search).get('practice') === 'ultra';
  let savedView;
  try { savedView = localStorage.getItem('rain-arena-camera'); } catch { /* Camera preferences are optional. */ }
  const initialView = ['first-person', 'third-person'].includes(requestedView) ? requestedView
    : savedView === 'third-person' ? savedView : 'first-person';
  const scene = new ArenaScene(canvas, { cameraMode: initialView });
  const cameraChoice = document.querySelector('#camera-mode');
  function applyCameraView(mode) {
    scene.setCameraMode(mode);
    document.body.dataset.cameraMode = mode;
    cameraChoice.value = mode;
    canvas.setAttribute('aria-label', canvas.getAttribute('aria-label').replace(/First-person|Third-person/,
      mode === 'third-person' ? 'Third-person' : 'First-person'));
  }
  applyCameraView(initialView);
  cameraChoice.addEventListener('change', () => {
    applyCameraView(cameraChoice.value);
    const currentUrl = new URL(location.href);
    currentUrl.searchParams.delete('view');
    history.replaceState(null, '', currentUrl);
    try { localStorage.setItem('rain-arena-camera', cameraChoice.value); }
    catch (error) { console.info('[rain-arena-of-copper] camera preference unavailable:', error.message); }
  });
  const audio = new ArenaAudio();
  const octoVoice = setupOctoVoice(document.querySelector('#octo-voice'));
  const octoDialogue = new OctoDialogue();
  const octoChatState = createOctoChat();
  let octoChatActorId = null;
  let resumeAfterOctoChat = false;
  let octoSourceAvailable = null;
  const octoSync = setupOctoDialogueSync({ onUpdate: source => {
    const accepted = octoDialogue.updateSource(source);
    if (accepted && octoSourceAvailable !== true) console.info('[rain-arena] Octo dialogue synced from Axolotl Major.');
    if (accepted) octoSourceAvailable = true;
    return accepted;
  }, onUnavailable: () => {
    if (octoSourceAvailable !== false) console.info('[rain-arena] Octo dialogue source unavailable; retaining bundled lines.');
    octoSourceAvailable = false;
  } });
  let octoVoiceActive = false;
  let octoSpeakerId = null;
  const keys = new Set();
  const pointer = { attack: false, block: false };
  const touch = { x: 0, z: 0, active: false, attack: false, vertical: false, lookId: null, lookX: 0, lookY: 0 };
  const records = { bestWave: 0, bestScore: 0 };
  try {
    const saved = JSON.parse(localStorage.getItem('tri-arena-records-v2') || '{}');
    for (const name of ['bestWave', 'bestScore']) if (Number.isSafeInteger(saved[name]) && saved[name] >= 0) records[name] = saved[name];
  } catch (error) { console.info('[rain-arena-of-copper] local records unavailable:', error.message); }
  const coarsePointer = matchMedia('(pointer: coarse)').matches;
  let hadPointerLock = false;
  let pointerLockUnavailable = false;
  let freeMouseLook = false;
  let lastPointerUnlock = -1000;
  let previous = performance.now();
  let lastHudRender = -Infinity;
  let stopped = false;
  let animationFrame;
  // Cuts land when the swinging blade reaches the aim point, not on the click.
  let pendingCuts = [];
  let swingSerial = 0;
  let warPointer = null;
  const isWar = () => game.state.gameMode === 'war';
  const controlsWarPlayer = () => game.isWarPlayerActive();
  let wasControllingWarPlayer = false;

  function followingUltraEntrance() {
    return Boolean(game.state.ultraEncounter?.followCamera && !game.state.ultraEncounter.complete);
  }
  function attack() {
    if (followingUltraEntrance() || isWar() && !controlsWarPlayer()) return false;
    const strafing = keys.has('KeyA') || keys.has('KeyD') || keys.has('ArrowLeft') || keys.has('ArrowRight');
    return game.attack({ spatialCuts: true, pitch: scene.look.pitch,
      vertical: keys.has('KeyV') || (touch.active ? touch.vertical : !strafing) });
  }
  function updateRecords() {
    const next = { bestWave: Math.max(records.bestWave, game.state.wave), bestScore: Math.max(records.bestScore, game.state.score) };
    if (!game.state.practice && !isWar() && game.state.gameMode !== 'survival' && (next.bestWave !== records.bestWave || next.bestScore !== records.bestScore)) {
      Object.assign(records, next);
      try { localStorage.setItem('tri-arena-records-v2', JSON.stringify(records)); }
      catch (error) { console.info('[rain-arena-of-copper] could not save local records:', error.message); }
    }
    Object.assign(game.state, records);
  }

  function clearInput() {
    warPointer = null;
    keys.clear();
    pointer.attack = pointer.block = touch.attack = false;
    touch.x = touch.z = 0;
    touch.lookId = null;
    document.querySelector('.joystick-stick').style.transform = '';
  }
  function toggleUltraCamera() {
    const encounter = game.state.ultraEncounter;
    if (!encounter || encounter.complete) return;
    encounter.followCamera = !encounter.followCamera;
    clearInput(); ui.render(game.state);
  }
  function captureMouse() {
    if (isWar() && !controlsWarPlayer()) return;
    if (coarsePointer || document.pointerLockElement === canvas) return;
    const fallback = (error) => {
      pointerLockUnavailable = true;
      freeMouseLook = true;
      document.body.classList.add('mouse-free');
      document.querySelector('#capture-hint span').textContent = 'MOVE MOUSE TO LOOK · CLICK TO SLICE';
      document.querySelector('#capture-hint small').textContent = 'WASD TO MOVE · ESC TO PAUSE';
      if (error) console.info('[rain-arena-of-copper] free mouse look enabled:', error.message);
    };
    if (pointerLockUnavailable || !canvas.requestPointerLock) { fallback(); return; }
    try {
      const request = canvas.requestPointerLock();
      request?.catch(fallback);
    } catch (error) { fallback(error); }
  }
  function releaseMouse() {
    freeMouseLook = false;
    document.body.classList.remove('mouse-free');
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }
  function togglePause() {
    clearInput();
    game.pause();
    if (game.state.mode === 'playing') captureMouse();
    else releaseMouse();
    ui.render(game.state);
    syncOctoDialogue();
  }
  function installUpgrade(id) {
    if (!game.chooseUpgrade(id)) return;
    clearInput();
    pendingCuts = [];
    ui.render(game.state);
    ui.toast(game.state.gameMode === 'survival' ? 'UPGRADE INSTALLED — SURVIVAL CONTINUES'
      : game.state.wavePlan.boss ? `${game.state.wavePlan.boss.name.toUpperCase()} — BOSS INBOUND`
      : `WAVE ${String(game.state.wave).padStart(3, '0')} — ${game.state.arenaId === 'drill-mine' ? 'MINE TUNNELS ACTIVE' : game.state.arenaId === 'colosseum' ? 'ROBOTS INBOUND' : 'THE TRI RETURN'}`);
    canvas.focus({ preventScroll: true });
    captureMouse();
  }
  function updateWarViewport() {
    const panel = document.querySelector('#war-setup');
    scene.setWarInset(isWar() && game.state.war?.phase === 'setup' && innerWidth > 680
      ? panel.getBoundingClientRect().right + 16 : 0);
  }
  function setWarView(enabled) {
    scene.setWarMode(enabled);
    if (enabled) canvas.setAttribute('aria-label', 'War Mode battlefield. Choose a team and enemy, then click its half of the floor to place it. Drag to orbit and scroll to zoom. Use Add to side for automatic placement.');
    else {
      canvas.setAttribute('aria-label', 'Rain Arena of Copper. First-person arena combat. WASD moves, mouse looks, left click slices, right click kicks, Shift dashes, Space jumps, E blocks, and Escape pauses.');
      applyCameraView(cameraChoice.value);
    }
  }
  function runWarAction(action) {
    try {
      octoVoice.unlock();
      const result = action();
      ui.render(game.state);
      updateWarViewport();
      syncWarControl();
      syncOctoDialogue();
      return result;
    } catch (error) {
      if (!(error instanceof RangeError)) console.error('[rain-arena-of-copper] war action failed', error);
      ui.toast(error instanceof RangeError ? error.message : 'Could not update the armies. Try again.');
      return false;
    }
  }
  function placeWarUnit(point) {
    if (!isWar() || game.state.war?.phase !== 'setup') return;
    if (!point) { ui.toast('Click the arena floor to place your unit.'); return; }
    runWarAction(() => game.placeWarUnit({ ...ui.getWarPlacement(), ...point }));
  }
  function syncOctoDialogue(manual = false) {
    const octos = game.state.enemies.filter(actor => actor.type === 'octo-nose' && actor.hp > 0);
    const active = isWar() && ['war-setup', 'playing'].includes(game.state.mode) && octos.length > 0;
    if (active !== octoVoiceActive) {
      if (active) octoSync.start(); else octoSync.stop();
    }
    if (!active || octoSpeakerId !== null && !octos.some(actor => actor.id === octoSpeakerId)) {
      if (octoVoiceActive) octoVoice.cancel();
      octoSpeakerId = null;
    }
    octoVoiceActive = active;
    const line = manual ? octoDialogue.talk(game.state) : octoDialogue.update(game.state);
    if (line) {
      ui.showOctoLine(line);
      octoVoice.speak(line.text);
      octoSpeakerId = line.id;
    }
  }
  function syncWarControl() {
    const active = controlsWarPlayer();
    if (active === wasControllingWarPlayer) return;
    clearInput(); pendingCuts = [];
    if (active) {
      canvas.setAttribute('aria-label', 'War Mode Player. WASD moves, mouse looks, left click slices, right click kicks, Shift dashes, Space jumps, E blocks, T talks to Octo, and Escape pauses.');
      scene.look.angle = game.state.player.angle;
      scene.look.pitch = -.08;
      canvas.focus({ preventScroll: true });
      captureMouse();
      ui.toast('YOU ARE THE PLAYER — ALL PERMANENT UPGRADES MAXED');
    } else {
      releaseMouse();
      if (isWar()) canvas.setAttribute('aria-label', 'War Mode spectator. Drag to orbit, scroll to zoom, and Escape pauses the armies.');
      if (isWar() && game.state.mode === 'playing') ui.toast('YOUR FIGHTER FELL — WATCH YOUR ARMY FINISH THE BATTLE');
    }
    wasControllingWarPlayer = active;
  }
  function openOctoConversation() {
    if (!isWar() || !['war-setup', 'playing', 'paused'].includes(game.state.mode)) return;
    const player = game.state.player;
    const candidates = game.state.enemies.filter(actor => actor.type === 'octo-nose' && actor.hp > 0)
      .filter(actor => !controlsWarPlayer() || Math.hypot(actor.x - player.x, actor.z - player.z) <= 8)
      .sort((a, b) => Number(b.team === player.team) - Number(a.team === player.team)
        || Math.hypot(a.x - player.x, a.z - player.z) - Math.hypot(b.x - player.x, b.z - player.z));
    const actor = candidates[0];
    if (!actor) { ui.toast('GET WITHIN EIGHT METRES OF OCTO NOSE TO CHAT'); return; }
    if (ui.octoChatOpen) return;
    resumeAfterOctoChat = game.state.mode === 'playing';
    octoChatActorId = actor.id;
    clearInput(); pendingCuts = [];
    if (resumeAfterOctoChat) game.pause();
    releaseMouse(); octoVoice.unlock();
    ui.render(game.state); syncOctoDialogue();
    ui.openOctoChat({ id: actor.id, team: actor.team });
  }
  function closeOctoConversation(resume = true) {
    const shouldResume = resume && resumeAfterOctoChat;
    resumeAfterOctoChat = false; octoChatActorId = null;
    ui.closeOctoChat({ notify: false });
    clearInput(); pendingCuts = [];
    if (shouldResume && game.state.mode === 'paused' && game.state.war?.phase === 'battle') game.pause();
    ui.render(game.state); syncOctoDialogue();
    if (game.state.mode === 'playing') { canvas.focus({ preventScroll: true }); captureMouse(); }
  }
  function sendOctoMessage(text) {
    const actor = game.state.enemies.find(enemy => enemy.id === octoChatActorId && enemy.hp > 0);
    if (!actor) return null;
    const answer = replyAsOcto(octoChatState, text, { dialogueSource: octoDialogue.source,
      state: game.state, actor, player: game.state.player, controlsPlayer: controlsWarPlayer() });
    if (!answer) return null;
    if (answer.command) actor.octoCommand = answer.command;
    octoDialogue.nextRemarkAt = game.state.elapsed + 20;
    octoVoice.unlock(); octoVoice.speak(answer.reply);
    return answer.reply;
  }
  const ui = new GameUI({
    onStart: ({ gameMode = 'endless', arenaId = 'bonefields', colosseumMode = 'copper', practiceType = 'blob' } = {}) => {
      if (ui.octoChatOpen) closeOctoConversation(false);
      clearInput();
      pendingCuts = [];
      scene.setArena(arenaId);
      setWarView(gameMode === 'war');
      if (gameMode === 'war') {
        octoVoice.unlock();
        releaseMouse();
        game.startWar({ arenaId });
        ui.render(game.state);
        updateWarViewport();
        syncOctoDialogue();
        ui.toast('PLACE BLUE ON THE LEFT AND RED ON THE RIGHT — THEN FIGHT');
        return;
      }
      const creature = [...CREATURE_CATALOG, ...COLOSSEUM_CATALOG, ...DRILL_MINE_CATALOG].find(entry => entry.id === practiceType);
      if (gameMode === 'practice') {
        if (creature) game.startCreaturePractice(practiceType, { arenaId, colosseumMode });
        else game.startBossPractice(practiceType, { arenaId, colosseumMode });
      } else game.start({ gameMode, arenaId, colosseumMode });
      scene.look.angle = 0;
      scene.look.pitch = -0.08;
      if (gameMode === 'practice') {
        const target = game.state.enemies.find(enemy => creature ? enemy.type === practiceType : enemy.boss);
        scene.look.angle = Math.atan2(target.x, target.z);
        const aimHeight = { blob: .55, ling: 1.06, brain: 1.98, gardener: 3.25, trider: 3.4, spreader: 1.35,
          'copper-robot': 1.6, knight: 1.6, 'copper-drill-worm': .95, 'copper-head-catapult': 1.6, 'copper-drill-hound': 1.15,
          'copper-repair-drone': 2.25, 'copper-spider-drone': 3.5, 'copper-mine-walker': 8, 'copper-fortress': 3.1, 'copper-mega-drill': 4.15 }[practiceType] ?? 1.6;
        scene.look.pitch = creature || ['copper-fortress', 'copper-mega-drill', 'copper-spider-drone', 'copper-mine-walker'].includes(practiceType) ? Math.atan2(aimHeight - 1.88, Math.max(1, Math.hypot(target.x, target.z))) : .05;
        game.state.player.angle = scene.look.angle;
        if (practiceType === 'mech-spider-tank-ultra') scene.look.pitch = .65;
        if (ladderPractice && practiceType === 'copper-mine-walker') {
          const walker = positionMineWalkerLadderPractice(game);
          if (walker) { scene.look.angle = walker.angle; scene.look.pitch = .25; }
        }
      }
      const practiceName = creature?.name || game.state.enemies.find(enemy => enemy.type === practiceType)?.name || practiceType;
      if (ultraEntrance && practiceType === 'mech-spider-tank-ultra') {
        beginUltraEncounter(game); game.state.ultraEncounter.followCamera = true;
      }
      ui.render(game.state);
      ui.toast(gameMode === 'survival' ? arenaId === 'drill-mine' ? 'DRILL MINE SURVIVAL — WATCH THE TUNNELS' : arenaId === 'colosseum' ? 'ROBOT SURVIVAL — KEEP MOVING' : 'SURVIVAL — KEEP MOVING. THE TRI KEEP COMING.'
        : gameMode === 'practice' ? `PRACTICE — ${practiceName.toUpperCase()}`
        : arenaId === 'drill-mine' ? 'DRILL MINE — SPIDER FROM WAVE 4 · WALKER FROM WAVE 6'
        : arenaId === 'colosseum' ? 'COLOSSEUM — ROBOT WAVE 001'
        : 'ENDLESS WAVE 001 — AIM YOUR CUTS. FIRST BOSS AT WAVE 005.');
      canvas.focus({ preventScroll: true });
      captureMouse();
      if (ladderPractice && practiceType === 'copper-mine-walker') ui.toast('W / UP TO CLIMB · S / DOWN TO DESCEND · SPACE TO LET GO');
    },
    onArenaChange: arenaId => { scene.setArena(arenaId); },
    onMenu: () => {
      if (ui.octoChatOpen) closeOctoConversation(false);
      clearInput(); pendingCuts = [];
      game.returnToMenu(); setWarView(false); releaseMouse(); ui.render(game.state); syncOctoDialogue();
    },
    onBossPractice: (type, { arenaId = 'bonefields', colosseumMode = 'copper' } = {}) => {
      clearInput();
      pendingCuts = [];
      scene.setArena(arenaId);
      setWarView(false);
      const creature = [...CREATURE_CATALOG, ...COLOSSEUM_CATALOG, ...DRILL_MINE_CATALOG].find(entry => entry.id === type);
      if (creature) game.startCreaturePractice(type, { arenaId, colosseumMode });
      else game.startBossPractice(type, { arenaId, colosseumMode });
      const target = game.state.enemies.find(enemy => creature ? enemy.type === type : enemy.boss);
      scene.look.angle = Math.atan2(target.x, target.z);
      const aimHeight = { blob: .55, ling: 1.06, brain: 1.98, gardener: 3.25, trider: 3.4, spreader: 1.35,
        'copper-robot': 1.6, knight: 1.6, 'copper-drill-worm': .95, 'copper-head-catapult': 1.6, 'copper-drill-hound': 1.15,
        'copper-repair-drone': 2.25, 'copper-spider-drone': 3.5, 'copper-mine-walker': 8, 'copper-fortress': 3.1, 'copper-mega-drill': 4.15 }[type] ?? 1.6;
      scene.look.pitch = creature || ['copper-fortress', 'copper-mega-drill', 'copper-spider-drone', 'copper-mine-walker'].includes(type) ? Math.atan2(aimHeight - 1.88, Math.max(1, Math.hypot(target.x, target.z))) : 0.05;
      game.state.player.angle = scene.look.angle;
      ui.render(game.state);
      ui.toast(`${creature ? 'CREATURE' : 'BOSS'} PRACTICE — ${target.name.toUpperCase()}`);
      canvas.focus({ preventScroll: true });
      captureMouse();
    },
    onPause: togglePause,
    onOctoTalk: openOctoConversation,
    onOctoSend: sendOctoMessage,
    onOctoChatClose: () => closeOctoConversation(),
    onWarAdd: selection => runWarAction(() => game.placeWarUnit(selection)),
    onWarRemove: id => runWarAction(() => game.removeWarUnit(id)),
    onWarClear: team => runWarAction(() => game.clearWarTeam(team)),
    onWarFight: () => runWarAction(() => {
      clearInput(); pendingCuts = []; releaseMouse();
      return game.startWarBattle();
    }),
    onWarRematch: () => runWarAction(() => { clearInput(); pendingCuts = []; return game.resetWarBattle(); }),
    onWarEdit: () => runWarAction(() => {
      clearInput(); pendingCuts = [];
      const result = game.resetWarBattle({ edit: true });
      setWarView(true);
      return result;
    }),
    onUpgrade: installUpgrade,
    onSound: (enabled) => { void audio.enable(enabled); },
  });
  window.addEventListener('resize', updateWarViewport);
  document.querySelector('#ultra-camera').addEventListener('click', toggleUltraCamera);

  window.addEventListener('keydown', (event) => {
    if (ui.octoChatOpen) {
      if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); closeOctoConversation(); }
      return;
    }
    if (event.code !== 'Escape' && event.target instanceof Element && event.target.closest('select, input, textarea, [contenteditable="true"]')) return;
    if (event.target instanceof HTMLButtonElement && (event.code === 'Space' || event.code === 'Enter')) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) event.preventDefault();
    if (event.code === 'Escape' && !event.repeat) {
      if (game.state.mode !== 'paused' || performance.now() - lastPointerUnlock > 250) togglePause();
      return;
    }
    if (event.code === 'KeyC' && !event.repeat && game.state.ultraEncounter && !game.state.ultraEncounter.complete
      && ['playing', 'paused'].includes(game.state.mode)) {
      event.preventDefault(); toggleUltraCamera(); return;
    }
    if (event.code === 'KeyT' && !event.repeat && isWar()) {
      event.preventDefault(); openOctoConversation();
      return;
    }
    if (game.state.mode === 'upgrade' && !event.repeat && /^Digit[0-9]$/.test(event.code)) {
      const digit = Number(event.code.slice(-1));
      const upgrade = game.state.upgrades[digit === 0 ? 9 : digit - 1];
      if (upgrade && !upgrade.capped) { event.preventDefault(); installUpgrade(upgrade.id); }
      return;
    }
    if (game.state.mode !== 'playing' || followingUltraEntrance() || isWar() && !controlsWarPlayer()) return;
    keys.add(event.code);
    if (event.repeat) return;
    if (event.code.startsWith('Shift')) game.dash();
    if (event.code === 'Space') game.jump();
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    clearInput();
    if (game.state.mode === 'playing') { game.pause(); releaseMouse(); ui.render(game.state); syncOctoDialogue(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state.mode === 'playing') { clearInput(); game.pause(); releaseMouse(); ui.render(game.state); syncOctoDialogue(); }
  });
  document.addEventListener('pointerlockchange', () => {
    const captured = document.pointerLockElement === canvas;
    document.body.classList.toggle('mouse-captured', captured);
    if (!captured && hadPointerLock && game.state.mode === 'playing') {
      lastPointerUnlock = performance.now();
      clearInput(); game.pause(); ui.render(game.state);
    }
    hadPointerLock = captured;
  });
  function turn(dx, dy, sensitivity = 0.0025) {
    if (Math.abs(dx) + Math.abs(dy) > 1) document.body.classList.add('look-used');
    scene.look.angle -= dx * sensitivity;
    scene.look.pitch = Math.max(-1.15, Math.min(1.15, scene.look.pitch - dy * sensitivity));
  }
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  canvas.addEventListener('pointermove', (event) => {
    if (isWar() && !controlsWarPlayer()) {
      if (!warPointer || warPointer.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - warPointer.startX, event.clientY - warPointer.startY) > 5) warPointer.dragged = true;
      if (warPointer.dragged) scene.warOrbit(event.clientX - warPointer.x, event.clientY - warPointer.y);
      warPointer.x = event.clientX; warPointer.y = event.clientY;
      return;
    }
    if (game.state.mode !== 'playing' || followingUltraEntrance()) return;
    if (event.pointerId === touch.lookId) {
      turn(event.clientX - touch.lookX, event.clientY - touch.lookY, 0.006);
      touch.lookX = event.clientX; touch.lookY = event.clientY;
    } else if (document.pointerLockElement === canvas || (event.pointerType === 'mouse' && (freeMouseLook || event.buttons === 1))) turn(event.movementX, event.movementY);
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (isWar() && !controlsWarPlayer()) {
      event.preventDefault();
      warPointer = { id: event.pointerId, button: event.button, startX: event.clientX, startY: event.clientY,
        x: event.clientX, y: event.clientY, dragged: false };
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    if (game.state.mode !== 'playing' || followingUltraEntrance()) return;
    event.preventDefault();
    if (event.pointerType === 'touch') {
      touch.active = true; touch.lookId = event.pointerId;
      touch.lookX = event.clientX; touch.lookY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      return;
    }
    captureMouse();
    game.state.player.angle = scene.look.angle;
    if (event.button === 0) { pointer.attack = true; attack(); }
    if (event.button === 2) game.kick();
  });
  window.addEventListener('pointerup', (event) => {
    if (warPointer?.id === event.pointerId) {
      const place = !warPointer.dragged && warPointer.button === 0;
      warPointer = null;
      if (place) placeWarUnit(scene.groundPoint(event.clientX, event.clientY));
    }
    if (event.pointerId === touch.lookId) touch.lookId = null;
    if (event.button === 0) pointer.attack = false;
    if (event.button === 2) pointer.block = false;
  });
  canvas.addEventListener('pointercancel', clearInput);
  canvas.addEventListener('wheel', event => {
    if (!isWar() || controlsWarPlayer()) return;
    event.preventDefault();
    scene.warZoom(event.deltaY);
  }, { passive: false });

  const joystick = document.querySelector('#joystick');
  const stick = joystick.querySelector('.joystick-stick');
  let joystickPointer = null;
  function moveJoystick(event) {
    if (event.pointerId !== joystickPointer) return;
    const bounds = joystick.getBoundingClientRect();
    const x = (event.clientX - bounds.left - bounds.width / 2) / 37;
    const z = (event.clientY - bounds.top - bounds.height / 2) / 37;
    const magnitude = Math.max(1, Math.hypot(x, z));
    touch.x = x / magnitude; touch.z = z / magnitude;
    stick.style.transform = `translate(${touch.x * 30}px, ${touch.z * 30}px)`;
  }
  joystick.addEventListener('pointerdown', event => {
    event.preventDefault();
    joystickPointer = event.pointerId;
    touch.active = true;
    joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
  });
  joystick.addEventListener('pointermove', moveJoystick);
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) joystick.addEventListener(name, () => {
    joystickPointer = null; touch.x = touch.z = 0; stick.style.transform = '';
  });
  document.querySelectorAll('[data-mobile]').forEach(button => {
    button.addEventListener('pointerdown', event => {
      event.preventDefault(); event.stopPropagation();
      if (followingUltraEntrance()) return;
      touch.active = true;
      if (button.dataset.mobile === 'cut-mode') {
        touch.vertical = !touch.vertical;
        button.setAttribute('aria-pressed', String(touch.vertical));
        button.textContent = touch.vertical ? 'VERT' : 'HORIZ';
      }
      if (button.dataset.mobile === 'attack') touch.attack = true;
      if (button.dataset.mobile === 'dash') game.dash();
      if (button.dataset.mobile === 'kick') game.kick();
      if (button.dataset.mobile === 'jump') game.jump();
      button.setPointerCapture(event.pointerId);
    });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, () => { if (button.dataset.mobile === 'attack') touch.attack = false; });
  });

  function tick(now) {
    if (stopped) return;
    // Menus and paused scenes need less rendering work than live combat.
    if (game.state.mode !== 'playing' && now - previous < 1000 / 30) {
      animationFrame = requestAnimationFrame(tick);
      return;
    }
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    const dx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + touch.x;
    const dz = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp')) + touch.z;
    const followingEntrance = followingUltraEntrance();
    const movement = followingEntrance ? { x: 0, z: 0 } : scene.screenMovement(dx, dz);
    const angle = scene.look.angle;
    game.update(dt, { ...movement, climb: followingEntrance ? 0 : -dz, strafe: followingEntrance ? 0 : dx,
      angle, block: pointer.block || keys.has('KeyE') || keys.has('KeyK') });
    syncWarControl();
    if (pointer.attack || touch.attack || keys.has('KeyF') || keys.has('KeyJ')) attack();
    if (game.state.mode === 'playing') {
      for (const cut of pendingCuts) cut.wait -= dt;
      const due = pendingCuts.filter(cut => cut.wait <= 0);
      pendingCuts = pendingCuts.filter(cut => cut.wait > 0);
      const contacts = due.map(({ event }) => ({ event, enemy: game.state.enemies.find(enemy => enemy.id === event.id) }))
        .filter(contact => contact.enemy?.hp > 0);
      const outcomes = resolveSwordContacts(contacts, {
        prepare: (event, enemy) => scene.prepareEnemyCut(event, enemy),
        cut: (event, enemy) => scene.cutEnemy(event, enemy),
      });
      for (const { event, result } of outcomes) {
        if (result) game.applySliceResult(event.id, result);
        if (result?.absorbedHits?.length) {
          pendingCuts = pendingCuts.filter(cut => cut.event.swingId !== event.swingId);
          audio.play('block');
        }
      }
    }
    // Applying a spatial cut can queue its own hit, sever and death events.
    for (let batch = 0; batch < 4; batch++) {
      const events = game.drainEvents();
      if (!events.length) break;
      for (const event of events) {
        if (event.type === 'warhit') {
          const target = game.state.enemies.find(enemy => enemy.id === event.targetId);
          const attacker = game.state.enemies.find(enemy => enemy.id === event.attackerId);
          game.applyWarHit(event, target ? scene.resolveWarHit(event, attacker, target) : null);
        } else if (event.type === 'cut') {
          pendingCuts.push({ event: { ...event, swingId: swingSerial }, wait: SWING_CONTACT });
        } else {
          if (event.type === 'start') { pendingCuts = []; swingSerial = 0; }
          const repaired = scene.effect(event.type === 'slash' ? { ...event, swingId: ++swingSerial } : event);
          if (event.type === 'repair' && repaired) game.applySliceResult(event.id, repaired);
          audio.play(event.type);
        }
        if (event.type === 'waveclear') { clearInput(); releaseMouse(); ui.toast('WAVE CLEARED — UPGRADE AND CONTINUE'); }
        if (!isWar() && event.type === 'sever') ui.toast(event.legsLost ? 'LEGS CUT — MOVEMENT DAMAGED' : 'CLEAN CUT — ANATOMY DETACHED');
        if (!isWar() && event.type === 'kill' && event.boss) ui.toast('BOSS DEFEATED — THE GAUNTLET CONTINUES');
        if (!isWar() && event.type === 'shield') ui.toast('SHIELD ACTIVE — WAIT FOR AN OPENING');
        if (event.type === 'survivalmilestone') {
          clearInput(); pendingCuts = []; releaseMouse();
          ui.toast(`THREAT ${event.level} — CHOOSE YOUR UPGRADE`);
        }
        if (event.type === 'survivalboss') ui.toast('BOSS INBOUND — KEEP MOVING');
      }
    }
    if (game.state.mode === 'dead' || game.state.mode === 'victory') releaseMouse();
    scene.update(game.state, dt, Math.min(1, Math.hypot(dx, dz)));
    updateRecords();
    if (game.state.mode !== ui.mode || now - lastHudRender >= 50) {
      ui.render(game.state);
      lastHudRender = now;
    }
    syncOctoDialogue();
    animationFrame = requestAnimationFrame(tick);
  }
  ui.render(game.state);
  if (ladderPractice || ultraPractice) {
    Object.assign(ui.menuSelection, { gameMode: 'practice', arenaId: 'drill-mine' });
    document.querySelector('#mine-practice-choice').value = ultraPractice ? 'mech-spider-tank-ultra' : 'copper-mine-walker';
    ui.updateMenuChoices();
    document.querySelector('#start-button').click();
  }
  animationFrame = requestAnimationFrame(tick);
  window.addEventListener('pagehide', () => { stopped = true; cancelAnimationFrame(animationFrame); octoSync.dispose(); octoVoice.dispose(); scene.dispose(); }, { once: true });
}

try { boot(); }
catch (error) {
  console.error('[rain-arena-of-copper] unable to start game', error);
  const panel = document.querySelector('#menu-panel');
  const message = document.createElement('p');
  message.className = 'panel-intro';
  message.textContent = 'The arena could not start. Enable hardware acceleration or try a browser that supports WebGL, then reload.';
  message.setAttribute('role', 'alert');
  panel?.append(message);
  const start = document.querySelector('#start-button');
  if (start) start.disabled = true;
}
