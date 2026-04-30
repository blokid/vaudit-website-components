import type { ComponentMeta } from "../../registry";
import { PRODUCTS, DEFAULT_ORDER, type ProductKey } from "./data";
import "./product-cards.css";

export type ProductCardOverride = {
  title?: string;
  description?: string;
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
      type: "Partial<Record<ProductKey, { title?: string; description?: string }>>",
      description:
        "Per-key overrides for title and/or description. Useful for retitling a card (e.g. Payment ID → Vendor ID) or rewriting body copy without editing the data file.",
      default: "none",
    },
  },
  variants: {
    "default (all 6)": {},
    "single (kloud only)": { order: ["kloud"] },
    "trio (ship, kloud, pay)": { order: ["ship", "kloud", "pay"] },
    "reordered (ad first)": { order: ["ad", "kloud", "ship", "token", "seat", "pay"] },
    "vendor-id rename (ad, pay→vendor, token)": {
      order: ["ad", "pay", "token"],
      overrides: {
        pay: {
          title: "Vendor ID",
          description:
            "Verifies vendor billing across SaaS, cloud, payments, shipping, and operational spend to uncover hidden discrepancies, missed credits, and contract leakage.",
        },
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
        return (
          <a
            key={key}
            className="pa-card preview"
            data-key={key}
            href={card.href}
          >
            <div className="card-preview-viz">{card.viz}</div>
            <div className="preview-head">
              <div className="preview-title">
                <span className="emoji">{card.emoji}</span>
                {title}
              </div>
              <div className="preview-logos">
                {card.logos.map((logo) => (
                  <img
                    key={logo.src}
                    className="p-logo"
                    src={logo.src}
                    alt={logo.alt}
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
            <p className="preview-desc">{description}</p>
          </a>
        );
      })}
    </div>
  );
}
