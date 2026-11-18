const SHORTHAND = {
  u: 'you', ur: 'your', howdo: 'how do', howdoi: 'how do i', howto: 'how to', whatis: 'what is',
  cant: 'cannot', dont: 'do not', wont: 'will not', im: 'i am', ive: 'i have', whats: 'what is',
  wheres: 'where is', hows: 'how is', pls: 'please', plz: 'please', thx: 'thanks', wanna: 'want to',
  cobra: 'croba', crobra: 'croba', crobaplanet: 'croba planet', triarena: 'tri arena', triareana: 'tri arena',
  rainandcopper: 'rain and copper', raincopper: 'rain and copper', cardgame: 'card game', octonose: 'octo nose',
  peapel: 'people', peaple: 'people', bulding: 'building', bilding: 'building', controlls: 'controls',
  areana: 'arena', arnea: 'arena', plannet: 'planet', pratice: 'practice', practise: 'practice', armour: 'armor',
  mosswakecreek: 'mosswake creek', creekwatch: 'creek watch', fallingsand: 'falling sand',
};
const CONTRACTIONS = { "can't": 'cannot', "don't": 'do not', "won't": 'will not', "i'm": 'i am', "i've": 'i have', "what's": 'what is', "where's": 'where is', "how's": 'how is', "it's": 'it is', "isn't": 'is not', "doesn't": 'does not' };
const DOMAIN_WORDS = 'croba arena planet controls building fishing oxygen health warmth diving crafting portals creatures weapons upgrades bosses island inventory lantern attack blocking jumping tokens secret rescue centipede glacier forest squid multiplayer controller practice copper survival horizontal vertical fortress reactor creature bestiary sandbox mosswake creek palisades guards basalt patina ichor materials'.split(' ');
const KNOWN_WORDS = new Set([...DOMAIN_WORDS, ...'control guard black shore store plane place names other after their there these those where which hello'.split(' ')]);

function oneEditApart(left, right) {
  if (Math.abs(left.length - right.length) > 1) return false;
  if (left.length === right.length) {
    const changed = [...left].flatMap((letter, index) => letter === right[index] ? [] : [index]);
    return changed.length === 1 || (changed.length === 2 && changed[1] === changed[0] + 1 && left[changed[0]] === right[changed[1]] && left[changed[1]] === right[changed[0]]);
  }
  const [shorter, longer] = left.length < right.length ? [left, right] : [right, left];
  let offset = 0;
  for (let index = 0; index < shorter.length; index++) {
    if (shorter[index] !== longer[index + offset] && (offset++ || shorter[index] !== longer[index + offset])) return false;
  }
  return true;
}

/** Routing text only: keep the original input when extracting a person's name. */
export function normalizeQuestion(input) {
  if (typeof input !== 'string') return '';
  const text = input.slice(0, 1200).normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\b[a-z]+'[a-z]+\b/g, (word) => CONTRACTIONS[word] ?? word.replace("'", ''))
    .replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\bco op\b/g, 'coop').replace(/\bwi fi\b/g, 'wifi').replace(/\bsand box\b/g, 'sandbox');
  return text.trim().split(/\s+/).map((word) => {
    if (SHORTHAND[word]) return SHORTHAND[word];
    if (word.length < 5 || KNOWN_WORDS.has(word)) return word;
    const matches = DOMAIN_WORDS.filter((candidate) => candidate.slice(0, 2) === word.slice(0, 2) && oneEditApart(word, candidate));
    return matches.length === 1 ? matches[0] : word;
  }).join(' ').replace(/\s+/g, ' ').trim();
}

/** Returns mentions in catalogue order; a franchise name alone does not imply its island when discussing cards. */
export function findMentionedGames(input) {
  const text = normalizeQuestion(input);
  const cards = /\b(?:cards?|card game|card duel|watcher)\b/.test(text);
  const franchise = /\brain (?:and )?copper\b/.test(text);
  const comparison = /\b(?:vs|versus|or|between|compare|rather than)\b/.test(text);
  const arena = /\b(?:tri arena|arena|bonefields|boss practice|war mode|army sandbox)\b/.test(text);
  const sandbox = /\b(?:mosswake|creek watch|falling sand)\b/.test(text)
    || /\brain (?:and )?copper (?:the )?sandbox\b/.test(text)
    || (/\bsandbox\b/.test(text) && !/\b(?:tri arena(?: war mode)?|army|war mode) sandbox\b/.test(text) && (!arena || comparison));
  const withoutEditionTitle = text.replace(/\brain (?:and )?copper (?:the )?(?:card game|cards?|card duel|sandbox|mosswake(?: creek)?)\b/g, '');
  const separateIsland = /\bisland\b/.test(text) || (franchise && comparison && /\brain (?:and )?copper\b/.test(withoutEditionTitle));
  const mentions = [];
  if (/\b(?:croba|icebound|violet spruce)\b/.test(text)) mentions.push('croba');
  if (separateIsland || (franchise && !cards && !sandbox)) mentions.push('island');
  if (cards) mentions.push('cards');
  if (arena) mentions.push('arena');
  if (sandbox) mentions.push('sandbox');
  return mentions;
}

