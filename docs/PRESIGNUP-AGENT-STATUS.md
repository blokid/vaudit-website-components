# Pre-signup agent — work-in-progress status

Handoff doc for the pre-signup audit agent feature on the **Home Copy** page of
the Vaudit Webflow site. Sibling to
[PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md](PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md), which
covers the deployment playbook. This file is the "where are we right now"
snapshot — read first when picking the work back up.

## What the feature does

A "sim" section (ported 1-to-1 from the `#sim` block in
[../hero.html](../hero.html)) that sits **above the existing hero** on Home
Copy. Visitors enter a domain, the client calls the pre-signup agent over SSE,
and a live scan panel narrates the audit as product cards reveal below.

### User flow

1. Page load → all 6 **known** preview cards render in the results grid
   (Ship / Kloud / Seat / Token / Ad / Pay). Each shows a unique SVG+CSS
   animated VIZ plus a long description.
2. User types a domain (or clicks a template chip — B2B SaaS / D2C / Fintech
   — to prefill) and submits via **Run Audit** (Enter submits,
   Shift+Enter inserts a newline).
3. The shimmer card "simulator" enters `scanning` state: chip row hides,
   textarea dims, scan panel appears inside the card.
4. Title ticker cycles: `Finding your vendors… → Sizing your business… →
   Running the audit… → Totaling your recoverable… → Audit complete`.
5. Scan list shows SSE-returned products first, then known-not-returned
   keys as `n/a`. Each returned row animates
   `pending → active ("checking Vendor…") → done (✓ + vendors + $ amount)`.
   Progress bar fills.
6. As each scan row lands `done`, the matching preview card in the grid
   below runs the `revealing` animation and swaps to completed state
   (head + animated `card-amount` + vendor rows). Unknown product ids get a
   new card appended with a generic spec.
7. After all returned products complete, a total banner lands below the
   grid: `TOTAL SIMULATED MONTHLY WASTE $X,XXX` plus a pill CTA
   `Connect Accounts to Recover Waste →`.
8. CTA click expands inline into `<input type=email>` + `Continue →` which
   opens `https://app.vaudit.com/v2/sign-up?email=…` in a new tab.

## Architecture

### Files

| Path | Role |
|---|---|
| [../webflow/presignup-agent.css](../webflow/presignup-agent.css) | All styles — sim card + shimmer animation, scan panel, 12-col results grid, 6 VIZ animations, preview/complete card states, total banner + email capture. Light default + `html.dark .class` overrides throughout. |
| [../webflow/presignup-agent.js](../webflow/presignup-agent.js) | Single IIFE — builds the entire UI into `#presignup-agent-root`, handles the three-step API flow, fixture replay, SSE parsing, scan sequencing, card reveal, email capture. |
| [../test/presignup-agent.test.html](../test/presignup-agent.test.html) | Local harness. Minimal shell (`<div id="presignup-agent-root"></div>`) plus a fetch interceptor that replays `../pre_signup_response.txt` as SSE when fixture mode is on. Includes a fixed-position toolbar (theme toggle, fixture on/off, domain prefill). |
| [../.claude/launch.json](../.claude/launch.json) | `presignup-harness` preview-server config — `python3 -m http.server 8765`. |
| [PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md](PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md) | Deployment playbook (paste steps, rollback). |

### Entry point

The script is a single IIFE that runs on `window.addEventListener('load', boot)`
(or synchronously if `document.readyState` is already `complete`). On boot it
queries `document.getElementById('presignup-agent-root')` and calls
`new Controller(root).init()`. The Controller:

- Runs `buildShell(root)` which wipes the root and constructs the entire DOM:
  `.sim-title`, `.sim-sub`, `.sim-input-row` (form with caret + textarea +
  template chips + Run button + scan panel), `#presignup-agent-status`,
  `#presignup-agent-results`.
- Calls `renderPreviewGrid(results)` which renders every entry of
  `KNOWN_KEYS` as a preview card into the results grid.
- Wires events: form submit, textarea Enter (Shift+Enter for newline),
  template chip click, template refresh shuffle, `beforeunload` cancel.

Exposes `window.__presignupAgent = controller` for debug inspection.

### Three-step API

