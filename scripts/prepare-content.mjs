#!/usr/bin/env node

/**
 * Prepare Microservice Learning markdown files for Fumadocs.
 *
 * 1. Parse README.md → extract source path/title/description/section from tables
 * 2. For each listed .md file: add YAML frontmatter, strip manual TOC, rewrite cross-doc links
 * 3. Copy files into content/docs/{section}/ (pattern pages keep their group directories)
 * 4. Write meta.json files for Fumadocs sidebar labels and ordering
 *
 * Pattern aggregate files are reference material only. The pattern index is generated,
 * while the eight aggregate group files are deliberately excluded from the output.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, posix as pathPosix } from 'node:path';

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
  basics: 'Khái niệm cơ bản',
  communication: 'Communication & Integration',
  'data-management': 'Data Management',
  resilience: 'Resilience & Reliability',
  observability: 'Observability & Evolvability',
  deployment: 'Deployment & Infrastructure',
  security: 'Security',
  configuration: 'Configuration Management',
  patterns: 'Design Patterns',
  aws: 'Triển khai trên AWS',
  'case-studies': 'Case Studies',
  reference: 'Cheat Sheet',
  advanced: 'Chủ đề nâng cao',
};

/**
 * Nested pattern source directories and their generated Fumadocs directories.
 * The order is also the order shown in the pattern sidebar.
 */
const PATTERN_GROUPS = [
  { sourceDir: '17-structural-patterns', outputDir: 'structural', label: 'Structural Patterns' },
  { sourceDir: '17-decomposition-patterns', outputDir: 'decomposition', label: 'Decomposition Patterns' },
  { sourceDir: '17-data-patterns', outputDir: 'data', label: 'Data Patterns' },
  { sourceDir: '17-communication-patterns', outputDir: 'communication', label: 'Communication Patterns' },
  { sourceDir: '17-reliability-patterns', outputDir: 'reliability', label: 'Reliability Patterns' },
  { sourceDir: '17-deployment-patterns', outputDir: 'deployment', label: 'Deployment Patterns' },
  { sourceDir: '17-observability-patterns', outputDir: 'observability', label: 'Observability Patterns' },
  { sourceDir: '17-anti-patterns', outputDir: 'anti-patterns', label: 'Anti-patterns' },
];

const PATTERN_GROUP_BY_SOURCE_DIR = new Map(
  PATTERN_GROUPS.map((group) => [group.sourceDir, group])
);
const PATTERN_GROUP_BY_AGGREGATE_SOURCE = new Map(
  PATTERN_GROUPS.map((group) => [`${group.sourceDir}.md`, group])
);
const PATTERN_INDEX_SOURCE = '17-design-patterns.md';
const PATTERN_AGGREGATE_SOURCES = new Set(
  PATTERN_GROUPS.map(({ sourceDir }) => `${sourceDir}.md`)
);

/**
 * Aggregate section anchors are intentionally redirected to the extracted page
 * that owns the section. The fragment is dropped because the aggregate heading
 * does not exist in the extracted page; the page route itself is the stable target.
 */
