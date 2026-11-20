import assert from 'node:assert/strict';
import test from 'node:test';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

function ask(question, expectedFact) {
  assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'sandbox')[0]?.entry.id, expectedFact);
  const result = replyAsOcto(createOctoChat(), question);
  assert.equal(result.command, null);
  assert.equal(result.links[0].href, 'https://copperstudio.nl/games/mosswake-creek/');
  return result.reply;
}

test('Octo explains fixed Sky controls and the live Sandbox day/night cycle', () => {
  const reply = ask('How does the Auto Sky work in Mosswake Creek?', 'sandbox-sky-cycle');
  assert.match(reply, /Day or Night.*hold that time of day/);
  assert.match(reply, /80 seconds of day.*36 seconds of night.*simulation runs/);
});

test('Octo describes placeable nighttime Blob portals rather than island realm travel', () => {
  const reply = ask('How do I place a Tri Portal in Mosswake Creek?', 'sandbox-tri-portals');
  assert.match(reply, /Scenery.*dry ground.*dormant by day.*Tri Blobs at night.*close at dawn/);
  assert.match(reply, /Break.*Eraser/);
  assert.doesNotMatch(reply, /eye sockets|moon book|insert eyes/);
});

test('Octo explains the two camp groups, balanced hires, prices and veteran training', () => {
  const reply = ask('How do I hire guards and train veterans in Creek Watch?', 'sandbox-recruit-veterans');
  assert.match(reply, /two recruiting camps on each bank.*four total.*tent map marker.*E or the action button.*3 copper/);
  assert.match(reply, /different weathered twig-and-cloth tent.*Tri Opus approach.*hides and closes the flap.*recruiting resumes after they pass/);
  assert.match(reply, /bank with fewer guards.*ties go west/);
  assert.match(reply, /no roster limit.*After three guards in total.*separate training button.*4 copper each/);
  assert.match(reply, /archers shoot farther.*double damage/);
});

test('Creek Watch guidance covers endless nights, the map, preparation time and local save slots', () => {
  const reply = ask('How do I win Creek Watch?', 'sandbox-creek-watch');
  assert.match(reply, /endless nights.*middle of the lake bridge.*all five sandbox areas/);
  assert.match(reply, /map buttons.*edge portal.*tower.*80 seconds/);
  assert.match(reply, /Dawn pays a stipend and refills supplies/);
  const saves = replyAsOcto(createOctoChat(), 'Does Mosswake Creek save my progress?');
  assert.match(saves.reply, /Sandbox edits are tab-only.*Creek Watch has named local save slots/);
  assert.match(saves.reply, /Creek Watch saves.*main menu.*Load.*same browser profile and game address/);
});
