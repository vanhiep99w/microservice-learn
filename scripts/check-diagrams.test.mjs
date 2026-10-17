import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { checkDiagrams } from './check-diagrams.mjs';

async function fixture(t) {
  // D2 resource roots and source paths must stay inside the project cwd.
  await mkdir('.cache', { recursive: true });
  const root = await mkdtemp(join('.cache', 'diagram-check-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('diagram check renders canonical and nested pattern sources, not generated copies', async (t) => {
  const root = await fixture(t);
  const markdown = '# Example\n\n```d2 title="Rendered example"\na -> b\n```\n';
  await writeFile(join(root, '01-example.md'), markdown);
  await mkdir(join(root, '17-patterns', 'nested'), { recursive: true });
  const quoted = '# Example\n\n```d2 title=\'Flow "Đặt hàng"\'\na -> b\n```\n';
  await writeFile(join(root, '17-patterns', 'nested', 'flow.md'), quoted);
  await mkdir(join(root, 'content'));
  await writeFile(join(root, 'content', '02-generated.md'), '```d2\ninvalid ->\n```');
  assert.deepEqual(await checkDiagrams(root), { count: 2, diagramFiles: 2, sources: 2 });
});

test('diagram check rejects missing, blank or unsupported escaped-quote titles with source location', async (t) => {
  const root = await fixture(t);
  for (const meta of ['', 'title=""', "title=' '", String.raw`title="Flow \"Đặt hàng\""`]) {
    await writeFile(join(root, '01-example.md'), `# Example\n\n\`\`\`d2 ${meta}\na -> b\n\`\`\`\n`);
    await assert.rejects(checkDiagrams(root), /01-example\.md:3: D2 requires a non-empty title/u);
  }
});

test('diagram check reports D2 syntax errors rather than counting an unrendered fence', async (t) => {
  const root = await fixture(t);
  await writeFile(join(root, '01-invalid.md'), '# Example\n\n```d2 title="Invalid"\na ->\n```\n');
  await assert.rejects(checkDiagrams(root), /01-invalid\.md:3:/u);
});
