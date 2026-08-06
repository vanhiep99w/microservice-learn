import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { DocsLayoutContainer } from '@/layouts/docs/slots/container';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{ title: 'Microservices' }}
      sidebar={{
        tabs: false,
      }}
      slots={{ container: DocsLayoutContainer }}
      containerProps={{ className: 'px-0' }}
    >
      {children}
    </DocsLayout>
  );
}
