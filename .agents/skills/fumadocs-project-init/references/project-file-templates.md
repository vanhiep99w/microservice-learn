# Fumadocs + Next.js project file templates

These are the files to write for a fresh Fumadocs project using the **manual installation** flow (App Router, `fumadocs-mdx` content source, `fumadocs-ui` layouts, Tailwind v4). This mirrors what `pnpm create fumadocs-app` would generate, written out directly since this sandbox can't run the interactive CLI or hit npm's registry.

Adjust the placeholder values (`<PROJECT_NAME>`, `<SITE_TITLE>`, `<SITE_DESCRIPTION>`) to match the topic.

> **⚠️ Versions and import paths below were correct as of Aug 2026 — verify before trusting them blindly.** Fumadocs ships very frequently (multiple releases per package per week is normal), and it has broken import paths across versions before: `fumadocs-ui/layouts/docs/page` as an explicit subpath only exists from v16.2 onward — pinning `"fumadocs-ui": "^15"` while using that import (an actual bug this skill shipped once) resolves to a pre-16.2 release where the import doesn't exist, and the build fails with `'DocsPage' is not exported from 'fumadocs-ui/layouts/docs/page'`. **Before writing `package.json` or any file that imports from `fumadocs-ui`/`fumadocs-core`/`fumadocs-mdx`, web-search + fetch the current official docs** (start from https://www.fumadocs.dev/docs/mdx/next and https://www.fumadocs.dev/docs/ui/manual-installation) to confirm the current latest major versions and current import paths still match what's below, and adjust the version numbers / imports in what you write if they've drifted. Don't skip this check just because it worked once.

---

## `package.json`

Scripts follow the standard convention for a Cloudflare-Pages-deployed Fumadocs site — `build` produces the static export in `./dist` (per `next.config.ts` above), `deploy` builds then pushes via Wrangler, `preview` serves the built `dist` locally through Wrangler for a closer-to-production check than `next dev`.

```json
{
  "name": "<PROJECT_NAME>",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "deploy": "npm run build && wrangler pages deploy dist",
    "preview": "npm run build && wrangler pages dev dist",
    "postinstall": "fumadocs-mdx"
  },
  "dependencies": {
    "fumadocs-core": "^16",
    "fumadocs-mdx": "^15",
    "fumadocs-ui": "^16",
    "mermaid": "^11",
    "next": "^15",
    "next-themes": "^0.4",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/mdx": "^2",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8",
    "tailwindcss": "^4",
    "typescript": "^5",
    "wrangler": "^4"
  }
}
```

---

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".source/index.ts"],
  "exclude": ["node_modules"]
}
```

---

## `next.config.ts`

Configured for **static export to `./dist`**, matching a Cloudflare Pages deployment (build output directory = `dist`). This is the standard target for this skill's projects — adjust `distDir`/drop `output: 'export'` only if the user explicitly says they're deploying to a Node.js host (Vercel/self-hosted) instead of a static host.

```ts
import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true, // required for static export — next/image optimization needs a server
  },
};

