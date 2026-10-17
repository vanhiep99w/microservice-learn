import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parser, collectExamples, validateReferences } from './source-examples.mjs';

const features = [
  ['code-walkthrough', 'code-walkthrough', 'remarkCodeWalkthrough', 'code-walkthrough', 'CodeWalkthrough'],
  ['terminal-session', 'terminal-session', 'remarkTerminalSession', 'terminal-session', 'TerminalSession'],
  ['code-diff', 'code-diff', 'remarkCodeDiff', 'code-diff', 'CodeDiff'],
  ['protocol-exchange', 'protocol-exchange', 'remarkProtocolExchange', 'protocol-exchange', 'ProtocolExchange'],
  ['span-waterfall', 'span-waterfall', 'remarkSpanWaterfall', 'span-waterfall', 'SpanWaterfall'],
  ['concurrency-lanes', 'concurrency-lanes', 'remarkConcurrencyLanes', 'concurrency-lanes', 'ConcurrencyLanes'],
];

async function sourceDocuments() {
  const files = [];
  for (const entry of await readdir('.', { withFileTypes: true })) {
    if (entry.isFile() && /^\d\d-.*\.md$/u.test(entry.name)) files.push(entry.name);
    if (entry.isDirectory() && /^17-/u.test(entry.name)) {
      for (const name of await readdir(entry.name)) {
        if (name.endsWith('.md')) files.push(`${entry.name}/${name}`);
      }
    }
  }
  return files.sort();
}

// Read literal/JSON props emitted by docs-kit; never evaluate MDX or source code.
function componentProps(node) {
  return Object.fromEntries(node.attributes.map((attribute) => {
    const expression = attribute.value.data.estree.body[0].expression;
    return [attribute.name, expression.type === 'Literal'
      ? expression.value
      : JSON.parse(expression.arguments[0].value)];
  }));
}

test('all authored docs-kit examples validate, compile and retain server-rendered content', async (t) => {
  const byLanguage = new Map(features.map((feature) => [feature[0], []]));
  for (const path of await sourceDocuments()) {
    visit(parser.parse(await readFile(path, 'utf8')), 'code', (node) => {
      byLanguage.get(node.lang)?.push({ path, node });
    });
  }
  const config = await readFile('source.config.ts', 'utf8');
  const page = await readFile('src/app/[[...slug]]/page.tsx', 'utf8');
  const css = await readFile('src/app/globals.css', 'utf8');
  for (const [language, pluginPath, pluginName, componentPath, componentName] of features) {
    await t.test(language, async () => {
      const examples = byLanguage.get(language);
      assert.ok(examples.length, `No authored use of ${language}`);
      assert.ok(config.includes(`      ${pluginName},`), `Missing plugin ${pluginName}`);
      assert.ok(page.includes(componentName), `Missing MDX component ${componentName}`);
      assert.ok(css.includes(`/styles/${componentPath}.css`), `Missing CSS ${componentPath}`);
      const { [pluginName]: plugin } = await import(`@vanhiep99w/docs-kit/${pluginPath}`);
      const { [componentName]: Component } = await import(`@vanhiep99w/docs-kit/components/${componentPath}`);
      const processor = unified().use(plugin);
      for (const { path, node } of examples) {
        const compiled = await processor.run({ type: 'root', children: [structuredClone(node)] }, { path });
        const element = compiled.children[0];
        assert.match(element.name, new RegExp(`^${componentName}(?:WithSource)?$`, 'u'), path);
        const props = componentProps(element);
        // Render the base component here; SourceRef is validated independently.
        const html = renderToStaticMarkup(createElement(Component, props));
        assert.ok(html.includes(props.data.title), `${path}: missing accessible title`);
        assert.doesNotMatch(html, /<iframe|<canvas/u, path);
      }
      t.diagnostic(`${language}: ${examples.length} examples validated and SSR-rendered`);
    });
  }
});

test('ordinary fences preserve original source and large JSON numbers', () => {
  const markdown = [
    '```typescript source="snippets/demo.ts"',
    'const retries = 3;',
    '```',
    '```json source="snippets/event.json"',
    '{"sequence":9007199254740993}',
    '```',
    '[Source](?source=demo&snapshot=article&file=snippets%2Fdemo.ts)',
  ].join('\n');
  const { files, refs } = collectExamples(markdown, 'demo.md');
  assert.equal(files[0].language, 'typescript');
  assert.equal(files[0].code, 'const retries = 3;');
  assert.equal(files[1].language, 'json');
  assert.equal(files[1].code, '{"sequence":9007199254740993}');
  const snapshots = new Map([['demo', { project: 'demo', snapshot: 'article', files }]]);
  validateReferences(refs.map((request) => ({ request, filename: 'demo.md' })), snapshots);
  assert.throws(() => validateReferences([{ request: { ...refs[0], file: 'missing.ts' }, filename: 'demo.md' }], snapshots), /missing source file/u);
});

