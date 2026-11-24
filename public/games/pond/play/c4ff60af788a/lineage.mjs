import { ACTIVITY, BODY_SHAPES, DIETS, MOTION, PATTERNS, comfortableTemperature, findLineage, grassProfile, limbCount } from './model.mjs';

const animalTraits = {
  diet: 'Feeding', activity: 'Activity rhythm', size: 'Body size', speed: 'Speed', senses: 'Senses', caution: 'Caution', sociability: 'Social instinct',
  legs: 'Legs', extraLimbs: 'Extra limbs', fins: 'Fins', armor: 'Armor', thermal: 'Warmth preference',
  pattern: 'Markings', motion: 'Swimming style', shape: 'Cell shape',
};
const traitOptions = { diet: DIETS, activity: ACTIVITY, pattern: PATTERNS, motion: MOTION, shape: BODY_SHAPES };
const grassTraits = { growth: 'Growth', height: 'Blade height', curl: 'Blade curl', moisture: 'Moisture preference', pigment: 'Pigment' };
const algaeTraits = { growth: 'Growth', width: 'Colony width', pigment: 'Pigment' };
const escape = (value) => String(value).replace(/[&<>"']/g,
  (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

function traitValue(key, value) {
  if (traitOptions[key]) return traitOptions[key][value] ?? 'Unrecorded';
  if (!Number.isFinite(value)) return 'Unrecorded';
  if (key === 'legs') return `${limbCount({ legs: value })} · ${value.toFixed(2)}×`;
  if (key === 'extraLimbs') return String(value);
  if (key === 'pigment') return `${Math.round(value)}°`;
  if (key === 'thermal') return `${comfortableTemperature({ thermal: value })}°C`;
  if (['caution', 'sociability', 'moisture'].includes(key)) return `${Math.round(value * 100)}%`;
  return `${value.toFixed(2)}×`;
}

function traitSource(key, value, parents) {
  if (value === undefined) return 'Unrecorded';
  if (!parents.length) return 'Founder';
  const found = parents.filter(Boolean);
  const matches = found.filter((parent) => inheritedValue(parent, key) === value);
  if (matches.length === 2) return 'Shared by both';
  if (matches.length === 1) return parents.length === 1 ? 'Matches parent' : `Matches parent ${parents.indexOf(matches[0]) + 1}`;
  return found.length === parents.length ? 'Mutated' : 'Parent record missing';
}

function inheritedValue(organism, key) {
  return organism.traits[key] ?? { activity: 'flexible', sociability: .45, extraLimbs: 0 }[key];
}

function swatch(organism, planet) {
  const { color, kind, traits } = organism;
  const base = /^(#[a-f\d]{6})$/i.test(color ?? '') ? color : '#9f8cff';
  const pigment = Number.isFinite(traits.pigment) ? traits.pigment : 0;
  const tint = kind === 'animal' ? base : `hsl(${grassProfile(planet).hue + pigment + (kind === 'algae' ? 12 : 0)} 54% 61%)`;
  return `<i class="lineage-swatch" style="--swatch:${tint}" aria-hidden="true"></i>`;
}

function parentCard(parent, index, planet) {
  if (!parent) return `<div class="lineage-parent lineage-missing"><small>Parent ${index + 1}</small><strong>Record unavailable</strong></div>`;
  return `<button type="button" class="lineage-parent" data-parent="${index}"><small>Parent ${index + 1}</small>
    <strong>${swatch(parent, planet)}${escape(parent.name)}</strong><span>Generation ${escape(parent.generation)} · ${escape(parent.state)}</span></button>`;
}

export function mountLineage(dialog, currentPlanet) {
  const title = dialog.querySelector('h2');
  const parentsElement = dialog.querySelector('#lineage-parents');
  const current = dialog.querySelector('#lineage-organism');
  const traitsElement = dialog.querySelector('#lineage-traits');
  const back = dialog.querySelector('#lineage-back');
  const history = [];
  let parents = [];

  function show(reference) {
    const planet = currentPlanet();
    const organism = planet && findLineage(planet, reference);
    if (!organism) return false;
    parents = organism.parents.map((parent) => findLineage(planet, parent));
    const labels = organism.kind === 'animal' ? animalTraits : organism.kind === 'grass' ? grassTraits : algaeTraits;
    title.textContent = `${organism.name} lineage`;
    current.innerHTML = `${swatch(organism, planet)}<div><strong>${escape(organism.name)}${organism.kind === 'animal' ? ` #${escape(organism.id)}` : ''}</strong>
      <small>Generation ${escape(organism.generation)} · ${escape(organism.state)}${organism.strain ? ` · ${escape(organism.strain)}` : ''}</small></div>`;
    parentsElement.hidden = !parents.length;
    parentsElement.innerHTML = parents.map((parent, index) => parentCard(parent, index, planet)).join('');
    traitsElement.innerHTML = Object.entries(labels).map(([key, label]) => {
      const value = inheritedValue(organism, key);
      const source = traitSource(key, value, parents);
      return `<div class="lineage-trait"><dt>${label}</dt><dd>${escape(traitValue(key, value))}</dd>
        <dd${source === 'Mutated' ? ' class="lineage-mutated"' : ''}>${source}</dd></div>`;
    }).join('');
    back.hidden = history.length < 2;
    return true;
  }

  parentsElement.addEventListener('click', (event) => {
    const button = event.target.closest('[data-parent]');
    const parent = button && parents[Number(button.dataset.parent)];
    if (!parent) return;
    history.push(parent);
    show(parent);
    title.focus();
  });
  back.addEventListener('click', () => {
    if (history.length < 2) return;
    history.pop();
    show(history.at(-1));
    title.focus();
  });
  return (reference) => {
    history.splice(0, history.length, reference);
    if (!show(reference)) return false;
    dialog.showModal();
    return true;
  };
}
