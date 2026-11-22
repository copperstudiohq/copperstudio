import { playAdultScreech } from './squid-audio.js';

export const SQUID_CHASE_SOUND_URL = new URL('./assets/audio/squid-chase.wav', import.meta.url).href;
const DEFAULT_VOLUME = .45, MAX_VOLUME = .6;
const cache = new WeakMap();

function sampleFor(audio) {
  let entry = cache.get(audio);
  if (!entry) {
    entry = { reported: false, promise: null };
    entry.promise = (async () => {
      const response = await fetch(SQUID_CHASE_SOUND_URL);
      if (!response.ok) throw new Error(`Squid chase sound failed to load (HTTP ${response.status}).`);
      const bytes = await response.arrayBuffer();
      if (!bytes.byteLength) throw new Error('Squid chase sound is empty.');
      const buffer = await audio.decodeAudioData(bytes);
      if (!buffer || !Number.isFinite(buffer.duration) || buffer.duration <= 0)
        throw new Error('Squid chase sound decoded without a playable duration.');
      return buffer;
    })();
    cache.set(audio, entry);
  }
  return entry;
}

function reportOnce(entry, error) {
  if (entry.reported) return;
  entry.reported = true;
  console.warn('Croba Planet: the recorded squid chase sound could not play.', error);
}

/** A cancellable synchronous handle owns both the pending load and one-shot
 * playback. Only the first requested chase fetches/decodes, once per existing
 * context. This module never creates or resumes an AudioContext.
 * @param {AudioContext} audio @param {{volume?:number}} [options]
 * @returns {{stop:()=>void,ended:Promise<void>}|null}
 */
export function playAdultChase(audio, { volume = DEFAULT_VOLUME } = {}) {
  if (!audio || audio.state !== 'running' || !Number.isFinite(audio.currentTime)) return null;
  const peak = Math.max(0, Math.min(MAX_VOLUME, Number.isFinite(volume) ? volume : DEFAULT_VOLUME));
  if (!peak) return null;
  const entry = sampleFor(audio);
  let source = null, output = null, fallback = null, finished = false, stopping = false;
  let resolveEnded;
  const ended = new Promise(resolve => { resolveEnded = resolve; });

  function cleanup() {
    if (finished) return;
    finished = true;
    audio.removeEventListener?.('statechange', onStateChange);
    if (source) {
      source.onended = null;
      try { source.disconnect(); } catch { /* Keep releasing the output node. */ }
      try { source.buffer = null; } catch { /* Disconnection releases browser-owned storage. */ }
    }
    try { output?.disconnect(); } catch { /* An ended graph may already be detached. */ }
    source = output = fallback = null;
    resolveEnded();
  }

  function stop() {
    if (finished) return;
    if (audio.state !== 'running') {
      fallback?.stop();
      try { source?.stop(Number.isFinite(audio.currentTime) ? audio.currentTime : 0); } catch { /* It may already be ended. */ }
      cleanup(); return;
    }
    if (stopping) return;
    stopping = true;
    if (fallback) { fallback.stop(); return; }
    if (!source) { cleanup(); return; }
    try {
      const now = audio.currentTime;
      if (typeof output.gain.cancelAndHoldAtTime === 'function') output.gain.cancelAndHoldAtTime(now);
      else {
        output.gain.cancelScheduledValues(now);
        output.gain.setValueAtTime(Math.max(0, Math.min(peak, output.gain.value)), now);
      }
      output.gain.linearRampToValueAtTime(0, now + .025);
      source.stop(now + .03);
    } catch { cleanup(); }
  }

  function onStateChange() { if (audio.state !== 'running') stop(); }

  function startFallback(error) {
    if (finished || stopping || audio.state !== 'running') { cleanup(); return; }
    reportOnce(entry, error);
    try {
      fallback = playAdultScreech(audio, { volume: peak * .12 / DEFAULT_VOLUME });
      if (fallback) fallback.ended.then(cleanup, cleanup);
      else cleanup();
    } catch { cleanup(); }
  }

  function startSample(buffer) {
    if (finished || stopping || audio.state !== 'running' || !Number.isFinite(audio.currentTime)) { cleanup(); return; }
    try {
      const now = audio.currentTime, duration = buffer.duration;
      source = audio.createBufferSource(); output = audio.createGain();
      source.buffer = buffer; source.loop = false;
      source.connect(output); output.connect(audio.destination);
      output.gain.setValueAtTime(0, now);
      output.gain.linearRampToValueAtTime(peak, now + Math.min(.012, duration / 4));
      output.gain.setValueAtTime(peak, now + duration - Math.min(.025, duration / 3));
      output.gain.linearRampToValueAtTime(0, now + duration);
      source.onended = cleanup;
      source.start(now);
    } catch (error) {
      try { source?.stop(audio.currentTime); } catch { /* Release a partial source that never started. */ }
      cleanup(); reportOnce(entry, error);
    }
  }

  audio.addEventListener?.('statechange', onStateChange);
  // Both outcomes are handled even if the session was stopped during decoding.
  entry.promise.then(startSample, startFallback);
  return { stop, ended };
}
