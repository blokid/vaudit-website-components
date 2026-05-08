# Releasing a new version

This repo ships a single bundle (`dist/vaudit.js` + `dist/vaudit.css`) over jsDelivr. Webflow loads it from a tagged URL. To get new code in front of users you need three things in this order: a built `dist/` committed to `main`, a new git tag, and Webflow's Footer Custom Code pointing at that tag.

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

There is a `npm run release` shortcut in `package.json` that does build → commit `dist/` → `npm version patch` → push, but it commits twice (once for `dist/`, once for the version bump) which makes the history noisier than the manual flow above. Prefer the manual sequence unless you specifically want the script's behaviour.

## Verifying the new tag is live on jsDelivr

Before touching Webflow, confirm jsDelivr is actually serving the new tag. Three quick checks, each more forgiving of staleness than the last:

```bash
# 1. The bundle files themselves — should both return HTTP 200.
curl -sI "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.js"  | head -1
curl -sI "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.css" | head -1

# 2. jsDelivr's resolver — should echo back the version you asked for.
curl -s "https://data.jsdelivr.com/v1/packages/gh/blokid/vaudit-website-components/resolved?specifier=vX.Y.Z"

# 3. The package's known-versions list — sanity check the tag actually shows up.
curl -s "https://data.jsdelivr.com/v1/packages/gh/blokid/vaudit-website-components" \
  | python3 -c 'import sys,json;print([v["version"] for v in json.load(sys.stdin)["versions"][:5]])'
```

