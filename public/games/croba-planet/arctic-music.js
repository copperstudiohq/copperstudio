export const ARCTIC_MUSIC_URL = new URL('./assets/audio/the-bound-arctic.m4a', import.meta.url).href;
export const COLD_AIR_MUSIC_URL = new URL('./assets/audio/cold-air.m4a', import.meta.url).href;
export const ARCTIC_MUSIC_PLAYLIST = Object.freeze([COLD_AIR_MUSIC_URL, ARCTIC_MUSIC_URL]);
const ARCTIC_REGIONS = new Set(['arctic', 'cliff-biome', 'blue-kelp-forest', 'orange-grass-field', 'iceberg-tundra']);

/** Arctic gardens remain Arctic underwater; the warm ocean, forest and salt cave do not. */
export function isArcticMusicRegion(world) {
  return ARCTIC_REGIONS.has(world?.biome);
}

/**
 * A sequential playlist streamed through one element and the existing audio context.
 * Constructing/updating this controller allocates no media until activate() is
 * called directly by the sound-on gesture. It never resumes/creates a context.
 *
 * @param {{src?:string,tracks?:readonly string[],volume?:number,fadeSeconds?:number,
 *   isRegion?:(world:import('./world.js').World)=>boolean,
 *   createMedia?:()=>HTMLAudioElement,onError?:(error:unknown)=>void}} [options]
 */
