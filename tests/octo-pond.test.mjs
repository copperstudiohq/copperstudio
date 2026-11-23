import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto, OCTO_GREETING, OCTO_PROMPTS } from '../lib/octo-chat.mjs';
import { normalizeQuestion, findMentionedGames, rankKnowledge } from '../lib/octo-understanding.mjs';
import { compareGames, readInterests, recommendGames, rememberInterests } from '../lib/octo-advice.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

const url = 'https://copperstudio.nl/games/pond/';
const ask = (question, memory = createOctoChat()) => replyAsOcto(memory, question);
function fact(question, id) {
  assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'pond')[0]?.entry.id, id, question);
  const reply = ask(question);
  assert.equal(reply.command, null);
  assert.equal(reply.links[0]?.href, url);
  return reply.reply;
}

test('Pond and its source aliases route to the seventh game', () => {
  for (const alias of ['Pond', 'Pond game', 'Pond sandbox', 'Solara', 'Orbit Bloom', 'OrbitBloom']) {
    assert.deepEqual(findMentionedGames(alias), ['pond'], alias);
    assert.equal(ask(`Tell me about ${alias}`).links[0]?.href, url, alias);
  }
  assert.equal(normalizeQuestion('OrbitBloom solarsystem controlls'), 'orbit bloom solar system controls');
  assert.match(ask('Tell me about Pond').reply, /solo life-evolution sandbox.*solar system.*lineage/i);
  assert.equal(ask('I want Pond sandbox').links[0]?.href, url);
  assert.equal(ask('I want Pond for creative play').links[0]?.href, url);
});

test('ponds in the other games retain their own game context', () => {
  assert.deepEqual(findMentionedGames('Mosswake Pond controls'), ['sandbox']);
  assert.deepEqual(findMentionedGames('How do I place a pond in Mosswake Creek?'), ['sandbox']);
  assert.deepEqual(findMentionedGames('Where is the pond in Rain & Copper?'), ['island']);
  assert.deepEqual(findMentionedGames('Compare Mosswake Pond with Croba'), ['croba', 'sandbox']);
  assert.deepEqual(findMentionedGames('Compare Pond with Mosswake Creek'), ['sandbox', 'pond']);
  assert.deepEqual(findMentionedGames('Pond versus Rain & Copper'), ['island', 'pond']);
});

test('the seventh catalogue choice and clarification preserve Pond save intent', () => {
  assert.match(OCTO_GREETING, /seven games/);
  assert.ok(OCTO_PROMPTS.includes('Pond hints'));
  const selection = createOctoChat();
  assert.equal(ask('List all seven games', selection).links.length, 7);
  assert.equal(ask('the seventh one', selection).links[0]?.href, url);
  assert.equal(selection.lastGame, 'pond');
  const pending = createOctoChat();
  assert.match(ask('How do I save?', pending).reply, /Which game/);
  const answer = ask('the seventh one', pending);
  assert.equal(answer.links[0]?.href, url);
  assert.match(answer.reply, /three manual Save slots.*IndexedDB.*Backup files/);
  assert.equal(pending.pendingQuestion, '');
});

test('Pond controls describe its scene cursor, cameras and terrain undo', () => {
  const reply = ask('Pond keyboard controls');
  assert.equal(reply.links[0]?.href, url);
  assert.match(reply.reply, /System, Planet, Pond and Land.*Shift-drag or right-drag/);
  assert.match(reply.reply, /arrow keys move a cursor and Enter acts.*Shift plus arrows.*mouse wheel.*Escape/);
  assert.match(reply.reply, /Undo brush.*Ctrl\/Command\+Z/);
});

test('Pond saves and multiplayer stay local without inventing shared sessions', () => {
  const saves = ask('How do I save and back up Pond?');
  assert.equal(saves.links[0]?.href, url);
  assert.match(saves.reply, /three manual Save slots.*full system.*random state/);
  assert.match(saves.reply, /IndexedDB.*older browser saves.*website address.*Download backup and Open backup/);
  assert.match(saves.reply, /no cloud save or online room/);
  assert.match(ask('Can I play Pond with a friend?').reply, /single-player.*no online rooms or co-op.*does not create a shared live world/);
  assert.match(ask('Does Pond need a login?').reply, /no sign-in.*Backup files/);
});

