// Client-side recalc for the phase-2 ("accurate") audit.
//
// Phase 1 returns per-vendor `est_spend` (monthly USD, benchmark estimate)
// and `waste` (monthly USD, est_spend × waste-rate). In phase 2 the visitor
// gives us a real *annual* spend range per category (Ad / AI / Vendor). We:
//
//   1. Compute the phase-1 implied annual category spend by summing each
//      vendor's est_spend × 12.
//   2. Take the midpoint of the visitor's annual range as the real category
//      spend (open-ended ranges like "$25M+" use the lower bound).
//   3. Scale each vendor's est_spend by `real / phase1` so the proportions
//      between vendors are preserved.
//   4. Re-derive each vendor's waste using the midpoint of the same waste
//      band the backend uses (centralised in WASTE_RATES below).
//
// The waste-rate map is duplicated from `langfuse_config.DEFAULT_CONFIG`
// in the onboarding-agent backend. Keep in sync — when ops bumps the
// Langfuse Config, mirror the change here on the next release.

import type { AccurateRanges, AccurateSelection, Product, SpendRange, Vendor } from "./types";

/** Whole-percent low/high band per category. Mirrors backend defaults. */
export const WASTE_RATES: Record<string, [number, number]> = {
  ad_id: [5, 12],
  token_id: [20, 40],
  vendor_id: [5, 15],
};

/** Spend range chip presets per category. Annual USD. */
export const SPEND_RANGE_PRESETS: Record<"ad" | "ai" | "vendor", SpendRange[]> = {
  ad: [
    { min: 0, max: 250_000, label: "< $250K" },
    { min: 250_000, max: 1_000_000, label: "$250K – $1M" },
    { min: 1_000_000, max: 5_000_000, label: "$1M – $5M" },
    { min: 5_000_000, max: 25_000_000, label: "$5M – $25M" },
    { min: 25_000_000, max: Infinity, label: "$25M+" },
  ],
  ai: [
    { min: 0, max: 50_000, label: "< $50K" },
    { min: 50_000, max: 250_000, label: "$50K – $250K" },
    { min: 250_000, max: 1_000_000, label: "$250K – $1M" },
    { min: 1_000_000, max: 5_000_000, label: "$1M – $5M" },
    { min: 5_000_000, max: Infinity, label: "$5M+" },
  ],
  vendor: [
    { min: 0, max: 500_000, label: "< $500K" },
    { min: 500_000, max: 2_000_000, label: "$500K – $2M" },
    { min: 2_000_000, max: 10_000_000, label: "$2M – $10M" },
    { min: 10_000_000, max: 50_000_000, label: "$10M – $50M" },
    { min: 50_000_000, max: Infinity, label: "$50M+" },
  ],
};

/** Phase-2 row label → which category each row scales. */
export const RANGE_TO_CATEGORY: Record<"ad" | "ai" | "vendor", string> = {
  ad: "ad_id",
  ai: "token_id",
  vendor: "vendor_id",
};

/** Midpoint of an annual-spend range; open-ended ranges use the lower bound. */
export function rangeMidpoint(range: SpendRange): number {
  if (!Number.isFinite(range.max)) return range.min;
  return (range.min + range.max) / 2;
}

/** Midpoint of a waste band, returned as a fraction (e.g. 0.085). */
export function wasteRateMidpoint(categoryId: string): number {
  const [lo, hi] = WASTE_RATES[categoryId] ?? [0, 0];
  return (lo + hi) / 200;
}

/**
 * Recalculate the breakdown using the visitor's real annual spend ranges.
 *
 * `selection` controls which categories get the real-spend scaling — for any
 * category the visitor opted out of, we leave the phase-1 numbers untouched.
 *
 * Returns a new product list keyed by category id. Each vendor's `est_spend`
 * and `waste` are *monthly* USD, mirroring the backend schema so the
 * persisted breakdown round-trips through the same PDF template. The
 * caller is responsible for ×12 at display time.
 */
export function recalculateBreakdown(
  phase1: Product[],
  ranges: AccurateRanges,
  selection: "ad_id" | "token_id" | "vendor_id" | "all",
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

    const realAnnual = pickRealAnnual(cat, ranges);
    const realMonthly = realAnnual / 12;
    const phase1Monthly = product.vendors.reduce((acc, v) => acc + (v.estSpend || 0), 0);
    const scale = phase1Monthly > 0 ? realMonthly / phase1Monthly : 0;
    const wasteRate = wasteRateMidpoint(cat);

    const vendors: Vendor[] = product.vendors.map((v) => {
      const newSpend = (v.estSpend || 0) * scale;
      return {
        name: v.name,
        estSpend: roundCurrency(newSpend),
        waste: roundCurrency(newSpend * wasteRate),
      };
    });

    const wasteTotal = vendors.reduce((acc, v) => acc + v.waste, 0);
    const next: Product = {
      id: product.id,
      wasteTotal: roundCurrency(wasteTotal),
      vendors,
    };
    out.push(next);
    grand += wasteTotal;
  }

  return { products: out, total: roundCurrency(grand) };
}

function pickRealAnnual(categoryId: string, ranges: AccurateRanges): number {
  if (categoryId === "ad_id") return rangeMidpoint(ranges.ad);
  if (categoryId === "token_id") return rangeMidpoint(ranges.ai);
  if (categoryId === "vendor_id") return rangeMidpoint(ranges.vendor);
  return 0;
}

function roundCurrency(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n);
}

/**
 * Map picker selection → which ranges-form rows to ask about. "all" asks
 * for all three; single-product picks ask for just one row.
 */
export function rangeKeysForSelection(selection: AccurateSelection): ("ad" | "ai" | "vendor")[] {
  if (selection === "ad_id") return ["ad"];
  if (selection === "token_id") return ["ai"];
  if (selection === "vendor_id") return ["vendor"];
  return ["ad", "ai", "vendor"];
}

/**
 * Build "$5M – $25M /yr"-style summary lines for the user-bubble echo.
 * Returns one line per range present in `ranges`.
 */
export function rangesSummaryLines(ranges: Partial<AccurateRanges>): string[] {
  const lines: string[] = [];
  if (ranges.ad) lines.push(`Ad spend: ${ranges.ad.label} /yr`);
  if (ranges.ai) lines.push(`AI / API spend: ${ranges.ai.label} /yr`);
  if (ranges.vendor) lines.push(`Vendor spend: ${ranges.vendor.label} /yr`);
  return lines;
}
