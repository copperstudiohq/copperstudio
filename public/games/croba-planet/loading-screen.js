/** Release the overlay only after a successful first draw (or a visible error). */
export function finishLoading(document) {
  const screen = document.getElementById('loading-screen');
  if (!screen || screen.classList.contains('is-ready')) return;
  screen.classList.add('is-ready');
  screen.setAttribute('aria-busy', 'false');
  screen.setAttribute('aria-hidden', 'true');
  screen.inert = true;
}

/** Runtime/module failures must not be mislabeled as unsupported graphics. */
export function showStartupError(document,error){
  const message=document.getElementById('startup-error-message');
  if(message)message.textContent=error?.code==='CROBA_WEBGL_UNAVAILABLE'
    ?'This game needs 3D graphics support (WebGL 2). Try reloading in a browser with hardware acceleration enabled.'
    :'Croba could not finish loading. Reload the game to try again.';
  document.getElementById('error')?.classList.remove('hidden');
  finishLoading(document);
}

/** Artwork is optional: a missing or slow image never prevents playing. */
export async function waitForLoadingArt(image, timeoutMs = 1500) {
  if (!image?.decode) return;
  let timer;
  try {
    await Promise.race([
      image.decode().catch(() => {}),
      new Promise(resolve => { timer = setTimeout(resolve, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}

/** Paint the small loading UI before importing the expensive 3D world. */
export async function bootGame({ document, requestFrame, loadGame, logger = console }) {
  const screen = document.getElementById('loading-screen');
  if (screen) screen.hidden = false;
  try {
    await waitForLoadingArt(document.getElementById('loading-art'));
    await new Promise(resolve => requestFrame(() => requestFrame(resolve)));
    await loadGame();
  } catch (error) {
    logger.error('Croba Planet failed to load:', error);
    showStartupError(document,error);
  }
}
