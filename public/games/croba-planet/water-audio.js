import {WATER_LEVEL} from './terrain.js';
import {highestIceAt, getIceSurfaceHeight} from './ice-surface.js';
import {getForestHeight} from './forest-terrain.js';
import {getSulfuricGround} from './sulfuric-biome.js';

const sessions = new WeakMap(), buffers = new WeakMap();
const finitePoint = point => Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z));
const modeOf = player => player.underwater ? 2 : player.swimming ? 1 : 0;
const PROBES = [[100, 0], [-100, 0], [0, 100], [0, -100]];

function noiseBuffer(audio) {
  let buffer = buffers.get(audio);
  if (buffer) return buffer;
  buffer = audio.createBuffer(2, Math.ceil(audio.sampleRate * 2.5), audio.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const samples = buffer.getChannelData(channel);
    let seed = 0x57a7e2 + channel * 7919;
    for (let index = 0; index < samples.length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      samples[index] = (seed / 2147483648 - 1) * .7;
    }
  }
  buffers.set(audio, buffer);
  return buffer;
}

function landAt(world, x, y) {
  const ice = highestIceAt(world.platforms ?? [], x, y);
  return Boolean(ice && getIceSurfaceHeight(ice, x, y) >= WATER_LEVEL)
    || (getForestHeight(world, x, y) ?? -Infinity) >= WATER_LEVEL
    || (getSulfuricGround(x, y) ?? -Infinity) >= WATER_LEVEL;
}

/** Quiet shore wash is limited to low land within four metres of real water. */
function onShore(world, player) {
  if (player.z < WATER_LEVEL - 2 || player.z > WATER_LEVEL + 60 || !landAt(world, player.x, player.y)) return false;
  for (const [dx, dy] of PROBES) if (!landAt(world, player.x + dx, player.y + dy)) return true;
  return false;
}

/**
 * Bounded water ambience on the game's existing, explicitly enabled context.
 * One cached stereo noise buffer supplies wash, muffled flow and all short
 * splashes/bubbles. No decoded recordings, new contexts, timers or pose clocks.
 * @param {AudioContext} audio
 * @param {{volume?:number}} [options]
 * @returns {{update:(world:import('./world.js').World,dt:number,state?:{ducked?:boolean})=>void,stop:()=>void,ended:Promise<void>}|null}
 */
