import { WATER_LEVEL } from "./terrain.js";

const sessions = new WeakMap();
const buffers = new WeakMap();
const STEP_DISTANCE = 22;
const STEP_INTERVAL = 0.38;
const STEP_DURATION = 0.16;
const finitePoint = (point) => point && [point.x, point.y, point.z].every(Number.isFinite);

function noiseBuffers(audio) {
  let stored = buffers.get(audio);
  if (stored) return stored;
  const make = (channels, seconds, seed) => {
    const buffer = audio.createBuffer(channels, Math.ceil(audio.sampleRate * seconds), audio.sampleRate);
    for (let channel = 0; channel < channels; channel++) {
      const samples = buffer.getChannelData(channel);
      let state = (seed + channel * 7919) >>> 0;
      for (let index = 0; index < samples.length; index++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        samples[index] = state / 2147483648 - 1;
      }
    }
    return buffer;
  };
  stored = { wind: make(2, 2, 0xc0a57), step: make(1, STEP_DURATION, 0x5f01) };
  buffers.set(audio, stored);
  return stored;
}

/** A quiet coastal rustle with distance-driven steps. This never creates or resumes
 * an AudioContext. One context owns at most one forest session and one step voice.
 * @param {AudioContext} audio
 * @param {{volume?:number}} [options]
 * @returns {{update:(world:import('./world.js').World,dt:number,options?:{ducked?:boolean})=>void,stop:()=>void,ended:Promise<void>}|null}
 */
export function createForestAudio(audio, { volume = 0.035 } = {}) {
  if (!audio || audio.state !== "running" || !Number.isFinite(audio.currentTime)) return null;
  if (!Number.isFinite(audio.sampleRate) || audio.sampleRate <= 0)
    throw new TypeError("Forest audio needs a context with a valid sample rate.");
  const peak = Math.max(0, Math.min(0.05, Number.isFinite(volume) ? volume : 0.035));
  if (!peak) return null;
  sessions.get(audio)?.();
  const nodes = new Set(), sources = new Set();
  let finished = false, stopping = false, master, previous = null, travel = 0;
  let activeStep = null, lastStep = -Infinity, wasDucked = false, resolveEnded;
  const ended = new Promise((resolve) => { resolveEnded = resolve; });
  const keep = (node, source = false) => { nodes.add(node); if (source) sources.add(node); return node; };
  const disconnect = (node) => {
    nodes.delete(node); sources.delete(node); node.onended = null;
    try { node.disconnect(); } catch { /* Continue releasing the remaining graph. */ }
    if ("buffer" in node) { try { node.buffer = null; } catch {} }
  };
  function cleanup() {
    if (finished) return;
    finished = true;
    audio.removeEventListener?.("statechange", onStateChange);
    for (const source of sources) {
      source.onended = null;
      try { source.stop(audio.currentTime); } catch { /* A source may already have ended. */ }
    }
    for (const node of [...nodes]) disconnect(node);
    if (sessions.get(audio) === cleanup) sessions.delete(audio);
    activeStep = previous = null; travel = 0; resolveEnded();
  }
  function stop() {
    if (finished || stopping) return;
    stopping = true;
    if (audio.state !== "running") { cleanup(); return; }
    const now = audio.currentTime;
    const gain = master.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { gain.cancelScheduledValues(now); gain.setValueAtTime(Math.max(0, Math.min(peak, gain.value)), now); }
    gain.linearRampToValueAtTime(0, now + 0.035);
    for (const source of sources) {
      try { source.stop(now + 0.04); } catch { /* Natural completion still releases its nodes. */ }
    }
  }
  function onStateChange() { if (audio.state !== "running") cleanup(); }

  try {
    const noise = noiseBuffers(audio), now = audio.currentTime;
    master = keep(audio.createGain()); master.connect(audio.destination);
    master.gain.setValueAtTime(0, now); master.gain.linearRampToValueAtTime(peak, now + 0.3);
    const wind = keep(audio.createBufferSource(), true), filter = keep(audio.createBiquadFilter());
    const windGain = keep(audio.createGain());
    wind.buffer = noise.wind; wind.loop = true;
    filter.type = "bandpass"; filter.frequency.setValueAtTime(800, now); filter.Q.setValueAtTime(0.6, now);
    windGain.gain.setValueAtTime(0.35, now);
    wind.connect(filter); filter.connect(windGain); windGain.connect(master);
    const sway = keep(audio.createOscillator(), true), depth = keep(audio.createGain());
    sway.type = "sine"; sway.frequency.setValueAtTime(0.17, now);
    depth.gain.setValueAtTime(260, now); sway.connect(depth); depth.connect(filter.frequency);
    wind.onended = cleanup; wind.start(now); sway.start(now);
    audio.addEventListener?.("statechange", onStateChange); sessions.set(audio, cleanup);

    function footstep(time) {
      if (activeStep) return;
      const source = keep(audio.createBufferSource(), true), tone = keep(audio.createBiquadFilter());
      const gain = keep(audio.createGain()); activeStep = source;
      source.buffer = noise.step; tone.type = "lowpass";
      tone.frequency.setValueAtTime(900, time); tone.Q.setValueAtTime(0.5, time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.linearRampToValueAtTime(0.8, time + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + STEP_DURATION);
      source.connect(tone); tone.connect(gain); gain.connect(master);
      source.onended = () => {
        if (activeStep === source) activeStep = null;
        for (const node of [source, tone, gain]) disconnect(node);
      };
      source.start(time); source.stop(time + STEP_DURATION);
    }

    return {
      ended, stop,
      update(world, dt, { ducked = false } = {}) {
        if (finished || stopping) return;
        if (audio.state !== "running") { cleanup(); return; }
        if (ducked !== wasDucked) {
          if (master.gain.cancelAndHoldAtTime) master.gain.cancelAndHoldAtTime(audio.currentTime);
          else master.gain.cancelScheduledValues(audio.currentTime);
          master.gain.setTargetAtTime(peak * (ducked ? 0.2 : 1), audio.currentTime, 0.08);
          wasDucked = ducked;
        }
        const player = world?.player;
        if (!finitePoint(player)) { previous = null; travel = 0; return; }
        const before = previous; previous = { x: player.x, y: player.y, z: player.z };
        const dry = world.biome === "purple-forest" && !player.swimming && !player.underwater
          && player.z >= WATER_LEVEL && !player.jumping && !player.falling
          && !world.centipedeEncounter && !world.squidEncounter && !world.treeStalkerEncounter;
        if (!dry || ducked || !before || !Number.isFinite(dt) || dt <= 0 || dt > 0.2) { travel = 0; return; }
        const distance = Math.hypot(player.x - before.x, player.y - before.y);
        // Teleports and recovery corrections are not footsteps.
        if (distance > dt * 250 + 1) { travel = 0; return; }
        travel = Math.min(STEP_DISTANCE * 1.5, travel + distance);
        if (distance > 0 && travel >= STEP_DISTANCE && audio.currentTime - lastStep >= STEP_INTERVAL) {
          footstep(audio.currentTime); lastStep = audio.currentTime; travel = 0;
        }
      },
    };
  } catch (error) { cleanup(); throw error; }
}
