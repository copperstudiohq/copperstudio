import assert from 'node:assert/strict';
import test from 'node:test';
import { createOctoChat, replyAsOcto, OCTO_PROMPTS } from '../lib/octo-chat.mjs';
import { findMentionedGames, rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

const blackrootUrl = 'https://copperstudio.nl/games/blackroot-vale/';
const creekUrl = 'https://copperstudio.nl/games/mosswake-creek/';
const ask = (question, memory = createOctoChat()) => replyAsOcto(memory, question);

function fact(question, id, game, href) {
  assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, game)[0]?.entry.id, id, question);
  const result = ask(question);
  assert.equal(result.command, null);
  assert.equal(result.links[0]?.href, href, question);
  return result.reply;
}

test('Blackroot names and story aliases route to the sixth game with its own overview and controls', () => {
  for (const alias of ['Blackroot Vale', 'BlackrootVale', 'Thornwick', 'Opsing Rider', 'Blub', 'The Under Neath']) {
    assert.deepEqual(findMentionedGames(alias), ['blackroot'], alias);
  }
  const overview = ask('Tell me about Blackroot Vale');
  assert.equal(overview.links[0]?.href, blackrootUrl);
  assert.match(overview.reply, /solo first-person dark-fantasy.*Thornwick.*Opsing Rider.*Blub.*Ashen Battlefield/);
  const controls = ask('Blackroot Vale controls');
  assert.equal(controls.links[0]?.href, blackrootUrl);
  assert.match(controls.reply, /WASD.*drag to look.*arrows.*Shift.*Sprint.*E.*doors, gates and nearby Blub/);
  assert.match(controls.reply, /Village, Forest and Field.*between hunts.*Sound.*volume and mute/);
  assert.ok(OCTO_PROMPTS.includes('Blackroot Vale hints'));
});

test('sixth-game ordinal selection preserves a pending gameplay question', () => {
  const memory = createOctoChat();
  assert.equal(ask('List all games', memory).links.length, 6);
  assert.equal(ask('the sixth one', memory).links[0]?.href, blackrootUrl);
  assert.equal(memory.lastGame, 'blackroot');
  const pending = createOctoChat();
  assert.match(ask('What are the controls?', pending).reply, /Which game/);
  const selected = ask('the sixth one', pending);
  assert.equal(selected.links[0]?.href, blackrootUrl);
  assert.match(selected.reply, /WASD.*Shift.*Sprint/);
  assert.equal(pending.pendingQuestion, '');
});

test('Blackroot advice explains shelter, capture and the actual escape route', () => {
  const rider = fact('How do I hide from the Opsing Ryder?', 'blackroot-rider', 'blackroot', blackrootUrl);
  assert.match(rider, /warning.*sprint into a Thornwick house.*stay inside.*leaving/);
  assert.match(rider, /Three sword strikes.*Blub.*The Under Neath/);
  const escape = fact('How do I escape The Under Neath?', 'blackroot-escape', 'blackroot', blackrootUrl);
  assert.match(escape, /E.*cell gate.*branching halls.*spear strikes.*hit returns you to the cell/);
  assert.match(escape, /service stair.*Ashen Battlefield.*lit marker.*Thornwick/);
});

test('Blub-following questions receive factual companion advice without enabling remote commands', () => {
  const reply = fact('How do I get Blub to follow me?', 'blackroot-blub-follow', 'blackroot', blackrootUrl);
  assert.match(reply, /shared cell gate opens.*service stair.*winded or lost.*open cell for another attempt/);
  assert.match(reply, /both outside in the same area.*follows you through open doors and between landmarks/);
  assert.match(reply, /cannot command him remotely/);
  for (const question of ['follow me', 'Blub follow me', 'Can you make Blub follow me?', 'How do I get Blub to follow me and heal me?']) {
    const refusal = ask(question);
    assert.equal(refusal.command, null);
    assert.match(refusal.reply, /cannot follow, heal, build, fight or control/, question);
  }
});

test('Blackroot sound advice preserves subtitles and does not promise adventure persistence or online play', () => {
  const sound = fact('How do I hear Blub and change the volume?', 'blackroot-sound', 'blackroot', blackrootUrl);
  assert.match(sound, /E near Blub.*bundled goblin voice.*Sound.*mute.*subtitles remain visible while muted/);
  assert.match(sound, /preferences are remembered in this browser/);
  const saves = ask('Does Blackroot Vale save my progress?').reply;
  assert.match(saves, /sound volume and mute preferences.*browser.*session-only.*starts again on reload/);
  assert.match(saves, /no named expedition saves or progress export/);
  assert.doesNotMatch(saves, /autosaves every|JSON backup|cloud sync/);
  const session = OCTO_KNOWLEDGE.find(({ id }) => id === 'blackroot-session');
  assert.match(session.answer, /session-only.*reloading starts it again.*no named progress slots, adventure autosaves or progress export/i);
  assert.match(ask('Blackroot Vale multiplayer').reply, /solo adventure.*Blub.*not an online player/);
});

test('fantasy recommendations and comparisons describe Blackroot without confusing it with Croba', () => {
  const suggestion = ask('I want a medieval dark fantasy game');
  assert.equal(suggestion.links[0]?.href, blackrootUrl);
  assert.match(suggestion.reply, /Blackroot Vale.*Thornwick.*Opsing Rider.*Blub/);
  const comparison = ask('Compare Croba Planet and Blackroot Vale');
  assert.deepEqual(comparison.links.map(({ href }) => href), ['https://copperstudio.nl/games/croba-planet/', blackrootUrl]);
  assert.match(comparison.reply, /Croba Planet.*alien wildlife.*ocean.*Blackroot Vale.*fantasy.*Blub/);
});

test('Flyer guidance gives the night-40 unlock, two-sided wave and permanent one-guard landing infection', () => {
  const flyers = fact('How do Tri Flyers infect soldiers in Creek Watch?', 'sandbox-tri-flyers', 'sandbox', creekUrl);
  assert.match(flyers, /night 40 and every later night.*two arriving from each portal/);
  assert.match(flyers, /crawl, take flight.*land on a guard.*One landing infects one soldier.*pink and hunched.*roster permanently.*same AI as a Tri Opus/);
  assert.match(flyers, /Carried copper drops.*bat lands and crawls before flying again.*shoot airborne Flyers/);
  assert.match(flyers, /named Watch saves/);
  assert.equal(ask('When do Tri bats appear?').links[0]?.href, creekUrl);
});

test('Sprayer guidance distinguishes two-sided night-20 and recurring night-30 attacks from Flyers', () => {
  const sprayers = fact('When do Ichor Sprayers come from both sides?', 'sandbox-ichor-sprayers', 'sandbox', creekUrl);
  assert.match(sprayers, /each portal on night 20.*every night from 30 onward.*both the west and east/);
  assert.match(sprayers, /three volleys.*three Tri Opus.*6 copper.*Every tenth night.*blood moon/);
  assert.doesNotMatch(sprayers, /only.*west|night 40/);
});
