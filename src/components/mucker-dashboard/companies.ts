// Placeholder Mucker portfolio data — 3 sample entries so the dashboard
// renders end-to-end in the playground. Real list (50 companies) gets
// populated separately by the pre-computation pipeline.
//
// All monthly USD on `products` / `vendors`; all annual USD on
// `estimated_annual_*`. See ./types.ts for unit conventions.

import type { CompanyData } from "./types";

export const COMPANIES: CompanyData[] = [
  {
    id: "stripe",
    name: "Stripe",
    domain: "stripe.com",
    industry: "Fintech",
    estimated_annual_spend: 12_400_000,
    estimated_annual_recovery: 1_180_000,
    estimated_annual_recovery_low: 820_000,
    estimated_annual_recovery_high: 1_770_000,
    confidence: "high",
    products: [
      {
        id: "ad_id",
        wasteTotal: 38_000,
        vendors: [
          { name: "Google Ads", estSpend: 210_000, waste: 21_000 },
          { name: "Meta Ads", estSpend: 170_000, waste: 17_000 },
        ],
      },
      {
        id: "token_id",
        wasteTotal: 24_500,
        vendors: [
          { name: "OpenAI", estSpend: 65_000, waste: 19_500, verificationDepth: "full" },
          { name: "Anthropic", estSpend: 16_000, waste: 5_000, verificationDepth: "partial" },
        ],
      },
      {
        id: "vendor_id",
        wasteTotal: 35_800,
        vendors: [
          { name: "AWS", estSpend: 240_000, waste: 24_000 },
          { name: "Salesforce", estSpend: 118_000, waste: 11_800 },
        ],
      },
    ],
    vendors: [
      { name: "Google Ads", spend: 210_000, waste: 21_000, category: "ad_id" },
      { name: "Meta Ads", spend: 170_000, waste: 17_000, category: "ad_id" },
      { name: "OpenAI", spend: 65_000, waste: 19_500, category: "token_id" },
      { name: "Anthropic", spend: 16_000, waste: 5_000, category: "token_id" },
      { name: "AWS", spend: 240_000, waste: 24_000, category: "vendor_id" },
      { name: "Salesforce", spend: 118_000, waste: 11_800, category: "vendor_id" },
    ],
  },
  {
    id: "notion",
    name: "Notion",
    domain: "notion.so",
    industry: "SaaS",
    estimated_annual_spend: 4_800_000,
    estimated_annual_recovery: 520_000,
    estimated_annual_recovery_low: 360_000,
    estimated_annual_recovery_high: 780_000,
    confidence: "high",
    products: [
      {
        id: "ad_id",
        wasteTotal: 14_000,
        vendors: [
          { name: "Google Ads", estSpend: 80_000, waste: 8_000 },
          { name: "TikTok Ads", estSpend: 60_000, waste: 6_000 },
        ],
      },
      {
        id: "token_id",
        wasteTotal: 13_200,
        vendors: [
          { name: "OpenAI", estSpend: 32_000, waste: 9_600, verificationDepth: "full" },
          { name: "Anthropic", estSpend: 12_000, waste: 3_600, verificationDepth: "partial" },
        ],
      },
      {
        id: "vendor_id",
        wasteTotal: 16_100,
        vendors: [
          { name: "AWS", estSpend: 95_000, waste: 9_500 },
          { name: "Stripe", estSpend: 66_000, waste: 6_600 },
        ],
      },
    ],
    vendors: [
      { name: "Google Ads", spend: 80_000, waste: 8_000, category: "ad_id" },
      { name: "TikTok Ads", spend: 60_000, waste: 6_000, category: "ad_id" },
      { name: "OpenAI", spend: 32_000, waste: 9_600, category: "token_id" },
      { name: "Anthropic", spend: 12_000, waste: 3_600, category: "token_id" },
      { name: "AWS", spend: 95_000, waste: 9_500, category: "vendor_id" },
      { name: "Stripe", spend: 66_000, waste: 6_600, category: "vendor_id" },
    ],
  },
  {
    id: "linear",
    name: "Linear",
    domain: "linear.app",
    industry: "SaaS",
    estimated_annual_spend: 2_100_000,
    estimated_annual_recovery: 235_000,
    estimated_annual_recovery_low: 165_000,
    estimated_annual_recovery_high: 350_000,
    confidence: "medium",
    products: [
      {
        id: "ad_id",
        wasteTotal: 5_200,
        vendors: [
          { name: "Google Ads", estSpend: 28_000, waste: 2_800 },
          { name: "Meta Ads", estSpend: 24_000, waste: 2_400 },
        ],
      },
      {
        id: "token_id",
        wasteTotal: 6_800,
        vendors: [
          { name: "OpenAI", estSpend: 18_000, waste: 5_400, verificationDepth: "full" },
          { name: "Anthropic", estSpend: 4_500, waste: 1_400, verificationDepth: "partial" },
        ],
      },
      {
        id: "vendor_id",
        wasteTotal: 7_600,
        vendors: [
          { name: "AWS", estSpend: 42_000, waste: 4_200 },
          { name: "Stripe", estSpend: 34_000, waste: 3_400 },
        ],
      },
    ],
    vendors: [
      { name: "Google Ads", spend: 28_000, waste: 2_800, category: "ad_id" },
      { name: "Meta Ads", spend: 24_000, waste: 2_400, category: "ad_id" },
      { name: "OpenAI", spend: 18_000, waste: 5_400, category: "token_id" },
      { name: "Anthropic", spend: 4_500, waste: 1_400, category: "token_id" },
      { name: "AWS", spend: 42_000, waste: 4_200, category: "vendor_id" },
      { name: "Stripe", spend: 34_000, waste: 3_400, category: "vendor_id" },
    ],
  },
];
