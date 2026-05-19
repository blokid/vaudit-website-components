#!/usr/bin/env node
// Flush jsDelivr's edge cache for the bundle on a given ref.
//
// Usage:
//   node scripts/purge.mjs              # purges @main (default)
//   node scripts/purge.mjs main         # same
//   node scripts/purge.mjs <commit-sha> # rare — SHAs are already immutable
//   node scripts/purge.mjs vX.Y.Z       # tag purge (see notes below)
//   node scripts/purge.mjs vX.Y.Z stuck # tag is 404-cached — full metadata-layer purge
//
// Single-tag iteration:
//   Tagged URLs and commit SHAs are immutable on jsDelivr, so purging them
//   is normally a no-op. The only ref that meaningfully needs purging in
//   day-to-day work is `@main`, which caches for ~12 h.
//
// "stuck" mode:
//   Use when a freshly-pushed tag is returning HTTP 404 with body
//   `Failed to fetch blokid/vaudit-website-components@X.Y.Z from GitHub.`
//   This happens when something (a verification curl, a browser tab,
//   `npm run purge` itself) hit the tag URL before GitHub had propagated
//   the ref — jsDelivr cached the upstream miss at its metadata layer,
//   which the per-file GET-form purge doesn't reach. The fix is a batch
//   POST against `https://purge.jsdelivr.net/` that includes the bare
//   `@vX.Y.Z/` directory and the package root — those are the load-bearing
//   metadata paths. See `docs/RELEASING.md` step 3 for the full playbook.
//   Avoid repeated GET-form purges on the same file: jsDelivr rate-limits
//   per-path (`throttlingReset` can be ~45 min), and you only get one
//   useful purge per stuck path before you're locked out.

const ref = process.argv[2] || "main";
const mode = process.argv[3] || (process.argv.includes("stuck") ? "stuck" : "normal");
const repo = "blokid/vaudit-website-components";

if (mode === "stuck") {
  // Tag is 404-cached. Strip a leading "v" so we can purge both forms —
  // jsDelivr normalises `v0.26.20` to `0.26.20` internally and keys the
  // negative cache on the bare numeric form.
  const v = ref.replace(/^v/, "");
  const paths = [
    `/gh/${repo}@v${v}/dist/vaudit.js`,
    `/gh/${repo}@v${v}/dist/vaudit.css`,
    `/gh/${repo}@v${v}/`,
    `/gh/${repo}@${v}/dist/vaudit.js`,
    `/gh/${repo}@${v}/dist/vaudit.css`,
    `/gh/${repo}@${v}/`,
    `/gh/${repo}/`,
    `/gh/${repo}`,
  ];
  console.log(`Batch POST purge for stuck tag v${v} (${paths.length} paths)…`);
  const submit = await fetch("https://purge.jsdelivr.net/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: paths }),
  });
  const { id, status: initial } = await submit.json();
  if (!id) {
    console.error("Purge job submission failed:", initial);
    process.exit(1);
  }
  console.log(`Submitted ${id} (${initial}). Polling…`);
  let result;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const poll = await fetch(`https://purge.jsdelivr.net/status/${id}`);
    result = await poll.json();
    if (result.status === "finished") break;
  }
  if (result?.status !== "finished") {
    console.error(`Purge job ${id} did not finish in ~60s; last status:`, result?.status);
    process.exit(1);
  }
  let allOk = true;
  for (const [path, info] of Object.entries(result.paths ?? {})) {
    if (info.throttled) {
      const mins = Math.round((info.throttlingReset ?? 0) / 60);
      console.log(`⚠ throttled (retry in ~${mins}m)  ${path}`);
      // Throttling on a few file paths is OK as long as the metadata-layer
      // paths (directory + package root) went through — those are what
      // actually clear the stuck-tag negative cache.
    } else {
      console.log(`✔ purged                       ${path}`);
    }
  }
  console.log("\nWait ~10s, then verify with:");
  console.log(`  curl -sI https://cdn.jsdelivr.net/gh/${repo}@v${v}/dist/vaudit.js | head -1`);
  process.exit(allOk ? 0 : 1);
}

// Default mode: single-path GET purge of the bundle files only.
const paths = ["dist/vaudit.js", "dist/vaudit.css"];

async function purge(path) {
  const url = `https://purge.jsdelivr.net/gh/${repo}@${ref}/${path}`;
  const res = await fetch(url);
  const body = await res.text();
  return { url, status: res.status, body: body.slice(0, 200) };
}

const results = await Promise.all(paths.map(purge));
let allOk = true;
for (const r of results) {
  const ok = r.status >= 200 && r.status < 300;
  allOk = allOk && ok;
  console.log(`${ok ? "✔" : "✘"} ${r.status}  ${r.url}`);
  if (!ok) console.log(`   ${r.body}`);
}
process.exit(allOk ? 0 : 1);
