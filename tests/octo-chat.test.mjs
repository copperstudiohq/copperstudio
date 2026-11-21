import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createOctoChat, replyAsOcto, OCTO_GREETING, OCTO_PROMPTS } from '../lib/octo-chat.mjs';
import { NOSE_LINES, CROBA_LINES, TRI_LINES, JOKES } from '../lib/octo-dialogue.mjs';

const URLS = {
  croba: 'https://copperstudio.nl/games/croba-planet/',
  island: 'https://rain-and-copper-island.davidwebstar.chatgpt.site',
  cards: 'https://wooden-room-red-carpet.davidwebstar.chatgpt.site',
  arena: 'https://copperstudio.nl/games/tri-arena/',
  sandbox: 'https://copperstudio.nl/games/mosswake-creek/',
  blackroot: 'https://copperstudio.nl/games/blackroot-vale/',
};
const answer = (text, memory = createOctoChat()) => replyAsOcto(memory, text);
const plain = reply => reply.reply.replace(/^Octo Nose: “|”$/g, '');

test('all six games have explicit links and useful overviews', () => {
  for (const [question, game, fact] of [
    ['Tell me about Croba Planet', 'croba', /100-metre ocean/],
    ['Tell me about Rain & Copper', 'island', /fish.*craft/],
    ['Tell me about The Card Game', 'cards', /three tokens/],
    ['Tell me about Tri Arena', 'arena', /Endless Waves.*Survival.*War Mode/],
    ['Tell me about Mosswake Creek', 'sandbox', /falling-sand.*endless/],
    ['Tell me about Blackroot Vale', 'blackroot', /dark-fantasy.*Thornwick.*Blub/],
  ]) {
    const reply = answer(question);
    assert.equal(reply.command, null);
    assert.equal(reply.links.length, 1);
    assert.equal(reply.links[0].href, URLS[game]);
    assert.match(reply.reply, fact);
  }
});

test('specific card and arena names win over shared franchise names', () => {
  assert.equal(answer('Rain and Copper: The Card Game hints').links[0].href, URLS.cards);
  assert.equal(answer('Tri Arena controls').links[0].href, URLS.arena);
  assert.match(answer('What is the Tri?').reply, /pink growth/);
});

test('current controls distinguish jumps, kicks and card actions', () => {
  const croba = answer('Croba Planet controls');
  assert.match(croba.reply, /Space jumps.*swims up/);
  assert.match(croba.reply, /C or Shift dives/);
  const island = answer('Rain & Copper controls');
  assert.match(island.reply, /Space jumps.*Shift runs.*E interacts/);
  const cards = answer('Card game controls');
  assert.match(cards.reply, /E draws.*R raises.*F plays/);
  assert.match(cards.reply, /C stands up.*Space jumps/);
  const arena = answer('Tri Arena controls');
  assert.match(arena.reply, /Space to jump.*right mouse to kick/);
  assert.match(arena.reply, /E or K to block/);
  assert.doesNotMatch(arena.reply, /Space (?:to )?kick|right mouse (?:to )?block/);
});

test('short follow-up control questions keep the selected game', () => {
  const memory = createOctoChat();
  answer('Tri Arena hints', memory);
  const reply = answer('What are the controls?', memory);
  assert.equal(reply.links[0].href, URLS.arena);
  assert.match(reply.reply, /right mouse to kick/);
  answer('The Card Game', memory);
  assert.match(answer('What does E do?', memory).reply, /E draws/);
  const howTo = answer('How do I play?', memory);
  assert.equal(howTo.links[0].href, URLS.cards);
  assert.match(howTo.reply, /draw.*play.*three tokens/);
});

test('name memory is original, bounded, and per conversation', () => {
  const memory = createOctoChat();
  assert.match(answer('my name is Cooper', memory).reply, /pleasure, Cooper/);
  assert.match(answer('what is my name?', memory).reply, /call you Cooper/);
  answer('call me ' + 'A'.repeat(80), memory);
  assert.equal(memory.name.length, 25);
  assert.equal(createOctoChat().name, '');
});

