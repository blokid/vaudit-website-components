import { useEffect } from "react";
import clsx from "clsx";
import type { CategoryKey, CompanyData } from "./types";
import AuditReplay from "./audit-replay";

type DetailProps = {
  company: CompanyData;
  onBack: () => void;
};

const MODULE_META: { category: CategoryKey; label: string; dotClass: string }[] = [
  { category: "ad_id", label: "AdID", dotClass: "rc-md__dot--ad" },
  { category: "token_id", label: "TokenID", dotClass: "rc-md__dot--token" },
  { category: "vendor_id", label: "VendorID", dotClass: "rc-md__dot--vendor" },
];

const CONFIDENCE_LABEL: Record<NonNullable<CompanyData["confidence"]>, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase() || "?";
}

function categorySpendAnnual(company: CompanyData, category: CategoryKey): number {
  const p = company.products.find((p) => p.id === category);
  if (!p) return 0;
  const monthly = p.vendors.reduce((sum, v) => sum + (v.estSpend ?? 0), 0);
  return monthly * 12;
}

function categoryRecoveryRange(
  company: CompanyData,
  category: CategoryKey,
): { low: number; high: number } {
  // Module-level recovery isn't tracked separately; mirror the company-level
  // ratio (low = 0.7x estimated waste, high = 1.5x). Annualised.
  const p = company.products.find((p) => p.id === category);
  if (!p) return { low: 0, high: 0 };
  const annualWaste = p.vendors.reduce((sum, v) => sum + (v.waste ?? 0), 0) * 12;
  return { low: Math.round(annualWaste * 0.94), high: Math.round(annualWaste * 1.4) };
}

function recoveryRange(c: CompanyData): { low: number; high: number } {
  const low = c.estimated_annual_recovery_low ?? c.estimated_annual_recovery * 0.7;
  const high = c.estimated_annual_recovery_high ?? c.estimated_annual_recovery * 1.5;
  return { low, high };
}

export default function Detail({ company, onBack }: DetailProps) {
  // Reset scroll to top when entering a detail view so the user isn't dropped
  // mid-page after coming from a long list.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [company.id]);

  // Esc to go back — match the prior side-sheet's ergonomics.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  const totalSpend = company.estimated_annual_spend;
  const range = recoveryRange(company);
  const rateLow = totalSpend > 0 ? Math.round((range.low / totalSpend) * 100) : 0;
  const rateHigh = totalSpend > 0 ? Math.round((range.high / totalSpend) * 100) : 0;

  const moduleData = MODULE_META.map((m) => {
    const spend = categorySpendAnnual(company, m.category);
    const pctOfSpend = totalSpend > 0 ? Math.round((spend / totalSpend) * 100) : 0;
    const recovery = categoryRecoveryRange(company, m.category);
    return { ...m, spend, pctOfSpend, recovery };
  });

  // Spend-breakdown bar shares of the three module categories. We use the
  // sum of the three (not the company total) so the bar fills 100%.
  const moduleSum = moduleData.reduce((s, m) => s + m.spend, 0);
  const confidence = company.confidence ?? "high";

  return (
    <div className="rc-md__detail">
      <header className="rc-md__detail-head">
        <button type="button" className="rc-md__back" onClick={onBack}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All Companies
        </button>
        <div className="rc-md__detail-divider" aria-hidden="true">/</div>
        <div className="rc-md__detail-co">
          {company.logoUrl ? (
            <img className="rc-md__co-logo" src={company.logoUrl} alt="" />
          ) : (
            <span className="rc-md__co-logo rc-md__co-logo--fallback" aria-hidden="true">
              {initialsOf(company.name)}
            </span>
          )}
          <div className="rc-md__co-text">
            <div className="rc-md__detail-name">{company.name}</div>
            <div className="rc-md__detail-meta">
              <span className="rc-md__co-domain">{company.domain}</span>
              {company.industry ? (
                <span className="rc-md__chip rc-md__chip--industry">{company.industry}</span>
              ) : null}
              <span
                className={clsx(
                  "rc-md__chip",
                  "rc-md__chip--conf",
                  `rc-md__chip--conf-${confidence}`,
                )}
              >
                {CONFIDENCE_LABEL[confidence]}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="rc-md__detail-grid">
        <div className="rc-md__detail-left">
          <div className="rc-md__detail-stats">
            <div className="rc-md__stat">
              <div className="rc-md__stat-label">EST. ANNUAL SPEND</div>
              <div className="rc-md__stat-value">{formatUsd(totalSpend)}</div>
            </div>
            <div className="rc-md__stat">
              <div className="rc-md__stat-label">RECOVERABLE RANGE</div>
              <div className="rc-md__stat-value">
                {formatUsd(range.low)} – {formatUsd(range.high)}
              </div>
            </div>
            <div className="rc-md__stat">
              <div className="rc-md__stat-label">RECOVERY RATE</div>
              <div className="rc-md__stat-value">
                {rateLow}–{rateHigh}%
              </div>
            </div>
          </div>

          <section className="rc-md__detail-section">
            <h2 className="rc-md__detail-h">MODULE BREAKDOWN</h2>
            <div className="rc-md__modules">
              {moduleData.map((m) => (
                <div key={m.category} className="rc-md__module">
                  <div className="rc-md__module-head">
                    <span className="rc-md__module-title">
                      <span className={clsx("rc-md__dot", m.dotClass)} aria-hidden="true" />
                      {m.label}
                    </span>
                    <span className="rc-md__module-pct">{m.pctOfSpend}% of spend</span>
                  </div>
                  <div className="rc-md__module-amount">{formatUsd(m.spend)}</div>
                  <div className="rc-md__module-recovery">
                    Recovery est: {formatUsd(m.recovery.low)} – {formatUsd(m.recovery.high)}
                  </div>
                  <div
                    className="rc-md__module-bar"
                    role="img"
                    aria-label={`${m.pctOfSpend}% of total spend`}
                  >
                    <span
                      className={clsx("rc-md__module-bar-fill", m.dotClass)}
                      style={{ width: `${Math.min(100, m.pctOfSpend)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rc-md__detail-section">
            <h2 className="rc-md__detail-h">SPEND BREAKDOWN</h2>
            <div className="rc-md__breakdown-bar" role="img" aria-label="Spend share by module">
              {moduleData.map((m) => {
                const share = moduleSum > 0 ? (m.spend / moduleSum) * 100 : 0;
                if (share <= 0) return null;
                return (
                  <span
                    key={m.category}
                    className={clsx("rc-md__breakdown-seg", m.dotClass)}
                    style={{ width: `${share}%` }}
                    title={`${m.label}: ${formatUsd(m.spend)}`}
                  />
                );
              })}
            </div>
            <div className="rc-md__breakdown-legend">
              {moduleData.map((m) => (
                <span key={m.category} className="rc-md__breakdown-legend-item">
                  <span className={clsx("rc-md__dot", m.dotClass)} aria-hidden="true" />
                  {m.label}: <strong>{formatUsd(m.spend)}</strong>
                </span>
              ))}
            </div>
          </section>

          <button type="button" className="rc-md__cta">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M8.5 1 L3 9 L7 9 L6.5 15 L13 7 L9 7 L9.5 1 Z"
                fill="currentColor"
              />
            </svg>
            Start Full Audit
          </button>
        </div>

        <div className="rc-md__detail-right">
          <AuditReplay company={company} rangeLow={range.low} rangeHigh={range.high} />
        </div>
      </div>
    </div>
  );
}
