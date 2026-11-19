import assert from 'node:assert/strict';
import test from 'node:test';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { findMentionedGames } from '../lib/octo-understanding.mjs';

const ask = (question, memory = createOctoChat()) => replyAsOcto(memory, question);

test('Croba and the arena now play on Copperstudio while both original multiplayer links stay intact', () => {
  const links = ask('List all games').links.map(({ href }) => href);
  assert.deepEqual(links, [
    'https://copperstudio.nl/games/croba-planet/',
    'https://rain-and-copper-island.davidwebstar.chatgpt.site',
    'https://wooden-room-red-carpet.davidwebstar.chatgpt.site',
    'https://copperstudio.nl/games/tri-arena/',
    'https://copperstudio.nl/games/mosswake-creek/',
  ]);
});

test('current arena name and its old nickname resolve to the same public game', () => {
  for (const name of ['Rain Arena of Copper', 'RainArenaofCopper', 'Tri Arena']) {
    assert.deepEqual(findMentionedGames(name), ['arena']);
    const reply = ask(`Tell me about ${name}`);
    assert.equal(reply.links[0].href, 'https://copperstudio.nl/games/tri-arena/');
    assert.match(reply.links[0].label, /Rain Arena of Copper/);
    assert.match(reply.reply, /Rain Arena of Copper.*Tri Arena/);
  }
  assert.deepEqual(findMentionedGames('compare Rain Arena of Copper with Rain & Copper'), ['island', 'arena']);
  assert.deepEqual(findMentionedGames('Rain Arena of Copper sandbox versus card game'), ['cards', 'arena']);
});

test('access questions distinguish three public games from two original hosted games', () => {
  const summary = ask('Which games are hosted on Copperstudio?');
  assert.match(summary.reply, /Three games.*without ChatGPT sign-in.*Croba Planet.*Rain Arena of Copper.*Mosswake Creek/);
  assert.match(summary.reply, /island.*Card Game.*original hosted sites.*may ask.*sign in/);
  assert.equal(summary.links.length, 5);
  assert.match(ask('Does Croba Planet need a ChatGPT account?').reply, /no ChatGPT sign-in required/);
  assert.match(ask('Do I need a login for Tri Arena?').reply, /no ChatGPT sign-in required/);
  assert.match(ask('How do I log in to the Card Game?').reply, /original hosted site.*sign in with ChatGPT/);
  assert.match(ask('Does Rain & Copper need an account?').reply, /original hosted site.*Both players need access/);
});

test('ordinary game advice and character privacy do not become hosting announcements', () => {
  assert.doesNotMatch(ask('Croba Planet hints').reply, /ChatGPT|hosted site/);
  assert.match(ask('why is your face private?').reply, /hood stays on/);
});
