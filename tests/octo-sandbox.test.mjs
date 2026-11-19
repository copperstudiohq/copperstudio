import assert from 'node:assert/strict';
import test from 'node:test';
import { createOctoChat, replyAsOcto, OCTO_GREETING, OCTO_PROMPTS } from '../lib/octo-chat.mjs';
import { findMentionedGames, rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

const sandboxUrl = 'https://copperstudio.nl/games/mosswake-creek/';
const answer = (question, memory = createOctoChat()) => replyAsOcto(memory, question);

test('Mosswake and Creek Watch aliases identify the fifth game without also selecting the island', () => {
  for (const alias of ['Mosswake Creek', 'MosswakeCreek', 'Rain & Copper sandbox', 'Creek Watch', 'falling-sand sandbox', 'sand box']) {
    assert.deepEqual(findMentionedGames(alias), ['sandbox'], alias);
    const reply = answer(`Tell me about ${alias}`);
    assert.equal(reply.links[0].href, sandboxUrl, alias);
    assert.equal(reply.command, null);
  }
  assert.deepEqual(findMentionedGames('compare Rain & Copper island with Mosswake Creek'), ['island', 'sandbox']);
  assert.deepEqual(findMentionedGames('compare Rain & Copper sandbox with the card game'), ['cards', 'sandbox']);
});

test('Tri Arena army sandboxes remain separate from Mosswake Creek', () => {
  assert.deepEqual(findMentionedGames('Tri Arena War Mode army sandbox'), ['arena']);
  assert.deepEqual(findMentionedGames('compare sandbox with Tri Arena'), ['arena', 'sandbox']);
  assert.match(answer('Tri Arena War Mode').reply, /Each side allows nine.*Let them fight/);
});

test('the catalogue, personality and ordinal selection include all five games', () => {
  assert.match(OCTO_GREETING, /five games/);
  assert.ok(OCTO_PROMPTS.includes('Mosswake Creek hints'));
  assert.match(answer('where do you live?').reply, /five games/);
  const memory = createOctoChat();
  assert.equal(answer('list all five games', memory).links.length, 5);
  const fifth = answer('the fifth one', memory);
  assert.equal(fifth.links[0].href, sandboxUrl);
  assert.equal(memory.lastGame, 'sandbox');
});

test('controls distinguish painting and keyboard aim from Creek Watch station actions', () => {
  const reply = answer('Mosswake Creek controls');
  assert.equal(reply.links[0].href, sandboxUrl);
  assert.match(reply.reply, /drag or tap to paint.*1–9.*B selects Break.*E selects eraser.*Space pauses/);
  assert.match(reply.reply, /arrow keys aim and Enter places.*Shift/);
  assert.match(reply.reply, /Creek Watch.*A\/D, arrow keys or tapping the ground move.*E or the action button/);
});

test('Mosswake progress is session-only and modes keep separate progress', () => {
  const reply = answer('Does Mosswake Creek save my progress?');
  assert.match(reply.reply, /only while this tab stays open/);
  assert.match(reply.reply, /no persistent saves or export backups.*reloading starts again/i);
  assert.match(reply.reply, /Reset restarts only the selected mode/);
  assert.doesNotMatch(reply.reply, /autosave|named worlds|JSON/);
  assert.match(answer('Mosswake Creek multiplayer').reply, /single-player.*no co-op or online rooms/);
});

test('specific game facts cover materials, Tri, bosses and the five-night defense goal', () => {
  const queries = [
    ['How does water extinguish embers in Mosswake Creek?', 'sandbox-materials', /visual weather.*Water tool/],
    ['How do I use Break precisely in Mosswake Creek?', 'sandbox-break-scenery', /1 px.*original colors/],
    ['How does Tri spread ichor in Mosswake Creek?', 'sandbox-tri-growth', /six map pixels.*13 seconds.*75 seconds.*three minutes/],
    ['How do I summon bosses in Mosswake Creek?', 'sandbox-summon-bosses', /dry ground.*water or ichor.*open air/],
    ['How do I win Creek Watch?', 'sandbox-creek-watch', /five nights.*signal.*palisades.*dawn/i],
  ];
  for (const [question, id, fact] of queries) {
    assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'sandbox')[0]?.entry.id, id, question);
    const reply = answer(question);
    assert.equal(reply.links[0].href, sandboxUrl, question);
    assert.match(reply.reply, fact, question);
  }
});

test('the new game does not steal a vague boss question from every other game', () => {
  assert.notEqual(answer('tell me about bosses').links[0]?.href, sandboxUrl);
});