export function createWaterAudio(audio, {volume = .12} = {}) {
  if (!audio || audio.state !== 'running' || !Number.isFinite(audio.currentTime)) return null;
  if (!Number.isFinite(audio.sampleRate) || audio.sampleRate <= 0) throw new TypeError('Water audio needs a context with a valid sample rate.');
  if (!Number.isFinite(volume) || volume < 0) throw new RangeError('Water audio volume must be finite and nonnegative.');
  const peak = Math.min(.18, volume);
  if (!peak) return null;
  sessions.get(audio)?.();
  const nodes = new Set(), sources = new Set(), bubbles = new Set();
  let finished = false, master, surfaceGate, underwaterGate, splash = null;
  let surfaceLevel = 0, underwaterLevel = 0, wasDucked = false;
  let hasPrevious = false, px = 0, py = 0, pz = 0, previousTime = 0;
  let stableMode = 0, pendingMode = 0, stableFor = 0, lastSplash = 0, nextBubble = Infinity;
  let nextShoreCheck = 0, shore = false, seed = 0x5ea73, resolveEnded;
  const ended = new Promise(resolve => { resolveEnded = resolve; });
  const keep = (node, source = false) => { nodes.add(node); if (source) sources.add(node); return node; };
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  function disconnect(node) {
    nodes.delete(node); sources.delete(node); node.onended = null;
    try { node.disconnect(); } catch { /* Continue releasing owned nodes. */ }
    if ('buffer' in node) { try { node.buffer = null; } catch {} }
  }
  function finishVoice(voice, immediate = false) {
    if (!voice || !nodes.has(voice.source)) return;
    voice.source.onended = null;
    if (immediate) { try { voice.source.stop(audio.currentTime); } catch {} }
    for (const node of voice.nodes) disconnect(node);
    if (splash === voice) splash = null;
    bubbles.delete(voice);
  }
  function stop() {
    if (finished) return;
    finished = true;
    audio.removeEventListener?.('statechange', onStateChange);
    if (master) {
      master.gain.cancelScheduledValues(audio.currentTime);
      master.gain.setValueAtTime(0, audio.currentTime);
    }
    for (const source of sources) {
      source.onended = null;
      try { source.stop(audio.currentTime); } catch { /* It may have naturally completed. */ }
    }
    for (const node of [...nodes]) disconnect(node);
    bubbles.clear(); splash = null; hasPrevious = false;
    if (sessions.get(audio) === stop) sessions.delete(audio);
    resolveEnded();
  }
  function onStateChange() { if (audio.state !== 'running') stop(); }
  function target(gain, value) {
    gain.gain.cancelScheduledValues(audio.currentTime);
    gain.gain.setTargetAtTime(value, audio.currentTime, .12);
  }
  function levels(surface, underwater) {
    if (surface !== surfaceLevel) { target(surfaceGate, surface); surfaceLevel = surface; }
    if (underwater !== underwaterLevel) { target(underwaterGate, underwater); underwaterLevel = underwater; }
  }
  function baseline(player, mode, now) {
    hasPrevious = true; px = player.x; py = player.y; pz = player.z; previousTime = now;
    stableMode = pendingMode = mode; stableFor = 0; lastSplash = now;
    nextBubble = mode === 2 ? now + 1.2 : Infinity;
  }
  function voice(noise, duration, startFrequency, endFrequency, resonance, strength, output) {
    const source = keep(audio.createBufferSource(), true), filter = keep(audio.createBiquadFilter()), gain = keep(audio.createGain());
    const result = {source, nodes: [source, filter, gain]};
    source.buffer = noise;
    filter.type = resonance > 1 ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(startFrequency, audio.currentTime);
    filter.frequency.exponentialRampToValueAtTime(endFrequency, audio.currentTime + duration);
    filter.Q.setValueAtTime(resonance, audio.currentTime);
    gain.gain.setValueAtTime(.0001, audio.currentTime);
    gain.gain.linearRampToValueAtTime(strength, audio.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, audio.currentTime + duration);
    source.connect(filter); filter.connect(gain); gain.connect(output);
    source.onended = () => finishVoice(result);
    source.start(audio.currentTime, random() * .8, duration);
    source.stop(audio.currentTime + duration + .01);
    return result;
  }

  try {
    const noise = noiseBuffer(audio), now = audio.currentTime;
    master = keep(audio.createGain()); master.connect(audio.destination);
    master.gain.setValueAtTime(0, now); master.gain.linearRampToValueAtTime(peak, now + .25);
    const water = keep(audio.createBufferSource(), true), surfaceFilter = keep(audio.createBiquadFilter());
    const flowFilter = keep(audio.createBiquadFilter()), swell = keep(audio.createGain());
    surfaceGate = keep(audio.createGain()); underwaterGate = keep(audio.createGain());
    surfaceGate.gain.setValueAtTime(0, now); underwaterGate.gain.setValueAtTime(0, now);
    water.buffer = noise; water.loop = true;
    surfaceFilter.type = 'bandpass'; surfaceFilter.frequency.setValueAtTime(720, now); surfaceFilter.Q.setValueAtTime(.45, now);
    flowFilter.type = 'lowpass'; flowFilter.frequency.setValueAtTime(340, now); flowFilter.Q.setValueAtTime(.55, now);
    swell.gain.setValueAtTime(.65, now);
    const tide = keep(audio.createOscillator(), true), depth = keep(audio.createGain());
    tide.type = 'sine'; tide.frequency.setValueAtTime(.13, now); depth.gain.setValueAtTime(.2, now);
    tide.connect(depth); depth.connect(swell.gain);
    water.connect(surfaceFilter); surfaceFilter.connect(swell); swell.connect(surfaceGate); surfaceGate.connect(master);
    water.connect(flowFilter); flowFilter.connect(underwaterGate); underwaterGate.connect(master);
    water.onended = stop; water.start(now); tide.start(now);
    audio.addEventListener?.('statechange', onStateChange); sessions.set(audio, stop);

    return {
      ended, stop,
      update(world, dt, {ducked = false} = {}) {
        if (finished) return;
        if (audio.state !== 'running') { stop(); return; }
        try {
          const player = world?.player, time = audio.currentTime;
          if (!finitePoint(player)) { levels(0, 0); hasPrevious = false; return; }
          const mode = modeOf(player);
          const distance = hasPrevious ? Math.hypot(player.x - px, player.y - py) : 0;
          if (ducked !== wasDucked) { target(master, peak * (ducked ? .25 : 1)); wasDucked = ducked; }
          if (mode === 0) {
            if (player.z < WATER_LEVEL - 2 || player.z > WATER_LEVEL + 60) shore = false;
            else if (time >= nextShoreCheck || !hasPrevious || distance > 150) { shore = onShore(world, player); nextShoreCheck = time + .5; }
          }
          levels(mode === 1 ? .5 : mode === 0 && shore ? .14 : 0, mode === 2 ? .65 : 0);
          if (mode !== 2) {
            for (const bubble of bubbles) finishVoice(bubble, true);
            nextBubble = Infinity;
          }
          const validTime = Number.isFinite(dt) && dt > 0 && dt <= .25;
          const reset = !hasPrevious || !validTime || time - previousTime > .3
            || distance > dt * 450 + 12 || Math.abs(player.z - pz) > dt * 3500 + 40;
          if (reset) { baseline(player, mode, time); return; }
          px = player.x; py = player.y; pz = player.z; previousTime = time;
          if (mode !== stableMode) {
            if (pendingMode !== mode) { pendingMode = mode; stableFor = 0; }
            stableFor += dt;
            if (stableFor >= .08) {
              const before = stableMode; stableMode = mode; stableFor = 0;
              if (!ducked && !splash && time - lastSplash >= 1) {
                const entering = mode > before, dryEdge = before === 0 || mode === 0;
                splash = voice(noise, entering ? .65 : .45, entering ? 2600 : 650,
                  entering ? 420 : 2900, .65, dryEdge ? entering ? .95 : .7 : .48, master);
                lastSplash = time;
              }
              if (mode === 2) nextBubble = time + .8;
            }
          } else { pendingMode = mode; stableFor = 0; }
          if (mode === 2) {
            if (!Number.isFinite(nextBubble)) nextBubble = time + 1.2;
            if (ducked) nextBubble = time + 1;
            if (!ducked && time >= nextBubble && bubbles.size < 2 && time - lastSplash > .75) {
              const frequency = 550 + random() * 650;
              bubbles.add(voice(noise, .10 + random() * .12, frequency, frequency * 1.8, 7,
                .22 + random() * .12, underwaterGate));
              nextBubble = time + (distance > dt * 25 ? .55 + random() * .65 : 1.5 + random() * 1.8);
            }
          }
        } catch (error) { stop(); throw error; }
      },
    };
  } catch (error) { stop(); throw error; }
}
