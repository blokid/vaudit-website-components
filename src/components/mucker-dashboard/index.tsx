import { useMemo, useState } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import type { CompanyData } from "./types";
import { COMPANIES as DEFAULT_COMPANIES } from "./companies";
import Row from "./row";
import Detail from "./detail";
import "./mucker-dashboard.css";

type MuckerDashboardProps = {
  /** Inline companies list. When omitted, falls back to the bundled COMPANIES. */
  companies?: CompanyData[];
  /** Search input placeholder. */
  searchPlaceholder?: string;
};

type SortKey = "recoverable" | "spend" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recoverable", label: "Sort by Recoverable" },
  { value: "spend", label: "Sort by Spend" },
  { value: "name", label: "Sort by Name" },
];

export const meta: ComponentMeta<MuckerDashboardProps> = {
  description:
    "Mucker × Vaudit Portfolio Audit Center — header, stat cards, search/filter/sort bar, and a sortable table of portfolio companies. Each row opens the detail sheet (vendor list, category chart, mini results-grid, and replayed presignup-agent chat).",
  props: {
    companies: {
      type: "CompanyData[]",
      description: "Inline company list. Defaults to the bundled sample data.",
      default: "(bundled sample)",
    },
    searchPlaceholder: {
      type: "string",
      description: "Placeholder text for the search input.",
      default: "Search companies…",
    },
  },
  variants: {
    "default": {},
  },
};

function recoveryRange(c: CompanyData): { low: number; high: number } {
  const low = c.estimated_annual_recovery_low ?? c.estimated_annual_recovery * 0.7;
  const high = c.estimated_annual_recovery_high ?? c.estimated_annual_recovery * 1.5;
  return { low, high };
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

export default function MuckerDashboard({
  companies,
  searchPlaceholder = "Search companies…",
}: MuckerDashboardProps) {
  const source = companies ?? DEFAULT_COMPANIES;
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("recoverable");
  const [selected, setSelected] = useState<CompanyData | null>(null);

  const industries = useMemo(() => {
    const set = new Set<string>();
    for (const c of source) if (c.industry) set.add(c.industry);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [source]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = source.filter((c) => {
      if (industry !== "all" && c.industry !== industry) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }
      if (sortBy === "spend") return b.estimated_annual_spend - a.estimated_annual_spend;
      // recoverable — sort by high end descending so the biggest opportunities surface first
      return recoveryRange(b).high - recoveryRange(a).high;
    });
  }, [source, query, industry, sortBy]);

  const totals = useMemo(() => {
    let spend = 0;
    let recoveryLow = 0;
    let recoveryHigh = 0;
    for (const c of source) {
      spend += c.estimated_annual_spend;
      const r = recoveryRange(c);
      recoveryLow += r.low;
      recoveryHigh += r.high;
    }
    return { spend, recoveryLow, recoveryHigh };
  }, [source]);

  return (
    <section className={clsx("rc-md__root", selected && "rc-md__root--detail")}>
      <header className="rc-md__brandbar">
        <div className="rc-md__brand">
          <span className="rc-md__brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28">
              <circle cx="16" cy="16" r="15" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M7 20 L12 11 L16 17 L20 11 L25 20 Z"
                fill="currentColor"
                opacity="0.92"
              />
            </svg>
          </span>
          <span className="rc-md__brand-name">Mucker</span>
        </div>
        <div className="rc-md__poweredby">
          <span className="rc-md__poweredby-label">Powered by</span>
          <span className="rc-md__poweredby-name">Vaudit</span>
        </div>
      </header>

      {selected ? (
        <Detail company={selected} onBack={() => setSelected(null)} />
      ) : (
        <>
      <div className="rc-md__title">
        <h1 className="rc-md__title-h">Portfolio Audit Center</h1>
        <p className="rc-md__title-sub">
          Vendor spend &amp; recoverable savings · {source.length} portfolio
          {source.length === 1 ? " company" : " companies"}
        </p>
      </div>

      <div className="rc-md__stats">
        <div className="rc-md__stat">
          <div className="rc-md__stat-label">COMPANIES</div>
          <div className="rc-md__stat-value">{source.length}</div>
          <div className="rc-md__stat-note">Mucker portfolio</div>
        </div>
        <div className="rc-md__stat rc-md__stat--accent">
          <div className="rc-md__stat-label">EST. ANNUAL SPEND</div>
          <div className="rc-md__stat-value">{formatUsd(totals.spend)}</div>
          <div className="rc-md__stat-note">Across all vendors</div>
        </div>
        <div className="rc-md__stat rc-md__stat--accent">
          <div className="rc-md__stat-label">EST. RECOVERABLE</div>
          <div className="rc-md__stat-value">
            {formatUsd(totals.recoveryLow)} – {formatUsd(totals.recoveryHigh)}
          </div>
          <div className="rc-md__stat-note">Potential savings</div>
        </div>
      </div>

      <div className="rc-md__bar">
        <div className="rc-md__search">
          <svg className="rc-md__search-icon" viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
            <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M14 14 L18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            className="rc-md__search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search companies"
          />
        </div>
        <label className="rc-md__select">
          <span className="rc-md__sr">Industry</span>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            aria-label="Filter by industry"
          >
            <option value="all">All Industries</option>
            {industries.map((i) => (
              <option key={i} value={i}>{i}</option>
            ))}
          </select>
        </label>
        <label className="rc-md__select">
          <span className="rc-md__sr">Sort</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            aria-label="Sort companies"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <div className="rc-md__count">
          Showing <strong>{filtered.length}</strong> of {source.length} companies
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rc-md__empty">
          No companies match these filters.{" "}
          <button
            type="button"
            className="rc-md__empty-clear"
            onClick={() => {
              setQuery("");
              setIndustry("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="rc-md__tablewrap">
          <table className="rc-md__table">
            <thead>
              <tr>
                <th scope="col" className="rc-md__th rc-md__th--num">#</th>
                <th scope="col" className="rc-md__th">Company</th>
                <th scope="col" className="rc-md__th">Industry</th>
                <th scope="col" className="rc-md__th rc-md__th--right">Est. Annual Spend</th>
                <th scope="col" className="rc-md__th rc-md__th--right">AdID</th>
                <th scope="col" className="rc-md__th rc-md__th--right">TokenID</th>
                <th scope="col" className="rc-md__th rc-md__th--right">VendorID</th>
                <th scope="col" className="rc-md__th rc-md__th--right">Recoverable</th>
                <th scope="col" className="rc-md__th">Confidence</th>
                <th scope="col" className="rc-md__th">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <Row
                  key={c.id}
                  rank={i + 1}
                  company={c}
                  onView={() => setSelected(c)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

        </>
      )}
    </section>
  );
}
