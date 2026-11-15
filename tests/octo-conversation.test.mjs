import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';

const ask = (memory, text) => replyAsOcto(memory, text);
const gameLink = (reply, slug) => assert.ok(reply.links.some(link => link.href.includes(slug)), reply.reply);

test('a clarification remembers the question instead of replacing it with an overview', () => {
  const memory = createOctoChat();
  assert.match(ask(memory, 'How do I save?').reply, /Which game/);
  const reply = ask(memory, 'Croba Planet');
  assert.match(reply.reply, /local.*expedition|expedition.*local/);
  assert.match(reply.reply, /backup|export/);
  gameLink(reply, 'croba-planet');
  assert.equal(memory.pendingQuestion, '');
});

test('clarification accepts an ordinal and keeps the pending intent', () => {
  const memory = createOctoChat();
  ask(memory, 'What are the controls?');
  const reply = ask(memory, 'the third one');
  assert.match(reply.reply, /E draws.*F plays/);
  gameLink(reply, 'wooden-room');
});

test('specific oxygen advice survives a joke and does not become random creature lore', () => {
  const memory = createOctoChat();
  ask(memory, 'Croba Planet');
  ask(memory, 'Tell me a joke');
  const reply = ask(memory, 'How do I refill oxygen?');
  assert.match(reply.reply, /surface.*refill oxygen/i);
  assert.doesNotMatch(reply.reply, /Woodlons|Crobon Birds/);
  gameLink(reply, 'croba-planet');
});

test('short creature-rule follow-ups keep the card-game meaning of Tri', () => {
  const memory = createOctoChat();
  ask(memory, 'The Card Game');
  const duck = ask(memory, 'Can a Duck beat the Tri?');
  assert.match(duck.reply, /Duck.*beats.*final reveal/);
  const tri = ask(memory, 'What if I play the Tri?');
  assert.match(tri.reply, /Playing The Tri.*knocks.*holder out/);
  gameLink(tri, 'wooden-room');
});

test('common typing mistakes still find the correct controls', () => {
  const reply = ask(createOctoChat(), 'croba plannet controlls');
  assert.match(reply.reply, /Space jumps.*C or Shift dives/);
  gameLink(reply, 'croba-planet');
});

test('a remote friend recommendation respects connection requirements', () => {
  const reply = ask(createOctoChat(), 'Which game can I play with a friend on another Wi-Fi?');
  assert.match(reply.reply, /Card Game.*different Wi-Fi|Card Game.*another network|another network.*Card Game/s);
  assert.match(reply.reply, /room code/);
  assert.equal(reply.links.length, 1);
  gameLink(reply, 'wooden-room');
});

test('recommendations remember interests and adapt when the user changes their mind', () => {
  const memory = createOctoChat();
  gameLink(ask(memory, 'I want sword combat'), 'tri-arena');
  const change = ask(memory, 'Actually, no fighting; I want fishing');
  gameLink(change, 'rain-and-copper');
  assert.ok(memory.dislikes.includes('combat'));
  assert.ok(memory.likes.includes('fishing'));
  assert.ok(!memory.likes.includes('combat'));
  gameLink(ask(memory, 'Which game should I choose?'), 'rain-and-copper');
});

test('comparisons explain actual differences and return exactly the compared links', () => {
  const reply = ask(createOctoChat(), 'Compare Croba Planet and Tri Arena');
  assert.match(reply.reply, /Croba Planet.*ocean.*Tri Arena.*sword combat/);
  assert.equal(reply.links.length, 2);
});

test('a new preference can replace an old positive preference', () => {
  const memory = createOctoChat();
  gameLink(ask(memory, 'I like fishing'), 'rain-and-copper');
  gameLink(ask(memory, 'Actually I want sword combat now'), 'tri-arena');
  assert.ok(!memory.likes.includes('fishing'));
});

test('an ordinal inside a gameplay question does not select a game from an old list', () => {
  const memory = createOctoChat();
  ask(memory, 'Which game should I play?');
  const reply = ask(memory, 'How do I beat the first boss?');
  assert.match(reply.reply, /Which game/);
  assert.equal(memory.lastGame, '');
});

test('pronouns follow the newest game and instructions never pretend to execute actions', () => {
  const memory = createOctoChat();
  ask(memory, 'Croba Planet');
  ask(memory, 'The Card Game');
  const save = ask(memory, 'Does it save?');
  assert.match(save.reply, /Solo.*restart|Solo.*reload/);
  gameLink(save, 'wooden-room');
  const build = ask(memory, 'How do I build a house in Rain & Copper?');
  assert.match(build.reply, /Crafting.*wood.*Wall Plank.*green/i);
  assert.match(ask(memory, 'Can you build it for me?').reply, /cannot.*build/);
});

test('live stats and unknown facts are not invented', () => {
  const memory = createOctoChat();
  const live = ask(memory, 'What is my current oxygen level in Croba?');
  assert.match(live.reply, /cannot see.*live stats/);
  assert.doesNotMatch(live.reply, /100 seconds|500 seconds/);
  const unknown = ask(memory, 'Explain quantum gravity in detail');
  assert.match(unknown.reply, /do not have a reliable answer/);
  assert.deepEqual(unknown.links, []);
});

test('more gives a fresh game fact and cleared memory loses learned preferences', () => {
  const memory = createOctoChat();
  const first = ask(memory, 'Croba Planet hints');
  const next = ask(memory, 'more');
  assert.notEqual(first.reply, next.reply);
  gameLink(next, 'croba-planet');
  ask(memory, 'I like fishing');
  const reset = createOctoChat();
  assert.deepEqual(reset.likes, []);
  assert.deepEqual(reset.dislikes, []);
  assert.deepEqual(reset.shownFacts, []);
  assert.equal(reset.pendingQuestion, '');
});

test('chat privacy remains local after the knowledge and memory upgrade', () => {
  const reply = ask(createOctoChat(), 'Are you using a paid LLM now?');
  assert.match(reply.reply, /costs nothing.*not a cloud AI.*no paid AI calls/s);
  assert.match(reply.reply, /interests.*page session/);
});
