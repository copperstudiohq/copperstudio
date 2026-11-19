/**
 * Static Copperstudio export: keep Octo's bundled dialogue and local chat.
 * The original private-source refresh requires a server and is unavailable here.
 * Preserve its controller API without frames, timers, remote requests or keys.
 */
export function setupOctoDialogueSync({ onUpdate, onUnavailable = () => {} } = {}) {
  if (typeof onUpdate !== 'function') {
    throw new TypeError('Octo dialogue sync requires an update callback.');
  }
  let disposed = false;
  let reported = false;
  function disabled() {
    if (!disposed && !reported) {
      reported = true;
      try { onUnavailable('static-export'); } catch { /* Optional status only. */ }
    }
    return Promise.resolve(false);
  }
  return {
    refresh: disabled,
    start: disabled,
    stop() {},
    dispose() { disposed = true; },
  };
}
