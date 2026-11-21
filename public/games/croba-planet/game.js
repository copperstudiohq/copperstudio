import {createQuickSlotsPanel} from './quick-slots-ui.js';
import {saveRenderDistance} from './render-distance-settings.js';
import {useQuickItem,equippedHint} from './tool-actions.js';
import {createSimulationClock} from './simulation-clock.js';
import {insideUniversalBase,rotateBuildPlan,removeNearbyFurniture} from './base-building.js';
import {activeQuickItem,selectQuickSlot,releaseQuickUse,nearbyCopperCargo,interactCopperCargo} from './copper-yoyo.js';
import { finishLoading,showStartupError } from './loading-screen.js';
import {setupExpeditionUI} from './expedition-ui.js';
import {
  createWorld,
  updateWorld,
  interact,
  resetWorld,
  currentPrompt,
} from "./world.js";
import { Scene } from "./scene.js";
import { getBestiaryEntries,selectBestiaryEntries } from "./bestiary.js";
import { playAdultScreech } from "./squid-audio.js";
import { createForestAudio } from "./forest-audio.js";
import { createSandWormAudio } from './sand-worm-audio.js';
import {createRegionMusic} from './region-music.js';
import {createRegionalAmbientNoise} from './regional-ambient-noise.js';
import {createOpeningFlightPlayer} from './opening-flight-player.js';
import { WATER_LEVEL, BLUE_OCEAN_START_X, BLUE_OCEAN_DEPTH_METERS } from "./terrain.js";
import {
  createLookState,
  rotateLook,
  movementFromView,
  TURN_SPEED,
  TouchInput,
} from "./controls.js";

/** @template {HTMLElement} T @param {string} id @returns {T} */
function element(id) {
  const found = document.getElementById(id);
  if (!found) throw new Error(`Required game control is missing: ${id}`);
  return /** @type {T} */ (found);
}

