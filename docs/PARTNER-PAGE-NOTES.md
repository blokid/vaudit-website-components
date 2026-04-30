# Partner page (`/partner` / Partner Copy) — build notes

## Reference

- Copy source: `partner-page-copy-and-design.docx`
- Layout refs extracted to `docs/partner-ref/image1.png` (revenue split + scenario card) and `image2.png` (timeline spine + icon boxes; doc uses **5** steps).

## What was added in Webflow

Sections appended to the **body** (end of Navigator), in order of creation:

1. **Why partner** — two columns: copy + dashed **Product UI** placeholder (`partner-ui-placeholder`).
2. **What This Unlocks** — heading + **5** cards (`partner-unlock-card`, titles `partner-card-title`, body `text-muted-foreground`).
3. **Revenue math** — full-bleed split: **primary** orange left (`partner-rev-orange`), white/aside right with **charcoal** scenario card (`partner-scenario-card`) and **Become a Partner** button.
4. **How it works** — **`partner-hw-section`** is **transparent** in light (inner **`partner-hw-split-host`** is white); **four** steps with **`partner-hw-spine`**, **`partner-hw-icon-box`**, **`partner-hw-step-title` / `partner-hw-step-desc`**. CSS: `webflow/partner-how-it-works.css`. Spec: `WEBFLOW-THEME-CONVENTION.md` § How It Works.
5. **Value statement** — split: white aside + orange column (mirrors revenue layout pattern).
6. **Final CTA** — two columns: media placeholder + headline, sub, **Become a Partner**, disclaimer line.

## Section copy updates

### SECTION 6 — PARTNER VALUE STATEMENT

**Layout**

- Right orange block (keep visual style)
- Left timeline stays

**Headline**

Turn Verification Into Revenue

**Copy**

Vaudit turns billing verification into a revenue layer inside your platform.  
No changes to your product.  
No changes to your workflow.  
A system that validates what your clients are already paying -  
and converts it into verified revenue.

### SECTION 7 — FINAL CTA

**Layout**

- Split section (image + text)
- Keep button

**Copy**

**Headline**

Turn Verification Into Revenue

**Sub**

Embed AI-powered verification inside your platform  
and turn vendor spend into verified revenue

**CTA**

Become a Partner

**Small line**

No setup fees. Performance-based model.

## What you should do in Designer

1. **Reorder** — Move the new block **above** legacy sections (`page-header`, old `section-2` / problem / vendor blocks) so flow is: **Nav** → **Hero** → new sections → …  
2. **Remove or archive** old duplicate sections once you no longer need them.  
3. **Hero `dark` combo** — In the Style panel, open combo **`dark`** on **`hero-lp-section`** only and set background to **`charcoal-900`** (`#1a1a18`) if it still shows an older near-black hex. (Avoid using MCP `update_style` with style name `"dark"` alone — many combos share that name.)  
4. **Footer** — Doc asks for the **same footer as the homepage**: copy the homepage footer symbol, or turn this page’s footer into a **component** shared with Home.  
5. **Links** — Replace `#` on CTAs with real URLs / Calendly.  
6. **Assets** — Swap placeholders for product UI, photography, and optional timeline icons inside the orange-bordered squares.  
7. **Responsive** — Tighten `partner-grid-2col` and `partner-unlock-grid` at **tablet/mobile** breakpoints if needed.

## Theme script

The site uses the `html.dark .class` convention (see `WEBFLOW-THEME-CONVENTION.md`); dark overrides for partner classes live as `html.dark .partner-*` rules in `webflow/body-dark-cascade.css`. No class-array maintenance, no `dark` combos in Designer.

## Color tokens

See `docs/COLOR-SYSTEM.md` for hex ↔ Webflow variable mapping (`Primary`, `primary-accent`, `charcoal-900`, `--muted-foreground`, `--sidebar-border`, etc.).

## CTAs: link blocks, not buttons

Use **Link blocks** with classes `primary-btn` / `secondary-btn` (and text classes on the label) so icons can live inside the control. Avoid the **Button** element for these CTAs. On a fresh MCP export, those nodes usually show as **`type: "Link"`**.
