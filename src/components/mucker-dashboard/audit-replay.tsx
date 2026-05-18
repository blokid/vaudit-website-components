import { useState } from "react";
import clsx from "clsx";
import type { CategoryKey, CompanyData } from "./types";
import type { Vendor } from "../presignup-agent/types";

type AuditReplayProps = {
  company: CompanyData;
  /** Annual USD low bound of the company's recoverable range. */
  rangeLow: number;
  /** Annual USD high bound of the company's recoverable range. */
  rangeHigh: number;
};

const CATEGORY_META: Record<CategoryKey, { label: string; dotClass: string }> = {
  ad_id: { label: "Ad ID", dotClass: "rc-md__dot--ad" },
  token_id: { label: "Token ID", dotClass: "rc-md__dot--token" },
  vendor_id: { label: "Vendor ID", dotClass: "rc-md__dot--vendor" },
};

const ORDER: CategoryKey[] = ["ad_id", "token_id", "vendor_id"];

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n)}`;
}

function reconciliationFor(vendor: Vendor, category: CategoryKey): {
  label: string;
  variant: "partial" | "full" | "alert";
} {
  // Token ID uses the existing verificationDepth taxonomy.
  if (category === "token_id" && vendor.verificationDepth) {
    if (vendor.verificationDepth === "full") {
      return { label: "Full billing reconciliation", variant: "full" };
    }
    if (vendor.verificationDepth === "statistical") {
      return { label: "Statistical reconciliation", variant: "partial" };
    }
    return { label: "Partial reconciliation", variant: "partial" };
  }
  // Ad ID — a small subset of ad networks issue invalid-traffic credits.
  // Mock heuristic: TikTok / AppLovin / programmatic networks get the alert variant.
  if (category === "ad_id") {
    const n = vendor.name.toLowerCase();
    if (n.includes("tiktok") || n.includes("applovin") || n.includes("programmatic")) {
      return { label: "Invalid traffic credits", variant: "alert" };
    }
    if (n.includes("meta") || n.includes("facebook")) {
      return { label: "Full billing reconciliation", variant: "full" };
    }
  }
  return { label: "Partial reconciliation", variant: "partial" };
}

function categoryRecoverableAnnual(company: CompanyData, category: CategoryKey): number {
  const p = company.products.find((p) => p.id === category);
  if (!p) return 0;
  const monthlyWaste = p.vendors.reduce((sum, v) => sum + (v.waste ?? 0), 0);
  return monthlyWaste * 12;
}

function vendorInitial(name: string): string {
  const n = name.trim();
  return (n[0] ?? "?").toUpperCase();
}

export default function AuditReplay({ company, rangeLow, rangeHigh }: AuditReplayProps) {
  const [followUp, setFollowUp] = useState("");

  const categoryTotals = ORDER.map((c) => ({
    category: c,
    label: CATEGORY_META[c].label,
    dotClass: CATEGORY_META[c].dotClass,
    amount: categoryRecoverableAnnual(company, c),
    product: company.products.find((p) => p.id === c),
  }));

  const totalRecoverableSoFar = categoryTotals.reduce((sum, t) => sum + t.amount, 0);
  const vendorCount = categoryTotals.filter((t) => t.product && t.product.vendors.length > 0).length;

  return (
    <div className="rc-md__ai">
      <div className="rc-md__ai-eyebrow">VAUDIT AI — ASK ANYTHING</div>

      <div className="rc-md__ai-scroll">
      <div className="rc-md__ai-msg">
        <div className="rc-md__ai-avatar" aria-hidden="true">VA</div>
        <div className="rc-md__ai-bubble">
          <p>
            On it. Scanning <strong>{company.domain}</strong> against our vendor
            benchmarks — this gives you an{" "}
            <strong>estimate in ~10 seconds</strong>. You can lock in exact
            numbers right after.
          </p>
          <div className="rc-md__ai-pill">
            <span className="rc-md__ai-pill-dot" aria-hidden="true" />
            <span>Audited</span>
            <strong>{company.domain}</strong>
            <span>· {vendorCount} categories</span>
          </div>
        </div>
      </div>

      <div className="rc-md__ai-card">
        <div className="rc-md__ai-card-head">
          <div>
            <div className="rc-md__ai-card-eyebrow rc-md__ai-card-eyebrow--live">
              <span className="rc-md__ai-pulse" aria-hidden="true" /> LIVE AUDIT
            </div>
            <div className="rc-md__ai-card-title">Audit complete</div>
          </div>
          <div className="rc-md__ai-card-right">
            <div className="rc-md__ai-card-eyebrow">RECOVERABLE SO FAR</div>
            <div className="rc-md__ai-card-amount">{formatUsd(totalRecoverableSoFar)}</div>
          </div>
        </div>
        <ul className="rc-md__ai-rows">
          {categoryTotals.map((t) => {
            const vendors = t.product?.vendors ?? [];
            return (
              <li key={t.category} className="rc-md__ai-row">
                <span className="rc-md__ai-row-check" aria-hidden="true">
                  <svg viewBox="0 0 16 16" width="14" height="14">
                    <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 8.5 L7.2 10.5 L11 6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="rc-md__ai-row-name">{t.label}</span>
                <span className="rc-md__ai-row-vendors">
                  {vendors.map((v) => v.name).join(", ") || "—"}
                </span>
                <span className="rc-md__ai-row-amount">{formatUsd(t.amount)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {categoryTotals.map((t) => {
        const vendors = t.product?.vendors ?? [];
        if (!vendors.length) return null;
        return (
          <div key={t.category} className="rc-md__ai-cat">
            <div className="rc-md__ai-cat-head">
              <div className="rc-md__ai-cat-title">
                <span className={clsx("rc-md__dot", t.dotClass)} aria-hidden="true" />
                <span>{t.label}</span>
              </div>
              <span className="rc-md__chip rc-md__chip--completed">COMPLETED</span>
            </div>
            <div className="rc-md__ai-cat-amount">{formatUsd(t.amount)}</div>
            <ul className="rc-md__ai-vendors">
              {vendors.map((v) => {
                const annualSpend = v.estSpend * 12;
                const annualWaste = v.waste * 12;
                const recon = reconciliationFor(v, t.category);
                return (
                  <li key={v.name} className="rc-md__ai-vendor">
                    <span className="rc-md__ai-vendor-logo" aria-hidden="true">
                      {vendorInitial(v.name)}
                    </span>
                    <span className="rc-md__ai-vendor-name">{v.name}</span>
                    <span
                      className={clsx(
                        "rc-md__chip",
                        "rc-md__chip--recon",
                        `rc-md__chip--recon-${recon.variant}`,
                      )}
                    >
                      {recon.label}
                    </span>
                    <span className="rc-md__ai-vendor-amounts">
                      <span className="rc-md__ai-vendor-spend">{formatUsd(annualSpend)} spend</span>
                      <span className="rc-md__ai-vendor-waste">{formatUsd(annualWaste)} wasted</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <div className="rc-md__ai-msg rc-md__ai-msg--final">
        <div className="rc-md__ai-avatar" aria-hidden="true">VA</div>
        <div className="rc-md__ai-bubble rc-md__ai-bubble--final">
          <div className="rc-md__ai-final-eyebrow">
            <span className="rc-md__ai-pill-dot" aria-hidden="true" />
            ESTIMATED · READY IN SECONDS
          </div>
          <div className="rc-md__ai-final-range">
            {formatUsd(rangeLow)} – {formatUsd(rangeHigh)}
          </div>
          <p className="rc-md__ai-final-copy">
            Estimated recoverable across <strong>{vendorCount} vendor categories</strong> —
            benchmarked to {company.name}'s size &amp; sector. Want a tighter range?
            Share your real spend and I'll re-run the audit against it.
          </p>
          <button type="button" className="rc-md__ai-cta">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M8 2 a6 6 0 1 0 0 12 a6 6 0 0 0 0 -12 z M8 5 v3.5 L10 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Lock in exact numbers
            <span className="rc-md__ai-cta-eta">~30s</span>
          </button>
          <button type="button" className="rc-md__ai-cta rc-md__ai-cta--secondary">
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path
                d="M8 2 v8 M5 7.5 L8 10.5 L11 7.5 M3 13 H13"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download report
          </button>
          <ul className="rc-md__ai-checks">
            <li>✓ Free</li>
            <li>✓ No login</li>
            <li>✓ No integrations</li>
            <li>✓ You only pay when we recover spend</li>
          </ul>
          <div className="rc-md__ai-final-foot">MUCKER × VAUDIT</div>
        </div>
      </div>
      </div>

      <form
        className="rc-md__ai-input"
        onSubmit={(e) => {
          e.preventDefault();
          // Follow-up wiring lives on the roadmap — for now the input is a no-op stub.
          setFollowUp("");
        }}
      >
        <span className="rc-md__ai-input-prompt" aria-hidden="true">&gt;</span>
        <input
          type="text"
          className="rc-md__ai-input-field"
          placeholder="Ask a follow-up…"
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          aria-label="Ask a follow-up question"
        />
        <button type="submit" className="rc-md__ai-send" disabled={!followUp.trim()}>
          SEND
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M2 8 L14 8 M9 3 L14 8 L9 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
