import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';
import { D2InteractiveDiagram } from '@vanhiep99w/docs-kit/components/d2-interactive';
import { inventoryDiagrams } from './diagram-inventory.mjs';
import { parser } from './source-examples.mjs';

function componentProps(node) {
  return Object.fromEntries(node.attributes.map((attribute) => {
    const expression = attribute.value.data.estree.body[0].expression;
    return [attribute.name, expression.type === 'Literal'
      ? expression.value : JSON.parse(expression.arguments[0].value)];
  }));
}

function visibleText(svg) {
  return svg.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gu, '')
    .replace(/<[^>]+>/gu, ' ').replace(/\s+/gu, ' ');
}

const examples = new Map([
  ['17-communication-patterns/async-request-reply.md', {
    count: 3, states: ['pending', 'processing', 'completed'], branches: ['failed'],
  }],
  ['17-data-patterns/event-sourcing.md', {
    count: 5, states: ['Chưa có order', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED'],
    branches: ['OrderCreated', 'PaymentReceived', 'OrderShipped', 'OrderDelivered'],
  }],
  ['31-case-study-dropbox-system-design.md', {
    count: 4, states: ['PENDING', 'UPLOADING', 'PROCESSING', 'READY'],
    branches: ['FAILED', 'ABORTED', 'EXPIRED'],
  }],
  ['17-deployment-patterns/rolling-update.md', {
    count: 4,
    frames: [
      [/v1 3 ready/u, /v2 0 ready/u], [/v1 2 ready/u, /v2 1 ready/u],
      [/v1 1 ready/u, /v2 2 ready/u], [/v1 0 ready/u, /v2 3 ready/u],
    ],
    every: [/Pool phục vụ 3 replica ready/u],
  }],
  ['17-deployment-patterns/blue-green.md', {
    count: 4,
    frames: [
      [/BLUE v1 LIVE/u, /GREEN v2 Chưa kiểm thử/u],
      [/GREEN v2 Ready, chưa nhận production traffic/u],
      [/BLUE v1 Giữ để rollback/u, /GREEN v2 LIVE/u],
      [/BLUE v1 LIVE trở lại/u, /v1 vẫn đọc được state do v2 ghi/u],
    ],
    every: [/Shared state Không hoàn tác theo routing/u, /100%/u, /0%/u],
  }],
  ['17-deployment-patterns/canary.md', {
    count: 5,
    frames: [
      [/100%/u, /0%/u], [/95%/u, /5%/u], [/75%/u, /25%/u],
      [/50%/u, /Bước 25% đạt/u], [/0%/u, /100%/u, /giữ v1 trong rollback window/u],
    ],
  }],
  ['09-data-management.md', {
    count: 6,
    frames: [
      [/Tồn kho 10/u, /e1 chưa đánh dấu sent/u],
      [/Tồn kho 10/u, /Đã chấp nhận e1 lần đầu/u],
      [/Tồn kho 9/u, /Đã commit e1 cùng thay đổi tồn kho/u],
      [/Tồn kho 9/u, /e1 chưa đánh dấu sent/u, /CRASH trước mark sent/u],
      [/Tồn kho 9/u, /Nhận diện e1 đã xử lý/u, /Không trừ kho lần hai/u],
      [/Tồn kho 9/u, /e1 đã đánh dấu sent/u, /Đã commit e1 cùng thay đổi tồn kho/u],
    ],
  }],
  ['19-aws-communication-discovery.md', {
    count: 6,
    frames: [
      [/Visible, chờ receive/u], [/Ẩn theo visibility timeout 30 giây/u, /h1 của lần nhận đầu/u],
      [/CRASH trước commit business effect/u], [/Visible trở lại/u, /Không dùng lại h1/u],
      [/h2 của lần nhận mới/u, /commit effect thành công/u],
      [/Đã dùng h2 để delete/u, /vẫn cần idempotent/u],
    ],
  }],
]);

test('authored animation examples render all snapshots and preserve their teaching invariants', async (t) => {
  const animations = (await inventoryDiagrams()).filter((block) =>
    block.kind === 'd2' && /\bmode=animation\b/u.test(block.raw.split('\n')[0]));
  // Circuit Breaker has a dedicated branch/highlight regression test.
  assert.equal(animations.length, examples.size + 1);
  const processor = unified().use(remarkD2, { cacheDir: '.next/cache/docs-kit/d2', concurrency: 1 });
  for (const [path, expected] of examples) {
    await t.test(path, async () => {
      const markdown = await readFile(path, 'utf8');
      const nodes = [];
      visit(parser.parse(markdown), 'code', (node) => {
        if (node.lang === 'd2' && /\bmode=animation\b/u.test(node.meta ?? '')) nodes.push(node);
      });
      assert.equal(nodes.length, 1);
      const tree = await processor.run({ type: 'root', children: nodes }, { path });
      assert.equal(tree.children[0].name, 'D2InteractiveDiagram');
      const props = componentProps(tree.children[0]);
      assert.equal(props.mode, 'animation');
      assert.equal(props.interval, 1800);
      assert.equal(props.boards.length, expected.count);
      assert.equal(props.boards[0].kind, 'root');
      assert.ok(props.boards.slice(1).every((board) => board.kind === 'step'));
      for (const theme of ['lightSvg', 'darkSvg']) {
        assert.match(props.animation[theme], /@keyframes d2Transition/u);
        for (const [index, board] of props.boards.entries()) {
          const svg = board[theme];
          assert.match(svg, /<svg\b/u);
          const text = visibleText(svg);
          for (const pattern of [...(expected.every ?? []), ...(expected.frames?.[index] ?? [])]) {
            assert.match(text, pattern, `${board.label}: ${theme}`);
          }
          for (const branch of expected.branches ?? []) assert.ok(text.includes(branch), branch);
          if (expected.states) {
            assert.equal((svg.match(/<g class="[^"]*\bactive"/gu) ?? []).length, 1);
            const active = svg.match(/<g class="[^"]*\bactive">[\s\S]*?<text\b[^>]*>([^<]+)<\/text>/u)?.[1];
            assert.equal(active, expected.states[index]);
            assert.equal((svg.match(/<g class="[^"]*\btransition"/gu) ?? []).length, index === 0 ? 0 : 1);
          }
        }
      }
      const html = renderToStaticMarkup(createElement(D2InteractiveDiagram, props));
      assert.ok(html.includes(`Explore ${expected.count} views`));
      assert.ok(html.includes(`All views (${expected.count})`));
      for (const board of props.boards.slice(1)) assert.ok(html.includes(board.label));
      assert.ok(markdown.includes('không chạy request, timer hay business side effect'));
      assert.ok(markdown.includes('không tỷ lệ với thời lượng'));
      assert.ok(markdown.includes('không tự phát'));
    });
  }
});
