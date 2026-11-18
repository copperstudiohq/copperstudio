import assert from 'node:assert/strict';
import test from 'node:test';
import { compareGames, readInterests, recommendGames, rememberInterests } from '../lib/octo-advice.mjs';

function recommend(question) {
  const memory = { likes: [], dislikes: [] };
  rememberInterests(memory, readInterests(question));
  return recommendGames(question, memory);
}

test('creative material experiments recommend Mosswake Creek rather than army battles', () => {
  for (const question of [
    'i want a sandbox',
    'i want a falling-sand game with materials',
    'i like painting water and experimenting with pixels',
    'i want creative building without gathering resources',
  ]) {
    const reply = recommend(question);
    assert.deepEqual(reply.games, ['sandbox'], question);
    assert.match(reply.reply, /Mosswake Creek.*2D falling-sand.*painting materials/);
  }
  assert.ok(!readInterests('i want a sandbox').likes.includes('armies'));
});

test('Creek Watch recommendations explain its separate five-night defense campaign', () => {
  for (const question of [
    'i want creek watch',
    'i like copper guards and palisades',
    'i want to defend a signal house for five nights',
  ]) {
    const reply = recommend(question);
    assert.deepEqual(reply.games, ['sandbox'], question);
    assert.match(reply.reply, /separate Creek Watch.*five-night defense campaign/);
    assert.match(reply.reply, /guards with copper.*palisades.*signal house/);
    assert.doesNotMatch(reply.reply, /War Mode|army sandbox/);
  }
});

test('explicit army sandboxes still recommend Tri Arena War Mode', () => {
  for (const question of [
    'i want an army sandbox',
    'i like sandbox battles',
    'i want war mode armies',
  ]) {
    const reply = recommend(question);
    assert.deepEqual(reply.games, ['arena'], question);
    assert.match(reply.reply, /Tri Arena.*War Mode army sandbox/);
  }
});

test('existing distinctive interests retain their original game recommendations', () => {
  for (const [question, game] of [
    ['i like fishing', 'island'],
    ['i want sword combat', 'arena'],
    ['i like card duels', 'cards'],
    ['i want underwater diving', 'croba'],
    ['i enjoy building and crafting', 'island'],
  ]) {
    assert.deepEqual(recommend(question).games, [game], question);
  }
});

test('Mosswake comparisons distinguish painting, island gathering and arena armies', () => {
  const island = compareGames(['sandbox', 'island']);
  assert.match(island, /Mosswake Creek.*2D falling-sand.*painting materials/);
  assert.match(island, /first-person island.*gathering.*crafting/);
  const arena = compareGames(['sandbox', 'arena']);
  assert.match(arena, /Creek Watch.*five-night defense campaign.*Tri Arena.*War Mode army sandbox/);
  assert.doesNotMatch(island + arena, /undefined/);
});

test('creative play can avoid combat without losing the separate campaign distinction', () => {
  const reply = recommend('no fighting, i want to paint materials');
  assert.deepEqual(reply.games, ['sandbox']);
  assert.match(reply.reply, /separate Creek Watch mode/);
});

test('online friends still get the card game rather than the local sandbox', () => {
  const reply = recommend('i like creative building with a friend on another network');
  assert.deepEqual(reply.games, ['cards']);
  assert.match(reply.reply, /room code.*different Wi-Fi/);
});
