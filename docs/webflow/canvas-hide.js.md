# canvas-hide.js

> Source from `vaudit-website-pages/webflow/canvas-hide.js`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```js
/*
 * canvas-hide.js
 *
 * Pattern: in Webflow Style panel, apply `display: none` to the `.canvas-hide`
 * class so sections are invisible in canvas (Code Embeds render as ugly
 * placeholders otherwise). This script removes the class at runtime. Works in
 * Preview Mode, staging, and production.
 *
 * Paint-blocking: a matching inline <style> in <head> sets
 * `html { visibility: hidden }` before first paint. This script sets it back
 * to `visible` after the reveal pass on DOMContentLoaded, so the user sees
 * one correct frame instead of (hero-first → shift → snap). A safety
 * setTimeout guarantees the page is never left invisible even if something
 * throws. A <noscript> rule in HEAD covers JS-disabled users.
 *
 * Also sets `history.scrollRestoration = 'manual'` so a reload never tries
 * to restore a stale scroll offset against the short (canvas-hidden) layout.
 * Trade-off: back/forward navigation also opens at top on pages that load
 * this script.
 *
 * Must be loaded in <head>, synchronously, before any other page JS.
 */
(function () {
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }

  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    var nodes = document.querySelectorAll(".canvas-hide");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.remove("canvas-hide");
    }
    document.documentElement.style.visibility = "visible";
  }

  // Safety net — never leave the page invisible if something throws.
  setTimeout(reveal, 1500);

  if (document.readyState !== "loading") {
    reveal();
  } else {
    document.addEventListener("DOMContentLoaded", reveal);
  }
})();

```
