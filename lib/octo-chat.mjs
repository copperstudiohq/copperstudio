import { NOSE_LINES, CROBA_LINES, TRI_LINES, JOKES } from './octo-dialogue.mjs';
import { OCTO_KNOWLEDGE } from './octo-knowledge.mjs';
import { normalizeQuestion, findMentionedGames, rankKnowledge } from './octo-understanding.mjs';
import { readInterests, rememberInterests, recommendGames, compareGames } from './octo-advice.mjs';

/**
 * Adapted from the shared, local Octo Nose conversation in:
 * axolotl-major/dist/octo-chat.js
 * sites/rain-and-copper/dist/octo-chat.js
 * sites/tri-arena/dist/octo-chat.js
 * Original personality, topic cycling, name and question memory are retained.
 * The collection guide replaces world actions with advice and explicit links.
 */
export const OCTO_GREETING = 'Hello, friend. I am Octo Nose, your guide to these six games. Tell me what you enjoy, or ask a game question. I can compare games, explain a tricky bit, and keep up with follow-up questions. Nose jokes remain free.';
export const OCTO_PROMPTS = Object.freeze([
  'Croba Planet hints', 'Rain & Copper hints', 'Card game hints',
  'Rain Arena of Copper hints', 'Mosswake Creek hints', 'Blackroot Vale hints', 'Which game should I play?', 'Tell me a joke',
]);

