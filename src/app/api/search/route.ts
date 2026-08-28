import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

const MAX_SEARCH_SECTIONS = 12;
const MAX_SNIPPET_LENGTH = 600;

function compactSnippet(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SNIPPET_LENGTH);
}

function selectRepresentative<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;

  return Array.from({ length: limit }, (_, index) => {
    const position = Math.round((index * (items.length - 1)) / (limit - 1));
    return items[position];
  });
}

function compactStructuredData(data: StructuredData): StructuredData {
  const sections = new Map<string | undefined, string[]>();

  for (const item of data.contents) {
    const content = compactSnippet(item.content);
    if (!content) continue;

    const snippets = sections.get(item.heading) ?? [];
    snippets.push(content);
    sections.set(item.heading, snippets);
  }

  const contents = selectRepresentative(
    Array.from(sections, ([heading, snippets]) => ({
      heading,
      content: snippets.join(' ').slice(0, MAX_SNIPPET_LENGTH),
    })),
    MAX_SEARCH_SECTIONS,
  );

  return {
    headings: data.headings,
    contents,
  };
}

const { staticGET: GET } = createFromSource(source, {
  buildIndex: async (page) => {
    const structuredData = page.data.structuredData;

    if (!structuredData) {
      throw new Error(`Missing structured data for search page: ${page.path}`);
    }

    const fileName = page.path.split('/').pop();

    return {
      title: page.data.title ?? fileName?.replace(/\.[^.]+$/, '') ?? page.url,
      description: page.data.description,
      url: page.url,
      id: page.url,
      structuredData: compactStructuredData(structuredData),
    };
  },
});

export { GET };

// Required for Next.js static export
export const dynamic = 'force-static';
