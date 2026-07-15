// Resolves the URL prefix that this bundle was served from, so components
// can reference repo-bundled assets (under `assets/...`) without hardcoding
// a host. We capture `document.currentScript` at module-eval time — the
// IIFE bundle runs synchronously, so this is the loading <script> tag.
// The backend serves the bundle and its `assets/` sibling from the same
// directory (e.g. https://api.vaudit.com/static/components/vaudit.js →
// https://api.vaudit.com/static/components/assets/...).

const FALLBACK_BASE = "https://api.vaudit.com/static/components/";

function detectBase(): string {
  if (typeof document === "undefined") return FALLBACK_BASE;
  const override = (window as unknown as { VAUDIT_ASSET_BASE?: string })
    .VAUDIT_ASSET_BASE;
  if (override) return override.endsWith("/") ? override : override + "/";
  const script = document.currentScript as HTMLScriptElement | null;
  const src = script?.src;
  if (!src) return FALLBACK_BASE;
  // src like ".../static/components/vaudit.js" — strip the filename, keep the dir
  const idx = src.lastIndexOf("/");
  if (idx === -1) return FALLBACK_BASE;
  return src.slice(0, idx + 1);
}

const BASE = detectBase();

export function assetUrl(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return BASE + path.replace(/^\/+/, "");
}
