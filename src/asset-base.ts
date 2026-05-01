// Resolves the URL prefix that this bundle was served from, so components
// can reference repo-bundled assets (under `assets/...`) without hardcoding
// a tag. We capture `document.currentScript` at module-eval time — the
// IIFE bundle runs synchronously, so this is the loading <script> tag.

const FALLBACK_BASE =
  "https://cdn.jsdelivr.net/gh/blokid/vaudit-website-components@main/";

function detectBase(): string {
  if (typeof document === "undefined") return FALLBACK_BASE;
  const script = document.currentScript as HTMLScriptElement | null;
  const src = script?.src;
  if (!src) return FALLBACK_BASE;
  // src like ".../@v0.10.0/dist/vaudit.js" — strip the trailing `dist/vaudit.js`
  const idx = src.lastIndexOf("/dist/");
  if (idx === -1) return FALLBACK_BASE;
  return src.slice(0, idx + 1);
}

const BASE = detectBase();

export function assetUrl(path: string): string {
  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
  return BASE + path.replace(/^\/+/, "");
}
