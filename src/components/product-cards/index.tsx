import type { ComponentMeta } from "../../registry";
import { PRODUCTS, DEFAULT_ORDER, type ProductKey } from "./data";
import "./product-cards.css";

type ProductCardsProps = {
  /**
   * Ordered list of product keys to display. If omitted, all six render in
   * the default order. If provided, only the listed keys render, in the
   * given order. Unknown keys are ignored.
   *
   * Valid keys: "ship" | "kloud" | "seat" | "token" | "ad" | "pay"
   */
  order?: ProductKey[] | string[];
};

const VALID_KEYS = new Set<string>(DEFAULT_ORDER);

export const meta: ComponentMeta<ProductCardsProps> = {
  description:
    "Six clickable Vaudit product cards with animated viz. Pass `order` to filter and sort.",
  variants: {
    "default (all 6)": {},
    "single (kloud only)": { order: ["kloud"] },
    "trio (ship, kloud, pay)": { order: ["ship", "kloud", "pay"] },
    "reordered (ad first)": { order: ["ad", "kloud", "ship", "token", "seat", "pay"] },
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

export default function ProductCards({ order }: ProductCardsProps) {
  const keys = resolveOrder(order);

  return (
    <div className="product-card-grid">
      {keys.map((key) => {
        const card = PRODUCTS[key];
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
                {card.title}
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
            <p className="preview-desc">{card.description}</p>
          </a>
        );
      })}
    </div>
  );
}
