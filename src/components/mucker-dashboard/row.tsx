import clsx from "clsx";
import type { CompanyData } from "./types";

type RowProps = {
  rank: number;
  company: CompanyData;
  onView: () => void;
};

const CONFIDENCE_LABEL: Record<NonNullable<CompanyData["confidence"]>, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase() || "?";
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function categorySpend(company: CompanyData, id: "ad_id" | "token_id" | "vendor_id"): number {
  const product = company.products.find((p) => p.id === id);
  if (!product) return 0;
  // products[].vendors[].estSpend is MONTHLY USD per the type docstring; ×12 for annual.
  const monthly = product.vendors.reduce((sum, v) => sum + (v.estSpend ?? 0), 0);
  return monthly * 12;
}

function recoveryRange(c: CompanyData): { low: number; high: number } {
  const low = c.estimated_annual_recovery_low ?? c.estimated_annual_recovery * 0.7;
  const high = c.estimated_annual_recovery_high ?? c.estimated_annual_recovery * 1.5;
  return { low, high };
}

export default function Row({ rank, company, onView }: RowProps) {
  const confidence = company.confidence ?? "high";
  const { low, high } = recoveryRange(company);

  return (
    <tr className="rc-md__tr">
      <td className="rc-md__td rc-md__td--num">{rank}</td>
      <td className="rc-md__td">
        <div className="rc-md__co">
          {company.logoUrl ? (
            <img
              className="rc-md__co-logo"
              src={company.logoUrl}
              alt=""
              loading="lazy"
            />
          ) : (
            <span className="rc-md__co-logo rc-md__co-logo--fallback" aria-hidden="true">
              {initialsOf(company.name)}
            </span>
          )}
          <div className="rc-md__co-text">
            <div className="rc-md__co-name">{company.name}</div>
            <div className="rc-md__co-domain">{company.domain}</div>
          </div>
        </div>
      </td>
      <td className="rc-md__td">
        {company.industry ? (
          <span className="rc-md__chip rc-md__chip--industry">{company.industry}</span>
        ) : (
          <span className="rc-md__td--dim">—</span>
        )}
      </td>
      <td className="rc-md__td rc-md__td--right rc-md__td--mono">
        {formatUsd(company.estimated_annual_spend)}
      </td>
      <td className="rc-md__td rc-md__td--right rc-md__td--mono">
        {formatUsd(categorySpend(company, "ad_id"))}
      </td>
      <td className="rc-md__td rc-md__td--right rc-md__td--mono">
        {formatUsd(categorySpend(company, "token_id"))}
      </td>
      <td className="rc-md__td rc-md__td--right rc-md__td--mono">
        {formatUsd(categorySpend(company, "vendor_id"))}
      </td>
      <td className="rc-md__td rc-md__td--right rc-md__td--mono rc-md__td--recoverable">
        {formatUsd(low)} – {formatUsd(high)}
      </td>
      <td className="rc-md__td">
        <span className={clsx("rc-md__chip", "rc-md__chip--conf", `rc-md__chip--conf-${confidence}`)}>
          {CONFIDENCE_LABEL[confidence]}
        </span>
      </td>
      <td className="rc-md__td">
        <button type="button" className="rc-md__view" onClick={onView}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M8.5 1 L3 9 L7 9 L6.5 15 L13 7 L9 7 L9.5 1 Z"
              fill="currentColor"
            />
          </svg>
          View Audit
        </button>
      </td>
    </tr>
  );
}
