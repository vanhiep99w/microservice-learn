import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { inventoryDiagrams } from './diagram-inventory.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'diagram-inventory-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test('inventory scans canonical docs only and returns stable source positions', async (t) => {
  const root = await fixture(t);
  const markdown = '# Bài viết\n\n## Luồng chính\n\n```d2 title="Ví dụ"\na -> b\n```\n';
  await writeFile(join(root, '02-example.md'), markdown);
  await mkdir(join(root, '17-patterns'));
  await writeFile(join(root, '17-patterns', 'example.md'), '# Pattern\n\n```mermaid\ngantt\n```\n');
  await mkdir(join(root, 'content'));
  await writeFile(join(root, 'content', '01-generated.md'), markdown);
  await writeFile(join(root, 'README.md'), markdown);
  const blocks = await inventoryDiagrams(root);
  assert.deepEqual(blocks.map(({ file, kind }) => [file, kind]), [
    ['02-example.md', 'd2'], ['17-patterns/example.md', 'mermaid'],
  ]);
  assert.equal(blocks[0].heading, 'Luồng chính');
  assert.equal(blocks[0].line, 5);
  assert.equal(blocks[0].index, 0);
  assert.equal(markdown.slice(blocks[0].start, blocks[0].end), blocks[0].raw);
  assert.equal(blocks[0].raw, '```d2 title="Ví dụ"\na -> b\n```');
  assert.match(blocks[0].hash, /^[0-9a-f]{16}$/u);
  assert.deepEqual(await inventoryDiagrams(root), blocks);
});

test('candidate detection catches box, tree and linear diagrams without treating code as diagrams', async (t) => {
  const root = await fixture(t);
  const contents = [
    '```\n┌───────┐\n│ Order │\n└───────┘\n```',
    '```text\nCommand Handler → Write Logic → DB\n```',
    '```text\nClient --> Server\n```',
    '```text\nModule\n├── Child\n```',
    '```js source="snippets/example.js"\nconst arrow = "Client --> Server";\n```',
    '```text\nGET /orders HTTP/1.1\n```',
  ];
  await writeFile(join(root, '01-examples.md'), '# Examples\n\n' + contents.join('\n\n'));
  const blocks = await inventoryDiagrams(root);
  assert.deepEqual(blocks.map((b) => b.kind), [
    'ascii-candidate', 'ascii-candidate', 'ascii-candidate', 'ascii-candidate',
    'code-or-text', 'code-or-text',
  ]);
  assert.deepEqual(blocks.map((b) => b.index), [0, 1, 2, 3, 4, 5]);
});
