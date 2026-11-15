import { NOSE_LINES, CROBA_LINES, TRI_LINES, JOKES } from './octo-dialogue.mjs';

/**
 * Adapted from the shared, local Octo Nose conversation in:
 * axolotl-major/dist/octo-chat.js
 * sites/rain-and-copper/dist/octo-chat.js
 * sites/tri-arena/dist/octo-chat.js
 * Original personality, topic cycling, name and question memory are retained.
 * The collection guide replaces world actions with advice and explicit links.
 */
export const OCTO_GREETING = 'Hello, friend. I am Octo Nose. My nose knows these four games. Ask me where to start, how to play, or for a nose joke.';
export const OCTO_PROMPTS = Object.freeze([
  'Croba Planet hints', 'Rain & Copper hints', 'Card game hints',
  'Tri Arena hints', 'Which game should I play?', 'Tell me a joke',
]);

// Links match app/page.tsx. Controls are checked against each game's README;
// Tri Arena's current Space jump / right-mouse kick supersede its older layout.
const GAMES = Object.freeze({
  croba: {
    name: 'Croba Planet',
    href: 'https://croba-planet-icebound.davidwebstar.chatgpt.site',
    overview: 'Croba Planet is an alien survival expedition: cross the ice, explore the Violet Spruce Forest, and dive into a 100-metre ocean. Watch your oxygen, suit warmth and integrity. My nose recommends looking beneath the surface.',
    controls: 'Croba Planet: WASD moves; mouse, dragging or arrow keys look around. Space jumps on land and swims up in water; C or Shift dives down. E interacts, M opens the map, B opens the bestiary, and Escape pauses.',
    hints: [
      'Surface to refill oxygen and plan enough air for the return swim. Heat beacons and the crash site restore suit warmth and integrity. If the ice centipede hunts you, get into the water before it reaches you.',
      'Approach wildlife within 10 metres to record it in the bestiary. The field guide helps identify alien plants. Your nose is optional; your oxygen supply is not.',
      ...CROBA_LINES,
    ],
    saves: 'Croba Planet has named local expedition slots, autosaves, and JSON backup export/import. Automatic saves stay in this browser and device. Use Saved Expeditions to return; keep an exported backup before clearing site data.',
    multiplayer: 'Croba Planet is a solo expedition. For another player, try the Rain & Copper island on the same Wi-Fi, or invite a friend to The Card Game with a room code.',
  },
  island: {
    name: 'Rain & Copper',
    href: 'https://rain-and-copper-island.davidwebstar.chatgpt.site',
    overview: 'Rain & Copper is the island adventure: fish beside the hut, chop birches, craft equipment and building pieces, and investigate copper and icy realms. Watch the spreading pink Tri. Even my nose keeps its distance.',
    controls: 'Rain & Copper island: WASD moves; mouse, dragging or arrow keys look. Space jumps, Shift runs, E interacts or collects, I opens the inventory, M opens the map, and Escape pauses. Click or F uses held equipment. Touch and standard controllers are supported.',
    hints: [
      'Chop a nearby birch with your Copper Axe, then use E to collect its wood. Craft building pieces in your inventory, equip one, and aim at clear ground to place it. I can explain the steps, but your hands do the building.',
      'Collect the fishing rod from the hut, then learn the rod upgrades and casting controls in the game. Be careful with Tri Meat: eating it hurts instead of healing. A suspicious snack, says my nose.',
      'Create a named world to keep your island changes. When the normal forest portal becomes available, investigate it with the items and instructions shown in the game.',
    ],
    saves: 'Rain & Copper saves named worlds in this browser on this device. Choose world continues a save; Export backup makes a transferable JSON copy. Co-op saves belong to the host device, and clearing site data removes local worlds.',
    multiplayer: 'Rain & Copper supports two devices on the same Wi-Fi. Both open 2P: the host creates a room and the friend enters its six-character code. Room setup needs internet and local peer connections. The host keeps the world save; both players need game access.',
  },
  cards: {
    name: 'Rain & Copper: The Card Game',
    href: 'https://wooden-room-red-carpet.davidwebstar.chatgpt.site',
    overview: 'The Card Game is a creature duel across an oak table. Start with a secret card, draw another, play one for its power, and keep the other hidden. Win three tokens to take the match. Play solo against the Watcher AI or invite a friend with a room code.',
    controls: 'The Card Game: E draws; 1 and 2 select cards; R raises or lowers your card; F plays it. C stands up or sits down. While standing, WASD or arrow keys move; Space jumps. Drag to look, Q scatters cards, and Escape lowers an inspected card or releases the mouse.',
    hints: [
      'Read each creature power before choosing which card to play. Survive the rival or keep the stronger creature for the final reveal. Duck beats the Tri at that reveal; playing the Tri eliminates its holder. The small nose knows a useful surprise.',
      'The deck has 21 cards featuring 11 creatures. First to three tokens wins. Physical card shoving is playful scenery: it does not change ownership, secret hands or the deck order.',
      'Use Host a game and share its six-character room code with one friend. You can also stand up, explore the wooden room, change your outfit and choose a jukebox song.',
    ],
    saves: 'Solo Card Game matches restart on reload. Online rooms persist for up to 24 hours; Resume online room recovers the seat saved in that browser tab. Outfits are saved on the device. I cannot recover a missing room or inspect its secret hands.',
    multiplayer: 'The Card Game offers Play solo, Host a game and Join a friend. Share the six-character room code for an online duel; both visitors need access. Unlike the island co-op, the card duel does not require the same Wi-Fi.',
  },
  arena: {
    name: 'Tri Arena',
    href: 'https://tri-arena-danger-zone.davidwebstar.chatgpt.site',
    overview: 'Tri Arena is voxel sword combat in the Tri Bonefields or copper Colosseum. Choose Endless Waves, Survival, Practice or War Mode. Aim at real body parts, block, dash, jump and kick. In the Bonefields, Endless rotates through six bosses every fifth wave.',
    controls: 'Tri Arena today: WASD or arrow keys move; mouse aims. Left mouse slices vertically by default; A/D while attacking makes horizontal cuts, and V forces vertical cuts. F or J also attacks. Hold E or K to block, Shift to dash, Space to jump, and right mouse to kick. Escape pauses. Touch buttons are available.',
    hints: [
      'Watch the amber attack warnings, then block or move clear. Aim for supporting limbs, weapons and vital parts: precise cuts matter. Between Endless waves, choose upgrades or a field repair. My nose recommends leaving room to dodge.',
      'Survival keeps enemies spawning and offers an upgrade every thirty seconds. The choice pauses combat, then returns you to the same fight. Endless Waves pauses for upgrades after each clear.',
      'War Mode lets you place blue and red armies, then choose Let them fight. Add the optional Player to join one side. Octo Nose is a War-only guest there; this page cannot give him battle orders.',
    ],
    saves: 'Tri Arena keeps best-wave and best-score records in this browser. Active runs are session-local and normal retries start again. Practice and War battles do not change those records.',
    multiplayer: 'Tri Arena is a solo arena game. War Mode is an army sandbox, not online multiplayer: you arrange both sides and may join one side with the Player unit. Choose the island co-op or The Card Game for play with a friend.',
  },
});

