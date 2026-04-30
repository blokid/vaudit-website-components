import type { ReactNode } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICON_CLOUD = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const ICON_CHIP = (
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
);

const ICON_WINDOW = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 9h20" />
    <circle cx="6" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

const ICON_TRUCK = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M14 18V6a2 2 0 0 0-2-2H2v14h2" />
    <path d="M14 9h4l4 4v5h-2" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="17" cy="18" r="2" />
  </svg>
);

const ICON_CARD = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
);

const ICON_CLICK = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <path d="M14 4.1 12 6" />
    <path d="m5.1 8-2.9-.8" />
    <path d="m6 12-1.9 2" />
    <path d="M7.2 2.2 8 5.1" />
    <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
  </svg>
);

const ICON_GENERIC = (
  <svg viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export type ProductSpec = {
  key: string;
  id: string;
  name: string;
  emoji: ReactNode;
  desc: string;
  longDesc: string;
  viz: ReactNode;
};

const VIZ_SHIP = (
  <div className="viz viz-ship">
    <div className="ship-path" aria-hidden="true" />
    <div className="ship-box" aria-hidden="true" />
    <div className="ship-credit" aria-hidden="true">+$</div>
  </div>
);

const VIZ_KLOUD = (
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
);

const VIZ_SEAT = (
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
);

const VIZ_TOKEN = (
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
);

const VIZ_AD = (
  <div className="viz viz-ad">
    <div className="ad-target" aria-hidden="true" />
    <div className="ad-ring" aria-hidden="true" />
    <div className="ad-ring r2" aria-hidden="true" />
    <span className="ad-click ac1" aria-hidden="true">×</span>
    <span className="ad-click ac2" aria-hidden="true">×</span>
    <span className="ad-click ac3" aria-hidden="true">×</span>
  </div>
);

const VIZ_PAY = (
  <div className="viz viz-pay">
    <div className="pay-rows" aria-hidden="true">
      <div className="pr" />
      <div className="pr pr-flag" />
      <div className="pr" />
      <div className="pr" />
    </div>
    <div className="pay-scan" aria-hidden="true" />
  </div>
);

export const PRODUCT_SPECS: Record<string, ProductSpec> = {
  ship: {
    key: "ship",
    id: "ship_id",
    name: "Ship ID",
    emoji: ICON_TRUCK,
    desc: "Shipping & logistics overcharges.",
    longDesc:
      "Verifies shipping charges against carrier terms to identify overcharges and missed refunds.",
    viz: VIZ_SHIP,
  },
  kloud: {
    key: "kloud",
    id: "kloud_id",
    name: "Kloud ID",
    emoji: ICON_CLOUD,
    desc: "Idle cloud spend and overprovisioned resources.",
    longDesc:
      "Verifies cloud usage against billing to identify overcharges and unused spend.",
    viz: VIZ_KLOUD,
  },
  seat: {
    key: "seat",
    id: "seat_id",
    name: "Seat ID",
    emoji: ICON_WINDOW,
    desc: "Unused SaaS seats and tool overlap.",
    longDesc:
      "Verifies SaaS usage against billing to identify unused licenses and overcharges.",
    viz: VIZ_SEAT,
  },
  token: {
    key: "token",
    id: "token_id",
    name: "Token ID",
    emoji: ICON_CHIP,
    desc: "AI and LLM usage waste.",
    longDesc:
      "Verifies AI usage against billing to identify overcharges and inefficient spend.",
    viz: VIZ_TOKEN,
  },
  ad: {
    key: "ad",
    id: "ad_id",
    name: "Ad ID",
    emoji: ICON_CLICK,
    desc: "Ad spend waste and audience overlap.",
    longDesc:
      "Verifies ad traffic against billing to identify invalid charges and discrepancies.",
    viz: VIZ_AD,
  },
  pay: {
    key: "pay",
    id: "pay_id",
    name: "Payment ID",
    emoji: ICON_CARD,
    desc: "Payment processor fee leakage.",
    longDesc:
      "Verifies payment fees against contracted rates to identify overcharges and hidden markups.",
    viz: VIZ_PAY,
  },
};

export const KNOWN_KEYS: string[] = ["ship", "kloud", "seat", "token", "ad", "pay"];

export function specForKey(key: string): ProductSpec {
  const known = PRODUCT_SPECS[key];
  if (known) return known;
  const stem = key || "unknown";
  const name =
    stem.charAt(0).toUpperCase() + stem.slice(1).replace(/_/g, " ") + " ID";
  return {
    key,
    id: key + "_id",
    name,
    emoji: ICON_GENERIC,
    desc: "Vendor spend and estimated waste.",
    longDesc:
      "Vendor spend and estimated waste detected by the Vaudit audit agent.",
    viz: <div className="viz" />,
  };
}
