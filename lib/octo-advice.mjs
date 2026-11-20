/** Small, transparent preference matching. No user data leaves this page. */
const INTERESTS = Object.freeze({
  exploration: /\b(?:explor\w*|alien\w*|wildlife|discover\w*)\b/,
  ocean: /\b(?:ocean|underwater|div\w*|swim\w*)\b/,
  building: /\b(?:build\w*|craft\w*|house|shelter)\b/,
  fishing: /\b(?:fish\w*)\b/,
  strategy: /\b(?:cards?|strateg\w*|thinking|tabletop)\b/,
  combat: /\b(?:fight\w*|combat|swords?|action|battl\w*)\b/,
  armies: /\b(?:armies|army|war)\b/,
  creative: /\b(?:sandbox|falling[\s-]*sand|pixels?|paint\w*|materials?|experiment\w*|creativ\w*|free[\s-]*build\w*)\b/,
  defense: /\b(?:creek[\s-]*watch|defen[cs]e|defensive|defend\w*|copper guards?|palisades?|signal[\s-]*(?:house|tower)|endless[\s-]*nights?)\b/,
  friends: /\b(?:friends?|multiplayer|co op|co-op|coop|two players?|2 players?)\b/,
});
const MAX_INTERESTS = Object.keys(INTERESTS).length;

const FEATURES = Object.freeze({
  croba: { exploration: 5, ocean: 6, combat: 1, friends: -5 },
  island: { exploration: 2, building: 6, fishing: 6, combat: 1, friends: 2 },
  cards: { strategy: 6, friends: 5 },
  arena: { combat: 6, armies: 6, friends: -5 },
  sandbox: { exploration: 1, building: 4, creative: 8, defense: 8, friends: -5 },
});

const SUMMARIES = Object.freeze({
  croba: 'Croba Planet is a solo expedition with alien wildlife, icy exploration and deep ocean dives.',
  island: 'Rain & Copper is a first-person island adventure with fishing, gathering, crafting and building, and two-player co-op on the same Wi-Fi.',
  cards: 'The Card Game has secret creature hands and strategy. Play solo or duel one friend online using a room code, even on different Wi-Fi.',
  arena: 'Rain Arena of Copper, also known as Tri Arena, has sword combat, waves, bosses and a War Mode army sandbox. It is a solo game.',
  sandbox: 'Rain & Copper: Mosswake Creek is a 2D falling-sand sandbox for painting materials, creative building and free experimentation. Its separate Creek Watch mode is an endless night-defense game: hire guards with copper, build and repair palisades, and protect the signal tower. Raiders grow tougher over the early nights and keep coming until the tower falls.',
});

export function readInterests(question) {
  const likes = [], dislikes = [];
  // Clause boundaries keep “no fighting; I want fishing” from negating fishing.
  for (const clause of question.split(/[,;.!?]|\b(?:but|instead|actually)\b/)) {
    for (const [interest, pattern] of Object.entries(INTERESTS)) {
      // An army sandbox means the arena; the word alone means creative play.
      const subject = interest === 'creative'
        ? clause.replace(/\b(?:army|armies|war(?: mode)?) sandbox\b|\bsandbox (?:armies|battles)\b/g, '')
        : clause;
      const match = pattern.exec(subject);
      if (!match) continue;
      let prefix = subject.slice(0, match.index);
      const positive = [...prefix.matchAll(/\bi (?:want|like|love|enjoy|prefer)\b/g)].at(-1);
      if (positive) prefix = prefix.slice(positive.index + positive[0].length);
      const negative = /\b(?:no|not|without|avoid|hate|dislike|dont|do not|cannot stand)\b(?:\s+\w+){0,3}\s*$/.test(prefix);
      (negative ? dislikes : likes).push(interest);
    }
  }
  if (/\b(?:peaceful|relaxing|calm|quiet|no violence|no fighting)\b/.test(question)) dislikes.push('combat');
  return { likes: [...new Set(likes)], dislikes: [...new Set(dislikes)] };
}

export function rememberInterests(memory, interests) {
  const valid = value => Array.isArray(value) ? value.filter(item => Object.hasOwn(INTERESTS, item)).slice(-MAX_INTERESTS) : [];
  memory.likes = valid(memory.likes);
  memory.dislikes = valid(memory.dislikes);
  for (const [target, opposite] of [['likes', 'dislikes'], ['dislikes', 'likes']]) {
    for (const interest of interests[target]) {
      memory[opposite] = memory[opposite].filter(item => item !== interest);
      memory[target] = [...memory[target].filter(item => item !== interest), interest].slice(-MAX_INTERESTS);
    }
  }
}

export function recommendGames(question, memory) {
  // Connection constraints matter more than a remembered taste for exploration.
  if (/\b(?:friends?|online|multiplayer|two players?|2 players?)\b/.test(question)
    && /another|different|remote|far away|not.*same|anywhere/.test(question)) {
    return { games: ['cards'], reply: `For a friend on another network, choose The Card Game. ${SUMMARIES.cards} The island's co-op needs the same Wi-Fi.` };
  }
  if (!memory.likes.length && !memory.dislikes.length) return null;
  const ranked = Object.entries(FEATURES).map(([game, features]) => ({
    game,
    score: memory.likes.reduce((score, topic) => score + (features[topic] || 0), 0)
      - memory.dislikes.reduce((score, topic) => score + Math.max(0, features[topic] || 0) * 2, 0),
  })).sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (best.score <= 0 && !memory.dislikes.length) return null;
  const games = ranked.filter(item => item.score === best.score).slice(0, 2).map(item => item.game);
  const intro = memory.dislikes.includes('combat') && games.includes('island')
    ? 'For fishing or building, my nose points to Rain & Copper. Its island does have dangerous Tri creatures, so choose The Card Game if you want to avoid real-time combat.'
    : 'Based on what you enjoy, my nose points here:';
  return { games, reply: `${intro} ${games.map(game => SUMMARIES[game]).join(' ')}` };
}

export function compareGames(games) {
  return games.map(game => SUMMARIES[game]).join(' ');
}
