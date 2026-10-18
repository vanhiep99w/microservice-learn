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
import { d2IconAssetsRoot, remarkD2Icons } from './d2-icons.mjs';

const processor = unified().use(remarkD2Icons).use(remarkD2, {
  assetsRoot: d2IconAssetsRoot,
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
  return { node, component, props };
}

test('docs-kit opens viewer controls by default and preserves source-linked diagrams', async () => {
  const path = '13-orchestration.md';
  const ordinary = await renderBlock(path, (node) => node.meta.includes('Kubernetes Cluster'));
  assert.equal(ordinary.component.name, 'D2InteractiveDiagram');
  assert.equal(ordinary.props.source, ordinary.node.value);
  assert.equal(ordinary.props.boards, undefined);
  assert.match(ordinary.props.lightSvg, /data:image\/svg\+xml;base64,/u);
  assert.match(ordinary.props.darkSvg, /data:image\/svg\+xml;base64,/u);
  assert.doesNotMatch(ordinary.props.lightSvg, /https:\/\/icons\.d2lang\.com/u);

  const linked = await renderBlock(path, (node) => node.meta.includes('4.8.'));
  assert.equal(linked.component.name, 'D2InteractiveDiagram');
  for (const theme of ['lightSvg', 'darkSvg']) {
    assert.match(linked.props[theme], /href="\.\/\?source=13-orchestration/u);
    assert.match(linked.props[theme], /4-3-deployment\.yaml/u);
    assert.match(linked.props[theme], /4-1-pod\.yaml/u);
  }
});

test('retired concurrency examples render as D2 while preserving timing and failure context', async (t) => {
  for (const [path, title, labels, unit] of [
    ['09-data-management.md', 'Outbox vẫn có thể phát lại', ['e1', 'sent', 'dedupe'], 'bước logic'],
    ['10-resilience-patterns.md', 'Retry với một lịch Full Jitter', ['60 ms', '150 ms', '270 ms'], 'ms'],
    ['20-aws-data-management.md', 'CQRS trên AWS — commit trước', ['PENDING', 'PAID', 'OpenSearch'], 'bước logic'],
  ]) {
    await t.test(path, async () => {
      const { node, component, props } = await renderBlock(path, (block) => block.meta.includes(title));
      assert.equal(component.name, 'D2InteractiveDiagram');
      assert.match(node.value, /shape: sequence_diagram/u);
      const html = renderToStaticMarkup(createElement(D2InteractiveDiagram, props));
      for (const label of labels) {
        assert.ok(html.toLowerCase().includes(label.toLowerCase()), `${path}: missing rendered ${label}`);
      }
      assert.doesNotMatch(html, /concurrency-lanes|<iframe|<canvas/u);
      const tree = parser.parse(await readFile(path, 'utf8'));
      const diagram = tree.children.find((child) => child.type === 'code' && child.meta?.includes(title));
      const intro = tree.children[tree.children.indexOf(diagram) - 1];
      const text = intro.children.map((child) => child.value ?? child.children?.map((item) => item.value).join('') ?? '').join('');
      assert.match(text, /minh họa/u);
      assert.ok(text.includes(unit), `${path}: missing time unit`);
      assert.match(text, /không (?:biểu thị|tỷ lệ)/u);
    });
  }
});

test('D2 titles containing double quotes retain their complete rendered captions', async () => {
  for (const [path, title] of [
    ['01-microservice-overview.md', 'Ví dụ cụ thể: Luồng "Tạo đơn hàng" trong SOA'],
    ['02-single-responsibility-bounded-context.md', 'Ví dụ: Cùng khái niệm "Product" nhưng khác ngữ cảnh'],
    ['17-design-patterns.md', 'Flow "Đặt hàng" — các pattern phối hợp'],
    ['27-shared-code-strategy.md', '5.1. Ý tưởng cốt lõi — "Share contract, không share code"'],
    ['27-shared-code-strategy.md', '7.1. Vấn đề cốt lõi — "Thay đổi 1 library → bao nhiêu service phải build lại?"'],
  ]) {
    const { props } = await renderBlock(path, (block) => block.meta.includes(title));
    assert.equal(props.caption, title, path);
  }
});

test('historical timeline uses categorical cards, not sequence lifelines', async () => {
  const { node, component, props } = await renderBlock('01-microservice-overview.md', (block) => block.meta.includes('Các mốc phát triển'));
  assert.equal(component.name, 'D2InteractiveDiagram');
  assert.match(node.value, /direction: down/u);
  assert.doesNotMatch(node.value, /sequence_diagram/u);
  const html = renderToStaticMarkup(createElement(D2InteractiveDiagram, props));
  for (const label of ['1990s', '2000', '2014', '2015', 'Kubernetes']) {
    assert.ok(html.includes(label), `Historical timeline missing ${label}`);
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
  assert.doesNotMatch(html, /Explore 6 views/u);
  assert.match(html, /class="d2-source-menu"/u);
  assert.match(html, /All views/u);
  assert.match(html, /D2 source/u);
  assert.match(html, /CANCELLED/u);
  assert.doesNotMatch(html, /<iframe|<canvas/u);
});