// Links match app/page.tsx. Controls are checked against each game's README;
// Tri Arena's current Space jump / right-mouse kick supersede its older layout.
const GAMES = Object.freeze({
  croba: {
    name: 'Croba Planet',
    href: 'https://copperstudio.nl/games/croba-planet/',
    access: 'Croba Planet plays directly on Copperstudio, with no ChatGPT sign-in required. To bring an expedition from the original site, use its save export/import tools; saved browser data does not move between websites automatically.',
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
    access: 'The Rain & Copper island stays on its original hosted site so its co-op keeps working. It may ask you to sign in with ChatGPT. Both players need access to that game.',
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
    access: 'The Card Game stays on its original hosted site so online tables keep working. It may ask you to sign in with ChatGPT. Both players need access to that game; the room code does not replace that access.',
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
    name: 'Rain Arena of Copper',
    href: 'https://copperstudio.nl/games/tri-arena/',
    access: 'Rain Arena of Copper, also known as Tri Arena, plays directly on Copperstudio with no ChatGPT sign-in required. It is a solo game, including War Mode; records stay local to this browser and website.',
    overview: 'Rain Arena of Copper, also known as Tri Arena, is voxel sword combat in the Tri Bonefields or copper Colosseum. Choose Endless Waves, Survival, Practice or War Mode. Aim at real body parts, block, dash, jump and kick. In the Bonefields, Endless rotates through six bosses every fifth wave.',
    controls: 'Rain Arena of Copper today: WASD or arrow keys move; mouse aims. Left mouse slices vertically by default; A/D while attacking makes horizontal cuts, and V forces vertical cuts. F or J also attacks. Hold E or K to block, Shift to dash, Space to jump, and right mouse to kick. Escape pauses. Touch buttons are available.',
    hints: [
      'Watch the amber attack warnings, then block or move clear. Aim for supporting limbs, weapons and vital parts: precise cuts matter. Between Endless waves, choose upgrades or a field repair. My nose recommends leaving room to dodge.',
      'Survival keeps enemies spawning and offers an upgrade every thirty seconds. The choice pauses combat, then returns you to the same fight. Endless Waves pauses for upgrades after each clear.',
      'War Mode lets you place blue and red armies, then choose Let them fight. Add the optional Player to join one side. Octo Nose is a War-only guest there; this page cannot give him battle orders.',
    ],
    saves: 'Rain Arena of Copper keeps best-wave and best-score records in this browser. Active runs are session-local and normal retries start again. Practice and War battles do not change those records.',
    multiplayer: 'Rain Arena of Copper is a solo arena game. War Mode is an army sandbox, not online multiplayer: you arrange both sides and may join one side with the Player unit. Choose the island co-op or The Card Game for play with a friend.',
  },
  sandbox: {
    name: 'Rain & Copper: Mosswake Creek',
    href: 'https://copperstudio.nl/games/mosswake-creek/',
    access: 'Mosswake Creek plays directly on Copperstudio, with no ChatGPT sign-in required. Sandbox edits last for this tab session. Creek Watch has named local save slots that you can load from the same browser profile and game address.',
    overview: 'Mosswake Creek is a 2D falling-sand sandbox around the Rain & Copper pond. Paint flowing water, falling copper and sand, solid basalt, scenery and creatures across a five-screen map. Play Sandbox for free experimentation, or Creek Watch for a separate endless night-defense game.',
    controls: 'Mosswake Creek Sandbox: drag or tap to paint; 1–9 pick tools, B selects Break, E selects eraser, and Space pauses. A/D pan the map; when the quarry has focus, arrow keys aim and Enter places, with Shift for finer aim. In Creek Watch, A/D, arrow keys or tapping the ground move; E or the action button uses nearby stations to hire, build, repair or shop. F or Swing attacks with your equipped weapon. At the signal tower by day, use Upgrade tower for 100 copper, then Enter tower to visit its dining room. Near one of the four chairs, press E or Sit to sit down; E or movement stands up. Leave tower room returns outside.',
    hints: [
      'Copper and sand fall, water flows, basalt makes solid walls, and water extinguishes embers. Wet copper gradually turns green. Pick Normal or Tri variants and a Materials, Creatures or Scenery palette to experiment without gathering resources.',
      'Use Break with a 1 px brush to chip tiny pieces from terrain and scenery. The eraser clears rubble or removes whole placed objects. The rest of the five-screen quarry keeps simulating even while it is outside your view.',
      'In Creek Watch, use either tent map marker to reach a group of two recruiting camps. New hires fill both banks evenly. By day, guards carry loose copper to you and drop it at your feet for your character to collect. They keep carried copper until they can deliver it safely, possibly the next day. Repair defenses against Tri Opus and save your watch in a named slot.',
    ],
    saves: 'Sandbox edits are tab-only and restart on reload. Creek Watch has named local save slots: use Save slots during a watch to create or update one, then choose Creek Watch saves in the main menu and Load to resume its saved day or raid, tower, defenses and purchased gear, plus carried copper and delivered piles, the tower upgrade, your room location and seated chair. Slots stay in the same browser profile and game address. Menu keeps both modes in memory and freezes the inactive one. Reset restarts only the selected mode.',
    multiplayer: 'Mosswake Creek is a single-player game with two separate modes, Sandbox and Creek Watch. It has no co-op or online rooms. For a friend, choose the Rain & Copper island on the same Wi-Fi or The Card Game for an online duel.',
  },
  blackroot: {
    name: 'Blackroot Vale',
    href: 'https://copperstudio.nl/games/blackroot-vale/',
    access: 'Blackroot Vale plays directly on Copperstudio with no ChatGPT sign-in required. Its world, artwork and Blub voice clips are bundled with the game; no game backend is needed.',
    overview: 'Blackroot Vale is a solo first-person dark-fantasy adventure. Explore Thornwick’s furnished houses, the Blackroot Forest and South Field. Hide from the Opsing Rider, escape The Under Neath with Blub, and find the ruined tower, throne room and Ashen Battlefield.',
    controls: 'Blackroot Vale: WASD moves; drag to look. Up/down arrows move and left/right arrows turn. Hold Shift or the touch Sprint button to run. E or the door action button interacts with doors, gates and nearby Blub. Village, Forest and Field move to landmarks between hunts. Sound changes volume and mute.',
    hints: [
      'When the Opsing Rider warning appears, sprint into a house and stay inside until he leaves. Three sword strikes send you to The Under Neath.',
      'Open the cell gate with E and speak to Blub. Follow the branching halls to the tower and avoid the guards’ spear strikes. The service stair reaches the Ashen Battlefield; its lit road marker returns to Thornwick.',
      'Once you and Blub escape into the same area, he follows through open doors and between landmarks. E near him plays his bundled goblin voice, with subtitles even while muted.',
    ],
    saves: 'Blackroot Vale keeps sound volume and mute preferences in this browser. The adventure itself is session-only and starts again on reload; it has no named expedition saves or progress export.',
    multiplayer: 'Blackroot Vale is a solo adventure. Blub is an in-game companion, not an online player. Choose the Rain & Copper island or The Card Game for multiplayer.',
  },
});

