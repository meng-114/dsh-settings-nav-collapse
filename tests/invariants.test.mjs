/**
 * Invariant tests for @mengli114/dsh-settings-nav-collapse.
 *
 * This is a browser-side plugin: the interesting behaviour (rail vs compact vs
 * expanded, focus, layout) can only be judged in a real browser, and the repo
 * deliberately has no test-time DOM. What *can* be pinned down in CI — and what
 * actually regressed during development — are the structural invariants below:
 * package/manifest/module-id agreement, syntax, the anchoring policy (no
 * package-internal attribute, no hashed class name, no official client import),
 * and the published file list.
 *
 * Run: npm test
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const pkg = JSON.parse(read('package.json'));

const CLIENT = 'client.js';
const HOST = 'index.js';
const clientSrc = read(CLIENT);
const hostSrc = read(HOST);
const patchSrc = read('cordis.patch.yml');

/** The template literal assigned to `const CSS = \`...\`;` in client.js. */
function cssBlock(src) {
  const start = src.indexOf('const CSS = `');
  assert.notEqual(start, -1, 'client.js must define a CSS template literal');
  const from = start + 'const CSS = `'.length;
  const end = src.indexOf('`;', from);
  assert.notEqual(end, -1, 'the CSS template literal must be terminated');
  return src.slice(from, end);
}

