import { useCallback, type ReactNode } from "react";
import type { ComponentMeta } from "../../registry";
import "./category-tiles.css";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICON_REGISTRY: Record<string, ReactNode> = {
  ads: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M14 4.1 12 6" />
      <path d="m5.1 8-2.9-.8" />
      <path d="m6 12-1.9 2" />
      <path d="M7.2 2.2 8 5.1" />
      <path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
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
  saas: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 9h20" />
      <circle cx="6" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  ),
  cloud: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  ),
  payments: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  ),
  shipping: (
    <svg viewBox="0 0 24 24" {...stroke} aria-hidden="true">
      <path d="M14 18V6a2 2 0 0 0-2-2H2v14h2" />
      <path d="M14 9h4l4 4v5h-2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  ),
};

type Tile = {
  /** Display title (e.g. "Ads"). */
  title: string;
  /**
   * Built-in icon keyword. One of `ads | ai | saas | cloud | payments | shipping`.
   * Falls back to a generic glyph if the key isn't registered.
   */
  iconKey?: keyof typeof ICON_REGISTRY | string;
  /**
   * Click target. `#anchor` smooth-scrolls to that id on the current page;
   * absolute or path URLs navigate normally.
   */
  href: string;
};

type CategoryTilesProps = {
  /**
   * Tiles to render. Defaults to the six VendorID categories that match the
   * anchor ids the bundled `vendor-coverage` component renders.
   */
  tiles?: Tile[];
};

const DEFAULT_TILES: Tile[] = [
  { title: "Ads",       iconKey: "ads",       href: "#ads" },
  { title: "AI",        iconKey: "ai",        href: "#ai" },
  { title: "SaaS",      iconKey: "saas",      href: "#saas" },
  { title: "Cloud",     iconKey: "cloud",     href: "#cloud" },
  { title: "Payments",  iconKey: "payments",  href: "#payments" },
  { title: "Shipping",  iconKey: "shipping",  href: "#shipping" },
];

export const meta: ComponentMeta<CategoryTilesProps> = {
  description:
    "Vertical icon + name tile cards. Click smooth-scrolls to the matching `vendor-coverage` band. Defaults to six VendorID categories.",
  props: {
    tiles: {
      type: "{ title: string; iconKey?: 'ads'|'ai'|'saas'|'cloud'|'payments'|'shipping'; href: string }[]",
      description:
        "Tiles to render. Defaults to the six VendorID categories.",
      default: '6 categories matching `vendor-coverage` ids',
    },
  },
  variants: {
    "VendorID (default 6)": {},
    "Three-up (Ads / AI / Cloud)": {
      tiles: [
        { title: "Ads", iconKey: "ads", href: "#ads" },
        { title: "AI", iconKey: "ai", href: "#ai" },
        { title: "Cloud", iconKey: "cloud", href: "#cloud" },
      ],
    },
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
          const icon = t.iconKey ? ICON_REGISTRY[t.iconKey] : null;
          return (
            <a
              key={`${t.title}-${i}`}
              className="rc-cattiles__tile"
              href={t.href}
              onClick={(e) => handleClick(e, t.href)}
            >
              {icon && <span className="rc-cattiles__icon">{icon}</span>}
              <span className="rc-cattiles__title">{t.title}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
