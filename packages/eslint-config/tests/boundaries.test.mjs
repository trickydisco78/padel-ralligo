import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ESLint } from 'eslint';

import { boundaries, uiBoundaries } from '../boundaries.js';

async function lint(filePath, code, config = boundaries) {
  const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText(code, { filePath });
  return result.messages.filter((m) => m.ruleId === 'no-restricted-imports');
}

const violation = async (filePath, code, config) => {
  const messages = await lint(filePath, code, config);
  assert.equal(messages.length, 1, `expected one boundary error for ${filePath}: ${code}`);
  assert.equal(messages[0].severity, 2, 'boundary violations must be errors, not warnings');
};

const allowed = async (filePath, code, config) => {
  assert.deepEqual(await lint(filePath, code, config), [], `expected no boundary error for ${filePath}: ${code}`);
};

test('deep imports into another package are errors', async () => {
  await violation('src/a.js', "import { x } from '@padel/destinations/src/internal';");
  await violation('src/a.js', "import { x } from '@padel/supabase/src';");
  await allowed('src/a.js', "import { x } from '@padel/destinations';");
  await allowed('src/a.js', "import { x } from '@padel/supabase/testing';");
});

test('the domain layer cannot import any other layer', async () => {
  for (const layer of ['application', 'infrastructure', 'presentation']) {
    await violation('src/domain/x.js', `import { x } from '../${layer}/x';`);
  }
  await allowed('src/domain/x.js', "import { x } from './other';");
});

test('the application layer cannot import infrastructure or presentation', async () => {
  await violation('src/application/x.js', "import { x } from '../infrastructure/x';");
  await violation('src/application/x.js', "import { x } from '../presentation/x';");
  await allowed('src/application/x.js', "import { x } from '../domain/x';");
});

test('the infrastructure layer cannot import application or presentation', async () => {
  await violation('src/infrastructure/x.js', "import { x } from '../application/x';");
  await violation('src/infrastructure/x.js', "import { x } from '../presentation/x';");
  await allowed('src/infrastructure/x.js', "import { x } from '../domain/x';");
});

test('the presentation layer cannot import infrastructure but may use the rest', async () => {
  await violation('src/presentation/x.js', "import { x } from '../../infrastructure/x';");
  await allowed('src/presentation/x.js', "import { x } from '../../application/x';");
  await allowed('src/presentation/x.js', "import { x } from '../../domain/x';");
  await allowed('src/presentation/x.js', "import { x } from '../../composition';");
});

test('@padel/ui cannot depend on domain packages', async () => {
  for (const pkg of ['auth', 'destinations', 'listings', 'bookings', 'players', 'profiles', 'trips']) {
    await violation('src/components/x.js', `import { x } from '@padel/${pkg}';`, uiBoundaries);
  }
  await allowed('src/components/x.js', "import { x } from '@padel/core';", uiBoundaries);
});
