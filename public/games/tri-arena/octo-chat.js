import { NOSE_LINES, CROBA_LINES, TRI_LINES } from './octo-dialogue.js';

const JOKES = Object.freeze([
  'Why did my nose join the army? It wanted to lead the sniff-antry.',
  'I tried to write a book about noses. The ending was right under my nose.',
  'A nose walked into a workshop. It said: I smell a good idea.',
]);
const textField = (value, limit) => typeof value === 'string' ? value.slice(0, limit) : '';
const liveLines = (source, key, fallback) => {
  const lines = source?.[key];
  return Array.isArray(lines) && lines.length > 0 && lines.length <= 128
    && lines.every(line => typeof line === 'string' && line.trim() && line.length <= 500) ? lines : fallback;
};

/** Original local conversation memory: no network, API keys, downloads or billing. */
export function createOctoChat() {
  return { turn: 0, name: '', lastTopic: '', lastQuestion: '', lastAnswer: '' };
}

/**
 * Source-compatible offline replies, adapted to the arena's real capabilities.
 * @returns {{reply:string, command:null|'follow'|'guard'|'auto'}|null}
 */
export function replyAsOcto(memory, input, context = {}) {
  if (!memory || typeof memory !== 'object' || Array.isArray(memory)) throw new TypeError('Octo chat requires conversation memory from createOctoChat().');
  const text = String(input ?? '').trim().slice(0, 300);
  if (!text) return null;
  for (const [key, limit] of [['name', 25], ['lastTopic', 16], ['lastQuestion', 300], ['lastAnswer', 500]]) memory[key] = textField(memory[key], limit);
  const turn = Number.isSafeInteger(memory.turn) && memory.turn >= 0 && memory.turn < Number.MAX_SAFE_INTEGER ? memory.turn : 0;
  memory.turn = turn + 1;
  const q = text.toLowerCase().replace(/[’']/g, '');
  const nose = liveLines(context.dialogueSource, 'noseLines', NOSE_LINES);
  const tri = liveLines(context.dialogueSource, 'triLines', TRI_LINES);
  const croba = liveLines(context.dialogueSource, 'crobaLines', CROBA_LINES);
  const pick = lines => lines[turn % lines.length];
  const result = (reply, topic, command = null, remember = true) => {
    if (remember) { memory.lastQuestion = text; memory.lastAnswer = reply.slice(0, 500); }
    memory.lastTopic = topic;
    return { reply: `Octo Nose: “${reply}”`, command };
  };
  const order = command => {
    const player = context.player ?? context.state?.player, actor = context.actor;
    if (!context.controlsPlayer || !(player?.hp > 0) || !(actor?.hp > 0) || !player.team || actor.team !== player.team) {
      return result(context.controlsPlayer && actor?.team !== player?.team
        ? 'I can chat, but we are on opposing armies. I cannot take your battle orders.'
        : 'I can chat, but only a living Player on my own side can give me battle orders.', 'command');
    }
    const replies = {
      follow: `I will stay with you and help when I can. Lead on, ${memory.name || 'Major'}.`,
      guard: 'I will stay close, watch for enemies and defend our side. Nobody sneaks past this nose.',
      auto: 'I will follow our army, fight nearby foes and patch allies between attacks. My nose knows useful work.',
    };
    return result(replies[command], 'command', command);
  };

  if (/what did i (?:just )?(?:ask|say)|my last question|remember my question/.test(q)) return result(memory.lastQuestion
    ? `You asked: ${memory.lastQuestion}` : 'You have not asked me anything yet, Major. My nose is listening.', 'memory', null, false);
  if (/what did you (?:just )?say|your last answer|repeat your answer/.test(q)) return result(memory.lastAnswer
    ? `I said: ${memory.lastAnswer}` : 'I have not answered a question yet. Ask away, Major.', 'memory', null, false);
  const name = text.match(/\b(?:my name is|call me)\s+([a-z][a-z -]{0,24})[.!?]?$/i);
  if (name) {
    memory.name = name[1].trim();
    return result(`A pleasure, ${memory.name}. I am Octo Nose. My face is private; my friendship is not.`, 'name');
  }
  if (/\b(?:my name|who am i|remember me)\b/.test(q)) return result(memory.name
    ? `You told me to call you ${memory.name}. My nose never forgets a friend.` : 'Major Marshmallow, unless you tell me another name.', 'name');
  if (/\b(?:follow|stay with|come with)\b/.test(q)) return order('follow');
  if (/\b(?:guard|protect|defend)\b/.test(q)) return order('guard');
  if (/\b(?:smart helper|auto|do your thing|help out)\b/.test(q)) return order('auto');
  if (/\b(?:rescue|save|free)\b/.test(q) && /\b(?:axol|axo|captiv|prison|them|friends)/.test(q)
    || /\b(?:captured|prisoners|where.*axol|lost.*axol)\b/.test(q)) {
    return result('This arena has no captive-axolotl rescue jobs. Those belong in Axolotl Major. Here I can defend my army and help its allies.', 'arena');
  }
  if (/\b(?:farm|farms|farming|grow food|tend crops|food|hungry|eat)\b/.test(q)) return result(
    'There are no farms or food stores in this arena. I can follow allies, fight with my hammer and patch their health between attacks.', 'arena');
  if (/\b(?:build|building|upgrade|improve|blueprint)\b/.test(q)) return result(
    'War Mode has no town construction. Place your army before battle; a Player joins with every permanent upgrade already at maximum.', 'arena');
  if (/\b(?:croba|woodlon|crobon|kelp|centipede)\b/.test(q)) return result(pick(croba), 'croba');
  if (/\btri\b|tri lord|rain and copper/.test(q)) return result(pick(tri), 'tri');
  if (/\b(?:nose|noses|nostril|smell|sniff)\b/.test(q)) return result(pick(nose), 'noses');
  if (/\b(?:joke|funny|laugh)\b/.test(q)) return result(pick(JOKES), 'jokes');
  if (/\b(?:shells|money|rich|cost)\b/.test(q)) return result(
    'This chat costs nothing and runs locally. War Mode uses placed armies, not town shells.', 'arena');
  if (/\b(?:heal|health|patch|repair)\b/.test(q)) return result(
    'I patch allied health at 3 per second within seven metres, after eight seconds without damage. An allied Player comes first. I cannot regrow severed parts.', 'help');
  if (/\b(?:hammer|fight|attack|weapon)\b/.test(q)) return result(
    'I warn before swinging my builder hammer at the opposing army. A severed hammer or missing right hand stops that swing; either hand can still help patch an ally.', 'help');
  if (/\b(?:who are you|your name|about yourself|face|robe|hood)\b/.test(q)) return result(
    'I am Octo Nose. Sewer resident, helpful companion, collector of nose wisdom. The hood stays on.', 'self');
  if (/\b(?:sewer|where.*live|your home)\b/.test(q)) return result(
    'My home in Axolotl Major is the eastern sewer alcove. A lantern, a bed, and privacy for my nose. I am visiting the arena now.', 'home');
  if (/\b(?:help|what can you|controls)\b/.test(q)) return result(context.controlsPlayer
    ? 'Move with WASD, jump with Space, dash with Shift, swing with left click, kick with right click and block with E. I follow, fight and patch my own side.'
    : 'Place one Player on your army to join the battle, or watch both sides fight. I follow my allies, use my hammer and patch health between attacks.', 'help');
  if (/\b(?:hi|hello|hey|how are you)\b/.test(q)) return result(pick([
    `Hello, ${memory.name || 'Major'}. My nose says today has possibilities.`,
    'I am well, thank you. The nose is alert and the robe is comfortable.',
  ]), 'greeting');
  if (/\b(?:thanks|thank you|good job|love you|friend)\b/.test(q)) return result(
    `You are welcome, ${memory.name || 'Major'}. Friends stick together, even when one talks too much about noses.`, 'friend');
  if (/\b(?:sad|scared|afraid|lonely|worried)\b/.test(q)) return result(
    'I am here with you. We can take one small step at a time. Even a brave nose needs a friend.', 'comfort');
  if (/\b(?:bye|goodbye|see you)\b/.test(q)) return result(
    'See you soon. Keep your friends close and your nose out of trouble.', 'bye');
  if (/\b(?:more|again|tell me more|why)\b/.test(q) && ['noses', 'croba', 'tri'].includes(memory.lastTopic)) {
    const topic = memory.lastTopic; return result(pick(topic === 'croba' ? croba : topic === 'tri' ? tri : nose), topic);
  }
  return result(pick([
    'That is beyond my little nose-brain. Try asking about noses, Croba Planet, the Tri, or how I can help in this arena.',
    'I am a simple fellow, Major. I know noses, friends and our army. Could you ask that another way?',
    'Hmm. My nose is puzzled. Ask me for a joke, or ask how I follow, guard and patch allies.',
  ]), 'unknown');
}
