'use client';

import { useEffect, useState, type ComponentProps, type CSSProperties } from 'react';
import { useDocsLayout } from 'fumadocs-ui/layouts/docs';

const baseClassName =
  'grid overflow-x-clip min-h-(--fd-docs-height) [--fd-docs-height:100dvh] [--fd-header-height:0px] [--fd-toc-popover-height:0px] [--fd-sidebar-width:0px] [--fd-toc-width:0px] data-[column-changed=true]:transition-[grid-template-columns]';

/**
 * Full-width replacement for Fumadocs' docs grid container.
 *
 * The stock layout reserves centered outer columns and calculates the main
 * column using the expanded sidebar width even after the sidebar collapses.
 * Using the live sidebar column and a flexible main track lets the article
 * reclaim all available space.
 */
export function DocsLayoutContainer(props: ComponentProps<'div'>) {
  const { slots } = useDocsLayout();
  const { collapsed } = slots.sidebar.useSidebar();
  const [previousCollapsed, setPreviousCollapsed] = useState(collapsed);
  const isCollapseChanged = previousCollapsed !== collapsed;

  useEffect(() => {
    if (isCollapseChanged) setPreviousCollapsed(collapsed);
  }, [collapsed, isCollapseChanged]);

  return (
    <div
      id="nd-docs-layout"
      data-sidebar-collapsed={collapsed}
      data-column-changed={isCollapseChanged}
      {...props}
      style={{
        gridTemplate: `"sidebar sidebar header toc toc"
"sidebar sidebar toc-popover toc toc"
"sidebar sidebar main toc toc" 1fr / 0 var(--fd-sidebar-col) minmax(0, 1fr) var(--fd-toc-width) 0`,
        '--fd-docs-row-1': 'var(--fd-banner-height, 0px)',
        '--fd-docs-row-2': 'calc(var(--fd-docs-row-1) + var(--fd-header-height))',
        '--fd-docs-row-3': 'calc(var(--fd-docs-row-2) + var(--fd-toc-popover-height))',
        '--fd-sidebar-col': collapsed ? '0px' : 'var(--fd-sidebar-width)',
        ...props.style,
      } as CSSProperties}
      className={[baseClassName, props.className].filter(Boolean).join(' ')}
    >
      {props.children}
    </div>
  );
}
