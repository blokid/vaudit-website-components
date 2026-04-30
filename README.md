# vaudit-components

React + TypeScript components for the Vaudit Webflow site, served from GitHub via jsDelivr.

## How it works

1. Author components in `src/components/<name>/` and register them in `src/registry.ts`.
2. `npm run build` compiles a single IIFE bundle to `dist/vaudit.js` + `dist/vaudit.css`.
3. Commit `dist/` to `main` and tag releases with semver (`v0.1.0`, …).
4. Webflow's footer Custom Code loads the bundle from jsDelivr.
5. The bootstrap finds every `<div data-rc="component-name">` on the page and mounts the matching component into it.

## Webflow setup

**Project Settings → Custom Code → Head** (one-time, anti-flicker cloak):

```html
<style>
  [data-rc]:not([data-rc-mounted="true"]) { visibility: hidden; }
</style>
```

**Project Settings → Custom Code → Footer** (after the existing theme toggle script):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@v0.2.0/dist/vaudit.css">
<script src="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@v0.2.0/dist/vaudit.js" defer></script>
```

Bump `@v0.2.0` per release. For local iteration use `@<commit-sha>` — branch URLs (`@main`) are cached for ~12 hours.

The bootstrap flips `data-rc-mounted="true"` on each marker after React commits but before the browser paints, so the Head cloak prevents any flash of empty markers. After all initial markers mount, `html.rc-ready` is added — use it for any whole-page reveal effects you want to gate on the bundle being live.

## Mount markers

Drop an HTML Embed in Webflow with:

```html
<div data-rc="hello"></div>
<div data-rc="hello" data-prop='{"name": "Aung"}'></div>
<div data-rc="hello" data-prop='{"name": "Aung", "count": 5, "muted": true}'></div>
```

The `data-rc` attribute names the component. `data-prop` is a JSON object passed as props — strings, numbers, booleans, arrays, and nested objects all work. Use single quotes around the attribute so JSON's double quotes don't need escaping.

## Authoring a new component

```
src/components/my-thing/
  index.tsx       // default export = the component
  my-thing.css    // optional, imported from index.tsx
```

Then add to `src/registry.ts`:

```ts
import MyThing from "./components/my-thing";
export const registry = { ...registry, "my-thing": MyThing };
```

## Dark mode

The Webflow site already toggles `html.dark` on the root. Components style light on the base class and use `html.dark .rc-foo { … }` overrides in their CSS — same convention as `body-dark-cascade.css` in the `vaudit-website-pages` repo.

## Scripts

- `npm run dev` — vite build in watch mode
- `npm run build` — typecheck + production build
- `npm run typecheck` — tsc only

## Cache busting

jsDelivr cache TTLs:
- `@v1.2.3` (semver tag) — permanent, immutable
- `@<commit-sha>` — permanent, immutable
- `@main` / `@latest` — ~12 hours

Use semver tags for production. For dev, push and reference by SHA, or call `https://purge.jsdelivr.net/gh/<org>/vaudit-components@main/dist/vaudit.js` to flush.