/** A module-level constant of client.js, as source text without quotes. */
function constValue(src, name) {
  const found = src.match(new RegExp(`\\b${name} = ([^;]+);`));
  assert.ok(found, `client.js must define ${name}`);
  return found[1].trim().replace(/^['"]|['"]$/g, '');
}

const rowListSelector = constValue(clientSrc, 'ROW_LIST_SELECTOR');
const railWidth = constValue(clientSrc, 'RAIL_WIDTH');
const compactWidth = constValue(clientSrc, 'COMPACT_WIDTH');

/** The CSS with its `${CONST}` interpolations resolved, so assertions read the
 *  effective stylesheet rather than the template source. */
const css = cssBlock(clientSrc)
  .split('${ROW_LIST_SELECTOR}').join(rowListSelector)
  .split('${RAIL_WIDTH}').join(railWidth)
  .split('${COMPACT_WIDTH}').join(compactWidth);

test('package name is one identity across package.json, the patch layer and the client module id', () => {
  const name = pkg.name;
  assert.match(name, /^@mengli114\/dsh-[a-z0-9-]+$/);

  const inserted = patchSrc.match(/name:\s*'([^']+)'/);
  assert.ok(inserted, 'cordis.patch.yml must insert an entry by name');
  assert.equal(inserted[1], name, 'cordis.patch.yml must insert the published package name');

  const moduleId = clientSrc.match(/__ModuleLoader__\.load\(\{\s*\n\s*id:\s*'([^']+)'/);
  assert.ok(moduleId, 'client.js must register through window.__ModuleLoader__.load({ id, factory })');
  assert.equal(moduleId[1], name, 'the client module id must equal the package name');
});

test('the patch layer is a loader insert, not a disable', () => {
  assert.match(patchSrc, /^-\s*insert:/m);
  assert.doesNotMatch(patchSrc, /disabled:\s*true/);
});

test('both entry points parse', () => {
  for (const file of [HOST, CLIENT]) {
    execFileSync(process.execPath, ['--check', join(root, file)], { stdio: 'pipe' });
  }
});

test('the plugin never imports an official Harness client package', () => {
  for (const [file, src] of [[CLIENT, clientSrc], [HOST, hostSrc]]) {
    assert.doesNotMatch(src, /@deepseek-ai\//, `${file} must not reference @deepseek-ai/*`);
  }
  // ...the module-load-order declaration in package.json is the one legal mention.
  assert.deepEqual(pkg.dsh.client.inject, ['@deepseek-ai/dsh-client-ui-settings-general']);
});

test('the panel is anchored on our own marker, never on a package-internal attribute', () => {
  assert.doesNotMatch(css, /data-shortcut-modal/, 'CSS must not key on a package-internal attribute');
  assert.doesNotMatch(css, /VOzbGW|[A-Za-z0-9]{6}_[a-zA-Z]+/, 'CSS must not key on a hashed class name');
  assert.match(css, /\[data-dsh-settings-nav-panel\]/, 'CSS must be scoped by our panel marker');
  assert.match(clientSrc, /PANEL_MARK = 'data-dsh-settings-nav-panel'/);
  assert.match(clientSrc, /safeSet\(panel,\s*PANEL_MARK/, 'the marker must actually be applied at runtime');
  assert.match(clientSrc, /safeRemove\(panelEl,\s*PANEL_MARK\)/, 'the marker must be removed on teardown');
});

test('the version-independent dialog anchor is primary and the legacy one is only a fallback', () => {
  const primary = clientSrc.match(/PANEL_SELECTOR = '([^']+)'/);
  const fallback = clientSrc.match(/PANEL_SELECTOR_FALLBACK = '([^']+)'/);
  assert.equal(primary?.[1], '[role="dialog"][aria-modal="true"]');
  assert.equal(fallback?.[1], '[data-shortcut-modal="settings"]');
  assert.match(
    clientSrc,
    /closest\(PANEL_SELECTOR\)\s*\|\|\s*node\.closest\(PANEL_SELECTOR_FALLBACK\)/,
    'the dialog selector must be tried first',
  );
});

test('the applied state is written only when it changes, and the style is re-asserted on the same path', () => {
  assert.match(
    clientSrc,
    /safeGet\(root,\s*ATTR\)\s*!==\s*next/,
    'an unchanged value must not be written: attribute-scoped rules re-evaluate the document',
  );
  const sync = clientSrc.match(/const sync = React\.useCallback\(\(nextRequested\) => \{([\s\S]*?)\n {6}\}, \[\]\);/);
  assert.ok(sync, 'client.js must define the shared sync() helper');
  assert.match(sync[1], /markPanel\(panel\);/, 'sync() must re-assert the panel marker a dispose removed');
  assert.match(sync[1], /ensureStyle\(\);/, 'sync() must re-create the style a dispose may have removed');
  assert.match(sync[1], /applyState\(panel,/, 'sync() must re-assert the applied state');
});

test('the navigation row gap targets the row list, not the nav column', () => {
  assert.match(css, /\[data-dsh-settings-nav-panel\] nav > div:last-child\s*\{[^}]*gap:/);
  assert.doesNotMatch(
    css,
    /\[data-dsh-settings-nav-panel\] nav\s*\{[^}]*\bgap:/,
    'a gap on nav cannot reach the rows (they live one level deeper)',
  );
});

test('the collapsed state always announces the applied value, and the compact fallback counts as collapsed', () => {
  assert.match(clientSrc, /const collapsed = applied !== 'expanded';/);
  assert.match(clientSrc, /'aria-pressed': collapsed \? 'true' : 'false'/);
});

test('the modal autofocus node is never hidden', () => {
  const hideRule = css.match(/nav > :first-child:not\(button\):not\(a\):not\(input\)([^{]*)\{/);
  assert.ok(hideRule, 'the heading-hiding rule must exist');
  assert.match(hideRule[1], /:not\(\[data-modal-autofocus\]\)/);
});

test('nothing is forced with !important', () => {
  assert.doesNotMatch(css, /!important/);
});

test('every file named in package.json#files is present', () => {
  for (const rel of pkg.files) {
    assert.ok(existsSync(join(root, rel)), `package.json#files lists a missing path: ${rel}`);
  }
  for (const rel of Object.values(pkg.exports)) {
    assert.ok(existsSync(join(root, rel)), `package.json#exports points at a missing path: ${rel}`);
  }
});

test('the web manifest declares a web client and a real patch file', () => {
  assert.equal(pkg.dsh.client.platform, 'web');
  assert.equal(pkg.dsh.client.immediately, true);
  assert.ok(existsSync(join(root, pkg.dsh.bundle.patch)), 'dsh.bundle.patch must exist');
  assert.match(pkg.dsh.engines.dsh, /^>=0\.1\.5/);
});