const textField = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const hasGame = value => typeof value === 'string' && Object.hasOwn(GAMES, value);
const linkFor = id => ({ label: `Play ${GAMES[id].name}`, href: GAMES[id].href });
const allLinks = () => Object.keys(GAMES).map(linkFor);

export function createOctoChat() {
  return {
    turn: 0, name: '', lastTopic: '', lastQuestion: '', lastAnswer: '', lastGame: '',
    pendingQuestion: '', lastFact: '', shownFacts: [], lastOptions: [], likes: [], dislikes: [],
  };
}

function ordinalGame(question, options) {
  const ordinal = /^(?:(?:what about|tell me about|i choose|i mean|choose|pick) )?(?:the )?(first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|sixth|6th)(?: one| game| option)?(?: please)?$/.exec(question)?.[1];
  const index = ['first 1st', 'second 2nd', 'third 3rd', 'fourth 4th', 'fifth 5th', 'sixth 6th'].findIndex(words => ordinal && words.includes(ordinal));
  return index >= 0 ? options[index] || '' : '';
}

function questionIntent(question) {
  if (/\b(?:controls?|keyboard|keybinds?|buttons?|space|mouse|touch|controller)\b|what (?:does|is) [a-z] (?:do|for)|(?:which|what) key|how (?:do i|to) (?:move|look|jump|kick|block|attack|slice|cut|draw)\b/.test(question)) return 'controls';
  if (/\b(?:save|saves|saving|backup|progress|reload|records)\b/.test(question)) return 'saves';
  if (/\b(?:friends?|multiplayer|co-op|co op|coop|online|2p)\b|two.player/.test(question)) return 'multiplayer';
  if (/\b(?:hints?|tips?|advice)\b|how.*(?:play|fish|craft|build|win|beat|dive|survive)/.test(question)) return 'hints';
  return '';
}

