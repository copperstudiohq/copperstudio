import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

test('wall tower questions explain the 200 copper defense upgrade separately from the dining room', () => {
  for (const question of [
    'How do I turn walls into wall towers in Creek Watch?',
    'How do I upgrade a wall for 200 coins in Mosswake Creek?',
    'Can guards shoot from the archer platform in Creek Watch?'
  ]) {
    assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'sandbox')[0]?.entry.id, 'sandbox-wall-towers');
    const { reply, links, command } = replyAsOcto(createOctoChat(), question);
    assert.match(reply, /reinforce a palisade.*repair it to full health.*200 copper/);
    assert.match(reply, /All four.*30 health.*Two existing guards.*elevated platform/);
    assert.match(reply, /Damaged or destroyed.*repaired.*without buying the upgrade again.*saves/);
    assert.equal(command, null);
    assert.equal(links[0].href, 'https://copperstudio.nl/games/mosswake-creek/');
  }
});
