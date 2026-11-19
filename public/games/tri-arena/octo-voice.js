/** Octo's original low, measured device voice. Captions remain independent of speech support. */
export function setupOctoVoice(button, env = globalThis, storage) {
  if (!button || typeof button.setAttribute !== 'function') throw new TypeError('Octo voice requires a button.');
  const synth = env.speechSynthesis;
  const supported = Boolean(synth && env.SpeechSynthesisUtterance);
  let enabled = true, unlocked = false, last = '', active = null;
  try {
    if (storage === undefined) storage = env.localStorage;
    enabled = storage?.getItem('rain-arena-octo-voice') !== 'off';
  } catch { /* Device speech and captions work without local storage. */ }

  function paint() {
    button.disabled = !supported;
    button.textContent = supported ? `Octo voice: ${enabled ? 'on' : 'off'}` : 'Octo voice unavailable';
    button.setAttribute('aria-pressed', String(enabled && supported));
  }

  function cancel() {
    active = null; last = '';
    synth?.cancel();
    paint();
  }

  function speak(text) {
    if (!supported || !enabled || !unlocked || typeof text !== 'string' || !text.trim() || text === last) return false;
    try {
      active = null; synth.cancel();
      const line = text.replace(/^Octo Nose:\s*/, '').replace(/[“”]/g, '');
      const utterance = new env.SpeechSynthesisUtterance(line);
      const voices = synth.getVoices();
      utterance.voice = voices.find(voice => /^en/i.test(voice.lang) && /robot|synthe|microsoft|daniel|alex/i.test(voice.name))
        || voices.find(voice => /^en/i.test(voice.lang)) || null;
      utterance.lang = utterance.voice?.lang || 'en-US';
      utterance.pitch = .55;
      utterance.rate = .86;
      utterance.volume = .85;
      active = utterance; last = text;
      utterance.onstart = () => { if (active === utterance) button.textContent = 'Octo voice: speaking'; };
      utterance.onend = () => { if (active === utterance) { active = null; paint(); } };
      utterance.onerror = event => {
        if (active !== utterance) return;
        active = null; last = '';
        if (['canceled', 'interrupted'].includes(event.error)) { paint(); return; }
        console.warn('[rain-arena] Octo voice unavailable:', event.error);
        button.textContent = 'Octo voice: tap to retry';
      };
      synth.speak(utterance);
      return true;
    } catch (error) {
      active = null; last = '';
      console.warn('[rain-arena] Octo voice unavailable:', error.message);
      button.textContent = 'Octo voice: tap to retry';
      return false;
    }
  }

  function toggle() {
    if (!supported) return;
    enabled = !enabled;
    cancel();
    try { storage?.setItem('rain-arena-octo-voice', enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
    if (enabled) {
      unlocked = true;
      speak('Octo Nose: Voice systems online. My nose is ready.');
    }
  }
  const onVisibility = () => { if (env.document?.hidden) cancel(); };
  button.onclick = toggle;
  env.document?.addEventListener('visibilitychange', onVisibility);
  paint();
  return {
    speak,
    unlock() { unlocked = true; },
    cancel,
    dispose() {
      cancel();
      env.document?.removeEventListener('visibilitychange', onVisibility);
      if (button.onclick === toggle) button.onclick = null;
    },
  };
}
