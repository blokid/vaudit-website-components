# body-dark-cascade.css

> Source from `vaudit-website-pages/webflow/body-dark-cascade.css`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```css
/*
 * Vaudit — head styles (single paste)
 * Webflow: Project Settings → Custom Code → Head Code
 * Wrap this entire file in <style> … </style> (or paste into an existing <style> block).
 *
 * Theme: document.documentElement gets class "dark" (see theme-custom-code.html).
 */

/* -------------------------------------------------------------------------- */
/* Design tokens — light (default)                                              */
/* -------------------------------------------------------------------------- */

:root {
  --bg: #ffffff;
  --bg-surface: #f5f5f4;
  --text-primary: #1a1a18;
  --text-secondary: #6b6b69;
  --border: rgba(26, 26, 24, 0.12);
  --primary: #fe602c;
  --primary-hover: #e5501f; /* slightly darkened for hover states */
}

/* -------------------------------------------------------------------------- */
/* Design tokens — dark (inherits onto body and descendants)                    */
/* -------------------------------------------------------------------------- */

html.dark {
  --bg: #1a1a18;
  --bg-surface: #242422;
  --text-primary: #f5f5f4;
  --text-secondary: #9b9b98;
  --border: rgba(255, 255, 255, 0.1);
  /* --primary and --primary-hover are NOT overridden — stays identical */
}

/* -------------------------------------------------------------------------- */
/* Logo + hero media (no JS — visibility follows html.dark)                    */
/* Light default: show white variants; dark: show dark variants.              */
/* -------------------------------------------------------------------------- */

.logo-dark,
.hero-mv-dark {
  display: none;
}

.logo-white,
.hero-mv-white {
  display: block;
}

html.dark .logo-white,
html.dark .hero-mv-white {
  display: none;
}

html.dark .logo-dark,
html.dark .hero-mv-dark {
  display: block;
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

.neon-card {
  border: 1px solid rgba(254, 96, 44, 0.25);
  box-shadow:
    0 2px 12px rgba(26, 26, 24, 0.08),
    0 1px 3px rgba(26, 26, 24, 0.06);
}

html.dark .neon-card {
  border: 1px solid rgba(254, 96, 44, 0.5);
  box-shadow:
    0 0 20px rgba(254, 96, 44, 0.12),
    0 0 60px rgba(254, 96, 44, 0.06);
}

.company-list-wrapper {
  overflow: hidden; /* hide overflowing logos */
}

.company-list {
  width: max-content;
  animation: 20s linear infinite vaudit-company-list-slide;
}

@keyframes vaudit-company-list-slide {
  from {
    transform: translateX(0%);
  }
  to {
    transform: translateX(-50%);
  }
}

/* -------------------------------------------------------------------------- */
/* Dark theme — Webflow cascade (from published .class.dark combos)           */
/* Mirrors per-node .dark utilities; html.dark is set before <body> exists.   */
/* body.body-16: same intent as Webflow .body-16.dark on the body element.    */
/* -------------------------------------------------------------------------- */

html.dark body.body-16 {
  background-color: var(--charcoal-900);
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .navbar-4 {
  background-color: var(--charcoal-900);
}

html.dark .text-muted-foreground {
  color: var(--charcoal-100);
}

html.dark .problem-text {
  color: var(--less-white);
}

html.dark .nav-33 {
  border-bottom-color: var(--charcoal-700);
}

html.dark .announcement {
  border-style: none none solid;
  border-color: var(--charcoal-700);
  letter-spacing: normal;
}

html.dark .announcement-text {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .announcement-icon {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .nav-link-item-text {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .nav-link-dropdown-icon {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .nav-head-link {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .burger-menu {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .burger-dropdown {
  background-color: var(--charcoal-900);
  border-style: none;
}

html.dark .text-4xl {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .nav-dropdown-list.w--open {
  border-color: var(--charcoal-700);
  background-color: var(--charcoal-900);
}

html.dark .nav-dropdown-item {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

html.dark .nav-dropdown-item:hover {
  color: var(--primary);
}

html.dark .nav-link-item-2 {
  color: var(--radiant-ui-components-library-marketplace--color--white);
  letter-spacing: normal;
}

html.dark .nav-link-item-2:hover {
  color: var(--primary);
}

/* -------------------------------------------------------------------------- */
/* Partner Copy + hero — Webflow .class.dark → html.dark                       */
/* Hero / most partner combos: shared CSS bundle (site styles).               */
/* partner-hw-section + partner-hw-line: Designer MCP (query_styles) values.   */
/* -------------------------------------------------------------------------- */

html.dark .hero-lp-section {
  background-color: var(--charcoal-900);
}

html.dark .hero-lp-glow {
  background-image: radial-gradient(closest-side, #ff783c38, #ff642800 70%);
}

html.dark .hero-lp-eyebrow {
  color: #ff8c42;
  text-shadow: 0 0 40px #ff8c4273;
}

html.dark .hero-lp-headline {
  color: #fafafa;
}

html.dark .hero-lp-sub {
  color: #fafafaa6;
}

html.dark .partner-pt-surface {
  border-bottom-color: var(--charcoal-700);
  background-color: var(--charcoal-900);
}

html.dark .partner-ui-placeholder {
  border-color: var(--charcoal-700);
  background-color: #1a1a1880;
}

html.dark .partner-rev-aside {
  background-color: var(--charcoal-900);
}

html.dark .partner-unlock-card {
  border-color: var(--charcoal-700);
  background-color: #141413;
}

html.dark .partner-card-title {
  color: #fff;
}

html.dark .partner-why-heading {
  color: #fff;
}

html.dark .partner-why-copy {
  color: #d4d4cc;
}

html.dark .partner-why-img-col {
  background-color: #ffffff0d;
  border-color: #ffffff1a;
}

html.dark .partner-card-item {
  background-color: #1e1e1c;
  border-color: #fe602c26;
}

html.dark .partner-card-item-title {
  color: #fff;
}

html.dark .partner-card-item-desc {
  color: #a3a39b;
}

/* MCP: style name "partner-hw-section dark" — darker strip than charcoal-900 */
html.dark .partner-hw-section {
  background-color: #0d0d0c;
}

html.dark .partner-hw-heading {
  color: #fff;
}

html.dark .partner-hw-step-desc {
  color: #a3a39b;
}

html.dark .partner-hw-split-timeline {
  background-color: #1a1a18;
}

html.dark .partner-hw-icon-box {
  background-color: var(--charcoal-900);
}

/* MCP: "partner-hw-line dark" */
html.dark .partner-hw-line {
  background-color: rgba(254, 96, 44, 0.25);
}

html.dark .section-title {
  color: var(--radiant-ui-components-library-marketplace--color--white);
}

```