```
GET  ${AGENT_BASE_URL}/presignup/token
  → { token: "..." }   // or { access_token: "..." }
POST ${AGENT_BASE_URL}/apps/presignup_agent/users/anonymous/sessions/<sessionId>
  → 200/201 or 409 (already-exists, accepted)
  // Headers: Content-Type: application/json, Authorization: Bearer <token>
POST ${AGENT_BASE_URL}/run_sse
  // Headers: same as above
  // Body: { appName, userId, sessionId, newMessage:{role,parts:[{text:domain}]}, streaming:true }
  → SSE stream with `:::audit_products{ … }:::` block inside the text parts
```

Config constants at the top of the JS:

```js
var AGENT_BASE_URL = "";     // "" for same-origin; absolute URL if cross-origin
var TOKEN_ENDPOINT = "/presignup/token";
var SESSION_ENDPOINT = "/apps/presignup_agent/users/anonymous/sessions/";
var RUN_SSE_ENDPOINT = "/run_sse";
var USE_FIXTURE = true;      // flip to false when backend is live
var APP_NAME = "presignup_agent";
var USER_ID = "anonymous";
var SESSION_KEY = "vaudit-presignup-session";   // localStorage key for UUID
var SIGNUP_URL = "https://app.vaudit.com/v2/sign-up";
```

The SSE reader/parser is a port of `runSSE` + `parseSSEEvent` from the
reference React project
(`/Users/phantomfaux/Projects/vaudit-refund-agent/frontend/src/api/client.ts`
and `lib/parseWidgets.ts`).

### Fixture mode

`USE_FIXTURE = true` short-circuits the three-step API. `streamAgent()`
returns a synthetic `ReadableStream` that enqueues a baked-in SSE event
(`sportforlife.co.th` fixture returning Ad ID / Pay ID / Seat ID,
$5,320 total). Chunked over ~1.5 s to exercise the same streaming code
path as the real backend. The local test harness also has its own fetch
interceptor for when `USE_FIXTURE` is `false` but you still want to dev
against the fixture.

### Data model — arbitrary product ids

The backend can return any number of product ids; only the **known** ones
have rich specs. The client handles both:

```js
PRODUCT_SPECS = {
  ship:  { key, id: "ship_id",  name, emoji: ICON_TRUCK,  desc, longDesc },
  kloud: { key, id: "kloud_id", name, emoji: ICON_CLOUD,  desc, longDesc },
  seat:  { … emoji: ICON_WINDOW … },
  token: { … emoji: ICON_CHIP   … },
  ad:    { … emoji: ICON_CLICK  … },
  pay:   { … emoji: ICON_CARD   … },
};

KNOWN_KEYS = ["ship", "kloud", "seat", "token", "ad", "pay"];

VIZ = { ship: "<div class='viz viz-ship'>…</div>", kloud: …, seat: …, token: …, ad: …, pay: … };

VENDOR_ICONS = {};   // empty default — populate with { "Stripe": "/icons/stripe.svg" } once hosted
```

Key resolution:

- `idToKey("ad_id") → "ad"` (strips `_id` suffix, lowercase).
- `specForKey(key)` returns the known spec, else a generic fallback:
  `{ key, id: key + "_id", name: prettify(key + "_id"), emoji: ICON_GENERIC,
  desc, longDesc }`.
- On page load, only keys in `KNOWN_KEYS` render preview cards. Unknown
  ids returned by SSE get a new card **appended** in completed state.
- Vendors with an entry in `VENDOR_ICONS` render a logo (`<img
  class="card-vendor-logo" …>`); otherwise text-only.

### Theme convention

Light default with `html.dark .class { … }` overrides. Matches the current
[body-dark-cascade.css](../webflow/body-dark-cascade.css) convention. The old
`DARK_MODE_TARGETS` array pattern is deprecated — see the "Non-obvious
architecture" section in [../CLAUDE.md](../CLAUDE.md) and
[../WEBFLOW-THEME-CONVENTION.md](../WEBFLOW-THEME-CONVENTION.md).

The shimmer border uses `@property --sim-shimmer-angle` + a `conic-gradient`
on `border-box` and is tuned per theme via CSS custom properties declared on
`.sim-input-row`:

```css
.sim-input-row {
  --sim-card-bg: #ffffff;
  --sim-card-shimmer-dim: 0.35;
  --sim-card-shimmer-arc-a: 255, 150, 80;
  --sim-card-shimmer-arc-b: 255, 120, 50;
  …
}
html.dark .sim-input-row {
  --sim-card-bg: #0f100e;
  --sim-card-shimmer-dim: 0.18;
  --sim-card-shimmer-arc-a: 255, 180, 120;
  --sim-card-shimmer-arc-b: 255, 215, 170;
}
```

