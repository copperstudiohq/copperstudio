export const ADULT_SCREECH_DURATION = 1.25;
const MAX_VOLUME = 0.18;

/** Play one band-limited, raspy alien screech through an existing AudioContext.
 * No context is created or resumed here; suspended/closed contexts stay silent.
 * @param {AudioContext} audio @param {{volume?:number}} [options]
 * @returns {{stop:()=>void,ended:Promise<void>}|null}
 */
export function playAdultScreech(audio, { volume = 0.12 } = {}) {
  if (!audio || audio.state !== "running" || !Number.isFinite(audio.currentTime)) return null;
  const peak = Math.max(0, Math.min(MAX_VOLUME, Number.isFinite(volume) ? volume : 0.12));
  if (!peak) return null;
  const nodes = [], sources = [];
  let master = null, stopping = false, finished = false, remaining = 0;
  let resolveEnded;
  const ended = new Promise((resolve) => { resolveEnded = resolve; });
  const keep = (node) => { nodes.push(node); return node; };
  const source = (node) => { keep(node); sources.push(node); return node; };
  const stopSources = (time) => {
    for (const node of sources) {
      try { node.stop(time); } catch { /* A partially created or ended source still needs disconnecting. */ }
    }
  };
  function cleanup() {
    if (finished) return;
    finished = true;
    audio.removeEventListener?.("statechange", onStateChange);
    for (const node of sources) {
      node.onended = null;
      if ("buffer" in node) {
        try { node.buffer = null; } catch { /* Disconnection still releases a browser-owned buffer. */ }
      }
    }
    for (const node of nodes) {
      try { node.disconnect(); } catch { /* Continue releasing every other node. */ }
    }
    nodes.length = sources.length = 0;
    master = null;
    resolveEnded();
  }
  function stop() {
    if (finished) return;
    const now = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
    if (audio.state !== "running") {
      stopSources(now); cleanup(); return;
    }
    if (stopping) return;
    stopping = true;
    const gain = master.gain;
    if (typeof gain.cancelAndHoldAtTime === "function") gain.cancelAndHoldAtTime(now);
    else {
      const level = Math.max(0, Math.min(peak, gain.value));
      gain.cancelScheduledValues(now); gain.setValueAtTime(level, now);
    }
    gain.linearRampToValueAtTime(0, now + 0.035);
    stopSources(now + 0.04);
  }
  function onStateChange() {
    if (audio.state !== "running") stop();
  }
  try {
    const now = audio.currentTime, end = now + ADULT_SCREECH_DURATION;
    master = keep(audio.createGain());
    const lowpass = keep(audio.createBiquadFilter());
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(1800, now);
    lowpass.Q.setValueAtTime(0.55, now);
    master.connect(lowpass); lowpass.connect(audio.destination);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(peak, now + 0.045);
    master.gain.linearRampToValueAtTime(peak * 0.75, now + 0.32);
    master.gain.linearRampToValueAtTime(peak * 0.58, now + 0.86);
    master.gain.exponentialRampToValueAtTime(Math.min(0.0001, peak * 0.01), end - 0.03);
    master.gain.linearRampToValueAtTime(0, end);

    const growl = source(audio.createOscillator()), growlGain = keep(audio.createGain());
    growl.type = "sawtooth"; growlGain.gain.setValueAtTime(0.55, now);
    growl.frequency.setValueAtTime(320, now);
    growl.frequency.linearRampToValueAtTime(980, now + 0.28);
    growl.frequency.exponentialRampToValueAtTime(560, now + 0.7);
    growl.frequency.exponentialRampToValueAtTime(180, end - 0.07);
    growl.connect(growlGain); growlGain.connect(master);

    const rasp = source(audio.createOscillator()), raspGain = keep(audio.createGain());
    rasp.type = "square"; raspGain.gain.setValueAtTime(0.13, now);
    rasp.frequency.setValueAtTime(610, now);
    rasp.frequency.linearRampToValueAtTime(1320, now + 0.25);
    rasp.frequency.exponentialRampToValueAtTime(390, now + 0.74);
    rasp.frequency.exponentialRampToValueAtTime(130, end - 0.1);
    rasp.connect(raspGain); raspGain.connect(master);

    const vibrato = source(audio.createOscillator()), vibratoDepth = keep(audio.createGain());
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(18, now);
    vibrato.frequency.linearRampToValueAtTime(30, now + 0.5);
    vibrato.frequency.linearRampToValueAtTime(13, end - 0.08);
    vibratoDepth.gain.setValueAtTime(24, now);
    vibratoDepth.gain.linearRampToValueAtTime(42, now + 0.4);
    vibratoDepth.gain.linearRampToValueAtTime(16, end - 0.1);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(growl.frequency); vibratoDepth.connect(rasp.frequency);

    if (!Number.isFinite(audio.sampleRate) || audio.sampleRate <= 0)
      throw new TypeError("The screech needs an AudioContext with a valid sample rate.");
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * ADULT_SCREECH_DURATION), audio.sampleRate);
    const samples = buffer.getChannelData(0);
    let random = 0xc70ba;
    for (let index = 0; index < samples.length; index++) {
      random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
      samples[index] = (random / 4294967296 * 2 - 1) * 0.65;
    }
    const noise = source(audio.createBufferSource()), noiseFilter = keep(audio.createBiquadFilter());
    const noiseGain = keep(audio.createGain());
    noise.buffer = buffer;
    noiseFilter.type = "bandpass"; noiseFilter.Q.setValueAtTime(0.8, now);
    noiseFilter.frequency.setValueAtTime(950, now);
    noiseFilter.frequency.linearRampToValueAtTime(1500, now + 0.35);
    noiseFilter.frequency.linearRampToValueAtTime(650, end - 0.1);
    noiseGain.gain.setValueAtTime(0.22, now);
    noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(master);

    remaining = sources.length;
    for (const node of sources) {
      node.onended = () => { if (!finished && --remaining === 0) cleanup(); };
      node.start(now); node.stop(end);
    }
    audio.addEventListener?.("statechange", onStateChange);
    return { stop, ended };
  } catch (error) {
    stopSources(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    cleanup();
    throw error;
  }
}
