import { useCallback } from "react";
import type { ComponentMeta } from "../../registry";
import "./category-tiles.css";

const CDN = "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee";
const ICONIFY = "https://api.iconify.design/logos";

type Item = {
  /** Vendor display name. */
  label: string;
  /** Brand-logo URL. */
  iconUrl?: string;
};

type Tile = {
  /** Category headline, rendered uppercase at the top of the card. */
  category: string;
  /** Vendors listed inside the card. */
  items: Item[];
  /**
   * Smooth-scroll target for the whole card. `#anchor` smooth-scrolls to the
   * matching id; absolute or path URLs navigate normally. Defaults to a slug
   * of the category name when omitted.
   */
  href?: string;
};

type CategoryTilesProps = {
  /**
   * Tiles to render. Defaults match the legacy chip strip for Ads + AI (3 each)
   * and the full `vendor-coverage` lists for SaaS / Cloud / Payments / Shipping.
   */
  tiles?: Tile[];
};

const DEFAULT_TILES: Tile[] = [
  {
    category: "Ads",
    href: "#ads",
    items: [
      { label: "Google Ads", iconUrl: `${CDN}/69e8a965ab121368400dc44f_google-ads.svg` },
      { label: "Meta Ads",   iconUrl: `${CDN}/69e8a965d6f564a86b177302_meta-ads.svg` },
      { label: "TikTok Ads", iconUrl: `${CDN}/69e8a965a560d2adf0a6e474_tiktok-ads.svg` },
    ],
  },
  {
    category: "AI",
    href: "#ai",
    items: [
      { label: "OpenAI",    iconUrl: `${CDN}/69f326b062f8cffa2ee10ca1_openai-2.svg` },
      { label: "Anthropic", iconUrl: `${CDN}/69e8a9ac046b54c24d008aed_anthropic.svg` },
      { label: "Google AI", iconUrl: `${CDN}/69e8abaccd7cfdce2d3ae140_gemini-color.svg` },
    ],
  },
  {
    category: "SaaS",
    href: "#saas",
    items: [
      { label: "Salesforce", iconUrl: `${CDN}/69e8aa1be867fd9d7a66f538_salesforce.svg` },
      { label: "HubSpot",    iconUrl: `${ICONIFY}/hubspot.svg` },
      { label: "Slack",      iconUrl: `${ICONIFY}/slack-icon.svg` },
    ],
  },
  {
    category: "Cloud",
    href: "#cloud",
    items: [
      { label: "AWS",          iconUrl: `${CDN}/69e8a986401a04fdfb516c2f_aws.svg` },
      { label: "Azure",        iconUrl: `${ICONIFY}/microsoft-azure.svg` },
      { label: "Google Cloud", iconUrl: `${CDN}/69e8a98614c119b6d0b24519_gcp.svg` },
    ],
  },
  {
    category: "Payments",
    href: "#payments",
    items: [
      { label: "Stripe",           iconUrl: `${CDN}/69e8a98d555377a44d02f6f1_stripe.svg` },
      { label: "Shopify Payments", iconUrl: `${CDN}/69e8a98de0d6b803860417b8_shopify.svg` },
      { label: "PayPal",           iconUrl: `${ICONIFY}/paypal.svg` },
    ],
  },
  {
    category: "Shipping & Logistics",
    href: "#shipping",
    items: [
      { label: "UPS",   iconUrl: `${CDN}/69e8a9a3e807d12509c3513b_ups.svg` },
      { label: "FedEx", iconUrl: `${CDN}/69e8a9a37f220d58951c852a_fedex.svg` },
      { label: "DHL",   iconUrl: `${CDN}/69e8a9a3d59d49c6bf3d32dd_dhl.svg` },
    ],
  },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const meta: ComponentMeta<CategoryTilesProps> = {
  description:
    "Category cards — one bordered tile per category listing each vendor as icon + name pairs. The whole card is a single anchor that smooth-scrolls to the matching `vendor-coverage` band.",
  props: {
    tiles: {
      type: "{ category: string; items: { label: string; iconUrl?: string }[]; href?: string }[]",
      description:
        "Tiles to render. `href` defaults to a slug of the category (e.g. 'Shipping & Logistics' → `#shipping-and-logistics`).",
      default: "6 default VendorID categories — 3 vendors each, matching the chip-strip preview",
    },
  },
  variants: {
    "VendorID (default 6)": {},
  },
};

export default function CategoryTiles({ tiles = DEFAULT_TILES }: CategoryTilesProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  if (!tiles?.length) return null;

  return (
    <div className="rc-cattiles">
      <div className="rc-cattiles__grid">
        {tiles.map((t, i) => {
          const href = t.href ?? `#${slugify(t.category)}`;
          return (
            <a
              key={`${t.category}-${i}`}
              className="rc-cattiles__tile"
              href={href}
              onClick={(e) => handleClick(e, href)}
            >
              <h3 className="rc-cattiles__category">{t.category}</h3>
              <div className="rc-cattiles__items">
                {t.items.map((item, j) => (
                  <span key={`${item.label}-${j}`} className="rc-cattiles__item">
                    {item.iconUrl && (
                      <span className="rc-cattiles__icon" aria-hidden="true">
                        <img
                          src={item.iconUrl}
                          alt=""
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </span>
                    )}
                    <span className="rc-cattiles__name">{item.label}</span>
                  </span>
                ))}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
