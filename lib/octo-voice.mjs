export const OCTO_VOICE_SETTINGS = Object.freeze({ pitch: 0.55, rate: 0.86, volume: 0.85 });

/** Select only an English voice explicitly provided by this device. */
export function selectOctoVoice(voices) {
  return voices.find((voice) => voice.localService === true && /^en(?:[-_]|$)/i.test(voice.lang)) ?? null;
}
