import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parser, collectExamples, validateReferences } from './source-examples.mjs';

const features = [
  ['annotated', 'annotated-example', 'remarkAnnotatedExample', 'annotated-example', 'AnnotatedExample'],
  ['code-walkthrough', 'annotated-example/walkthrough', 'remarkCodeWalkthrough', 'code-walkthrough', 'CodeWalkthrough'],
  ['terminal-session', 'terminal-session', 'remarkTerminalSession', 'terminal-session', 'TerminalSession'],
  ['marble', 'marble', 'remarkMarble', 'marble', 'MarbleDiagram'],
  ['code-diff', 'code-diff', 'remarkCodeDiff', 'code-diff', 'CodeDiff'],
  ['data-inspector', 'data-inspector', 'remarkDataInspector', 'data-inspector', 'DataInspector'],
  ['protocol-exchange', 'protocol-exchange', 'remarkProtocolExchange', 'protocol-exchange', 'ProtocolExchange'],
  ['span-waterfall', 'span-waterfall', 'remarkSpanWaterfall', 'span-waterfall', 'SpanWaterfall'],
  ['concurrency-lanes', 'concurrency-lanes', 'remarkConcurrencyLanes', 'concurrency-lanes', 'ConcurrencyLanes'],
  ['state-transition', 'state-transition', 'remarkStateTransition', 'state-transition', 'StateTransitionExplorer'],
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
        if (language === 'annotated') assert.ok(html.includes(props.data.annotations[0].title), path);
      }
      t.diagnostic(`${language}: ${examples.length} examples validated and SSR-rendered`);
    });
  }
});

test('descriptor artifacts publish original code/JSON and validate embedded source links', () => {
  const markdown = [
    '```annotated source="snippets/demo.ts"',
    'title: Example',
    'language: typescript',
    'code: |-',
    '  const retries = 3;',
    'annotations:',
    '  - id: retry',
    '    title: Retry',
    '    description: Example only',
    '    ranges: [[1, 1]]',
    'source:',
    '  project: demo',
    '  snapshot: article',
    '  file: snippets/demo.ts',
    '```',
    '```data-inspector source="snippets/event.json"',
    'title: Payload',
    'json: \'{"sequence":9007199254740993}\'',
    '```',
  ].join('\n');
  const { files, refs } = collectExamples(markdown, 'demo.md');
  assert.equal(files[0].language, 'typescript');
  assert.equal(files[0].code, 'const retries = 3;');
  assert.equal(files[1].language, 'json');
  assert.equal(files[1].code, '{"sequence":9007199254740993}');
  const snapshots = new Map([['demo', { project: 'demo', snapshot: 'article', files }]]);
  validateReferences(refs.map((request) => ({ request, filename: 'demo.md' })), snapshots);
  assert.throws(() => validateReferences([{ request: { ...refs[0], file: 'missing.ts' }, filename: 'demo.md' }], snapshots), /missing source file/u);
  assert.throws(() => collectExamples(markdown.replace('code: |-', 'code: 123\nignored: |-'), 'demo.md'), /missing artifact code/u);
  assert.throws(() => collectExamples(markdown.replace('title: Example', 'title: A\ntitle: B'), 'demo.md'), /unique|Map keys/u);
});

test('walkthrough and diff source references participate in manifest validation', () => {
  for (const markdown of [
    '```code-diff\ntitle: Example\nbefore:\n  code: a\n  source: { project: missing, file: old.ts }\nafter:\n  code: b\n```',
    '```code-walkthrough\ntitle: Example\nsnapshots:\n  - id: a\n    title: A\n    code: a\n    source: { project: missing, file: a.ts }\nsteps: []\n```',
  ]) {
    const { refs } = collectExamples(markdown, 'example.md');
    assert.equal(refs.length, 1);
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