test('walkthrough and diff source references participate in manifest validation', () => {
  for (const markdown of [
    '```code-diff\ntitle: Example\nbefore:\n  code: a\n  source: { project: missing, file: old.ts }\nafter:\n  code: b\n```',
    '```code-walkthrough\ntitle: Example\nsnapshots:\n  - id: a\n    title: A\n    code: a\n    source: { project: missing, file: a.ts }\nsteps: []\n```',
  ]) {
    const { refs } = collectExamples(markdown, 'example.md');
    assert.equal(refs.length, 1);
    const language = markdown.match(/^```([^\n]+)/u)[1];
    assert.throws(() => collectExamples(markdown.replace('```' + language, '```' + language + ' source="snippets/descriptor.yaml"'), 'example.md'), /publish each original artifact separately/u);
    assert.throws(() => collectExamples(markdown.replace('title: Example', 'title: A\ntitle: B'), 'example.md'), /unique|Map keys/u);
    assert.throws(() => validateReferences(refs.map((request) => ({ request, filename: 'example.md' })), new Map()), /unknown source project/u);
  }
});

test('compact UI keeps rollback prerequisites visible before command copy', async () => {
  const path = '17-deployment-patterns/rolling-update.md';
  const tree = parser.parse(await readFile(path, 'utf8'));
  const node = tree.children.find((child) => child.type === 'code' && child.lang === 'terminal-session');
  assert.ok(node);
  const intro = tree.children[tree.children.indexOf(node) - 1];
  assert.equal(intro.type, 'paragraph');
  const text = intro.children.map((child) => child.value ?? '').join('');
  assert.match(text, /context/u);
  assert.match(text, /không paused/u);
  const { remarkTerminalSession } = await import('@vanhiep99w/docs-kit/terminal-session');
  const { TerminalSession } = await import('@vanhiep99w/docs-kit/components/terminal-session');
  const compiled = await unified().use(remarkTerminalSession).run({ type: 'root', children: [structuredClone(node)] }, { path });
  const props = componentProps(compiled.children[0]);
  const warning = props.data.steps.find((step) => step.id === 'undo').warning;
  assert.match(warning, /schema\/data còn tương thích/u);
  const html = renderToStaticMarkup(createElement(TerminalSession, props));
  const warningAt = html.indexOf(warning);
  assert.ok(warningAt >= 0, 'Warning must be server-rendered');
  const disclosures = html.slice(0, warningAt).match(/<details\b[^>]*>|<\/details>/gu) ?? [];
  let depth = 0;
  for (const tag of disclosures) depth += tag.startsWith('</') ? -1 : 1;
  assert.equal(depth, 0, 'Warning must not be hidden inside any disclosure');
});

test('docs-kit 0.8 uses public exports only and rejects all retired fences', async () => {
  const retired = ['annotated', 'data-inspector', 'marble', 'state-transition'];
  for (const language of retired) {
    assert.throws(() => collectExamples(`\`\`\`${language}\ntitle: Obsolete\n\`\`\``, 'example.md'), /removed in docs-kit 0\.8\.0/u);
  }
  // Include README authoring examples and all aggregate/reference documents too.
  for (const path of ['README.md', ...await sourceDocuments()]) {
    visit(parser.parse(await readFile(path, 'utf8')), 'code', (node) => {
      assert.ok(!retired.includes(node.lang), `${path}:${node.position.start.line}: retired ${node.lang} fence`);
    });
  }
  const pkg = JSON.parse(await readFile('node_modules/@vanhiep99w/docs-kit/package.json', 'utf8'));
  for (const path of ['source.config.ts', 'src/app/[[...slug]]/page.tsx', 'src/app/globals.css', 'src/components/source-explorer.tsx']) {
    const code = await readFile(path, 'utf8');
    for (const [, subpath] of code.matchAll(/['"]@vanhiep99w\/docs-kit\/([^'"\s]+)['"]/gu)) {
      assert.ok(Object.hasOwn(pkg.exports, `./${subpath}`), `${path}: missing public export ${subpath}`);
    }
  }
});

test('explanations omitted by the new viewers remain readable outside descriptors', async () => {
  for (const path of ['03-loose-coupling-high-cohesion.md', '27-shared-code-strategy.md', '06-inter-service-communication.md', '07-api-gateway.md']) {
    const tree = parser.parse(await readFile(path, 'utf8'));
    const prose = [];
    visit(tree, (node) => {
      if (node.type === 'text' || node.type === 'inlineCode') prose.push(node.value);
    });
    const text = prose.join(' ');
    if (path.startsWith('03-')) assert.ok(text.includes('tên và ý nghĩa của field cũ phải được giữ ổn định'));
    if (path.startsWith('27-')) assert.ok(text.includes('không buộc toàn hệ thống deploy lockstep'));
    if (path.startsWith('06-')) assert.ok(text.includes('viewer không thực thi validation hoặc tạo order'));
    if (path.startsWith('07-')) assert.ok(text.includes('Không retry mutation nếu chưa có idempotency contract'));
  }
});

test('independent walkthrough preserves every snapshot and step in the no-JS fallback', async () => {
  const path = '29-deployment-compatibility-and-rollback.md';
  const tree = parser.parse(await readFile(path, 'utf8'));
  const node = tree.children.find((child) => child.type === 'code' && child.lang === 'code-walkthrough');
  assert.ok(node);
  const { remarkCodeWalkthrough } = await import('@vanhiep99w/docs-kit/code-walkthrough');
  const { CodeWalkthrough } = await import('@vanhiep99w/docs-kit/components/code-walkthrough');
  const compiled = await unified().use(remarkCodeWalkthrough).run({ type: 'root', children: [structuredClone(node)] }, { path });
  const props = componentProps(compiled.children[0]);
  const html = renderToStaticMarkup(createElement(CodeWalkthrough, props));
  assert.match(html, /<noscript>/u);
  for (const snapshot of props.data.snapshots) assert.ok(html.includes(`data-snapshot="${snapshot.id}"`));
  for (const step of props.data.steps) assert.ok(html.includes(step.description));
  assert.doesNotMatch(html, /annotated-example/u);
});

test('Fumadocs/Tailwind hidden rule has a scoped no-JS walkthrough override', async () => {
  const css = await readFile('src/app/globals.css', 'utf8');
  assert.match(css, /@layer base\s*\{\s*@media \(scripting: none\)\s*\{\s*\.code-walkthrough pre\[hidden\]\s*\{\s*display: block !important;/u);
});
