# Pre-signup agent — work-in-progress status

Sibling to [PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md](PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md)
(deployment playbook). This file is the "where are we right now" snapshot —
read first when picking the work back up.

## What the feature does

A single bordered chat-card on the Vaudit Webflow homepage. The visitor enters
a domain; the card profiles the business, shows our **estimated per-vendor
monthly spends in an editable form**, and only computes recoverable amounts
**after** the visitor confirms/edits those spends — all in the same thread.
Phase-1 now runs in two turns with a human-in-the-loop pause at the
spend → recovery seam.

### Turn 1 — Estimate spends (~10s)

1. Empty composer (single placeholder). Visitor submits a domain → agent ack
   bubble + a **live audit card** (three category rows) driven by the profiler
   progress SSE (`tech` / `business` / `dns` / `apollo` / `spend`).
2. The backend chain runs tech → business → spend → logic-check and **STOPS
   before recovery**, emitting a `:::spend_form{...}:::` widget (per-vendor
   `est_spend`, logic-checked). No recoverable numbers are computed yet.
3. The card finalizes the live audit and renders the **prefilled spend form**
   (`accurate-spends.tsx`): vendors grouped by category (Ad ID / Token ID /
   Vendor ID), each with an input **prefilled with our estimate** (annual USD,
   `est_spend × 12`). Inputs accept `$2.5M`, `750k`, `1,500,000`, plain
   numbers. Button: `Run my recovery audit` (gated until every input parses to
   a positive figure).

### Turn 2 — Recover (~10s)

4. On submit, the form sends the edited per-vendor **monthly** spends to the
   agent as a `[SPEND_EDITS]{json}` `/run_sse` message (overrides shaped
   `{product_id: {vendor: {monthly_spend}}}`). A user bubble echoes the
   corrected per-category annual totals; a second live audit card animates the
   `recovery` progress step.
5. The coordinator calls `apply_spend_edits` (patches `formula_estimate` in
   session state), transfers to `recovery_estimation_agent`, and emits the
   `:::audit_products{...}:::` widget with recoverable amounts computed on the
   **edited** spends. `capture_audit_breakdown` persists it to
   `onboarding_sessions.audit_breakdown` (session flips to phase-2).
6. A results grid expands (`Accurate` chips) and a **Final CTA bubble** lands:
   big total, three buttons — `Go to dashboard`
   (`https://app.vaudit.com/v2/sign-up`), `Audit again` (reset + fresh
   session), `Download report` (PDF route → persisted breakdown, locks it).
7. Throughout, the persistent **`Ask a follow-up…` composer** routes
   plain-text turns through `/run_sse` (`explain_methodology`, a new domain to
   restart, etc.).

> **Retired (was the old phase-2):** the post-pitch correction path — the
> `accurate_picker` widget, the client-side `recalc.ts` recompute, and the
> `POST /presignup/accurate-breakdown` lock-in — is gone. Editing now happens
> once, up front, before recovery. The backend route still exists but the
> public flow no longer calls it.

## Architecture

### Files (all in `src/components/presignup-agent/`)

| Path | Role |
|---|---|
| `index.tsx` | Chat shell. Owns the message-list state, the two-turn phase-1 wire-up (turn 1 spend form, turn 2 recovery), the persistent follow-up composer, and the CTA actions. |
| `agent-api.ts` | Token / session / SSE / PDF download + `audit_products` / `spend_form` widget parsers + vendor icon map. |
| `types.ts` | Discriminated `ChatMessage` union, accurate-phase data shapes (incl. `ExactMonthlyByVendor`), widget marker contract. |
| `icons.tsx` | Shared SVG glyphs (Ad / Vendor / Token / lock / send / etc.) — stroke-only, inherit `currentColor`. |
| `chat-message.tsx` | `AgentMessage` (avatar + label + bubble), `AgentSection` (agent text + widget child), `UserBubble` (orange pill, right-aligned). |
| `composer.tsx` | Auto-growing textarea + send button. Two visual modes via `is-empty`. |
| `live-audit-card.tsx` | Estimate / accurate live audit card with the running total, three category rows, and progress bar. |
| `results-grid.tsx` | 2×2 category card grid with per-vendor `$spend / $wasted` rows. |
| `final-cta.tsx` | The post-recovery CTA bubble. |
| `accurate-spends.tsx` | The prefilled per-vendor spend form (turn-1 `spend_form` → edit → submit drives recovery). |
| `presignup-agent.css` | All styling. Light defaults, `html.dark .rc-pa-*` overrides per repo convention. Class prefix `rc-pa-` (BEM-ish) to avoid collisions with Webflow-authored classes. |

