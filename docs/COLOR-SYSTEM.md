# Vaudit color system (Partner / global reference)

Use these tokens for new Webflow utilities and custom CSS. **Prefer Webflow variables** from **Base collection** (already on the site):

| Token | Hex | Webflow variable (name / id) |
|--------|-----|------------------------------|
| Primary | `#fe602c` | `Primary` / `variable-2a521ac9-1454-2d93-10d0-3ba193f42abe` |
| Primary accent | `#ffcebe` | `primary-accent` / `variable-421b8a13-a2f9-bdb0-e8cf-f4127ea0241a` |
| Charcoal 900 | `#1a1a18` | `charcoal-900` / `variable-2eac1d82-7b57-cf91-a16a-80b3d023bd0c` |
| Charcoal 700 (border dark) | `#2e2e2a` | `charcoal-700` / `variable-f2c0ea33-907f-0690-c594-a128cdb393e2` |
| Charcoal 100 (muted on dark UI) | `#d4d4cc` | `charcoal-100` / `variable-a9167af9-4ab1-19d3-0341-782b1e237535` |
| Muted foreground (light UI) | `#64748b` | `--muted-foreground` / `variable-595acbdf-c31e-bbdc-fc20-2a3914acc662` |
| Sidebar border (light UI) | `#e2e8f0` | `--sidebar-border` / `variable-68777d99-90ee-e4c0-7c92-5754640fb06a` |

| Role | Light | Dark |
|------|--------|------|
| **Page background** | `#ffffff` | `#1a1a18` (`charcoal-900`) |
| **Page foreground** | `#1a1a18` | `#ffffff` |
| **Muted text** (class `text-muted-foreground` on light surfaces) | `#64748b` | `#d4d4cc` |
| **Border** (class `sidebar-border` pattern) | `#e2e8f0` | `#2e2e2a` |

**Note:** The **How it works** strip uses a **charcoal** background in both themes. Step descriptions use class **`partner-timeline-body`** (charcoal-100) so contrast stays correct; do not use `text-muted-foreground` there.

## Theme pattern

Dark overrides are written as `html.dark .class { … }` rules in CSS (see `WEBFLOW-THEME-CONVENTION.md`). For muted text, `html.dark .text-muted-foreground { color: #d4d4cc; }` lives in `webflow/body-dark-cascade.css`. No combo classes, no JS class list.

## Partner page sections

- **Hero:** Dark surface `#1a1a18`, primary glow `#fe602c`, minimal chrome.
- **Revenue math (split):** Left solid primary `#fe602c`, white + charcoal pills; right dark card `#1a1a18` on light bg (dark mode: section bg `#1a1a18`, card border `#2e2e2a`).
- **Timeline:** Dark/black section, primary spine and step titles, muted body text per table above.
