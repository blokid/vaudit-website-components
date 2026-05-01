import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import type { AgentPhase, Product, ScanItem, StepName } from "./types";
import { KNOWN_KEYS, PRODUCT_SPECS, specForKey } from "./products";
import {
  buildRunPayload,
  consumeSSE,
  ensureSession,
  extractAuditProducts,
  getAgentBaseUrl,
  getSessionId,
  getToken,
  idToKey,
  isValidDomain,
  normalizeDomain,
  streamAgent,
  USD,
} from "./agent-api";
import ResultCard from "./result-card";
import TotalBanner from "./total-banner";
import ProductCards, { type ProductCardOverride } from "../product-cards";
import type { ProductKey } from "../product-cards/data";
import "./presignup-agent.css";

const DEFAULT_PRODUCT_ORDER: ProductKey[] = ["ad", "pay", "token"];

const DEFAULT_PRODUCT_OVERRIDES: Partial<Record<ProductKey, ProductCardOverride>> = {
  ad: {
    description:
      "Verifies ad platform billing to identify invalid charges, billing discrepancies, and recoverable spend across Google, Meta, DSPs, and programmatic platforms.",
  },
  pay: {
    title: "Vendor ID",
    description:
      "Verifies vendor billing across SaaS, cloud, payments, shipping, and operational spend to uncover hidden discrepancies, billing discrepancies, and contract leakage.",
  },
  token: {
    description:
      "Verifies AI usage billing across LLM platforms to identify duplicate charges, pricing mismatches, unused spend, and inefficient token costs.",
  },
};

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
  icon?: React.ReactNode | "linkedin" | "dv360" | "trade-desk" | "dsps";
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

// Built-in inline SVGs addressable from Webflow `data-prop` JSON via string
// keywords (since React nodes can't be serialized in JSON).
const ICON_REGISTRY: Record<string, React.ReactNode> = {
  linkedin: LinkedInIcon,
  dv360: DV360Icon,
  "trade-desk": TradeDeskIcon,
  dsps: DSPsIcon,
};

type PresignupAgentProps = {
  /** Override the agent base URL — defaults to staging on non-vaudit.com origins. */
  agentBaseUrl?: string;
  /** Main headline above the input card. */
  title?: string;
  /** Supporting line under the headline. */
  subtitle?: string;
  /** Textarea placeholder copy. */
  placeholder?: string;
  /** Submit-button label. */
  ctaLabel?: string;
  /** Small line shown above the integrations row (only when `platforms` is set). */
  platformsLabel?: string;
  /**
   * Integration chips rendered directly under the input card. Each chip can
   * carry a brand-logo URL and an `href` (anchor or path) that scrolls /
   * navigates to the matching product-page section on click.
   */
  platforms?: Platform[];
  /** Supporting line rendered between the input card and the integrations section. */
  ctaNote?: string;
  /** Eyebrow header rendered above the integrations row (e.g. "Covers your entire vendor ecosystem"). */
  platformsHeader?: string;
  /**
   * Categorized integration chips. When provided, takes precedence over the
   * flat `platforms` prop and renders each group with its own category label.
   */
  platformGroups?: PlatformGroup[];
  /**
   * Order of the product cards rendered below the input. Defaults to
   * `["ad", "pay", "token"]`. Pass any subset/order of valid keys
   * (`ship | kloud | seat | token | ad | pay`). Pass `[]` to hide the
   * cards entirely.
   */
  productOrder?: ProductKey[] | string[];
  /**
   * Per-key overrides for the product cards below the input. Replaces the
   * built-in defaults entirely (i.e. shallow replace, not merge). Use this
   * to retitle, rewrite descriptions, retarget links, or enable per-card
   * CTAs without forking the component.
   */
  productOverrides?: Partial<Record<ProductKey, ProductCardOverride>>;
};

const DEFAULT_TITLE = "Connect. Audit. Get Money Back";
const DEFAULT_SUBTITLE =
  "See what Vaudit would recover for your business in under 10 seconds.";
