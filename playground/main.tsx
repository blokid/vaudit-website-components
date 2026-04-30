import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { registry, componentNames } from "../src/registry";

function readHashState(): { name: string | null; variant: string | null } {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [name, params] = hash.split("?");
  const search = new URLSearchParams(params || "");
  return {
    name: name || null,
    variant: search.get("variant"),
  };
}

function writeHashState(name: string, variant: string): void {
  const next = `#/${name}?variant=${encodeURIComponent(variant)}`;
  if (window.location.hash !== next) {
    history.replaceState(null, "", next);
  }
}

function readTheme(): "light" | "dark" {
  return localStorage.getItem("pg-theme") === "dark" ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("pg-theme", theme);
}

function App() {
  const initial = readHashState();
  const fallbackName = componentNames[0] ?? null;

  const [name, setName] = useState<string | null>(
    initial.name && registry[initial.name] ? initial.name : fallbackName,
  );
  const [variantKey, setVariantKey] = useState<string>(initial.variant ?? "default");
  const [theme, setTheme] = useState<"light" | "dark">(readTheme);
  const [propsJson, setPropsJson] = useState<string>("{}");
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const entry = name ? registry[name] : null;
  const variants = entry?.meta?.variants ?? {};
  const variantNames = useMemo(() => {
    const keys = Object.keys(variants);
    return keys.length ? keys : ["default"];
  }, [variants]);

  // Sync variantKey when name changes or current key disappears.
  useEffect(() => {
    if (!variantNames.includes(variantKey)) {
      setVariantKey(variantNames[0] ?? "default");
    }
  }, [variantNames, variantKey]);

  // Pre-populate JSON editor from the active variant.
  useEffect(() => {
    const preset = (variants as Record<string, unknown>)[variantKey];
    setPropsJson(JSON.stringify(preset ?? {}, null, 2));
    setParseError(null);
  }, [variants, variantKey]);

  // Keep URL hash synced.
  useEffect(() => {
    if (name) writeHashState(name, variantKey);
  }, [name, variantKey]);

  const parsedProps = useMemo<Record<string, unknown>>(() => {
    try {
      const parsed = JSON.parse(propsJson || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      throw new Error("Props must be a JSON object");
    } catch (err) {
      // Don't update render on parse error; keep last good props.
      return {};
    }
  }, [propsJson]);

  // Validate JSON for inline error message.
  useEffect(() => {
    try {
      const parsed = JSON.parse(propsJson || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setParseError(null);
      } else {
        setParseError("Props must be a JSON object");
      }
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }, [propsJson]);

  if (!entry || !name) {
    return <div className="pg-empty">No components registered yet.</div>;
  }

  const Component = entry.Component;

  return (
    <div className="pg-app">
      <aside className="pg-sidebar">
        <h1>Components</h1>
        <ul>
          {componentNames.map((n) => (
            <li key={n}>
              <button
                type="button"
                className={n === name ? "is-active" : undefined}
                onClick={() => setName(n)}
              >
                {n}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="pg-main">
        <div className="pg-toolbar">
          <h2>{name}</h2>
          {entry.meta?.description ? (
            <span className="description">{entry.meta.description}</span>
          ) : (
            <span style={{ flex: 1 }} />
          )}

          <label className="pg-control">
            variant
            <select
              value={variantKey}
              onChange={(e) => setVariantKey(e.target.value)}
            >
              {variantNames.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <span className="pg-control">
            theme
            <button
              type="button"
              className={theme === "light" ? "is-active" : undefined}
              onClick={() => setTheme("light")}
            >
              light
            </button>
            <button
              type="button"
              className={theme === "dark" ? "is-active" : undefined}
              onClick={() => setTheme("dark")}
            >
              dark
            </button>
          </span>
        </div>

        <section className="pg-stage pg-stage--full-width">
          <Component {...(parsedProps as Record<string, unknown>)} />
        </section>

        <section className="pg-prop-editor">
          <label htmlFor="props-editor">props (JSON — same shape as data-prop in Webflow)</label>
          <textarea
            id="props-editor"
            value={propsJson}
            onChange={(e) => setPropsJson(e.target.value)}
            spellCheck={false}
          />
          {parseError && <div className="pg-error">{parseError}</div>}
        </section>
      </main>
    </div>
  );
}

const root = createRoot(document.getElementById("playground-root")!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
