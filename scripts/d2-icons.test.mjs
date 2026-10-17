import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { unified } from 'unified';
import { d2Icons, remarkD2Icons } from './d2-icons.mjs';
import { parser } from './source-examples.mjs';

const icon = d2Icons.find((entry) => entry.id === 's3');

test('vendored icons have unique catalog URLs, matching hashes and no active SVG content', async () => {
  assert.equal(new Set(d2Icons.map((entry) => entry.url)).size, d2Icons.length);
  assert.equal(new Set(d2Icons.map((entry) => entry.file)).size, d2Icons.length);
  const files = (await readdir('diagrams/icons')).filter((name) => name.endsWith('.svg')).sort();
  assert.deepEqual(files, d2Icons.map((entry) => entry.file).sort());
  for (const entry of d2Icons) {
    assert.match(entry.file, /^[a-z0-9-]+\.svg$/u);
    assert.equal(new URL(entry.url).origin, 'https://icons.d2lang.com');
    const svg = await readFile(`diagrams/icons/${entry.file}`, 'utf8');
    assert.equal(createHash('sha256').update(svg).digest('hex'), entry.sha256);
    assert.match(svg, /<svg\b/u);
    assert.doesNotMatch(svg, /<script\b|<foreignObject\b|\bon\w+\s*=|<!ENTITY/iu);
    assert.doesNotMatch(svg, /(?:href|xlink:href)\s*=\s*["'](?:https?:|\/\/|javascript:)/iu);
  }
});

test('rewrite quoted and unquoted catalog icons for canonical and generated MDX paths', async () => {
  for (const path of ['18-aws-deployment-architecture.md', '17-data-patterns/cqrs.md', 'content/docs/aws/18-aws-deployment-architecture.md', 'content/docs/patterns/data/cqrs.md']) {
    const tree = parser.parse(`\`\`\`d2 title="Storage"\nstore: S3 {icon: "${icon.url}"}\nreplica: Replica {icon: ${icon.url}}\nstore -> replica\n\`\`\``);
    const output = await unified().use(remarkD2Icons).run(tree, { path });
    const code = output.children[0].value;
    assert.doesNotMatch(code, /https:\/\/icons\.d2lang\.com/u);
    const paths = [...code.matchAll(/icon:\s*"([^"]+)"/gu)];
    assert.equal(paths.length, 2);
    for (const [, relative] of paths) {
      assert.equal(resolve(dirname(path), relative), resolve('diagrams/icons/s3.svg'));
    }
    assert.match(code, /store -> replica/u);
  }
});

test('unknown catalog icon fails build; non-D2 examples and existing unrelated URLs remain unchanged', async () => {
  const processor = unified().use(remarkD2Icons);
  const broken = parser.parse('```d2\nservice: {icon: https://icons.d2lang.com/dev/typo.svg}\n```');
  await assert.rejects(processor.run(broken, { path: 'demo.md' }), /D2 icon is not vendored/u);
  const markdown = `\`\`\`text\nnode.icon: "${icon.url}"\n\`\`\`\n\n\`\`\`d2\nnode: {icon: https://example.com/logo.svg}\n\`\`\``;
  const tree = parser.parse(markdown);
  const expected = structuredClone(tree);
  assert.deepEqual(await processor.run(tree, { path: 'demo.md' }), expected);
});