A fresh tag normally lights up within ~60–90 s of `git push`. If you still see 404s after a couple of minutes, see [Troubleshooting: tag stuck at 404](#troubleshooting-tag-stuck-at-404-after-push) below.

## Updating Webflow to use the new version

Project Settings → Custom Code → **Footer Code**. Find the two jsDelivr URLs and bump the tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.css">
<script src="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.js" defer></script>
```

Save → **Publish** the site. Custom Code does not deploy until you hit Publish.

## Caching — what to expect

jsDelivr's cache rules drive what users actually see:

| Ref form           | jsDelivr cache | When to use                                                     |
|--------------------|----------------|-----------------------------------------------------------------|
| `@vX.Y.Z`          | **Forever** (immutable — tag never changes) | Production. Bump the URL to ship new code. |
| `@<commit-sha>`    | **Forever** (immutable)                     | Dev iteration without tagging. Updates whenever you push and use a new SHA. |
| `@main`            | **~12 hours**                                | Convenience for staging — eventually catches up to `main`. Avoid in prod. |

Because tagged URLs are immutable, **the browser cannot serve a stale version of `@v0.5.0` once the page asks for `@v0.5.0`** — every byte at that URL is locked. "Cache problems" with tagged URLs are almost always one of:

1. **Webflow site wasn't republished** — Custom Code changes are still on the old tag URL. Open the published page's source and confirm the script tag points at the new version.
2. **Webflow's HTML cache** — the published page's HTML may itself be cached by Webflow's CDN and/or the browser. Hard reload (`Cmd+Shift+R` / `Ctrl+Shift+R`) or open DevTools → Network → check "Disable cache" while testing.
3. **You're still on `@main`** — `@main` caches for ~12 h on jsDelivr. To force a refresh:
   ```
   https://purge.jsdelivr.net/gh/blokid/vaudit-website-components@main/dist/vaudit.js
   https://purge.jsdelivr.net/gh/blokid/vaudit-website-components@main/dist/vaudit.css
   ```
   Visiting those URLs (in a browser tab is fine) flushes the jsDelivr edge cache for that exact path. Or run `npm run purge` (defaults to `@main`) to hit both at once. The next request re-fetches from GitHub.

## Troubleshooting: tag stuck at 404 after push

Symptom: you've pushed `vX.Y.Z` to GitHub, but jsDelivr keeps returning **404** for the bundle URL — sometimes for 30 minutes or more. The response body usually looks like one of:

```
Failed to fetch blokid/vaudit-website-components@X.Y.Z from GitHub.
```

```json
{"status":404,"message":"Couldn't find version X.Y.Z for blokid/vaudit-website-components ..."}
```

What's actually happening: jsDelivr tried to fetch the tag **before** GitHub had propagated it (often because something — a curl, a browser tab, the verification step above — hit the URL too eagerly). It cached the "ref doesn't exist" failure at its origin/manifest layer. Even after the tag becomes visible on GitHub, jsDelivr keeps serving the cached negative until something forces a re-check.

### Step 1 — confirm the tag really is on GitHub

```bash
git ls-remote --tags origin vX.Y.Z
# expect: <sha>    refs/tags/vX.Y.Z
```

If this is empty, the tag isn't on the remote — `git push --follow-tags` only sends **annotated** tags, so a tag created with plain `git tag vX.Y.Z` (lightweight) gets left behind. Push it explicitly:

```bash
git push origin vX.Y.Z
```

### Step 2 — confirm jsDelivr can read the repo at all

Try fetching the same file by **commit SHA** instead of tag:

```bash
SHA=$(git rev-parse vX.Y.Z)
curl -sI "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@${SHA}/dist/vaudit.js" | head -1
```

If this returns **200**, the bytes are on jsDelivr — only the tag *alias* is stuck. (If this also 404s, jsDelivr has a deeper problem with the repo itself; wait it out or ask in their support channel.)

### Step 3 — multi-path purge (the fix that actually works)

The single-file purge that the doc-elsewhere mentions for `@main` is **not enough** for a stuck tag, because jsDelivr's metadata cache also keys on the bare `@vX.Y.Z/` directory and the package root. Hit all of them in one shot:

```bash
for path in \
  "/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.js" \
  "/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.css" \
  "/gh/blokid/vaudit-website-components@vX.Y.Z/" \
  "/gh/blokid/vaudit-website-components@X.Y.Z/dist/vaudit.js" \
  "/gh/blokid/vaudit-website-components@X.Y.Z/dist/vaudit.css" \
  "/gh/blokid/vaudit-website-components@X.Y.Z/" \
  "/gh/blokid/vaudit-website-components"
do
  echo "PURGE $path"
  curl -s "https://purge.jsdelivr.net${path}"
  echo
done
```

Each call returns a small JSON receipt with `"status": "finished"` and a list of CDN providers (`CF` and `FY`). After this completes, wait ~5–10 s, then re-run the verification curls — they should flip to 200.

The two paths that turned out to be load-bearing in practice were the bare `@vX.Y.Z/` (directory listing) and the bare package root. The per-file purge alone leaves the metadata layer untouched.

### Step 4 — workaround if you can't wait

If you've already burned 30 min and you need users on the new bundle *now*, point Webflow at the **commit SHA** URL instead of the tag:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@<sha>/dist/vaudit.css">
<script src="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@<sha>/dist/vaudit.js" defer></script>
```

Same bytes, same release, also immutable on jsDelivr — you're just keying by SHA instead of tag. Once the tag URL recovers, you can swap it back for cleaner long-term references (or leave the SHA; both pin to the same immutable bytes).

### Why this happens at all (not "too many tags")

It is **not** caused by accumulated tag count, repo size, or rate limits on this repo. The trigger is a race: a request hit the tag URL while GitHub hadn't yet propagated the ref, jsDelivr cached the upstream failure, and the standard purge endpoint only evicts the CDN edge — not the metadata layer. Avoiding the verification curls until ~30 s after `git push` is the cheapest preventive measure.

## Iterating without bumping a tag

Tagged URLs are immutable end-to-end (jsDelivr edge AND browser disk cache), which is great for stability but inconvenient mid-iteration. Three patterns, in order of friction:

1. **Use the commit SHA after each push.** `git rev-parse HEAD` → paste into the Webflow Footer Code as `@<sha>/dist/vaudit.js`. Every push = new URL = no cache to defeat. Annoying because you must update Webflow per push.
2. **Use `@main` + purge after each push.** Webflow stays pointed at `@main`; you run `npm run purge` (or visit the purge URLs above) after pushing. Browser will still hold the previous file until its `Cache-Control` TTL expires — append `?v=<bump>` to the URL in Webflow if you need to bypass the browser too:
   ```html
   <script src="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@main/dist/vaudit.js?v=3" defer></script>
   ```
   Bump the `v` value whenever you want to force visitors to re-fetch.
3. **Use `@main` and just live with the ~12 h CDN cache.** Fine for low-stakes content updates that aren't time-critical.

For day-to-day dev, the lowest-friction setup is: open DevTools, tick **Network → Disable cache**, leave DevTools open while testing. That removes the browser layer entirely for your session, leaving only jsDelivr's edge cache to worry about.

## Pre-flight checklist

Before pushing a tag, verify the playground renders the change you expect:

```bash
npm run hub          # http://localhost:5173 — full playground
# or
npm run dev          # vite build --watch — drives examples/smoke-test.html
```

The playground reads from `src/`, but `dist/` is what jsDelivr serves. Run `npm run build` again immediately before tagging — easy to forget after iterating.

## What if I tagged the wrong thing?

Don't move tags. jsDelivr caches `@vX.Y.Z` forever assuming immutability — moving the tag is destructive across every cached edge worldwide and will leave some users on the old bytes for hours. Cut a new patch tag instead.

If a tag was pushed by mistake and nothing has loaded it yet (e.g. you noticed within seconds), you can delete it:

```bash
git push --delete origin vX.Y.Z
git tag -d vX.Y.Z
```

…then update `package.json` and tag fresh. But the safer default is always: **roll forward, never back**.

## Version semantics for this bundle

- **Patch (`0.4.0 → 0.4.1`)** — bug fixes, copy tweaks, internal refactors. No marker or prop changes.
- **Minor (`0.4.1 → 0.5.0`)** — new components, new optional props, new prop values. Existing markers in Webflow keep working unchanged.
- **Major (`0.x → 1.0`)** — anything that breaks an existing `data-rc` or `data-prop` consumer: removing a component, removing a prop, changing a prop's type, or changing the marker scanner contract. Webflow embeds will need to be edited.

If in doubt, bump minor. Webflow embeds are hand-edited — making them break silently is worse than over-versioning.
