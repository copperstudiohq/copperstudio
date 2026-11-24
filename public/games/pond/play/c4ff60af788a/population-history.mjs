import { WEATHER, clamp, orbitAU, planetSize, populationSnapshot } from './model.mjs';

const series = {
  swimming: { label: 'Pond animals', color: '#79c9fc' },
  walking: { label: 'Land animals', color: '#f8c58a' },
  eggs: { label: 'Eggs', color: '#d3acff' },
  algae: { label: 'Algae', color: '#80e0ca' },
  grass: { label: 'Grass', color: '#b4db83' },
};
const traitSeries = {
  pond: series.swimming,
  land: series.walking,
  world: { label: 'Planet temperature', color: '#b7d99c' },
};
const traits = {
  size: { label: 'Adult size', unit: '×', digits: 2 },
  temperature: { label: 'Comfort temperature', unit: '°C', digits: 0 },
  speed: { label: 'Speed', unit: '×', digits: 2 },
  armor: { label: 'Armor', unit: '×', digits: 2 },
  sociability: { label: 'Social instinct', unit: '%', digits: 0 },
  caution: { label: 'Predator caution', unit: '%', digits: 0 },
};

const chartDay = (time) => (time / 10 + 1).toFixed(1);
const htmlText = (value) => String(value).replace(/[&<>]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[character]);

export function alignTraitSamples(first, second) {
  const ages = [...new Set([...first, ...second].map((sample) => sample.time))].sort((a, b) => a - b);
  const streams = [['first', first], ['second', second]].map(([key, source]) => ({ key, source, index: 0 }));
  return ages.map((time) => {
    const row = { time, estimated: {} };
    for (const stream of streams) {
      const { key, source } = stream;
      while (stream.index + 1 < source.length && source[stream.index + 1].time <= time) stream.index++;
      const before = source[stream.index];
      const after = source[stream.index + 1];
      if (before?.time === time) row[key] = before.value;
      else if (before?.time < time && after && Number.isFinite(before.value) && Number.isFinite(after.value)) {
        row[key] = before.value + (after.value - before.value) * (time - before.time) / (after.time - before.time);
        row.estimated[key] = true;
      }
    }
    return row;
  });
}

function roundScale(maximum) {
  const power = 10 ** Math.floor(Math.log10(maximum));
  return Math.ceil(maximum / power) * power;
}

