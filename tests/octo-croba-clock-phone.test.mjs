import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

function fact(question, id, memory = createOctoChat()) {
  assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'croba')[0]?.entry.id, id, question);
  const answer = replyAsOcto(memory, question);
  assert.equal(answer.command, null, question);
  assert.equal(answer.links[0]?.href, 'https://copperstudio.nl/games/croba-planet/', question);
  assert.equal(memory.lastFact, id, question);
  return answer.reply;
}

test('Croba clock guidance gives the actual cycle, first morning and local phase boundaries', () => {
  const answer = fact('How long is the day and night cycle in Croba?', 'croba-day-night');
  assert.match(answer, /24 real minutes of active simulation.*one simulation second.*one local minute/);
  assert.match(answer, /08:00 on Day 1.*day number changes at midnight/);
  assert.match(answer, /Sunrise is 05:00–07:00, day 07:00–17:00, sunset 17:00–19:00 and night otherwise/);
  assert.match(answer, /HUD shows local time and day/);
});

test('Croba clock follow-ups preserve active-game time without inventing offline advancement', () => {
  const memory = createOctoChat();
  replyAsOcto(memory, 'Tell me about Croba Planet');
  const answer = fact('Does the clock advance while paused or closed?', 'croba-day-night', memory);
  assert.match(answer, /Menus, pause, hidden tabs and the opening cinematic freeze the cycle/);
  assert.match(answer, /Expedition saves preserve the same clock and lighting; loading adds no offline time/);
  assert.match(answer, /underwater light darken at night.*suit lamp remains available/);
  assert.doesNotMatch(answer, /cloud clock|real-world timezone|offline catch-up/i);
});

test('Croba phone help points to actual Tools, full status and five-slot drawers', () => {
  for (const question of ['Where did the map and backpack go on my Croba phone?', 'How do I reveal all five quick slots on my phone in Croba?']) {
    const answer = fact(question, 'croba-phone-hud');
    assert.match(answer, /tap ＋ to expand the compact status strip/);
    assert.match(answer, /Tools opens sound, guide, backpack, crafting, building, saves, bestiary and Map/);
    assert.match(answer, /Tap ⋯.*all five slots; selecting one closes the strip/);
    assert.match(answer, /Tapping outside or opening another menu closes the expanded status/);
  }
});

test('Croba phone advice explains movement and smaller held supplies without claiming world changes', () => {
  const answer = fact('How do I use the joystick and smaller held supplies on my Croba phone?', 'croba-phone-hud');
  assert.match(answer, /left movement stick.*right thumb to look.*equipped-item USE activates the selected slot/);
  assert.match(answer, /JUMP \/ UP rises and DIVE descends/);
  assert.match(answer, /Most held supplies.*smaller, lower camera pose on phones.*yo-yo keeps its grip and string alignment/);
  assert.doesNotMatch(answer, /faster physics|smaller creatures|new save format|microphone/i);
  const controls = replyAsOcto(createOctoChat(), 'Croba keyboard controls');
  assert.match(controls.reply, /WASD moves.*Space jumps.*C or Shift dives down.*Escape pauses/);
});
