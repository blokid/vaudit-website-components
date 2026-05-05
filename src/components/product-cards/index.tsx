import type { ComponentMeta } from "../../registry";
import { PRODUCTS, DEFAULT_ORDER, type ProductKey } from "./data";
import "./product-cards.css";

export type ProductCardOverride = {
  title?: string;
  description?: string;
  /**
   * Override the card's link target. The whole card is a single anchor, so
   * this also drives where the visible CTA (if enabled) sends visitors.
   * Defaults to the card's built-in route (e.g. `/paymentid` for `pay`).
   */
  href?: string;
  /**
   * Per-card opt-in CTA shown at the bottom of the card. Pass `true` to use
   * the default "Learn More →" label, or `{ label }` to customize. The
   * destination is always the card's link target — set `href` above to
   * change it.
   */
  cta?: boolean | { label?: string };
  /**
   * Replace the built-in title SVG icon with a custom image. Pass an
   * absolute URL (e.g. a Webflow asset). Decorative — the title text is
   * the accessible label.
   */
  titleIcon?: string;
  /**
   * Replace the card's default vendor logo row. Pass `[]` to hide the row
   * entirely; pass an array of `{ src, alt }` to swap in a different set.
   */
  vendorIcons?: { src: string; alt: string }[];
};

export type ProductCardsProps = {
  /**
   * Ordered list of product keys to display. If omitted, all six render in
   * the default order. If provided, only the listed keys render, in the
   * given order. Unknown keys are ignored.
   *
   * Valid keys: "ship" | "kloud" | "seat" | "token" | "ad" | "pay"
   */
  order?: ProductKey[] | string[];
  /**
   * Per-key overrides for `title` and/or `description`. Use this to retitle
   * a card (e.g. show "Payment ID" as "Vendor ID") or rewrite the body copy
   * without forking the data file.
   */
  overrides?: Partial<Record<ProductKey, ProductCardOverride>>;
};

const VALID_KEYS = new Set<string>(DEFAULT_ORDER);

export const meta: ComponentMeta<ProductCardsProps> = {
  description:
    "Six clickable Vaudit product cards with animated viz. Pass `order` to filter and sort, `overrides` to retitle or rewrite copy.",
  props: {
    order: {
      type: '("ship" | "kloud" | "seat" | "token" | "ad" | "pay")[]',
      description:
        "Ordered list of product keys to display. Filters and sorts the grid; unknown keys are ignored. Omit to render all six in the default order.",
      default: "all 6 in default order",
    },
    overrides: {
      type: "Partial<Record<ProductKey, { title?: string; description?: string; href?: string; cta?: boolean | { label?: string }; titleIcon?: string; vendorIcons?: { src: string; alt: string }[] }>>",
      description:
        'Per-key overrides for title, description, link target, CTA, title icon, and/or vendor icon row. Pass `href` to retarget the whole card. Pass `cta: true` to show a "Learn More →" affordance, or `{ label }` to customize. Pass `titleIcon` (URL) to swap the built-in SVG icon for a custom image. Pass `vendorIcons` to swap the default logo row (use `[]` to hide it).',
      default: "none",
    },
  },
  variants: {
    "default (all 6)": {},
    "single (kloud only)": { order: ["kloud"] },
    "trio (ship, kloud, pay)": { order: ["ship", "kloud", "pay"] },
    "reordered (ad first)": {
      order: ["ad", "kloud", "ship", "token", "seat", "pay"],
    },
    "vendor-id rename (ad, pay→vendor, token)": {
      order: ["ad", "pay", "token"],
      overrides: {
        pay: {
          title: "Vendor ID",
          description:
            "Verifies vendor billing across SaaS, cloud, payments, shipping, and operational spend to uncover hidden discrepancies, billing discrepancies, and contract leakage.",
        },
      },
    },
    "two-card with CTAs (vendor + ad)": {
      order: ["pay", "ad"],
      overrides: {
        pay: {
          title: "Vendor ID",
          description:
            "Verifies vendor billing across SaaS, cloud, payments, shipping, and operational spend to uncover billing discrepancies, unclaimed adjustments, and contract leakage.",
          href: "/vendor-id",
          cta: true,
        },
        ad: { cta: true },
      },
    },
  },
};

function resolveOrder(order: ProductCardsProps["order"]): ProductKey[] {
  if (!order || !Array.isArray(order) || order.length === 0) {
    return DEFAULT_ORDER;
  }
  const seen = new Set<string>();
  const out: ProductKey[] = [];
  for (const k of order) {
    const key = String(k);
    if (!VALID_KEYS.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key as ProductKey);
  }
  return out.length ? out : DEFAULT_ORDER;
}

export default function ProductCards({ order, overrides }: ProductCardsProps) {
  const keys = resolveOrder(order);

  return (
    <div className="product-card-grid">
      {keys.map((key) => {
        const card = PRODUCTS[key];
        const override = overrides?.[key];
        const title = override?.title ?? card.title;
        const description = override?.description ?? card.description;
        const ctaConfig = override?.cta;
        const ctaEnabled = Boolean(ctaConfig);
        const ctaObject = typeof ctaConfig === "object" ? ctaConfig : null;
        const ctaLabel = ctaObject?.label ?? "Learn More";
        const href = override?.href ?? card.href;
        const titleIcon = override?.titleIcon;
        const logos = override?.vendorIcons ?? card.logos;
        return (
          <a key={key} className="pa-card preview" data-key={key} href={href}>
            <div className="preview-title">
              {titleIcon ? (
                <img
                  className="title-icon"
                  src={titleIcon}
                  alt=""
                  loading="lazy"
                />
              ) : (
                <span className="emoji">{card.emoji}</span>
              )}
              {title}
            </div>
            <div className="card-preview-viz">{card.viz}</div>
            {logos.length > 0 && (
              <div className="preview-logos">
                {logos.map((logo) => (
                  <img
                    key={logo.src}
                    className="p-logo"
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            <p className="preview-desc">{description}</p>
            {ctaEnabled && (
              <span className="product-card-cta" aria-hidden="true">
                {ctaLabel}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            )}
          </a>
        );
      })}
    </div>
  );
}
