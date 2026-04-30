# partner-how-it-works.css

> Source from `vaudit-website-pages/webflow/partner-how-it-works.css`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```css
/**
 * Partner "How it works" — spine + icon boxes (4 steps)
 * Paste into Webflow: Page Settings → Custom Code → Head (wrap in <style>)
 * or Site Settings → Custom Code → Footer before closing </body>.
 *
 * HTML structure: see WEBFLOW-THEME-CONVENTION.md § How It Works (updated).
 * Section wrapper: `partner-hw-section` transparent in light (Webflow); white lives on `partner-hw-split-host` / timeline column.
 */

.partner-hw-timeline {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  max-width: 42rem;
  margin-left: auto;
  margin-right: auto;
  padding: 0.5rem 1rem 0.5rem 0.25rem;
}

/* Continuous orange spine behind steps */
.partner-hw-spine {
  position: absolute;
  left: 27px;
  top: 0;
  bottom: 0;
  width: 14px;
  transform: translateX(-50%);
  background: #fe602c;
  border-radius: 4px;
  z-index: 0;
  pointer-events: none;
}

.partner-hw-step {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1.25rem;
}

.partner-hw-icon-wrap {
  flex: 0 0 56px;
  width: 56px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* White square on the spine, orange border, tail → copy */
.partner-hw-icon-box {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  background: #ffffff;
  border: 2px solid #fe602c;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-sizing: border-box;
}

.partner-hw-icon-box::after {
  content: "";
  position: absolute;
  right: -9px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 7px 0 7px 9px;
  border-color: transparent transparent transparent #fe602c;
}

/* Icons: add Image, SVG, or embed inside .partner-hw-icon-box in Designer when ready. */
.partner-hw-icon-box > img,
.partner-hw-icon-box > svg {
  max-width: 70%;
  max-height: 70%;
  object-fit: contain;
}

.partner-hw-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 0;
}

.partner-hw-step-title {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.25;
  color: #fe602c;
}

.partner-hw-step-desc {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: #64748b;
}

.partner-hw-step-desc ul {
  margin: 0.35rem 0 0;
  padding-left: 1.15rem;
}

.partner-hw-step-desc li {
  margin-bottom: 0.2rem;
}

.partner-hw-step-desc li:last-child {
  margin-bottom: 0;
}

/* Dark: html.dark .partner-hw-icon-box / .partner-hw-step-desc — site head
   body-dark-cascade.css (Partner + hero section). */

@media (max-width: 479px) {
  .partner-hw-timeline {
    gap: 1.75rem;
    padding-left: 0;
  }

  .partner-hw-spine {
    left: 28px;
    width: 10px;
  }

  .partner-hw-step {
    gap: 0.875rem;
  }

  .partner-hw-icon-wrap {
    flex-basis: 48px;
    width: 48px;
  }

  .partner-hw-icon-box {
    width: 48px;
    height: 48px;
    border-radius: 6px;
  }

  .partner-hw-step-title {
    font-size: 1.1rem;
  }
}

```
