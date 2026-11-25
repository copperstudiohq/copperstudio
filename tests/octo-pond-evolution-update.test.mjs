import test from 'node:test';
import assert from 'node:assert/strict';
import { createOctoChat, replyAsOcto } from '../lib/octo-chat.mjs';
import { rankKnowledge } from '../lib/octo-understanding.mjs';
import { OCTO_KNOWLEDGE } from '../lib/octo-knowledge.mjs';

const pondUrl = 'https://copperstudio.nl/games/pond/';

function fact(question, id, memory = createOctoChat()) {
  assert.equal(rankKnowledge(question, OCTO_KNOWLEDGE, 'pond')[0]?.entry.id, id, question);
  const answer = replyAsOcto(memory, question);
  assert.equal(answer.command, null, question);
  assert.equal(answer.links[0]?.href, pondUrl, question);
  assert.equal(memory.lastFact, id, question);
  return answer.reply;
}

test('large lineage help requires five living members in each of five small species and eligible adults', () => {
  for (const question of ['How do I unlock large species in Pond?', 'How do five small species evolve into large lineages in Orbit Bloom?']) {
    const answer = fact(question, 'pond-large-lineages');
    assert.match(answer, /all five small land species each have at least five living members and a mature animal on dry land/);
    assert.match(answer, /randomly chosen eligible adult from each.*mutating its small ancestor/);
    assert.match(answer, /Descendants can continue changing.*number of legs.*own population slots/);
    assert.doesNotMatch(answer, /unlock.*(?:button|purchase)|guaranteed.*(?:horn|leg count)/i);
  }
});

test('large evolution tree and ordinary parent lineage retain their distinct in-game entry points', () => {
  const tree = fact('Where is View evolution tree for the large species in Pond?', 'pond-large-lineages');
  assert.match(tree, /In Land, open View evolution tree under Large species.*small ancestor/);
  assert.match(tree, /Select an ancestor or founder.*simulation pauses/);
  const parents = fact('How do I view lineage and parents of an animal in Pond?', 'pond-lineage-following');
  assert.match(parents, /Select a creature, egg or plant.*View lineage.*Recent dead ancestors/);
});

test('plain-language big species questions reach the actual large-founder conditions and evolution tree', () => {
  for (const question of ['How do big species evolve in Pond?', 'How do big creatures evolve in Pond?', 'How do larger species evolve in Pond?', 'How can I get bigger creatures in Pond?']) {
    const answer = fact(question, 'pond-large-lineages');
    assert.match(answer, /all five small land species each have at least five living members and a mature animal on dry land/, question);
    assert.match(answer, /randomly chosen eligible adult from each/, question);
    assert.match(answer, /View evolution tree under Large species.*small ancestor/, question);
  }
});

test('social advice explains spaced schools, herds, nearby warnings and temporary danger memory', () => {
  for (const question of ['How do schools and herds work in Pond?', 'Do Pond animals warn the group about predators?']) {
    const answer = fact(question, 'pond-schooling-herds');
    assert.match(answer, /Social instinct is inherited.*swimmers form schools.*same species.*spaced herds/);
    assert.match(answer, /Young animals follow nearby adults.*leave the group to eat, drink or hunt/);
    assert.match(answer, /warn nearby group members.*remember the danger briefly before regrouping/);
    assert.doesNotMatch(answer, /all animals.*(?:always|permanent)|communicate.*(?:server|network)/i);
  }
});

test('thirst advice distinguishes shore drinking, inherited tongues and rain-catching cups', () => {
  for (const question of ['Why are land animals seeking water in Pond?', 'How do drinking tongues and rain cups help in Pond?']) {
    const answer = fact(question, 'pond-thirst-drinking');
    assert.match(answer, /drink at ponds and ocean shores.*Low hydration costs energy/);
    assert.match(answer, /offspring inherit longer drinking tongues that reach farther.*head cups that collect rain/);
    assert.match(answer, /while rain is falling.*still seek shore water.*View lineage/);
    assert.doesNotMatch(answer, /never need water|rain cups.*(?:always full|replace drinking)/i);
  }
});

test('habitability guidance names the actual placement labels for extreme inner and outer orbits', () => {
  for (const question of ['Why are inner orbits too hot for life in Pond?', 'Are outer orbits too cold for life near Solara?']) {
    const answer = fact(question, 'pond-orbit-habitability');
    assert.match(answer, /hottest inner orbits and coldest outer orbits cannot sustain life/);
    assert.match(answer, /In System.*temperature and habitability label.*Too hot for life and Too cold for life/);
    assert.match(answer, /choose a temperate orbit.*Habitat map and Sample habitat/);
    assert.doesNotMatch(answer, /any orbit.*sustain life|weather.*(?:guarantees|always restores)/i);
  }
});

test('updated anatomy guidance covers inherited body proportions and mutable horns, frills and spines', () => {
  const answer = fact('How do Pond horns, frills and back spines evolve?', 'pond-creature-models');
  assert.match(answer, /Creature close-up.*Leg length, head size, neck length and body width are inherited/);
  assert.match(answer, /horns, frills and back spines can grow or shrink over generations/);
});

test('new Pond facts follow remembered game context while guide privacy and remote-action limits stay intact', () => {
  const memory = createOctoChat();
  replyAsOcto(memory, 'Tell me about Pond');
  assert.match(fact('How do schooling and herds work?', 'pond-schooling-herds', memory), /nearby group members/);
  assert.match(fact('What are rain cups and drinking tongues?', 'pond-thirst-drinking', memory), /head cups/);
  const action = replyAsOcto(memory, 'Can you control Pond for me?');
  assert.equal(action.command, null);
  assert.match(action.reply, /cannot.*control/);
  const privacy = replyAsOcto(memory, 'Does this Pond chat send data or use paid AI?');
  assert.match(privacy.reply, /local pattern-matching.*no paid AI calls/);
  assert.match(privacy.reply, /page session; reloading clears them/);
});
