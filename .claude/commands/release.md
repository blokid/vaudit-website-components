---
description: Cut a new patch release of vaudit-components — tag, then publish a GitHub Release with changelog + downloadable dist for the backend dev.
---

# Cut a release

Run the full release flow for vaudit-components. Source of truth: `docs/RELEASING.md` and `CLAUDE.md`. The arguments after `/release` (`$ARGUMENTS`) are optional notes describing what's shipping — use them as the commit body if present, otherwise infer from the staged/unstaged diff.

The bundle is **no longer served from jsDelivr**. This repo produces a versioned, committed `dist/` and publishes it as a **GitHub Release** with a changelog and a downloadable artifact. The backend dev opens the release URL, downloads the artifact, and drops it into their repo's `static/components/`, which serves it at `https://api.vaudit.com/static/components/`.

## Pre-flight (silent if clean)

1. `git status` — confirm the only uncommitted changes are the ones we're shipping. If unrelated `M` files are present, ask the user before bundling them in.
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

The commit body should explain *why* the change ships, not what files moved. Keep it 1–3 short paragraphs. Include the standard `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` footer.

## Publish the GitHub Release

After the tag is on origin, cut a GitHub Release so the backend dev has one URL to download from. The artifact is a zip laid out exactly like the backend's `static/components/` (bundle + `assets/` sibling), plus the raw files for single-file grabs.

```bash
# Changelog: commit subjects since the previous tag, excluding release/build noise
PREV=$(git describe --tags --abbrev=0 vX.Y.Z^ 2>/dev/null)
CHANGELOG=$(git log --pretty='- %s' --invert-grep --grep='^release:' --grep='^build:' \
  ${PREV:+$PREV..}vX.Y.Z)
# Squashed release (all work landed in the single "release:" commit) → the
# filter leaves nothing, so fall back to that commit's body.
[ -z "$CHANGELOG" ] && CHANGELOG=$(git log -1 --pretty='%b' vX.Y.Z \
  | sed '/^Co-Authored-By:/d')

# Stage the artifact in the exact shape the backend needs under static/components/
STAGE=$(mktemp -d)
cp dist/vaudit.js dist/vaudit.css "$STAGE/"
cp -R assets "$STAGE/assets"
( cd "$STAGE" && zip -qr "vaudit-components-vX.Y.Z.zip" vaudit.js vaudit.css assets )

# Build the release notes (heredoc → file avoids quoting hell with changelog text)
NOTES=$(mktemp)
cat > "$NOTES" <<EOF
Static bundle for vX.Y.Z.

**Deploy:** unzip \`vaudit-components-vX.Y.Z.zip\` into the backend repo's \`static/components/\` (it contains \`vaudit.js\`, \`vaudit.css\`, and \`assets/\`), then deploy the backend. Serves at https://api.vaudit.com/static/components/vaudit.{js,css}

## Changes
$CHANGELOG
EOF

# Create the release with the changelog and three assets.
# gh prints the release URL to stdout on success — capture it to hand back.
RELEASE_URL=$(gh release create vX.Y.Z \
  "$STAGE/vaudit-components-vX.Y.Z.zip" dist/vaudit.js dist/vaudit.css \
  --title "vX.Y.Z" --notes-file "$NOTES")
echo "$RELEASE_URL"
```

`$RELEASE_URL` is the exact URL to hand the backend dev. Cache invalidation is the backend's job (its `Cache-Control` headers) — this repo does not purge anything.

## Report

End-of-turn output, in this order, nothing else:

1. **Tag**: `vX.Y.Z`
2. **Release URL** for the backend dev — the actual `$RELEASE_URL` printed by `gh release create` (a `.../releases/tag/vX.Y.Z` link). Print it as a bare, clickable URL so it's easy to copy.
3. A one-line note if anything anomalous happened during build/release.

## Hard rules — never break these

- **Never push** until `git status` is what you expect AND the tag is annotated (`git tag -a`).
- **Never move or delete an already-published tag.** Roll forward with a new patch instead.
- **Never use `npm run release`** — it double-commits and produces noisier history than the manual flow above.
- The Webflow Footer URLs are **unversioned and stable** (`https://api.vaudit.com/static/components/vaudit.{js,css}`). A release does not change them — it changes the bytes the backend serves. No Webflow edit needed per release.
