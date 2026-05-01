# Pre-signup agent — work-in-progress status

Sibling to [PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md](PRESIGNUP-AGENT-WEBFLOW-DEPLOY.md)
(deployment playbook). This file is the "where are we right now" snapshot —
read first when picking the work back up.

## What the feature does

A single bordered chat-card on the Vaudit Webflow homepage. Visitors enter a
domain, the card narrates a two-phase audit (Estimate → Accurate) end-to-end
inside the same thread.

### Phase 1 — Estimate (~10s)

1. Empty composer (no chips, no template, no headline). Single placeholder.
2. Visitor submits a domain. The card immediately renders an agent ack
   bubble — *"On it. Scanning **{domain}** against our vendor benchmarks
   now — this gives you an **estimate in ~10 seconds**. You can lock in
   exact numbers right after."* — and a **live audit card** below it.
3. The live audit card shows three category rows (Ad ID / Vendor ID / Token
   ID), a `Scanning {domain} · 3 categories` pill, a thin top progress bar,
   and a `RECOVERABLE SO FAR $X` running total. Rows progress
   `pending → active ("checking Stripe…") → done (✓ + vendor list + $)` as
   the SSE stream from the backend `presignup_agent` lands.
4. When done, the pill flips to `Audited`, rows freeze, and a **2×2 results
   grid** appears (Ad ID + Token ID side-by-side on the top row, Vendor ID
   full-width below). Each card lists vendors with `$Xk spend / $Y wasted`
   (annual figures).
5. An **estimate CTA bubble** lands at the bottom: eyebrow `● ESTIMATED ·
   READY IN SECONDS`, big total, sub-copy with a `±5%` promise, two buttons
   (`Lock in exact numbers ~30s` / `Download report`), trust row (`Free`,
   `No login`, `No integrations`).

### Phase 2 — Accurate (~30s)

6. Visitor clicks **Lock in exact numbers**. An auto-injected user bubble
   echoes — *"Yes — let's run the accurate audit."* — and a **product
   picker widget** drops in: 2×2 chip grid (`Ad ID` / `Token ID` /
   `Vendor ID` / `All three` with a `MOST ACCURATE` ribbon, pre-selected).
   Single-click confirm; a second user bubble echoes the choice.
7. A **spend-range form widget** appears. Three stacked rows
   (`Ad spend / yr`, `AI / API spend / yr`, `Vendor spend / yr`), each with
   six chips (`< $X`, mid-bands, `$X+`, `Custom`). `Custom` opens an inline
   input that accepts `$2.5M`, `750k`, `1500000`, etc. Footer: `Back` (drops
   the form, re-opens the picker) and `Run accurate audit` (gated until all
   three rows have a selection).
8. On submit, a multi-line user bubble summarises the chosen ranges, the
   ranges form's primary button flips to `Calculating…`, and a second live
   audit card runs in `accurate` mode (rows go `Queued → Scanning… → ✓`)
   driven by **client-side recalc** of the phase-1 breakdown using the
   visitor's annual ranges. Title cycles to `Cross-checking vendor billing
   → Accurate audit complete`.
9. The accurate breakdown is POSTed to the backend (see API contract below)
   so the PDF route can re-render with the locked-in numbers.
10. A second results grid expands (`Accurate` chips instead of `COMPLETED`).
11. **Final CTA bubble**: eyebrow `● ✓ FULL ACCURATE AUDIT COMPLETE`, big
    total, three buttons:
    - `Go to dashboard` → `https://app.vaudit.com/v2/sign-up` (new tab)
    - `Audit again` → reset to empty composer, fresh session
    - `Download report` → existing PDF route, hits the persisted accurate
      breakdown
12. Throughout phase 2 the persistent **`Ask a follow-up…` composer** at the
    card bottom routes plain-text turns through the agent's existing
    `/run_sse` (`explain_methodology`, etc.).

## Architecture

### Files (all in `src/components/presignup-agent/`)

