import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { visit } from 'unist-util-visit';
import { parser } from './source-examples.mjs';
import { unified } from 'unified';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';

export async function checkDiagrams(root = '.') {
  const files = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isFile() && /^\d\d-.*\.md$/u.test(entry.name)) files.push(join(root, entry.name));
    if (entry.isDirectory() && /^17-/u.test(entry.name)) {
      for (const name of await readdir(join(root, entry.name))) {
        if (name.endsWith('.md')) files.push(join(root, entry.name, name));
      }
    }
  }
  const processor = unified().use(remarkD2, {
    cacheDir: '.next/cache/docs-kit/d2',
    concurrency: 1,
    defaultCaption: 'Sơ đồ',
  });
  let count = 0;
  const errors = [];
  for (const path of files.sort()) {
    const tree = parser.parse(await readFile(path, 'utf8'));
    const blocks = [];
    visit(tree, 'code', (node) => { if (node.lang === 'd2') blocks.push(node); });
    for (const node of blocks) {
      try {
        await processor.run({ type: 'root', children: [node] }, { path });
        count++;
      } catch (error) {
        errors.push(`${path}:${node.position.start.line}: ${error.message}`);
      }
    }
  }
  console.log(`D2: ${count} rendered blocks, ${errors.length} errors`);
  if (errors.length) throw new Error(errors.join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkDiagrams();
}
