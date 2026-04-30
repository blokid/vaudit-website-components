# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

This is **not** a buildable codebase. It is a working set of CSS, HTML, and docs that back the **Vaudit Webflow site**. Changes land in Webflow via the **Webflow MCP server** (tools under `mcp__webflow__*`), or by pasting CSS/HTML/JS snippets from this repo into Webflow's **Project Settings → Custom Code** or per-page embeds.

There is no package manager, no build, no test runner, and no lint. Do not suggest `npm`, `pip`, `make`, etc. Commands relevant here are the MCP tools and occasional `curl`/`WebFetch` against `https://www.vaudit.com`.

## Authoring workflow

1. **Read the convention docs first** — they encode decisions that are easy to get wrong from the Designer alone:
   - `WEBFLOW-THEME-CONVENTION.md` — dark-mode system and the recipe for adding a new themeable section (light base + `html.dark .class` overrides).
   - `docs/COLOR-SYSTEM.md` — hex ↔ Webflow variable names (`Primary`, `charcoal-900`, `--muted-foreground`, etc.). Prefer the Webflow Base-collection variables over raw hex, with the documented exceptions (e.g. `partner-hw-split-host` must be raw `#ffffff`, not the site `surface` variable).
   - `docs/PARTNER-PAGE-NOTES.md` — section order and copy for the `/partner` page.
2. **Edit Webflow** via MCP (`element_tool`, `style_tool`, `variable_tool`, `element_snapshot_tool`, `data_pages_tool`, `data_scripts_tool`, `ask_webflow_ai`). Allowed tools are pre-approved in `.claude/settings.local.json`.
3. **Mirror the change back into this repo** when it affects shared conventions — update the relevant doc and, if the theme script changed, keep `webflow/theme-custom-code.html` in sync.

## Non-obvious architecture

**Dark mode is a single `html.dark` class.** A HEAD bootstrap synchronously toggles `html.dark` from `localStorage('vaudit-theme')` (falling back to `prefers-color-scheme`). A FOOTER script wires up the theme toggle button and persists the choice. That is the full mechanism — no other classes are applied anywhere at runtime. All dark overrides live in CSS as `html.dark .some-class { … }` descendant selectors, predominantly inside `webflow/body-dark-cascade.css`. Consequences:

- Every new section that changes appearance in dark mode must (a) style light on the base class and (b) write the dark overrides as `html.dark .base-class` rules in `body-dark-cascade.css` (or in the section's own pasted CSS file, e.g. `webflow/presignup-agent.css`). No Designer work for dark, no combo classes, no array to maintain.
- "Always dark" or fixed-palette sections (e.g. `partner-rev-math-*`) simply don't get a matching `html.dark` override — they render the same in both themes.
- Logo swaps are pure CSS now: `.logo-white` / `.logo-dark` (and `.hero-mv-white` / `.hero-mv-dark`) show/hide via `display` rules at the bottom of `body-dark-cascade.css` keyed on `html.dark`.
- **Historical:** earlier iterations used a JS `DARK_MODE_TARGETS` array that toggled a `dark` combo class on matched nodes. That mechanism has been removed from the live site. If you see references to it in older docs or Git history, they are out of date — don't re-introduce the pattern.

**CTAs are Link blocks, not Buttons.** Use `LinkBlock` with `primary-btn` / `secondary-btn` on the block and `primary-btn-text` / `secondary-btn-text` on the inner label. Webflow's native `Button` does not support inner icon layout and is not used on this site. In `element_tool.get_all_elements` output a Link block often reports `type: "Link"` — that is still the block-level link, not a text link.

**Custom Code ordering** (from `webflow/theme-custom-code.html`): HEAD runs `body-dark-cascade.css` → theme bootstrap (sets `html.dark` synchronously to avoid flash) → nav dropdown fix (must register before late page injections like Vue DevTools). FOOTER runs only the theme toggle script.

## Tooling notes

- `.cursor/settings.json` enables the Webflow Cursor plugin; `.claude/settings.local.json` pre-allows the matching Claude Webflow MCP tools. Both point at the same Webflow site.
- Designer MCP may not apply Webflow **styles** to raw `String` text nodes — if a CTA label does not pick up typography, assign the text class (`primary-btn-text` / `secondary-btn-text`) in the Style panel once and confirm the published HTML exposes it.
- Avoid `style_tool.update_style` with a style name of just `"dark"` — many combos share that name and the update can hit the wrong selector. Target the specific base (e.g. `hero-lp-section`) with the `dark` combo instead.
