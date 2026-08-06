# Sourcing the topic's favicon

The project's favicon should match the topic's **real, standard/official icon, in the correct official color(s)** — not black/monochrome, and not an invented interpretation. A Redis project gets the actual red Redis mark, a Kubernetes project gets the actual blue helm-wheel mark, and so on. Never freehand-design a logo-like icon for a topic that already has a well-known one, and never ship it colorless — an uncolored icon reads as "placeholder," not as the real brand.

## Two possible sources, in priority order

Brand logos fall into two categories that need different handling:
- **Single-tone brand marks** (Redis, Kubernetes, Docker, most of them) — one flat brand color. Simple Icons (below) handles these well and is the default source.
- **Multi-color/multi-tone official logos** (some brands' real marks use more than one color/gradient) — a single-tone reproduction won't actually look like the real logo. For these, prefer finding genuine multi-color official artwork first (Tier A below); only fall back to a single-tone Simple Icons version (Tier B) if you can't find real multi-color artwork.

### Tier A — genuine multi-color official artwork (check this first if the brand's real logo looks multi-color)

If you know or suspect the topic's real logo uses more than one color (check by recalling the logo or doing a quick image/web search for "<topic> official logo"), look for the actual vector artwork rather than settling for single-tone:
- Web-search `"<topic> logo svg"` or `"<topic> brand assets"` / `"<topic> press kit"` — many companies publish a brand-assets page with downloadable SVG/PNG logos in correct multi-color.
- Wikipedia/Wikimedia Commons often hosts the current official multi-color logo as an SVG (search `"<topic> wikipedia logo svg"`) — these are typically sourced from the official brand and kept up to date.
- Fetch the SVG/PNG found this way and save it as `app/icon.svg` (or `app/icon.png` if only a raster version is available — Next.js App Router picks up either).

### Tier B — Simple Icons (default for single-tone marks, and fallback otherwise)

[Simple Icons](https://simpleicons.org) is a library of 3400+ single-tone SVG brand icons, CC0-1.0 licensed, and the standard source for this use case (developer tool docs/READMEs/dashboards use it constantly). **Always use the colored endpoint — never ship the bare monochrome/black default.**

1. **Determine the topic's canonical brand slug.** Don't guess blindly — the slug isn't always the obvious word (e.g. Kafka's slug is `apachekafka`, not `kafka`; Kubernetes is `kubernetes`; Elasticsearch is `elasticsearch` — verify, don't assume). Web-search `"<topic> site:simpleicons.org"` or fetch `https://simpleicons.org/` and search its list, or browse `https://cdn.jsdelivr.net/npm/simple-icons/icons/` to confirm the exact slug.
2. **Get the exact official hex color — don't guess this either.** Fetch `https://cdn.jsdelivr.net/npm/simple-icons@latest/data/simple-icons.json` (or the icon's individual metadata) and read its `hex` field, or check the color swatch shown on the icon's page at `https://simpleicons.org/?q=<topic>`. This hex is Simple Icons' verified official brand color — use it exactly, don't approximate from memory.
3. **Fetch the SVG through the colored CDN endpoint, with the verified hex:**
   ```
   https://cdn.simpleicons.org/<slug>/<hex-color-without-#>
   ```
   Example (verify the hex yourself per step 2 rather than trusting this number blindly):
   ```
   https://cdn.simpleicons.org/elasticsearch/005571
   ```
   **Do not use the plain jsDelivr path** (`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<slug>.svg`) as the final output — that one renders with `currentColor`/no fill baked in and comes out black/colorless when saved standalone as a favicon, which is exactly the "no color" problem to avoid. If you do fetch the plain SVG for any reason, set its fill to the verified hex yourself before saving (`fill="#<hex>"` on the `<path>`), rather than leaving it uncolored.

## Saving the result

Save the fetched icon (from either tier) as the Next.js App Router favicon convention — no metadata config needed, Next.js auto-detects these filenames in the `app/` directory:
- `app/icon.svg` — preferred if you have an SVG (from either tier), scales cleanly.
- `app/icon.png` — use if only a raster/PNG version was found (common for Tier A brand-asset downloads).

**Multi-technology / ecosystem topics** (e.g. "ELK stack" covering Elasticsearch + Logstash + Kibana): use the icon of the **primary/umbrella brand** the collection is named after or centers on — don't try to composite multiple logos into one icon.

## When the topic has no standard icon

Some topics genuinely don't have a recognizable brand mark — general collections like "interview questions" not tied to one product, an in-house/internal system with no public logo, or a broad conceptual topic ("microservices" as a pattern, not a product). In these cases:
- **Don't invent something that looks like it could be a real brand's logo** — that misrepresents an actual product/company that doesn't have this icon.
- Instead, generate a simple, clearly-generic icon: an abstract geometric shape, a monogram/initial-based mark, or a plain symbolic icon (e.g. a `?` mark motif for interview-question collections) using the site's own accent color. Keep it simple — a favicon is small and low-detail already.
- Note in the wrap-up message that no standard icon exists for this topic and a generic one was used instead, so the user can swap it later if they have brand preferences.

## Legal note

Simple Icons (Tier B) is CC0-1.0 for the icon files themselves; brand-asset/press-kit downloads (Tier A) are typically explicitly provided by the company for identification use. The underlying trademarks still belong to their respective companies either way — Simple Icons' own disclaimer (https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md) asks users to respect each brand's guidelines where relevant (e.g. don't imply official endorsement). Using a brand's icon as a favicon to identify documentation *about* that technology is standard, widely-practiced nominative use — this isn't the same as using it to imply the docs are official/endorsed by the company, so no special caveat is needed in the generated site itself.