const PATTERN_AGGREGATE_ANCHORS = new Map([
  [
    '17-structural-patterns.md',
    [
      { pattern: /^3-sidecar-pattern(?:-|$)/iu, source: '17-structural-patterns/sidecar.md' },
      { pattern: /^4-ambassador-pattern(?:-|$)/iu, source: '17-structural-patterns/ambassador.md' },
      { pattern: /^5-adapter-pattern(?:-|$)/iu, source: '17-structural-patterns/adapter.md' },
    ],
  ],
  [
    '17-decomposition-patterns.md',
    [
      { pattern: /^2-strangler-fig-pattern(?:-|$)/iu, source: '17-decomposition-patterns/strangler-fig.md' },
      { pattern: /^3-branch-by-abstraction(?:-|$)/iu, source: '17-decomposition-patterns/branch-by-abstraction.md' },
      { pattern: /^4-vine-pattern(?:-|$)/iu, source: '17-decomposition-patterns/vine.md' },
    ],
  ],
  [
    '17-data-patterns.md',
    [
      { pattern: /^2-database-per-service(?:-|$)/iu, source: '17-data-patterns/database-per-service.md' },
      { pattern: /^3-transactional-outbox(?:-|$)/iu, source: '17-data-patterns/transactional-outbox.md' },
      { pattern: /^4-saga-pattern(?:-|$)/iu, source: '17-data-patterns/saga.md' },
      { pattern: /^5-cqrs(?:-|$)/iu, source: '17-data-patterns/cqrs.md' },
      { pattern: /^6-event-sourcing(?:-|$)/iu, source: '17-data-patterns/event-sourcing.md' },
    ],
  ],
  [
    '17-communication-patterns.md',
    [
      { pattern: /^3-api-gateway-pattern(?:-|$)/iu, source: '17-communication-patterns/api-gateway.md' },
      { pattern: /^4-backend-for-frontend(?:-|$)/iu, source: '17-communication-patterns/backend-for-frontend.md' },
      { pattern: /^5-service-mesh-pattern(?:-|$)/iu, source: '17-communication-patterns/service-mesh.md' },
      { pattern: /^6-event-driven-architecture-pattern(?:-|$)/iu, source: '17-communication-patterns/event-driven-architecture.md' },
      { pattern: /^7-async-request-reply-pattern(?:-|$)/iu, source: '17-communication-patterns/async-request-reply.md' },
    ],
  ],
  [
    '17-reliability-patterns.md',
    [
      { pattern: /^3-timeout(?:-|$)/iu, source: '17-reliability-patterns/timeout.md' },
      { pattern: /^4-retry-with-backoff(?:-|$)/iu, source: '17-reliability-patterns/retry-with-backoff.md' },
      { pattern: /^5-circuit-breaker(?:-|$)/iu, source: '17-reliability-patterns/circuit-breaker.md' },
      { pattern: /^6-bulkhead(?:-|$)/iu, source: '17-reliability-patterns/bulkhead.md' },
      { pattern: /^7-health-check--heartbeat(?:-|$)/iu, source: '17-reliability-patterns/health-check-heartbeat.md' },
      { pattern: /^77-health-check-và-circuit-breaker(?:-|$)/iu, source: '17-reliability-patterns/circuit-breaker.md' },
    ],
  ],
  [
    '17-deployment-patterns.md',
    [
      { pattern: /^3-rolling-update(?:-|$)/iu, source: '17-deployment-patterns/rolling-update.md' },
      { pattern: /^4-blue-green-deployment(?:-|$)/iu, source: '17-deployment-patterns/blue-green.md' },
      { pattern: /^5-canary-deployment(?:-|$)/iu, source: '17-deployment-patterns/canary.md' },
      { pattern: /^6-feature-toggle(?:-|$)/iu, source: '17-deployment-patterns/feature-toggle.md' },
    ],
  ],
  [
    '17-observability-patterns.md',
    [
      { pattern: /^3-log-aggregation-pattern(?:-|$)/iu, source: '17-observability-patterns/log-aggregation.md' },
      { pattern: /^4-distributed-tracing-pattern(?:-|$)/iu, source: '17-observability-patterns/distributed-tracing.md' },
      { pattern: /^5-correlation-id-pattern(?:-|$)/iu, source: '17-observability-patterns/correlation-id.md' },
      { pattern: /^6-health-check-api-pattern(?:-|$)/iu, source: '17-observability-patterns/health-check-api.md' },
    ],
  ],
  [
    '17-anti-patterns.md',
    [
      { pattern: /^3-distributed-monolith(?:-|$)/iu, source: '17-anti-patterns/distributed-monolith.md' },
      { pattern: /^4-shared-database(?:-|$)/iu, source: '17-anti-patterns/shared-database.md' },
      { pattern: /^5-mega-service(?:-|$)/iu, source: '17-anti-patterns/mega-service.md' },
      { pattern: /^6-chatty-services(?:-|$)/iu, source: '17-anti-patterns/chatty-services.md' },
      { pattern: /^7-no-api-versioning(?:-|$)/iu, source: '17-anti-patterns/no-api-versioning.md' },
      { pattern: /^8-hardcoded-configuration(?:-|$)/iu, source: '17-anti-patterns/hardcoded-configuration.md' },
      { pattern: /^9-sync-chain--death-star(?:-|$)/iu, source: '17-anti-patterns/sync-chain-death-star.md' },
      { pattern: /^10-over-engineering(?:-|$)/iu, source: '17-anti-patterns/over-engineering.md' },
    ],
  ],
]);

