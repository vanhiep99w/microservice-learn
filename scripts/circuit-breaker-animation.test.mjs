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

// Read build-generated data without evaluating MDX expressions or authored D2.
function componentProps(node) {
  return Object.fromEntries(node.attributes.map((attribute) => {
    const expression = attribute.value.data.estree.body[0].expression;
    return [attribute.name, expression.type === 'Literal'
      ? expression.value
      : JSON.parse(expression.arguments[0].value)];
  }));
}

test('Circuit Breaker animation preserves branches, resets highlights and retains no-JS views', async () => {
  const path = '17-reliability-patterns/circuit-breaker.md';
  const markdown = await readFile(path, 'utf8');
  const examples = [];
  visit(parser.parse(markdown), 'code', (node) => {
    if (node.lang === 'd2' && node.meta?.includes('mode=animation')) examples.push(node);
  });
  assert.equal(examples.length, 1);
  const tree = await unified().use(remarkD2, {
    cacheDir: '.next/cache/docs-kit/d2',
    concurrency: 1,
  }).run({ type: 'root', children: examples }, { path });
  assert.equal(tree.children[0].name, 'D2InteractiveDiagram');
  const props = componentProps(tree.children[0]);
  assert.equal(props.mode, 'animation');
  assert.equal(props.interval, 1800);
  assert.equal(props.boards.length, 6);

  const expectedStates = ['CLOSED', 'OPEN', 'HALF_OPEN', 'OPEN', 'HALF_OPEN', 'CLOSED'];
  for (const [index, board] of props.boards.entries()) {
    for (const theme of ['lightSvg', 'darkSvg']) {
      const svg = board[theme];
      assert.match(svg, /<svg\b/u);
      assert.equal((svg.match(/<g class="[^"]*\bactive"/gu) ?? []).length, 1,
        `${board.label}: exactly one active state in ${theme}`);
      const activeLabel = svg.match(/<g class="[^"]*\bactive">[\s\S]*?<text\b[^>]*>([^<]+)<\/text>/u)?.[1];
      assert.equal(activeLabel, expectedStates[index], `${board.label}: active state in ${theme}`);
      assert.equal((svg.match(/<g class="[^"]*\btransition"/gu) ?? []).length, index === 0 ? 0 : 1,
        `${board.label}: previous transition highlight must be reset`);
      // All four branches remain visible, including the path not taken.
      for (const label of ['Failure rate', 'Hết wait duration', 'Probe thành công', 'Probe thất bại']) {
        assert.ok(svg.includes(label), `${board.label}: missing ${label} in ${theme}`);
      }
    }
  }
  for (const theme of ['lightSvg', 'darkSvg']) {
    assert.match(props.animation[theme], /<svg\b/u);
    assert.match(props.animation[theme], /@keyframes d2Transition/u);
  }

  const html = renderToStaticMarkup(createElement(D2InteractiveDiagram, props));
  assert.ok(html.includes('Explore 6 views'));
  assert.ok(html.includes('All views (6)'));
  for (const board of props.boards.slice(1)) assert.ok(html.includes(board.label));
  assert.ok(html.includes('D2 source'));
  assert.ok(markdown.includes('không chạy cooldown timer'));
  assert.ok(markdown.includes('không tỷ lệ với thời lượng'));
});
