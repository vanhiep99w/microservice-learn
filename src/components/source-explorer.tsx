'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { D2SourceLinks, SourceExplorerProvider } from '@vanhiep99w/docs-kit/components/source-explorer';

export function SourceExplorer({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <SourceExplorerProvider
      navigationKey={pathname}
      manifestUrl="/source-examples/manifest.json"
      scrollAnchorSelector="#nd-page .prose > *"
    >
      <D2SourceLinks>{children}</D2SourceLinks>
    </SourceExplorerProvider>
  );
}
