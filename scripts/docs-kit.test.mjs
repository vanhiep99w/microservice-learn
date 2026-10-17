import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';
import { D2InteractiveDiagram } from '@vanhiep99w/docs-kit/components/d2-interactive';
import { parser } from './source-examples.mjs';

const processor = unified().use(remarkD2, {
  cacheDir: '.next/cache/docs-kit/d2',
  concurrency: 1,
  defaultCaption: 'Sơ đồ',
});

async function renderBlock(path, select) {
  const blocks = [];
  visit(parser.parse(await readFile(path, 'utf8')), 'code', (node) => {
    if (node.lang === 'd2') blocks.push(node);
  });
  const node = blocks.find(select);
  assert.ok(node, `Missing D2 example in ${path}`);
  const result = await processor.run({ type: 'root', children: [node] }, { path });
  const component = result.children[0];
  // Read literal props from the generated ESTree without evaluating MDX.
  const props = Object.fromEntries(component.attributes.map((attribute) => {
    const expression = attribute.value.data.estree.body[0].expression;
    return [attribute.name, expression.type === 'Literal' ? expression.value : JSON.parse(expression.arguments[0].value)];
  }));
  return { component, props };
}

test('docs-kit keeps existing diagrams static and builds source-linked opt-in diagrams', async () => {
  const path = '13-orchestration.md';
  const ordinary = await renderBlock(path, (node) => node.meta.includes('Kubernetes Cluster'));
  assert.equal(ordinary.component.name, 'D2Diagram');
  assert.equal(ordinary.props.source, undefined);
  assert.equal(ordinary.props.boards, undefined);

  const linked = await renderBlock(path, (node) => node.meta.includes('4.8.'));
  assert.equal(linked.component.name, 'D2InteractiveDiagram');
  for (const theme of ['lightSvg', 'darkSvg']) {
    assert.match(linked.props[theme], /href="\.\/\?source=13-orchestration/u);
    assert.match(linked.props[theme], /4-3-deployment\.yaml/u);
    assert.match(linked.props[theme], /4-1-pod\.yaml/u);
  }
});

test('Saga steps preserve compensation state and all boards have a no-JS fallback', async () => {
  const { component, props } = await renderBlock('17-data-patterns/saga.md', (node) => node.meta.includes('mode=steps'));
  assert.equal(component.name, 'D2InteractiveDiagram');
  assert.equal(props.mode, 'steps');
  assert.equal(props.boards.length, 6);
  assert.equal(props.boards[0].kind, 'root');
  assert.ok(props.boards.slice(1).every((board) => board.kind === 'step'));
  for (const theme of ['lightSvg', 'darkSvg']) {
    const final = props.boards.at(-1)[theme];
    assert.match(final, /CANCELLED/u);
    assert.match(final, /REFUNDED/u);
    assert.match(final, /reservation/u);
  }
  const html = renderToStaticMarkup(createElement(D2InteractiveDiagram, props));
  assert.match(html, /Explore 6 views/u);
  assert.match(html, /All views/u);
  assert.match(html, /D2 source/u);
  assert.match(html, /CANCELLED/u);
  assert.doesNotMatch(html, /<iframe|<canvas/u);
});
