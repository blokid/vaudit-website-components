// Client-side recalc for the phase-2 ("accurate") audit.
//
// Phase 1 returns per-vendor `est_spend` (monthly USD, benchmark estimate)
// and `waste` (monthly USD, est_spend × waste-rate). In phase 2 the visitor
// edits the *exact* spend for each vendor in a prefilled input form (annual
// USD, seeded from `est_spend × 12`). We:
//
//   1. Convert each vendor's edited annual figure back to monthly.
//   2. Re-derive each vendor's waste by preserving its original in-band
//      waste % (`waste / est_spend`), clamped to the same category band the
//      backend uses, applied to the new spend. This mirrors the backend
//      `update_audit_breakdown` tool (`tools/phase2.py`) rather than the
//      coarser band-midpoint approach the old range flow used — so a vendor
//      we sized at the low end of the band stays at the low end after the
//      visitor corrects its spend. Vendors with no prior spend fall back to
//      the band midpoint.
//
// The waste-rate map is duplicated from `langfuse_config.DEFAULT_CONFIG`
// in the onboarding-agent backend. Keep in sync — when ops bumps the
// Langfuse Config, mirror the change here on the next release.

import type { AccurateSelection, Product, Vendor } from "./types";

/** Whole-percent low/high band per category. Mirrors backend defaults. */
export const WASTE_RATES: Record<string, [number, number]> = {
  ad_id: [5, 12],
  token_id: [20, 40],
  vendor_id: [5, 15],
};

/** Phase-2 row key → which category each row edits. */
export const RANGE_TO_CATEGORY: Record<"ad" | "ai" | "vendor", string> = {
  ad: "ad_id",
  ai: "token_id",
  vendor: "vendor_id",
};

/** Midpoint of a waste band, returned as a fraction (e.g. 0.085). */
export function wasteRateMidpoint(categoryId: string): number {
  const [lo, hi] = WASTE_RATES[categoryId] ?? [0, 0];
  return (lo + hi) / 200;
}

/**
 * Re-derive a vendor's monthly waste against its category band. Preserves the
 * vendor's original in-band waste % when we can recover it (`oldWaste /
 * oldSpend`), clamped to the band; falls back to the band midpoint when the
 * vendor had no prior spend. Mirrors `_recompute` in the backend phase-2 tool.
 */
function deriveWaste(
  newMonthly: number,
  oldSpend: number,
  oldWaste: number,
  categoryId: string,
): number {
  const [lo, hi] = WASTE_RATES[categoryId] ?? [0, 0];
  const oldPct = oldSpend > 0 ? (oldWaste / oldSpend) * 100 : (lo + hi) / 2;
  const clampedPct = Math.max(lo, Math.min(hi, oldPct));
  return roundCurrency((newMonthly * clampedPct) / 100);
}

/**
 * Exact monthly spend the visitor entered, keyed by category id then vendor
 * name. Built by the spends form from its annual inputs (annual ÷ 12).
 */
export type ExactMonthlyByVendor = Record<string, Record<string, number>>;

/**
 * Recalculate the breakdown from the visitor's exact per-vendor spends.
 *
 * `selection` controls which categories the visitor edited — for any category
 * they opted out of, the phase-1 numbers pass through untouched. Within an
 * opted-in category, any vendor missing from `exact` keeps its phase-1 spend
 * (the form prefills every vendor, so this only happens if a value failed to
 * parse).
 *
 * Returns a new product list whose `estSpend` / `waste` are *monthly* USD,
 * mirroring the backend schema so the persisted breakdown round-trips through
 * the same PDF template. The caller is responsible for ×12 at display time.
 */
export function recalculateFromExactSpends(
  phase1: Product[],
  exact: ExactMonthlyByVendor,
  selection: AccurateSelection,
): { products: Product[]; total: number } {
  const opted = new Set<string>(
    selection === "all" ? ["ad_id", "token_id", "vendor_id"] : [selection],
  );

  const out: Product[] = [];
  let grand = 0;

  for (const product of phase1) {
    const cat = product.id;
    if (!opted.has(cat)) {
      out.push(product);
      grand += product.wasteTotal || 0;
      continue;
    }

    const edits = exact[cat] ?? {};

    const vendors: Vendor[] = product.vendors.map((v) => {
      const oldSpend = v.estSpend || 0;
      const newMonthly = roundCurrency(
        v.name in edits ? edits[v.name] : oldSpend,
      );
      return {
        ...v,
        estSpend: newMonthly,
        waste: deriveWaste(newMonthly, oldSpend, v.waste || 0, cat),
      };
    });

    const wasteTotal = vendors.reduce((acc, v) => acc + v.waste, 0);
    const next: Product = {
      ...product,
      wasteTotal: roundCurrency(wasteTotal),
      vendors,
    };
    out.push(next);
    grand += wasteTotal;
  }

  return { products: out, total: roundCurrency(grand) };
}

function roundCurrency(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/**
 * Map picker selection → which spend-form rows to ask about. "all" asks for
 * all three; single-product picks ask for just one row.
 */
export function rangeKeysForSelection(selection: AccurateSelection): ("ad" | "ai" | "vendor")[] {
  if (selection === "ad_id") return ["ad"];
  if (selection === "token_id") return ["ai"];
  if (selection === "vendor_id") return ["vendor"];
  return ["ad", "ai", "vendor"];
}

/**
 * Build "Ad spend: $1,234,560 /yr"-style summary lines for the user-bubble
 * echo after the visitor submits their corrected spends. One line per opted-in
 * category, using the corrected annual category total (monthly ×12).
 */
export function spendsSummaryLines(
  products: Product[],
  selection: AccurateSelection,
): string[] {
  const opted = new Set<string>(
    selection === "all" ? ["ad_id", "token_id", "vendor_id"] : [selection],
  );
  const LABEL: Record<string, string> = {
    ad_id: "Ad spend",
    token_id: "AI / API spend",
    vendor_id: "Vendor spend",
  };
  const lines: string[] = [];
  for (const p of products) {
    if (!opted.has(p.id)) continue;
    const annual = p.vendors.reduce((acc, v) => acc + (v.estSpend || 0), 0) * 12;
    lines.push(`${LABEL[p.id] ?? p.id}: ${formatAnnualUsd(annual)} /yr`);
  }
  return lines;
}

function formatAnnualUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
