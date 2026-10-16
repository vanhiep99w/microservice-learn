import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { visit } from 'unist-util-visit';
import { remarkD2 } from '@vanhiep99w/docs-kit/d2';
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
      [remarkD2, {
        cacheDir: '.next/cache/docs-kit/d2',
        concurrency: 1,
        defaultCaption: 'Sơ đồ',
      }],
      remarkMermaid,
      remarkSourceRefs,
    ],
  },
});