const SECTION_ORDER = [
  'basics',
  'communication',
  'data-management',
  'resilience',
  'observability',
  'deployment',
  'security',
  'configuration',
  'patterns',
  'aws',
  'case-studies',
  'reference',
  'advanced',
];

function normalizeSourcePath(sourcePath) {
  const normalized = pathPosix.normalize(
    sourcePath.replaceAll('\\', '/').replace(/^\.\//u, '')
  );
  if (
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.startsWith('/')
  ) {
    throw new Error(`Source path escapes repository root: ${sourcePath}`);
  }
  return normalized;
}

function patternGroupFor(sourcePath) {
  return PATTERN_GROUP_BY_SOURCE_DIR.get(pathPosix.dirname(sourcePath));
}

function outputRelativePath(sourcePath, meta) {
  const patternGroup = patternGroupFor(sourcePath);
  if (patternGroup) {
    return pathPosix.join(
      'patterns',
      patternGroup.outputDir,
      pathPosix.basename(sourcePath)
    );
  }
  return pathPosix.join(meta.dir, pathPosix.basename(sourcePath));
}

function routeForOutput(outputPath) {
  return `/${outputPath.slice(0, -pathPosix.extname(outputPath).length)}/`;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function decodeUrlPart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isExternalLink(pathPart) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(pathPart);
}

function isTocHeading(line) {
  return /^##\s+.*(?:mục lục|table of contents|contents)\s*$/iu.test(
    line.trim()
  );
}

function isH2Heading(line) {
  return /^##(?!#)\s+/u.test(line);
}

/**
 * Remove the first manual TOC section, whether it is followed by `---` or
 * directly by the first H2. Existing sources use `Mục lục`, `📋 Mục lục`,
 * and `📑 Mục lục`.
 */
function stripManualToc(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const tocStart = lines.findIndex(isTocHeading);
  if (tocStart === -1) return markdown;

  const nextH2 = lines.findIndex(
    (line, index) => index > tocStart && isH2Heading(line)
  );
  const tocEnd = nextH2 === -1 ? lines.length : nextH2;
  lines.splice(tocStart, tocEnd - tocStart);
  return lines.join('\n');
}

function splitLinkDestination(destination) {
  const leadingWhitespace = destination.match(/^\s*/u)?.[0] ?? '';
  const trimmed = destination.slice(leadingWhitespace.length);
  const tokenMatch = trimmed.match(/^(<[^>]+>|[^\s]+)/u);
  if (!tokenMatch) return null;

  const token = tokenMatch[1];
  const rest = trimmed.slice(token.length);
  const isAngleWrapped = token.startsWith('<') && token.endsWith('>');
  const target = isAngleWrapped ? token.slice(1, -1) : token;
  const hashIndex = target.indexOf('#');
  const pathPart = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? '' : target.slice(hashIndex + 1);

  return {
    leadingWhitespace,
    rest,
    isAngleWrapped,
    pathPart,
    fragment,
  };
}

function findAggregatePatternSource(aggregateSource, fragment) {
  const candidates = PATTERN_AGGREGATE_ANCHORS.get(aggregateSource) ?? [];
  return candidates.find(({ pattern }) => pattern.test(fragment))?.source;
}

function findFirstPatternSource(aggregateSource, routeMap) {
  const group = PATTERN_GROUP_BY_AGGREGATE_SOURCE.get(aggregateSource);
  if (!group) return null;

  const sourcePrefix = `${group.sourceDir}/`;
  return [...routeMap.keys()].find((sourcePath) =>
    sourcePath.startsWith(sourcePrefix)
  );
}