export default withMDX(config);
```

**Important:** static export (`output: 'export'`) means no server-side route handlers can run at request time — every route must be pre-rendered at build time. This affects the search route below (must use `staticGET`, not the default dynamic `GET`) and rules out any future server-only feature (auth, dynamic API routes, ISR) unless the user later switches away from static export.

---

## `source.config.ts`

The `remarkMdxMermaid` plugin converts plain ` ```mermaid ` code blocks (the syntax used throughout `fumadocs-technical-writer`/`fumadocs-interview-question-writer`) into `<Mermaid chart="..." />` component usage automatically at build time — **without this plugin, mermaid code blocks render as plain code, not diagrams** (this is a real bug this skill shipped once — verify it's present).

```ts
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';

export const docs = defineDocs({
  dir: 'content/docs',
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMdxMermaid],
  },
});
```

---

## `postcss.config.mjs`

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

---

## `mdx-components.tsx` (project root)

```tsx
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Mermaid } from '@/components/mdx/mermaid';
import type { MDXComponents } from 'mdx/types';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Mermaid,
    ...components,
  };
}
```

---

## `components/mdx/mermaid.tsx`

**Required for mermaid diagrams to render at all** — Fumadocs has no built-in Mermaid renderer; this is the official recommended client component (from https://www.fumadocs.dev/docs/markdown/mermaid), reproduced exactly since it's boilerplate wiring code, not something to paraphrase. Requires `mermaid` and `next-themes` as dependencies (already in the `package.json` template above — double check they're present).

```tsx
'use client';

import { use, useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

export function Mermaid({ chart }: { chart: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return;
  return <MermaidContent chart={chart} />;
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(key: string, setPromise: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;

  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

function MermaidContent({ chart }: { chart: string }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const { default: mermaid } = use(cachePromise('mermaid', () => import('mermaid')));

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    fontFamily: 'inherit',
    themeCSS: 'margin: 1.5rem auto 0;',
    theme: resolvedTheme === 'dark' ? 'dark' : 'default',
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () => {
      return mermaid.render(id, chart.replaceAll('\\n', '\n'));
    }),
  );

  return (
    <div
      ref={(container) => {
        if (container) bindFunctions?.(container);
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
```

`RootProvider` (already in `app/layout.tsx` below) ships `next-themes` support out of the box, so `useTheme()` here works without any extra provider setup.

---

## `lib/source.ts`

```ts
import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});
```

---

## `lib/layout.shared.ts`

```ts
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: '<SITE_TITLE>',
    },
  };
}
```

---

## `app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';

export const metadata: Metadata = {
  title: '<SITE_TITLE>',
  description: '<SITE_DESCRIPTION>',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

---

## `app/global.css`

```css
@import 'tailwindcss';
@import 'fumadocs-ui/css/style.css';

/* --- layout width / padding tightening, see layout-padding-customization.md --- */
:root {
  --fd-layout-width: 100%;
}

#nd-docs-layout {
  padding-inline: 0.5rem;
}

@media (min-width: 768px) {
  #nd-docs-layout {
    padding-inline: 1rem;
  }
}
```

---

## `app/docs/layout.tsx`

```tsx
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.pageTree}
      containerProps={{ className: 'px-0' }}
    >
      {children}
    </DocsLayout>
  );
}
```

---

## `app/docs/[[...slug]]/page.tsx`

```tsx
import { source } from '@/lib/source';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDXContent = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDXContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
```

---

## `.gitignore`

```
node_modules
.next
.source
.env*.local
```

---

## `app/api/search/route.ts`

**Required for the built-in search box to work at all** — without this route, Fumadocs UI's search dialog calls `/api/search` and gets a 404. Because the project uses `output: 'export'` (static export, no server at request time), this **must** use `staticGET`, not a normal dynamic `GET` — a normal route handler would silently fail to work once deployed as a static site even though it works fine in `next dev`.

```ts
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

// statically cached at build time — required for static export
export const revalidate = false;
export const { staticGET: GET } = createFromSource(source);
```

The default Fumadocs UI search dialog (registered automatically via `RootProvider`) also needs to be told to use the static client instead of the fetch client — otherwise it'll still try to hit the (nonexistent, at runtime) dynamic endpoint. Add this to `lib/layout.shared.ts`'s returned options, or wherever `RootProvider`/`DocsLayout` search config is set:

```ts
// inside baseOptions() in lib/layout.shared.ts, or passed to RootProvider
searchOptions: {
  type: 'static',
},
```
(Exact prop name/location can shift between Fumadocs versions — verify against current docs per the version-check note at the top of this file if the search dialog doesn't find results after deploy.)

---

## `public/_redirects` (Cloudflare Pages redirect rules)

Cloudflare Pages serves the static export as-is — there's no automatic redirect from `/` to a docs page unless one is configured. Redirect the site root to the first real content page (the first page in the root `content/docs/meta.json`'s `pages` order):

```
/    /docs/<first-category-slug>/<first-page-slug>    302
```

Update this file whenever the very first page of the whole site changes (e.g. the first category gets reordered).

---



```json
{
  "title": "<SITE_TITLE>",
  "pages": ["nen-tang", "bat-dau", "..."]
}
```
List the top-level category folder slugs in the order they should appear in the sidebar, per the plan from `topic-outline-guide.md`.

---

## Category folder `meta.json` (e.g. `content/docs/telemetry-signals/meta.json`)

```json
{
  "title": "Telemetry signals",
  "pages": ["index", "traces", "spans", "sampling", "metrics", "logs"]
}
```
`"index"` (or whatever the category landing page's filename is, minus extension) should usually be listed first so the category overview appears above its child pages.

---

## Root landing page `content/docs/index.mdx` (docs home / roadmap page)

```mdx
---
title: <SITE_TITLE>
description: <SITE_DESCRIPTION>
---

Tài liệu này là lộ trình học <TOPIC> theo từng phần, được tổ chức theo sidebar bên trái.

## Mục lục
- [Cách sử dụng](#cách-sử-dụng)
- [Lộ trình học](#lộ-trình-học)

## Cách sử dụng
Mỗi mục trong sidebar là một nhóm chủ đề. Bắt đầu từ trên xuống dưới để đi theo đúng thứ tự học đề xuất.

## Lộ trình học
- **Nền tảng** — khái niệm cơ bản, thuật ngữ.
- **Bắt đầu** — cài đặt và chạy thử.
- ... (liệt kê từng category theo plan)
```
