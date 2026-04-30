#!/usr/bin/env node
// Flush jsDelivr's edge cache for the bundle on a given ref.
//
// Usage:
//   node scripts/purge.mjs              # purges @main (default)
//   node scripts/purge.mjs main         # same
//   node scripts/purge.mjs <commit-sha> # rare — SHAs are already immutable
//   node scripts/purge.mjs vX.Y.Z       # pointless — tags are immutable
//
// Tagged URLs and commit SHAs are immutable on jsDelivr, so purging them is
// a no-op. The only ref that meaningfully needs purging is `@main`, which
// caches for ~12 h. We accept other refs anyway so you can paste any URL
// you've got handy without it failing.

const ref = process.argv[2] || "main";
const repo = "blokid/vaudit-website-components";
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
