# Tightening Fumadocs layout padding

The user's standing requirement for this skill: the docs layout should not waste horizontal space. Specifically:
1. **Outer edges** — the whole layout (sidebar + content + TOC) should extend close to both screen edges instead of capping at a centered, narrower column with big empty margins on wide screens.
2. **Mid-content padding** — the gaps around the article content (between sidebar and article, article and TOC) should also be tightened so the article itself gets more usable width.
3. **Collapsed sidebar** — when the left nav is hidden/collapsed, the content area must actually reclaim that freed width and shift closer to the left edge, not stay pinned at the same width with dead space where the sidebar used to be.

## ⚠️ Known limitation: the CSS-variable-only approach (Fix 1/2 below) has proven insufficient in practice

Real-world testing on a scaffolded project showed that setting `--fd-layout-width: 100%` plus `containerProps={{ className: 'px-0' }}` **still left a visible gap on the right outer edge**, and **collapsing the sidebar did not make the content area reclaim the freed space** (content stayed the same width, shifted left only slightly). This means the installed Fumadocs version's actual layout CSS doesn't fully key off `--fd-layout-width`/`--fd-sidebar-width` the way assumed, or there's a separate hardcoded `max-w-*`/`mx-auto` wrapper class involved that these variables don't reach.

**Conclusion: treat Fix 4 (CLI eject) below as the primary, required approach whenever a shell with network access is available — not just a fallback.** Fix 1/2/3 (CSS variables + prop overrides) are a best-effort stopgap only for fully offline scaffolding (no network to run the CLI), and must be explicitly flagged to the user as unverified/likely-incomplete in that case.

## How Fumadocs' docs layout sizes itself (background, may not fully hold for every version)

`DocsLayout` renders a CSS grid (`#nd-docs-layout`) with three columns: sidebar, content, TOC. The grid's total width is nominally governed by the CSS variable `--fd-layout-width` (defaults to `97rem`), and individual column widths by `--fd-sidebar-width` / `--fd-toc-width`. In practice, some versions/layout variants also apply a max-width and/or centering via plain Tailwind classes on a wrapper element that ignores these CSS variables entirely — which is the likely explanation for the gap the user saw. Don't assume the CSS-variable theory is complete; verify against the actual rendered/ejected source.

## Fix 4 — eject the layout via Fumadocs CLI and edit the real classes directly (primary approach)

Once the project has `node_modules` installed (i.e. whenever a shell has network access), run:
```bash
pnpm dlx @fumadocs/cli customize
# or, to eject a specific piece directly:
pnpm fumadocs add layouts/docs
pnpm fumadocs add layouts/docs/page
```
This copies the actual layout/page container source into the project (typically under `components/layout/` or similar — the CLI reports the exact path it writes to). Once ejected:
1. Open the ejected container/layout file and find every `max-w-*`, `mx-auto`, `w-*`, and `px-*`/`pl-*`/`pr-*` utility class on the elements wrapping the sidebar, article, and TOC columns — these are the real, version-accurate classes, not a guess.
2. Remove/loosen `max-w-*` caps and `mx-auto` centering that's capping total width short of the viewport.
3. For the collapsed-sidebar case specifically: find the conditional class (often driven by a `data-*` attribute or a collapsed/open state class on the grid or sidebar element) and confirm the content column's `grid-template-columns` (or flex `width`) actually changes when that state toggles — if the content column has a fixed `width`/`max-width` independent of the sidebar's presence, that's the exact bug; change it to `1fr`/`auto`/`100%` so it grows to fill the freed space.
4. Reduce `px-*`/gap utilities between columns to taste.
5. **Verify visually** — run `npm run dev`, open the site, and check both the wide-screen outer-edge gap and the collapsed-sidebar behavior before considering this done. Don't declare the padding fixed without having actually looked at it rendered; this exact class of bug has already slipped through CSS-only guessing once.

## Fix 1 — outer edges: override `--fd-layout-width` (offline stopgap only)

In `app/global.css`, after importing Fumadocs' stylesheet:

```css
html, :root {
  --fd-layout-width: 100% !important;
}
```

If `100%` behaves oddly with the grid's `minmax()` calculations in a given Fumadocs version, a very large fixed value works just as well (e.g. `140rem` or `1800px`). Keep both options as commented alternatives:

```css
html, :root {
  /* Option A: fill viewport */
  --fd-layout-width: 100% !important;
  /* Option B (fallback if Option A misbehaves): fixed large cap */
  /* --fd-layout-width: 140rem !important; */
}
```

**This alone did not close the outer-edge gap in real testing — always pair it with Fix 4 when possible, and warn the user it's unverified if Fix 4 couldn't run.**

## Fix 2 — remove/reduce the grid container's own outer padding

`DocsLayout` accepts `containerProps` to style the grid wrapper directly:

```tsx
<DocsLayout
  {...baseOptions()}
  tree={source.pageTree}
  containerProps={{ className: 'px-0' }}
>
```

Combine this with a small responsive padding directly on `#nd-docs-layout` in CSS (already included in the `global.css` template) so there's a little breathing room on small screens but near-zero on the outermost edges at larger widths:

```css
#nd-docs-layout {
  padding-inline: 0.5rem;
}
@media (min-width: 768px) {
  #nd-docs-layout {
    padding-inline: 1rem;
  }
}
```

## Fix 3 — mid-content padding (between sidebar/article/TOC)

This is the padding *inside* the content column — around the article's title/body, and the gutter next to the TOC. Two supported approaches, in order of preference:

**A. `DocsPage`/`DocsBody` className overrides (try first, least invasive):**
```tsx
<DocsPage toc={page.data.toc} full={page.data.full} article={{ className: 'max-w-none px-4 md:px-6' }}>
```
`DocsPage` and `DocsBody` accept `className`/style-related props in recent Fumadocs versions — check the installed version's typings (`node_modules/fumadocs-ui/dist/layouts/docs/page.d.ts` once the user has run `npm install`) to confirm the exact prop name available. **If this prop doesn't exist or doesn't visibly change anything, don't keep guessing at prop names — go straight to Fix 4.**

**B. Fix 4 above (eject via CLI)** — use this instead of continuing to guess at prop names once Fix A doesn't visibly work.

## Summary of what this skill writes by default, and what still needs manual follow-up

Every scaffolded project includes, out of the box:
- `--fd-layout-width: 100% !important` in `global.css` (Fix 1)
- `containerProps={{ className: 'px-0' }}` on `DocsLayout` + small responsive `padding-inline` on `#nd-docs-layout` (Fix 2)
- `article={{ className: 'max-w-none px-4 md:px-6' }}` on `DocsPage` (Fix 3A)

**These are a best-effort starting point, not a guaranteed fix — real testing has shown they can still leave a visible outer-edge gap and fail to reclaim space when the sidebar is collapsed.** Whenever a shell with network access is available during or after scaffolding, run Fix 4 (CLI eject) and verify visually with `npm run dev` before telling the user the padding requirement is satisfied. If only offline scaffolding is possible, explicitly tell the user in the wrap-up message that the padding CSS is a best-effort default and they should check it visually after `npm install && npm run dev`, and points them at this file's Fix 4 if gaps remain.

