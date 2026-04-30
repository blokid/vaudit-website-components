# Pre-signup agent — Webflow deploy handoff

This is the execution checklist for pushing `webflow/presignup-agent.*` into
Webflow. The code is built and verified in `test/presignup-agent.test.html`
already; this doc only covers the paste-in-Webflow steps.

## Overview

A new section sits **above the existing home-page hero**. Visitors type their
domain, the script POSTs to the pre-signup agent (SSE), extracts the
`:::audit_products{…}:::` block, and sequentially animates a card per product
category with per-card audit-log flavor text, then lands the real vendor rows.

Scope:

- **Home page only** — do not register the footer script site-wide.
- **Dark-mode convention** — the feature uses the current
  `html.dark .some-class` pattern. Do **not** add a `dark` combo class on the
  new elements and do **not** touch the legacy `DARK_MODE_TARGETS` array.

## Prerequisites

- `webflow/presignup-agent.css` — final.
- `webflow/presignup-agent.js` — final **except** for the `AGENT_ENDPOINT`
  constant, which is `"<TODO>"` in the repo copy.
- `test/presignup-agent.test.html` — passes every check in the verification
  section of the plan (card sequencing, dark toggle, error path, mobile).
- Real production `AGENT_ENDPOINT` URL from backend. Reference implementation
  uses `/api/run_sse` same-origin — confirm before pasting.
- Confirmation that the POST payload shape is still
  `{ appName, userId, sessionId, newMessage: { role, parts: [{text}] }, streaming }`.

## Webflow Designer — structural changes

Do these first, through MCP where possible (`element_tool`, `element_builder`)
or manually in the Designer.

1. On the home page, add a new **Section** at the very top of the page (above
   the existing hero section). Apply the base class
   **`presignup-agent-section`**. No `dark` combo.
2. Inside the section, add a **Div Block** (`Container` element type works
   too). Apply the class **`presignup-agent-container`** — layout class only.
3. Inside the container, add an **Embed** element. Set its ID to
   **`presignup-agent-root`**. Paste the following HTML verbatim as its
   content:

```html
<h1 class="presignup-agent-headline">
  See where your vendor spend leaks — in seconds.
</h1>
<p class="presignup-agent-sub">
  Paste your website. We’ll detect your stack, estimate spend across ads,
  payments, and SaaS, and show where waste is hiding.
</p>

<form
  id="presignup-agent-form"
  class="presignup-agent-form"
  novalidate
  autocomplete="off"
>
  <input
    id="presignup-agent-input"
    class="presignup-agent-input"
    type="text"
    inputmode="url"
    placeholder="yourbrand.com"
    aria-label="Your website domain"
    required
  />
  <button type="submit" class="presignup-agent-submit">Run audit</button>
</form>

<div
  id="presignup-agent-status"
  class="presignup-agent-status"
  aria-live="polite"
></div>

<div
  id="presignup-agent-results"
  class="presignup-agent-results"
  aria-live="polite"
></div>
```

Notes:

- The Embed renders the form shell; the script hydrates state and appends
  cards into `#presignup-agent-results` on submit.
- Keep the `#presignup-agent-root` id on the `container` OR the embed — the
  script queries `document.getElementById('presignup-agent-root')` and expects
  to find the form/status/results descendants under it. The test harness puts
  the id on the container; either works.
- Do **not** reorder the `#presignup-agent-results` block above the status
  line — layout assumes results come last.

## Custom Code — paste order

### Project Settings → Custom Code → Head Code

After the existing `body-dark-cascade.css` `<style>` block, add a new
`<style>` block and paste the full contents of
[`webflow/presignup-agent.css`](../webflow/presignup-agent.css):

```html
<style>
  /* paste contents of webflow/presignup-agent.css here */
</style>
```

### Home page → Page Settings → Custom Code → Before `</body>`

Paste a `<script>` block containing the full contents of
[`webflow/presignup-agent.js`](../webflow/presignup-agent.js):

```html
<script>
  /* paste contents of webflow/presignup-agent.js here */
</script>
```

Before publishing, **replace** the placeholder in the pasted script:

```js
var AGENT_ENDPOINT = "<TODO>";  // ← replace with the real URL (e.g. "/api/run_sse")
```

Do this in the Webflow paste, not in the repo file — the repo file stays as
`<TODO>` so future harness sessions use fixture replay.

## Publish + verify on staging

1. Publish to the Webflow staging subdomain (do not push straight to
   production).
2. Open the staging URL, enter `sportforlife.co.th`, confirm:
   - Status line shows “Connecting to audit agent…” then “Reading agent
     stream…”.
   - Three cards render sequentially with per-product audit log lines
     (`[SYS] Initiating Ad audit…`, etc.).
   - Final vendor rows match the expected shape (name · spend · waste).
3. Toggle dark mode — confirm the section, input, cards, log lines, vendor
   rows flip without flashing.
4. On a 375px-wide device (or DevTools responsive view), confirm the input
   stacks, grid becomes one column, log lines wrap.
5. Exercise the error path: temporarily break `AGENT_ENDPOINT` (add an extra
   character), resubmit, confirm inline error + Try again link. Restore.

Only after staging passes, publish to production.

## Rollback

Two ways to disable the feature quickly without a repo revert:

- **Hide the section**: set `display: none` on the new
  `presignup-agent-section` via Designer, publish.
- **Remove the script**: delete the `<script>` paste from Home page → Page
  Settings → Before `</body>`, publish. The CSS can remain — no rules render
  without the script mounting content, and the static shell stays but does
  nothing on submit (the form will just reload the page on submit, so
  consider pairing this with hiding the section).

## Future changes

- Edits to the script or CSS happen in the repo first — run the harness,
  verify, then paste-replace into Webflow.
- Do **not** hand-edit the pasted copy in the Designer; it drifts from the
  repo and breaks the harness as a source of truth.
- If backend adds new product ids (e.g. `crm_id`), add their spec + log lines
  to `PRODUCT_SPECS` / `AUDIT_LOG_LINES` in `webflow/presignup-agent.js`. The
  grid already renders unknown ids via `prettify()` + the `_default` log
  lines, so deploys are safe while waiting on the spec update.
