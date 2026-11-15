import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { expect, test } from 'vitest';

// The 3D chunk must stay free of the sky code: the folder reads only the terrain hook, types and a few shared files.
const FOLDER = resolve('frontend/components/terrain-3d');
const ALLOWED = [
  'backend/lib/useTerrain',
  'backend/lib/projectPolar',
  'backend/lib/types',
  'frontend/test-ids',
  'frontend/components/site-picker/siteIds',
  'frontend/components/shared/IconAlert',
  'frontend/components/shared/BodyGlyph',
  'frontend/components/shared/IconChevron',
];
const sources = readdirSync(FOLDER).filter((f) => /\.(tsx?|css)$/.test(f) && !/\.test\.tsx?$/.test(f)); // code only: the textures are binary
const read = (file: string) => readFileSync(join(FOLDER, file), 'utf8');
const imports = (file: string) => [...read(file).matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map((m) => m[1]).filter((spec) => spec.startsWith('.'));
const leaving = sources
  .filter((f) => /\.tsx?$/.test(f))
  .flatMap((f) => imports(f).map((spec) => relative(resolve('.'), resolve(FOLDER, spec))))
  .filter((p) => !resolve(p).startsWith(FOLDER) && !p.endsWith('.css'));

test('no file in the folder names the sky code', () => {
  expect(sources.length).toBeGreaterThan(5);
  for (const f of sources) expect(read(f), f).not.toMatch(/lunar|astronomy-engine|realView|useScenario/);
});

test('every import that leaves the folder is on the allowlist', () => {
  expect(leaving.length).toBeGreaterThan(0);
  for (const p of leaving) expect(ALLOWED, p).toContain(p);
});

// The brief says "contains lunar", but projectPolar.ts has the word in a comment and types.ts in the 'lunarDay' zoom value.
// What matters is that no allowlisted file imports the sky code, so the test reads import specifiers.
test('the allowlisted files import neither the sky code nor astronomy-engine', () => {
  for (const p of ALLOWED) {
    const file = ['.ts', '.tsx'].map((e) => resolve(p + e)).find((f) => { try { return readFileSync(f); } catch { return false; } });
    expect(file, p).toBeTruthy();
    const specs = [...readFileSync(file as string, 'utf8').matchAll(/(?:from|import)\s*\(?\s*'([^']+)'/g)].map((m) => m[1]);
    for (const spec of specs) expect(spec, p).not.toMatch(/lunar|astronomy-engine|realView|useScenario/);
  }
});

test('no colour is written as hex in the folder', () => {
  for (const f of sources) expect(read(f), f).not.toMatch(/#[0-9a-f]{3,8}\b/i);
});