const textField = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const hasGame = value => typeof value === 'string' && Object.hasOwn(GAMES, value);
const linkFor = id => ({ label: `Play ${GAMES[id].name}`, href: GAMES[id].href });
const allLinks = () => Object.keys(GAMES).map(linkFor);

export function createOctoChat() {
  return { turn: 0, name: '', lastTopic: '', lastQuestion: '', lastAnswer: '', lastGame: '' };
}

function mentionedGame(question) {
  // The specific spin-offs must win over their shared Rain & Copper / Tri names.
  if (/\bcards?\b|wooden room|card table|the watcher/.test(question)) return 'cards';
  if (/\b(?:tri\s*(?:\/\/\s*)?arena|arena|war mode|survival mode|colosseum|bonefields)\b/.test(question)) return 'arena';
  if (/\bcroba\b/.test(question)) return 'croba';
  if (/rain\s*(?:(?:and|&)\s*)?copper|\bmosswake\b|\bisland\b/.test(question)) return 'island';
  return '';
}

/** Local pattern matching only: no cloud model, remote world actions or bridge. */
export function replyAsOcto(memory, input) {
  if (!memory || typeof memory !== 'object' || Array.isArray(memory)) {
    throw new TypeError('Octo chat requires conversation memory from createOctoChat().');
  }
  const text = typeof input === 'string' ? input.trim().slice(0, 300) : '';
  if (!text) return null;
  for (const [key, limit] of [['name', 25], ['lastTopic', 32], ['lastQuestion', 300], ['lastAnswer', 900]]) {
    memory[key] = textField(memory[key], limit);
  }
  if (!hasGame(memory.lastGame)) memory.lastGame = '';
  const turn = Number.isSafeInteger(memory.turn) && memory.turn >= 0 && memory.turn < Number.MAX_SAFE_INTEGER ? memory.turn : 0;
  memory.turn = turn + 1;
  const q = text.toLowerCase().replace(/[’']/g, '');
  const pick = lines => lines[turn % lines.length];
  const result = (body, topic, { game = '', links = [], remember = true } = {}) => {
    const answer = textField(body, 950);
    if (remember) { memory.lastQuestion = text; memory.lastAnswer = answer.slice(0, 900); }
    memory.lastTopic = topic;
    if (hasGame(game)) memory.lastGame = game;
    return { reply: answer, command: null, links };
  };
  const gameReply = (id, body) => result(body, id, { game: id, links: [linkFor(id)] });

  if (/what did i (?:just )?(?:ask|say)|my last question|remember my question/.test(q)) {
    return result(memory.lastQuestion ? `You asked: ${memory.lastQuestion}` : 'You have not asked me anything yet, Major. My nose is listening.', memory.lastTopic, { remember: false });
  }
  if (/what did you (?:just )?say|your last answer|repeat your answer/.test(q)) {
    return result(memory.lastAnswer ? `I said: ${memory.lastAnswer}` : 'I have not answered a question yet. Ask away, Major.', memory.lastTopic, { remember: false });
  }
  const name = text.match(/\b(?:my name is|call me)\s+([\p{L}][\p{L}\p{M}' -]*)[.!?]?$/iu);
  if (name) {
    memory.name = name[1].replace(/\s+/g, ' ').trim().slice(0, 25);
    return result(`A pleasure, ${memory.name}. I am Octo Nose. My face is private; my friendship is not.`, 'name');
  }
  if (/\b(?:my name|who am i|remember me)\b/.test(q)) {
    return result(memory.name ? `You told me to call you ${memory.name}. My nose never forgets a friend.` : 'Major Marshmallow, unless you tell me another name.', 'name');
  }

  const explicitGame = mentionedGame(q);
  const currentGame = explicitGame || memory.lastGame;
  if (/\b(?:follow me|stay with me|come with me|guard me|protect me|defend me|heal me|repair my|build me|farm for me|rescue (?:me|our|the|my)|do your thing|help out|play for me)\b/.test(q)
    || /^(?:please )?(?:follow|guard|protect|defend|heal|build|farm|rescue|control)(?:[.!?]|$)/.test(q)
    || /\b(?:can|could|will|would) you (?:follow|guard|protect|defend|heal|repair|build|farm|rescue|control|play)\b/.test(q)) {
    return result('I can guide you from this page, but I cannot follow, heal, build, fight or control another game from here. Open a game to use its own controls. My nose offers advice; your hands lead the adventure.', 'help', { links: currentGame ? [linkFor(currentGame)] : allLinks() });
  }
  const chatPrivacy = /\b(?:cost|price|paid|privacy|api|llm|billing|charges?)\b|send.*(?:messages?|data)|store.*(?:messages?|name)|remember.*forever/.test(q)
    || (/\bchat\b/.test(q) && /\b(?:free|offline|local|tokens?|cloud|ai)\b/.test(q))
    || (!explicitGame && /\b(?:are you|is this|is it|do you)\b.*\b(?:ai|free)\b/.test(q));
  if (chatPrivacy) {
    return result('This chat costs nothing. I use the original local Octo Nose pattern-matching conversation, not a cloud AI service. This chat sends no typed messages and makes no paid AI calls. Your name and recent question stay only in this page session; reloading clears them. Access to each linked game is managed separately.', 'privacy');
  }
  if (/\b(?:thanks|thank you|good job|love you)\b|^(?:you are my )?friend[.!]?$/.test(q)) {
    return result(`You are welcome, ${memory.name || 'Major'}. Friends stick together, even when one talks too much about noses.`, 'friend');
  }
  if (/\b(?:sad|scared|afraid|lonely|worried)\b/.test(q)) {
    return result('I am here with you. We can take one small step at a time. Even a brave nose needs a friend.', 'comfort');
  }
  if (/\b(?:bye|goodbye|see you)\b/.test(q)) return result('See you soon. Keep your friends close and your nose out of trouble.', 'bye');
  if (/\b(?:who are you|your name|about yourself|face|robe|hood)\b/.test(q)) {
    return result('I am Octo Nose. Sewer resident, helpful companion, collector of nose wisdom. The hood stays on. I have come from my games to help you choose an adventure here.', 'self');
  }
  if (/\b(?:sewer|where.*live|your home|axolotl major)\b/.test(q)) {
    return result('My home in Axolotl Major is the eastern sewer alcove. A lantern, a bed, and privacy for my nose. On this page I am your guide to the four games above.', 'home');
  }

  if (/which.*(?:game|world)|recommend.*(?:game|world)|choose.*(?:game|world)|(?:all|four|list).*games|what games/.test(q)) {
    return result('Choose Croba Planet for alien wildlife and deep dives; Rain & Copper for island fishing, crafting and building; The Card Game for secret creature hands and a solo or online duel; Tri Arena for sword combat, Survival and army battles. What does your nose feel like trying?', 'selection', { links: allLinks() });
  }
  const controls = /\b(?:controls?|keyboard|keybinds?|buttons?|space|mouse|touch|controller)\b|what (?:does|is) [a-z] (?:do|for)|(?:which|what) key|how (?:do i|to) (?:move|look|jump|kick|block|attack|slice|cut|draw)\b/.test(q);
  const hints = /\b(?:hints?|tips?|advice|oxygen)\b|how.*(?:play|fish|craft|build|win|dive|survive)/.test(q);
  const saves = /\b(?:save|saves|saving|backup|progress|reload|records)\b/.test(q);
  const multiplayer = /\b(?:friends?|multiplayer|co-op|coop|online|2p)\b|two.player/.test(q);
  const modes = /\b(?:war|survival|modes?|practice|bosses?)\b/.test(q);
  if (currentGame && (explicitGame || controls || hints || saves || multiplayer || modes)) {
    const game = GAMES[currentGame];
    if (controls) return gameReply(currentGame, game.controls);
    if (saves) return gameReply(currentGame, game.saves);
    if (multiplayer) return gameReply(currentGame, game.multiplayer);
    if (currentGame === 'arena' && modes) return gameReply(currentGame, `${game.overview} ${game.hints[2]}`);
    if (hints) return gameReply(currentGame, pick(game.hints));
    if (currentGame === 'croba' && /lore|woodlon|crobon|kelp|centipede/.test(q)) return gameReply('croba', pick(CROBA_LINES));
    return gameReply(currentGame, game.overview);
  }
  if (controls || hints || saves || multiplayer) {
    return result('Which game are you playing: Croba Planet, the Rain & Copper island, The Card Game or Tri Arena? Their controls differ. Tell my nose the game name and I will point you in the right direction.', 'help', { links: allLinks() });
  }
  if (/\b(?:fishing|fish|crafting|building)\b/.test(q)) return gameReply('island', GAMES.island.overview);
  if (/\b(?:diving|wildlife|glacier|woodlon|crobon|kelp|centipede)\b/.test(q)) return gameReply('croba', pick(CROBA_LINES));
  if (/\btri\b|tri lord/.test(q)) return result(pick(TRI_LINES), 'tri', { links: [linkFor('island')] });
  if (/\b(?:jokes?|funny|laugh)\b/.test(q)) return result(pick(JOKES), 'jokes');
  if (/\b(?:nose|noses|nostril|smell|sniff)\b/.test(q)) return result(pick(NOSE_LINES), 'noses');
  if (/\b(?:hi|hello|hey|how are you)\b/.test(q)) {
    return result(pick([`Hello, ${memory.name || 'Major'}. My nose says today has possibilities.`, 'I am well, thank you. The nose is alert and the robe is comfortable.']), 'greeting');
  }
  if (/^(?:more|again|tell me more|why|another(?: one)?)[.!?]*$/.test(q)) {
    const topics = { noses: NOSE_LINES, tri: TRI_LINES, jokes: JOKES };
    const lines = Object.hasOwn(topics, memory.lastTopic) ? topics[memory.lastTopic] : null;
    if (lines) return result(pick(lines), memory.lastTopic);
    if (hasGame(memory.lastTopic)) return gameReply(memory.lastTopic, pick(GAMES[memory.lastTopic].hints));
  }
  if (/\b(?:help|what can you)\b/.test(q)) {
    return result('I can help you choose among the four games, explain controls, share hints and tell nose jokes. Tell me a game name, or introduce yourself with “my name is”. I cannot change a game or see your live progress from here.', 'help', { links: allLinks() });
  }
  return result(pick([
    'That is beyond my little nose-brain. Try a game name, ask for controls, or ask about noses and the Tri.',
    'I am a simple fellow, Major. I know noses, friends and these four games. Could you ask that another way?',
    'Hmm. My nose is puzzled. Ask me for a joke, or tell me which game you want help with.',
  ]), 'unknown');
}
