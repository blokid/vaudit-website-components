// Shared types for the Mucker portfolio dashboard.
//
// Each table row renders one CompanyData. Currency units mirror the
// presignup-agent schema: `Vendor.estSpend`, `Vendor.waste`, and
// `Product.wasteTotal` are MONTHLY USD — the presignup-agent's results-grid
// annualises by ×12 at display time. `estimated_annual_spend` /
// `estimated_annual_recovery*` on CompanyData are ANNUAL USD (pre-multiplied)
// because they're shown directly in the table without going through the agent.

import type { Product } from "../presignup-agent/types";

export type CategoryKey = "ad_id" | "vendor_id" | "token_id";

export type ConfidenceLevel = "high" | "medium" | "low";

export type CompanyVendor = {
  name: string;
  /** Monthly USD. */
  spend: number;
  /** Monthly USD. */
  waste: number;
  category: CategoryKey;
};

export type CompanyData = {
  /** Kebab slug, e.g. "stripe". Used as a stable React key + URL token. */
  id: string;
  /** Display name, e.g. "Stripe". */
  name: string;
  /** Domain, e.g. "stripe.com". Fed to presignup-agent in replay mode. */
  domain: string;
  /** Absolute logo URL — ideally served from this repo's assets/ via the backend. */
  logoUrl?: string;
  /** Free-form tag like "E-commerce", "SaaS", "Healthcare", "Fintech", "Other". */
  industry?: string;

  /** Annual USD. Shown in the EST. ANNUAL SPEND column. */
  estimated_annual_spend: number;
  /**
   * Annual USD midpoint of the recoverable range. Kept for backward compat
   * and used as the fallback midpoint when low/high are absent (low = 0.7×,
   * high = 1.5×).
   */
  estimated_annual_recovery: number;
  /** Annual USD low bound of the recoverable range. */
  estimated_annual_recovery_low?: number;
  /** Annual USD high bound of the recoverable range. */
  estimated_annual_recovery_high?: number;

  /** Recovery-estimate confidence shown as a chip. Defaults to "high". */
  confidence?: ConfidenceLevel;

  /**
   * Mirror of presignup-agent's Product[] shape — monthly USD per vendor.
   * Passed directly to the replay-mode chat embedded inside the sheet.
   */
  products: Product[];

  /** Flat vendor list used by the sheet's vendor-list section. Monthly USD. */
  vendors: CompanyVendor[];
};
