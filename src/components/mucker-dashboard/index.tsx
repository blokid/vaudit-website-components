import { useMemo, useState } from "react";
import type { ComponentMeta } from "../../registry";
import type { CompanyData } from "./types";
import { COMPANIES as DEFAULT_COMPANIES } from "./companies";
import Tile from "./tile";
import Sheet from "./sheet";
import "./mucker-dashboard.css";

type MuckerDashboardProps = {
  /** Inline companies list. When omitted, falls back to the bundled COMPANIES. */
  companies?: CompanyData[];
  /** Search input placeholder. */
  searchPlaceholder?: string;
  /** Override the agent base URL passed to the embedded presignup-agent. */
  agentBaseUrl?: string;
};

export const meta: ComponentMeta<MuckerDashboardProps> = {
  description:
    "Mucker × Vaudit portfolio dashboard — 50-tile grid with right-side sheet detail view (vendor list, category chart, mini results-grid, and replayed presignup-agent chat).",
  props: {
    companies: {
      type: "CompanyData[]",
      description: "Inline company list. Defaults to the bundled sample data.",
      default: "(bundled sample)",
    },
    searchPlaceholder: {
      type: "string",
      description: "Placeholder text for the search input.",
      default: "Search by company or domain…",
    },
    agentBaseUrl: {
      type: "string",
      description:
        "Forwarded to the embedded presignup-agent. Override when phase-2 should hit a non-default backend.",
      default: "auto-detect",
    },
  },
  variants: {
    "default": {},
  },
};

export default function MuckerDashboard({
  companies,
  searchPlaceholder = "Search by company or domain…",
  agentBaseUrl,
}: MuckerDashboardProps) {
  const source = companies ?? DEFAULT_COMPANIES;
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CompanyData | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? source.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.domain.toLowerCase().includes(q),
        )
      : source;
    return [...list].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );
  }, [source, query]);

  return (
    <section className="rc-md__root">
      <header className="rc-md__bar">
        <div className="rc-md__search">
          <input
            type="search"
            className="rc-md__search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search companies"
          />
        </div>
        <div className="rc-md__count">
          Showing {filtered.length} of {source.length}
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="rc-md__empty">
          No companies match “{query}”.{" "}
          <button
            type="button"
            className="rc-md__empty-clear"
            onClick={() => setQuery("")}
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="rc-md__grid">
          {filtered.map((c) => (
            <Tile key={c.id} company={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}

      <footer className="rc-md__brand">
        <span>Mucker × Vaudit</span>
      </footer>

      {selected ? (
        <Sheet
          company={selected}
          agentBaseUrl={agentBaseUrl}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}
