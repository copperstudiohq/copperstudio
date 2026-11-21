import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

test('builder auto-upgrade questions explain the paid stages and cancellation', () => {
  for (const question of [
    'How do I auto upgrade walls in Creek Watch?',
    'Can builders upgrade walls to towers in Mosswake Creek?',
    'How do I stop automatic wall upgrades in Creek Watch?'
  ]) {
    assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'sandbox')[0]?.entry.id, 'sandbox-builder-upgrades');
    const { reply, command, links } = replyAsOcto(createOctoChat(), question);
    assert.match(reply, /type upgrade walls or auto upgrade.*Upgrade walls/);
    assert.match(reply, /repair damaged defenses first.*existing walls.*reinforce for 5 copper.*200 copper/);
    assert.match(reply, /four seconds.*price is taken when it finishes.*repair fees still apply/);
    assert.match(reply, /wait when coins are low.*across days and saves.*Stop work.*stop upgrades.*Build empty wall sites yourself/);
    assert.equal(command, null);
    assert.equal(links[0].href, 'https://copperstudio.nl/games/mosswake-creek/');
  }
});
