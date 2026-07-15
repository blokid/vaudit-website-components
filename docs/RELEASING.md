# Releasing a new version

This repo ships a single bundle (`dist/vaudit.js` + `dist/vaudit.css`). It is **not** served from jsDelivr anymore. This repo is the versioned source of truth: you build `dist/`, commit it, tag it. The built files are then copied by hand into the **backend repo**, which serves them as static files at:

```
https://api.vaudit.com/static/components/vaudit.css
https://api.vaudit.com/static/components/vaudit.js
```

Those URLs are **stable and unversioned** — a release changes the *bytes* the backend serves, not the Webflow URL. So Webflow's Footer Custom Code is set once and never touched per release.

## TL;DR — cut a patch/minor

```bash
# 1. Make sure your tree is clean except for the change you're shipping
git status

# 2. Bump version in package.json (semver — patch for fixes, minor for new
#    props/components, major for breaking marker/prop changes)
npm version patch --no-git-tag-version    # or: minor / major

# 3. Build — regenerates dist/vaudit.{js,css}
npm run build

# 4. Commit source + dist together
git add -A
git commit -m "release: vX.Y.Z"

# 5. Tag and push together
git tag -a vX.Y.Z -m "release: vX.Y.Z"
git push --follow-tags
```

`--follow-tags` pushes the branch *and* any **annotated** tags reachable from it (note: lightweight tags created with `git tag vX.Y.Z` are *not* picked up by `--follow-tags` — they need `git push origin vX.Y.Z` explicitly). Use `git tag -a` so the single push covers both.

## Publishing the release (handoff to the backend dev)

The tag pins the source. To hand the build to the backend dev, publish a **GitHub Release** with a changelog and a downloadable artifact — one URL, no repo access to this tree needed. The `/release` command automates this; the manual equivalent:

```bash
# Changelog since the previous tag, minus release/build noise
PREV=$(git describe --tags --abbrev=0 vX.Y.Z^ 2>/dev/null)
CHANGELOG=$(git log --pretty='- %s' --invert-grep --grep='^release:' --grep='^build:' \
  ${PREV:+$PREV..}vX.Y.Z)
# Squashed release → fall back to the release commit's body
[ -z "$CHANGELOG" ] && CHANGELOG=$(git log -1 --pretty='%b' vX.Y.Z | sed '/^Co-Authored-By:/d')

# Stage the artifact in the exact shape the backend's static/components/ needs
STAGE=$(mktemp -d)
cp dist/vaudit.js dist/vaudit.css "$STAGE/"
cp -R assets "$STAGE/assets"
( cd "$STAGE" && zip -qr "vaudit-components-vX.Y.Z.zip" vaudit.js vaudit.css assets )

NOTES=$(mktemp)
cat > "$NOTES" <<EOF
Static bundle for vX.Y.Z.

**Deploy:** unzip \`vaudit-components-vX.Y.Z.zip\` into the backend repo's \`static/components/\`, then deploy the backend.

## Changes
$CHANGELOG
EOF

gh release create vX.Y.Z \
  "$STAGE/vaudit-components-vX.Y.Z.zip" dist/vaudit.js dist/vaudit.css \
  --title "vX.Y.Z" --notes-file "$NOTES"
```

The release carries three assets: the **zip** (drop-in for `static/components/` — contains `vaudit.js`, `vaudit.css`, and `assets/`) plus the raw **`vaudit.js`** / **`vaudit.css`** for single-file grabs.

The `assets/` dir matters: components like `adid-animation` / `tokenid-animation` resolve bundled assets **relative to the served `vaudit.js`** (see `src/asset-base.ts`), so it must sit alongside the bundle in `static/components/`. That's why it's in the zip.

### Backend dev's side

1. Open the release: `https://github.com/blokid/vaudit-website-components/releases/latest` (or `.../tag/vX.Y.Z`).
2. Download `vaudit-components-vX.Y.Z.zip` and unzip it into the backend repo's `static/components/`.
3. Commit + deploy the backend. Once live, the stable URLs below serve the new build.

## Updating Webflow

Normally **nothing to do** — the Footer URLs are unversioned and stable:

```html
<link rel="stylesheet" href="https://api.vaudit.com/static/components/vaudit.css">
<script src="https://api.vaudit.com/static/components/vaudit.js" defer></script>
```

You only touch Webflow if the static path itself ever changes. Custom Code does not deploy until you hit **Publish**.

## Caching

The backend owns cache behavior via its `Cache-Control` headers on `static/components/*`. Since the URL is unversioned, whatever TTL the backend sets is what browsers/CDN hold onto:

- **Short/no cache** → new deploys show up immediately; costs a fetch per page load.
- **Long cache** → cheap, but you must invalidate on the backend side (or add a `?v=` query bump in Webflow) when you deploy new bytes.

If you need to force a refresh without waiting out a long TTL, append a query bump in the Webflow Footer and republish:

```html
<script src="https://api.vaudit.com/static/components/vaudit.js?v=0.26.48" defer></script>
```

Coordinate the actual header strategy with whoever owns the backend repo.

## Iterating without a full release

For day-to-day dev you don't need the backend at all — run the playground, which reads straight from `src/`:

```bash
npm run hub          # http://localhost:5173 — full playground
# or
npm run dev          # vite build --watch — rebuilds dist/ on save
```

Run `npm run build` again immediately before tagging — easy to forget after iterating, since the playground reads `src/` but the release ships `dist/`.

## What if I tagged the wrong thing?

Prefer rolling forward with a new patch tag. If a tag was pushed by mistake and you noticed within seconds (nothing deployed off it yet), you can delete it:

```bash
git push --delete origin vX.Y.Z
git tag -d vX.Y.Z
```

…then update `package.json` and tag fresh. Safer default: **roll forward, never back**.

## Version semantics for this bundle

- **Patch (`0.4.0 → 0.4.1`)** — bug fixes, copy tweaks, internal refactors. No marker or prop changes.
- **Minor (`0.4.1 → 0.5.0`)** — new components, new optional props, new prop values. Existing markers in Webflow keep working unchanged.
- **Major (`0.x → 1.0`)** — anything that breaks an existing `data-rc` or `data-prop` consumer: removing a component, removing a prop, changing a prop's type, or changing the marker scanner contract. Webflow embeds will need to be edited.

If in doubt, bump minor. Webflow embeds are hand-edited — making them break silently is worse than over-versioning.
