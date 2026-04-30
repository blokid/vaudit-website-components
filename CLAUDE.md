# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

A buildable React + TypeScript repo whose output is a single bundle served from GitHub via **jsDelivr**. The Vaudit Webflow site loads that bundle once per page; the bootstrap then mounts components into `<div data-rc="component-name">` markers.

This repo is the migration target from `vaudit-website-pages`, where components used to live as hand-pasted HTML/CSS/JS in Webflow's Custom Code and Embed elements. The legacy snippets and Webflow-side conventions are preserved under `docs/` for reference — see [Reference docs](#reference-docs) below.

Unlike `vaudit-website-pages`, this repo **does** have a build pipeline: Vite + TypeScript + React Compiler. Standard `npm` commands apply.

## ⚠️ Never commit sensitive information

**This is a public GitHub repository** (jsDelivr requires public repos). Anything pushed here is publicly readable forever in git history.

Do **not** commit:

- API keys, tokens, or credentials of any kind
- Customer data, agent transcripts, or any PII
- Internal Vaudit docs not already published on the website
- `.env` files (always `.env.example` instead)
- Third-party domain analyses or business intelligence outputs (the kind of thing that lived in `pre_signup_response.txt` in the old repo — that file was intentionally **not** migrated for this reason)

If something sensitive lands here by mistake: rotate the secret immediately, then rewrite history (`git filter-repo` or BFG) — `git rm` alone leaves the file in history.

## Mounting model

Webflow author drops an HTML Embed:

```html
<div data-rc="hello"></div>
<div data-rc="hello" data-prop='{"name": "Aung", "count": 5, "muted": true}'></div>
```

- `data-rc` — component name (must exist in `src/registry.ts`)
- `data-prop` — JSON object passed as props. Use single quotes around the attribute so JSON's double quotes don't need escaping. Strings, numbers, booleans, arrays, nested objects all pass through natively.

Bootstrap (`src/main.tsx`) scans for `[data-rc]` on `DOMContentLoaded`. For markers injected later (e.g. CMS-rendered content), call `window.VauditComponents.mount()` to re-scan. Each node is marked `data-rc-mounted="true"` to prevent double-mounting.

## Authoring a component

```
src/components/<name>/
  index.tsx       # default export = the component
  <name>.css      # imported from index.tsx (optional but standard)
```

Then register it in `src/registry.ts`:

```ts
import MyThing from "./components/my-thing";
export const registry = { ...registry, "my-thing": MyThing };
```

## Styling convention

- **Plain CSS files, no styled-components / emotion.** The bundle is CDN-loaded; every kilobyte we add is paid by the browser on first hit. CSS-in-JS would cost ~12 KB gzip and replace exactly one thing — the existing `html.dark` cascade — which already works perfectly.
- **`clsx` for conditional class joining.** That is the one ergonomic gap plain CSS leaves; `clsx` is 0.5 KB and idiomatic.
- **Class names: `rc-componentname__element` (BEM-ish prefix).** The `rc-` prefix prevents collisions with Webflow's authored classes, and the BEM structure keeps specificity flat so Webflow page-level Custom CSS can override us cleanly.
- **Never set `font-family` on component roots.** Components inherit Webflow's typography from `<body>`. This is intentional so React-mounted blocks visually match surrounding native Webflow content. If a component truly needs a different font (rare), import it from the page (`font-family: var(--font-display)` etc. — see `docs/COLOR-SYSTEM.md` for variable names).
- **Dark mode uses the existing `html.dark` cascade.** Style light on the base class, then write `html.dark .rc-foo { … }` overrides next to the base styles in the same `.css` file. See `docs/WEBFLOW-THEME-CONVENTION.md` for the full convention. No JS-side theme handling — the dark class is set synchronously by a HEAD bootstrap on the Webflow side.
- **Responsive: standard `@media` queries.** Webflow's breakpoints are 991/767/479 px (per `docs/legacy-CLAUDE.md`); match them when porting existing sections.

The smoke test (`examples/smoke-test.html`) renders components against a plain page so the render in dev should match the render in Webflow byte-for-byte once the page font is inherited.

## Build / release

```
npm install              # first time
npm run build            # typecheck + production bundle → dist/vaudit.{js,css}
npm run dev              # vite build --watch (rebuilds dist/ on save)
npm run typecheck        # tsc --noEmit only
```

`dist/` is **committed** to `main` so jsDelivr serves it directly from the tagged ref.

Release flow:

1. Bump `package.json` version (semver).
2. `npm run build`.
3. Commit `dist/` + the version bump.
4. `git tag vX.Y.Z && git push --follow-tags`.
5. Update Webflow Footer custom code to the new tag URL.

Cache busting: tags and commit SHAs are immutable on jsDelivr. `@main` caches ~12 h. For dev iteration, point Webflow at `@<commit-sha>` (uncached, updates on every push) or hit `https://purge.jsdelivr.net/gh/<org>/<repo>@<ref>/<path>` to flush a specific URL.

## Webflow custom-code

**Head** — paste this once (anti-flicker cloak; must be synchronous-inline, not from the CDN, so it applies before the body parses):

