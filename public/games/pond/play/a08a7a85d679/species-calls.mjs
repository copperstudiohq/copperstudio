export const CALL_SECONDS = 4;
export const MAX_SPECIES_CALLS = 8;
const MAX_AUDIO_BYTES = 96 * 1024;
const RECORDING_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'];

export function validSpeciesCall(clip) {
  return Boolean(clip && typeof clip.species === 'string' && /^[a-z0-9-]{1,48}$/.test(clip.species) &&
    typeof clip.audio === 'string' && clip.audio.length >= 4 && clip.audio.length % 4 === 0 &&
    clip.audio.length <= 4 * Math.ceil(MAX_AUDIO_BYTES / 3) && /^[A-Za-z0-9+/]+={0,2}$/.test(clip.audio));
}

export function speciesCall(planet, species) {
  return planet.speciesCalls?.find((clip) => clip.species === species);
}

export function putSpeciesCall(planet, clip) {
  if (!validSpeciesCall(clip)) throw new Error('The recording is empty or too large. Try a shorter call.');
  const clips = planet.speciesCalls ??= [];
  const index = clips.findIndex((saved) => saved.species === clip.species);
  if (index >= 0) clips[index] = clip;
  else if (clips.length < MAX_SPECIES_CALLS) clips.push(clip);
  else throw new Error('This planet has eight species calls. Remove one before recording another.');
}

function encode(bytes) {
  let data = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    data += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(data);
}

export class SpeciesAudio {
  enabled = false;
  nextCall = 0;
  capture = null;
  decoded = new WeakMap();

  async enable() {
    if (!globalThis.AudioContext) throw new Error('This browser cannot play creature calls.');
    this.context ??= new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
    this.enabled = true;
  }

  mute() {
    this.enabled = false;
    this.source?.stop();
    this.source = null;
  }

  stopRecording() {
    if (this.capture?.state === 'waiting') this.cancelRecording();
    else this.capture?.stop();
  }

  cancelRecording() {
    const capture = this.capture;
    this.capture = null;
    capture?.stop?.();
  }

  async record(onStart) {
    const media = globalThis.navigator?.mediaDevices;
    if (!media?.getUserMedia || !globalThis.MediaRecorder) {
      throw new Error('Microphone recording is unavailable here. Open Pond in a browser that supports microphone access.');
    }
    if (this.capture) return null;
    this.source?.stop();
    this.source = null;
    const capture = { state: 'waiting', stop: null };
    this.capture = capture;
    let stream;
    let timer;
    try {
      stream = await media.getUserMedia({ audio: true });
      if (this.capture !== capture) return null;
      const mimeType = RECORDING_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
      const chunks = [];
      const recorded = new Promise((resolve, reject) => {
        recorder.ondataavailable = ({ data }) => { if (data.size) chunks.push(data); };
        recorder.onstop = () => resolve(new Blob(chunks));
        recorder.onerror = () => reject(new Error('The microphone stopped recording. Try again.'));
        capture.stop = () => {
          if (recorder.state === 'recording') {
            capture.state = 'saving';
            recorder.stop();
          }
        };
        recorder.start();
        capture.state = 'recording';
        timer = setTimeout(capture.stop, CALL_SECONDS * 1000);
      });
      onStart();
      const clip = await recorded;
      if (this.capture !== capture) return null;
      if (!clip.size || clip.size > MAX_AUDIO_BYTES) throw new Error('The recording is empty or too large. Try a shorter call.');
      const bytes = new Uint8Array(await clip.arrayBuffer());
      return this.capture === capture ? encode(bytes) : null;
    } catch (error) {
      if (this.capture !== capture) return null;
      if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
        throw new Error('Allow microphone access in your browser to record a call.', { cause: error });
      }
      if (error.name === 'NotFoundError' || error.name === 'NotReadableError') {
        throw new Error('No microphone is available. Check your microphone and try again.', { cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      if (this.capture === capture) this.capture = null;
    }
  }

  async play(clip, pan) {
    const automatic = pan !== undefined;
    const context = this.context;
    if (!this.enabled || this.capture || context?.state !== 'running') return;
    if (!this.decoded.has(clip)) {
      const bytes = Uint8Array.from(atob(clip.audio), (character) => character.charCodeAt(0));
      this.decoded.set(clip, context.decodeAudioData(bytes.buffer));
    }
    const buffer = await this.decoded.get(clip);
    if (!this.enabled || this.capture || (automatic && this.source)) return;
    this.source?.stop();
    const gain = context.createGain();
    gain.gain.value = automatic ? .33 : .65;
    const stereo = automatic && context.createStereoPanner ? context.createStereoPanner() : null;
    if (stereo) {
      stereo.pan.value = pan;
      gain.connect(stereo).connect(context.destination);
    } else gain.connect(context.destination);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      stereo?.disconnect();
      if (this.source === source) this.source = null;
    };
    source.start(0, 0, CALL_SECONDS);
    this.source = source;
  }

  update(planet, visibleCreatures, now) {
    if (!this.enabled || this.capture || this.source || now < this.nextCall || !planet?.speciesCalls?.length) return;
    this.nextCall = now + 8000 + Math.random() * 5000;
    const clips = new Map(planet.speciesCalls.map((clip) => [clip.species, clip]));
    const nearby = visibleCreatures.filter(({ species }) => clips.has(species));
    const creature = nearby[Math.floor(Math.random() * nearby.length)];
    if (creature) this.play(clips.get(creature.species), creature.pan).catch(() => {});
  }
}
