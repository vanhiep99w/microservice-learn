'use client';

import type { ComponentProps, CSSProperties } from 'react';
import { useDocsPage } from 'fumadocs-ui/layouts/docs/page';

const baseClassName =
  'flex flex-col w-full [grid-area:main] py-6 gap-4 md:pt-8 xl:pt-14';

/**
 * Wider page container with a smaller responsive gutter than the stock
 * max-width: 900px, centered article.
 */
export function DocsPageContainer(props: ComponentProps<'article'>) {
  const { full } = useDocsPage();

  return (
    <article
      id="nd-page"
      data-full={full}
      {...props}
      style={{
        width: '100%',
        maxWidth: 'none',
        marginInline: 0,
        paddingInline: 'clamp(1rem, 1.5vw, 1.5rem)',
        ...props.style,
      } as CSSProperties}
      className={[baseClassName, props.className].filter(Boolean).join(' ')}
    >
      {props.children}
    </article>
  );
}