## Repo docs updated this cycle

- [../CLAUDE.md](../CLAUDE.md) — "Non-obvious architecture" rewritten: single
  `html.dark` toggle, no combo classes, no `DARK_MODE_TARGETS` loop. Marks
  the old mechanism as deprecated.
- [../WEBFLOW-THEME-CONVENTION.md](../WEBFLOW-THEME-CONVENTION.md) — full
  rewrite. Drops the `DARK_MODE_TARGETS` list and the paste-it-in-both-files
  workflow. Documents the light-first + `html.dark .class` recipe.
- [PARTNER-PAGE-NOTES.md](PARTNER-PAGE-NOTES.md) — theme-script section
  updated to point at the new convention.
- [COLOR-SYSTEM.md](COLOR-SYSTEM.md) — theme-pattern section updated.
- User memory: `feedback_webflow_mcp_embeds.md` — "when wiring CSS/JS for a
  Webflow feature, drive everything via MCP; don't default to manual paste."

## Current state

### Local (test harness)

Working end-to-end. Verified:

- 6 preview cards render on page load in both themes with VIZ animations.
- Submit → scan panel appears, title ticker cycles through all 5 phases.
- Scan list animates SSE products `pending → active → done` with per-vendor
  `checking …` narration. Non-returned known keys stay pending with `n/a`.
- Progress bar fills at `((i+1)/N)*100%` per completed row.
- Cards reveal in place as their scan row completes. `revealing` keyframe
  + `card-amount` tick-up (`animateNumber`) + brief `.pulse` glow on settle.
- Total banner renders with correct `$5,320` sum. CTA expands inline to
  email capture form that submits to the signup URL.
- Template chips prefill the domain and highlight as active.
- Shimmer border animates visibly in both light and dark modes.

Serve with:

```bash
cd /Users/phantomfaux/Projects/vaudit-website-pages
python3 -m http.server 8765
# → http://localhost:8765/test/presignup-agent.test.html
```

Or via `.claude/launch.json`'s `presignup-harness` server.

### Webflow (site `67e174863b0c93ae0a0cffee`, Home Copy page `69e701d3ab01c0394d226247`)

**Not yet updated for the current code.** The page still has scaffold + CSS
+ JS from an earlier iteration that needs to be replaced. Specifically:

**Stale Designer scaffold inside `#presignup-agent-root`** (delete before
publishing):

- Section id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a3` class
  `presignup-agent-section` → **keep**.
- Container id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a2` (id attribute
  `presignup-agent-root`, class `presignup-agent-container`) → **keep**.
- Heading id `996519b8-5ca0-f4f9-d31b-fbd8b81ff192` → **delete**.
- Paragraph id `996519b8-5ca0-f4f9-d31b-fbd8b81ff194` → **delete**.
- FormWrapper id `996519b8-5ca0-f4f9-d31b-fbd8b81ff198` (+ all children —
  FormForm, FormTextInput, FormButton, FormSuccessMessage,
  FormErrorMessage) → **delete**.
- Status Block id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a0` → **delete**.
- Results Block id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a1` → **delete**.

The new JS does `clear(root)` on boot, so leaving the elements in place
causes a brief flash of old UI before JS mounts + clutters the Designer
canvas. Remove them via `mcp__webflow__element_tool.remove_element`.

**Stale page scripts applied to Home Copy** (clear before new paste):

- `presignupagentalignfix` v0.1.0 — early input alignment override
- `psagentform3a` v0.1.0 — form shimmer override (container half)
- `psagentform3b` v0.1.0 — form shimmer override (input + submit half)
- `presignupagentoverridesv2` v0.1.0 — card layout + banner pill overrides

All four are obsolete; the new stylesheet supersedes them. Clear via:

```js
mcp__webflow__data_scripts_tool.upsert_page_script({
  page_id: "69e701d3ab01c0394d226247",
  scripts: []
})
```

**Stale Custom Code pastes** (user replaces as a one-time paste):

- Project Settings → Custom Code → **Head Code** → old `<style>` block →
  replace with contents of `webflow/presignup-agent.css`.
- Home Copy → Page Settings → Custom Code → **Before `</body>`** → old
  `<script>` block → replace with contents of `webflow/presignup-agent.js`.