test('question and answer recall do not overwrite the recalled exchange', () => {
  const memory = createOctoChat();
  assert.match(answer('what did I just ask?', memory).reply, /not asked/);
  const reply = answer('Tri Arena controls', memory);
  const before = { question: memory.lastQuestion, reply: memory.lastAnswer, topic: memory.lastTopic };
  assert.match(answer('my last question', memory).reply, /Tri Arena controls/);
  assert.ok(plain(answer('what did you just say?', memory)).includes(plain(reply)));
  assert.equal(memory.lastQuestion, before.question);
  assert.equal(memory.lastAnswer, before.reply);
  assert.equal(memory.lastTopic, before.topic);
});

test('original nose remarks and continued topics are retained', () => {
  const memory = createOctoChat();
  assert.equal(plain(answer('noses', memory)), NOSE_LINES[0]);
  assert.equal(plain(answer('more', memory)), NOSE_LINES[1]);
  const tri = createOctoChat();
  assert.equal(plain(answer('the Tri', tri)), TRI_LINES[0]);
  assert.equal(plain(answer('tell me more', tri)), TRI_LINES[1]);
  assert.equal(plain(answer('Croba lore')), CROBA_LINES[0]);
});

test('original jokes, hood, home and friendly personality remain', () => {
  assert.equal(plain(answer('tell me a joke')), JOKES[0]);
  assert.equal(answer('tell me a nose joke').reply, JOKES[0]);
  assert.match(answer('who are you?').reply, /hood stays on/);
  assert.match(answer('where do you live?').reply, /eastern sewer alcove/);
  assert.match(answer('hello').reply, /nose/);
  assert.match(answer('I feel lonely').reply, /one small step/);
  assert.doesNotMatch(answer('hello').reply, /^Octo Nose:|[“”]/);
});

test('site game selection returns all six safe known links', () => {
  const reply = answer('Which game should I play?');
  assert.equal(reply.links.length, 6);
  assert.deepEqual(reply.links.map(link => link.href).sort(), Object.values(URLS).sort());
  assert.match(reply.reply, /fishing.*secret creature hands.*sword combat/);
  assert.match(OCTO_GREETING, /Octo Nose/);
  for (const prompt of OCTO_PROMPTS) assert.ok(answer(prompt));
});

test('standalone guide never executes or promises remote game actions', () => {
  for (const question of ['follow me', 'guard me', 'heal me', 'build me a house', 'rescue our friends', 'help out', 'can you control Tri Arena?']) {
    const reply = answer(question);
    assert.equal(reply.command, null);
    assert.match(reply.reply, /cannot follow, heal, build, fight or control/);
    assert.doesNotMatch(reply.reply, /I will (?:follow|guard|build|heal|rescue)/);
  }
  assert.match(answer('How do I build in Rain & Copper?').reply, /Crafting.*wood.*Wall Plank/);
});

test('local chat answers cost and privacy truthfully', () => {
  for (const question of ['Does this cost money?', 'Do you need an API key?', 'Do you send my messages?', 'Are you an AI?']) {
    const reply = answer(question);
    assert.match(reply.reply, /costs nothing/);
    assert.match(reply.reply, /pattern-matching.*not a cloud AI/);
    assert.match(reply.reply, /page session/);
    assert.equal(reply.command, null);
  }
});

test('saves reflect each game instead of promising universal persistence', () => {
  assert.match(answer('Croba Planet saves').reply, /local expedition slots.*export\/import/);
  assert.match(answer('Rain & Copper saves').reply, /host device/);
  assert.match(answer('Card game saves').reply, /Solo.*restart.*24 hours/);
  assert.match(answer('Tri Arena saves').reply, /Active runs are session-local/);
});

test('multiplayer distinguishes online cards, local island and solo arena', () => {
  assert.match(answer('Card game multiplayer').reply, /does not require the same Wi-Fi/);
  assert.match(answer('Rain & Copper multiplayer').reply, /same Wi-Fi.*host/);
  assert.match(answer('Tri Arena multiplayer').reply, /not online multiplayer/);
});

