# hero.html

> Source from `vaudit-website-pages/hero.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Vaudit — Hero clone</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #191a17;
    --ink: #ffffff;
    --ink-soft: #b9bdc5;
    --orange: #f0651f;
    --orange-2: #ff7a2a;
    --orange-glow: rgba(240,101,31,.35);
    --max: 1280px;
  }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }

  /* Keyboard-only focus indicators */
  :focus { outline: none; }
  :focus-visible {
    outline: 2px solid var(--orange);
    outline-offset: 3px;
    border-radius: 4px;
  }
  .sim-run:focus-visible,
  .btn-pill:focus-visible {
    outline-color: #fff;
    outline-offset: 3px;
  }
  .sim-input-row textarea:focus,
  .sim-input-row textarea:focus-visible {
    outline: none;
  }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: var(--ink);
    background:
      radial-gradient(70% 60% at 50% 50%, rgba(240,101,31,.18), transparent 60%) fixed,
      var(--bg);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    min-height: 100vh;
  }
  a { color: inherit; text-decoration: none; }

  .topbar { height: 36px; background: #050505; }

  .nav-inner {
    max-width: var(--max);
    margin: 0 auto;
    padding: 18px 32px;
    display: flex;
    align-items: center;
    gap: 40px;
  }
  .logo img { height: 38px; display: block; }
  .nav-links {
    display: flex; gap: 40px; margin: 0 auto;
    font-size: 16px; font-weight: 500; color: #fff;
  }
  .nav-links .item { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
  .nav-links .item .caret {
    width: 8px; height: 8px;
    border-right: 1.5px solid currentColor;
    border-bottom: 1.5px solid currentColor;
    transform: rotate(45deg) translateY(-2px);
    display: inline-block;
  }
  .nav-cta { display: flex; align-items: center; gap: 24px; }
  .login { font-size: 16px; font-weight: 500; }
  .btn-pill {
    display: inline-flex; align-items: center; gap: 8px;
    height: 48px; padding: 0 24px; border-radius: 999px;
    background: var(--orange); color: #fff;
    font-size: 16px; font-weight: 600; cursor: pointer;
    transition: background .15s ease, transform .08s ease;
    border: 0;
  }
  .btn-pill:hover { background: var(--orange-2); }
  .btn-pill .arrow {
    width: 12px; height: 12px;
    border-top: 1.5px solid currentColor;
    border-right: 1.5px solid currentColor;
    transform: rotate(45deg);
    display: inline-block; margin-left: 2px;
  }
  .btn-secondary {
    display: inline-flex; align-items: center;
    height: 48px; padding: 0 24px; border-radius: 999px;
    background: transparent; color: #fff;
    font-size: 16px; font-weight: 600;
    border: 1px solid #3a3a3f; cursor: pointer;
    transition: background .15s ease, border-color .15s ease;
  }
  .btn-secondary:hover { background: #1a1a1d; border-color: #555; }

  .announce {
    max-width: var(--max); margin: 8px auto 0;
    padding: 0 32px; text-align: center;
  }
  .announce a {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 10px 20px; border-radius: 999px;
    background: rgba(240,101,31,.12);
    border: 1px solid rgba(240,101,31,.45);
    color: #ffd0b3; font-size: 14px; font-weight: 500;
  }
  .announce a strong { color: #fff; font-weight: 700; }
  .announce a .arrow {
    width: 10px; height: 10px;
    border-top: 1.5px solid currentColor;
    border-right: 1.5px solid currentColor;
    transform: rotate(45deg);
    display: inline-block;
  }

  .hero {
    max-width: var(--max); margin: 0 auto;
    padding: 40px 32px 24px; text-align: center;
  }
  .hero--visual-only { padding: 24px 32px 80px; }
  h1.headline {
    font-size: clamp(44px, 6.2vw, 84px);
    line-height: 1.05; letter-spacing: -0.01em;
    font-weight: 800; margin: 0;
    text-transform: uppercase;
  }
  .subhead {
    margin: 24px 0 0;
    font-size: clamp(22px, 2.6vw, 34px);
    font-weight: 600; color: #fff; letter-spacing: -0.01em;
  }
  .hero-visual-headline {
    text-align: center;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -0.025em;
    line-height: 1.15;
    color: #fff;
    margin: 0 auto 24px;
    max-width: 900px;
    padding: 0 24px;
  }
  @media (max-width: 720px) {
    .hero-visual-headline { font-size: 28px; }
  }

  .visual { width: min(1100px, 100%); margin: 8px auto 0; display: block; }
  .visual video { width: 100%; height: auto; display: block; }

  /* Stats row beneath the illustration */
  .hero-stats {
    display: flex; align-items: center; justify-content: center;
    gap: 56px;
    max-width: 1000px;
    margin: 24px auto 0;
    padding: 0 24px;
  }
  .hero-stat { text-align: center; flex: 1; position: relative; }
  .hero-stat + .hero-stat::before {
    content: ''; position: absolute;
    left: -28px; top: 50%; transform: translateY(-50%);
    width: 1px; height: 56px;
    background: rgba(255,255,255,.14);
  }
  .hero-stat-label {
    color: #fff; opacity: .85;
    font-size: 12px; font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    margin-bottom: 12px;
  }
  .hero-stat-value {
    color: var(--orange);
    font-size: 34px; font-weight: 800;
    letter-spacing: -.02em;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  /* Primary + secondary CTA row */
  .hero-ctas {
    display: flex; align-items: center; justify-content: center;
    gap: 16px;
    margin: 56px auto 0;
    flex-wrap: wrap;
  }
  .hero-cta {
    display: inline-flex; align-items: center; gap: 10px;
    height: 52px; padding: 0 28px;
    border-radius: 999px;
    font-size: 15px; font-weight: 600;
    text-decoration: none;
    border: 0;
    cursor: pointer;
    transition: background .15s ease, transform .08s ease;
  }
  .hero-cta--primary { background: var(--orange); color: #fff; }
  .hero-cta--primary:hover { background: var(--orange-2); }
  .hero-cta--secondary { background: #fff; color: #0a0a0a; }
  .hero-cta--secondary:hover { background: #e8e8e8; }
  .hero-cta:active { transform: translateY(1px); }
  .hero-cta .arrow {
    width: 10px; height: 10px;
    border-top: 1.5px solid currentColor;
    border-right: 1.5px solid currentColor;
    transform: rotate(45deg);
    display: inline-block;
  }

  .hero-tagline {
    text-align: center;
    max-width: 860px;
    margin: 36px auto 0;
    padding: 0 24px;
    color: #fff; opacity: .7;
    font-size: 15px; line-height: 1.6;
  }

  @media (max-width: 720px) {
    .hero-stats { flex-direction: column; gap: 28px; }
    .hero-stat + .hero-stat::before { display: none; }
    .hero-stat-value { font-size: 28px; }
  }
  .cta-row {
    margin: 8px 0 0;
    display: flex; gap: 14px; justify-content: center; flex-wrap: wrap;
  }
  .body-copy {
    margin: 28px auto 0; max-width: 720px;
    color: var(--ink-soft); font-size: 16px; line-height: 1.55;
  }

  /* ─── Simulator section ─────────────────────────────── */
  .sim {
    max-width: 960px;
    margin: 64px auto 0;
    padding: 0 32px 24px;
  }
  .sim-eyebrow {
    text-align: center;
    color: var(--orange);
    font-size: 11px; font-weight: 500; letter-spacing: .16em;
    text-transform: uppercase;
    margin: 0 0 14px;
  }
  .sim-title {
    text-align: center;
    font-size: 26px;
    font-weight: 800; letter-spacing: -0.02em;
    text-transform: uppercase;
    line-height: 1.2;
    margin: 0 0 16px;
  }
  .sim-sub {
    text-align: center; color: #fff; opacity: .6;
    font-size: 14px; line-height: 1.55;
    max-width: 480px; margin: 0 auto 36px;
  }

  /* Thick shimmering stroke around the card.
     Conic gradient rotates a bright arc around the card's perimeter for
     true circular motion — the hot band travels around the edge, not
     parallel top/bottom. Animated via @property for smooth easing. */
  @property --shimmer-angle {
    syntax: '<angle>';
    initial-value: 0deg;
    inherits: false;
  }
  /* Single container: the textarea form IS the card. Shimmer on its stroke,
     and the external spread follows the shimmer direction from the stroke outward. */
  .sim-input-row {
    position: relative;
    display: flex; flex-direction: column; gap: 12px;
    padding: 20px;
    border-radius: 22px;
    border: 2px solid transparent;
    isolation: isolate;
    background:
      linear-gradient(#0f100e, #0f100e) padding-box,
      conic-gradient(
        from var(--shimmer-angle),
        rgba(240,101,31,.18) 0deg,
        rgba(240,101,31,.18) 150deg,
        rgba(255,180,120,.95) 172deg,
        rgba(255,215,170,1)   180deg,
        rgba(255,180,120,.95) 188deg,
        rgba(240,101,31,.18) 210deg,
        rgba(240,101,31,.18) 360deg
      ) border-box;
    animation: simCardShimmer 7s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
  }
  /* External orange spread emanating outward from the stroke,
     following the shimmer direction. Heavily blurred and faded. */
  .sim-input-row::after {
    content: '';
    position: absolute;
    inset: -90px;
    z-index: -1;
    pointer-events: none;
    border-radius: inherit;
    filter: blur(60px);
    opacity: .55;
    background: conic-gradient(
      from var(--shimmer-angle),
      transparent 0deg,
      transparent 140deg,
      rgba(240,101,31,.25) 180deg,
      transparent 220deg,
      transparent 360deg
    );
  }
  @keyframes simCardShimmer {
    to { --shimmer-angle: 360deg; }
  }
  .sim.scanning .sim-input-row {
    animation-duration: 3s;
  }
  .sim.scanning .sim-input-row::after {
    opacity: .8;
  }

  .sim-input-top {
    display: flex; gap: 10px; align-items: flex-start;
  }
  .sim-input-row .caret-i {
    color: var(--orange);
    flex-shrink: 0;
    padding-top: 3px;
  }
  .sim-input-row textarea {
    flex: 1;
    background: transparent; border: 0; outline: 0;
    color: #fff; font-size: 16px;
    font-family: inherit; line-height: 1.5;
    resize: none;
    padding: 0; margin: 0;
    min-height: 66px;
    width: 100%;
  }
  .sim-input-row textarea::placeholder { color: #6a6a70; }

  .sim-input-bottom {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px; flex-wrap: wrap;
  }
  .sim-input-bottom .template-row {
    flex: 1 1 auto; min-width: 0;
  }
  .sim-run {
    display: inline-flex; align-items: center; gap: 8px;
    height: 44px; padding: 0 22px;
    border-radius: 10px; border: 0; cursor: pointer;
    background: var(--orange); color: #fff;
    font-family: inherit; font-weight: 700; font-size: 13px;
    letter-spacing: .08em; text-transform: uppercase;
    transition: background .15s ease;
  }
  .sim-run:hover { background: var(--orange-2); }
  .sim-run[disabled] { opacity: .6; cursor: wait; }
  .sim-run svg { width: 15px; height: 15px; }

  /* Keyboard shortcut hint inside Run Audit */
  .sim-kbd {
    display: inline-flex; align-items: center;
    padding: 3px 7px;
    border-radius: 5px;
    background: rgba(255,255,255,.14);
    border: 1px solid rgba(255,255,255,.18);
    color: #fff;
    font-family: inherit;
    font-size: 10px; font-weight: 600;
    letter-spacing: .04em;
    line-height: 1;
    margin: 0 6px 0 2px;
    text-transform: none;
  }

  .template-row {
    display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
  }
  .template {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid #2a2a2e;
    background: transparent;
    color: var(--ink-soft);
    font-family: inherit; font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    transition: border-color .15s ease, color .15s ease, background .15s ease;
  }
  .template:hover { border-color: #4a4a4f; color: #fff; }
  .template.active {
    border-color: var(--orange);
    color: #fff;
    background: rgba(240,101,31,.08);
  }
  .template .t-icon { width: 14px; height: 14px; flex-shrink: 0; }
  .template-refresh {
    width: 30px; height: 30px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1px solid #2a2a2e;
    background: transparent;
    color: var(--ink-soft);
    cursor: pointer;
    transition: border-color .15s ease, color .15s ease, transform .3s ease;
  }
  .template-refresh:hover { border-color: #4a4a4f; color: #fff; }
  .template-refresh svg { width: 13px; height: 13px; }
  .template-refresh.spin { transform: rotate(360deg); }

  /* ─── Results ───────────────────────────────────────── */
  .results {
    max-width: var(--max);
    margin: 48px auto 0;
    padding: 0 32px 96px;
  }

  .results-head {
    text-align: center;
    margin-bottom: 28px;
  }
  .results-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    color: var(--ink-soft); font-size: 12px; font-weight: 700;
    letter-spacing: .2em; text-transform: uppercase;
  }
  .results-eyebrow::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--ink-soft);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 18px;
    margin-top: 0;
  }
  .grid .card:nth-child(-n+3) { grid-column: span 4; }
  .grid .card:nth-child(n+4)  { grid-column: span 3; }
  @media (max-width: 960px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
    .grid .card:nth-child(n) { grid-column: auto; }
  }
  @media (max-width: 620px) {
    .grid { grid-template-columns: 1fr; }
  }

  /* Card — compact, monochrome (white + orange only) */
  .card {
    position: relative;
    border-radius: 12px;
    border: 1px solid #232324;
    background: #121311;
    padding: 12px 14px;
    display: flex; flex-direction: column; gap: 8px;
    overflow: hidden;
    transition:
      border-color .25s ease,
      box-shadow .35s ease,
      transform .25s cubic-bezier(0.22, 1, 0.36, 1);
  }

  /* Preview state — shown before audit runs */
  .card.preview .card-head,
  .card.preview .card-hero,
  .card.preview .card-vendors,
  .card.preview .vaudit-hero,
  .card.preview .vaudit-threads,
  .card.preview .card-connect { display: none; }
  .card:not(.preview) .card-preview-viz,
  .card:not(.preview) .preview-head,
  .card:not(.preview) .preview-sep,
  .card:not(.preview) .preview-desc { display: none; }

  /* Head row: title left, vendor logos right */
  .preview-head {
    display: flex; justify-content: space-between; align-items: center;
    gap: 10px;
  }
  .preview-title {
    color: #fff;
    font-size: 13px; font-weight: 500; letter-spacing: -.01em;
    margin: 0;
    display: inline-flex; align-items: center; gap: 6px;
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .preview-title .emoji {
    font-size: 14px; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    width: 1em; height: 1em;
    color: var(--orange);
    flex-shrink: 0;
  }
  .emoji svg { width: 1em; height: 1em; display: block; }
  .emoji img { width: 1em; height: 1em; object-fit: contain; display: block; }
  /* Vaudit logo is a full wordmark — render wider so the "Vaudit" text is legible */
  .emoji--logo { width: auto; height: 22px; }
  .emoji--logo img,
  .emoji--logo svg { width: auto; height: 100%; aspect-ratio: 1 / 1; }
  .preview-logos {
    display: flex; gap: 3px; flex-shrink: 0;
  }
  .p-logo {
    width: 16px; height: 16px;
    border-radius: 4px;
    object-fit: contain;
    background: rgba(255,255,255,.04);
    padding: 2px;
    border: 0;
    opacity: .8;
  }

  /* Separator removed — rely on whitespace for separation */
  .preview-sep { display: none; }

  .preview-desc {
    margin: 0;
    color: #fff; opacity: .45;
    font-size: 12px; line-height: 1.5;
    min-height: calc(1.5em * 2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
            line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-preview-viz {
    display: flex; flex-direction: column; gap: 10px;
    min-height: 110px;
    padding: 18px 12px 14px;
    justify-content: center;
    align-items: center;
  }

  .viz {
    color: var(--orange);
    height: 36px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
  }
  .viz-label {
    color: #fff; opacity: .45;
    font-size: 9px; font-weight: 500;
    letter-spacing: .18em; text-transform: uppercase;
    text-align: center;
  }

  /* ══════════════════════════════════════════════════════
     Per-product conceptual animations — grounded in the real
     mechanism each product uses to detect waste.
     ══════════════════════════════════════════════════════ */

  /* ── Vaudit — shield radiating beams to 7 audit threads ── */
  .viz-vaudit svg { width: 96px; height: 46px; overflow: visible; }
  .viz-vaudit .vb {
    opacity: .2;
    animation: vauditBeam 2.4s ease-in-out infinite;
  }
  .viz-vaudit .vb.b1 { animation-delay: 0s;   }
  .viz-vaudit .vb.b2 { animation-delay: .17s; }
  .viz-vaudit .vb.b3 { animation-delay: .34s; }
  .viz-vaudit .vb.b4 { animation-delay: .51s; }
  .viz-vaudit .vb.b5 { animation-delay: .68s; }
  .viz-vaudit .vb.b6 { animation-delay: .85s; }
  .viz-vaudit .vb.b7 { animation-delay: 1.02s;}
  @keyframes vauditBeam {
    0%, 100% { opacity: .2; }
    50%      { opacity: 1; }
  }

  /* ── ShipID — package tracked along a path + recovered credit pop ── */
  .viz-ship {
    position: relative;
    width: 110px; height: 36px;
    justify-content: flex-start;
  }
  .viz-ship .ship-path {
    position: absolute;
    left: 2px; right: 2px;
    top: 70%;
    border-top: 1px dashed var(--orange);
    opacity: .35;
  }
  .viz-ship .ship-box {
    position: absolute;
    top: 70%;
    width: 14px; height: 10px;
    background: var(--orange);
    border-radius: 2px;
    transform: translateY(-50%);
    box-shadow: 0 0 8px rgba(240,101,31,.5);
    animation: shipMove 3.2s linear infinite;
  }
  @keyframes shipMove {
    0%   { left: -18px; }
    100% { left: calc(100% + 2px); }
  }
  .viz-ship .ship-credit {
    position: absolute;
    top: 20%;
    left: 55%;
    color: var(--orange);
    font-size: 11px; font-weight: 700;
    text-shadow: 0 0 6px rgba(240,101,31,.55);
    opacity: 0;
    animation: shipCredit 3.2s ease-in-out infinite;
  }
  @keyframes shipCredit {
    0%, 50%  { opacity: 0; transform: translateY(6px); }
    65%      { opacity: 1; transform: translateY(0); }
    90%      { opacity: 0; transform: translateY(-8px); }
    100%     { opacity: 0; }
  }

  /* ── SeatID — 5×2 grid, some billed-but-empty, scanner sweeps ── */
  .viz-seat {
    position: relative;
    width: 70px; height: 32px;
    padding: 3px 3px 3px 3px;
  }
  .viz-seat .seat-grid {
    display: grid;
    grid-template-columns: repeat(5, 9px);
    grid-auto-rows: 9px;
    gap: 3px;
    width: 100%;
    justify-content: center;
    align-content: center;
    position: relative;
  }
  .viz-seat .ss {
    width: 9px; height: 9px; border-radius: 2px;
    background: var(--orange);
    animation: seatActive 2.2s ease-in-out infinite;
  }
  .viz-seat .ss:nth-child(2n)  { animation-delay: .2s; }
  .viz-seat .ss:nth-child(3n)  { animation-delay: .45s; }
  .viz-seat .ss:nth-child(5n)  { animation-delay: .7s; }
  .viz-seat .ss-empty {
    background: transparent;
    border: 1px dashed var(--orange);
    opacity: .35;
    animation: none;
  }
  @keyframes seatActive {
    0%, 100% { opacity: 1; }
    50%      { opacity: .45; }
  }
  .viz-seat .seat-scan {
    position: absolute;
    left: 2px; right: 2px;
    height: 1.5px;
    background: var(--orange);
    box-shadow: 0 0 4px currentColor;
    opacity: 0;
    animation: seatScan 2.8s ease-in-out infinite;
  }
  @keyframes seatScan {
    0%   { top: 0; opacity: 0; }
    10%  { opacity: .9; }
    90%  { opacity: .9; }
    100% { top: 100%; opacity: 0; }
  }

  /* ── KloudID — vertical bars + dashed "paid capacity" ceiling ── */
  .viz-kloud {
    position: relative;
    width: 92px; height: 36px;
    padding: 4px;
    align-items: flex-end;
  }
  .viz-kloud .k-ceiling {
    position: absolute;
    left: 4px; right: 4px; top: 5px;
    border-top: 1.5px dashed var(--orange);
    opacity: .5;
  }
  .viz-kloud .k-ceiling::after {
    content: '';
    position: absolute;
    right: 0; top: -4px;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--orange);
    box-shadow: 0 0 4px currentColor;
  }
  .viz-kloud .k-bars {
    display: flex; gap: 3px;
    width: 100%; height: 100%;
    align-items: flex-end;
  }
  .viz-kloud .kb {
    flex: 1;
    background: var(--orange);
    border-radius: 1.5px 1.5px 0 0;
    transform-origin: bottom;
    animation: kBar 2.4s ease-in-out infinite;
  }
  .viz-kloud .kb:nth-child(1) { animation-delay: 0s;    height: 48%; }
  .viz-kloud .kb:nth-child(2) { animation-delay: .15s;  height: 70%; }
  .viz-kloud .kb:nth-child(3) { animation-delay: .30s;  height: 32%; }
  .viz-kloud .kb:nth-child(4) { animation-delay: .45s;  height: 58%; }
  .viz-kloud .kb:nth-child(5) { animation-delay: .60s;  height: 40%; }
  .viz-kloud .kb:nth-child(6) { animation-delay: .75s;  height: 65%; }
  .viz-kloud .kb:nth-child(7) { animation-delay: .90s;  height: 36%; }
  @keyframes kBar {
    0%, 100% { transform: scaleY(1); opacity: .9; }
    50%      { transform: scaleY(.55); opacity: .6; }
  }

  /* ── TokenID — tokens flowing left→right through a chip ── */
  .viz-token {
    position: relative;
    width: 110px; height: 36px;
  }
  .viz-token .token-chip {
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    width: 42px; height: 18px;
    border: 1.5px solid var(--orange);
    border-radius: 3px;
    opacity: .8;
    display: flex; align-items: center; justify-content: space-around;
    padding: 0 3px;
  }
  .viz-token .token-chip::before,
  .viz-token .token-chip::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 28px; height: 1px;
    background: var(--orange);
    opacity: .45;
  }
  .viz-token .token-chip::before { left: -30px; }
  .viz-token .token-chip::after  { right: -30px; }
  .viz-token .token-node {
    width: 3px; height: 3px; border-radius: 50%;
    background: var(--orange);
    animation: tokenBlink 1.4s ease-in-out infinite;
  }
  .viz-token .token-node:nth-child(2) { animation-delay: .2s; }
  .viz-token .token-node:nth-child(3) { animation-delay: .4s; }
  .viz-token .token-node:nth-child(4) { animation-delay: .6s; }
  @keyframes tokenBlink {
    0%, 100% { opacity: .35; transform: scale(.8); }
    50%      { opacity: 1;   transform: scale(1.3); }
  }
  .viz-token .t-flow {
    position: absolute;
    top: 50%;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: var(--orange);
    box-shadow: 0 0 4px currentColor;
    transform: translateY(-50%);
    opacity: 0;
    animation: tokenFlow 2.6s linear infinite;
  }
  .viz-token .tf1 { animation-delay: 0s;    }
  .viz-token .tf2 { animation-delay: .87s;  }
  .viz-token .tf3 { animation-delay: 1.73s; }
  @keyframes tokenFlow {
    0%   { left: 0;   opacity: 0; }
    15%  { opacity: 1; }
    85%  { opacity: 1; }
    100% { left: calc(100% - 4px); opacity: 0; }
  }

  /* ── AdID — reticle with expanding audit rings + invalid click "×" markers ── */
  .viz-ad {
    position: relative;
    width: 80px; height: 36px;
  }
  .viz-ad .ad-ring {
    position: absolute;
    top: 50%; left: 50%;
    width: 6px; height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    border: 1px solid var(--orange);
    opacity: 0;
    animation: adRing 2s ease-out infinite;
  }
  .viz-ad .ad-ring.r2 { animation-delay: 1s; }
  .viz-ad .ad-target {
    position: absolute;
    top: 50%; left: 50%;
    width: 5px; height: 5px;
    margin: -2.5px 0 0 -2.5px;
    border-radius: 50%;
    background: var(--orange);
    box-shadow: 0 0 5px currentColor;
  }
  @keyframes adRing {
    0%   { opacity: 1; transform: scale(.4); }
    100% { opacity: 0; transform: scale(5); }
  }
  .viz-ad .ad-click {
    position: absolute;
    color: var(--orange);
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    line-height: 1;
    opacity: 0;
    animation: adClick 3.2s ease-in-out infinite;
  }
  .viz-ad .ad-click.ac1 { top: 10%;  left: 14%; animation-delay: .3s; }
  .viz-ad .ad-click.ac2 { top: 68%;  left: 82%; animation-delay: 1.5s; }
  .viz-ad .ad-click.ac3 { top: 72%;  left: 10%; animation-delay: 2.4s; }
  @keyframes adClick {
    0%, 8%    { opacity: 0; transform: scale(.5); }
    18%       { opacity: 1; transform: scale(1.2); }
    38%       { opacity: .6; transform: scale(1); }
    55%       { opacity: 0; transform: scale(1.4); }
    100%      { opacity: 0; }
  }

  /* ── PaymentID — ledger rows being scanned, one flagged ── */
  .viz-pay {
    position: relative;
    width: 72px; height: 36px;
    padding: 4px 3px;
  }
  .viz-pay .pay-rows {
    position: relative;
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    justify-content: space-around;
  }
  .viz-pay .pr {
    height: 2.5px;
    background: var(--orange);
    opacity: .35;
    border-radius: 1.5px;
  }
  .viz-pay .pr:nth-child(1) { width: 90%; }
  .viz-pay .pr:nth-child(2) { width: 70%; }
  .viz-pay .pr:nth-child(3) { width: 85%; }
  .viz-pay .pr:nth-child(4) { width: 60%; }
  .viz-pay .pr-flag {
    animation: payFlag 3s ease-in-out infinite;
  }
  @keyframes payFlag {
    0%, 55%, 100% { opacity: .35; box-shadow: none; }
    65%, 85%      { opacity: 1; box-shadow: 0 0 8px rgba(240,101,31,.7); }
  }
  .viz-pay .pay-scan {
    position: absolute;
    left: 3px; right: 3px;
    height: 1.5px;
    background: var(--orange);
    box-shadow: 0 0 6px currentColor;
    opacity: 0;
    animation: payScan 3s ease-in-out infinite;
  }
  @keyframes payScan {
    0%   { top: 4px;  opacity: 0; }
    10%  { opacity: .9; }
    50%  { opacity: .9; top: calc(100% - 5px); }
    60%  { opacity: 0; }
    100% { top: 4px;  opacity: 0; }
  }

  /* Orange gradient hover overlay */
  .card::before {
    content: '';
    position: absolute; inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(120% 70% at 50% 0%, rgba(240,101,31,.22), transparent 60%),
      radial-gradient(100% 80% at 50% 100%, rgba(240,101,31,.08), transparent 70%);
    opacity: 0;
    transition: opacity .35s ease;
    pointer-events: none;
    z-index: 0;
  }
  .card > * { position: relative; z-index: 1; }
  .card:hover {
    border-color: rgba(240,101,31,.55);
    box-shadow:
      0 10px 30px rgba(240,101,31,.12),
      0 0 60px rgba(240,101,31,.08);
    transform: translateY(-3px);
  }
  .card:hover::before { opacity: 1; }

  /* ─── Vaudit summary — clean hierarchy: identity → value → breakdown → action ─── */
  /* Summary card locks the default hover look in — persistent highlight, no :hover delta. */
  .card[data-key="vaudit"],
  .card[data-key="vaudit"]:hover {
    background:
      radial-gradient(55% 70% at 100% 100%, rgba(240,101,31,.16), transparent 70%),
      #121311;
    border-color: rgba(240,101,31,.55);
    box-shadow:
      0 10px 30px rgba(240,101,31,.12),
      0 0 60px rgba(240,101,31,.08);
    transform: none;
  }
  .card[data-key="vaudit"]::before,
  .card[data-key="vaudit"]:hover::before { opacity: 1; }
  .vaudit-name-text {
    font-size: 13px; font-weight: 600;
    color: #fff; letter-spacing: -.01em;
    line-height: 1;
  }
  .vaudit-hero {
    text-align: center;
    padding: 8px 4px 4px;
    display: flex; flex-direction: column; align-items: center;
    gap: 6px;
  }
  .card[data-key="vaudit"] .card-amount.vaudit-amount {
    font-size: 34px; font-weight: 700;
    letter-spacing: -.025em; line-height: 1;
  }
  .vaudit-label {
    color: #fff; opacity: .55;
    font-size: 11.5px; font-weight: 400; line-height: 1.4;
    max-width: 260px;
  }

  .vaudit-threads {
    margin-top: 4px;
    padding-top: 10px;
    border-top: 1px solid rgba(255,255,255,.06);
    display: flex; flex-direction: column; gap: 8px;
  }
  .vaudit-threads-head {
    font-size: 9px; font-weight: 600;
    letter-spacing: .18em; text-transform: uppercase;
    color: #fff; opacity: .4;
  }
  .vaudit-icons {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px 6px;
  }
  .vaudit-thread {
    display: inline-flex; align-items: center; justify-content: flex-start;
    gap: 6px;
    padding: 4px 2px;
    cursor: default;
    min-width: 0;
  }
  .vaudit-thread-icon {
    color: var(--orange);
    display: inline-flex; align-items: center; justify-content: center;
    width: 14px; height: 14px;
    flex-shrink: 0;
  }
  .vaudit-thread-icon svg { width: 14px; height: 14px; }
  .vaudit-thread-label {
    font-size: 11px; font-weight: 500;
    color: #fff; opacity: .8;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* Satisfying transition when a card flips from preview → complete */
  @keyframes cardReveal {
    0%   { transform: scale(.98); filter: blur(4px); }
    55%  { transform: scale(1.01); filter: blur(0); }
    100% { transform: scale(1); filter: blur(0); }
  }
  .card.revealing {
    animation: cardReveal .7s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .card-head {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,.06);
  }
  .card-name {
    display: inline-flex; align-items: center; gap: 7px;
    color: #fff; font-weight: 500; font-size: 12.5px;
    letter-spacing: 0;
  }
  .card-name .emoji {
    font-size: 14px; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    width: 1em; height: 1em;
    color: var(--orange);
    flex-shrink: 0;
  }
  .card-badge {
    font-size: 8.5px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 999px;
    border: 1px solid #2b2b2c;
    color: #fff;
    background: transparent;
    opacity: .5;
  }

  /* Hero zone — centered amount + descriptor */
  .card-hero {
    display: flex; flex-direction: column; align-items: center;
    gap: 8px;
    padding: 14px 0 14px;
    border-bottom: 1px solid rgba(255,255,255,.06);
    text-align: center;
  }
  .card-desc {
    margin: 0;
    color: #fff; opacity: .55;
    font-size: 11.5px; font-weight: 400; line-height: 1.4;
    max-width: 260px;
  }
  .card-amount {
    font-size: clamp(22px, 2.2vw, 26px);
    font-weight: 700;
    color: var(--orange);
    font-variant-numeric: tabular-nums;
    letter-spacing: -.02em;
    line-height: 1;
    transition: text-shadow .4s ease, transform .4s ease;
  }
  .card-amount.pulse {
    text-shadow: 0 0 22px rgba(240,101,31,.35);
    transform: scale(1.02);
  }
  /* Vendor rows — name left, stacked figures (spend → waste) right */
  .card-vendors {
    display: flex; flex-direction: column; gap: 10px;
    padding-top: 4px;
  }
  .card-vendor {
    display: flex; justify-content: space-between; align-items: center; gap: 10px;
    font-size: 11.5px;
  }
  .card-vendor-name {
    display: inline-flex; align-items: center; gap: 6px;
    color: #fff; font-weight: 500; font-size: 11.5px;
    min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .card-vendor-logo {
    width: 14px; height: 14px; flex-shrink: 0;
    object-fit: contain;
    border-radius: 3px;
  }
  .card-vendor-emoji {
    font-size: 13px; line-height: 1; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    width: 1em; height: 1em;
    color: var(--orange);
  }
  .card-vendor-emoji svg { width: 1em; height: 1em; display: block; }
  .card-vendor-emoji img { width: 1em; height: 1em; object-fit: contain; display: block; }
  .card-vendor-fig {
    display: inline-flex; flex-direction: column; align-items: flex-end;
    flex-shrink: 0; gap: 2px;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .card-vendor-spend {
    color: #fff; opacity: .45;
    font-size: 11px; font-weight: 400;
  }
  .card-vendor-waste {
    color: var(--orange);
    font-size: 12px; font-weight: 600;
    letter-spacing: -0.01em;
  }

  /* ─── Preview state (pre-audit) ──────────────────────── */
  .card[data-state="preview"] .card-amount,
  .card[data-state="preview"] .card-vendor-fig { display: none; }
  .card[data-state="scanned"] .card-sparkline,
  .card[data-state="scanned"] .card-vendor-pulse { display: none; }

  .card-sparkline {
    display: inline-flex; align-items: flex-end; gap: 3px;
    height: 24px; padding: 0;
  }
  .card-sparkline span {
    display: block;
    width: 4px; border-radius: 2px;
    background: var(--orange);
    transform-origin: bottom center;
    animation: eq 1.2s ease-in-out infinite;
    box-shadow: 0 0 10px rgba(240,101,31,.35);
  }
  .card-sparkline span:nth-child(1) { height: 35%; animation-delay: 0s; }
  .card-sparkline span:nth-child(2) { height: 70%; animation-delay: .12s; }
  .card-sparkline span:nth-child(3) { height: 50%; animation-delay: .24s; }
  .card-sparkline span:nth-child(4) { height: 90%; animation-delay: .36s; }
  .card-sparkline span:nth-child(5) { height: 45%; animation-delay: .48s; }
  @keyframes eq {
    0%, 100% { transform: scaleY(.35); opacity: .55; }
    50%      { transform: scaleY(1);   opacity: 1; }
  }

  .card-vendor-pulse {
    display: inline-flex; gap: 3px; align-items: center;
    flex-shrink: 0;
  }
  .card-vendor-pulse i {
    width: 3px; height: 3px; border-radius: 50%;
    background: var(--orange);
    opacity: .35;
    animation: pulseDot 1.4s ease-in-out infinite;
  }
  .card-vendor-pulse i:nth-child(2) { animation-delay: .2s; }
  .card-vendor-pulse i:nth-child(3) { animation-delay: .4s; }
  @keyframes pulseDot {
    0%, 100% { opacity: .2; transform: scale(.8); }
    50%      { opacity: 1;  transform: scale(1.2); }
  }

  /* ─── Single primary CTA — "Audit My X" that swaps to inline email capture ─── */
  .card-actions {
    display: flex; flex-direction: column; gap: 4px;
    margin-top: auto;
    padding-top: 8px;
  }
  .card.preview .card-actions { display: none; }

  .action-audit-primary {
    display: flex; align-items: center; justify-content: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.12);
    background: transparent;
    color: #fff; opacity: .75;
    font-family: inherit;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    transition: background .15s ease, border-color .15s ease, opacity .15s ease, transform .08s ease;
  }
  .action-audit-primary::after {
    content: '→';
    font-size: 13px;
    line-height: 1;
  }
  .action-audit-primary:hover {
    background: var(--orange);
    border-color: var(--orange);
    color: #fff;
    opacity: 1;
    box-shadow: 0 8px 22px rgba(240,101,31,.28);
  }
  .action-audit-primary:active { transform: translateY(1px); }

  .email-capture {
    display: flex; gap: 4px;
  }
  .email-capture[hidden] { display: none; }
  .email-capture input {
    flex: 1; min-width: 0;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.04);
    color: #fff;
    font-family: inherit;
    font-size: 12px;
    outline: none;
    transition: border-color .15s ease;
  }
  .email-capture input::placeholder { color: #6a6a70; }
  .email-capture input:focus { border-color: var(--orange); }
  .email-capture button {
    padding: 12px 16px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,.12);
    background: transparent;
    color: #fff; opacity: .75;
    font-family: inherit;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer;
    flex-shrink: 0;
    transition: background .15s ease, border-color .15s ease, opacity .15s ease, transform .08s ease;
  }
  .email-capture button:hover {
    background: rgba(255,255,255,.04);
    border-color: rgba(255,255,255,.22);
    opacity: 1;
  }
  .email-capture button:active { transform: translateY(1px); }


  /* ─── Scanning state — richer live audit panel ─── */
  .sim.scanning .sim-run { pointer-events: none; }
  .sim.scanning .sim-input-bottom { display: none; }
  /* Keep the textarea visible during scan but lock it from edits */
  .sim.scanning .sim-input-top { opacity: .55; pointer-events: none; }

  /* Hide the preview cards while the scan widget is running */
  .results.scanning .grid,
  .results.scanning .results-eyebrow { display: none; }

  .scan-panel {
    display: none;
    padding: 2px 4px 4px;
  }
  .sim.scanning .scan-panel { display: block; animation: scanPanelIn .4s ease both; }
  @keyframes scanPanelIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .scan-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px; margin-bottom: 16px;
  }
  .scan-title-wrap {
    display: flex; flex-direction: column; gap: 4px;
  }
  .scan-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    color: var(--orange);
    font-size: 11px; font-weight: 700;
    letter-spacing: .18em; text-transform: uppercase;
  }
  .scan-eyebrow::before {
    content: ''; width: 6px; height: 6px; border-radius: 50%;
    background: var(--orange);
    box-shadow: 0 0 0 0 rgba(240,101,31,.55);
    animation: pulseDotBig 1.4s ease-in-out infinite;
  }
  @keyframes pulseDotBig {
    0%, 100% { box-shadow: 0 0 0 0 rgba(240,101,31,.55); }
    50%      { box-shadow: 0 0 0 8px rgba(240,101,31,0); }
  }
  .scan-title {
    color: #fff; font-size: 20px; font-weight: 600;
    letter-spacing: -.01em;
  }
  .scan-title .scan-caret {
    display: inline-block; width: 2px; height: 18px;
    background: var(--orange); margin-left: 4px;
    vertical-align: -3px;
    animation: caretBlink 1s steps(1) infinite;
  }
  @keyframes caretBlink {
    50% { opacity: 0; }
  }

  .scan-total {
    text-align: right;
    font-variant-numeric: tabular-nums;
    color: var(--orange);
    font-size: 28px; font-weight: 700;
    letter-spacing: -.02em;
    line-height: 1.05;
  }
  .scan-total-label {
    color: #fff; opacity: .45;
    font-size: 9.5px; font-weight: 500;
    letter-spacing: .18em; text-transform: uppercase;
    margin-bottom: 2px;
  }

  .scan-list {
    display: flex; flex-direction: column; gap: 2px;
    margin: 8px 0 14px;
  }
  .scan-item {
    display: grid;
    grid-template-columns: 16px 1fr auto auto;
    column-gap: 12px;
    align-items: center;
    padding: 9px 2px;
    border-bottom: 1px solid #1f1f20;
    color: #fff;
    transition: opacity .3s ease;
    opacity: .3;
  }
  .scan-item:last-child { border-bottom: 0; }
  .scan-item.active, .scan-item.done { opacity: 1; }

  /* Status chip */
  .scan-status {
    width: 14px; height: 14px; border-radius: 50%;
    position: relative;
  }
  .scan-item.pending .scan-status {
    border: 1.5px dashed #3a3a3f;
  }
  .scan-item.active .scan-status {
    background: var(--orange);
    box-shadow: 0 0 0 0 rgba(240,101,31,.55);
    animation: pulseDotBig 1s ease-in-out infinite;
  }
  .scan-item.done .scan-status {
    background: var(--orange);
  }
  .scan-item.done .scan-status::after {
    content: ''; position: absolute; inset: 0;
    background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14' fill='none' stroke='%23fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 7.5 6 10.5l5-7'/></svg>") center / 10px no-repeat;
  }

  .scan-item-name {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500; color: #fff;
  }
  .scan-item-name .emoji {
    font-size: 14px; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    width: 1em; height: 1em;
    color: var(--orange);
    flex-shrink: 0;
  }

  .scan-item-vendor {
    color: #fff; opacity: .5;
    font-size: 11.5px;
    min-width: 100px; text-align: right;
    font-variant-numeric: tabular-nums;
    transition: opacity .3s ease, color .3s ease;
  }
  .scan-item.active .scan-item-vendor { color: var(--orange); opacity: 1; }

  .scan-item-amount {
    color: #fff; font-weight: 600;
    font-size: 13px; min-width: 80px; text-align: right;
    font-variant-numeric: tabular-nums;
    opacity: 0;
    transition: opacity .4s ease;
  }
  .scan-item.done .scan-item-amount { opacity: 1; }

  .scan-progress {
    height: 2px; border-radius: 2px; overflow: hidden;
    background: #1f1f20;
  }
  .scan-progress-fill {
    height: 100%; width: 0;
    background: linear-gradient(90deg, var(--orange), #ffb080);
    box-shadow: 0 0 8px rgba(240,101,31,.6);
    transition: width .5s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .fab-stack {
    position: fixed; right: 22px; bottom: 22px;
    display: flex; flex-direction: column; gap: 14px; z-index: 100;
  }
  .fab {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--orange); color: #fff;
    display: inline-flex; align-items: center; justify-content: center;
    box-shadow: 0 10px 24px rgba(240, 101, 31, .35);
    cursor: pointer; border: 0;
  }
  .fab svg { width: 22px; height: 22px; }

  @media (max-width: 720px) {
    .nav-links { display: none; }
    .nav-cta .login { display: none; }
    .hero { padding: 24px 16px; }
    .sim-title { font-size: 22px; }
    .sim-input-row { flex-wrap: wrap; }
    .sim-run { width: 100%; justify-content: center; }
  }
</style>
</head>
<body>

  <div class="topbar"></div>

  <header>
    <div class="nav-inner">
      <a class="logo" href="#"><img src="vaudit-logo.png" alt="Vaudit"></a>
      <nav class="nav-links">
        <span class="item">Products <span class="caret"></span></span>
        <span class="item">Pricing</span>
        <span class="item">Partner</span>
        <span class="item">Resource <span class="caret"></span></span>
      </nav>
      <div class="nav-cta">
        <a class="login" href="#">Login</a>
        <a class="btn-pill" href="#">Try for Free <span class="arrow"></span></a>
      </div>
    </div>
  </header>

  <div class="announce">
    <a href="#">
      Vaudit surpasses <strong>$1B+</strong> in vendor spend audited
      <span class="arrow"></span>
    </a>
  </div>

  <!-- ─── Simulator ──────────────────────────────────── -->
  <section class="sim" id="sim">
    <h2 class="sim-title">Connect. Audit. Get Money Back</h2>
    <p class="sim-sub">See what Vaudit would recover for your business in under 10 seconds.</p>

    <form class="sim-input-row" id="simForm" autocomplete="off">
        <div class="sim-input-top">
          <span class="caret-i" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </span>
          <textarea id="simInput" rows="3" placeholder="Enter a website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…"></textarea>
        </div>
        <div class="sim-input-bottom">
          <div class="template-row" id="templateRow">
            <button class="template" data-vertical="saas" type="button">
              <svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
              <span>B2B SaaS</span>
            </button>
            <button class="template" data-vertical="ecomm" type="button">
              <svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span>D2C E-commerce</span>
            </button>
            <button class="template" data-vertical="fintech" type="button">
              <svg class="t-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              <span>Enterprise Fintech</span>
            </button>
            <button class="template-refresh" id="templateRefresh" type="button" aria-label="Shuffle template">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M21 21v-5h-5"/></svg>
            </button>
          </div>
          <button type="submit" class="sim-run" id="simRun">
            Run Audit
            <kbd class="sim-kbd" id="simKbdHint" aria-hidden="true">⌘↵</kbd>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>

        <!-- Scan panel — shown during .sim.scanning -->
        <div class="scan-panel" id="scanPanel" aria-live="polite">
          <div class="scan-header">
            <div class="scan-title-wrap">
              <span class="scan-eyebrow">Live Audit</span>
              <div class="scan-title" id="scanTitle">Finding your vendors<span class="scan-caret"></span></div>
            </div>
            <div>
              <div class="scan-total-label">Recoverable so far</div>
              <div class="scan-total" id="scanTotal">$0</div>
            </div>
          </div>
          <div class="scan-list" id="scanList"></div>
          <div class="scan-progress"><div class="scan-progress-fill" id="scanProgress"></div></div>
        </div>
      </form>
  </section>

  <!-- ─── Results ────────────────────────────────────── -->
  <section class="results" id="results" aria-live="polite">
    <div class="results-head">
      <div class="results-eyebrow" id="resultsEyebrow">What We Audit</div>
    </div>

    <div class="grid" id="grid">
      <!-- cards injected by JS -->
    </div>
  </section>

  <!-- ─── Visual (video only) ────────────────────────── -->
  <section class="hero hero--visual-only">
    <h2 class="hero-visual-headline">We audit your vendor bills</h2>
    <div class="visual">
      <video autoplay loop muted playsinline>
        <source src="vaudit-illustration.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>

    <div class="hero-ctas">
      <a class="hero-cta hero-cta--primary" href="https://app.vaudit.com/v2/sign-up">Start Your Free Audit <span class="arrow"></span></a>
      <a class="hero-cta hero-cta--secondary" href="#">Book a Demo</a>
    </div>

    <p class="hero-tagline">
      If you're overcharged, we prove it. If it shouldn't be billed, we recover it.<br>
      From ads to cloud to SaaS — Vaudit shows exactly where money is being wasted and gets it back.
    </p>
  </section>

  <div class="fab-stack" aria-hidden="true">
    <button class="fab" aria-label="Schedule">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    </button>
    <button class="fab" aria-label="Chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
  </div>

<script>
  // Module definitions — vendor-level breakdowns per audit thread.
  // Baseline (ecomm) annual USD. Other verticals apply a scale multiplier.
  const SIGNUP_URL = 'https://app.vaudit.com/v2/sign-up';

  // Product icons — Lucide-style line SVGs rendered in orange. Each string is
  // dropped into a .emoji span that sizes them via 1em so font-size controls scale.
  const ICON_CLOUD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
  const ICON_CHIP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`;
  const ICON_WINDOW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 9h20"/><circle cx="6" cy="6.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="6.5" r=".5" fill="currentColor"/></svg>`;
  const ICON_TRUCK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H2v14h2"/><path d="M14 9h4l4 4v5h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
  const ICON_CARD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`;
  const ICON_CLICK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z"/></svg>`;

  const MODULES = [
    { key:'ship',  name:'Ship ID',  emoji: ICON_TRUCK,
      desc:'Shipping & logistics overcharges.',
      longDesc:'Monitors shipments against carrier SLAs and contracted rates, then files claims automatically for late deliveries, DIM-weight errors, duplicate charges, and fuel surcharge discrepancies.',
      url:'https://www.vaudit.com/ship-id',
      ctas:{ audit:'Audit My Shipping' },
      verticals:['ecomm','default'],
      vendors:[
        { name:'FedEx', domain:'fedex.com', spend: 46800, waste: 4680 },
        { name:'UPS',   domain:'ups.com',   spend: 22680, waste: 2520 },
      ] },
    { key:'kloud', name:'Kloud ID', emoji: ICON_CLOUD,
      desc:'Idle cloud spend and overprovisioned resources.',
      longDesc:'Compares cloud usage against billing data to surface idle compute, orphaned storage, data transfer overcharges, and reserved-instance gaps that push committed workloads onto on-demand pricing.',
      url:'https://www.vaudit.com/kloud-id',
      ctas:{ audit:'Audit My Cloud' },
      vendors:[
        { name:'AWS EC2', domain:'aws.amazon.com', spend:109872, waste:18312 },
        { name:'AWS S3',  domain:'aws.amazon.com', spend: 78912, waste: 9864 },
      ] },
    { key:'seat',  name:'Seat ID',  emoji: ICON_WINDOW,
      desc:'Unused SaaS seats and tool overlap.',
      longDesc:'Connects to your SaaS apps and identity providers to map real usage against billed seats, flagging dormant licenses, post-offboarding accounts, and duplicate tool overlap draining budget.',
      url:'https://www.vaudit.com/seat-id',
      ctas:{ audit:'Audit My SaaS' },
      vendors:[
        { name:'Salesforce',       domain:'salesforce.com',       spend: 75648, waste: 9456 },
        { name:'Google Workspace', domain:'workspace.google.com', spend: 35700, waste: 5100 },
      ] },
    { key:'token', name:'Token ID', emoji: ICON_CHIP,
      desc:'AI and LLM usage waste.',
      longDesc:'Monitors API calls across your AI providers to catch retry loops, inefficient prompts, model-tier misallocation, and context-window waste inflating every billable token.',
      url:'https://www.vaudit.com/token-id',
      ctas:{ audit:'Audit My AI Spend' },
      vendors:[
        { name:'OpenAI',    domain:'openai.com',    spend: 48000, waste: 6000 },
        { name:'Anthropic', domain:'anthropic.com', spend: 22000, waste: 2200 },
      ] },
    { key:'ad',    name:'Ad ID',    emoji: ICON_CLICK,
      desc:'Ad spend waste and audience overlap.',
      longDesc:'Audits ad traffic against billing data to recover credits for invalid and non-human traffic, platform billing discrepancies, policy-level refund gaps, and unclaimed credits you\u2019re owed.',
      url:'https://www.vaudit.com/ad-id',
      ctas:{ audit:'Audit My Ads' },
      vendors:[
        { name:'Google Ads', domain:'ads.google.com', spend:103464, waste:17244 },
        { name:'Meta Ads',   domain:'meta.com',       spend: 93000, waste: 9300 },
      ] },
    { key:'pay',   name:'Pay ID',   emoji: ICON_CARD,
      desc:'Payment processor fee leakage.',
      longDesc:'Analyzes every transaction against contracted rates and industry benchmarks to surface interchange misclassification, hidden processor markups, failed-transaction charges, and chargeback discrepancies.',
      url:'https://www.vaudit.com/paymentid',
      ctas:{ audit:'Audit My Payments' },
      vendors:[
        { name:'Stripe', domain:'stripe.com', spend: 72648, waste:12108 },
        { name:'Adyen',  domain:'adyen.com',  spend: 52224, waste: 6528 },
      ] },
  ];

  const VAUDIT_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 L20.5 5 V12 C20.5 17 16.5 20 12 22 C7.5 20 3.5 17 3.5 12 V5 Z" fill="#f0651f"/><path d="M7.5 12.2 L10.8 15.3 L16.7 8.6" fill="none" stroke="#191a17" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const VAUDIT_LONG_DESC =
    'One recovery dashboard across every audit thread—cloud, SaaS seats, shipping, AI usage, ads, and payment processors—each vendor bill audited and recovered in a single claim.';

  const VAUDIT_URL = 'https://www.vaudit.com/';
  const VAUDIT_CTAS = {
    audit: 'Audit My Vendors',
  };

  const SCALE = { saas: 1.3, ecomm: 1.0, fintech: 2.0, default: 1.0 };

  // Conceptual preview animation per card — keyed by module (or 'vaudit' summary).
  // Each illustration is monochrome (white + orange) and loops seamlessly.
  const VIZ = {
    // 7 beams radiating outward from a central shield = one per audit thread
    vaudit: {
      html: `
        <div class="viz viz-vaudit">
          <svg viewBox="0 0 96 46" fill="none" aria-hidden="true">
            <g stroke="currentColor" stroke-width="1" stroke-linecap="round">
              <line class="vb b1" x1="48" y1="23" x2="48" y2="3"/>
              <line class="vb b2" x1="48" y1="23" x2="70" y2="8"/>
              <line class="vb b3" x1="48" y1="23" x2="80" y2="26"/>
              <line class="vb b4" x1="48" y1="23" x2="62" y2="42"/>
              <line class="vb b5" x1="48" y1="23" x2="34" y2="42"/>
              <line class="vb b6" x1="48" y1="23" x2="16" y2="26"/>
              <line class="vb b7" x1="48" y1="23" x2="26" y2="8"/>
            </g>
            <path d="M48 15 L55 17 V24 C55 28 52 30 48 32 C44 30 41 28 41 24 V17 Z"
                  fill="#191a17" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M44 23 L47 26 L52 20" stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </div>`,
    },

    // Package traveling the route; periodic credit "+" floats up = refund recovered
    ship: {
      html: `
        <div class="viz viz-ship">
          <span class="ship-path"></span>
          <span class="ship-credit">+$</span>
          <span class="ship-box"></span>
        </div>`,
    },

    // 5×2 grid: active seats pulse, dashed = billed-but-unused; scanner sweeps
    seat: {
      html: `
        <div class="viz viz-seat">
          <span class="seat-scan"></span>
          <div class="seat-grid">
            <span class="ss"></span>
            <span class="ss ss-empty"></span>
            <span class="ss"></span>
            <span class="ss"></span>
            <span class="ss ss-empty"></span>
            <span class="ss"></span>
            <span class="ss ss-empty"></span>
            <span class="ss"></span>
            <span class="ss"></span>
            <span class="ss ss-empty"></span>
          </div>
        </div>`,
    },

    // Bars oscillate below a dashed "paid capacity" ceiling — gap is waste
    kloud: {
      html: `
        <div class="viz viz-kloud">
          <span class="k-ceiling"></span>
          <div class="k-bars">
            <span class="kb"></span>
            <span class="kb"></span>
            <span class="kb"></span>
            <span class="kb"></span>
            <span class="kb"></span>
            <span class="kb"></span>
            <span class="kb"></span>
          </div>
        </div>`,
    },

    // Tokens stream left → right through a chip; nodes blink as they pass
    token: {
      html: `
        <div class="viz viz-token">
          <span class="t-flow tf1"></span>
          <span class="t-flow tf2"></span>
          <span class="t-flow tf3"></span>
          <div class="token-chip">
            <span class="token-node"></span>
            <span class="token-node"></span>
            <span class="token-node"></span>
            <span class="token-node"></span>
          </div>
        </div>`,
    },

    // Reticle with expanding audit rings; off-target "×" = flagged invalid clicks
    ad: {
      html: `
        <div class="viz viz-ad">
          <span class="ad-ring"></span>
          <span class="ad-ring r2"></span>
          <span class="ad-target"></span>
          <span class="ad-click ac1">×</span>
          <span class="ad-click ac2">×</span>
          <span class="ad-click ac3">×</span>
        </div>`,
    },

    // Ledger rows with a vertical scanner; one row pulses = flagged overcharge
    pay: {
      html: `
        <div class="viz viz-pay">
          <div class="pay-rows">
            <span class="pr"></span>
            <span class="pr pr-flag"></span>
            <span class="pr"></span>
            <span class="pr"></span>
          </div>
          <span class="pay-scan"></span>
        </div>`,
    },
  };

  const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
  const fmtK = n => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000)     return '$' + Math.round(n / 1_000) + 'k';
    return '$' + Math.round(n);
  };

  function chooseVertical() {
    const active = document.querySelector('.template.active');
    return active ? active.dataset.vertical : 'default';
  }

  const favicon = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  const logoImg = (domain, alt) =>
    `<img class="p-logo" src="${favicon(domain)}" alt="${alt||''}" aria-hidden="true" loading="lazy" onerror="this.style.display='none'" />`;

  // Single primary CTA — "Audit My X" swaps to an inline email-capture form on click.
  function ctaBlockHTML(ctas) {
    return `
      <div class="card-actions">
        <button class="action-audit-primary" type="button" data-audit-cta>${ctas.audit}</button>
        <form class="email-capture" data-email-form hidden>
          <input type="email" required placeholder="your@email.com" aria-label="Email" />
          <button type="submit">Continue →</button>
        </form>
      </div>
    `;
  }

  function vauditCardHTML(summariesWithDomains, vauditTotal) {
    const previewLogos = [...summariesWithDomains]
      .sort((a, b) => b.waste - a.waste)
      .slice(0, 3)
      .map(m => logoImg(m.domain, m.name))
      .join('');
    const iconRail = MODULES.map(m => `
      <span class="vaudit-thread" title="${m.name}" aria-label="${m.name}">
        <span class="vaudit-thread-icon">${m.emoji}</span>
        <span class="vaudit-thread-label">${m.name}</span>
      </span>
    `).join('');
    return `
      <!-- Preview layout: viz, sep, head row (title left, logos right), desc -->
      <div class="card-preview-viz">${VIZ.vaudit.html}</div>
      <hr class="preview-sep" />
      <div class="preview-head">
        <div class="preview-title">
          <span class="emoji emoji--logo">${VAUDIT_ICON}</span>
          <span class="vaudit-name-text">Vaudit</span>
        </div>
        <div class="preview-logos">${previewLogos}</div>
      </div>
      <p class="preview-desc">${VAUDIT_LONG_DESC}</p>

      <!-- Post-audit content (hidden until .card loses .preview) -->
      <div class="card-head">
        <div class="card-name">
          <span class="emoji emoji--logo">${VAUDIT_ICON}</span>
          <span class="vaudit-name-text">Vaudit</span>
        </div>
        <div class="card-badge">Summary</div>
      </div>
      <div class="vaudit-hero">
        <div class="card-amount vaudit-amount" data-target="${vauditTotal}">$0</div>
        <div class="vaudit-label">Total recoverable across 6 audit threads</div>
      </div>
      <div class="vaudit-threads">
        <div class="vaudit-threads-head">Breakdown</div>
        <div class="vaudit-icons">${iconRail}</div>
      </div>
      ${ctaBlockHTML(VAUDIT_CTAS)}
    `;
  }

  function moduleCardHTML(m, vendors, moduleTotal) {
    const viz = VIZ[m.key] || { html: '' };
    const previewLogos = m.vendors.map(v => logoImg(v.domain, v.name)).join('');
    return `
      <!-- Preview layout: viz, sep, head row (title left, logos right), desc -->
      <div class="card-preview-viz">${viz.html}</div>
      <hr class="preview-sep" />
      <div class="preview-head">
        <div class="preview-title"><span class="emoji">${m.emoji}</span>${m.name}</div>
        <div class="preview-logos">${previewLogos}</div>
      </div>
      <p class="preview-desc">${m.longDesc || m.desc}</p>

      <!-- Post-audit content: header → hero amount → vendor rows → CTA -->
      <div class="card-head">
        <div class="card-name"><span class="emoji">${m.emoji}</span>${m.name}</div>
        <div class="card-badge">Completed</div>
      </div>
      <div class="card-hero">
        <div class="card-amount" data-target="${moduleTotal}">$0</div>
        <p class="card-desc">${m.desc}</p>
      </div>
      <div class="card-vendors">
        ${vendors.map(v => `
          <div class="card-vendor">
            <div class="card-vendor-name"><img class="card-vendor-logo" src="${favicon(v.domain)}" alt="" aria-hidden="true" loading="lazy" onerror="this.style.display='none'" />${v.name}</div>
            <div class="card-vendor-fig">
              <span class="card-vendor-spend">${fmtK(v.spend)} spend</span>
              <span class="card-vendor-waste">${fmt(v.waste)} wasted</span>
            </div>
          </div>
        `).join('')}
      </div>
      ${ctaBlockHTML(m.ctas)}
    `;
  }

  // Build all 7 cards in preview state using the default vertical for
  // baseline figures. Values stay hidden until audit runs.
  function renderCards() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const scale = SCALE.default;

    const summaries = MODULES.map(m => ({
      name: m.name, emoji: m.emoji,
      domain: m.vendors[0].domain,
      waste: m.vendors.reduce((s, v) => s + v.waste * scale, 0),
      spend: m.vendors.reduce((s, v) => s + v.spend * scale, 0),
    }));
    const vauditTotal = summaries.reduce((s, m) => s + m.waste, 0);

    const vaudit = document.createElement('article');
    vaudit.className = 'card preview';
    vaudit.dataset.key = 'vaudit';
    vaudit.innerHTML = vauditCardHTML(summaries, vauditTotal);
    grid.appendChild(vaudit);

    MODULES.forEach(m => {
      const vendors = m.vendors.map(v => ({ ...v, spend: v.spend * scale, waste: v.waste * scale }));
      const moduleTotal = vendors.reduce((s, v) => s + v.waste, 0);
      const card = document.createElement('article');
      card.className = 'card preview';
      card.dataset.key = m.key;
      card.innerHTML = moduleCardHTML(m, vendors, moduleTotal);
      grid.appendChild(card);
    });
  }

  // Recompute vendor figures + amount targets for the chosen vertical,
  // so cards show accurate numbers for that template once revealed.
  function recomputeCardTargets(vertical) {
    const scale = SCALE[vertical] ?? 1;
    MODULES.forEach(m => {
      const card = document.querySelector(`.card[data-key="${m.key}"]`);
      if (!card) return;
      const vendors = m.vendors.map(v => ({ ...v, spend: v.spend * scale, waste: v.waste * scale }));
      const moduleTotal = vendors.reduce((s, v) => s + v.waste, 0);
      card.querySelector('.card-amount').dataset.target = moduleTotal;
      card.querySelectorAll('.card-vendor').forEach((row, i) => {
        const v = vendors[i]; if (!v) return;
        row.querySelector('.card-vendor-waste').textContent = fmt(v.waste) + ' wasted';
        row.querySelector('.card-vendor-spend').textContent = fmtK(v.spend) + ' spend';
      });
    });

    // Vaudit summary card — aggregate over APPLICABLE modules only
    const applicable = MODULES.filter(m => !m.verticals || m.verticals.includes(vertical));
    const summaries = applicable.map(m => ({
      name: m.name, emoji: m.emoji,
      waste: m.vendors.reduce((s, v) => s + v.waste * scale, 0),
      spend: m.vendors.reduce((s, v) => s + v.spend * scale, 0),
    }));
    const vauditTotal = summaries.reduce((s, m) => s + m.waste, 0);

    const vauditCard = document.querySelector('.card[data-key="vaudit"]');
    if (!vauditCard) return vauditTotal;
    vauditCard.querySelector('.card-amount').dataset.target = vauditTotal;
    return vauditTotal;
  }

  // Flip one card from preview → complete, animate its amount, bloom on finish.
  function revealCard(key) {
    const card = document.querySelector(`.card[data-key="${key}"]`);
    if (!card) return;
    card.classList.remove('preview');
    card.classList.add('revealing');
    setTimeout(() => card.classList.remove('revealing'), 700);
    const amountEl = card.querySelector('.card-amount');
    const target = +amountEl.dataset.target;
    animateNumber(amountEl, target, 900, () => {
      amountEl.classList.add('pulse');
      setTimeout(() => amountEl.classList.remove('pulse'), 500);
    });
  }

  function animateNumber(el, target, duration, onDone) {
    const start = performance.now();
    const from = 0;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      // easeOutExpo for a snappy but relaxed finish
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      el.textContent = fmt(from + (target - from) * eased);
      if (t < 1) requestAnimationFrame(frame);
      else if (onDone) onDone();
    }
    requestAnimationFrame(frame);
  }

  // template selection — click marks active AND fills the textarea with the label
  document.getElementById('templateRow').addEventListener('click', e => {
    const btn = e.target.closest('.template');
    if (!btn) return;
    document.querySelectorAll('.template').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    const label = btn.querySelector('span')?.textContent?.trim();
    const input = document.getElementById('simInput');
    if (label && input) {
      input.value = label;
      input.focus();
    }
  });

  // template refresh — pick a random non-active template
  document.getElementById('templateRefresh').addEventListener('click', e => {
    const btn = e.currentTarget;
    const all = Array.from(document.querySelectorAll('.template'));
    const current = document.querySelector('.template.active');
    const pool = all.filter(t => t !== current);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    all.forEach(t => t.classList.remove('active'));
    pick.classList.add('active');
    btn.classList.add('spin');
    setTimeout(() => btn.classList.remove('spin'), 300);
  });

  const wait = ms => new Promise(r => setTimeout(r, ms));

  async function runScanSequence(vertical) {
    const sim       = document.getElementById('sim');
    const run       = document.getElementById('simRun');
    const scanList  = document.getElementById('scanList');
    const scanTotal = document.getElementById('scanTotal');
    const scanTitle = document.getElementById('scanTitle');
    const progress  = document.getElementById('scanProgress');

    // Sync card targets + vendor figures to the selected vertical first,
    // so reveals show the right numbers.
    const vauditTotal = recomputeCardTargets(vertical);

    const scale = SCALE[vertical] ?? 1;
    const applicable = MODULES.filter(m => !m.verticals || m.verticals.includes(vertical));

    scanList.innerHTML = applicable.map(m => `
      <div class="scan-item pending" data-key="${m.key}">
        <span class="scan-status"></span>
        <span class="scan-item-name"><span class="emoji">${m.emoji}</span>${m.name}</span>
        <span class="scan-item-vendor">pending</span>
        <span class="scan-item-amount">$0</span>
      </div>
    `).join('');

    sim.classList.add('scanning');
    document.getElementById('results')?.classList.add('scanning');
    run.disabled = true;
    scanTotal.textContent = '$0';
    progress.style.width = '0%';
    scanTitle.innerHTML = 'Finding your vendors<span class="scan-caret"></span>';

    await wait(650);
    scanTitle.innerHTML = 'Sizing your business<span class="scan-caret"></span>';
    await wait(650);
    scanTitle.innerHTML = 'Running the audit<span class="scan-caret"></span>';

    let running = 0;
    for (let i = 0; i < applicable.length; i++) {
      const m = applicable[i];
      const item     = scanList.querySelector(`[data-key="${m.key}"]`);
      const vendorEl = item.querySelector('.scan-item-vendor');
      const amountEl = item.querySelector('.scan-item-amount');
      const moduleTotal = m.vendors.reduce((s, v) => s + v.waste, 0) * scale;

      item.classList.remove('pending');
      item.classList.add('active');
      vendorEl.textContent = `checking ${m.vendors[0].name}…`;
      await wait(300);

      if (m.vendors[1]) {
        vendorEl.textContent = `checking ${m.vendors[1].name}…`;
        await wait(280);
      }

      item.classList.remove('active');
      item.classList.add('done');
      vendorEl.textContent = `${m.vendors.map(v => v.name).join(', ')}`;
      animateNumber(amountEl, moduleTotal, 500);
      running += moduleTotal;
      animateNumber(scanTotal, running, 600);

      // Reveal the matching grid card — preview → complete, in sync
      revealCard(m.key);

      progress.style.width = `${((i + 1) / applicable.length) * 100}%`;
      await wait(180);
    }

    scanTitle.innerHTML = 'Totaling your recoverable<span class="scan-caret"></span>';
    await wait(500);

    // Finally reveal the Vaudit summary card
    revealCard('vaudit');

    scanTitle.innerHTML = 'Audit complete';
    await wait(350);

    sim.classList.remove('scanning');
    document.getElementById('results')?.classList.remove('scanning');
    run.disabled = false;
  }

  // Build preview cards on page load
  renderCards();

  // ─── Primary "Audit My X" CTA — swap to inline email capture, then proceed ───
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-audit-cta]');
    if (!btn) return;
    const actions = btn.closest('.card-actions');
    if (!actions) return;
    const form = actions.querySelector('[data-email-form]');
    if (!form) return;
    btn.hidden = true;
    form.hidden = false;
    form.querySelector('input')?.focus();
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-email-form]');
    if (!form) return;
    e.preventDefault();
    const email = form.querySelector('input')?.value?.trim();
    if (!email) return;
    const url = `${SIGNUP_URL}?email=${encodeURIComponent(email)}`;
    window.open(url, '_blank', 'noopener');
  });

  // Form submit
  document.getElementById('simForm').addEventListener('submit', e => {
    e.preventDefault();
    // Move focus into the scan panel so keyboard users don't lose their place
    // when the textarea + chip row unmount. scanPanel has tabindex="-1".
    const panel = document.getElementById('scanPanel');
    if (panel) { panel.setAttribute('tabindex', '-1'); panel.focus({ preventScroll: true }); }
    runScanSequence(chooseVertical());
  });

  // Enter submits the form; Shift+Enter inserts a newline
  const simInput = document.getElementById('simInput');
  simInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('simForm').requestSubmit();
    }
  });

  // Keyboard hint: plain Enter submits
  (() => {
    const hint = document.getElementById('simKbdHint');
    if (hint) hint.textContent = '↵';
  })();

</script>

</body>
</html>

```
