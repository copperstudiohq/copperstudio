import { blubClipName } from './blub-dialogue.mjs';

export function createBlubVoice() {
  const Context = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  const clips = new Map();
  let audio = null;
  let output = null;
  let volume = 1;
  let resume = null;
  let playing = null;
  let revision = 0;

  function stop() {
    revision++;
    if (playing) {
      playing.stop();
      playing.disconnect();
      playing = null;
    }
  }

  return {
    setVolume(level) {
      volume = level;
      if (output) output.gain.setTargetAtTime(level, audio.currentTime, .012);
    },
    unlock() {
      if (!Context) return;
      try {
        if (!audio) {
          const context = new Context();
          output = context.createGain();
          output.gain.value = volume;
          output.connect(context.destination);
          audio = context;
        }
        if (audio.state !== 'running' && audio.state !== 'closed') {
          resume = audio.resume().catch(() => {});
        }
      } catch (error) {
        console.warn('Blub’s audio could not be enabled.', error);
      }
    },
    stop,
    async play(line) {
      stop();
      if (!audio || audio.state === 'closed' || volume === 0) return;
      const requested = revision;
      const filename = blubClipName(line);
      try {
        if (!clips.has(filename)) {
          const load = fetch(new URL('./audio/blub/' + filename, import.meta.url))
            .then((response) => {
              if (!response.ok) throw new Error('HTTP ' + response.status);
              return response.arrayBuffer();
            })
            .then((bytes) => audio.decodeAudioData(bytes));
          clips.set(filename, load);
        }
        const [buffer] = await Promise.all([clips.get(filename), resume]);
        if (requested !== revision || audio.state !== 'running' || volume === 0) return;
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.connect(output);
        source.onended = () => {
          source.disconnect();
          if (playing === source) playing = null;
        };
        source.start();
        playing = source;
      } catch (error) {
        clips.delete(filename);
        console.warn('Blub’s voice clip could not play.', error);
      }
    },
  };
}
