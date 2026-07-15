# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this repo is

A buildable React + TypeScript repo whose output is a single bundle. The built `dist/` is committed and tagged here, then copied by hand into the **backend repo**, which serves it as static files at `https://api.vaudit.com/static/components/`. The Vaudit Webflow site loads that bundle once per page; the bootstrap then mounts components into `<div data-rc="component-name">` markers.

This repo is the migration target from `vaudit-website-pages`, where components used to live as hand-pasted HTML/CSS/JS in Webflow's Custom Code and Embed elements. The legacy snippets and Webflow-side conventions are preserved under `docs/` for reference — see [Reference docs](#reference-docs) below.

Unlike `vaudit-website-pages`, this repo **does** have a build pipeline: Vite + TypeScript + React Compiler. Standard `npm` commands apply.

## ⚠️ Never commit sensitive information

**Treat this as a public GitHub repository** (it has been public historically; don't assume that changed). Anything pushed here is publicly readable forever in git history.

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

- **Plain CSS files, no styled-components / emotion.** The bundle is loaded over the network on first hit; every kilobyte we add is paid by the browser then. CSS-in-JS would cost ~12 KB gzip and replace exactly one thing — the existing `html.dark` cascade — which already works perfectly.
- **`clsx` for conditional class joining.** That is the one ergonomic gap plain CSS leaves; `clsx` is 0.5 KB and idiomatic.
- **Class names: `rc-componentname__element` (BEM-ish prefix).** The `rc-` prefix prevents collisions with Webflow's authored classes, and the BEM structure keeps specificity flat so Webflow page-level Custom CSS can override us cleanly.
- **Never set `font-family` on component roots.** Components inherit Webflow's typography from `<body>`. This is intentional so React-mounted blocks visually match surrounding native Webflow content. If a component truly needs a different font (rare), import it from the page (`font-family: var(--font-display)` etc. — see `docs/COLOR-SYSTEM.md` for variable names).
- **Dark mode uses the existing `html.dark` cascade.** Style light on the base class, then write `html.dark .rc-foo { … }` overrides next to the base styles in the same `.css` file. See `docs/WEBFLOW-THEME-CONVENTION.md` for the full convention. No JS-side theme handling — the dark class is set synchronously by a HEAD bootstrap on the Webflow side.
- **Responsive: standard `@media` queries.** Webflow's breakpoints are 991/767/479 px (per `docs/legacy-CLAUDE.md`); match them when porting existing sections.

## Build / release

```
npm install              # first time
npm run build            # typecheck + production bundle → dist/vaudit.{js,css}
npm run dev              # vite build --watch (rebuilds dist/ on save)
npm run typecheck        # tsc --noEmit only
```

`dist/` is **committed** to `main` — it's the versioned build that gets copied into the backend.

Release flow (full detail in `docs/RELEASING.md`):

1. Bump `package.json` version (semver).
2. `npm run build`.
3. Commit `dist/` + the version bump.
4. `git tag vX.Y.Z && git push --follow-tags`.
5. Publish a **GitHub Release** (`gh release create`) with a changelog and a downloadable zip of the bundle (`vaudit.js` + `vaudit.css` + `assets/`, laid out for `static/components/`). The `/release` command does this.
6. Hand the backend dev the release URL. They download the zip, drop it into their repo's `static/components/`, and deploy the backend.

The Webflow Footer URLs are **stable and unversioned** (`https://api.vaudit.com/static/components/vaudit.{js,css}`), so a release does not touch Webflow — it changes the bytes the backend serves.

Cache busting: the URL is unversioned, so cache behavior is the backend's `Cache-Control` headers. To force a refresh under a long TTL, append a `?v=X.Y.Z` bump in the Webflow Footer and republish. Coordinate the header strategy with whoever owns the backend repo.

## Webflow custom-code

**Head** — paste this once. Must be synchronous-inline (not from the CDN) so it applies before the body parses. Combines a per-marker anti-flicker cloak with a full-page loading overlay; both clear automatically once the bundle has loaded and the bootstrap has set `html.rc-ready`.

```html
<style>
  /* Anti-flicker cloak: hide any [data-rc] markers as a safety net while
     the bundle hasn't mounted them yet. */
  [data-rc]:not([data-rc-mounted="true"]) { visibility: hidden; }

  /* Full-page loader — covers the page until the bundle has loaded AND
     the bootstrap has mounted every initial [data-rc] marker (it sets
     html.rc-ready once that's done). Pure CSS, no extra HTML or JS. */
  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background: #ffffff;
    z-index: 99998;
    transition: opacity 380ms ease-out, visibility 0s 380ms;
    pointer-events: none;
  }
  body::after {
    content: "Vaudit";
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    font-weight: 700;
    font-size: 2.25rem;
    letter-spacing: -0.02em;
    color: #f0651f;
    z-index: 99999;
    animation: vaudit-loader-pulse 1.4s ease-in-out infinite;
    transition: opacity 380ms ease-out;
    pointer-events: none;
  }
  @keyframes vaudit-loader-pulse {
    0%, 100% { transform: scale(1);    opacity: 0.7; }
    50%      { transform: scale(1.04); opacity: 1;   }
  }
  html.rc-ready body::before,
  html.rc-ready body::after {
    opacity: 0;
    visibility: hidden;
  }
  html.dark body::before { background: #0a0a09; }
</style>
```

How it works: while the bundle is in flight from the backend, `body::before` paints a full-viewport solid cover and `body::after` pulses the brand-orange "Vaudit" wordmark on top. Once `src/main.tsx` finishes mounting every initial `[data-rc]` marker on the page, it sets `html.rc-ready`; the selector flip kicks the 380 ms opacity transition and both pseudo-elements fade out, revealing the page. No extra HTML or JS to install — purely CSS reacting to a class the bundle already toggles.

If the bundle never loads (network failure, ad-blocker), the loader stays visible — fine for staging; if you want a max-duration fallback for production, set `html.rc-ready` from a `setTimeout` after a few seconds of grace.

**Footer** — bundle and stylesheet from the backend static host:

```html
<link rel="stylesheet" href="https://api.vaudit.com/static/components/vaudit.css">
<script src="https://api.vaudit.com/static/components/vaudit.js" defer></script>
```

Place the footer block **after** the existing theme bootstrap and nav-dropdown scripts (see `docs/webflow/theme-custom-code.html.md`) so the `html.dark` class is set before any component reads it.

## Anti-flicker + skeleton loader (no FOUC, no blank rectangle)

The bootstrap flips `data-rc-mounted="true"` on each marker via `useLayoutEffect` — i.e. after React commits and before the browser paints. The head block above paints a shimmer skeleton on every unmounted marker, then the attribute flip makes the skeleton selector miss and React's render takes over atomically.

The bootstrap also adds **`html.rc-ready`** once every marker present at `DOMContentLoaded` has mounted. Use this only if you need a page-wide reveal hook — e.g. some hero element that should wait for the React stack:

```css
.hero-fade-in { opacity: 0; transition: opacity 200ms ease; }
html.rc-ready .hero-fade-in { opacity: 1; }
```

**Don't use `html { visibility: hidden }` until ready.** If the backend is slow or blocked, the page stays blank. The per-marker skeleton fails open: nav, hero, and footer all paint immediately; only the React regions briefly show a shimmer placeholder.

If you ship your own placeholder (skeleton, spinner) inside the marker that should show *while* React loads, opt that marker out of the head block by giving it `data-rc-mounted="true"` from the start — then it's your HTML's job to render whatever loading state you want, until React mounts and replaces it.

## Reference docs

The `docs/` folder holds Webflow-side conventions and frozen copies of the legacy embed code. They are **not built or imported** — they exist so future sessions have the same context the previous repo did.

**Conventions (must-read before porting a new component):**

- [`docs/legacy-CLAUDE.md`](docs/legacy-CLAUDE.md) — the original CLAUDE.md from `vaudit-website-pages`, describing the no-build paste-into-Webflow workflow that this repo replaces.
- [`docs/WEBFLOW-THEME-CONVENTION.md`](docs/WEBFLOW-THEME-CONVENTION.md) — dark-mode mechanism (`html.dark .foo` cascade). Critical.
- [`docs/COLOR-SYSTEM.md`](docs/COLOR-SYSTEM.md) — hex ↔ Webflow Base-collection variable map (`Primary`, `charcoal-900`, `--muted-foreground`, etc.).
- [`docs/DESIGN.md`](docs/DESIGN.md) — broader visual system / token notes.
- [`docs/RELEASING.md`](docs/RELEASING.md) — how to cut a new version, copy `dist/` into the backend repo, and reason about caching.

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

## Presignup agent — backend session reset

`src/components/presignup-agent/` talks to the onboarding-agent backend (`presignup_agent` ADK app). As of 2026-05-12 the backend lazily resets unhealthy sessions: if a phase-1 or phase-2 turn raises a hard exception, the staging row is flagged `is_healthy=false`, and the next presignup HTTP turn wipes the ADK conversation + staging row and recreates a fresh ADK session **under the same `session_id`**. The frontend does **not** need to rotate its `localStorage`-cached session id — `ensureSession` already treats the 409-on-recreate case as success, which is exactly what happens after a reset.

Practical consequence: a visitor whose phase-1 audit failed and who retries (via the error message's retry button) will silently get a fresh ADK session under the same id and see a new audit stream. No protocol change here is needed. If you ever want a clean break on the client side as well, `resetSession()` in `agent-api.ts` is the explicit escape hatch (clears the localStorage id and generates a new UUID).

The `/presignup/accurate-breakdown/{session_id}` route — used by the client-driven phase-2 lock-in flow — now also triggers the same reset internally before reading the breakdown row. If a visitor's session went unhealthy between the last `/run_sse` and the lock-in POST, this route will return 404 ("session not found") rather than lock in numbers tied to a failed run. Surface that as the existing "session expired — please re-audit" error path.

**Explicit "Start over" (2026-06-01).** The card-corner "Start over" button (shown whenever an audit is on screen) calls `freshStartSession(baseUrl, sessionId)` in `agent-api.ts` → `POST /presignup/fresh-start/{session_id}`. This is a **same-id** backend teardown: the backend wipes the conversation + staging row (**including a PDF-`locked` breakdown — so this is the escape hatch from a locked session**) and recreates the ADK session under the same id, then re-extends the session-trust marker so the next domain submit streams without a fresh token. The route is trust-gated; if the trust window has lapsed it returns `401`, and `freshStartSession` throws `FreshStartError(401)` → `handleStartOver` falls back to `resetSession()` (client-side id rotation) so the button always yields a working fresh session. Note `handleStartOver` uses `peekSessionId()` (not `getSessionId()`) so a brand-new visitor with no cached id doesn't mint one just to reset. The post-results "Audit again" CTA (`handleAuditAgain`) keeps its original behaviour — a hard break that rotates the id via `resetSession()`.

## Tooling notes

- The Webflow MCP server lives in the **other** repo's `.claude/` config — this repo doesn't need it. If a task involves changing what's live in Webflow Custom Code (e.g. swapping the script tag URL), do that work from `vaudit-website-pages` where the Webflow MCP is wired up.
- React Compiler (`babel-plugin-react-compiler`) is enabled in `vite.config.ts`. Don't add manual `useMemo` / `useCallback` unless the compiler bails out on a specific case (rare).
- `process.env.NODE_ENV` is replaced via Vite's `define` because library mode doesn't do this by default. Without that replacement, dev React ships and the bundle balloons from ~61 KB to ~178 KB gzip.
