import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { visit } from 'unist-util-visit';
import { remarkAnnotatedExample } from '@vanhiep99w/docs-kit/annotated-example';
import { remarkCodeWalkthrough } from '@vanhiep99w/docs-kit/annotated-example/walkthrough';
import { remarkTerminalSession } from '@vanhiep99w/docs-kit/terminal-session';
import { remarkMarble } from '@vanhiep99w/docs-kit/marble';
import { remarkCodeDiff } from '@vanhiep99w/docs-kit/code-diff';
import { remarkDataInspector } from '@vanhiep99w/docs-kit/data-inspector';
import { remarkProtocolExchange } from '@vanhiep99w/docs-kit/protocol-exchange';
import { remarkSpanWaterfall } from '@vanhiep99w/docs-kit/span-waterfall';
import { remarkConcurrencyLanes } from '@vanhiep99w/docs-kit/concurrency-lanes';
import { remarkStateTransition } from '@vanhiep99w/docs-kit/state-transition';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';
import { d2IconAssetsRoot, remarkD2Icons } from './scripts/d2-icons.mjs';
import { remarkSourceRefs } from './scripts/remark-source-refs.mjs';

function remarkMermaid() {
  return (tree: any) => {
    visit(tree, 'code', (node: any, index: number | undefined, parent: any) => {
      if (node.lang !== 'mermaid' || index === undefined) return;

      parent.children.splice(index, 1, {
        type: 'mdxJsxFlowElement',
        name: 'MermaidDiagram',
        attributes: [
          {
            type: 'mdxJsxAttribute',
            name: 'chart',
            value: node.value,
          },
        ],
        children: [],
      });
    });
  };
}

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [
      remarkAnnotatedExample,
      remarkCodeWalkthrough,
      remarkTerminalSession,
      remarkMarble,
      remarkCodeDiff,
      remarkDataInspector,
      remarkProtocolExchange,
      remarkSpanWaterfall,
      remarkConcurrencyLanes,
      remarkStateTransition,
      remarkD2Icons,
      [remarkD2, {
        assetsRoot: d2IconAssetsRoot,
        cacheDir: '.next/cache/docs-kit/d2',
        concurrency: 1,
        defaultCaption: 'Sơ đồ',
      }],
      remarkMermaid,
      remarkSourceRefs,
    ],
  },
});
