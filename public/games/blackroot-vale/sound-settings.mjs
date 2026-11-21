const STORAGE_KEY = 'blackroot-vale.sound';

export function bindSoundSettings(panel, setVolume) {
  const volume = panel.querySelector('#sound-volume');
  const percent = panel.querySelector('#sound-percent');
  const mute = panel.querySelector('#sound-mute');
  const summary = panel.querySelector('summary');

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(saved?.volume)) volume.value = Math.min(100, Math.max(0, saved.volume));
    mute.checked = saved?.muted === true;
  } catch {
    // Keep the default settings when browser storage is unavailable.
  }

  function update() {
    percent.value = volume.value + '%';
    setVolume(mute.checked ? 0 : volume.valueAsNumber / 100);
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ volume: volume.valueAsNumber, muted: mute.checked }));
    } catch {
      // Settings still work for the current session.
    }
  }

  volume.addEventListener('input', update);
  volume.addEventListener('change', save);
  mute.addEventListener('change', () => {
    update();
    save();
  });
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.open) {
      panel.open = false;
      summary.focus();
    }
  });
  update();
}
