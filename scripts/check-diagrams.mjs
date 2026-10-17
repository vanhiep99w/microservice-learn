import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { visit } from 'unist-util-visit';
import { parser } from './source-examples.mjs';
import { unified } from 'unified';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';
import { d2IconAssetsRoot, remarkD2Icons } from './d2-icons.mjs';
import { sourceDocuments } from './diagram-inventory.mjs';

export async function checkDiagrams(root = '.') {
  const files = await sourceDocuments(root);
  const processor = unified().use(remarkD2Icons).use(remarkD2, {
    assetsRoot: d2IconAssetsRoot,
    cacheDir: '.next/cache/docs-kit/d2',
    concurrency: 1,
    defaultCaption: 'Sơ đồ',
  });
  let count = 0;
  let diagramFiles = 0;
  const errors = [];
  for (const file of files) {
    const path = join(root, file);
    const tree = parser.parse(await readFile(path, 'utf8'));
    const blocks = [];
    visit(tree, 'code', (node) => { if (node.lang === 'd2') blocks.push(node); });
    if (blocks.length) diagramFiles++;
    for (const node of blocks) {
      try {
        const titleMatch = node.meta?.match(/(?:^|\s)title=(?:"([^"]*)"|'([^']*)'|([^'"\s]+))(?:\s|$)/u);
        const title = titleMatch?.slice(1).find((value) => value !== undefined);
        assert.ok(title?.trim(), 'D2 requires a non-empty title');
        const rendered = await processor.run({ type: 'root', children: [node] }, { path });
        const component = rendered.children[0];
        assert.ok(['D2Diagram', 'D2InteractiveDiagram'].includes(component?.name), 'D2 fence did not compile to a diagram component');
        const caption = component.attributes.find((attribute) => attribute.name === 'caption')?.value?.data?.estree?.body[0]?.expression?.value;
        assert.equal(caption, title.trim(), 'Rendered D2 caption differs from authored title');
        for (const name of ['lightSvg', 'darkSvg']) {
          const svg = component.attributes.find((attribute) => attribute.name === name)?.value?.data?.estree?.body[0]?.expression?.value;
          assert.match(svg ?? '', /<svg\b/u, `Missing rendered ${name}`);
        }
        count++;
      } catch (error) {
        errors.push(`${path}:${node.position.start.line}: ${error.message}`);
      }
    }
  }
  console.log(`D2: ${count} rendered blocks in ${diagramFiles} files (${files.length} sources scanned), ${errors.length} errors`);
  if (errors.length) throw new Error(errors.join('\n'));
  return { count, diagramFiles, sources: files.length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await checkDiagrams();
}