try {
  const world = createWorld();
  element("sector-size").textContent = `${world.platforms.length} ICE ISLANDS`;
  const scene = new Scene(element("world"));
  scene.canvas.tabIndex = 0;
  const look = createLookState();
  const simulationClock=createSimulationClock();
  const coarsePointer =
    window.matchMedia?.("(any-pointer: coarse)").matches ?? false;
  const keys = new Set();
  const touchKeys = new Set();
  const touch = new TouchInput();
  const captures = new Map();
  const heldActions = new Map();
  const directionButtons = [...document.querySelectorAll("[data-dir]")];
  const inputButtons = [...directionButtons, element("movement-stick"), element("touch-jump"), element("touch-dive"), element("touch-use")];
  const menu = /** @type {HTMLDialogElement} */ (element("menu"));
  const bestiary = /** @type {HTMLDialogElement} */ (element("bestiary"));
  let expeditionUI=null,quickSlotsPanel=null;
  let mouseToyHeld=false,toyPointerId=null;
  const minimap = /** @type {HTMLCanvasElement} */ (element("minimap"));
  let started = false;
  let hasSession=false;
  let loadingComplete = false;
  let paused = false;
  let graphicsLost = false;
  let sceneDirty = true;
  const renderDistanceControls=[...document.querySelectorAll('[data-render-distance]')];
  const syncRenderDistance=()=>{for(const control of renderDistanceControls)control.value=String(scene.renderDistance);};
  syncRenderDistance();
  for(const control of renderDistanceControls)control.addEventListener('change',()=>{
    scene.setRenderDistance(saveRenderDistance(control.value));syncRenderDistance();sceneDirty=true;
  });
  let mapOpen = false;
  let previousTime = null;
  let nextSceneTime = null;
  let sceneDelta = 0;
  let soundEnabled = false;
  let audio = null;
  let ambient = null;
  let soundAvailable = true;
  let adultCall = null;
  let lastCallingAdult = "";
  let lastAdultCallTime = -Infinity;
  let adultCallAvailable = true;
  let forestAudio = null;
  let forestAudioAvailable = true;
  let sandWormAudio=null,sandWormAudioAvailable=true;
  const regionMusic=createRegionMusic();
  const regionalAmbientNoise=createRegionalAmbientNoise();
  let lastHudUpdate = -1;
  let lookIsTouch = false;
  let lastTouchTime = -Infinity;
  let wasPointerLocked = false;
  let lastPointerUnlock = 0;
  let lastThreatAnnouncement = "";
  let lastThreatKind = "";
  let encounterActive = false;
  let lastEncounterPhase = "";
  const motionPreference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionPreference?.matches ?? false;
  scene.reducedMotion = reducedMotion;
  const openingPlayer=createOpeningFlightPlayer({document,
    drawWake(){scene.setLook(look.yaw,look.pitch);scene.draw(world,0,0,false);},
    onComplete(event){scene.resetView();previousTime=null;nextSceneTime=null;sceneDirty=true;setPaused(false);startGame(event);},
  });

  function pointerLocked() {
    return document.pointerLockElement === scene.canvas;
  }

  function anyDialogOpen() { return menu.open || bestiary.open || Boolean(expeditionUI?.hasDialog()); }
  function activeEncounter() { return world.sandWormEncounter || world.treeStalkerEncounter || world.centipedeEncounter || world.squidEncounter; }

  document.body.classList.toggle("touch-input", coarsePointer);

  function notePointer(event) {
    if (event.pointerType === "touch") {
      lastTouchTime = Date.now();
      document.body.classList.add("touch-input");
    }
  }

  function requestLook(event) {
    const touchLayout = coarsePointer || window.matchMedia?.("(max-width: 900px)").matches;
    if (!started || paused || activeEncounter() || touchLayout || pointerLocked() ||
      event?.pointerType === "touch" || event?.sourceCapabilities?.firesTouchEvents ||
      Date.now() - lastTouchTime < 1500) return;
    // Embedded browsers may decline pointer lock; drag and arrow controls still work.
    try {
      const request = scene.canvas.requestPointerLock?.();
      request?.catch?.(() => {});
    } catch {
      // Pointer lock is an optional convenience, never a requirement for play.
    }
  }

  function releaseLook() {
    for (const [id, pointer] of touch.pointers) {
      if (pointer.action === "look") releasePointer("look", id);
    }
    if (pointerLocked()) document.exitPointerLock?.();
  }

  function releasePointer(action, id) {
    if (!touch.release(action, id)) return;
    const target = captures.get(id);
    captures.delete(id);
    try { target?.releasePointerCapture?.(id); } catch { /* Already released by the browser. */ }
  }

  function claimPointer(action, event) {
    if (!started || paused || activeEncounter() || event.button > 0) return false;
    notePointer(event);
    if (!touch.begin(action, event.pointerId, event.clientX ?? 0, event.clientY ?? 0)) return false;
    event.preventDefault();
    captures.set(event.pointerId, event.currentTarget);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Cancellation still clears state. */ }
    return true;
  }

  function clearInput() {
    mouseToyHeld=false;toyPointerId=null;releaseQuickUse(world,true);
    keys.clear(); touchKeys.clear();
    const owned = [...captures];
    captures.clear(); touch.clear();
    for (const [id, target] of owned) {
      try { target.releasePointerCapture?.(id); } catch { /* Capture may already be gone. */ }
    }
    for (const button of inputButtons) button.classList.remove("pressed");
    element("movement-knob").style.transform = "translate(0px, 0px)";
  }

  function focusGame() {
    if (started && !anyDialogOpen()) scene.canvas.focus({ preventScroll: true });
  }

  function setPaused(value) {
    const nextPaused = value || graphicsLost || Boolean(document.hidden);
    if (nextPaused !== paused) {
      sceneDirty = true;
      nextSceneTime = null;
      sceneDelta = 0;
    }
    paused = nextPaused;
    clearInput();
    if (paused) releaseLook();
    if (paused) stopAdultCall();
    if (paused) stopForestAudio();
    if (paused) stopSandWormAudio();
    if (paused) regionMusic.stop();
    if (paused) regionalAmbientNoise.stop();
    updateEncounter();
    if (ambient && audio)
      ambient.gain.setTargetAtTime(
        paused || !soundEnabled ? 0 : 0.035,
        audio.currentTime,
        0.3,
      );
  }

  /** The encounter is simulated by the world; this layer only presents its phase. */
  function updateEncounter() {
    const encounter = activeEncounter();
    const stalker = Boolean(world.treeStalkerEncounter);
    const centipede = Boolean(world.centipedeEncounter);
    const worm=Boolean(world.sandWormEncounter);
    const active = Boolean(encounter);
    if (active !== encounterActive) { clearInput(); releaseLook(); encounterActive = active; }
    const visible = started && !paused && active;
    const overlay = element("squid-encounter");
    overlay.classList.toggle("hidden", !visible);
    overlay.classList.toggle("reduced-motion", reducedMotion);
    overlay.classList.toggle("centipede-encounter", centipede);
    overlay.classList.toggle("tree-stalker-encounter", stalker);
    overlay.classList.toggle('worm-encounter',worm);
    overlay.setAttribute("aria-hidden", String(!visible));
    if (active && element("threat-announcement").textContent) element("threat-announcement").textContent = "";
    if (!encounter) {
      lastEncounterPhase = "";
      element("encounter-announcement").textContent = "";
      return;
    }
    if(worm){
      const eating=encounter.phase==='eating',progress=Math.max(0,Math.min(1,encounter.progress??0));
      element('encounter-tag').textContent='SULFURIC LAND · 100 m HUNTER';
      element('encounter-title').textContent=eating?'SWALLOWED':'CAUGHT';
      element('encounter-subtitle').textContent='Crobonic Artic Sulfur Worm';
      element('encounter-copy').textContent=eating?'The mouth plates close. Your rescue tether is returning you to the wreck.':'Its four armor plates open as you are drawn toward the mouth.';
      element('encounter-iris').style.setProperty('--iris-open',`${eating?80*(1-progress):94}%`);
      overlay.style.setProperty('--feeding-darkness',String(encounter.darkness??0));
      const phase=`worm:${encounter.phase}`;
      if(visible&&phase!==lastEncounterPhase){element('encounter-announcement').textContent=eating?'Swallowed by the Crobonic Artic Sulfur Worm. Your view fades before the rescue tether returns you to the wreck.':'Caught by the Crobonic Artic Sulfur Worm. It draws you toward its open mouth.';lastEncounterPhase=phase;}
      return;
    }
    const sharing=encounter.phase==="shared-bite",handoff=encounter.phase==="handoff";
    const eating = encounter.phase === "eating";
    const striking = encounter.phase === "striking",heldInBeak=striking&&Boolean(encounter.partnerId);
    const observing = encounter.phase === "observing", transferring = encounter.phase === "to-mouth";
    const feeding = encounter.phase === "feeding";
    const progress = Math.max(0, Math.min(1, Number.isFinite(encounter.progress) ? encounter.progress : 0));
    element("encounter-tag").textContent = stalker ? "VIOLET FOREST · TREE MIMIC" : centipede ? "ARCTIC · 60 m HUNTER" : "BLUE OCEAN · 30 m ADULT";
    element("encounter-title").textContent = stalker ? feeding ? "FADING OUT" : "CAUGHT" : sharing ? "SHARED PREY" : handoff ? "SECOND SQUID APPROACHING" : eating ? "EATEN" : heldInBeak ? "IN THE BEAK" : striking ? "MANDIBLE STRIKE" : observing ? "BEING OBSERVED" : transferring ? "HEADING TO THE BEAK" : centipede ? "FATAL BITE" : "TENTACLE GRIP";
    element("encounter-subtitle").textContent = stalker ? "Tree Stalker" : centipede ? "Ice Centipede" : eating
      ? "Artic Crobonic Squid"
      : observing ? "Held in front of its eye" : "Held by the adult Artic Crobonic Squid";
    element("encounter-copy").textContent = stalker ? feeding
      ? "Its feeding tube reaches your helmet. Your rescue tether is returning you to the wreck."
      : "Its twig claws lift you in front of its face."
      : sharing ? "The severed suit legs slide down rows of inward-pointing teeth." : handoff ? "The other adult takes over the feeding." : eating
      ? "Your rescue tether is returning you to the wreck."
      : centipede ? "One bite is fatal. Your rescue tether will return you to the wreck."
      : heldInBeak ? "Held between the open jaws. The beak is about to close." : striking ? "Two hooked fangs thrust inward before its beak opens."
      : observing ? "Its pupil follows you while it studies your helmet." : "A claw-tipped tentacle of the adult has caught you.";
    const irisOpening = stalker ? feeding ? 70 * (1 - progress) : 86
      : centipede
      ? eating ? 58 * (1 - progress) : 70 - 12 * progress
      : eating ? 40 * (1 - progress) : observing ? 92 : 86;
    element("encounter-iris").style.setProperty("--iris-open", `${irisOpening}%`);
    overlay.style.setProperty("--feeding-darkness", `${stalker && feeding ? Math.max(0, Math.min(1, (progress - .25) / .6)) : 0}`);
    const phase = `${stalker ? "tree-stalker" : centipede ? "centipede" : "squid"}:${encounter.phase}`;
    if (visible && phase !== lastEncounterPhase) {
      element("encounter-announcement").textContent = stalker
        ? `${feeding ? "The Tree Stalker's feeding tube reaches your helmet. Your view fades to black." : "Caught by the Tree Stalker. It lifts you in front of its face."} Your rescue tether will return you to the wreck.`
        : centipede
        ? `${eating ? "Eaten by the Ice Centipede." : "Fatal bite. The Ice Centipede caught you."} Your rescue tether will return you to the wreck.`
        : sharing ? "The first squid feeds while another adult moves closer." : handoff ? "A second adult takes over the feeding." : eating
        ? "Eaten by an adult Artic Crobonic Squid. Your rescue tether will return you to the wreck."
        : heldInBeak ? "You are held inside the open beak before it closes." : striking ? "The adult squid strikes with its two mandible fangs."
        : observing ? "The adult squid holds you before its eye and watches you." : "Tentacle grip. You are being lifted toward the adult squid’s eye.";
      lastEncounterPhase = phase;
    }
  }
  motionPreference?.addEventListener?.("change", (event) => {
    reducedMotion = event.matches;
    scene.reducedMotion = reducedMotion;
    sceneDirty = true;
    updateEncounter();
  });

  function openMenu() {
    if (menu.open) return;
    expeditionUI?.close();
    if (bestiary.open) bestiary.close();
    element("bestiary-toggle").setAttribute("aria-expanded", "false");
    setPaused(true);
    element("resume").innerHTML =
      `${started ? "Back to Croba" : "Ready to explore"} <span>↗</span>`;
    menu.showModal();
  }

  function closeMenu(event) {
    if (graphicsLost || document.hidden) return;
    menu.close();
    element("graphics-notice").classList.add("hidden");
    setPaused(false);
    focusGame();
    requestLook(event);
  }

  function updateCatalog() {
    const entries = getBestiaryEntries(world);
    const count = entries.filter((entry) => entry.discovered).length;
    const badge = `${count}/${entries.length}`;
    if (element("bestiary-badge").textContent !== badge) {
      element("bestiary-badge").textContent = badge;
      element("bestiary-progress").textContent = `${count} of ${entries.length} creatures identified`;
      element("bestiary-meter").setAttribute("aria-valuenow",String(count));
      element("bestiary-meter").setAttribute("aria-valuemax",String(entries.length));
      element("bestiary-meter-fill").style.width=`${count/entries.length*100}%`;
      element("bestiary-toggle").setAttribute("aria-label", `Open bestiary, ${count} of ${entries.length} creatures identified`);
    }
    const visible=selectBestiaryEntries(entries,element('bestiary-search').value,element('bestiary-filter').value??'all');
    const visibleIds=new Set(visible.map(entry=>entry.id));
    for (const entry of entries) {
      const card = element(`catalog-${entry.id}`);
      card.hidden=!visibleIds.has(entry.id);
      card.classList.toggle("locked", !entry.discovered);
      const values = {
        name: entry.discovered ? entry.name : "Unidentified creature",
        habitat: entry.discovered ? entry.habitat : "AWAITING ENCOUNTER",
        size: entry.discovered ? entry.size || "Size unmeasured" : "???",
        description: entry.discovered ? entry.description : "Approach within 10 m to automatically identify this creature.",
        disposition:entry.discovered?entry.disposition??'Recorded':'Unrecorded',
        note:entry.discovered?entry.fieldNote??'Observe from a safe distance.':'Field notes unlock after a close encounter.',
      };
      for (const [field, value] of Object.entries(values)) {
        const target = element(`catalog-${entry.id}-${field}`);
        if (target.textContent !== value) target.textContent = value;
      }
    }
    element('bestiary-empty').hidden=visible.length>0;
    const results=element('bestiary-results'),message=`${visible.length} of ${entries.length} entries shown`;
    if(results.textContent!==message)results.textContent=message;
  }

  function openBestiary() {
    if (graphicsLost || document.hidden) return;
    element("graphics-notice").classList.add("hidden");
    if (bestiary.open) return;
    expeditionUI?.close();
    if (menu.open) menu.close();
    setPaused(true);
    updateCatalog();
    element("bestiary-toggle").setAttribute("aria-expanded", "true");
    bestiary.showModal();
    element("close-bestiary").focus({ preventScroll: true });
  }

  function closeBestiary(event) {
    if (graphicsLost || document.hidden) return;
    bestiary.close();
    element("bestiary-toggle").setAttribute("aria-expanded", "false");
    setPaused(false);
    if (started) { focusGame(); requestLook(event); }
    else element("bestiary-toggle").focus({ preventScroll: true });
  }

  function startGame(event) {
    if (graphicsLost || document.hidden) return;
    started = true;
    hasSession=true;
    expeditionUI?.begin();
    scene.playing = true;
    sceneDirty = true;
    nextSceneTime = null;
    sceneDelta = 0;
    document.body.classList.add("playing");
    element("intro").classList.add("hidden");
    element("main-menu-backdrop").classList.add("hidden");
    element("mission").classList.remove("hidden");
    element("pause").classList.remove("hidden");
    world.notice =
      "Your ship is wrecked. E records discoveries. Violet Spruce Forest lies southeast along the ice and ocean. Enter water to escape the centipede.";
    world.noticeTime = 8;
    focusGame();
    requestLook(event);
  }

  function beginOpening(){
    if(graphicsLost||document.hidden)return;
    started=false;hasSession=false;scene.playing=false;
    releaseLook();clearInput();simulationClock.reset();
    stopAdultCall();stopForestAudio();stopSandWormAudio();regionMusic.reset();regionalAmbientNoise.reset();
    menu.close();bestiary.close();expeditionUI?.close();
    document.body.classList.remove('playing');
    element('intro').classList.add('hidden');element('main-menu-backdrop').classList.add('hidden');
    setPaused(false);previousTime=null;nextSceneTime=null;
    if(openingPlayer.start())element('opening-skip').focus({preventScroll:true});
  }

  function resetGame(event) {
    if (graphicsLost || document.hidden) return;
    element("graphics-notice").classList.add("hidden");
    stopAdultCall();
    stopForestAudio();
    stopSandWormAudio();
    regionMusic.reset();
    regionalAmbientNoise.reset();
    lastCallingAdult = "";
    lastAdultCallTime = -Infinity;
    menu.close();
    bestiary.close();
    element("bestiary-toggle").setAttribute("aria-expanded", "false");
    expeditionUI?.beforeReset();
    resetWorld(world);
    expeditionUI?.fresh();
    Object.assign(look, createLookState());
    scene.resetView();
    setPaused(false);
    beginOpening();
    lastHudUpdate = -1;
    lastThreatAnnouncement = "";
    lastThreatKind = "";
    updateCatalog();
    updateEncounter();
  }

  function toggleMap() {
    mapOpen = !mapOpen;
    element("map-panel").classList.toggle("hidden", !mapOpen);
    element("map-toggle").setAttribute("aria-expanded", String(mapOpen));
    element("map-toggle").setAttribute(
      "aria-label",
      mapOpen ? "Close expedition map" : "Open expedition map",
    );
    scene.drawMap(minimap, world);
    focusGame();
  }

  function stopAdultCall() {
    adultCall?.stop();
    adultCall = null;
  }

  function stopForestAudio() {
    forestAudio?.stop();
    forestAudio = null;
  }

  function stopSandWormAudio(){sandWormAudio?.stop();sandWormAudio=null;}
  function updateSandWormAudio(){
    const eligible=started&&!paused&&soundEnabled&&sandWormAudioAvailable&&audio?.state==='running'&&world.wormRumble>.01&&!activeEncounter();
    if(!eligible){stopSandWormAudio();return;}
    try{
      if(!sandWormAudio){const session=createSandWormAudio(audio);if(session){sandWormAudio=session;session.ended.then(()=>{if(sandWormAudio===session)sandWormAudio=null;});}}
      sandWormAudio?.update(world.wormRumble);
    }catch(error){stopSandWormAudio();sandWormAudioAvailable=false;console.warn('Croba Planet: sand worm rumble could not play.',error);}
  }

  function updateForestAudio(dt) {
    const eligible = started && !paused && soundEnabled && forestAudioAvailable
      && audio?.state === "running" && world.biome === "purple-forest"
      && !world.player.swimming && !world.player.underwater && !activeEncounter();
    if (!eligible) { stopForestAudio(); return; }
    try {
      if (!forestAudio) {
        const session = createForestAudio(audio);
        if (session) {
          forestAudio = session;
          session.ended.then(() => { if (forestAudio === session) forestAudio = null; });
        }
      }
      forestAudio?.update(world, dt, { ducked: Boolean(adultCall) });
    } catch (error) {
      stopForestAudio(); forestAudioAvailable = false;
      console.warn("Croba Planet: forest audio could not play.", error);
    }
  }

  /** One call on noticing the explorer; a short cooldown avoids repeated edge chatter. */
  function updateAdultCall() {
    if (world.centipedeEncounter || world.treeStalkerEncounter) { stopAdultCall(); return; }
    const adult = world.adultSquids?.find((squid) => squid.noticedPlayer);
    if (!adult) { lastCallingAdult = ""; stopAdultCall(); return; }
    if (!started || paused || !soundEnabled || !audio || audio.state !== "running" || !adultCallAvailable) return;
    if (lastCallingAdult === adult.id) return;
    lastCallingAdult = adult.id;
    if (world.elapsed - lastAdultCallTime < 8) return;
    try {
      const call = playAdultScreech(audio);
      if (!call) { lastCallingAdult = ""; return; }
      stopAdultCall();
      adultCall = call;
      lastAdultCallTime = world.elapsed;
      call.ended.then(() => { if (adultCall === call) adultCall = null; });
    } catch (error) {
      adultCallAvailable = false;
      console.warn("Croba Planet: the adult squid call could not play.", error);
    }
  }

  /** Short generated tones are activated only after an explicit sound click. */
  function chime(frequency = 540) {
    if (!audio || !soundEnabled || audio.state !== "running") return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      frequency * 1.5,
      audio.currentTime + 0.2,
    );
    gain.gain.setValueAtTime(0.055, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.65);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.7);
  }

  async function toggleSound() {
    if (!soundAvailable) return;
    try {
      if (!audio) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error("Web Audio is unavailable.");
        audio = new AudioContext();
        ambient = audio.createGain();
        ambient.gain.value = 0;
        ambient.connect(audio.destination);
        for (const frequency of [98, 146.83, 196]) {
          const oscillator = audio.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.value = frequency;
          const gain = audio.createGain();
          gain.gain.value = 0.2;
          oscillator.connect(gain);
          gain.connect(ambient);
          oscillator.start();
        }
      }
      soundEnabled = !soundEnabled;
      if (soundEnabled) {
        regionMusic.activate(audio);
        regionalAmbientNoise.activate(audio);
        await audio.resume();
        if (soundEnabled) {
          ambient.gain.setTargetAtTime(
            paused ? 0 : 0.035,
            audio.currentTime,
            0.5,
          );
          if (!paused) chime(392);
        }
      } else {
        stopAdultCall();
        stopForestAudio();
        stopSandWormAudio();
        regionMusic.stop();
        regionalAmbientNoise.stop();
        lastCallingAdult = "";
        ambient.gain.setTargetAtTime(0, audio.currentTime, 0.3);
      }
      element("sound").setAttribute("aria-pressed", String(soundEnabled));
      element("sound").setAttribute(
        "aria-label",
        soundEnabled ? "Turn sound off" : "Turn sound on",
      );
      element("sound").innerHTML = soundEnabled
        ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Zm5 3c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
      element('opening-sound').setAttribute('aria-pressed',String(soundEnabled));
      element('opening-sound').textContent=soundEnabled?'Sound on':'Sound off';
    } catch (error) {
      regionMusic.stop();
      regionalAmbientNoise.stop();
      console.warn("Croba Planet: audio could not start.", error);
      soundAvailable = false;
      element("sound").setAttribute(
        "aria-label",
        "Sound unavailable in this browser",
      );
      world.notice =
        "Sound is unavailable in this browser. You can still explore.";
      world.noticeTime = 5;
    } finally {
      focusGame();
    }
  }

  function recordDiscovery() {
    if (!started || paused || activeEncounter()) return;
    const collected = world.collected;
    interact(world);
    if (world.collected > collected) chime(660);
    lastHudUpdate = -1;
    focusGame();
  }

  function updateHud() {
    quickSlotsPanel?.render(started&&!paused&&!activeEncounter());
    const heldHint=started&&!paused&&!activeEncounter()?equippedHint(world):'';
    element('equipped-hint').hidden=!heldHint;element('equipped-hint').textContent=heldHint;
    element('building-actions').hidden=!(started&&!paused&&!activeEncounter()&&activeQuickItem(world)==='builder-tool'&&world.inventory?.['builder-tool']);
    updateCatalog();
    const forest = world.biome === "purple-forest";
    const saltCave=world.biome==='salt-cave';
    const sulfuric=world.biome==='sulfuric-land';
    const blueOcean = !forest && !sulfuric && !saltCave && (world.biome === "blue-ocean" || world.player.x >= BLUE_OCEAN_START_X);
    const biomeName = saltCave?'SALT CAVE':sulfuric?'SULFURIC LAND':forest ? "VIOLET SPRUCE FOREST" : world.biome==='shell-field' ? 'SHELL FIELD' : blueOcean ? "BLUE OCEAN"
      : world.biome === "blue-kelp-forest" ? "BLUE KELP FOREST"
      : world.biome === "orange-grass-field" ? "ORANGE GRASS FIELD"
      : world.biome === "iceberg-tundra" ? "ICY BASIN" : world.biome === "cliff-biome" ? "CLIFF BIOME" : "ARCTIC";
    const temperature = saltCave?'+38°':sulfuric?'+24°':forest ? "+4°" : blueOcean ? "+6°" : "−32°";
    element("biome-value").textContent = biomeName;
    element("field-biome").textContent = biomeName;
    element("temperature-value").textContent = temperature;
    element("field-temperature").textContent = `${temperature}C`;
    document.body.classList.toggle("purple-forest", forest);
    document.body.classList.toggle("blue-ocean", blueOcean);
    element("ocean-depth").classList.toggle("hidden", !blueOcean);
    element("ocean-depth").textContent = ` / ${world.biome==='shell-field'?40:BLUE_OCEAN_DEPTH_METERS} m`;
    element("dive-mode").classList.toggle("hidden", !blueOcean);
    const health = Math.max(0, Math.min(100, Math.round(world.player.health ?? 100)));
    element("health-value").textContent = `${health}%`;
    element("health-fill").style.width = `${health}%`;
    element("health-fill").style.background = health < 35 ? "#ee8d83" : "#b7d1bd";
    element("health-track").setAttribute("aria-valuenow", String(health));
    const hunger=Math.ceil(world.player.hunger??100);
    element('hunger-value').textContent=hunger+'%';element('hunger-fill').style.width=hunger+'%';
    element('hunger-track').setAttribute('aria-valuenow',String(hunger));
    const adultThreat = world.threat?.kind === "adult-squid";
    const forestThreat = world.threat?.kind === "tree-stalker";
    const wormThreat=world.threat?.kind==='sand-worm';
    const danger = started && !paused && !activeEncounter() && Boolean(world.threat?.active);
    const threatMessage = world.threat?.active ? world.threat.message || "Ice centipede hunting" : "";
    element("threat").classList.toggle("hidden", !danger);
    element("threat-message").textContent = threatMessage;
    element("threat-advice").textContent = wormThreat?'Dodge sideways · stop jumping · leave mineral ground':forestThreat ? "Break its sight or reach water" : adultThreat ? "Keep your distance" : "Reach the water";
    element("threat-distance").textContent = Number.isFinite(world.threat?.distance)
      ? `· ${(world.threat.distance / 25).toFixed(1)} m away`
      : "";
    if (started && !paused && threatMessage !== lastThreatAnnouncement) {
      const advice = wormThreat?'Dodge sideways, stop jumping and leave the mineral ground.':forestThreat ? "Break its sight behind terrain or reach water."
        : adultThreat ? "Keep your distance. The adult grabs swimmers." : "Enter the water to escape.";
      const cleared = {
        "tree-stalker": "The Tree Stalker has lost you.",
        "adult-squid": "The adult squid is no longer threatening you.",
        'sand-worm':'The sand worm has lost your vibrations.',
        centipede: "The centipede has stopped hunting you.",
      };
      element("threat-announcement").textContent = activeEncounter() ? ""
        : world.threat?.active
          ? `${threatMessage}. ${advice}`
          : lastThreatAnnouncement ? cleared[lastThreatKind] || cleared.centipede : "";
      lastThreatAnnouncement = threatMessage;
      lastThreatKind = world.threat?.kind || "centipede";
    }
    const warmth = Math.round(world.player.warmth);
    element("warmth-value").textContent = `${warmth}%`;
    element("warmth-fill").style.width = `${warmth}%`;
    element("warmth-fill").style.background =
      warmth < 35 ? "#db837a" : "#e7af85";
    document
      .querySelector(".warmth-track")
      .setAttribute("aria-valuenow", String(warmth));
    element("part-count").textContent = `${world.collected} / 3`;
    element("mission-title").textContent = world.complete
      ? "A world worth exploring"
      : "Beneath the ice";
    element("mission-copy").textContent = world.complete
      ? `Field log complete. Follow the southeast coast to violet spruce, or dive into the ${BLUE_OCEAN_DEPTH_METERS} m ocean.`
      : forest ? "Explore the purple forest hills. Your three field sites remain marked on the map."
      : "Record the wreck, glacier, and seabed. Violet Spruce Forest lies southeast.";
    const oxygen = Math.round(world.player.oxygen);
    element("oxygen-value").textContent = `${oxygen}%`;
    element("oxygen-fill").style.width = `${oxygen}%`;
    element("oxygen-fill").style.background =
      oxygen < 25 ? "#e49b86" : "#9cdbdf";
    element("oxygen-track").setAttribute("aria-valuenow", String(oxygen));
    const depth = world.player.underwater
      ? Math.max(0, (WATER_LEVEL - world.player.z) / 25)
      : 0;
    element("depth-value").textContent = `${depth.toFixed(1)} m`;
    element("water-mode").textContent = world.player.falling ? "FALLING" : world.player.underwater
      ? "UNDERWATER"
      : world.player.swimming
        ? "AT THE SURFACE"
        : insideUniversalBase(world)?"INSIDE UNIVERSAL BASE"
        : world.player.basinCaveId ? "CAVE AIR POCKET"
        : forest ? "IN THE FOREST"
        : sulfuric ? "ON LAND" : "ON THE ICE";
    document.body.classList.toggle("underwater", world.player.underwater);
    element("touch-jump").textContent = world.player.swimming ? "UP" : "JUMP";
    element("touch-jump").setAttribute("aria-label", world.player.swimming ? "Hold to swim up" : "Jump on land");
    for (const part of world.items)
      document
        .querySelector(`[data-part="${part.kind}"]`)
        ?.classList.toggle("collected", part.collected);
    const prompt = started && !activeEncounter() ? currentPrompt(world) : null;
    element("interaction").classList.toggle("hidden", !prompt || paused);
    if (prompt)
      element("interaction").querySelector("span").textContent = prompt.text;
    const toast = element("toast");
    toast.classList.toggle(
      "visible",
      started && world.noticeTime > 0 && !paused && !activeEncounter(),
    );
    toast.textContent = world.notice;
    element("crosshair").classList.toggle("hidden", !started || paused || Boolean(activeEncounter()));
    element("look-hint").classList.toggle(
      "hidden",
      !started || paused || pointerLocked() || Boolean(activeEncounter()),
    );
    element("look-hint").textContent = coarsePointer
      ? "Left thumb moves · Drag the world with your right thumb to look"
      : "Click or drag the world to look · Arrow keys also turn";
    if (mapOpen) scene.drawMap(minimap, world);
  }

  expeditionUI=setupExpeditionUI({world,look,document,window,
    pause(){menu.close();bestiary.close();setPaused(true);},
    resume(){setPaused(false);sceneDirty=true;focusGame();},
    load(){openingPlayer.cancel();stopAdultCall();stopForestAudio();stopSandWormAudio();regionMusic.stop();regionalAmbientNoise.stop();scene.resetView();setPaused(false);startGame();lastHudUpdate=-1;},
    isPlaying:()=>started,isEncounter:()=>Boolean(activeEncounter()),
    changed(){sceneDirty=true;lastHudUpdate=-1;}
  });
  quickSlotsPanel=createQuickSlotsPanel({world,document,onSelect(index){if(!started||paused||activeEncounter())return;selectQuickSlot(world,index);sceneDirty=true;lastHudUpdate=-1;focusGame();}});
  function builderAction(action){
    if(!started||paused||activeEncounter()||activeQuickItem(world)!=='builder-tool')return;
    action(world);sceneDirty=true;lastHudUpdate=-1;focusGame();
  }
  element('building-rotate').addEventListener('click',()=>builderAction(rotateBuildPlan));
  element('building-remove').addEventListener('click',()=>builderAction(removeNearbyFurniture));
  function updateMainMenu(){
    const latest=expeditionUI.latest();element('main-continue').disabled=!hasSession&&!latest;
    element('main-menu-status').textContent=hasSession?'Your current expedition is paused. Continue where you left off.':latest?'Last saved: '+latest.name:'Start a new expedition or load a saved journey.';
  }
  function returnToMainMenu(){
    openingPlayer.cancel();
    expeditionUI.beforeReset();menu.close();bestiary.close();expeditionUI.close();
    started=false;scene.playing=false;setPaused(true);sceneDirty=true;nextSceneTime=null;sceneDelta=0;
    document.body.classList.remove('playing');element('intro').classList.remove('hidden');element('main-menu-backdrop').classList.remove('hidden');
    element('mission').classList.add('hidden');element('pause').classList.add('hidden');updateMainMenu();element('main-continue').focus();
  }
  element('main-continue').addEventListener('click',event=>{
    if(hasSession){setPaused(false);startGame(event);}else expeditionUI.continueLatest();
  });
  element('main-saves').addEventListener('click',()=>expeditionUI.openSaves());
  element('main-guide').addEventListener('click',openMenu);
  element('return-main-menu').addEventListener('click',returnToMainMenu);
  element("start").addEventListener("click",event=>{if(hasSession)resetGame(event);else beginOpening();});
  element('opening-skip').addEventListener('click',event=>openingPlayer.skip(event));
  element('opening-sound').addEventListener('click',toggleSound);
  updateMainMenu();
  element("help").addEventListener("click", openMenu);
  element("bestiary-toggle").addEventListener("click", (event) => bestiary.open ? closeBestiary(event) : openBestiary());
  element("close-bestiary").addEventListener("click", closeBestiary);
  element("bestiary-back").addEventListener("click", closeBestiary);
  element('bestiary-search').addEventListener('input',updateCatalog);
  element('bestiary-filter').addEventListener('change',updateCatalog);
  element('bestiary-clear').addEventListener('click',()=>{
    element('bestiary-search').value='';element('bestiary-filter').value='all';updateCatalog();
    element('bestiary-search').focus({preventScroll:true});
  });
  element("pause").addEventListener("click", openMenu);
  element("resume").addEventListener("click", closeMenu);
  element("close-menu").addEventListener("click", closeMenu);
  element("restart").addEventListener("click", resetGame);
  element("map-toggle").addEventListener("click", toggleMap);
  element("sound").addEventListener("click", toggleSound);
  element("touch-interact").addEventListener("click", recordDiscovery);
  menu.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeMenu(event);
  });
  bestiary.addEventListener("cancel", (event) => { event.preventDefault(); closeBestiary(event); });

  // A temporary GPU interruption must not advance oxygen, hunters or captures
  // behind a frozen view. Recovery leaves the expedition paused for the player.
  function updateGraphicsStatus(lost) {
    graphicsLost = lost;
    sceneDirty = true;
    for (const id of ["resume", "close-menu", "restart"]) {
      const button = /** @type {HTMLButtonElement} */ (element(id));
      button.disabled = lost;
    }
    const notice = element("graphics-notice");
    notice.textContent = lost
      ? "The view was interrupted. Your expedition is paused while it recovers. If it does not recover, reload this page to restart."
      : "The view has recovered. Close this guide when you are ready to continue.";
    notice.classList.remove("hidden");
    if (lost) {
      if(openingPlayer.active){openingPlayer.cancel();returnToMainMenu();}
      openMenu();
      notice.focus();
    }
  }
  scene.canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (!graphicsLost) updateGraphicsStatus(true);
  });
  scene.canvas.addEventListener("webglcontextrestored", () => {
    if (graphicsLost) updateGraphicsStatus(false);
  });

  const gameKeys = new Set([
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "Space",
    "KeyE",
    "KeyM",
    "KeyB",
    "KeyI",
    "KeyK",
    "KeyV", "KeyR", "KeyQ",
    "KeyF", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5",
    "KeyC",
    "ShiftLeft",
    "ShiftRight",
    "Escape",
  ]);
  window.addEventListener("keydown", (event) => {
    if(openingPlayer.active){
      if(event.code==='Escape'){event.preventDefault();if(!event.repeat)openingPlayer.skip(event);}
      else if(gameKeys.has(event.code)&&event.target!==element('opening-skip')&&event.target!==element('opening-sound'))event.preventDefault();
      return;
    }
    if (!gameKeys.has(event.code)) return;
    if (
      event.target instanceof HTMLElement &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)
    )
      return;
    // Native scrolling and button activation remain available inside either dialog.
    if (anyDialogOpen() && !["Escape", "KeyB", "KeyI", "KeyK", "KeyV"].includes(event.code)) return;
    if (
      event.code === "Space" &&
      event.target instanceof HTMLButtonElement &&
      (!started || anyDialogOpen())
    )
      return;
    event.preventDefault();
    if (event.code === "Escape") {
      if (!event.repeat) {
        // Some browsers deliver both an unlock event and the Escape that caused it.
        if (menu.open && !bestiary.open && Date.now() - lastPointerUnlock < 250) return;
        if (expeditionUI?.hasDialog()) expeditionUI.close();
        else if (bestiary.open) closeBestiary(event);
        else if (menu.open) closeMenu(event);
        else if (started) openMenu();
      }
      return;
    }
    if(event.code==='KeyI'){
      if(!event.repeat){if(expeditionUI.hasDialog())expeditionUI.close();else expeditionUI.openBag();}
      return;
    }
    if(event.code==='KeyK'){
      if(!event.repeat){if(expeditionUI.hasDialog())expeditionUI.close();else expeditionUI.openCrafting();}
      return;
    }
    if(event.code==='KeyV'){
      if(!event.repeat){if(expeditionUI.hasDialog())expeditionUI.close();else expeditionUI.openBuilding();}
      return;
    }
    if (event.code === "KeyB") {
      if (!event.repeat) {
        if (bestiary.open) closeBestiary(event);
        else openBestiary();
      }
      return;
    }
    if (anyDialogOpen()) return;
    if (activeEncounter()) {
      if (event.code === "KeyM" && !event.repeat) toggleMap();
      return;
    }
    if(event.code==='KeyR'||event.code==='KeyQ'){
      if(!event.repeat)builderAction(event.code==='KeyR'?rotateBuildPlan:removeNearbyFurniture);
      return;
    }
    if(/^Digit[1-5]$/.test(event.code)){if(!event.repeat){selectQuickSlot(world,Number(event.code.slice(-1))-1);sceneDirty=true;lastHudUpdate=-1;}return;}
    keys.add(event.code);
    if (event.repeat) return;
    if (event.code === "KeyM") toggleMap();
    if (event.code === "KeyE") recordDiscovery();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  window.addEventListener("blur", clearInput);
  window.addEventListener("pointerdown", notePointer, { capture: true });
  for (const name of ["pointerup", "pointercancel"])
    window.addEventListener(name, (event) => {
      if(event.pointerId===toyPointerId){mouseToyHeld=false;toyPointerId=null;}
      const action = touch.pointers.get(event.pointerId)?.action;
      if (!action) return;
      releasePointer(action, event.pointerId);
      for (const [button, heldAction] of heldActions)
        button.classList.toggle("pressed", touch.active(heldAction));
      if (!touch.active("stick")) element("movement-knob").style.transform = "translate(0px, 0px)";
    }, { capture: true });
  document.addEventListener("pointerlockchange", () => {
    const locked = pointerLocked();
    const previouslyLocked = wasPointerLocked;
    wasPointerLocked = locked;
    if (locked) {
      for (const [id, pointer] of touch.pointers)
        if (pointer.action === "look") releasePointer("look", id);
      // A browser may finish a pending capture after a modal has already opened.
      if (paused || !started || activeEncounter()) releaseLook();
    } else if (previouslyLocked && started && !paused && !activeEncounter()) {
      lastPointerUnlock = Date.now();
      openMenu();
    }
    lastHudUpdate = -1;
  });
  document.addEventListener("mousemove", (event) => {
    if (pointerLocked() && started && !paused && !activeEncounter())
      rotateLook(look, event.movementX, event.movementY);
  });
  scene.canvas.addEventListener("click", (event) => {
    if(started&&!paused&&!activeEncounter()&&nearbyCopperCargo(world)&&scene.copperCargo){
      const r=scene.canvas.getBoundingClientRect(),ndc=pointerLocked()?{x:0,y:0}:{x:((event.clientX??(r.left+r.width/2))-r.left)/r.width*2-1,y:-((event.clientY??(r.top+r.height/2))-r.top)/r.height*2+1};
      if(scene.copperCargo.hitTest(scene.camera,ndc)){interactCopperCargo(world);sceneDirty=true;lastHudUpdate=-1;focusGame();return;}
    }
    focusGame();
    requestLook(event);
  });
  scene.canvas.addEventListener("pointerdown", (event) => {
    if(started&&!paused&&!activeEncounter()&&event.button===0&&event.pointerType!=='touch'&&activeQuickItem(world)==='copper-yoyo'){mouseToyHeld=true;toyPointerId=event.pointerId;}
    if (!started || paused || pointerLocked() || event.button > 0) return;
    if (claimPointer("look", event)) lookIsTouch = event.pointerType === "touch";
  });
  scene.canvas.addEventListener("pointermove", (event) => {
    if (paused || activeEncounter() || pointerLocked() || touch.pointers.get(event.pointerId)?.action !== "look") return;
    const delta = touch.move(event.pointerId, event.clientX, event.clientY);
    if (delta) rotateLook(look, delta.x, delta.y, lookIsTouch ? 0.004 : 0.003);
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    scene.canvas.addEventListener(name, (event) => {if(event.pointerId===toyPointerId){mouseToyHeld=false;toyPointerId=null;}releasePointer("look", event.pointerId);});
  for (const area of [scene.canvas, element("touch-controls")])
    area.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("visibilitychange", () => {
    // Browsers may stop RAF while hidden. Never spend GPU time or replay that
    // missing interval; returning leaves the guide open for explicit resume.
    previousTime = null;
    nextSceneTime = null;
    sceneDelta = 0;
    if(openingPlayer.active){setPaused(Boolean(document.hidden));return;}
    if (document.hidden) {
      simulationClock.reset();
      if (!anyDialogOpen()) openMenu();
      else setPaused(true);
    } else sceneDirty = true;
  });
  const resizeScene = () => { scene.resize(); sceneDirty = true; };
  window.addEventListener("resize", resizeScene);
  window.visualViewport?.addEventListener("resize", resizeScene);
  const orientationChanged = () => { clearInput(); resizeScene(); };
  window.addEventListener("orientationchange", orientationChanged);
  window.screen?.orientation?.addEventListener?.("change", orientationChanged);

  function bindHeldButton(button, action) {
    heldActions.set(button, action);
    button.addEventListener("pointerdown", (event) => {
      if (claimPointer(action, event)) button.classList.add("pressed");
    });
    const release = (event) => {
      releasePointer(action, event.pointerId);
      button.classList.toggle("pressed", touch.active(action));
    };
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(name, release);
  }
  for (const button of directionButtons) {
    bindHeldButton(button, button.dataset.dir);
    button.addEventListener("keydown", (event) => {
      if (!started || paused || activeEncounter() || !["Space", "Enter"].includes(event.code)) return;
      event.preventDefault(); event.stopPropagation?.();
      touchKeys.add(button.dataset.dir);
    });
    button.addEventListener("keyup", (event) => {
      if (!["Space", "Enter"].includes(event.code)) return;
      event.preventDefault(); event.stopPropagation?.();
      touchKeys.delete(button.dataset.dir);
    });
    button.addEventListener("blur", () => touchKeys.delete(button.dataset.dir));
  }
  bindHeldButton(element("touch-jump"), "ascend");
  bindHeldButton(element("touch-dive"), "dive");
  bindHeldButton(element("touch-use"), "use");
  const stick = element("movement-stick");
  bindHeldButton(stick, "stick");
  stick.addEventListener("pointermove", (event) => {
    if (touch.pointers.get(event.pointerId)?.action !== "stick") return;
    touch.move(event.pointerId, event.clientX, event.clientY);
    const { strafe, forward } = touch.movement();
    element("movement-knob").style.transform = `translate(${strafe * 16}px, ${-forward * 16}px)`;
  });
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    stick.addEventListener(name, () => {
      if (!touch.active("stick")) element("movement-knob").style.transform = "translate(0px, 0px)";
    });

  function frame(milliseconds) {
    if (document.hidden) {
      previousTime = null;
      nextSceneTime = null;
      sceneDelta = 0;
      requestAnimationFrame(frame);
      return;
    }
    const time = milliseconds / 1000;
    const dt = previousTime === null ? 0 : Math.max(0, Math.min(time - previousTime, 0.05));
    previousTime = time;
    if(openingPlayer.active){
      openingPlayer.advance(dt,{paused:paused||graphicsLost});
      regionMusic.update(world,dt,{started:true,paused,soundEnabled,contextRunning:audio?.state==='running',cinematic:true});
      regionalAmbientNoise.update(world,dt,{started:true,paused,soundEnabled,contextRunning:audio?.state==='running',cinematic:true});
      if(!graphicsLost&&(nextSceneTime===null||time>=nextSceneTime)){
        openingPlayer.draw(scene.renderer,{aspect:scene.camera.aspect,reducedMotion});nextSceneTime=time+1/30;
      }
      requestAnimationFrame(frame);return;
    }
    updateEncounter();
    if (started && !paused && !activeEncounter()) {
      const turn =
        Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft"));
      const tilt = Number(keys.has("ArrowUp")) - Number(keys.has("ArrowDown"));
      rotateLook(look, turn * TURN_SPEED * dt, -tilt * dt, 1);
    }
    const analog = touch.movement();
    const strafe = analog.strafe +
      (keys.has("KeyD") || touchKeys.has("right") ? 1 : 0) -
      (keys.has("KeyA") || touchKeys.has("left") ? 1 : 0);
    const forward = analog.forward +
      (keys.has("KeyW") || touchKeys.has("up") ? 1 : 0) -
      (keys.has("KeyS") || touchKeys.has("down") ? 1 : 0);
    const { x, y } = movementFromView(strafe, forward, look.yaw);
    if (started && !paused) {
      const captured = Boolean(activeEncounter());
      const ascend = !captured && (keys.has("Space") || touch.active("ascend"));
      const dive = !captured && (
        keys.has("KeyC") ||
        keys.has("ShiftLeft") ||
        keys.has("ShiftRight") ||
        touch.active("dive"));
      useQuickItem(world,!captured&&(keys.has("KeyF")||mouseToyHeld||touch.active("use")),look);
      simulationClock.advance(dt,step=>updateWorld(
        world,
        {
          x: captured ? 0 : x,
          y: captured ? 0 : y,
          jump: ascend,
          ascend,
          dive,
          swimVertical: captured ? 0 : forward * Math.sin(look.pitch),
        },
        step,
        { reducedMotion, look },
      ));
    }else simulationClock.reset();
    updateEncounter();
    updateAdultCall();
    updateForestAudio(dt);
    updateSandWormAudio();
    regionMusic.update(world,dt,{started,paused,soundEnabled,contextRunning:audio?.state==='running',ducked:Boolean(adultCall)||Boolean(activeEncounter())});
    regionalAmbientNoise.update(world,dt,{started,paused,soundEnabled,contextRunning:audio?.state==='running',ducked:Boolean(adultCall)||Boolean(activeEncounter())});
    scene.setLook(look.yaw, look.pitch);
    // Simulation, input and audio retain their own RAF time. Accumulate skipped
    // render deltas so water, foliage and capture cameras still run at real speed.
    // The static main menu draws the scene once; expeditions stay at 30 FPS.
    if (started && !paused && !graphicsLost) sceneDelta += dt;
    const sceneDue = nextSceneTime === null || time + 1e-7 >= nextSceneTime;
    if (!graphicsLost && (paused || !started ? sceneDirty : sceneDue)) {
      try { scene.draw(
        world,
        time,
        paused ? 0 : sceneDelta,
        started && !paused && !activeEncounter() && Boolean(x || y),
      ); } catch (error) {
        if (loadingComplete) throw error;
        console.error("Croba Planet failed to render its first frame:", error);
        showStartupError(document,error);
        return;
      }
      sceneDirty = false;
      if (!loadingComplete) { finishLoading(document); loadingComplete = true; }
      sceneDelta = 0;
      nextSceneTime = time + 1 / (started ? 30 : 15);
    }
    if(started&&!paused)expeditionUI.tick();
    if (time - lastHudUpdate > 0.1) {
      updateHud();
      lastHudUpdate = time;
    }
    requestAnimationFrame(frame);
  }
  updateHud();
  requestAnimationFrame(frame);
  // A cached page can return and leave again; retain cleanup across those visits.
  window.addEventListener(
    "pagehide",
    (event) => {
      if (event.persisted) {
        previousTime = null;
        nextSceneTime = null;
        sceneDelta = 0;
        if (started) openMenu();
        return;
      }
      stopAdultCall();
      stopForestAudio();
      stopSandWormAudio();
      regionMusic.dispose();
      regionalAmbientNoise.dispose();
      openingPlayer.dispose();
      audio?.close().catch(() => {});
      scene.dispose();
    },
  );
} catch (error) {
  console.error("Croba Planet failed to initialize:", error);
  showStartupError(document,error);
}
