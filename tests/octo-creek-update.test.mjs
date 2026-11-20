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

test('Octo explains carried coin deliveries and keeping bags during a safe recall', () => {
  const reply = ask('How do guards collect coins in Creek Watch?', 'sandbox-guard-collectors');
  assert.match(reply, /across the whole map.*including pigeon drops.*carry it to you and drop it at your feet.*character automatically picks it up/);
  assert.match(reply, /enough daylight.*reach you and return.*keep carried copper.*possibly the next day/);
  assert.match(reply, /early bell recalls guards directly.*passing guards.*without a detour.*Night and the portals wait until everyone is home/);
  assert.match(replyAsOcto(createOctoChat(), 'Mosswake Creek saves').reply, /carried copper and delivered piles/);
});

test('Octo explains the paid-once tower dining room and its safe exit', () => {
  for (const question of [
    'How do I upgrade the tower in Creek Watch?',
    'How do I enter the tower dining room in Mosswake Creek?',
    'Where is the red tablecloth dinner table in Creek Watch?',
  ]) {
    const reply = ask(question, 'sandbox-tower-dining');
    assert.match(reply, /during the day.*Upgrade tower for 100 copper.*pay once.*Enter tower.*red tablecloth/);
    assert.match(reply, /A\/D.*arrow keys.*tap.*E or Leave tower.*Time and the outside watch pause/);
    assert.match(reply, /upgrade and your room location.*named Watch save slots/);
  }
});
