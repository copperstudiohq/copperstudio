import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

test('builder questions explain tent hiring, on-site repair labor and safe recall', () => {
  for (const question of [
    'How do I hire builders from the tents in Creek Watch?',
    'Will builder guys repair wall towers in Mosswake Creek?',
    'Do builders cost extra coins to repair the walls in Creek Watch?'
  ]) {
    assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'sandbox')[0]?.entry.id, 'sandbox-builders');
    const { reply, links, command } = replyAsOcto(createOctoChat(), question);
    assert.match(reply, /separate Hire builder button for 3 copper.*walks out of that actual tent.*fewer builders/);
    assert.match(reply, /During the day.*walk.*restore 1 health every 2 seconds.*working there.*no extra copper/);
    assert.match(reply, /bell recalls builders as well as guards.*everyone to return.*rest at night/);
    assert.match(reply, /Named saves keep your builders.*old saves start with no builders/);
    assert.equal(command, null);
    assert.equal(links[0].href, 'https://copperstudio.nl/games/mosswake-creek/');
  }
});

test('asking about Octo chat costs still returns the free local-chat explanation', () => {
  const chat = createOctoChat();
  chat.lastGame = 'sandbox';
  const { reply } = replyAsOcto(chat, 'Does talking to Octo cost coins in Creek Watch?');
  assert.match(reply, /This chat costs nothing.*no paid AI calls/);
});
