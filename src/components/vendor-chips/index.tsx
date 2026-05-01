import { useCallback, type ReactNode } from "react";
import type { ComponentMeta } from "../../registry";
import "./vendor-chips.css";

type Platform = {
  /** Visible chip label (e.g. "Google Ads"). */
  label: string;
  /** Brand-logo URL — rendered in an `<img>`. Use for full-color CDN SVGs. */
  iconUrl?: string;
  /**
   * Inline SVG / React node, OR a built-in keyword string. Takes precedence
   * over `iconUrl`. Use this for monochrome icons that should inherit
   * `currentColor`. Built-in keywords usable from `data-prop` JSON:
   * `"linkedin" | "dv360" | "trade-desk" | "dsps"`.
   */
  icon?: ReactNode | "linkedin" | "dv360" | "trade-desk" | "dsps";
  /**
   * Optional link target. `#anchor` smooth-scrolls to that id on the current
   * page; absolute or path URLs navigate normally (so it works cross-page).
   */
  href?: string;
};

type PlatformGroup = {
  /** Category eyebrow rendered above the row (e.g. "Ads", "AI"). */
  category: string;
  /** Chips inside the category. */
  items: Platform[];
};

type VendorChipsProps = {
  /** Eyebrow header rendered above the chips (e.g. "Covers your entire vendor ecosystem"). */
  header?: string;
  /** Supporting line rendered below the chips (e.g. "Start with ads. Expand to every bill."). */
  note?: string;
  /**
   * Flat row of chips. Use this when there's no category structure
   * (the AdID / TokenID hero strips). Mutually exclusive with
   * `platformGroups` — if both are passed, `platformGroups` wins.
   */
  platforms?: Platform[];
  /**
   * Categorized chips — one labelled row per category. Use this when
   * the strip spans multiple vendor types (the VendorID hero strip).
   */
  platformGroups?: PlatformGroup[];
};

const LinkedInIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const DV360Icon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M10 8.5v5l5-2.5z" fill="currentColor" stroke="none" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const TradeDeskIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 3v18h18" />
    <path d="m7 14 3-3 3 3 5-5" />
    <path d="M14 9h4v4" />
  </svg>
);

const DSPsIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="11.49" />
  </svg>
);

const ICON_REGISTRY: Record<string, ReactNode> = {
  linkedin: LinkedInIcon,
  dv360: DV360Icon,
  "trade-desk": TradeDeskIcon,
  dsps: DSPsIcon,
};

export const meta: ComponentMeta<VendorChipsProps> = {
  description:
    "Standalone vendor / integration chip strip. Drop next to the agent embed for the AdID / TokenID / VendorID heroes.",
  props: {
    header: {
      type: "string",
      description:
        "Eyebrow header rendered above the chips. Honors `\\n` for line breaks.",
      default: "none",
    },
    note: {
      type: "string",
      description:
        "Supporting line rendered below the chips. Honors `\\n` for line breaks.",
      default: "none",
    },
    platforms: {
      type: "{ label: string; iconUrl?: string; href?: string; icon?: 'linkedin' | 'dv360' | 'trade-desk' | 'dsps' }[]",
      description:
        "Flat row of chips. Mutually exclusive with `platformGroups`.",
      default: "none",
    },
    platformGroups: {
      type: "{ category: string; items: Platform[] }[]",
      description:
        "Categorized chip rows (one labelled row per category). Wins over `platforms` if both are passed.",
      default: "none",
    },
  },
  variants: {
    "ad-id flat strip": {
      note: "Start with ads. Expand to every bill.",
      platforms: [
        { label: "Google Ads", iconUrl: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg", href: "#google-ads" },
        { label: "Meta Ads",   iconUrl: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg",   href: "#meta-ads" },
        { label: "TikTok Ads", iconUrl: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965a560d2adf0a6e474_tiktok-ads.svg", href: "#tiktok-ads" },
      ],
    },
    "vendor-id categorized": {
      header: "Covers your entire vendor ecosystem",
      platformGroups: [
        { category: "Ads", items: [
          { label: "Google Ads", iconUrl: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg", href: "#google-ads" },
          { label: "Meta Ads",   iconUrl: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg",   href: "#meta-ads" },
        ]},
        { category: "AI", items: [
          { label: "OpenAI", iconUrl: "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69f326b062f8cffa2ee10ca1_openai-2.svg", href: "#openai" },
        ]},
      ],
    },
  },
};

function Chip({
  p,
  onClick,
}: {
  p: Platform;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => void;
}) {
  const resolvedIcon =
    typeof p.icon === "string" ? ICON_REGISTRY[p.icon] : p.icon;
  return (
    <a
      className="rc-chips__chip"
      href={p.href || "#"}
      onClick={(e) => onClick(e, p.href)}
    >
      {resolvedIcon ? (
        <span className="rc-chips__icon" aria-hidden="true">
          {resolvedIcon}
        </span>
      ) : p.iconUrl ? (
        <img
          className="rc-chips__logo"
          src={p.iconUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <span>{p.label}</span>
    </a>
  );
}

export default function VendorChips({
  header,
  note,
  platforms,
  platformGroups,
}: VendorChipsProps) {
  // `#anchor` hrefs smooth-scroll on the current page; everything else
  // navigates normally (so the same chip works cross-page too).
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => {
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  if (!platformGroups?.length && !platforms?.length) return null;

  return (
    <div className="rc-chips">
      {header && <p className="rc-chips__header">{header}</p>}

      {platformGroups && platformGroups.length > 0 ? (
        <div className="rc-chips__groups">
          {platformGroups.map((group, gi) => (
            <div key={`${group.category}-${gi}`} className="rc-chips__group">
              <span className="rc-chips__group-label">{group.category}</span>
              <div className="rc-chips__row">
                {group.items.map((p, i) => (
                  <Chip key={`${group.category}-${i}`} p={p} onClick={handleClick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rc-chips__row">
          {platforms!.map((p, i) => (
            <Chip key={`${p.label}-${i}`} p={p} onClick={handleClick} />
          ))}
        </div>
      )}

      {note && <p className="rc-chips__note">{note}</p>}
    </div>
  );
}
