#!/usr/bin/env node

/**
 * Prepare Microservice Learning markdown files for Fumadocs.
 *
 * 1. Parse README.md → extract file/title/description/section from tables
 * 2. For each .md file: add YAML frontmatter, strip manual TOC, rewrite cross-doc links
 * 3. Copy files into content/docs/{section}/
 * 4. Write meta.json per section for Fumadocs sidebar labels
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const docsBase = join(ROOT, 'content', 'docs');

const SECTION_TO_DIR = {
  '1. Khái niệm cơ bản': 'basics',
  '2. Communication & Integration': 'communication',
  '3. Data Management': 'data-management',
  '4. Resilience & Reliability': 'resilience',
  '5. Observability & Evolvability': 'observability',
  '6. Deployment & Infrastructure': 'deployment',
  '7. Security': 'security',
  '8. Configuration Management': 'configuration',
  '9. Design Patterns tổng hợp': 'patterns',
  '10. Triển khai Microservice trên AWS': 'aws',
  '11. Case Study — Thiết kế kiến trúc Microservice từ đầu': 'case-studies',
  '12. Cheat Sheet & Tham khảo nhanh': 'reference',
  '12. Chủ đề nâng cao': 'advanced',
};

const SECTION_LABELS = {
  'basics': 'Khái niệm cơ bản',
  'communication': 'Communication & Integration',
  'data-management': 'Data Management',
  'resilience': 'Resilience & Reliability',
  'observability': 'Observability & Evolvability',
  'deployment': 'Deployment & Infrastructure',
  'security': 'Security',
  'configuration': 'Configuration Management',
  'patterns': 'Design Patterns',
  'aws': 'Triển khai trên AWS',
  'case-studies': 'Case Studies',
  'reference': 'Cheat Sheet',
  'advanced': 'Chủ đề nâng cao',
};

// ── Step 1: Parse README.md ─────────────────────────────────────────────────

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const lines = readme.split('\n');

/** @type {Map<string, {dir: string, title: string, description: string, order: number}>} */
const fileMap = new Map();
let currentDir = null;
let orderInSection = 0;

for (const line of lines) {
  const sectionMatch = line.match(/^## (.+)$/);
  if (sectionMatch) {
    const name = sectionMatch[1].trim();
    currentDir = SECTION_TO_DIR[name] ?? null;
    orderInSection = 0;
    continue;
  }
  if (!currentDir) continue;

  // Table rows: | 01 | [Title](file.md) | Description | ✅ |
  const tableMatch = line.match(/^\|\s*\d+\s*\|\s*\[(.+?)\]\((.+?\.md)\)\s*\|\s*(.+?)\s*\|/);
  if (tableMatch) {
    orderInSection++;
    const [, title, filename, description] = tableMatch;
    if (!fileMap.has(filename)) {
      fileMap.set(filename, {
        dir: currentDir,
        title: title.trim(),
        description: description.replace(/[|✅⬜🟡]/g, '').trim(),
        order: orderInSection,
      });
    }
  }
}

console.log(`Parsed ${fileMap.size} files from README.md`);

// ── Build link rewrite map ──────────────────────────────────────────────────

/** @type {Map<string, string>} */
const linkMap = new Map();
for (const [filename, meta] of fileMap) {
  linkMap.set(filename, `/${meta.dir}/${basename(filename, '.md')}/`);
}

// ── Step 2–3: Process each file ─────────────────────────────────────────────

for (const [filename, meta] of fileMap) {
  const srcPath = join(ROOT, filename);
  if (!existsSync(srcPath)) {
    console.warn(`  SKIP (not found): ${filename}`);
    continue;
  }

  let content = readFileSync(srcPath, 'utf8');

  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : meta.title;

  // Remove manual TOC
  content = content.replace(/\n## Mục lục\n[\s\S]*?\n---\n/, '\n');

  // Rewrite cross-doc links
  content = content.replace(
    /\[([^\]]+)\]\(\.?\/?([0-9a-z][a-z0-9\-]*\.md)\)/g,
    (match, text, linkedFile) => linkMap.get(linkedFile) ? `[${text}](${linkMap.get(linkedFile)})` : match
  );

  const frontmatter = [
    '---',
    `title: "${title.replace(/"/g, '\\"')}"`,
    `description: "${meta.description.replace(/"/g, '\\"')}"`,
    '---',
  ].join('\n');

  content = content.replace(/^# .+\n+/, '');
  const finalContent = frontmatter + '\n\n' + content.trimStart();

  const targetDir = join(docsBase, meta.dir);
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(join(targetDir, basename(filename)), finalContent, 'utf8');
  console.log(`  ✓ ${meta.dir}/${filename}`);
}

// ── Step 4: Write meta.json per section ────────────────────────────────────

for (const [dir, label] of Object.entries(SECTION_LABELS)) {
  const sectionDir = join(docsBase, dir);
  if (existsSync(sectionDir)) {
    writeFileSync(join(sectionDir, 'meta.json'), JSON.stringify({ title: label }, null, 2), 'utf8');
  }
}

console.log(`\nDone! Files written to content/docs/`);