const DEFAULT_PLACEHOLDER =
  "Enter your website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…";
const DEFAULT_CTA = "Audit My Vendors";

// Categorized vendor list for the Vendor ID product page. The Ads row reuses
// the brand-color CDN SVGs already uploaded to Webflow; the rest pull from
// simpleicons.org (single-color brand-tinted SVGs that render cleanly inside
// the chip's white logo background). Each chip's href smooth-scrolls to a
// matching `#anchor` section the page can host below the agent.
const VENDOR_GROUPS: PlatformGroup[] = [
  {
    category: "Ads",
    items: [
      {
        label: "Google Ads",
        iconUrl:
          "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg",
        href: "#google-ads",
      },
      {
        label: "Meta Ads",
        iconUrl:
          "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg",
        href: "#meta-ads",
      },
      {
        label: "TikTok Ads",
        iconUrl:
          "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965a560d2adf0a6e474_tiktok-ads.svg",
        href: "#tiktok-ads",
      },
    ],
  },
  {
    category: "AI",
    items: [
      {
        label: "OpenAI",
        iconUrl: "https://cdn.simpleicons.org/openai",
        href: "#openai",
      },
      {
        label: "Anthropic",
        iconUrl: "https://cdn.simpleicons.org/anthropic",
        href: "#anthropic",
      },
      {
        label: "Google AI",
        iconUrl: "https://cdn.simpleicons.org/googlegemini",
        href: "#google-ai",
      },
    ],
  },
  {
    category: "SaaS",
    items: [
      {
        label: "Salesforce",
        iconUrl: "https://cdn.simpleicons.org/salesforce",
        href: "#salesforce",
      },
      {
        label: "HubSpot",
        iconUrl: "https://cdn.simpleicons.org/hubspot",
        href: "#hubspot",
      },
      {
        label: "Slack",
        iconUrl: "https://cdn.simpleicons.org/slack",
        href: "#slack",
      },
    ],
  },
  {
    category: "Cloud",
    items: [
      {
        label: "AWS",
        iconUrl: "https://cdn.simpleicons.org/amazonaws",
        href: "#aws",
      },
      {
        label: "Azure",
        iconUrl: "https://cdn.simpleicons.org/microsoftazure",
        href: "#azure",
      },
      {
        label: "Google Cloud",
        iconUrl: "https://cdn.simpleicons.org/googlecloud",
        href: "#google-cloud",
      },
    ],
  },
  {
    category: "Payments",
    items: [
      {
        label: "Stripe",
        iconUrl: "https://cdn.simpleicons.org/stripe",
        href: "#stripe",
      },
      {
        label: "Shopify Payments",
        iconUrl: "https://cdn.simpleicons.org/shopify",
        href: "#shopify-payments",
      },
      {
        label: "PayPal",
        iconUrl: "https://cdn.simpleicons.org/paypal",
        href: "#paypal",
      },
    ],
  },
  {
    category: "Shipping & Logistics",
    items: [
      {
        label: "UPS",
        iconUrl: "https://cdn.simpleicons.org/ups",
        href: "#ups",
      },
      {
        label: "FedEx",
        iconUrl: "https://cdn.simpleicons.org/fedex",
        href: "#fedex",
      },
      {
        label: "DHL",
        iconUrl: "https://cdn.simpleicons.org/dhl",
        href: "#dhl",
      },
    ],
  },
];

const AD_PLATFORMS: Platform[] = [
  {
    label: "Google Ads",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg",
    href: "#google-ads",
  },
  {
    label: "Meta Ads",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg",
    href: "#meta-ads",
  },
  {
    label: "TikTok Ads",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965a560d2adf0a6e474_tiktok-ads.svg",
    href: "#tiktok-ads",
  },
  {
    label: "AppLovin",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg",
    href: "#applovin",
  },
  {
    label: "DV360",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69f30d0d639ab6b06147914f_google-display-and-video-ads.svg",
    href: "#dv360",
  },
  {
    label: "Trade Desk",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69f30e65b6ef9caacec11a54_The-Trade-Desk-Logo.svg",
    href: "#trade-desk",
  },
  {
    label: "Bing Ads",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69f30f19c4482ab1bb951e04_bing-1.svg",
    href: "#bing-ads",
  },
  {
    label: "LinkedIn Ads",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69f30f492136aba6741835f0_linkedin-icon-2.svg",
    href: "#linkedin-ads",
  },
  {
    label: "DSPs",
    iconUrl:
      "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69f30fd7bc030dc4062dedce_amazon-simple.svg",
    href: "#dsps",
  },
];