Bundle: `dist/vaudit.css` ~6 KB gzip · `dist/vaudit.js` ~81 KB gzip.

### Data flow

The chat thread is a `ChatMessage[]` discriminated union; every entry has an
`id` and a `kind`. Render dispatch lives in `renderMessage()` in
`index.tsx`. Imperative animation (live-audit row progression) patches
specific message fields by id via `update(id, patch)`.

Both phase-1 turns hit the agent over `/run_sse`:

```
GET  ${baseUrl}/presignup/token
POST ${baseUrl}/apps/presignup_agent/users/anonymous/sessions/<sessionId>
POST ${baseUrl}/run_sse  (domain)              →  SSE with `:::spend_form{...}\n:::`
POST ${baseUrl}/run_sse  (`[SPEND_EDITS]{...}`) →  SSE with `:::audit_products{...}\n:::`
```

Recovery is **backend math** now: turn 2 sends the visitor's edited per-vendor
monthly spends as a `[SPEND_EDITS]` overrides payload; the coordinator applies
them (`apply_spend_edits`) and runs `recovery_estimation_agent`, so the
recoverable numbers — and the PDF generated from the persisted breakdown —
reflect the visitor's actual spend. No client-side recompute.

### Unit semantics

Backend returns **monthly USD** for `est_spend`, `waste`, and `waste_total`.
The chat UI multiplies by 12 at every display site so the visitor sees
**annual** figures (the spend form prefills and edits `/yr` values, matching
the big annual totals). The form divides its annual inputs back to **monthly**
before sending the `[SPEND_EDITS]` overrides (the backend schema is monthly),
and only the display layer annualises.

### Agent base URL

`agent-api.getAgentBaseUrl()` auto-detects:

- `vaudit.com` → `https://onboarding-agent.vaudit.com` (prod).
- `localhost` / `127.0.0.1` / `0.0.0.0` → `http://localhost:3000` so the
  playground (`npm run hub` at `:5180`) talks to a backend running
  locally on `:3000`. Make sure CORS on the local backend allows
  `http://localhost:5180`.
- Anywhere else (Webflow `.webflow.io`, design subdomains, etc.) →
  `https://onboarding-agent.staging.vaudit.com` (staging).

Override via the `agentBaseUrl` prop / `data-prop`. The playground exposes
`force local` and `force staging` variants.

### Theme convention

Light defaults written on the base classes; dark variants written as
`html.dark .rc-pa-*` overrides in the same `.css` file. Matches
[`WEBFLOW-THEME-CONVENTION.md`](WEBFLOW-THEME-CONVENTION.md). The
`html.dark` toggle is set synchronously by the existing HEAD bootstrap on
the Webflow side (see [`webflow/theme-custom-code.html.md`](webflow/theme-custom-code.html.md)) — no JS-side theme handling here.

Component-local CSS custom properties (declared on `.rc-pa-section`):

```css
.rc-pa-section {
  --rc-pa-bg: #ffffff;          /* page bg */
  --rc-pa-fg: #1a1a18;          /* page fg */
  --rc-pa-card-bg: #ffffff;
  --rc-pa-elevated-bg: #faf9f7; /* live-audit / cta panels */
  --rc-pa-orange: #fe602c;      /* shared brand orange */
  --rc-pa-orange-glow: rgba(254, 96, 44, 0.45);
  /* … */
}
html.dark .rc-pa-section {
  --rc-pa-bg: #0f100e;
  --rc-pa-fg: #ffffff;
  --rc-pa-card-bg: #131311;
  --rc-pa-elevated-bg: #181815;
  /* … */
}
```

The card chrome's orange edge-glow + bottom warm streak are pure CSS
(`::before` / `::after` on `.rc-pa-card`). No `@property` / shimmer
animation in this revision (the legacy `--sim-shimmer-angle` conic gradient
is gone with the old hero card).

## Backend coupling

Both phase-1 turns round-trip via `/run_sse` (see Data flow above). Spend edits
go to the agent as a `[SPEND_EDITS]` message → `apply_spend_edits` → recovery.

> **Retired:** the route below (`POST /presignup/accurate-breakdown`) was the
> old client-driven phase-2 lock-in. The public flow no longer calls it; the
> route still exists in onboarding-agent but is unused here. Kept for
> reference only.