/** Local pattern matching only: no cloud model, remote world actions or bridge. */
export function replyAsOcto(memory, input) {
  if (!memory || typeof memory !== 'object' || Array.isArray(memory)) {
    throw new TypeError('Octo chat requires conversation memory from createOctoChat().');
  }
  const text = typeof input === 'string' ? input.trim().slice(0, 300) : '';
  if (!text) return null;
  for (const [key, limit] of [['name', 25], ['lastTopic', 32], ['lastQuestion', 300], ['lastAnswer', 900], ['pendingQuestion', 300], ['lastFact', 64]]) {
    memory[key] = textField(memory[key], limit);
  }
  if (!hasGame(memory.lastGame)) memory.lastGame = '';
  memory.lastOptions = Array.isArray(memory.lastOptions) ? memory.lastOptions.filter(hasGame).slice(0, Object.keys(GAMES).length) : [];
  memory.shownFacts = Array.isArray(memory.shownFacts) ? memory.shownFacts.filter(id => typeof id === 'string').map(id => id.slice(0, 64)).slice(-12) : [];
  rememberInterests(memory, { likes: [], dislikes: [] });
  const turn = Number.isSafeInteger(memory.turn) && memory.turn >= 0 && memory.turn < Number.MAX_SAFE_INTEGER ? memory.turn : 0;
  memory.turn = turn + 1;
  let q = normalizeQuestion(text);
  const pick = lines => lines[turn % lines.length];
  const result = (body, topic, { game = '', links = [], remember = true } = {}) => {
    const answer = textField(body, 950);
    if (remember) { memory.lastQuestion = text; memory.lastAnswer = answer.slice(0, 900); }
    memory.lastTopic = topic;
    if (hasGame(game)) memory.lastGame = game;
    return { reply: answer, command: null, links };
  };
  const gameReply = (id, body) => result(body, id, { game: id, links: [linkFor(id)] });
  const factReply = (entry) => {
    memory.lastFact = entry.id;
    memory.shownFacts = [...memory.shownFacts.filter(id => id !== entry.id), entry.id].slice(-12);
    return gameReply(entry.game, entry.answer);
  };
  const clarify = (question, games = Object.keys(GAMES)) => {
    memory.pendingQuestion = question.slice(0, 300);
    memory.lastOptions = games;
    return result(`Which game do you mean: ${games.map(id => GAMES[id].name).join(', ')}? Tell me the name and I will answer your question.`, 'clarify', { links: games.map(linkFor) });
  };

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
  if (/\bforget my name\b/.test(q)) {
    memory.name = '';
    return result('Your name is forgotten. You can introduce yourself again whenever you like, friend.', 'name');
  }
  if (/\b(?:my name|who am i|remember me)\b/.test(q)) {
    return result(memory.name ? `You told me to call you ${memory.name}. My nose never forgets a friend.` : 'Major Marshmallow, unless you tell me another name.', 'name');
  }

  const mentioned = findMentionedGames(q);
  const otherGame = /^(?:what about |tell me about )?(?:the )?other(?: one| game)?$/.test(q) && memory.lastOptions.length === 2
    ? memory.lastOptions.find(id => id !== memory.lastGame) : '';
  const explicitGame = mentioned[0] || ordinalGame(q, memory.lastOptions) || otherGame;
  const currentGame = explicitGame || memory.lastGame;
  if (memory.pendingQuestion && explicitGame && !questionIntent(q) && q.split(/\s+/).length <= 9) {
    q = `${normalizeQuestion(memory.pendingQuestion)} ${q}`;
    memory.pendingQuestion = '';
  } else if (explicitGame || questionIntent(q)) {
    memory.pendingQuestion = '';
  }
  const blubFollowingQuestion = /\bblub\b.*\bfollow me\b/.test(q)
    && /^(?:how|when|why|does|will|can|could|would)\b/.test(q) && !/\byou\b/.test(q);
  const actionQuestion = blubFollowingQuestion ? q.replace(/\bfollow me\b/g, 'follow the player') : q;
  if (/\b(?:follow me|stay with me|come with me|guard me|protect me|defend me|heal me|repair my|build me|farm for me|rescue (?:me|our|the|my)|do your thing|help out|play for me)\b/.test(actionQuestion)
    || /^(?:please )?(?:follow|guard|protect|defend|heal|build|farm|rescue|control)(?:[.!?]|$)/.test(q)
    || /\b(?:can|could|will|would) you (?:follow|guard|protect|defend|heal|repair|build|farm|rescue|control|play)\b/.test(q)) {
    return result('I can guide you from this page, but I cannot follow, heal, build, fight or control another game from here. Open a game to use its own controls. My nose offers advice; your hands lead the adventure.', 'help', { game: currentGame, links: currentGame ? [linkFor(currentGame)] : allLinks() });
  }
  const gameCurrencyQuestion = currentGame && /\b(?:coins?|copper)\b/.test(q) && !/\b(?:chat|octo|ai|api)\b/.test(q);
  const chatPrivacy = /\b(?:privacy|api|llm|billing|charges?)\b|send.*(?:messages?|data)|store.*(?:messages?|name)|remember.*forever/.test(q)
    || (!gameCurrencyQuestion && /\b(?:cost|price|paid)\b/.test(q))
    || (/\bchat\b/.test(q) && /\b(?:free|offline|local|tokens?|cloud|ai)\b/.test(q))
    || (!explicitGame && /\b(?:are you|is this|is it|do you)\b.*\b(?:ai|free)\b/.test(q));
  if (chatPrivacy) {
    return result('This chat costs nothing. I use local pattern-matching conversation and a game knowledge library, not a cloud AI service. This chat sends no typed messages and makes no paid AI calls. Your name, interests and recent chat context stay only in this page session; reloading clears them.', 'privacy');
  }
  const accessQuestion = /\b(?:sign in|log in|login|accounts?|game access)\b/.test(q)
    || (/\b(?:public|private|hosted|hosting|original sites?|copperstudio|chatgpt)\b/.test(q) && (explicitGame || /\b(?:games?|sites?|website)\b/.test(q)));
  if (accessQuestion) {
    if (currentGame && !/\b(?:all|which|games)\b/.test(q)) return gameReply(currentGame, GAMES[currentGame].access);
    return result('Four games play directly on Copperstudio without ChatGPT sign-in: Croba Planet, Rain Arena of Copper (also known as Tri Arena), Mosswake Creek and Blackroot Vale. The Rain & Copper island and The Card Game stay on their original hosted sites to keep multiplayer working; they may ask you to sign in with ChatGPT.', 'access', { links: allLinks() });
  }
  if (/what (?:is|are|s) (?:my|the current)|how much.*(?:do i have|have i got|left|remaining)|where am i|can you (?:see|read|check) my/.test(q)
    && /oxygen|air|health|score|inventory|location|position|hand|cards?|progress/.test(q)) {
    return result('I cannot see your current game, secret hand or live stats. Check the game HUD, inventory or save menu for those. Tell me what it shows and I can explain the rules or suggest a next step.', 'live-state', { game: currentGame, links: currentGame ? [linkFor(currentGame)] : [] });
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
    return result('My home in Axolotl Major is the eastern sewer alcove. A lantern, a bed, and privacy for my nose. On this page I am your guide to the six games above.', 'home');
  }
  if (/\b(?:jokes?|funny|laugh)\b/.test(q)) return result(pick(JOKES), 'jokes');
  if (/\b(?:hi|hello|hey|how are you)\b/.test(q)) {
    return result(pick([`Hello, ${memory.name || 'Major'}. My nose says today has possibilities.`, 'I am well, thank you. The nose is alert and the robe is comfortable.']), 'greeting');
  }
  if (!explicitGame && /\b(?:nose|noses|nostril|smell|sniff)\b/.test(q) && !/\b(?:where|how|war|guest|orders|allies|companion)\b/.test(q)) {
    return result(pick(NOSE_LINES), 'noses');
  }
  if (currentGame !== 'cards' && /^(?:(?:what is|tell me about) )?(?:the )?tri$/.test(q)) {
    return result(pick(TRI_LINES), 'tri', { links: [linkFor('island')] });
  }

  const preferenceStatement = /\bi (?:like|love|enjoy|want|prefer|hate|dislike|do not like|dont like)\b|looking for|something (?:peaceful|relaxing|calm|quiet)/.test(q);
  const choosing = /\b(?:which|what) (?:(?:is|are) )?(?:the )?(?:best |browser )?(?:games?|worlds?)\b|recommend.*(?:game|world)|choose.*(?:game|world)|(?:all|five|six|list).*games|what should i play|help me pick/.test(q);
  const remoteFriend = !explicitGame && /\b(?:friends?|multiplayer|online)\b/.test(q) && /another|different|remote|far away|not.*same|anywhere/.test(q);
  if (mentioned.length > 1 && /compare|difference|versus|\bvs\b|better|\bor\b/.test(q)) {
    memory.lastOptions = mentioned;
    return result(compareGames(mentioned), 'comparison', { game: mentioned[0], links: mentioned.map(linkFor) });
  }
  if (preferenceStatement) {
    if (/\b(?:actually|instead|changed my mind|rather)\b/.test(q)) {
      memory.likes = [];
      memory.dislikes = [];
    }
    rememberInterests(memory, readInterests(q));
  }
  if (preferenceStatement || choosing || remoteFriend) {
    const recommendation = recommendGames(q, memory);
    if (recommendation) {
      memory.lastOptions = recommendation.games;
      return result(recommendation.reply, 'recommendation', { game: recommendation.games[0], links: recommendation.games.map(linkFor) });
    }
  }
  if (choosing) {
    memory.lastOptions = Object.keys(GAMES);
    return result('Choose Croba Planet for alien wildlife and deep dives; Rain & Copper for island fishing, crafting and building; The Card Game for secret creature hands and a solo or online duel; Rain Arena of Copper for sword combat, Survival and army battles; Mosswake Creek for painting materials, creative building and endless Creek Watch defense; Blackroot Vale for a dark-fantasy journey and an escape with Blub. What does your nose feel like trying?', 'selection', { links: allLinks() });
  }
  const intent = questionIntent(q);
  const controls = intent === 'controls';
  const hints = intent === 'hints';
  const saves = intent === 'saves';
  const multiplayer = intent === 'multiplayer';
  const modes = /\b(?:war|survival|modes?|practice|bosses?)\b/.test(q);
  let ranked = rankKnowledge(q, OCTO_KNOWLEDGE, currentGame || undefined);
  if (!ranked.length && !explicitGame && !controls && !saves && !multiplayer) ranked = rankKnowledge(q, OCTO_KNOWLEDGE);
  const relevant = ranked[0]?.entry;
  // A specific known fact wins over general keywords such as “Tri” or “win”.
  if (relevant && !controls && !saves && !multiplayer) {
    if (relevant.game === currentGame || ranked.length === 1 || ranked[0].score > (ranked.find(item => item.entry.game !== relevant.game)?.score || 0) * 1.5) {
      return factReply(relevant);
    }
    return clarify(text, [...new Set(ranked.slice(0, 6).map(item => item.entry.game))]);
  }
  if (currentGame && (explicitGame || controls || hints || saves || multiplayer || modes)) {
    const game = GAMES[currentGame];
    if (controls) return gameReply(currentGame, game.controls);
    if (saves) return gameReply(currentGame, game.saves);
    if (multiplayer) return gameReply(currentGame, game.multiplayer);
    if (currentGame === 'arena' && modes) return gameReply(currentGame, `${game.overview} ${game.hints[2]}`);
    if (hints) {
      const next = OCTO_KNOWLEDGE.find(entry => entry.game === currentGame && !memory.shownFacts.includes(entry.id));
      if (next) return factReply(next);
      return gameReply(currentGame, game.hints[0]);
    }
    if (currentGame === 'croba' && /lore|woodlon|crobon|kelp|centipede/.test(q)) return gameReply('croba', pick(CROBA_LINES));
    return gameReply(currentGame, game.overview);
  }
  if (controls || hints || saves || multiplayer) {
    return clarify(text);
  }
  if (/\b(?:fishing|fish|crafting|building)\b/.test(q)) return gameReply('island', GAMES.island.overview);
  if (/\b(?:diving|wildlife|glacier|woodlon|crobon|kelp|centipede)\b/.test(q)) return gameReply('croba', pick(CROBA_LINES));
  if (/\btri\b|tri lord/.test(q)) return result(pick(TRI_LINES), 'tri', { links: [linkFor('island')] });
  if (/^(?:more|again|tell me more(?: about (?:it|that))?|why(?: that one)?|another(?: one)?|what about (?:it|that(?: one)?))[.!?]*$/.test(q)) {
    if (memory.lastTopic === 'recommendation') {
      const advice = recommendGames(q, memory);
      if (advice) return result(`You mentioned ${memory.likes.join(' and ') || 'what you want to avoid'}. ${advice.reply}`, 'recommendation', { game: advice.games[0], links: advice.games.map(linkFor) });
    }
    const topics = { noses: NOSE_LINES, tri: TRI_LINES, jokes: JOKES };
    const lines = Object.hasOwn(topics, memory.lastTopic) ? topics[memory.lastTopic] : null;
    if (lines) return result(pick(lines), memory.lastTopic);
    if (hasGame(memory.lastTopic)) {
      const next = OCTO_KNOWLEDGE.find(entry => entry.game === memory.lastTopic && !memory.shownFacts.includes(entry.id));
      if (next) return factReply(next);
      return gameReply(memory.lastTopic, GAMES[memory.lastTopic].hints[0]);
    }
  }
  if (/\b(?:help|what can you)\b/.test(q)) {
    return result('I can compare the six games, recommend one from what you enjoy, explain controls and specific game rules, and tell nose jokes. Ask a follow-up without repeating the game name. Try “I want a creative sandbox”, “How do I refill oxygen in Croba?” or “How do I survive Creek Watch?”.', 'help', { links: allLinks() });
  }
  return result('I do not have a reliable answer to that yet. I know these six games, their controls and rules. Tell me which game and what you are trying to do, or ask me to compare two games. My nose would rather ask than make up a fact.', 'unknown');
}