test('Pond comparisons explain ecosystem simulation rather than falling-sand painting or survival', () => {
  const creek = ask('Compare Pond versus Mosswake Creek');
  assert.deepEqual(creek.links.map(link => link.href), ['https://copperstudio.nl/games/mosswake-creek/', url]);
  assert.match(creek.reply, /falling-sand.*Pond.*life-evolution.*inherit traits/);
  const croba = compareGames(['croba', 'pond']);
  assert.match(croba, /solo expedition.*ocean dives.*Pond.*create a solar system/);
  assert.doesNotMatch(creek.reply + croba, /undefined/);
});

test('ecosystem and planet-design preferences recommend Pond while generic painting stays with Creek', () => {
  for (const question of ['i want to watch life evolve', 'i enjoy breeding creatures and lineage', 'i want to create planets', 'i like climate and habitats', 'i want a creative sandbox with evolution']) {
    const memory = { likes: [], dislikes: [] };
    rememberInterests(memory, readInterests(question));
    const result = recommendGames(question, memory);
    assert.deepEqual(result?.games, ['pond'], question);
    assert.match(result.reply, /Pond.*life-evolution sandbox/);
    assert.equal(ask(question).links[0]?.href, url, question);
  }
  assert.equal(ask('I want a falling-sand sandbox for painting').links[0]?.href, 'https://copperstudio.nl/games/mosswake-creek/');
});

test('Pond system and terrain facts use actual game tools', () => {
  assert.match(fact('How do I place planets around Solara in Pond?', 'pond-create-system'), /Small, Medium or Large.*Place planet inside the outer orbit.*Place pond.*Release creature cells and plant cells/);
  assert.match(fact('How do I carve basins and make oceans in Pond?', 'pond-terrain-weather'), /Carve basin.*dry depression.*Rain or Storm.*Cycle weather.*Restore stone/);
});

test('Pond evolution and plant facts explain inherited anatomy and shore grass', () => {
  assert.match(fact('How do creature cells mutate and evolve legs in Pond?', 'pond-cell-evolution'), /First cell designer.*Release creature cells.*Offspring inherit anatomy.*suitable legs and air tolerance/);
  assert.match(fact('How do algae establish grass in Pond?', 'pond-algae-grass'), /Release plant cells.*Shore adaptation.*Scatter grass seeds.*grown grass patch.*wind pollination/);
});

test('Pond creature-model help points to the actual inspector and land roster', () => {
  const answer = fact('How do I inspect the 3D creature models in Pond?', 'pond-creature-models');
  assert.match(answer, /Click an evolved creature in Pond or Land.*Creature close-up.*inherited anatomy/);
  assert.match(answer, /choose a species in the roster.*animal or egg.*Follow creature/);
});

test('Pond eggs, lineage and habitats have bounded source-checked guidance', () => {
  assert.match(fact('How do land eggs hatch and what is the population cap in Pond?', 'pond-land-eggs'), /lone founder.*incubation.*Reserved egg spaces.*five active land species and six creatures per species/);
  assert.match(fact('How do I inspect lineage and ancestors in Pond?', 'pond-lineage-following'), /View lineage.*pauses.*Recent dead ancestors.*Follow creature/);
  assert.match(fact('How do opposite seasons and the habitat map work in Pond?', 'pond-habitat-climate'), /latitude, altitude, seasons and daylight.*Sample habitat.*freezes water.*opposite seasons/);
});

test('Pond history and time controls explain recorded comparisons and paused steps', () => {
  assert.match(fact('How do I compare planets in Population history in Pond?', 'pond-population-history'), /Population history.*day slider.*Inherited traits.*same time since each was placed.*estimates/);
  assert.match(fact('How does fast-forward and Advance one second work in Pond?', 'pond-simulation-time'), /Pause simulation.*Advance one second.*1×, 4× and 16×.*larger ecosystems/i);
});

test('Pond follow-ups remain useful while actions and live stats stay honest', () => {
  const memory = createOctoChat();
  const first = ask('Pond hints', memory);
  const second = ask('more', memory);
  assert.notEqual(second.reply, first.reply);
  assert.equal(second.links[0]?.href, url);
  const live = ask('What is my current population in Pond?');
  assert.match(live.reply, /cannot see.*live stats/);
  const action = ask('Can you control Pond for me?');
  assert.equal(action.command, null);
  assert.match(action.reply, /cannot.*control/);
  assert.match(ask('Does this chat use paid AI for Pond?').reply, /costs nothing.*no paid AI calls/);
});
