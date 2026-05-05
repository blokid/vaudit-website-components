import type { ComponentMeta } from "../../registry";
import { ANIMATIONS, type ProductKey } from "../product-cards/data";
import "../product-cards/product-cards.css";

const ANIMATION_KEYS: ProductKey[] = ["ship", "kloud", "seat", "token", "ad", "pay"];
const ANIMATION_KEY_SET = new Set<string>(ANIMATION_KEYS);

export type CustomProductCardItem = {
  title: string;
  description: string;
  vendorIcons: { src: string; alt: string }[];
  /**
   * Animation id — selects one of the built-in product animations.
   * Valid: "ship" | "kloud" | "seat" | "token" | "ad" | "pay".
   * Unknown ids render no viz.
   */
  animation: ProductKey | string;
  /** Optional click-through; when omitted the card renders as a non-link. */
  href?: string;
  /** Optional bottom CTA. `true` → "Learn More →"; `{ label }` → custom label. */
  cta?: boolean | { label?: string };
  /**
   * Optional icon shown next to the title. Pass an absolute URL (e.g. a
   * Webflow asset). Decorative — the title text is the accessible label.
   */
  titleIcon?: string;
};

export type CustomProductCardsProps = {
  /**
   * Cards to render in order. Each item supplies its own copy and vendor
   * icons; `animation` reuses one of the six built-in product animations
   * by id.
   */
  cards: CustomProductCardItem[];
};

export const meta: ComponentMeta<CustomProductCardsProps> = {
  description:
    "Generic product-cards grid driven by a `cards` prop. Same visual style as `product-cards`, but every card's title, description, vendor icons, and animation are passed in directly. Use this when the cards aren't the canonical six Vaudit products.",
  props: {
    cards: {
      type: '{ title: string; description: string; vendorIcons: { src: string; alt: string }[]; animation: "ship" | "kloud" | "seat" | "token" | "ad" | "pay"; href?: string; cta?: boolean | { label?: string }; titleIcon?: string }[]',
      description:
        "Ordered list of cards. `animation` reuses one of the built-in viz animations by id; unknown ids render no viz. Pass `href` to make the card a link; pass `cta` to show a bottom affordance; pass `titleIcon` (URL) to add an icon next to the title.",
      required: true,
    },
  },
  variants: {
    "single (custom copy + kloud animation)": {
      cards: [
        {
          title: "Cloud Audit",
          description:
            "Verifies cloud usage against billing to identify overcharges and unused spend.",
          vendorIcons: [
            {
              src: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a986401a04fdfb516c2f_aws.svg",
              alt: "AWS",
            },
            {
              src: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg",
              alt: "Google Cloud",
            },
          ],
          animation: "kloud",
          href: "/kloud-id",
        },
      ],
    },
    "two cards (mixed animations)": {
      cards: [
        {
          title: "Cloud Audit",
          description:
            "Verifies cloud usage against billing to identify overcharges and unused spend.",
          vendorIcons: [
            {
              src: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a986401a04fdfb516c2f_aws.svg",
              alt: "AWS",
            },
            {
              src: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg",
              alt: "Google Cloud",
            },
          ],
          animation: "kloud",
        },
        {
          title: "AI Spend",
          description:
            "Verifies AI token usage against billing to flag inefficient spend.",
          vendorIcons: [
            {
              src: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac553a539363414ad2_openai.svg",
              alt: "OpenAI",
            },
            {
              src: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac046b54c24d008aed_anthropic.svg",
              alt: "Anthropic",
            },
          ],
          animation: "token",
          cta: true,
        },
      ],
    },
  },
};

export default function CustomProductCards({ cards }: CustomProductCardsProps) {
  if (!Array.isArray(cards) || cards.length === 0) return null;

  return (
    <div className="product-card-grid">
      {cards.map((card, i) => {
        const animation = ANIMATION_KEY_SET.has(card.animation)
          ? ANIMATIONS[card.animation as ProductKey]
          : null;
        const ctaConfig = card.cta;
        const ctaEnabled = Boolean(ctaConfig);
        const ctaObject = typeof ctaConfig === "object" ? ctaConfig : null;
        const ctaLabel = ctaObject?.label ?? "Learn More";

        const inner = (
          <>
            <div className="preview-title">
              {card.titleIcon && (
                <img
                  className="title-icon"
                  src={card.titleIcon}
                  alt=""
                  loading="lazy"
                />
              )}
              {card.title}
            </div>
            {animation && <div className="card-preview-viz">{animation}</div>}
            {card.vendorIcons.length > 0 && (
              <div className="preview-logos">
                {card.vendorIcons.map((icon) => (
                  <img
                    key={icon.src}
                    className="p-logo"
                    src={icon.src}
                    alt={icon.alt}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            <p className="preview-desc">{card.description}</p>
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
          </>
        );

        return card.href ? (
          <a key={i} className="pa-card preview" href={card.href}>
            {inner}
          </a>
        ) : (
          <div key={i} className="pa-card preview">
            {inner}
          </div>
        );
      })}
    </div>
  );
}