test('game tokens and local co-op are not mistaken for chat billing or privacy', () => {
  const cards = answer('How do I win tokens in the card game?');
  assert.equal(cards.links[0].href, URLS.cards);
  assert.match(cards.reply, /draw.*play.*three tokens/);
  assert.doesNotMatch(cards.reply, /pattern-matching/);
  const island = answer('Does Rain & Copper have local co-op?');
  assert.equal(island.links[0].href, URLS.island);
  assert.match(island.reply, /same Wi-Fi/);
  assert.doesNotMatch(island.reply, /pattern-matching/);
  const memory = createOctoChat();
  answer('The Card Game', memory);
  assert.equal(answer('How do I win tokens?', memory).links[0].href, URLS.cards);
  answer('Rain & Copper', memory);
  assert.match(answer('Does it have local co-op?', memory).reply, /same Wi-Fi/);
});

test('War and Survival help uses current documented modes without commanding Octo', () => {
  assert.match(answer('War Mode').reply, /optional Player.*spectator view/);
  const memory = createOctoChat();
  answer('Tri Arena', memory);
  assert.match(answer('Survival mode', memory).reply, /Survival/);
  assert.equal(answer('guard me in War Mode', memory).command, null);
});

test('missing game context asks a useful question and unknowns remain honest', () => {
  assert.match(answer('What are the controls?').reply, /Which game do you mean/);
  const reply = answer('Explain quantum gravity in detail');
  assert.match(reply.reply, /do not have a reliable answer/);
  assert.equal(reply.command, null);
  assert.deepEqual(reply.links, []);
});

test('invalid and oversized input remain bounded without coercing objects', () => {
  const memory = createOctoChat();
  for (const input of ['', '   ', null, undefined, 42, [], { toString() { throw new Error('Do not coerce input'); } }]) {
    assert.equal(replyAsOcto(memory, input), null);
  }
  assert.equal(memory.turn, 0);
  const reply = answer('x'.repeat(10000), memory);
  assert.equal(memory.lastQuestion.length, 300);
  assert.ok(reply.reply.length <= 1000);
  assert.ok(memory.lastAnswer.length <= 900);
  assert.throws(() => replyAsOcto(null, 'hello'), /conversation memory/);
  const damaged = { turn: Infinity, name: {}, lastTopic: 'x'.repeat(1000), lastQuestion: [], lastAnswer: 'x'.repeat(3000), lastGame: '__proto__' };
  answer('hello', damaged);
  assert.equal(damaged.turn, 1);
  assert.equal(damaged.name, '');
  assert.equal(damaged.lastGame, '');
});

test('markup is plain input and cannot supply links or commands', () => {
  const reply = answer('<script>alert(1)</script> javascript:alert(1)');
  assert.match(reply.reply, /do not have a reliable answer/);
  assert.deepEqual(reply.links, []);
  assert.equal(reply.command, null);
});

test('prototype-like malformed topics cannot become dialogue arrays or links', () => {
  for (const topic of ['__proto__', 'constructor', 'toString']) {
    const memory = { ...createOctoChat(), lastTopic: topic, lastGame: topic };
    const reply = answer('more', memory);
    assert.match(reply.reply, /do not have a reliable answer/);
    assert.deepEqual(reply.links, []);
    assert.equal(reply.command, null);
  }
});

test('production chat modules only import bundled code and have no network or credential access', async () => {
  const folder = new URL('../lib/', import.meta.url);
  for (const file of (await readdir(folder)).filter(name => name.endsWith('.mjs'))) {
    const source = await readFile(new URL(file, folder), 'utf8');
    const imports = [...source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const dependency of imports) assert.match(dependency, /^\.\/octo-[\w-]+\.mjs$/, file);
    assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|importScripts)\s*\(/);
    assert.doesNotMatch(source, /\bimport\s*\(/);
    assert.doesNotMatch(source, /\b(?:process\.env|localStorage|document\.|window\.|OCTO_SOURCE_TOKEN)\b/);
  }
});