Payload shape (legacy — was sent by `postAccurateBreakdown` in `agent-api.ts`,
which is now an unused export):

```json
{
  "products": [
    {
      "id": "ad_id",
      "waste_total": 12345,
      "vendors": [{"name": "Google Ads", "est_spend": 50000, "waste": 4250}]
    }
  ],
  "total": 67890,
  "ranges": {
    "ad":     {"min": 600000, "max": 600000, "label": "$600,000/yr"},
    "ai":     {"min": 240000, "max": 240000, "label": "$240,000/yr"},
    "vendor": {"min": 900000, "max": 900000, "label": "$900,000/yr"}
  },
  "selection": "all"
}
```

The route persists `products` per-vendor directly; `ranges` is metadata
only (stored under `accurate.ranges` for "estimated → accurate" PDF
context). Since the visitor now edits exact per-vendor figures rather than
picking a band, `buildRangeMetadata` in `index.tsx` collapses each opted-in
category to a single point — `min = max =` the corrected annual category
total — so the persisted metadata still reflects what was locked in.

Auth: capability check via `presignup_token.is_session_trusted` (the
session was already trusted during the run flow). No fresh single-use
token needed for the lock-in POST. The endpoint:

- 401s if the session was never trusted (or trust window expired).
- 404s if the session row doesn't exist.
- 409s if the breakdown is already locked (idempotency — phase-2 only
  fires once; subsequent locks would silently rewrite the visitor's
  numbers).
- Merges `products`, `totals`, and an `accurate` metadata block onto the
  existing breakdown row, then flips `locked = true` so the PDF route
  renders the locked-in figures next time it's hit.

### Future: agent-driven phase-2 widgets

`types.ts` defines a widget marker contract
(`AccuratePickerWidgetParams`, `AccurateSpendsWidgetParams`) that the
agent could emit via existing `:::name{json}\n:::` blocks. The frontend
already has `extractWidgetBlock` in `agent-api.ts` for parsing them.
Wiring this would replace the client-driven phase-2 flow with the same
SSE-based pattern as `audit_products`.

### Calculator Build Guide integration — v0.26.30

Two backend Build Guide milestones are now wired up in this component:

1. **Stage 5.5 Pass 2 — async post-display reasoning.** After the
   `audit_products` widget ships, the backend fires 6 parallel Haiku
   calls (one per pot: `ad_id`, `kloud_id`, `token_id`, `seat_id`,
   `ship_id`, `payment_id`) and streams 30-50 word paragraphs onto the
   existing `/presignup/progress/{session}` Redis SSE channel via a
   new event shape:
   ```json
   {"step": "reasoning", "pot": "ad_id", "state": "started"}
   {"step": "reasoning", "pot": "ad_id", "state": "done",
    "text": "We estimated paid advertising at $15K/mo based on..."}
   ```
   `subscribePresignupProgress` decodes these, `applyProgressEvent`
   routes them into the most-recent `results_grid` message's
   `reasoning` map, and `results-grid.tsx`'s new `ReasoningContainer`
   renders a 3-dot shimmer (`state="started"`) then types the
   paragraph in (`state="done"` / `"failed"` — the failed state still
   carries a templated fallback paragraph). The vendor_id card shows
   the `kloud_id` paragraph as primary and tucks the other three sub-
   pots under a "see breakdown" toggle.

2. **Stage 1 — holding-company short-circuit.** When the visitor
   submits a holding / portfolio domain (`.holdings`, `*group.com`,
   `*holdings.com`, `*corp.com`, `*ventures.com`), the backend skips
   profiling and emits a `:::holding_redirect{...}:::` widget instead
   of `audit_products`. `extractHoldingRedirect` parses the payload
   (`domain` / `pattern` / `suggested_brands`) and a new
   `HoldingRedirect` widget renders a brand-picker card: free-text
   subsidiary input + suggestion chips when Apollo's
   `parent_organization` data populates them. Visitor's selection
   resets the session and re-enters the flow with the new domain.

`audit_products` products may now carry an optional `reasoning_id`
field that maps the widget card to the SSE `pot` key — frontends
default to the product id when missing. Schema-extension only; the
widget shape stays backward-compatible with pre-Build-Guide backends.

## Current state

### Local

