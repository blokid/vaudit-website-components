---
version: alpha
name: Vaudit
description: >
  Vendor-billing audit platform — connects to vendor accounts, finds
  overcharges, and recovers money. Visual system is light-first with a
  single-class dark mode (html.dark) and a signal-orange accent against
  near-black charcoal and warm white.
colors:
  primary: "#fe602c"
  primary-accent: "#ffcebe"
  charcoal-900: "#1a1a18"
  charcoal-700: "#2e2e2a"
  charcoal-100: "#d4d4cc"
  surface-light: "#ffffff"
  surface-light-alt: "#f5f5f4"
  surface-dark: "#1a1a18"
  surface-dark-alt: "#242422"
  text-primary-light: "#1a1a18"
  text-primary-dark: "#f5f5f4"
  text-secondary-light: "#64748b"
  text-secondary-dark: "#d4d4cc"
  border-light: "#e2e8f0"
  border-dark: "#2e2e2a"
  border-translucent-light: "rgba(26, 26, 24, 0.12)"
  border-translucent-dark: "rgba(255, 255, 255, 0.10)"
  partner-hw-split-host: "#ffffff"
typography:
  display:
    fontFamily: Inter
    fontSize: 2.5rem
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  h1:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.015em"
  h2:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: 600
    lineHeight: 1.25
  h3:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.55
  caption:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
  label-caps:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
    textTransform: uppercase
rounded:
  none: 0
  xs: 2px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 14px
  2xl: 22px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  section-y: 96px
components:
  primary-btn:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface-light}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    border: none
  primary-btn:hover:
    backgroundColor: "#f0651f"
  secondary-btn:
    backgroundColor: transparent
    textColor: "{colors.charcoal-900}"
    typography: "{typography.body-md}"
    rounded: "{rounded.pill}"
    padding: "12px 22px"
    border: "1px solid {colors.border-translucent-light}"
  secondary-btn-dark:
    textColor: "{colors.surface-light-alt}"
    border: "1px solid {colors.border-translucent-dark}"
  card:
    backgroundColor: "{colors.surface-light}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.border-light}"
  card-dark:
    backgroundColor: "{colors.surface-dark}"
    border: "1px solid {colors.border-dark}"
  pill:
    backgroundColor: "{colors.primary-accent}"
    textColor: "{colors.charcoal-900}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  nav:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.charcoal-900}"
    border-bottom: "1px solid {colors.border-light}"
---

## Overview

Vaudit is a vendor-billing audit platform: customers connect their vendor
accounts (cloud, SaaS, ad networks, payments, logistics, identity), Vaudit
audits invoices, and Vaudit recovers refunds and prevents future overcharges.
Pricing is performance-based, so the brand has to feel both **financial-grade
trustworthy** and **bias-for-action**.

The visual language reflects that:

- **Warm-neutral, not corporate-blue.** Off-black charcoal (`#1a1a18`) and warm
  white (`#ffffff` / `#f5f5f4`) carry most of the surface area. No gradients on
  type, no glassmorphism, no deep blues.
- **One signal color.** Vaudit Orange (`#fe602c`) is reserved for primary CTAs,
  active states, and recovery-amount callouts. A softer **primary-accent**
  (`#ffcebe`) handles supportive pills and chips.
- **Numbers do the talking.** Hero metrics ("$1B+ audited", "$50M+ recovered")
  and audit modules (AdID, KloudID, PaymentID, SeatID, ShipID, TokenID) use
  larger weight + tighter tracking than surrounding copy.
- **Dual-theme by default.** Every section is built light-first, with a dark
  override expressed as `html.dark .class { … }` in plain CSS. There are no
  combo classes and no JS toggles per element.

Tagline: **"Connect. Audit. Get Money Back."**

## Colors

### Roles

| Role | Light | Dark | Token |
|---|---|---|---|
| Page background | `#ffffff` | `#1a1a18` | `surface-light` / `surface-dark` |
| Raised surface | `#f5f5f4` | `#242422` | `surface-light-alt` / `surface-dark-alt` |
| Primary text | `#1a1a18` | `#f5f5f4` | `text-primary-*` |
| Secondary / muted text | `#64748b` | `#d4d4cc` | `text-secondary-*` |
| Border (solid) | `#e2e8f0` | `#2e2e2a` | `border-light` / `border-dark` |
| Border (translucent) | `rgba(26,26,24,.12)` | `rgba(255,255,255,.10)` | `border-translucent-*` |
| Brand / CTA | `#fe602c` | `#fe602c` | `primary` |
| Brand wash | `#ffcebe` | `#ffcebe` | `primary-accent` |

