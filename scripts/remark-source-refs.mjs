import { visit } from 'unist-util-visit';
import { sourceRequest } from './source-examples.mjs';

/** Keep canonical .md readable; turn source query links into docs-kit buttons. */
export function remarkSourceRefs() {
  return (tree) => {
    visit(tree, 'link', (node, index, parent) => {
      const request = sourceRequest(node.url);
      if (!request || index === undefined || !parent) return;
      parent.children[index] = {
        type: 'mdxJsxTextElement',
        name: 'SourceRef',
        attributes: Object.entries(request).map(([name, value]) => ({
          type: 'mdxJsxAttribute', name, value,
        })),
        children: node.children,
        position: node.position,
      };
    });
  };
}
