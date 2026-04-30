# theme-custom-code.html

> Source from `vaudit-website-pages/webflow/theme-custom-code.html`. Pasted into Webflow Custom Code or Embed elements — **not consumed by the Vite build**. Kept here as a reference snapshot of the legacy workflow.

```html
<!--
  Webflow: Project Settings → Custom Code

  HEAD (in order):
  1) body-dark-cascade.css inside <style>…</style>
  2) Theme bootstrap (html.dark from localStorage)
  3) Paint-block bootstrap — hides <html> until canvas-hide.js reveals it,
     so users see one correct frame instead of hero-first then shift.
     Includes a <noscript> fallback so JS-disabled users still see the page.
  4) canvas-hide.js (hosted externally) — removes `.canvas-hide` on
     DOMContentLoaded, restores <html> visibility, and sets
     `scrollRestoration: manual`. MUST run before first paint, so it lives
     in HEAD, synchronous.
  5) Nav dropdown fix — runs immediately so it registers before late page injections
     (e.g. Vue.js DevTools: chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)

  FOOTER (before </body>):
  - Theme toggle script only

  Logos / hero: html.dark rules in body-dark-cascade.css
-->

<!-- ========== HEAD — theme bootstrap ========== -->
<script>
  (function () {
    try {
      var saved = localStorage.getItem('vaudit-theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = saved === 'dark' || (!saved && prefersDark);
      document.documentElement.classList.toggle('dark', isDark);
    } catch (e) {}
  })();
</script>

<!-- ========== HEAD — paint-block (hide until canvas-hide reveal) ========== -->
<style>html { visibility: hidden; }</style>
<noscript><style>html { visibility: visible !important; }</style></noscript>
<script src="https://<YOUR-CDN>/canvas-hide.js"></script>

<!-- ========== HEAD — nav dropdowns (Vue DevTools–safe ordering) ========== -->
<script>
  (function () {
    function closeAllNavDropdowns() {
      document.querySelectorAll('.nav-link-dropdown.w-dropdown').forEach(function (dd) {
        dd.classList.remove('w--open');
        var list = dd.querySelector('.w-dropdown-list');
        var tg = dd.querySelector('.w-dropdown-toggle');
        if (list) list.classList.remove('w--open');
        if (tg) tg.classList.remove('w--open');
      });
    }

    function toggleFromTrigger(tgl) {
      var dd = tgl && tgl.closest('.nav-link-dropdown.w-dropdown');
      if (!dd) return;
      var opening = !dd.classList.contains('w--open');
      closeAllNavDropdowns();
      if (opening) {
        dd.classList.add('w--open');
        var list = dd.querySelector('.w-dropdown-list');
        if (list) list.classList.add('w--open');
        tgl.classList.add('w--open');
      }
    }

    /* Capture on document runs early; pointerdown often survives extensions that eat click. */
    function onPointerDown(ev) {
      var tgl = ev.target.closest('.nav-link-dropdown.w-dropdown .w-dropdown-toggle');
      if (tgl) {
        ev.preventDefault();
        ev.stopImmediatePropagation();
        toggleFromTrigger(tgl);
        return;
      }
      if (!ev.target.closest('.nav-link-dropdown.w-dropdown')) {
        closeAllNavDropdowns();
      }
    }

    if (typeof PointerEvent !== 'undefined') {
      document.addEventListener('pointerdown', onPointerDown, true);
    } else {
      document.addEventListener('mousedown', onPointerDown, true);
    }

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        closeAllNavDropdowns();
        return;
      }
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var tgl = ev.target.closest('.nav-link-dropdown.w-dropdown .w-dropdown-toggle');
      if (!tgl) return;
      ev.preventDefault();
      ev.stopImmediatePropagation();
      toggleFromTrigger(tgl);
    }, true);
  })();
</script>

<!-- ========== BEFORE </body> — theme toggle ========== -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    try {
      var STORAGE_KEY = 'vaudit-theme';

      function applyTheme(isDark) {
        document.documentElement.classList.toggle('dark', isDark);
        localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
      }

      var toggle = document.getElementById('themeToggle');
      if (toggle) {
        toggle.addEventListener('click', function () {
          var isDark = !document.documentElement.classList.contains('dark');
          applyTheme(isDark);
        });
      }

      window.vauditApplyTheme = applyTheme;
    } catch (e) {
      console.error('Theme error:', e);
    }
  });
</script>

```
