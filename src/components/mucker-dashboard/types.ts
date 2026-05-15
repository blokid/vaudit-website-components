// Shared types for the Mucker portfolio dashboard.
//
// Each tile renders one CompanyData. Currency units mirror the presignup-agent
// schema: `Vendor.estSpend`, `Vendor.waste`, and `Product.wasteTotal` are
// MONTHLY USD — the presignup-agent's results-grid annualises by ×12 at
// display time. `estimated_annual_spend` / `estimated_annual_recovery` on
// CompanyData are ANNUAL USD (pre-multiplied) because they're shown directly
// on the tile without going through the agent.

import type { Product } from "../presignup-agent/types";

export type CategoryKey = "ad_id" | "vendor_id" | "token_id";

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
  /** Absolute logo URL — ideally jsDelivr-hosted in this repo's assets/. */
  logoUrl?: string;
  /** Free-form tag like "Payments" or "AI". */
  industry?: string;

  /** Annual USD. Shown directly on the tile. */
  estimated_annual_spend: number;
  /** Annual USD. Shown in the orange recovery stat. */
  estimated_annual_recovery: number;

  /**
   * Mirror of presignup-agent's Product[] shape — monthly USD per vendor.
   * Passed directly to the replay-mode chat embedded inside the sheet.
   */
  products: Product[];

  /** Flat vendor list used by the sheet's vendor-list section. Monthly USD. */
  vendors: CompanyVendor[];
};
