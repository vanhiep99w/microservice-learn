import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { parser } from './source-examples.mjs';
import { visit } from 'unist-util-visit';

/** Canonical sources only, including nested pattern pages and aggregates. */
export async function sourceDocuments(root = '.') {
  const files = [];
  async function patterns(dir) {
    for (const entry of await readdir(join(root, dir), { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await patterns(path);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
    }
  }
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isFile() && /^\d\d-.*\.md$/u.test(entry.name)) files.push(entry.name);
    if (entry.isDirectory() && /^17-/u.test(entry.name)) await patterns(entry.name);
  }
  return files.sort();
}

export async function inventoryDiagrams(root = '.') {
  const blocks = [];
  for (const file of await sourceDocuments(root)) {
    const markdown = await readFile(join(root, file), 'utf8');
    let heading = '';
    let index = 0;
    visit(parser.parse(markdown), (node) => {
      if (node.type === 'heading') heading = markdown.slice(node.position.start.offset, node.position.end.offset).replace(/^#+\s*/u, '');
      if (node.type !== 'code') return;
      const code = node.value;
      const language = node.lang || 'text';
      // Heuristic only: trees, tables, formulas and prose with arrows also
      // match. Review the content before deciding whether to migrate it.
      const hasDiagramGlyphs = /[┌┐└┘╔╗╚╝├┬┤┴]|[─━═]{2,}|(?:-+|=+)>|[→←⇄⇆▼↓]/u.test(code);
      const kind = language === 'mermaid' ? 'mermaid'
        : language === 'd2' ? 'd2'
          : language === 'text' && hasDiagramGlyphs ? 'ascii-candidate'
            : 'code-or-text';
      blocks.push({ file, index: index++, line: node.position.start.line, heading, language, kind,
        hash: createHash('sha256').update(code).digest('hex').slice(0, 16),
        code, raw: markdown.slice(node.position.start.offset, node.position.end.offset),
        start: node.position.start.offset, end: node.position.end.offset });
    });
  }
  return blocks;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const blocks = await inventoryDiagrams();
  if (process.argv.includes('--json')) console.log(JSON.stringify(blocks, null, 2));
  else {
    for (const block of blocks.filter((b) => b.kind === 'ascii-candidate' || b.kind === 'mermaid')) {
      console.log(`${block.file}:${block.line}\t${block.kind}\t${block.hash}\t${block.heading}`);
    }
    console.log('\nTotals:', blocks.reduce((sum, b) => ({ ...sum, [b.kind]: (sum[b.kind] || 0) + 1 }), {}));
  }
}