| Path | Role |
|---|---|
| `index.tsx` | Chat shell. Owns the message-list state, the phase-1 SSE wire-up, the phase-2 client-driven flow, the persistent follow-up composer, and the CTA actions. |
| `agent-api.ts` | Token / session / SSE / PDF download / accurate-breakdown POST + `audit_products` widget parser + vendor icon map. |
| `recalc.ts` | Client-side recalc engine. Mirrors backend `langfuse_config` waste-rate bands (`ad_id 5–12`, `token_id 20–40`, `vendor_id 5–15` whole percent). Pure functions, no React. |
| `types.ts` | Discriminated `ChatMessage` union, accurate-phase data shapes, agent-driven widget marker contract (forward-looking). |
| `icons.tsx` | Shared SVG glyphs (Ad / Vendor / Token / lock / send / etc.) — stroke-only, inherit `currentColor`. |
| `chat-message.tsx` | `AgentMessage` (avatar + label + bubble), `AgentSection` (agent text + widget child), `UserBubble` (orange pill, right-aligned). |
| `composer.tsx` | Auto-growing textarea + send button. Two visual modes via `is-empty`. |
| `live-audit-card.tsx` | Estimate / accurate live audit card with the running total, three category rows, and progress bar. |
| `results-grid.tsx` | 2×2 category card grid with per-vendor `$spend / $wasted` rows. |
| `estimate-cta.tsx` / `final-cta.tsx` | The two CTA bubbles. |
| `accurate-picker.tsx` / `accurate-ranges.tsx` | Phase-2 widgets. |
| `presignup-agent.css` | All styling. Light defaults, `html.dark .rc-pa-*` overrides per repo convention. Class prefix `rc-pa-` (BEM-ish) to avoid collisions with Webflow-authored classes. |

Bundle: `dist/vaudit.css` ~6 KB gzip · `dist/vaudit.js` ~81 KB gzip.

### Data flow

The chat thread is a `ChatMessage[]` discriminated union; every entry has an
`id` and a `kind`. Render dispatch lives in `renderMessage()` in
`index.tsx`. Imperative animation (live-audit row progression) patches
specific message fields by id via `update(id, patch)`.

Phase 1 hits the existing backend:

```
GET  ${baseUrl}/presignup/token
POST ${baseUrl}/apps/presignup_agent/users/anonymous/sessions/<sessionId>
POST ${baseUrl}/run_sse  →  SSE with `:::audit_products{...}\n:::` block
```

Phase 2 is **client-driven** in this cut — no agent round-trip for the
picker / ranges widgets. The visitor's range selections are scaled against
the phase-1 breakdown using the same waste-rate bands the backend uses, so
the numbers stay consistent with the PDF that gets generated downstream.

### Unit semantics

Backend returns **monthly USD** for `est_spend`, `waste`, and `waste_total`.
The chat UI multiplies by 12 at every display site so the visitor sees
**annual** figures (matching the design's `/yr` ranges and big annual
totals). `recalc.ts` keeps its internal model in monthly USD too — only
the display layer annualises.

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

Phase 1 hits the existing backend; phase 2 round-trips cleanly via
**`POST /presignup/accurate-breakdown/{session_id}`** (added in
onboarding-agent at `backend/core/routes/presignup_accurate_breakdown.py`).

Payload shape (sent by `postAccurateBreakdown` in `agent-api.ts`):

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
    "ad":     {"min": 5000000, "max": 25000000, "label": "$5M – $25M"},
    "ai":     {"min": 250000,  "max": 1000000,  "label": "$250K – $1M"},
    "vendor": {"min": 500000,  "max": 2000000,  "label": "$500K – $2M"}
  },
  "selection": "all"
}
```

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
(`AccuratePickerWidgetParams`, `AccurateRangesWidgetParams`) that the
agent could emit via existing `:::name{json}\n:::` blocks. The frontend
already has `extractWidgetBlock` in `agent-api.ts` for parsing them.
Wiring this would replace the client-driven phase-2 flow with the same
SSE-based pattern as `audit_products`.

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

## Open items (non-blocking)

- **Agent-driven phase-2 widgets.** Marker contract is in `types.ts`; the
  agent prompt + a new tool would replace the client-driven flow.
- **`Audit again` rate-limit interaction.** `PresignupGuardMiddleware`
  rate-limits per IP × domain. Repeat audits of the same domain from the
  same browser may hit the limit; behaviour acceptable for now.

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