`npm run hub` opens the playground at <http://localhost:5180/>; pick
`presignup-agent` in the sidebar. The `default` variant auto-detects prod
vs. staging; `force staging` pins the staging onboarding-agent. Light/dark
toggle in the toolbar drives the `html.dark` class.

`npm run build` produces `dist/vaudit.{js,css}`. `dist/` is committed —
jsDelivr serves directly from the tagged ref.

### Webflow (site `67e174863b0c93ae0a0cffee`, Home Copy page `69e701d3ab01c0394d226247`)

The new build supersedes the previous **paste-into-custom-code** workflow.
Production now loads a single jsDelivr `<script>` + `<link>` and mounts the
React component into a `data-rc="presignup-agent"` marker.

**Stale state to clean up before rolling the new bundle**, all via
the Webflow Designer MCP (only one repo wires that — see
[Tooling notes](../CLAUDE.md#tooling-notes)):

1. **Stale page-scoped scripts** applied to Home Copy. Originally pasted as
   one-off CSS overrides; the new bundle's stylesheet supersedes them all:
   - `presignupagentalignfix` v0.1.0 — early input alignment override.
   - `psagentform3a` v0.1.0 — form shimmer override (container half).
   - `psagentform3b` v0.1.0 — form shimmer override (input + submit half).
   - `presignupagentoverridesv2` v0.1.0 — card layout + banner pill overrides.

   Clear via:
   ```js
   mcp__webflow__data_scripts_tool.upsert_page_script({
     page_id: "69e701d3ab01c0394d226247",
     scripts: []
   })
   ```

2. **Stale Designer scaffold inside `#presignup-agent-root`** (still in the
   Designer tree from the original hand-authored form). The mounted React
   component takes over the marker root, but leaving these in place causes
   a brief flash of old DOM before mount + clutters the Designer canvas.
   Delete via `mcp__webflow__element_tool.remove_element`:

   - **Keep** — Section `presignup-agent-section`
     id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a3`.
   - **Keep** — Container `presignup-agent-container`
     id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a2`
     (id attribute `presignup-agent-root`).
   - **Delete** — Heading id `996519b8-5ca0-f4f9-d31b-fbd8b81ff192`.
   - **Delete** — Paragraph id `996519b8-5ca0-f4f9-d31b-fbd8b81ff194`.
   - **Delete** — FormWrapper id `996519b8-5ca0-f4f9-d31b-fbd8b81ff198`
     (and all children — FormForm, FormTextInput, FormButton,
     FormSuccessMessage, FormErrorMessage).
   - **Delete** — Status Block id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a0`.
   - **Delete** — Results Block id `996519b8-5ca0-f4f9-d31b-fbd8b81ff1a1`.

3. **Stale Custom Code pastes** from the previous (no-build) iteration:
   - Project Settings → Custom Code → **Head Code** → old presignup-agent
     `<style>` block → **delete** (all styling now ships in `dist/vaudit.css`).
   - Home Copy → Page Settings → Custom Code → **Before `</body>`** → old
     presignup-agent `<script>` block → **delete** (all behaviour now ships
     in `dist/vaudit.js`).

4. **Webflow-compiled styles** that may still exist in the site stylesheet
   (harmless to leave — the new DOM doesn't touch most of them):
   `presignup-agent-section`, `presignup-agent-container`,
   `presignup-agent-headline`, `presignup-agent-sub`, `presignup-agent-form`,
   `presignup-agent-input`, `presignup-agent-submit`, `presignup-agent-status`,
   `presignup-agent-results`. Only `…-section` and `…-container` are still
   applied (as the marker wrapper).

#### Mount marker

The mounted node is the existing `presignup-agent-root` div. In Webflow's
Designer, set `data-rc="presignup-agent"` on it (and remove
`id="presignup-agent-root"` if present — the new bundle doesn't read it).
Optionally add `data-prop='{"agentBaseUrl": "…"}'` to override the
auto-detect (e.g. for staging previews).

#### Footer custom code

The Vaudit theme already loads the bundle once per page. Update the script /
stylesheet `@vX.Y.Z` ref to the new release tag from this repo:

```html
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.css">
<script src="https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@vX.Y.Z/dist/vaudit.js"
        defer></script>
```

For dev iteration without bumping the tag, point at `@<commit-sha>` (immutable,
no jsDelivr cache) or hit
`https://purge.jsdelivr.net/gh/blokid/vaudit-website-components@<ref>/<path>`
to flush a specific URL.

## Deploy plan

1. **MCP cleanup** (no user action — driven from the other repo's MCP):
   - Switch Designer to Home Copy
     (`mcp__webflow__de_page_tool.switch_page`).
   - Delete the 6 scaffold elements listed above
     (`mcp__webflow__element_tool.remove_element` per id).
   - Clear applied page scripts
     (`mcp__webflow__data_scripts_tool.upsert_page_script` with `scripts: []`).
   - Confirm `data-rc="presignup-agent"` is present on the
     `presignup-agent-root` div (the React mount point).
2. **One-time Custom Code deletion** (user action):
   - Project Settings → Custom Code → **Head Code** → remove the old
     presignup-agent `<style>` block.
   - Home Copy → Page Settings → Custom Code → **Before `</body>`** →
     remove the old presignup-agent `<script>` block.
3. **Cut a new release** (this repo):
   - Bump `package.json` (semver). `npm run build`. Commit `dist/` + the
     version bump. `git tag vX.Y.Z && git push --follow-tags`.
4. **Update Webflow Footer custom code** to the new tag URL (snippet above).
5. **Verify** — Designer Preview (⌘/Ctrl+⇧+P) or publish to the staging
   `.webflow.io` subdomain. Empty composer should render → submit a domain
   → live audit card animates → CTA appears. Toggle theme to confirm
   light + dark.

For small follow-up tweaks that don't change the bundle's API, skip step 4
by re-tagging or by pointing Webflow at `@<commit-sha>` while iterating.

## Useful MCP commands

```js
// Find site + page
mcp__webflow__data_sites_tool.list_sites()
// → "67e174863b0c93ae0a0cffee" (Vaudit / vaudit-a29acf)

mcp__webflow__data_pages_tool.get_page_metadata({
  page_id: "69e701d3ab01c0394d226247"
})
// → slug: "home-copy"

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
```

The Webflow Designer MCP app must be **running and foregrounded** at
<https://vaudit-a29acf.design.webflow.com> for any Designer tool to work.
The MCP server lives in the **other** repo's `.claude/` config — this repo
doesn't need it. If a task involves changing what's live in Webflow Custom
Code (e.g. swapping the script tag URL), do that work from
`vaudit-website-pages` where the Webflow MCP is wired up.

## Explicit "Start over" (2026-06-01)

A card-corner **Start over** button (`.rc-pa-startover`, shown whenever an
audit is on screen) gives the visitor a clean restart on the **same** session
id. `handleStartOver` calls `freshStartSession()` → `POST
/presignup/fresh-start/{session_id}`; the backend tears down the conversation
+ staging row (**including a PDF-`locked` breakdown — the escape hatch from a
locked session**) and recreates the ADK session under the same id. The route
is trust-gated, so on `401` (trust window lapsed) `handleStartOver` falls back
to `resetSession()` (client-side id rotation). The post-results "Audit again"
CTA is unchanged (hard break via `resetSession()`). See the "Presignup agent —
backend session reset" section of the repo `CLAUDE.md` for the full contract.

## Open items (non-blocking)

- **Agent-driven phase-2 widgets.** Marker contract is in `types.ts`; the
  agent prompt + a new tool would replace the client-driven flow.
- **`Audit again` rate-limit interaction.** `PresignupGuardMiddleware`
  rate-limits per IP × domain. Repeat audits of the same domain from the
  same browser may hit the limit; behaviour acceptable for now. Note
  fresh-start itself is **not** rate-limited (trust-gated + lock-serialized),
  but the subsequent `/run_sse` still hits the per-IP×domain run limit.

## Reference

- Mock-up source: design hand-off (see project Slack — phase-1 + phase-2
  flows, all dark-mode shots).
- Backend tools / persistence: `backend/presignup_agent/tools.py` and
  `backend/presignup_agent/audit_breakdown.py` in the onboarding-agent repo.
- PDF route: `backend/core/routes/presignup_audit_report.py`.
- Waste-rate config: `backend/presignup_agent/langfuse_config.py`. Mirror in
  `recalc.ts:WASTE_RATES` whenever the Langfuse Config bands change.
- Theme convention: [`WEBFLOW-THEME-CONVENTION.md`](WEBFLOW-THEME-CONVENTION.md).
- Color tokens: [`COLOR-SYSTEM.md`](COLOR-SYSTEM.md).
- Deploy playbook (paste steps, rollback): [`PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md`](PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md).