```html
<style>
  [data-rc]:not([data-rc-mounted="true"]) { visibility: hidden; }
</style>
```

**Footer** — bundle and stylesheet from jsDelivr:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.css">
<script src="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.js" defer></script>
```

Place the footer block **after** the existing theme bootstrap and nav-dropdown scripts (see `docs/webflow/theme-custom-code.html.md`) so the `html.dark` class is set before any component reads it.

## Anti-flicker (no FOUC)

The bootstrap flips `data-rc-mounted="true"` on each marker via `useLayoutEffect` — i.e. after React commits and before the browser paints. Combined with the head `<style>` cloak above, every marker stays invisible until its component is rendered, then reveals atomically with no flash.

The bootstrap also adds **`html.rc-ready`** once every marker present at `DOMContentLoaded` has mounted. Use this only if you need a page-wide reveal hook — e.g. some hero element that should wait for the React stack:

```css
.hero-fade-in { opacity: 0; transition: opacity 200ms ease; }
html.rc-ready .hero-fade-in { opacity: 1; }
```

**Don't use `html { visibility: hidden }` until ready.** If jsDelivr is slow or blocked, the page stays blank. Per-marker cloak fails open: nav, hero, and footer all paint immediately; only the React regions briefly reserve space.

If you ship a placeholder (skeleton, spinner) inside the marker that should show *while* React loads, opt that marker out of the cloak by giving it `data-rc-mounted="true"` from the start, then it's React's job to show its own loading state.

## Reference docs

The `docs/` folder holds Webflow-side conventions and frozen copies of the legacy embed code. They are **not built or imported** — they exist so future sessions have the same context the previous repo did.

**Conventions (must-read before porting a new component):**

- [`docs/legacy-CLAUDE.md`](docs/legacy-CLAUDE.md) — the original CLAUDE.md from `vaudit-website-pages`, describing the no-build paste-into-Webflow workflow that this repo replaces.
- [`docs/WEBFLOW-THEME-CONVENTION.md`](docs/WEBFLOW-THEME-CONVENTION.md) — dark-mode mechanism (`html.dark .foo` cascade). Critical.
- [`docs/COLOR-SYSTEM.md`](docs/COLOR-SYSTEM.md) — hex ↔ Webflow Base-collection variable map (`Primary`, `charcoal-900`, `--muted-foreground`, etc.).
- [`docs/DESIGN.md`](docs/DESIGN.md) — broader visual system / token notes.

**Page + section context:**

- [`docs/PARTNER-PAGE-NOTES.md`](docs/PARTNER-PAGE-NOTES.md) — `/partner` page section order and copy.
- [`docs/PRESIGNUP-AGENT-STATUS.md`](docs/PRESIGNUP-AGENT-STATUS.md) — current state of the presignup agent integration.
- [`docs/PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md`](docs/PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md) — how the presignup agent is deployed in Webflow.

**Frozen legacy source (snapshots of what's currently pasted into Webflow):**

- [`docs/webflow/`](docs/webflow/) — the CSS / HTML / JS that lives inside Webflow Custom Code or Embed elements. Each `.md` wraps the source in a code fence with a one-line note about its role.
  - `theme-custom-code.html.md` — HEAD bootstrap (sets `html.dark` synchronously) + FOOTER theme toggle.
  - `body-dark-cascade.css.md` — central file of `html.dark .foo` overrides. **Touch this when adding a new section that needs dark variants.**
  - `presignup-agent.{html,css,js}.md` — current presignup-agent embed (the first candidate to port to React).
  - `product-cards.html.md` + `product-card.css.md` — product card embed.
  - `partner-how-it-works.css.md` — partner page section CSS.
  - `canvas-hide.js.md` — small Webflow Designer canvas helper.

- [`docs/legacy/`](docs/legacy/) — loose HTML files from the old repo root (`hero.html` is a full live-page snapshot; `faq-accordion-*.html` are embed snippets).
- [`docs/legacy/test/`](docs/legacy/test/) — pre-Webflow integration test pages that load each embed standalone.

**Assets:**

- [`docs/assets/preonboarding-icons/`](docs/assets/preonboarding-icons/) — SVGs used by the preonboarding flow (ad platforms, cloud, payment, shipping, AI tokens).
- [`docs/assets/partner-ref/`](docs/assets/partner-ref/) — reference PNGs for the partner page.

If you port one of these into a real React component, **leave the original `.md` in place** — it documents what the design looked like at migration time and what's currently live in Webflow until the new component ships.

## Tooling notes

- The Webflow MCP server lives in the **other** repo's `.claude/` config — this repo doesn't need it. If a task involves changing what's live in Webflow Custom Code (e.g. swapping the script tag URL), do that work from `vaudit-website-pages` where the Webflow MCP is wired up.
- React Compiler (`babel-plugin-react-compiler`) is enabled in `vite.config.ts`. Don't add manual `useMemo` / `useCallback` unless the compiler bails out on a specific case (rare).
- `process.env.NODE_ENV` is replaced via Vite's `define` because library mode doesn't do this by default. Without that replacement, dev React ships and the bundle balloons from ~61 KB to ~178 KB gzip.