function resolveInternalRoute(sourcePath, linkedPath, fragment, routeMap) {
  const decodedPath = decodeUrlPart(linkedPath).replaceAll('\\', '/');
  const resolvedSource = decodedPath.startsWith('/')
    ? normalizeSourcePath(decodedPath.slice(1))
    : normalizeSourcePath(
        pathPosix.join(pathPosix.dirname(sourcePath), decodedPath)
      );

  const directRoute = routeMap.get(resolvedSource);
  if (directRoute) {
    return `${directRoute}${fragment ? `#${fragment}` : ''}`;
  }

  if (PATTERN_AGGREGATE_SOURCES.has(resolvedSource)) {
    const extractedSource = findAggregatePatternSource(
      resolvedSource,
      decodeUrlPart(fragment)
    );
    if (extractedSource) {
      const extractedRoute = routeMap.get(extractedSource);
      if (!extractedRoute) {
        throw new Error(
          `Aggregate anchor points to a missing pattern page: ${extractedSource}`
        );
      }
      // The aggregate section anchor is not present after extraction.
      return extractedRoute;
    }

    const firstPatternSource = findFirstPatternSource(resolvedSource, routeMap);
    const firstPatternRoute = firstPatternSource
      ? routeMap.get(firstPatternSource)
      : undefined;
    if (!firstPatternRoute) {
      throw new Error(
        `Cannot resolve aggregate pattern link without an extracted group page: ${resolvedSource}`
      );
    }
    // Bare group links land on the first extracted page, avoiding a self-link
    // when the source is the pattern index. Anchor links use their owner page.
    return firstPatternRoute;
  }

  throw new Error(
    `Cannot rewrite internal markdown link in ${sourcePath}: ${linkedPath}${
      fragment ? `#${fragment}` : ''
    }`
  );
}

function rewriteLinks(markdown, sourcePath, routeMap) {
  return markdown.replace(
    /(\[[^\]]+\]\()([^\)\n]+?)(\))/gu,
    (match, prefix, destination, suffix) => {
      const parsed = splitLinkDestination(destination);
      if (!parsed || !/\.md$/iu.test(parsed.pathPart)) return match;
      if (isExternalLink(parsed.pathPart)) return match;

      const route = resolveInternalRoute(
        sourcePath,
        parsed.pathPart,
        parsed.fragment,
        routeMap
      );
      const replacementToken = parsed.isAngleWrapped ? `<${route}>` : route;
      return `${prefix}${parsed.leadingWhitespace}${replacementToken}${parsed.rest}${suffix}`;
    }
  );
}

// ── Step 1: Parse README.md ─────────────────────────────────────────────────

const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const lines = readme.split('\n');

/** @type {Map<string, {dir: string, title: string, description: string, order: number}>} */
const fileMap = new Map();
let currentDir = null;
let orderInSection = 0;

for (const line of lines) {
  const sectionMatch = line.match(/^## (.+)$/u);
  if (sectionMatch) {
    const name = sectionMatch[1].trim();
    currentDir = SECTION_TO_DIR[name] ?? null;
    orderInSection = 0;
    continue;
  }
  if (!currentDir) continue;

  // Accept both integer document numbers and nested pattern numbers (17.01).
  const tableMatch = line.match(
    /^\|\s*[^|]+\s*\|\s*\[([^\]]+)\]\(([^)\s]+\.md)\)\s*\|\s*([^|]*?)\s*\|/u
  );
  if (!tableMatch) continue;

  orderInSection++;
  const [, title, rawFilename, rawDescription] = tableMatch;
  const filename = normalizeSourcePath(rawFilename);
  if (!fileMap.has(filename)) {
    fileMap.set(filename, {
      dir: currentDir,
      title: title.trim(),
      description: rawDescription.replace(/[|✅⬜🟡]/gu, '').trim(),
      order: orderInSection,
    });
  }
}

const patternEntryCount = [...fileMap.keys()].filter((sourcePath) =>
  patternGroupFor(sourcePath)
).length;
console.log(`Parsed ${fileMap.size} files from README.md (${patternEntryCount} nested pattern pages)`);
if (patternEntryCount !== 37) {
  console.warn(`  WARN: expected 37 nested pattern pages, found ${patternEntryCount}`);
}

// ── Build output and link maps ──────────────────────────────────────────────

/** @type {Map<string, {dir: string, title: string, description: string, order: number}>} */
const generatedEntries = new Map();
/** @type {Map<string, string>} */
const routeMap = new Map();
/** @type {Set<string>} */
const outputPaths = new Set();

for (const [sourcePath, meta] of fileMap) {
  if (PATTERN_AGGREGATE_SOURCES.has(sourcePath)) continue;

  const sourceFsPath = join(ROOT, ...sourcePath.split('/'));
  if (!existsSync(sourceFsPath)) {
    throw new Error(`Missing source file listed in README.md: ${sourcePath}`);
  }

  const outputPath = outputRelativePath(sourcePath, meta);
  if (outputPaths.has(outputPath)) {
    throw new Error(`Output path collision: ${outputPath}`);
  }
  outputPaths.add(outputPath);
  generatedEntries.set(sourcePath, meta);
  routeMap.set(sourcePath, routeForOutput(outputPath));
}

// Patterns are generated as a complete unit. Clearing this directory removes
// stale flat pages and the old aggregate pages without touching other sections.
rmSync(join(docsBase, 'patterns'), { recursive: true, force: true });
mkdirSync(docsBase, { recursive: true });

// ── Step 2–3: Process each file ─────────────────────────────────────────────

/** @type {Map<string, Array<{sourcePath: string, meta: object}>>} */
const patternEntriesByGroup = new Map(
  PATTERN_GROUPS.map((group) => [group.sourceDir, []])
);

for (const [sourcePath, meta] of generatedEntries) {
  const srcPath = join(ROOT, ...sourcePath.split('/'));
  let content = readFileSync(srcPath, 'utf8');

  const titleMatch = content.match(/^# (.+)$/mu);
  const title = titleMatch ? titleMatch[1].trim() : meta.title;

  content = stripManualToc(content);
  content = rewriteLinks(content, sourcePath, routeMap);
  content = content.replace(/^# .+\n+/mu, '');

  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(meta.description || title)}`,
    '---',
  ].join('\n');

  const finalContent = `${frontmatter}\n\n${content.trim()}\n`;
  const outputPath = outputRelativePath(sourcePath, meta);
  const targetPath = join(docsBase, ...outputPath.split('/'));
  mkdirSync(pathPosix.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, finalContent, 'utf8');

  const patternGroup = patternGroupFor(sourcePath);
  if (patternGroup) {
    patternEntriesByGroup.get(patternGroup.sourceDir).push({ sourcePath, meta });
  }
  console.log(`  ✓ ${outputPath}`);
}

