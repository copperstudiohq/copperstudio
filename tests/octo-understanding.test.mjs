import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeQuestion, findMentionedGames, rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

test('normalizes chat shorthand, contractions and bounded game vocabulary typos', () => {
  assert.equal(normalizeQuestion("HOWDO I get oxgyen in Cobra Plannet? I can't use ur controlls!"), 'how do i get oxygen in croba planet i cannot use your controls');
  assert.equal(normalizeQuestion('peapel are bulding in TriAreana'), 'people are building in tri arena');
  assert.equal(normalizeQuestion('howdoi play crobra'), 'how do i play croba');
});

test('does not fuzzy-correct short words or ordinary words into game topics', () => {
  assert.equal(normalizeQuestion('black shore names it'), 'black shore names it');
  assert.equal(normalizeQuestion('can you control Tri Arena?'), 'can you control tri arena');
});

test('recognizes four game aliases and multiple-game comparisons', () => {
  assert.deepEqual(findMentionedGames('Cobra Planet vs TriAreana'), ['croba', 'arena']);
  assert.deepEqual(findMentionedGames('Rain & Copper island versus the card game'), ['island', 'cards']);
  assert.deepEqual(findMentionedGames('Rain and Copper vs the card game'), ['island', 'cards']);
});

test('the card edition does not also imply the island, and Tri lore does not imply the arena', () => {
  assert.deepEqual(findMentionedGames('Rain & Copper: The Card Game'), ['cards']);
  assert.deepEqual(findMentionedGames('compare Rain and Copper cardgame with Croba'), ['croba', 'cards']);
  assert.deepEqual(findMentionedGames('compare Rain and Copper cards with Tri Arena'), ['cards', 'arena']);
  assert.deepEqual(findMentionedGames('tell me about the Tri creature'), []);
});

test('retrieves specific oxygen, fishing, card victory and boss information', () => {
  const best = (question, game) => rankKnowledge(question, OCTO_KNOWLEDGE, game)[0]?.entry.id;
  assert.equal(best('how do i refill air?', 'croba'), 'croba-oxygen');
  assert.equal(best('where is my fising rod?', 'island'), 'island-fishing-rod');
  assert.equal(best('how do I win rounds and earn tokens?', 'cards'), 'cards-win-rounds');
  assert.equal(best('can a Duck beat the Tri?', 'cards'), 'cards-duck-tri');
  assert.equal(best('What if I play the Tri?', 'cards'), 'cards-duck-tri');
  assert.equal(best('What happens if I play The Tri?', 'cards'), 'cards-duck-tri');
  assert.equal(best('what is the Copper Fortress weak point?', 'arena'), 'arena-copper-fortress');
});

test('an explicit game prevents cross-game answers', () => {
  assert.deepEqual(rankKnowledge('refill oxygen tank', OCTO_KNOWLEDGE, 'cards'), []);
  assert.ok(rankKnowledge('save my progress', OCTO_KNOWLEDGE, 'croba').every(({ entry }) => entry.game === 'croba'));
});

test('unrelated questions and sparse pronouns have no confident match', () => {
  for (const question of ['it', 'how do I play?', 'help please', 'what is the capital of France?', 'how do I order pizza?']) {
    assert.deepEqual(rankKnowledge(question, OCTO_KNOWLEDGE), [], question);
  }
});

test('broad shared topics retain more than one candidate rather than inventing a game', () => {
  const matches = rankKnowledge('save', OCTO_KNOWLEDGE);
  assert.ok(new Set(matches.map(({ entry }) => entry.game)).size > 1);
  assert.deepEqual(matches, rankKnowledge('save', OCTO_KNOWLEDGE));
  assert.ok(matches.every(({ score }) => score >= 3));
});