export const meta: ComponentMeta<PresignupAgentProps> = {
  description:
    "Live audit input + scan reveal. Hits the Vaudit onboarding-agent SSE endpoint.",
  props: {
    agentBaseUrl: {
      type: "string",
      description:
        "Override the agent base URL. When omitted, uses prod on vaudit.com origins and staging elsewhere.",
      default: "auto-detect",
    },
    title: {
      type: "string",
      description: "Main headline above the input card.",
      default: `"${DEFAULT_TITLE}"`,
    },
    subtitle: {
      type: "string",
      description: "Supporting line under the headline.",
      default: `"${DEFAULT_SUBTITLE}"`,
    },
    placeholder: {
      type: "string",
      description: "Textarea placeholder copy.",
      default: "see source",
    },
    ctaLabel: {
      type: "string",
      description: "Submit-button label.",
      default: `"${DEFAULT_CTA}"`,
    },
    platformsLabel: {
      type: "string",
      description:
        "Small line shown above the integrations row (only rendered when `platforms` is set).",
      default: "none",
    },
    platforms: {
      type: "{ label: string; iconUrl?: string; href?: string }[]",
      description:
        "Integration chips rendered under the input card. `href` accepts `#anchor` (smooth-scrolls on the current page) or any URL/path (navigates normally).",
      default: "none",
    },
    ctaNote: {
      type: "string",
      description:
        "Supporting line rendered between the input card and the integrations section.",
      default: "none",
    },
    platformsHeader: {
      type: "string",
      description:
        "Eyebrow header rendered above the integrations row.",
      default: "none",
    },
    platformGroups: {
      type: "{ category: string; items: Platform[] }[]",
      description:
        "Categorized integration chips. When set, overrides `platforms` and renders one labelled row per category.",
      default: "none",
    },
    productOrder: {
      type: '("ship" | "kloud" | "seat" | "token" | "ad" | "pay")[]',
      description:
        "Order of the product cards rendered below the input. Filters and sorts the grid; unknown keys are ignored. Pass `[]` to hide the cards entirely.",
      default: '["ad", "pay", "token"]',
    },
    productOverrides: {
      type: "Partial<Record<ProductKey, { title?: string; description?: string; href?: string; cta?: boolean | { label?: string } }>>",
      description:
        "Per-key overrides for the product cards (title, description, href, cta). Replaces the built-in defaults; pass `{}` to clear them.",
      default: "built-in ad/pay/token copy",
    },
  },
  variants: {
    "default (auto-detect prod/staging)": {},
    "force staging": {
      agentBaseUrl: "https://onboarding-agent.staging.vaudit.com",
    },
    "ad ID page (custom hero + ad platforms)": {
      title: "Connect. Verify. Recover.",
      subtitle:
        "See what Vaudit can recover across your ad spend before billing discrepancies become accepted cost.",
      placeholder:
        "Enter your website, ad platforms, or paid media stack to identify invalid charges, billing discrepancies, and recoverable spend.",
      ctaLabel: "Audit My Ad Spend",
      platformsLabel: "Start with ads. Expand to every bill.",
      platforms: AD_PLATFORMS,
    },
    "custom product-card copy (short blurbs)": {
      productOverrides: {
        ad: {
          title: "AdID",
          description:
            "Verifies ad platform billing to identify invalid charges, discrepancies, and recoverable spend.",
        },
        pay: {
          title: "VendorID",
          description:
            "Verifies vendor billing across SaaS, cloud, payments, and operations to uncover discrepancies and contract leakage.",
        },
        token: {
          description:
            "Verifies AI usage and billing to detect duplicates, pricing mismatches, and unused spend.",
        },
      },
    },
    "vendor ID page (categorized vendors)": {
      title: "Connect. Verify. Uncover Recoverable Value.",
      subtitle:
        "One system to verify billing across ads, AI, SaaS, cloud, payments, shipping, and operational vendors. Find discrepancies, contract leakage, and recoverable value before it becomes accepted cost.",
      placeholder:
        "Enter your ERP, accounting system, or vendor stack to uncover billing discrepancies, unused spend, and recoverable value across every vendor.",
      ctaLabel: "Audit My Vendor Spend",
      ctaNote:
        "One integration. One verification layer. Clear proof of recoverable value across every vendor you pay.",
      platformsHeader: "Covers your entire vendor ecosystem",
      platformGroups: VENDOR_GROUPS,
    },
  },
};

