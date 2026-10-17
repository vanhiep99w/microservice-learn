import { readFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';

export const d2IconAssetsRoot = 'diagrams/icons';
const iconsDirectory = fileURLToPath(new URL('../diagrams/icons/', import.meta.url));
export const d2Icons = JSON.parse(readFileSync(new URL('../diagrams/icons/manifest.json', import.meta.url), 'utf8'));
const localIcons = new Map(d2Icons.map(({ url, file }) => [url, resolve(iconsDirectory, file)]));

/** Keep canonical D2 URLs portable; embed reviewed, vendored icons at build time. */
export function remarkD2Icons() {
  return (tree, file) => {
    visit(tree, 'code', (node) => {
      if (node.lang !== 'd2') return;
      node.value = node.value.replace(
        /(\bicon\s*:\s*)(?:"(https:\/\/icons\.d2lang\.com\/[^"\r\n]+)"|(https:\/\/icons\.d2lang\.com\/[^\s;}]+))/gu,
        (_, prefix, quoted, unquoted) => {
          const url = quoted || unquoted;
          const asset = localIcons.get(url);
          if (!asset) throw new Error(`${file.path}: D2 icon is not vendored: ${url}`);
          if (!file.path) throw new Error('D2 icons require a source file path.');
          const source = resolve(file.cwd, file.path);
          const path = relative(dirname(source), asset).split(sep).join('/');
          return `${prefix}${JSON.stringify(path.startsWith('.') ? path : `./${path}`)}`;
        },
      );
    });
  };
}
