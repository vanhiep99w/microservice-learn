import type { ReactNode } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './globals.css';
import { SourceExplorer } from '@/components/source-explorer';

export const metadata = {
  title: 'Microservices',
  description: 'Tài liệu học Microservice Architecture tiếng Việt',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <RootProvider search={{ options: { type: 'static' } }}>
          <SourceExplorer>{children}</SourceExplorer>
        </RootProvider>
      </body>
    </html>
  );
}