The dark override is a single descendant selector: `.text-muted-foreground`
maps to `#64748b` on light and `#d4d4cc` under `html.dark`. Same pattern for
every other themed class.

### Fixed-palette sections (same in both themes)

- **Revenue Math left panel** (`partner-rev-math-left-*`) — solid Vaudit Orange
  with white pills and charcoal text.
- **How It Works timeline spine, icon-box borders, step titles** — orange on
  charcoal in both themes.
- **Partner Hero** — always charcoal-900 with an orange glow.

These sections deliberately have no `html.dark` overrides.

### Notable raw-hex exceptions

A small number of classes intentionally use a raw hex value instead of a token:

- `partner-hw-split-host` is `#ffffff`, **not** the surface variable, because
  the split host needs to stay white even when the page surface tints.

When in doubt, prefer the Webflow variable in the `Base` collection over a
raw hex.

## Typography

Single typeface: **Inter** (system-fallback `system-ui, -apple-system,
"Segoe UI", Roboto, sans-serif`).

| Token | Size | Weight | Use |
|---|---|---|---|
| `display` | 2.5rem | 700 | Hero headline |
| `h1` | 2rem | 700 | Page title |
| `h2` | 1.5rem | 600 | Section title |
| `h3` | 1.25rem | 600 | Card title |
| `body-lg` | 1.125rem | 400 | Hero subhead, lead paragraph |
| `body-md` | 1rem | 400 | Default body, button label |
| `body-sm` | 0.875rem | 400 | Dense rows, table cells |
| `caption` | 0.75rem | 500 | Footnotes, helper text |
| `label-caps` | 0.6875rem | 600, +0.08em, uppercase | Eyebrows, module IDs |

Headings use negative tracking (`-0.015em` / `-0.02em` for display). Body
copy is untracked. All-caps labels use positive tracking and 600 weight, never
700 — the look should feel taut, not heavy.

## Layout

- **Container:** `min(1200px, 100% - 32px)` centered. Generous outer gutter.
- **Section rhythm:** vertical padding `96px` on desktop, `64px` on tablet,
  `48px` on mobile.
- **Stack spacing:** scale of `4 / 8 / 16 / 24 / 32 / 48 / 64`. Avoid in-between
  values; if you reach for `20px` or `36px`, snap to the nearest scale step.
- **Grid:** 12 columns on desktop, 6 on tablet, 1 on mobile. Card grids prefer
  3-up at desktop, 2-up at tablet, 1-up at mobile.
- **Breakpoints (Webflow defaults):** `≥1280` desktop, `992–1279` desktop-sm,
  `768–991` tablet, `480–767` mobile-l, `<480` mobile-p.
- **Split sections** (e.g. Revenue Math) are 50/50 on desktop and stack on
  tablet with the orange/light panel on top.

## Elevation & Depth

Vaudit is a **flat** surface system. Depth comes from contrast between
neutral surfaces, not from shadow stacking.

| Level | Use | Treatment |
|---|---|---|
| 0 | Page background | Solid surface, no shadow |
| 1 | Raised card | `1px` border (light: `#e2e8f0`, dark: `#2e2e2a`); no shadow |
| 2 | Floating panel (rare) | Same border + `0 1px 2px rgba(0,0,0,0.04)` |
| 3 | Modal / overlay | Same border + `0 8px 32px rgba(0,0,0,0.12)`; backdrop `rgba(0,0,0,0.4)` |

Hero "glow" effects are **radial gradients of the primary color**, not
box-shadows. They live on the section background, not on the headline.

## Shapes

Corner radius is the most expressive shape token in the system.

- **Pill (`999px`)** — every CTA, every chip, every status badge. The pill
  shape is part of the brand.
- **`14px`** — primary card radius (audit-module cards, partner cards).
- **`12px`** — input fields, smaller cards.
- **`8px`** — interior containers (e.g. table rows, sub-cards).
- **`4px` / `2px`** — accent strips, progress bars.
- **`0`** — section-spanning surfaces only (no rounded section edges).

Rules:

1. CTAs are **always** pills. Never `8px` or `12px`.
2. Don't stack different non-pill radii on adjacent siblings. Pick one (e.g.
   `14px`) for a card grid and stay there.
3. Inner elements should use a **smaller** radius than their container, never
   equal or larger.

