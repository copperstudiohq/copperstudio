import { bootGame } from './loading-screen.js';

void bootGame({ document, requestFrame: callback => requestAnimationFrame(callback),
  loadGame: () => import('./game.js') });