const TITLE_STEP_MS = 650;
const PER_VENDOR_MS = 300;
const PER_VENDOR_NEXT_MS = 280;
const POST_MODULE_MS = 180;
const POST_FINAL_MS = 350;
const TOTALING_MS = 500;

const TEMPLATES: {
  domain: string;
  label: string;
  iconPath: React.ReactNode;
}[] = [
  {
    domain: "stripe.com",
    label: "B2B SaaS",
    iconPath: <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />,
  },
  {
    domain: "sportforlife.co.th",
    label: "D2C E-commerce",
    iconPath: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    domain: "plaid.com",
    label: "Enterprise Fintech",
    iconPath: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </>
    ),
  },
];

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function renderPlatformChip(
  p: Platform,
  key: string,
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => void,
) {
  const resolvedIcon =
    typeof p.icon === "string" ? ICON_REGISTRY[p.icon] : p.icon;
  return (
    <a
      key={key}
      className="presignup-agent-platform"
      href={p.href || "#"}
      onClick={(e) => onClick(e, p.href)}
    >
      {resolvedIcon ? (
        <span className="presignup-agent-platform-icon" aria-hidden="true">
          {resolvedIcon}
        </span>
      ) : p.iconUrl ? (
        <img
          className="presignup-agent-platform-logo"
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

function buildScanItems(products: Product[]): ScanItem[] {
  const returnedKeys = products.map((p) => idToKey(p.id));
  const items: ScanItem[] = products.map((p) => ({
    key: idToKey(p.id),
    matched: true,
    status: "pending",
    vendorText: "pending",
    amount: 0,
    vendors: p.vendors,
  }));
  for (const k of KNOWN_KEYS) {
    if (returnedKeys.includes(k)) continue;
    items.push({
      key: k,
      matched: false,
      status: "pending",
      vendorText: "n/a",
      amount: 0,
      vendors: [],
    });
  }
  return items;
}

export default function PresignupAgent({
  agentBaseUrl,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  placeholder = DEFAULT_PLACEHOLDER,
  ctaLabel = DEFAULT_CTA,
  platformsLabel,
  platforms,
  ctaNote,
  platformsHeader,
  platformGroups,
  productOrder = DEFAULT_PRODUCT_ORDER,
  productOverrides = DEFAULT_PRODUCT_OVERRIDES,
}: PresignupAgentProps) {
  const [phase, setPhase] = useState<AgentPhase>({ kind: "idle" });
  const [statusText, setStatusText] = useState<{
    text: string;
    dot: boolean;
  } | null>(null);
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTitle, setScanTitle] = useState("");
  const [revealedProducts, setRevealedProducts] = useState<Product[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [domainInput, setDomainInput] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

  const cancelActive = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (_) {
        /* ignore */
      }
      abortRef.current = null;
    }
    cancelledRef.current = true;
  }, []);

  useEffect(() => {
    const handler = () => cancelActive();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cancelActive]);

  const handleSubmit = useCallback(async () => {
    const domain = normalizeDomain(domainInput);
    if (!isValidDomain(domain)) {
      setPhase({
        kind: "error",
        message: "Enter a valid domain, like sportforlife.co.th.",
      });
      return;
    }

    cancelActive();
    cancelledRef.current = false;
    setRevealedProducts([]);
    setScanItems([]);
    setScanProgress(0);
    setScanTitle("");
    setStatusText(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const baseUrl = getAgentBaseUrl(agentBaseUrl);
    const sessionId = getSessionId();

    let accumulatedText = "";
    let sizingTimer: number | null = null;

    try {
      setPhase({ kind: "running", step: "finding" });
      setStatusText({ text: "Authenticating…", dot: true });
      let token = await getToken(baseUrl, controller.signal);
      if (cancelledRef.current) return;

      setStatusText({ text: "Creating session…", dot: true });
      await ensureSession(baseUrl, sessionId, token, controller.signal);
      if (cancelledRef.current) return;

      // Tokens are single-use — fetch a fresh one for run_sse.
      token = await getToken(baseUrl, controller.signal);
      if (cancelledRef.current) return;

      setStatusText(null);
      const stream = await streamAgent(
        baseUrl,
        buildRunPayload(domain, sessionId),
        token,
        controller.signal,
      );

      await consumeSSE(stream, (event) => {
        if (!event?.content?.parts) return;
        for (const part of event.content.parts) {
          if (!part) continue;
          if (part.functionResponse) {
            setPhase({ kind: "running", step: "sizing" });
            if (sizingTimer != null) window.clearTimeout(sizingTimer);
            sizingTimer = window.setTimeout(() => {
              setPhase({ kind: "running", step: "auditing" });
            }, 1500);
          }
          if (typeof part.text === "string") {
            if (event.partial === true) {
              setPhase({ kind: "running", step: "auditing" });
            }
            accumulatedText += part.text;
          }
        }
      });

      if (cancelledRef.current) return;

      const products = extractAuditProducts(accumulatedText);
      if (!products?.length) {
        throw new Error("Agent did not return any audit products.");
      }

      setPhase({ kind: "running", step: "auditing" });
      await runScanSequence(products);
      if (cancelledRef.current) return;

      setPhase({ kind: "complete", products });
    } catch (err) {
      if ((err as Error)?.name === "AbortError" || cancelledRef.current) return;
      setPhase({
        kind: "error",
        message:
          (err as Error)?.message || "Something went wrong. Please try again.",
      });
    } finally {
      if (sizingTimer != null) window.clearTimeout(sizingTimer);
      abortRef.current = null;
    }
  }, [agentBaseUrl, domainInput, cancelActive]);

  // The scan-list animation. Drives state imperatively so each row visibly
  // moves through pending → active → done at the documented intervals.
  const runScanSequence = useCallback(async (products: Product[]) => {
    const items = buildScanItems(products);
    setScanItems(items);

    setScanTitle("Finding your vendors");
    await wait(TITLE_STEP_MS);
    if (cancelledRef.current) return;
    setScanTitle("Sizing your business");
    await wait(TITLE_STEP_MS);
    if (cancelledRef.current) return;
    setScanTitle("Running the audit");

    const animated = items.filter((it) => it.matched);

    for (let i = 0; i < animated.length; i++) {
      if (cancelledRef.current) return;
      const it = animated[i];
      const idx = items.indexOf(it);
      // active
      setScanItems((prev) => {
        const next = prev.slice();
        next[idx] = { ...next[idx], status: "active" };
        return next;
      });

      const product = products.find((p) => idToKey(p.id) === it.key);
      if (product?.vendors[0]) {
        setScanItems((prev) => {
          const next = prev.slice();
          next[idx] = {
            ...next[idx],
            vendorText: `checking ${product.vendors[0].name}…`,
          };
          return next;
        });
        await wait(PER_VENDOR_MS);
        if (cancelledRef.current) return;
      }
      if (product?.vendors[1]) {
        setScanItems((prev) => {
          const next = prev.slice();
          next[idx] = {
            ...next[idx],
            vendorText: `checking ${product.vendors[1].name}…`,
          };
          return next;
        });
        await wait(PER_VENDOR_NEXT_MS);
        if (cancelledRef.current) return;
      }

      // done
      setScanItems((prev) => {
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          status: "done",
          vendorText:
            (product?.vendors || []).map((v) => v.name).join(", ") || "—",
          amount: product?.wasteTotal || 0,
        };
        return next;
      });

      // Reveal the matching card in the grid.
      if (product) {
        setRevealedProducts((prev) =>
          prev.some((p) => idToKey(p.id) === it.key)
            ? prev
            : [...prev, product],
        );
      }

      const pct = ((i + 1) / Math.max(1, animated.length)) * 100;
      setScanProgress(pct);
      await wait(POST_MODULE_MS);
    }

    if (cancelledRef.current) return;
    setScanTitle("Totaling your recoverable");
    await wait(TOTALING_MS);
    if (cancelledRef.current) return;
    setScanTitle("Audit complete");
    await wait(POST_FINAL_MS);
  }, []);

  // Smooth-scroll anchor hrefs to the matching id; let other URLs navigate.
  const handlePlatformClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string | undefined) => {
      if (!href || !href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [],
  );

  function pickTemplate(domain: string) {
    setActiveTemplate(domain);
    setDomainInput(domain);
  }

  function shuffleTemplate() {
    const pool = TEMPLATES.filter((t) => t.domain !== activeTemplate);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? TEMPLATES[0];
    setActiveTemplate(pick.domain);
    setDomainInput(pick.domain);
    setRefreshSpinning(true);
    window.setTimeout(() => setRefreshSpinning(false), 300);
  }

  const isLoading = phase.kind === "running" || phase.kind === "scanning";
  const showSteps = phase.kind === "running";
  const currentStep: StepName | null =
    phase.kind === "running" ? phase.step : null;
  const showScanPanel = scanTitle !== "" || scanItems.length > 0;
  const isComplete = phase.kind === "complete";
  const isError = phase.kind === "error";

  // Section gets `.scanning` class while scan-list is animating to mirror legacy CSS hooks.
  const sectionScanning = scanItems.length > 0 && !isComplete;

  return (
    <section className="presignup-agent-section">
      <div
        className={clsx(
          "presignup-agent-container sim",
          sectionScanning && "scanning",
        )}
        id="presignup-agent-root"
      >
        <h2 className="sim-title">{title}</h2>
        <p className="sim-sub">{subtitle}</p>

        <div className="sim-input-row" data-state={isLoading ? "loading" : ""}>
          <div className="sim-input-top">
            <span className="caret-i" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
            <textarea
              rows={3}
              placeholder={placeholder}
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isLoading}
            />
          </div>

          <div className="sim-input-bottom">
            <button
              type="button"
              className="sim-run"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {ctaLabel}
              <kbd className="sim-kbd" aria-hidden="true">
                ↵
              </kbd>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 15, height: 15 }}
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>

          {showScanPanel && (
            <div className="scan-panel" aria-live="polite">
              <div className="scan-header">
                <div className="scan-title-wrap">
                  <span className="scan-eyebrow">Live Audit</span>
                  <div className="scan-title">
                    {scanTitle}
                    <span className="scan-caret" />
                  </div>
                </div>
              </div>
              <div className="scan-list">
                {scanItems.map((item) => {
                  const spec = specForKey(item.key);
                  return (
                    <div
                      key={item.key}
                      className={clsx("scan-item", item.status)}
                      data-key={item.key}
                    >
                      <span className="scan-status" />
                      <span className="scan-item-name">
                        <span className="emoji">{spec.emoji}</span>
                        {spec.name}
                      </span>
                      <span className="scan-item-vendor">
                        {item.vendorText}
                      </span>
                      <span className="scan-item-amount">
                        {item.matched && item.status === "done"
                          ? USD.format(item.amount)
                          : item.matched
                            ? "$0"
                            : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="scan-progress">
                <div
                  className="scan-progress-fill"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {ctaNote && <p className="presignup-agent-cta-note">{ctaNote}</p>}

        {(platformGroups?.length || platforms?.length) ? (
          <div className="presignup-agent-platforms">
            {platformsHeader && (
              <p className="presignup-agent-platforms-header">
                {platformsHeader}
              </p>
            )}

            {platformGroups && platformGroups.length > 0 ? (
              <div className="presignup-agent-platform-groups">
                {platformGroups.map((group, gi) => (
                  <div
                    key={`${group.category}-${gi}`}
                    className="presignup-agent-platform-group"
                  >
                    <span className="presignup-agent-platform-group-label">
                      {group.category}
                    </span>
                    <div className="presignup-agent-platforms-row">
                      {group.items.map((p, i) =>
                        renderPlatformChip(p, `${group.category}-${i}`, handlePlatformClick),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="presignup-agent-platforms-row">
                {platforms!.map((p, i) =>
                  renderPlatformChip(p, `${p.label}-${i}`, handlePlatformClick),
                )}
              </div>
            )}

            {platformsLabel && (
              <p className="presignup-agent-platforms-note">{platformsLabel}</p>
            )}
          </div>
        ) : null}

        <div className="presignup-agent-steps" hidden={!showSteps}>
          {(["finding", "sizing", "auditing"] as StepName[]).map((step) => {
            const order = ["finding", "sizing", "auditing"];
            const idx = currentStep ? order.indexOf(currentStep) : -1;
            const pos = order.indexOf(step);
            return (
              <span key={step} style={{ display: "contents" }}>
                <div
                  className={clsx(
                    "presignup-agent-step",
                    pos < idx && "is-done",
                    pos === idx && "is-active",
                  )}
                  data-step={step}
                >
                  <span className="presignup-agent-step-dot" />
                  <span className="presignup-agent-step-label">
                    {step === "finding"
                      ? "Finding your vendors"
                      : step === "sizing"
                        ? "Sizing your business"
                        : "Running the audit"}
                  </span>
                </div>
                {step !== "auditing" && (
                  <span className="presignup-agent-step-sep" aria-hidden="true">
                    ›
                  </span>
                )}
              </span>
            );
          })}
        </div>

        <div className="template-row">
          {TEMPLATES.map((t) => (
            <button
              key={t.domain}
              className={clsx(
                "template",
                activeTemplate === t.domain && "active",
              )}
              type="button"
              onClick={() => pickTemplate(t.domain)}
            >
              <svg
                className="t-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {t.iconPath}
              </svg>
              <span>{t.label}</span>
            </button>
          ))}
          <button
            className={clsx("template-refresh", refreshSpinning && "spin")}
            type="button"
            aria-label="Shuffle template"
            onClick={shuffleTemplate}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
              <path d="M21 21v-5h-5" />
            </svg>
          </button>
        </div>

        <div className="presignup-agent-status" aria-live="polite">
          {statusText && (
            <>
              {statusText.dot && (
                <span
                  className="presignup-agent-status-dot"
                  aria-hidden="true"
                />
              )}
              {statusText.text}
            </>
          )}
          {isError && phase.kind === "error" && (
            <div className="presignup-agent-error" role="alert">
              <span>{phase.message}</span>
              <button
                type="button"
                className="presignup-agent-error-retry"
                onClick={() => {
                  setPhase({ kind: "idle" });
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        {Array.isArray(productOrder) && productOrder.length === 0 ? null : (
          <div className="presignup-agent-product-overview">
            <ProductCards order={productOrder} overrides={productOverrides} />
          </div>
        )}

        <div className="presignup-agent-results" aria-live="polite">
          {revealedProducts.map((p) => (
            <ResultCard key={idToKey(p.id)} product={p} />
          ))}
          {isComplete && phase.kind === "complete" && (
            <TotalBanner
              products={phase.products}
              agentBaseUrl={agentBaseUrl}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// Stop the linter from flagging unused PRODUCT_SPECS — it's re-exported from
// the file for future consumers; intentionally referenced here so tree-shaking
// doesn't drop it from the bundle.
void PRODUCT_SPECS;
