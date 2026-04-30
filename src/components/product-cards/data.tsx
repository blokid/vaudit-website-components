import type { ReactNode } from "react";

export type ProductKey = "ship" | "kloud" | "seat" | "token" | "ad" | "pay";

export type ProductCard = {
  key: ProductKey;
  href: string;
  title: string;
  description: string;
  emoji: ReactNode;
  logos: { src: string; alt: string }[];
  viz: ReactNode;
};

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const emojis: Record<ProductKey, ReactNode> = {
  ship: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M14 18V6a2 2 0 0 0-2-2H2v14h2" />
      <path d="M14 9h4l4 4v5h-2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  ),
  kloud: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  seat: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20" />
      <circle cx="6" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  token: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M15 2v2" />
      <path d="M15 20v2" />
      <path d="M2 15h2" />
      <path d="M2 9h2" />
      <path d="M20 15h2" />
      <path d="M20 9h2" />
      <path d="M9 2v2" />
      <path d="M9 20v2" />
    </svg>
  ),
  ad: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M14 4.1 12 6" />
      <path d="m5.1 8-2.9-.8" />
      <path d="m6 12-1.9 2" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
    </svg>
  ),
  pay: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
};

const vizes: Record<ProductKey, ReactNode> = {
  ship: (
    <div className="viz viz-ship">
      <div className="ship-path" aria-hidden="true" />
      <div className="ship-box" aria-hidden="true" />
      <div className="ship-credit" aria-hidden="true">+$</div>
    </div>
  ),
  kloud: (
    <div className="viz viz-kloud">
      <div className="k-ceiling" aria-hidden="true" />
      <div className="k-bars" aria-hidden="true">
        <span className="kb" />
        <span className="kb" />
        <span className="kb" />
        <span className="kb" />
        <span className="kb" />
        <span className="kb" />
        <span className="kb" />
      </div>
    </div>
  ),
  seat: (
    <div className="viz viz-seat">
      <div className="seat-grid" aria-hidden="true">
        <span className="ss" />
        <span className="ss" />
        <span className="ss ss-empty" />
        <span className="ss" />
        <span className="ss" />
        <span className="ss" />
        <span className="ss ss-empty" />
        <span className="ss" />
        <span className="ss" />
        <span className="ss" />
      </div>
      <div className="seat-scan" aria-hidden="true" />
    </div>
  ),
  token: (
    <div className="viz viz-token">
      <div className="token-chip" aria-hidden="true">
        <span className="token-node" />
        <span className="token-node" />
        <span className="token-node" />
        <span className="token-node" />
      </div>
      <span className="t-flow tf1" aria-hidden="true" />
      <span className="t-flow tf2" aria-hidden="true" />
      <span className="t-flow tf3" aria-hidden="true" />
    </div>
  ),
  ad: (
    <div className="viz viz-ad">
      <div className="ad-target" aria-hidden="true" />
      <div className="ad-ring" aria-hidden="true" />
      <div className="ad-ring r2" aria-hidden="true" />
      <span className="ad-click ac1" aria-hidden="true">×</span>
      <span className="ad-click ac2" aria-hidden="true">×</span>
      <span className="ad-click ac3" aria-hidden="true">×</span>
    </div>
  ),
  pay: (
    <div className="viz viz-pay">
      <div className="pay-rows" aria-hidden="true">
        <div className="pr" />
        <div className="pr pr-flag" />
        <div className="pr" />
        <div className="pr" />
      </div>
      <div className="pay-scan" aria-hidden="true" />
    </div>
  ),
};

const CDN = "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee";

export const PRODUCTS: Record<ProductKey, ProductCard> = {
  ship: {
    key: "ship",
    href: "/ship-id",
    title: "Ship ID",
    description:
      "Verifies shipping charges against carrier terms to identify overcharges and missed refunds.",
    emoji: emojis.ship,
    viz: vizes.ship,
    logos: [
      { src: `${CDN}/69e8a9a37f220d58951c852a_fedex.svg`, alt: "FedEx" },
      { src: `${CDN}/69e8a9a3e807d12509c3513b_ups.svg`, alt: "UPS" },
      { src: `${CDN}/69e8a9a3d59d49c6bf3d32dd_dhl.svg`, alt: "DHL" },
      { src: `${CDN}/69e8a9a350def4cbca4a92eb_usps.svg`, alt: "USPS" },
    ],
  },
  kloud: {
    key: "kloud",
    href: "/kloud-id",
    title: "Kloud ID",
    description:
      "Verifies cloud usage against billing to identify overcharges and unused spend.",
    emoji: emojis.kloud,
    viz: vizes.kloud,
    logos: [
      { src: `${CDN}/69e8a986401a04fdfb516c2f_aws.svg`, alt: "AWS" },
      { src: `${CDN}/69e8a98614c119b6d0b24519_gcp.svg`, alt: "Google Cloud" },
    ],
  },
  seat: {
    key: "seat",
    href: "/seat-id",
    title: "Seat ID",
    description:
      "Verifies SaaS usage against billing to identify unused licenses and overcharges.",
    emoji: emojis.seat,
    viz: vizes.seat,
    logos: [
      { src: `${CDN}/69e8aa1be867fd9d7a66f538_salesforce.svg`, alt: "Salesforce" },
      { src: `${CDN}/69e8a997ae02448a9e62d5c0_google-workspace.svg`, alt: "Google Workspace" },
    ],
  },
  token: {
    key: "token",
    href: "/token-id",
    title: "Token ID",
    description:
      "Verifies AI usage against billing to identify overcharges and inefficient spend.",
    emoji: emojis.token,
    viz: vizes.token,
    logos: [
      { src: `${CDN}/69e8a9ac553a539363414ad2_openai.svg`, alt: "OpenAI" },
      { src: `${CDN}/69e8a9ac046b54c24d008aed_anthropic.svg`, alt: "Anthropic" },
      { src: `${CDN}/69e8abaccd7cfdce2d3ae140_gemini-color.svg`, alt: "Gemini" },
    ],
  },
  ad: {
    key: "ad",
    href: "/ad-id",
    title: "Ad ID",
    description:
      "Verifies ad traffic against billing to identify invalid charges and discrepancies.",
    emoji: emojis.ad,
    viz: vizes.ad,
    logos: [
      { src: `${CDN}/69e8a965ab121368400dc44f_google-ads.svg`, alt: "Google Ads" },
      { src: `${CDN}/69e8a965d6f564a86b177302_meta-ads.svg`, alt: "Meta Ads" },
      { src: `${CDN}/69e8a965a560d2adf0a6e474_tiktok-ads.svg`, alt: "TikTok Ads" },
      { src: `${CDN}/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg`, alt: "AppLovin" },
    ],
  },
  pay: {
    key: "pay",
    href: "/paymentid",
    title: "Payment ID",
    description:
      "Verifies payment fees against contracted rates to identify overcharges and hidden markups.",
    emoji: emojis.pay,
    viz: vizes.pay,
    logos: [
      { src: `${CDN}/69e8a98d555377a44d02f6f1_stripe.svg`, alt: "Stripe" },
      { src: `${CDN}/69e8a98df379ab43b9e1f8fc_adyen.svg`, alt: "Adyen" },
      { src: `${CDN}/69e8a98de0d6b803860417b8_shopify.svg`, alt: "Shopify" },
    ],
  },
};

export const DEFAULT_ORDER: ProductKey[] = ["ship", "kloud", "seat", "token", "ad", "pay"];
