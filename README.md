# vaudit-components

React + TypeScript components for the Vaudit Webflow site, served as static files from the backend at `https://api.vaudit.com/static/components/`.

## How it works

1. Author components in `src/components/<name>/` and register them in `src/registry.ts`.
2. `npm run build` compiles a single IIFE bundle to `dist/vaudit.js` + `dist/vaudit.css`.
3. Commit `dist/` to `main` and tag releases with semver (`v0.1.0`, …).
4. Copy the built `dist/vaudit.{js,css}` (+ `assets/`) into the backend repo's `static/components/` and deploy it. See [docs/RELEASING.md](docs/RELEASING.md).
5. Webflow's footer Custom Code loads the bundle from the stable backend URL.
6. The bootstrap finds every `<div data-rc="component-name">` on the page and mounts the matching component into it.

## Webflow setup

**Project Settings → Custom Code → Head** (one-time, anti-flicker cloak):

```html
<style>
  [data-rc]:not([data-rc-mounted="true"]) { visibility: hidden; }
</style>
```

**Project Settings → Custom Code → Footer** (after the existing theme toggle script):

```html
<link rel="stylesheet" href="https://api.vaudit.com/static/components/vaudit.css">
<script src="https://api.vaudit.com/static/components/vaudit.js" defer></script>
```

These URLs are stable and unversioned — a release changes the bytes the backend serves, not the URL, so there's normally nothing to edit in Webflow per release.

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

The URL is unversioned, so cache behavior is set by the backend's `Cache-Control` headers on `static/components/*`. If the backend serves with a long TTL, force a refresh by appending a query bump in the Webflow Footer and republishing:

```html
<script src="https://api.vaudit.com/static/components/vaudit.js?v=0.26.48" defer></script>
```

See [docs/RELEASING.md](docs/RELEASING.md) for the full flow.
