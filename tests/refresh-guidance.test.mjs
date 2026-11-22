import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

function ask(question, game, fact) {
  assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, game)[0]?.entry.id, fact);
  const result = replyAsOcto(createOctoChat(), question);
  assert.equal(result.command, null);
  assert.equal(result.links[0].href, `https://copperstudio.nl/games/${game === 'croba' ? 'croba-planet' : 'blackroot-vale'}/`);
  return result.reply;
}

test('Croba guide explains the new deep basin and swimmable submarine', () => {
  assert.match(ask('How deep is Jellyfish Spires in Croba Planet?', 'croba', 'croba-jellyfish-spires'), /eastern Blue Ocean.*170 metres.*map and HUD/);
  assert.match(ask('Can I explore the broken submarine in Croba Planet?', 'croba', 'croba-submarine'), /swimmable interior.*Space ascends.*Shift descends.*oxygen/);
});

test('Blackroot guide describes the cabin resident and Blub recovery', () => {
  assert.match(ask('Who lives at Pine Hollow Cabin in Blackroot Vale?', 'blackroot', 'blackroot-pine-hollow'), /late western fork.*unnamed resident.*gloves.*roughly every two minutes/);
  assert.match(ask('How does Blub get clean clothes after his meals in Blackroot Vale?', 'blackroot', 'blackroot-blub-meals'), /Woodcutter.*Weaver.*Common House.*first three meals.*local saves/);
});

test('Blackroot save help promises the current local slots rather than cloud or named expeditions', () => {
  const answer = replyAsOcto(createOctoChat(), 'Does Blackroot Vale save my progress?').reply;
  assert.match(answer, /one manual save and one autosave.*every 8 seconds.*newest save automatically/);
  assert.match(answer, /New game replaces only the autosave.*keeps the manual slot/);
  assert.match(answer, /no JSON export or cloud sync/);
});
