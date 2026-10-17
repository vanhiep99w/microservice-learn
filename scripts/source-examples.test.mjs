import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { unified } from 'unified';
import { remarkSourceRefs } from './remark-source-refs.mjs';
import { buildSourceExamples, collectExamples, parser, sourceRequest, validateReferences } from './source-examples.mjs';

const markdown = '---\ntitle: "Ví dụ"\n---\n\n```js source="src/demo.js"\nconst tag = "<script>";\nconsole.log(tag);\n```\n\n[Đọc source](?source=demo&snapshot=article&file=src%2Fdemo.js&lines=1-2)\n';
const snapshot = { project: 'demo', snapshot: 'article', defaultFile: 'src/demo.js', files: [{ path: 'src/demo.js', code: 'a\nb', regions: {} }] };

test('extract exact code and decode source query; leave regular links alone', () => {
  const { files, refs } = collectExamples(markdown, 'demo.md');
  assert.equal(files[0].code, 'const tag = "<script>";\nconsole.log(tag);');
  assert.equal(refs[0].file, 'src/demo.js');
  assert.equal(sourceRequest('https://example.com/?source=demo'), null);
  assert.equal(sourceRequest('#heading'), null);
});

test('collect D2 node links for the same build-time validation as SourceRef', () => {
  const diagram = [
    '```d2 interactive title="Code links"',
    'deployment: Deployment {',
    '  link: "?source=demo&snapshot=article&file=src%2Fdemo.js&lines=1-2"',
    '}',
    'pod.link: "./?source=demo&file=src%2Fdemo.js"',
    '# ignored.link: "?source=missing"',
    'external.link: "https://example.com/?source=external"',
    '```',
  ].join('\n');
  const { files, refs } = collectExamples(diagram, 'demo.md');
  assert.deepEqual(files, []);
  assert.equal(refs.length, 2);
  assert.deepEqual(refs[0], { project: 'demo', snapshot: 'article', file: 'src/demo.js', lines: '1-2' });
  validateReferences(refs.map((request) => ({ request, filename: 'demo.md' })), new Map([['demo', snapshot]]));
  assert.throws(() => collectExamples('```d2\na.link: "?source=demo&lines=1&region=x"\n```', 'demo.md'), /Invalid SourceRef/u);
  assert.equal(collectExamples('```js\nconst example = \'link: "?source=missing"\';\n```', 'demo.md').refs.length, 0);
});

test('reject duplicate, unknown, conflicting params and unsafe source paths', () => {
  for (const url of ['?source=demo&source=bad', '?source=demo&unknown=x', '?source=demo&region=a&lines=1', '?source=']) {
    assert.throws(() => sourceRequest(url));
  }
  assert.throws(() => collectExamples('```js source="../secret.js"\na\n```', 'test.md'));
  assert.throws(() => collectExamples(markdown + markdown, 'test.md'), /duplicate source/u);
});

test('broken project, snapshot, file, region or line reference fails build', () => {
  const snapshots = new Map([['demo', snapshot]]);
  const validate = (request) => validateReferences([{ request, filename: 'demo.md' }], snapshots);
  validate({ project: 'demo', lines: '1-2' });
  for (const request of [
    { project: 'missing' }, { project: 'demo', snapshot: 'missing' },
    { project: 'demo', file: 'missing.js' }, { project: 'demo', region: 'missing' },
    { project: 'demo', lines: '2-1' }, { project: 'demo', lines: '0' },
    { project: 'demo', lines: '1-3' }, { project: 'demo', lines: 'NaN' },
  ]) assert.throws(() => validate(request));
});

test('remark emits SourceRef but keeps unrelated links', async () => {
  const tree = parser.parse(markdown + '\n[Other](https://example.com)\n');
  const output = await unified().use(remarkSourceRefs).run(tree);
  const ref = output.children.find((node) => node.type === 'paragraph').children[0];
  assert.equal(ref.name, 'SourceRef');
  assert.equal(ref.attributes.find((a) => a.name === 'project').value, 'demo');
  assert.equal(output.children.at(-1).children[0].type, 'link');
});

test('generate public assets, escape HTML, number lines and remove stale assets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'microservice-sources-'));
  try {
    const docsDir = join(root, 'docs');
    const outputDir = join(root, 'public');
    await mkdir(docsDir);
    await mkdir(outputDir);
    await writeFile(join(outputDir, 'stale.json'), '{}');
    await writeFile(join(docsDir, 'demo.md'), markdown);
    await buildSourceExamples({ docsDir, outputDir });
    const manifest = JSON.parse(await readFile(join(outputDir, 'manifest.json'), 'utf8'));
    assert.equal(manifest[0].id, 'demo');
    const asset = JSON.parse(await readFile(join(outputDir, manifest[0].snapshots[0].asset), 'utf8'));
    assert.match(asset.files[0].html, /data-line="1"/u);
    assert.match(asset.files[0].html, /data-line="2"/u);
    assert.match(asset.files[0].html, /--shiki-dark/u);
    assert.doesNotMatch(asset.files[0].html, /<script>/u);
    await assert.rejects(readFile(join(outputDir, 'stale.json')));
    // D2 refs must fail before removing the last known-good assets.
    const originalManifest = await readFile(join(outputDir, 'manifest.json'), 'utf8');
    await writeFile(join(docsDir, 'demo.md'), markdown + '\n```d2\na.link: "./?source=demo&file=missing.js"\n```\n');
    await assert.rejects(buildSourceExamples({ docsDir, outputDir }), /missing source file/u);
    assert.equal(await readFile(join(outputDir, 'manifest.json'), 'utf8'), originalManifest);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
