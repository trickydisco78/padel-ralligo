import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packagesDir = join(fileURLToPath(import.meta.url), '../../..');

const read = (pkg, file) => readFileSync(join(packagesDir, pkg, file), 'utf8');
const manifest = (pkg) => JSON.parse(read(pkg, 'package.json'));

/** Packages with one explicit public entry point (plus test helpers where listed). */
const publicApi = {
  auth: ['.'],
  destinations: ['.'],
  listings: ['.'],
  profiles: ['.'],
  ui: ['.'],
  query: ['.', './testing'],
  supabase: ['.', './testing'],
};

test('every public package exposes only its intended entry points', () => {
  for (const [pkg, expected] of Object.entries(publicApi)) {
    assert.deepEqual(Object.keys(manifest(pkg).exports ?? {}), expected, `@padel/${pkg} exports`);
  }
});

test('the workspace has no public package missing from this check', () => {
  const sourcePackages = readdirSync(packagesDir).filter((name) => {
    const { main } = manifest(name);
    return typeof main === 'string' && main.startsWith('src/');
  });
  // core is primitives-only and predates `exports`; config packages have no `main`.
  const unchecked = sourcePackages.filter((name) => !(name in publicApi) && name !== 'core');
  assert.deepEqual(unchecked, [], 'add new source packages to publicApi in this test');
});

test('package entry points never re-export infrastructure internals or database types', () => {
  for (const pkg of Object.keys(publicApi)) {
    const index = read(pkg, 'src/index.ts');
    assert.doesNotMatch(index, /from ['"]\.\/infrastructure/, `@padel/${pkg} re-exports infrastructure`);
    assert.doesNotMatch(index, /mapper|composition/, `@padel/${pkg} re-exports a mapper or composition module`);
  }
});

test('domain packages do not re-export the generated database types', () => {
  for (const pkg of ['auth', 'destinations', 'listings', 'profiles']) {
    assert.doesNotMatch(read(pkg, 'src/index.ts'), /Database/, `@padel/${pkg} exposes database types`);
  }
});