## Components

### Primary CTA

- **Markup:** Webflow **Link block** with class `primary-btn`; inner label has
  class `primary-btn-text`. **Do not** use Webflow's native `Button` element —
  it can't host the icon + label layout this site needs.
- **Style:** solid `#fe602c` background, white label, pill radius, `12px 22px`
  padding, no border. Hover darkens to `#f0651f`.
- **Identical in light and dark.**

### Secondary CTA

- Same `LinkBlock` + `secondary-btn` / `secondary-btn-text` pairing.
- Light: transparent background, charcoal-900 text, `1px` translucent charcoal
  border.
- Dark: transparent, near-white text, `1px` translucent white border.

### Card

- `14px` radius, `1px` solid border (light `#e2e8f0`, dark `#2e2e2a`),
  `24px` interior padding, no shadow at rest.
- Module cards use a small primary-accent pill in the header, a charcoal title
  (`h3`), and a `text-muted-foreground` body.

### Pill / chip

- Background `primary-accent` (`#ffcebe`), text charcoal-900, `label-caps`
  typography, `999px` radius, `6px 12px` padding.

### Hero

- Section surface `surface-dark` with a radial primary glow at top-center.
- Headline uses `display`; subhead uses `body-lg`.
- Trust strip immediately under the hero shows partner logos as monochrome
  white-on-charcoal (`logo-white`) in dark theme and charcoal-on-white
  (`logo-dark`) in light theme. The swap is pure CSS via `html.dark`
  display rules.

### Nav

- Sticky white bar (`surface-light`), `1px` border-bottom, charcoal-900 links.
- Theme toggle on the right; an announcement strip can sit above the nav and
  uses the same border treatment.
- The nav's dropdown fix script must register **before** any late-loaded
  page-level JS.

### Audit-module IDs

The product names — **AdID, KloudID, PaymentID, SeatID, ShipID, TokenID** —
are treated as a typographic system: capital-camel with a capital "ID" suffix,
always rendered in the same weight/size as surrounding heading copy. Don't
abbreviate, hyphenate, or color the "ID" portion differently.

## Do's and Don'ts

**Do**

- Use Webflow Base-collection variables (`Primary`, `charcoal-900`,
  `--muted-foreground`, etc.) rather than raw hex, with the documented
  exceptions.
- Style every new themed class **light-first** on the base class, then add
  `html.dark .base-class { … }` for the dark override in the same stylesheet.
- Use `LinkBlock` + `primary-btn` / `secondary-btn` for all CTAs.
- Snap spacing to the `4 / 8 / 16 / 24 / 32 / 48 / 64` scale.
- Keep CTAs pill-shaped.
- Use the primary orange sparingly — one or two emphases per viewport.

**Don't**

- Don't add `dark` combo classes on elements. The site no longer uses that
  pattern; only `html.dark` descendant selectors are valid.
- Don't toggle theme classes from JavaScript per element. Theme is a single
  class on `<html>` set by the head bootstrap.
- Don't use Webflow's native `Button` element for CTAs.
- Don't apply `text-muted-foreground` inside the "How it works" charcoal
  strip — its descriptions use `partner-timeline-body` (charcoal-100) for
  contrast.
- Don't introduce new typefaces, gradient text, or stacked drop shadows.
- Don't render the audit-module names with a styled "ID" suffix
  (e.g. AdID, not Ad·ID or Ad**ID**).

## Agent guidance

This file is consumed by AI design agents (Stitch, Claude Code, Cursor) when
generating UI for Vaudit. Project-specific rules:

- Treat `CLAUDE.md`, `WEBFLOW-THEME-CONVENTION.md`, and `docs/COLOR-SYSTEM.md`
  as authoritative — this file summarizes them but the source docs win on
  conflict.
- The repository is **not buildable**. There is no package manager, no test
  runner, and no lint. Changes to the live site land via the Webflow MCP
  server (`mcp__webflow__*` tools) or by pasting CSS/HTML/JS snippets into
  Webflow Custom Code. Do not propose `npm`, `pip`, or `make` workflows.
- Mirror any change that affects shared conventions back into the relevant
  doc and, if the theme script changed, keep `webflow/theme-custom-code.html`
  in sync.
- When generating CSS, prefer the design tokens declared on `:root` (`--bg`,
  `--text-primary`, `--text-secondary`, `--border`) so a section gets dark
  mode "for free" without a separate `html.dark` rule.