export function createArcticMusic({
  src, tracks = ARCTIC_MUSIC_PLAYLIST, volume = 0.35, fadeSeconds = 2,
  isRegion = isArcticMusicRegion,
  createMedia = () => new Audio(),
  onError = (error) => console.warn('Croba Planet: Arctic music could not play.', error),
} = {}) {
  const playlist = src === undefined ? tracks : [src];
  if (!Array.isArray(playlist) || !playlist.length || playlist.some(url => typeof url !== 'string' || !url.trim()))
    throw new TypeError('Arctic music needs a nonempty playlist of audio URLs.');
  const urls = [...playlist];
  if (typeof isRegion !== 'function') throw new TypeError('Region music needs an eligibility predicate.');
  if (!Number.isFinite(volume) || volume < 0 || volume > 1) throw new RangeError('Arctic music volume must be between zero and one.');
  if (!Number.isFinite(fadeSeconds) || fadeSeconds <= 0) throw new RangeError('Arctic music fade must be positive.');
  let audio = null, media = null, source = null, output = null;
  let authorized = false, disposed = false, blocked = false, reported = false;
  let playing = false, wanted = false, playRequest = null, playGeneration = 0;
  let trackIndex = 0, eligible = false;
  let envelope = { from: 0, to: 0, start: 0, end: 0 };

  function levelAt(time) {
    if (time >= envelope.end) return envelope.to;
    const fraction = Math.max(0, (time - envelope.start) / (envelope.end - envelope.start));
    return envelope.from + (envelope.to - envelope.from) * fraction;
  }

  function setLevel(target, duration) {
    if (!output || !Number.isFinite(audio?.currentTime)) return;
    if (envelope.to === target && (duration > 0 || envelope.end <= audio.currentTime)) return;
    const now = audio.currentTime, from = levelAt(now);
    output.gain.cancelScheduledValues(now);
    output.gain.setValueAtTime(from, now);
    if (duration > 0) output.gain.linearRampToValueAtTime(target, now + duration);
    else output.gain.setValueAtTime(target, now);
    envelope = { from, to: target, start: now, end: now + duration };
  }

  function pausePlayback() {
    wanted = false;
    if (!media || (!playing && !playRequest)) return;
    playGeneration++;
    playing = false; playRequest = null;
    media.pause();
  }

  /** Immediate silence for menus/hidden pages, including when RAF is suspended. */
  function stop() {
    eligible = false;
    setLevel(0, 0);
    pausePlayback();
  }

  function selectTrack(index) {
    trackIndex = index;
    if (!media) return;
    playGeneration++;
    playing = false; playRequest = null;
    media.src = urls[trackIndex];
    media.load();
  }

  /** A new expedition opens with Cold Air; ordinary pauses keep their cursor. */
  function reset() {
    stop();
    selectTrack(0);
  }

  function onTrackEnded() {
    if (disposed || blocked || !authorized || !media?.ended) return;
    selectTrack((trackIndex + 1) % urls.length);
    // Leaving the region disables advancement playback before its fade ends.
    if (eligible && audio?.state === 'running') startPlayback();
  }

  function fail(error) {
    blocked = true;
    stop();
    if (!reported) { reported = true; onError(error); }
  }

  function startPlayback() {
    if (disposed || blocked || !authorized || !media) return Promise.resolve(false);
    wanted = true;
    if (playRequest) return playRequest;
    if (playing && !media.paused) return Promise.resolve(true);
    const generation = ++playGeneration, element = media;
    let result;
    // Keep play() synchronous with activate(): awaiting context.resume() first
    // can lose the mobile browser's user activation.
    try { result = element.play(); playing = true; }
    catch (error) { fail(error); return Promise.resolve(false); }
    const request = Promise.resolve(result).then(() => {
      if (disposed || generation !== playGeneration) {
        if (!wanted) element.pause();
        return false;
      }
      if (!wanted) { pausePlayback(); return false; }
      return true;
    }, (error) => {
      // pause()/dispose() can abort an outstanding play promise normally.
      if (!disposed && generation === playGeneration) fail(error);
      return false;
    }).finally(() => { if (playRequest === request) playRequest = null; });
    playRequest = request;
    return request;
  }

  function onStateChange() { if (audio?.state !== 'running') stop(); }
  function onMediaError() {
    if (authorized && !disposed) fail(new Error(`Arctic music failed to load${media?.error?.code ? ` (media error ${media.error.code})` : ''}.`));
  }

  function releaseGraph() {
    stop();
    audio?.removeEventListener?.('statechange', onStateChange);
    media?.removeEventListener?.('error', onMediaError);
    media?.removeEventListener?.('ended', onTrackEnded);
    if (media) { media.removeAttribute('src'); media.load(); }
    for (const node of [source, output]) {
      try { node?.disconnect(); } catch { /* Release the remaining owned nodes. */ }
    }
    audio = media = source = output = null;
    authorized = false;
    envelope = { from: 0, to: 0, start: 0, end: 0 };
  }

  /** Call directly in the existing sound-on click, BEFORE awaiting resume(). */
  function activate(context) {
    if (disposed) return Promise.resolve(false);
    blocked = false; reported = false;
    try {
      if (!context || context.state === 'closed' || !Number.isFinite(context.currentTime)
        || typeof context.createMediaElementSource !== 'function') throw new TypeError('Arctic music needs the game audio context.');
      if (audio && audio !== context) releaseGraph();
      if (!media) {
        audio = context;
        media = createMedia();
        media.loop = false;
        media.preload = 'none';
        media.playsInline = true;
        media.volume = 1;
        media.src = urls[trackIndex];
        output = audio.createGain();
        output.gain.setValueAtTime(0, audio.currentTime);
        envelope = { from: 0, to: 0, start: audio.currentTime, end: audio.currentTime };
        source = audio.createMediaElementSource(media);
        source.connect(output); output.connect(audio.destination);
        audio.addEventListener?.('statechange', onStateChange);
        media.addEventListener?.('error', onMediaError);
        media.addEventListener?.('ended', onTrackEnded);
      }
      authorized = true;
      return startPlayback();
    } catch (error) {
      releaseGraph(); fail(error);
      return Promise.resolve(false);
    }
  }

  return {
    activate, stop, reset,
    /**
     * Only regional fades use the audio clock; dropped frames cannot restart the
     * song or create automation per frame. Pausing retains the streaming cursor.
     * @param {{biome?:string}} world @param {number} _dt
     * @param {{started?:boolean,paused?:boolean,soundEnabled?:boolean,contextRunning?:boolean,ducked?:boolean}} [state]
     */
    update(world, _dt, { started = false, paused = false, soundEnabled = false, contextRunning = audio?.state === 'running', ducked = false } = {}) {
      if (disposed || !authorized || blocked) return;
      if (!started || paused || !soundEnabled || !contextRunning || audio?.state !== 'running') { stop(); return; }
      eligible = isRegion(world) && volume > 0;
      if (eligible) {
        startPlayback();
        setLevel(volume * (ducked ? 0.25 : 1), ducked ? 0.25 : fadeSeconds);
      } else {
        setLevel(0, fadeSeconds);
        if (audio.currentTime >= envelope.end) pausePlayback();
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseGraph();
    },
  };
}
