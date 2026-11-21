import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

test('builder questions explain tent hiring, on-site repair labor and safe recall', () => {
  for (const question of [
    'How do I hire builders from the tents in Creek Watch?',
    'Will builder guys repair wall towers in Mosswake Creek?',
    'Do builders cost extra coins to repair the walls in Creek Watch?',
    'How do I command builders to fix walls in Creek Watch?',
    'How do I stop builder repairs in Mosswake Creek?'
  ]) {
    assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'sandbox')[0]?.entry.id, 'sandbox-builders');
    const { reply, links, command } = replyAsOcto(createOctoChat(), question);
    assert.match(reply, /separate Hire builder button for 3 copper.*walk out of that actual tent.*fewer builders/);
    assert.match(reply, /type fix walls in Builder orders.*Repair defenses.*each day until stop repairs/);
    assert.match(reply, /repair costs 2 copper, or 1 with the Repair Kit.*signal tower costs 3/);
    assert.match(reply, /taken once.*first health point.*1 health every 2 seconds.*save\/load/);
    assert.match(reply, /wait if you cannot afford.*resume automatically.*return before night/);
    assert.match(reply, /Named saves keep orders.*old saves wait for your order/);
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
