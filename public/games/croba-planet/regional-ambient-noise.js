import {isBasinCaveMusicRegion} from './region-music.js';

export const REGIONAL_AMBIENT_NOISE_URL = new URL('./assets/audio/forest-basin-noise.m4a', import.meta.url).href;

/** The forest surface and the actual frozen-basin cave volume share this rare call. */
export const isRegionalAmbientNoiseRegion = world => world?.biome === 'purple-forest' || isBasinCaveMusicRegion(world);

/**
 * A rare one-shot stream using the existing sound context. Its silence counts
 * eligible simulation time, without timers, whole-file decoding or new contexts.
 * @param {{createMedia?:()=>HTMLAudioElement,random?:()=>number,minDelay?:number,
 * maxDelay?:number,volume?:number,onError?:(error:unknown)=>void}} [options]
 */
export function createRegionalAmbientNoise({createMedia = () => new Audio(), random = Math.random,
  minDelay = 180, maxDelay = 420, volume = .25,
  onError = error => console.warn('Croba Planet: regional ambient noise could not play.', error)} = {}) {
  if (typeof createMedia !== 'function' || typeof random !== 'function') throw new TypeError('Ambient noise needs media and random factories.');
  if (![minDelay, maxDelay].every(Number.isFinite) || minDelay < 0 || maxDelay < minDelay) throw new RangeError('Ambient noise delays must be finite, nonnegative and ordered.');
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new RangeError('Ambient noise volume must be between zero and one.');
  let audio = null, media = null, source = null, output = null;
  let disposed = false, authorized = false, blocked = false, reported = false;
  let remaining = null, eligible = false, playing = false, priming = false;
  let generation = 0, intent = null, request = null;
  let silent = true;

  function silence() {
    if (silent || !output || !Number.isFinite(audio?.currentTime)) return;
    output.gain.cancelScheduledValues(audio.currentTime);
    output.gain.setValueAtTime(0, audio.currentTime);
    silent = true;
  }
  function rewind() {
    if (media && media.currentTime !== 0) {
      try { media.currentTime = 0; } catch { /* A not-yet-ready stream already begins at zero. */ }
    }
  }
  function stop() {
    eligible = false; remaining = null;
    const active = playing || priming || request;
    generation++; intent = request = null; playing = priming = false;
    silence();
    if (active || media && !media.paused) media?.pause();
    rewind();
  }
  function fail(error) {
    blocked = true; stop();
    if (!reported) { reported = true; onError(error); }
  }
  function delay() {
    const value = random();
    if (!Number.isFinite(value)) throw new TypeError('Ambient noise random factory must return a finite number.');
    return minDelay + Math.max(0, Math.min(1, value)) * (maxDelay - minDelay);
  }

  function play(mode) {
    if (disposed || blocked || !authorized || !media || playing || priming || request) return Promise.resolve(false);
    const token = ++generation, element = media;
    intent = mode; priming = mode === 'prime'; playing = mode === 'clip';
    rewind(); silence();
    if (playing) {
      output.gain.cancelScheduledValues(audio.currentTime);
      output.gain.setValueAtTime(0, audio.currentTime);
      output.gain.linearRampToValueAtTime(volume, audio.currentTime + .08);
      silent = false;
    }
    let result;
    // Called directly by activate(), before the sound click awaits resume().
    try { result = element.play(); }
    catch (error) { fail(error); return Promise.resolve(false); }
    const pending = Promise.resolve(result).then(() => {
      if (disposed || token !== generation) {
        if (!intent) element.pause();
        return false;
      }
      if (mode === 'prime') {
        element.pause(); rewind(); priming = false; intent = null;
      }
      return true;
    }, error => {
      if (!disposed && token === generation) fail(error);
      return false;
    }).finally(() => { if (request === pending) request = null; });
    request = pending;
    return pending;
  }

  function onEnded() {
    if (disposed || blocked || !authorized || !playing || !media?.ended) return;
    generation++; intent = request = null; playing = false;
    media.pause();
    silence(); rewind();
    try { remaining = eligible ? delay() : null; }
    catch (error) { fail(error); }
  }
  function onStateChange() { if (audio?.state !== 'running') stop(); }
  function onMediaError() {
    if (authorized && !disposed) fail(new Error(`Regional ambient noise failed to load${media?.error?.code ? ` (media error ${media.error.code})` : ''}.`));
  }
  function release() {
    stop();
    audio?.removeEventListener?.('statechange', onStateChange);
    media?.removeEventListener?.('ended', onEnded);
    media?.removeEventListener?.('error', onMediaError);
    if (media) { media.removeAttribute('src'); media.load(); }
    for (const node of [source, output]) {
      try { node?.disconnect(); } catch { /* Continue releasing this controller's graph. */ }
    }
    audio = media = source = output = null; authorized = false; silent = true;
  }

  return {
    /** Prime this one element silently inside the existing sound-on gesture. */
    activate(context) {
      if (disposed) return Promise.resolve(false);
      blocked = false; reported = false;
      try {
        if (!context || context.state === 'closed' || !Number.isFinite(context.currentTime)
          || typeof context.createMediaElementSource !== 'function') throw new TypeError('Ambient noise needs the game audio context.');
        if (audio && audio !== context) release();
        if (!media) {
          audio = context; media = createMedia();
          media.src = REGIONAL_AMBIENT_NOISE_URL; media.preload = 'none'; media.loop = false; media.playsInline = true; media.volume = 1;
          output = audio.createGain(); output.gain.setValueAtTime(0, audio.currentTime);
          source = audio.createMediaElementSource(media); source.connect(output); output.connect(audio.destination);
          audio.addEventListener?.('statechange', onStateChange);
          media.addEventListener?.('ended', onEnded); media.addEventListener?.('error', onMediaError);
        }
        authorized = true;
        if (playing || priming || request) return request ?? Promise.resolve(true);
        return play('prime');
      } catch (error) { release(); fail(error); return Promise.resolve(false); }
    },
    /** @param {import('./world.js').World} world @param {number} dt
     * @param {{started?:boolean,paused?:boolean,soundEnabled?:boolean,contextRunning?:boolean,ducked?:boolean,cinematic?:boolean}} [state] */
    update(world, dt, {started = false, paused = false, soundEnabled = false,
      contextRunning = audio?.state === 'running', ducked = false, cinematic = false} = {}) {
      if (disposed || blocked || !authorized) return;
      if (!started || paused || !soundEnabled || !contextRunning || audio?.state !== 'running'
        || ducked || cinematic || volume === 0 || !isRegionalAmbientNoiseRegion(world)) { stop(); return; }
      eligible = true;
      if (playing || priming || request || !Number.isFinite(dt) || dt <= 0 || dt > .25) return;
      try {
        remaining ??= delay();
        remaining -= dt;
        if (remaining <= 0) play('clip');
      } catch (error) { fail(error); }
    },
    stop,
    reset: stop,
    dispose() { if (disposed) return; disposed = true; release(); },
  };
}
