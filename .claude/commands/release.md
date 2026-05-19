---
description: Cut a new patch release of vaudit-components and verify it on jsDelivr.
---

# Cut a release

Run the full release flow for vaudit-components. Source of truth: `docs/RELEASING.md` and `CLAUDE.md`. The arguments after `/release` (`$ARGUMENTS`) are optional notes describing what's shipping — use them as the commit body if present, otherwise infer from the staged/unstaged diff.

## Pre-flight (silent if clean)

1. `git status` — confirm the only uncommitted changes are the ones we're shipping. If unrelated `M` files are present, ask the user before bundling them in. (Exception: `scripts/purge.mjs` and other tooling tweaks already in the working tree are fine to ship with the feature commit.)
2. Read `package.json` to know the current version.

## Release sequence

Follow the manual flow from `docs/RELEASING.md` (NOT `npm run release` — that double-commits).

```bash
# Bump patch (or minor/major if the diff justifies it — default patch)
npm version patch --no-git-tag-version

# Build — this also runs `tsc --noEmit` first
npm run build

# Single commit: source + dist + version bump together
git add -A
git commit -m "release: vX.Y.Z" -m "<body describing the change>"

# Annotated tag (required for --follow-tags to push it)
git tag -a vX.Y.Z -m "release: vX.Y.Z"

# Push branch + tag together
git push --follow-tags
```

The commit body should explain *why* the change ships, not what files moved. Keep it 1–3 short paragraphs. Include the standard `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer.

## Verification — MANDATORY ORDER, do not skip

The v0.26.20 incident memo (`memory/feedback_jsdelivr_purge.md`) is authoritative — read it. Briefly:

1. **Confirm the tag is on origin** before any CDN call:
   ```bash
   git ls-remote --tags origin vX.Y.Z
   ```
   If empty, the tag is lightweight — push explicitly: `git push origin vX.Y.Z`.

2. **Wait ~35s** before the first jsDelivr curl. Use a background `sleep 35 && curl ...` pattern (or `run_in_background: true`) so you don't poll early and accidentally negative-cache the tag at jsDelivr's origin-fetch layer. Do NOT chain short sleeps to dodge the wait-block.

3. **One verification curl** after the wait:
   ```bash
   curl -sI "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.js"  | head -1
   curl -sI "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.css" | head -1
   ```
   Both should return `HTTP/2 200`.

4. **If either is 404** → jump straight to the batch POST purge, do NOT repeat single-path GETs (they rate-limit per path for ~45 min):
   ```bash
   node scripts/purge.mjs vX.Y.Z stuck
   ```
   Then wait another ~60s (background, no early polls) and re-verify the tag URL once. If still 404, sanity-check by SHA:
   ```bash
   SHA=$(git rev-parse vX.Y.Z^{commit})
   curl -sI "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@${SHA}/dist/vaudit.js" | head -1
   ```
   If the SHA URL is 200 but the tag URL is still 404, the bytes are live and only the tag alias is stuck — surface the SHA URL as a working stopgap and try one more `purge.mjs ... stuck` round.

## Report

End-of-turn output, in this order, nothing else:

1. **Tag**: `vX.Y.Z`
2. **Webflow Footer URLs** (both CSS and JS, with the new tag).
3. A one-line note if anything anomalous happened during verify (e.g. "had to run stuck-tag purge once").

## Hard rules — never break these

- **Never push** until `git status` is what you expect AND the tag is annotated (`git tag -a`).
- **Never fetch the @vX.Y.Z CDN URL before `git push` AND `git ls-remote` confirms AND ~35s has elapsed.** This is the only thing that causes the 30-min 404 incidents.
- **Never repeat single-path purge GETs.** Always use `node scripts/purge.mjs <tag> stuck` for batch.
- **Never move or delete an already-published tag.** Roll forward with a new patch instead.
- **Never use `npm run release`** — it double-commits and produces noisier history than the manual flow above.