**Webflow-compiled styles that still exist** (harmless to leave; most are
unused by the new DOM): `presignup-agent-section`,
`presignup-agent-container`, `presignup-agent-headline`,
`presignup-agent-sub`, `presignup-agent-form`, `presignup-agent-input`,
`presignup-agent-submit`, `presignup-agent-status`, `presignup-agent-results`.
Only the `…-section` and `…-container` classes are still applied.

## Deploy plan

1. **MCP cleanup** (no user action):
   - Switch Designer to Home Copy
     (`mcp__webflow__de_page_tool.switch_page`).
   - Delete the 6 scaffold elements listed above
     (`mcp__webflow__element_tool.remove_element` per id).
   - Clear applied page scripts
     (`mcp__webflow__data_scripts_tool.upsert_page_script` with
     `scripts: []`).
2. **User paste** (one-time):
   - Head Code ← full contents of `webflow/presignup-agent.css`.
   - Home Copy Before `</body>` ← full contents of
     `webflow/presignup-agent.js`.
3. **Verify** — Designer Preview (⌘/Ctrl+⇧+P) or publish to the
   `.webflow.io` staging subdomain. Preview grid should render immediately;
   submit should trigger scan panel + reveal + banner.
4. **Future small tweaks** — push via MCP-registered inline scripts that
   runtime-inject a `<style>` block (see the earlier
   `presignupagentoverridesv2` pattern — inline site script with
   `location: "footer"`). Don't ask the user to paste again unless the
   script's internal structure changes meaningfully.

## Open items (non-blocking)

- User will provide final `desc` + `longDesc` copy per product id
  (`ship_id`, `kloud_id`, `seat_id`, `token_id`, `ad_id`, `pay_id`). Current
  values are placeholders lifted from the reference React project.
- Vendor icons will be hosted locally later. Populate `VENDOR_ICONS` map in
  JS — e.g. `{ "Stripe": "/icons/stripe.svg" }`. Missing entries render as
  text-only vendor rows.
- When the three backend endpoints go live:
  - Flip `USE_FIXTURE = false` in the Webflow JS paste.
  - Set `AGENT_BASE_URL = ""` (same-origin) or the full origin if
    cross-origin (requires CORS).
  - Confirm POST body shape matches (`appName`, `userId`, `sessionId`,
    `newMessage`, `streaming`).

## Useful MCP commands

```js
// Find site + page
mcp__webflow__data_sites_tool.list_sites()
// → "67e174863b0c93ae0a0cffee" (Vaudit / vaudit-a29acf)

mcp__webflow__data_pages_tool.get_page_metadata({
  page_id: "69e701d3ab01c0394d226247"
})
// → slug: "home-copy", draft: true

// Switch Designer active page
mcp__webflow__de_page_tool.switch_page({
  page_id: "69e701d3ab01c0394d226247"
})

// Clear all applied page scripts
mcp__webflow__data_scripts_tool.upsert_page_script({
  page_id: "69e701d3ab01c0394d226247",
  scripts: []
})

// Remove a Designer element
mcp__webflow__element_tool.remove_element({
  id: { component: "69e701d3ab01c0394d226247", element: "<element-id>" }
})

// Snapshot an element to verify rendering
mcp__webflow__element_snapshot_tool({
  action: { id: { component: "...", element: "..." } }
})

// Register a new inline override script (site-wide) then apply to a page
mcp__webflow__data_scripts_tool.add_inline_site_script({
  site_id: "67e174863b0c93ae0a0cffee",
  request: { displayName, version, location: "footer", sourceCode }
})
mcp__webflow__data_scripts_tool.upsert_page_script({
  page_id: "69e701d3ab01c0394d226247",
  scripts: [{ id: "<displayName>", location: "footer", version }]
})
```

Inline site scripts are capped at **2000 chars**. For large patches, split
into multiple scripts and apply them in order. The Webflow Designer MCP app
must be **running and foregrounded** at
https://vaudit-a29acf.design.webflow.com for any Designer tool to work.

## Reference links

- Target UI source: [../hero.html](../hero.html) — `<section class="sim" id="sim">` starts around line 1398; all sim/card CSS starts around line 240.
- React prototype: `/Users/phantomfaux/Projects/vaudit-refund-agent/frontend/src/components/presignup/` — logic ported verbatim (`runSSE`, `parseSSEEvent`, `parseWidgets`, `AuditProductGrid`, `auditProducts.ts`).
- Deploy playbook (paste steps, rollback): [PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md](PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md).