const STOP_WORDS = new Set(('a an the i you your me my we our he she they it its this that these those how what which when where why who do does did is are am was were be been to of for in on at with and or from by as can could should would will have has had get got tell about please help need want know some more very really just not no cannot play game games use using make work works if happen happens then else ' +
  'croba planet rain copper arena island card cards sandbox mosswake creek').split(' '));
const FORMS = { air: 'oxygen', breathe: 'oxygen', breathing: 'oxygen', breath: 'oxygen', fishing: 'fish', winning: 'win', bosses: 'boss', building: 'build', crafting: 'craft', saving: 'save', saved: 'save', hunger: 'hunger', hungry: 'hunger', starving: 'hunger', practise: 'practice', practising: 'practice', chasing: 'chase', hp: 'health' };
function contentWords(text) {
  return normalizeQuestion(text).split(' ').filter((word) => word.length > 1 && !STOP_WORDS.has(word)).map((word) =>
    FORMS[word] ?? (word.length > 4 && word.endsWith('ies') ? word.slice(0, -3) + 'y' : word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word));
}

const KNOWLEDGE_CACHE = new WeakMap();
function prepareKnowledge(entries) {
  const cached = KNOWLEDGE_CACHE.get(entries);
  if (cached) return cached;
  const prepared = entries.map((entry) => {
    const keywords = entry.keywords.map(contentWords).filter((words) => words.length);
    const questionWords = [...new Set(contentWords(entry.question))];
    const words = new Set([...questionWords, ...keywords.flat()]);
    const strong = new Set(keywords.filter((words) => words.length === 1).flat());
    const keywordWords = new Set(keywords.flat());
    const phrases = [...new Set(keywords.filter((words) => words.length > 1).map((words) => words.join(' ')))];
    return { entry, questionWords, strong, keywordWords, phrases, words };
  });
  const frequency = new Map();
  for (const { words } of prepared) for (const word of words) frequency.set(word, (frequency.get(word) ?? 0) + 1);
  const result = { prepared, frequency };
  if (Object.isFrozen(entries) && entries.every((entry) => Object.isFrozen(entry) && Object.isFrozen(entry.keywords))) KNOWLEDGE_CACHE.set(entries, result);
  return result;
}

/** Confidence floor is 3 evidence points, before coverage. Ties are deliberately retained for clarification. */
export function rankKnowledge(question, entries, game) {
  const query = [...new Set(contentWords(question))];
  if (!query.length) return [];
  const querySet = new Set(query);
  const phrase = ` ${contentWords(question).join(' ')} `;
  const { prepared, frequency } = prepareKnowledge(entries);
  const weight = (word) => 1 + 1 / (frequency.get(word) ?? 1);
  return prepared.filter(({ entry }) => !game || entry.game === game).map(({ entry, questionWords, strong, keywordWords, phrases }) => {
    const matched = query.filter((word) => keywordWords.has(word));
    const questionMatches = questionWords.filter((word) => querySet.has(word));
    let evidence = matched.reduce((sum, word) => sum + (strong.has(word) ? 3 : 1) * weight(word), 0);
    evidence += questionMatches.reduce((sum, word) => sum + weight(word), 0);
    for (const match of phrases.filter((match) => phrase.includes(` ${match} `))) {
      evidence += 4 + Math.min(3, match.split(' ').length);
    }
    const coverage = new Set([...matched, ...questionMatches]).size / query.length;
    const score = evidence >= 3 && (query.length < 3 || coverage >= 0.35) ? Math.round((evidence + coverage * 2) * 100) / 100 : 0;
    return { entry, score };
  }).filter(({ score }) => score > 0).sort((left, right) => right.score - left.score || left.entry.id.localeCompare(right.entry.id));
}