// ── Step 4: Write meta.json per section ─────────────────────────────────────

for (const [dir, label] of Object.entries(SECTION_LABELS)) {
  const sectionDir = join(docsBase, dir);
  if (!existsSync(sectionDir) || dir === 'patterns') continue;
  writeJson(join(sectionDir, 'meta.json'), { title: label });
}

const patternRootDir = join(docsBase, 'patterns');
mkdirSync(patternRootDir, { recursive: true });
const patternPages = [];
if (routeMap.has(PATTERN_INDEX_SOURCE)) {
  patternPages.push(pathPosix.basename(PATTERN_INDEX_SOURCE, '.md'));
}

for (const group of PATTERN_GROUPS) {
  const entries = patternEntriesByGroup.get(group.sourceDir);
  if (!entries?.length) continue;

  const groupDir = join(patternRootDir, group.outputDir);
  mkdirSync(groupDir, { recursive: true });
  writeJson(join(groupDir, 'meta.json'), {
    title: group.label,
    pages: entries.map(({ sourcePath }) => pathPosix.basename(sourcePath, '.md')),
  });
  patternPages.push(group.outputDir);
}

writeJson(join(patternRootDir, 'meta.json'), {
  title: SECTION_LABELS.patterns,
  pages: patternPages,
});

// ── Step 5: Write root meta.json to define sidebar section order ────────────

mkdirSync(docsBase, { recursive: true });
writeJson(join(docsBase, 'meta.json'), { pages: SECTION_ORDER });

console.log(
  `\nDone! Wrote ${generatedEntries.size} pages, including ${patternEntryCount} nested pattern pages, to content/docs/`
);
