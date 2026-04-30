# Webflow theme convention (Vaudit)

## How dark mode works on this site

One class, on one element:

- A HEAD bootstrap script toggles `html.dark` synchronously (before the body
  renders) based on `localStorage('vaudit-theme')`, falling back to
  `prefers-color-scheme`.
- A FOOTER script wires up the site's theme toggle button and persists the
  user's choice to `localStorage`.

That's it. No JS toggles `dark` on individual elements, on `body`, or on
descendants. All dark overrides are plain CSS:

```css
.some-class       { /* light styles */ }
html.dark .some-class { /* dark overrides */ }
```

Most overrides live in
[`webflow/body-dark-cascade.css`](webflow/body-dark-cascade.css). Per-feature
pasted stylesheets (e.g.
[`webflow/presignup-agent.css`](webflow/presignup-agent.css),
[`webflow/partner-how-it-works.css`](webflow/partner-how-it-works.css)) define
their own `html.dark .feature-*` rules inside the same file.

## How to add a new themeable section

1. Pick a base class name for each element that needs theming
   (e.g. `partner-why-heading`).
2. Style it **light** on that base class.
3. Add the dark overrides in CSS as `html.dark .base-class { … }`.
4. Done. No Designer work for dark, no combo classes, no script changes.

### Two conveniences

- **Skip dark if the section is the same in both themes.** A fixed-palette
  section (e.g. the orange revenue-math left panel) just doesn't get any
  `html.dark` rules — it renders the same in both themes.
- **Use design tokens when possible.** `:root` defines `--bg`,
  `--text-primary`, `--text-secondary`, `--border`, etc.; `html.dark`
  re-declares them. Any selector that uses those variables gets dark mode for
  free without needing a separate `html.dark` rule.

## Logo swaps

Pure CSS, no JS. Markup uses two images per slot:

```html
<img class="logo-white" … />
<img class="logo-dark" … />
```

`body-dark-cascade.css` shows/hides via `display`:

```css
.logo-dark,  .hero-mv-dark  { display: none; }
.logo-white, .hero-mv-white { display: block; }

html.dark .logo-white,
html.dark .hero-mv-white    { display: none; }

html.dark .logo-dark,
html.dark .hero-mv-dark     { display: block; }
```

## CTAs — link blocks, not buttons

Use **Link blocks** with classes `primary-btn` / `secondary-btn` on the block
and `primary-btn-text` / `secondary-btn-text` on the inner label. Webflow's
native `Button` element does not support the icon-plus-text layout this site
needs. In `element_tool.get_all_elements` output, link blocks often show as
`type: "Link"` — that's still the block-level link, not a text link.

If a label does not pick up typography in Designer, assign the text class
(`primary-btn-text` / `secondary-btn-text`) in the Style panel once and
confirm the published HTML exposes it.

## Reference classes and their dark overrides

The authoritative set of `html.dark .class { … }` rules lives in
[`webflow/body-dark-cascade.css`](webflow/body-dark-cascade.css) and in each
per-feature CSS file. Read those files directly rather than maintaining a
table here — the CSS is the spec.

Key sections that have dark overrides today (read the CSS for exact values):

- Hero and hero-lp-* (headline, eyebrow, sub, glow, section surface)
- Nav + announcement strip (`nav-33`, `announcement`, `nav-dropdown-*`)
- Partner "Why", "What This Unlocks" cards, "How It Works" timeline
- Revenue Math right-side scenario card
- Pre-signup agent (`presignup-agent-*` — see `webflow/presignup-agent.css`)

Sections that **intentionally have no dark override** (same in both themes):

- Revenue Math left orange panel (`partner-rev-math-left-*`)
- "How It Works" orange spine, icon-box borders, and step titles

## Full theme script reference

Live copy is in [`webflow/theme-custom-code.html`](webflow/theme-custom-code.html).
Summary of what it does:

```html
<!-- HEAD (runs before body) -->
<script>
  (function () {
    try {
      var saved = localStorage.getItem("vaudit-theme");
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isDark = saved === "dark" || (!saved && prefersDark);
      document.documentElement.classList.toggle("dark", isDark);
    } catch (e) {}
  })();
</script>

<!-- FOOTER (before </body>) -->
<script>
  document.addEventListener("DOMContentLoaded", function () {
    var STORAGE_KEY = "vaudit-theme";
    function applyTheme(isDark) {
      document.documentElement.classList.toggle("dark", isDark);
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    }
    var toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        applyTheme(!document.documentElement.classList.contains("dark"));
      });
    }
    window.vauditApplyTheme = applyTheme;
  });
</script>
```

No element-walking, no class lists, no combo classes.

## Checklist for new sections

1. Style **light** on the base class.
2. Write `html.dark .base-class { … }` for the dark overrides in the same
   stylesheet.
3. If you need media swaps by theme, reuse the `logo-white` / `logo-dark`
   (or `hero-mv-*`) pattern above.

## MCP / AI note

When building native Webflow elements for this site via MCP, default to
**light-first** base classes. Do **not** add `dark` combo classes on the
elements — the site no longer uses that pattern. If you see an older
stylesheet or doc that still targets a `.class.dark` combo selector, treat it
as legacy and migrate it to `html.dark .class` during your change.

For **CTAs**, use **`LinkBlock`** with **`primary-btn` / `secondary-btn`** —
**never** **`Button`**. Add **`primary-btn-text` / `secondary-btn-text`** on
the label text inside the block so icons + copy layout correctly.