export function mountPopulationHistory(dialog) {
  const canvas = dialog.querySelector('canvas');
  const chart = canvas.getContext('2d');
  const toggles = dialog.querySelector('#population-series');
  const scrubber = dialog.querySelector('#population-sample');
  const details = dialog.querySelector('#population-values');
  const title = dialog.querySelector('h2');
  const modeControls = dialog.querySelector('#history-modes');
  const traitControls = dialog.querySelector('#history-trait-controls');
  const traitInput = dialog.querySelector('#history-trait');
  const comparisonInput = dialog.querySelector('#history-compare');
  const comparisonField = dialog.querySelector('#history-compare-field');
  const populationInput = dialog.querySelector('#history-habitat');
  const populationField = dialog.querySelector('#history-habitat-field');
  const active = { population: new Set(['swimming', 'walking', 'eggs']), traits: new Set(['pond', 'land', 'world']), compare: new Set(['first', 'second']) };
  let mode = 'population';
  let samples = [];
  let worlds = [];
  let selectedWorld;
  let latestTime;
  let geometry;

  traitInput.innerHTML = Object.entries(traits).map(([key, { label }]) => `<option value="${key}">${label}</option>`).join('');

  function comparison() {
    return mode === 'traits' && worlds.find((world) => world.id === comparisonInput.value);
  }

  const activeSeries = () => active[comparison() ? 'compare' : mode];
  const timeLabel = (time) => comparison() ? `Age ${(time / 10).toFixed(1)} days` : `Day ${chartDay(time)}`;

  function historyFor(planet) {
    const history = planet.history;
    const current = populationSnapshot(planet, latestTime);
    return history.at(-1)?.time === latestTime ? history.slice(0, -1).concat(current) : [...history, current];
  }

  function changeSamples() {
    const other = comparison();
    if (other) {
      const align = (planet) => historyFor(planet).map((sample) => ({ time: sample.time - planet.placedAt,
        value: sample.traits?.[populationInput.value]?.[traitInput.value] }));
      samples = alignTraitSamples(align(selectedWorld), align(other));
    } else samples = historyFor(selectedWorld);
    scrubber.max = samples.length - 1;
    const latestOverlap = other ? samples.findLastIndex((sample) => Number.isFinite(sample.first) && Number.isFinite(sample.second)) : -1;
    scrubber.value = latestOverlap >= 0 ? latestOverlap : samples.length - 1;
    scrubber.disabled = samples.length < 2;
  }

  function availableSeries() {
    if (mode === 'population') return series;
    const other = comparison();
    if (other) return {
      first: { label: selectedWorld.name, color: '#79c9fc' }, second: { label: other.name, color: '#f8c58a' },
    };
    return traitInput.value === 'temperature' ? traitSeries : { pond: traitSeries.pond, land: traitSeries.land };
  }

  function currentSeries() {
    return Object.entries(availableSeries()).filter(([key]) => activeSeries().has(key));
  }

  function seriesValue(sample, key) {
    if (comparison()) return sample[key];
    if (mode === 'population') return sample[key];
    return key === 'world' ? sample.temperature : sample.traits?.[key]?.[traitInput.value];
  }

  function format(value) {
    if (!Number.isFinite(value)) return '—';
    if (mode === 'population') return String(value);
    const { digits, unit } = traits[traitInput.value];
    return `${value.toFixed(digits)}${unit}`;
  }

  function renderToggles() {
    const options = availableSeries();
    if (!currentSeries().length) activeSeries().add(Object.keys(options)[0]);
    toggles.innerHTML = Object.entries(options).map(([key, { label, color }]) =>
      `<button type="button" class="secondary" data-population="${key}" aria-pressed="${activeSeries().has(key)}">
        <i class="dot" style="--color:${color}" aria-hidden="true"></i>${htmlText(label)}</button>`).join('');
    traitControls.hidden = mode !== 'traits';
    populationField.hidden = !comparison();
    canvas.setAttribute('aria-label', mode === 'population' ? 'Population counts by day' : 'Average inherited ' + traits[traitInput.value].label.toLowerCase() +
      (comparison() ? ' by planet age' : ' by day'));
  }
  renderToggles();

  function describe(sample) {
    const rows = currentSeries().map(([key, { label }]) => `<span>${htmlText(label)} <strong>${sample.estimated?.[key] ? '≈' : ''}${format(seriesValue(sample, key))}</strong></span>`);
    if (mode === 'population') rows.push(`<span>Total births <strong>${htmlText(sample.births)}</strong></span>`, `<span>Total hunts <strong>${htmlText(sample.hunts)}</strong></span>`);
    const other = comparison();
    const context = other ? [selectedWorld, other].map((world) => `${htmlText(world.name)} ${planetSize(world).name} · ${orbitAU(world.orbit)} AU`).join(' / ') :
      `${WEATHER[sample.weather]?.name ?? 'Weather unknown'} · ${htmlText(sample.temperature)}°C`;
    details.innerHTML = `<h3>${timeLabel(sample.time)}</h3><p>${context}</p>
      <div class="population-counts">${rows.join('')}</div>`;
    scrubber.setAttribute('aria-valuetext', timeLabel(sample.time));
  }

  function draw() {
    if (!dialog.open || !samples.length) return;
    const index = Number(scrubber.value);
    const sample = samples[index];
    describe(sample);
    const css = canvas.getBoundingClientRect();
    const scale = Math.min(2, globalThis.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(css.width * scale));
    canvas.height = Math.max(1, Math.round(css.height * scale));
    chart.setTransform(scale, 0, 0, scale, 0, 0);
    const left = mode === 'population' ? 42 : 53;
    const right = css.width - 18;
    const top = 16;
    const bottom = css.height - 25;
    const first = samples[0].time;
    const span = samples.at(-1).time - first || 1;
    geometry = { left, width: right - left, first, span };
    const x = (point) => left + (right - left) * (point.time - first) / span;
    const tracks = currentSeries();
    const values = samples.flatMap((point) => tracks.map(([key]) => seriesValue(point, key))).filter(Number.isFinite);
    const peak = Math.max(mode === 'population' ? 4 : .1, ...values);
    const floor = Math.min(0, ...values);
    const interval = roundScale((peak - floor) / 4);
    const minimum = Math.floor(floor / interval) * interval;
    const maximum = Math.ceil(peak / interval) * interval;
    const y = (value) => bottom - (bottom - top) * (value - minimum) / (maximum - minimum);

    chart.fillStyle = '#111421';
    chart.fillRect(0, 0, css.width, css.height);
    chart.font = '11px system-ui';
    chart.textBaseline = 'middle';
    if (!values.length && mode === 'traits') {
      chart.textAlign = 'center';
      chart.fillStyle = '#b8b7d0';
      chart.fillText('No recorded animals for these series', css.width / 2, css.height / 2);
      return;
    }
    chart.textAlign = 'right';
    chart.lineWidth = 1;
    const ticks = Math.round((maximum - minimum) / interval);
    for (let index = 0; index <= ticks; index++) {
      const value = minimum + index * interval;
      const height = y(value);
      chart.strokeStyle = '#35334b';
      chart.beginPath();
      chart.moveTo(left, height);
      chart.lineTo(right, height);
      chart.stroke();
      chart.fillStyle = '#b8b7d0';
      chart.fillText(format(value), left - 7, height);
    }
    chart.textAlign = 'left';
    chart.fillText(timeLabel(first), left, bottom + 15);
    if (samples.length > 1) {
      chart.textAlign = 'right';
      chart.fillText(timeLabel(samples.at(-1).time), right, bottom + 15);
    }

    const cursor = x(sample);
    chart.strokeStyle = '#f2ebff80';
    chart.beginPath();
    chart.moveTo(cursor, top);
    chart.lineTo(cursor, bottom);
    chart.stroke();
    for (const [key, { color }] of tracks) {
      chart.strokeStyle = color;
      chart.fillStyle = color;
      chart.lineWidth = 2;
      chart.beginPath();
      let drawing = false;
      for (const point of samples) {
        const value = seriesValue(point, key);
        if (!Number.isFinite(value)) {
          drawing = false;
          continue;
        }
        if (drawing) chart.lineTo(x(point), y(value));
        else chart.moveTo(x(point), y(value));
        drawing = true;
      }
      chart.stroke();
      const selected = seriesValue(sample, key);
      if (!Number.isFinite(selected)) continue;
      chart.beginPath();
      chart.arc(cursor, y(selected), 3.5, 0, 2 * Math.PI);
      chart.fill();
    }
  }

  scrubber.addEventListener('input', draw);
  modeControls.addEventListener('click', (event) => {
    const button = event.target.closest('[data-history-mode]');
    if (!button) return;
    mode = button.dataset.historyMode;
    for (const option of modeControls.querySelectorAll('button')) option.setAttribute('aria-pressed', option === button);
    changeSamples();
    renderToggles();
    draw();
  });
  for (const picker of [traitInput, comparisonInput, populationInput]) {
    picker.addEventListener('input', () => {
      if (comparison() || picker === comparisonInput) changeSamples();
      renderToggles();
      draw();
    });
  }
  toggles.addEventListener('click', (event) => {
    const button = event.target.closest('[data-population]');
    if (!button) return;
    const key = button.dataset.population;
    const visible = activeSeries();
    if (visible.has(key) && currentSeries().length === 1) return;
    if (visible.has(key)) visible.delete(key);
    else visible.add(key);
    button.setAttribute('aria-pressed', visible.has(key));
    draw();
  });
  canvas.addEventListener('pointerdown', (event) => {
    if (!geometry) return;
    const { left, width, first, span } = geometry;
    const offset = event.clientX - canvas.getBoundingClientRect().left - left;
    const time = first + clamp(offset / width, 0, 1) * span;
    let closest = 0;
    for (let index = 1; index < samples.length; index++) {
      if (Math.abs(samples[index].time - time) < Math.abs(samples[closest].time - time)) closest = index;
    }
    scrubber.value = closest;
    draw();
  });
  new ResizeObserver(draw).observe(canvas);

  return (planet, time, planets) => {
    selectedWorld = planet;
    latestTime = time;
    worlds = planets.filter((world) => world !== planet);
    const prior = comparisonInput.value;
    comparisonInput.replaceChildren(new Option('None', ''), ...worlds.map((world) => new Option(world.name, world.id)));
    if (worlds.some((world) => world.id === prior)) comparisonInput.value = prior;
    comparisonField.hidden = !worlds.length;
    changeSamples();
    renderToggles();
    title.textContent = `${planet.name} population history`;
    dialog.showModal();
    draw();
  };
}
