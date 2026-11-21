import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupOctoDialogueSync } from '../public/games/tri-arena/octo-dialogue-sync.js';

const publicRoot = fileURLToPath(new URL('../public/', import.meta.url));
const gameRoot = game => resolve(publicRoot, 'games', game);
const games = ['croba-planet', 'tri-arena', 'mosswake-creek', 'blackroot-vale'];

async function filesIn(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesIn(path));
    else {
      assert.equal(entry.isFile(), true, 'Export must not contain symlinks');
      files.push(path);
    }
  }
  return files;
}

test('hosted game imports and static assets resolve inside the public export', async () => {
  for (const game of games) {
    const base = gameRoot(game);
    assert.ok((await stat(resolve(base, 'index.html'))).isFile());
    const missing = [];
    for (const file of await filesIn(base)) {
      const extension = extname(file);
      if (!['.js', '.mjs', '.css', '.html'].includes(extension)) continue;
      const text = await readFile(file, 'utf8');
      const patterns = ['.js', '.mjs'].includes(extension) ? [
        /\b(?:import|export)\s+(?:[^'";]+?\s+from\s*)?['"]([^'"]+)['"]/g,
        /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /\bnew URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g,
      ] : extension === '.html' ? [/\b(?:src|href)\s*=\s*['"]([^'"]+)['"]/g]
        : [/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g];
      for (const pattern of patterns) {
        for (const [, specifier] of text.matchAll(pattern)) {
          if (/^(?:[a-z]+:|#|\/\/)/i.test(specifier)) continue;
          const clean = specifier.split(/[?#]/)[0];
          if (!clean) continue;
          const target = clean.startsWith('/') ? resolve(publicRoot, `.${clean}`) : resolve(dirname(file), clean);
          assert.ok(target.startsWith(publicRoot), `${game} references outside public: ${specifier}`);
          try { await stat(target); }
          catch { missing.push(`${relative(base, file)} -> ${specifier}`); }
        }
      }
    }
    assert.deepEqual(missing, [], `${game} has missing static resources`);
  }
});

test('static exports exclude backend output and credential files', async () => {
  for (const game of games) {
    for (const file of await filesIn(gameRoot(game))) {
      const path = relative(gameRoot(game), file);
      assert.doesNotMatch(path, /(^|\/)(?:server|node_modules|\.openai|\.git)(?:\/|$)/);
      assert.doesNotMatch(path, /(?:^|\/)(?:\.env|credentials|secrets)(?:[./_-]|$)/i);
    }
  }
});

test('Arena static dialogue compatibility API retains local dialogue without network work', async () => {
  const reasons = [];
  const sync = setupOctoDialogueSync({
    onUpdate() { assert.fail('Static export must not replace bundled dialogue'); },
    onUnavailable: reason => reasons.push(reason),
    env: new Proxy({}, { get() { assert.fail('Static dialogue must not access browser networking or timers'); } }),
  });
  assert.equal(await sync.start(), false);
  assert.equal(await sync.refresh(), false);
  sync.stop();
  sync.dispose();
  assert.equal(await sync.start(), false);
  assert.deepEqual(reasons, ['static-export']);
  assert.throws(() => setupOctoDialogueSync(), /update callback/);
  const source = await readFile(resolve(gameRoot('tri-arena'), 'octo-dialogue-sync.js'), 'utf8');
  assert.doesNotMatch(source, /__octo_source|OCTO_SOURCE_TOKEN|\b(?:fetch|setInterval|setTimeout|createElement)\s*\(/);
});

test('Croba fonts are local and Arena canonical metadata uses its owned game URL', async () => {
  const css = await readFile(resolve(gameRoot('croba-planet'), 'style.css'), 'utf8');
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic|@import/);
  assert.match(css, /\.\/assets\/fonts\/dm-sans-latin-variable\.woff2/);
  assert.match(css, /font-weight: 400 700/);
  assert.match(css, /\.\/assets\/fonts\/space-grotesk-latin-variable\.woff2/);
  const html = await readFile(resolve(gameRoot('tri-arena'), 'index.html'), 'utf8');
  assert.match(html, /rel="canonical" href="https:\/\/copperstudio\.nl\/games\/tri-arena\/"/);
  assert.doesNotMatch(html, /davidwebstar\.chatgpt\.site/);
});
