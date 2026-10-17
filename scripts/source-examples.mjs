import { readdir, readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { createHighlighter } from 'shiki';
import { parse as parseYaml } from 'yaml';

export const parser = unified().use(remarkParse);

export function sourceRequest(url) {
  if (!url.startsWith('?source=')) return null;
  const params = new URLSearchParams(url.slice(1));
  const request = Object.fromEntries(params);
  if ([...params.keys()].length !== new Set(params.keys()).size) {
    throw new Error(`Duplicate SourceRef parameter: ${url}`);
  }
  const allowed = new Set(['source', 'snapshot', 'file', 'region', 'lines']);
  if (Object.keys(request).some((key) => !allowed.has(key))) {
    throw new Error(`Unknown SourceRef parameter: ${url}`);
  }
  if (!request.source || (request.region && request.lines)) {
    throw new Error(`Invalid SourceRef: ${url}`);
  }
  const { source, ...rest } = request;
  return { project: source, ...rest };
}

export function collectExamples(markdown, filename) {
  const tree = parser.parse(markdown);
  const files = [];
  const refs = [];
  visit(tree, 'code', (node) => {
    if (node.lang === 'd2') {
      // Author D2 source links as quoted query URLs (also supported on node.link).
      // Ignore comment-only lines; never treat examples in other languages as refs.
      for (const line of node.value.split('\n')) {
        if (line.trimStart().startsWith('#')) continue;
        for (const [, url] of line.matchAll(/\blink\s*:\s*"((?:\.\/)?\?source=[^"\r\n]*)"/gu)) {
          refs.push(sourceRequest(url.replace(/^\.\//u, '')));
        }
      }
    }
    // New docs-kit descriptors keep their original code/payload as the artifact,
    // never the YAML wrapper. Explicit metadata still opts into publication.
    let artifact = { language: node.lang, code: node.value };
    const descriptorLanguages = new Set([
      'annotated', 'data-inspector', 'code-diff', 'code-walkthrough',
    ]);
    if (descriptorLanguages.has(node.lang)) {
      let descriptor;
      try {
        descriptor = parseYaml(node.value, { uniqueKeys: true });
      } catch (error) {
        throw new Error(`${filename}:${node.position.start.line}: ${error.message}`);
      }
      const sources = node.lang === 'code-diff'
        ? [descriptor.before?.source, descriptor.after?.source]
        : node.lang === 'code-walkthrough'
          ? (descriptor.snapshots ?? []).map((snapshot) => snapshot.source)
          : [descriptor.source];
      for (const source of sources.filter(Boolean)) refs.push(source);
      if (node.lang === 'annotated') {
        artifact = { language: descriptor.language ?? 'text', code: descriptor.code };
      } else if (node.lang === 'data-inspector') {
        artifact = { language: 'json', code: descriptor.json };
      }
    }
    const path = node.meta?.match(/(?:^|\s)source="([^"]+)"(?:\s|$)/u)?.[1];
    if (!path) return;
    if (['code-diff', 'code-walkthrough'].includes(node.lang)) {
      throw new Error(`${filename}: publish each original artifact separately, not a multi-version descriptor`);
    }
    if (!node.lang || ['d2', 'mermaid', 'text'].includes(node.lang)) {
      throw new Error(`${filename}: source metadata requires a code language`);
    }
    if (path.startsWith('/') || path.includes('\\') || path.split('/').some((p) => !p || p === '.' || p === '..')) {
      throw new Error(`${filename}: invalid source path ${path}`);
    }
    if (files.some((file) => file.path === path)) throw new Error(`${filename}: duplicate source ${path}`);
    if (typeof artifact.code !== 'string') throw new Error(`${filename}: missing artifact code in ${path}`);
    files.push({ path, ...artifact, regions: {} });
  });
  visit(tree, 'link', (node) => {
    const request = sourceRequest(node.url);
    if (request) refs.push(request);
  });
  return { files, refs };
}

export function validateReferences(refs, snapshots) {
  for (const { request, filename } of refs) {
    const snapshot = snapshots.get(request.project);
    if (!snapshot || (request.snapshot && request.snapshot !== snapshot.snapshot)) {
      throw new Error(`${filename}: unknown source project/snapshot ${request.project}/${request.snapshot}`);
    }
    const file = snapshot.files.find((entry) => entry.path === (request.file || snapshot.defaultFile));
    if (!file) throw new Error(`${filename}: missing source file ${request.file}`);
    if (request.region && !file.regions[request.region]) throw new Error(`${filename}: missing region ${request.region}`);
    if (request.lines) {
      const match = request.lines.match(/^(\d+)(?:-(\d+))?$/u);
      const start = Number(match?.[1]);
      const end = Number(match?.[2] || start);
      if (!match || start < 1 || end < start || end > file.code.split('\n').length) {
        throw new Error(`${filename}: invalid source lines ${request.lines}`);
      }
    }
  }
}

async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? markdownFiles(path) : /\.mdx?$/u.test(entry.name) ? [path] : [];
  }));
  return files.flat();
}

export async function buildSourceExamples({ docsDir = 'content/docs', outputDir = 'public/source-examples' } = {}) {
  const snapshots = new Map();
  const manifest = [];
  const refs = [];
  for (const filename of await markdownFiles(docsDir)) {
    const markdown = await readFile(filename, 'utf8');
    const collected = collectExamples(markdown, filename);
    refs.push(...collected.refs.map((request) => ({ request, filename })));
    if (!collected.files.length) continue;
    const project = basename(filename).replace(/\.mdx?$/u, '');
    if (snapshots.has(project)) throw new Error(`Duplicate source project: ${project}`);
    const titleMatch = markdown.match(/^title:\s*(.+)$/mu);
    const title = titleMatch?.[1].startsWith('"') ? JSON.parse(titleMatch[1]) : titleMatch?.[1] || project;
    snapshots.set(project, { project, snapshot: 'article', defaultFile: collected.files[0].path, files: collected.files });
    manifest.push({ id: project, title, defaultSnapshot: 'article', snapshots: [{ id: 'article', title: 'Trích đoạn trong bài — không phải project chạy độc lập', asset: `${project}-article.json` }] });
  }
  // Fail before deleting good assets if a reference is broken.
  validateReferences(refs, snapshots);
  const highlighter = await createHighlighter({ themes: ['github-light', 'github-dark'], langs: [] });
  try {
    for (const snapshot of snapshots.values()) {
      for (const file of snapshot.files) {
        await highlighter.loadLanguage(file.language);
        file.html = highlighter.codeToHtml(file.code, {
          lang: file.language,
          themes: { light: 'github-light', dark: 'github-dark' },
          transformers: [{ line(node, line) { node.properties['data-line'] = String(line); } }],
        });
      }
    }
  } finally {
    highlighter.dispose();
  }
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
  const writeJson = (path, value) => writeFile(join(outputDir, path), `${JSON.stringify(value)}\n`);
  await writeJson('manifest.json', manifest);
  for (const snapshot of snapshots.values()) await writeJson(`${snapshot.project}-article.json`, snapshot);
  console.log(`Source Explorer: ${snapshots.size} projects, ${[...snapshots.values()].reduce((n, s) => n + s.files.length, 0)} snippets, ${refs.length} validated references`);
  return { manifest, snapshots };
}
