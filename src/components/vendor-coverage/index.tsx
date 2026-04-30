import type { ComponentMeta } from "../../registry";
import "./vendor-coverage.css";

type Vendor = {
  /** Anchor target — chip clicks in the agent scroll to `#${id}`. */
  id: string;
  /** Card heading (vendor name as displayed). */
  name: string;
  /** Optional body copy under the title. Cards omit the `<p>` entirely when not set. */
  description?: string;
  /** Brand-logo URL — rendered as an `<img>` inside a small white tile. */
  iconUrl: string;
};

type VendorCategory = {
  /** Anchor target for the category band itself. */
  id: string;
  /** Category heading (e.g. "Ads"). */
  title: string;
  /** Supporting line under the category heading. */
  description: string;
  /** Vendor cards rendered in the grid below the category header. */
  vendors: Vendor[];
};

type VendorCoverageProps = {
  /** Section heading. */
  heading?: string;
  /** Optional supporting line under the heading. */
  subheading?: string;
  /** Categorized vendor list. Falls back to the bundled defaults below. */
  categories?: VendorCategory[];
};

const CDN = "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee";
// Brand-color SVGs for vendors that aren't (yet) hosted on the Webflow CDN.
// Iconify's `logos` collection is stable and ships official brand-colored
// SVGs — preferred over simpleicons which has been progressively pulling
// logos due to trademark complaints (Microsoft, Slack, etc.).
const ICONIFY = "https://api.iconify.design/logos";

const DEFAULT_HEADING = "Covers your entire vendor ecosystem";

// Vendor cards show name + logo only. Category-level supporting copy lives
// on `VendorCategory.description`; per-vendor `description` is left as an
// optional prop hatch so callers can opt-in for a specific override later.
const DEFAULT_CATEGORIES: VendorCategory[] = [
  {
    id: "ads",
    title: "Ads",
    description:
      "Verify ad platform billing against delivery, traffic quality, and platform adjustments to uncover discrepancies and recoverable value.",
    vendors: [
      {
        id: "google-ads",
        name: "Google Ads",
        iconUrl: `${CDN}/69e8a965ab121368400dc44f_google-ads.svg`,
      },
      {
        id: "meta-ads",
        name: "Meta Ads",
        iconUrl: `${CDN}/69e8a965d6f564a86b177302_meta-ads.svg`,
      },
      {
        id: "tiktok-ads",
        name: "TikTok Ads",
        iconUrl: `${CDN}/69e8a965a560d2adf0a6e474_tiktok-ads.svg`,
      },
      {
        id: "dv360",
        name: "DV360",
        iconUrl: `${CDN}/69f30d0d639ab6b06147914f_google-display-and-video-ads.svg`,
      },
      {
        id: "trade-desk",
        name: "The Trade Desk",
        iconUrl: `${CDN}/69f30e65b6ef9caacec11a54_The-Trade-Desk-Logo.svg`,
      },
      {
        id: "applovin",
        name: "AppLovin",
        iconUrl: `${CDN}/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg`,
      },
      {
        id: "dsps",
        name: "Amazon DSP",
        iconUrl: `${CDN}/69d77906771133af1d694b4a_amazon-dsp.jpeg`,
      },
      {
        id: "linkedin-ads",
        name: "LinkedIn Ads",
        iconUrl: `${CDN}/69f30f492136aba6741835f0_linkedin-icon-2.svg`,
      },
      {
        id: "bing-ads",
        name: "Bing Ads",
        iconUrl: `${CDN}/69f30f19c4482ab1bb951e04_bing-1.svg`,
      },
    ],
  },
  {
    id: "ai",
    title: "AI",
    description:
      "Validate AI usage and billing across model providers to identify duplicate charges, pricing mismatches, and unused spend.",
    vendors: [
      {
        id: "openai",
        name: "OpenAI",
        iconUrl: `${CDN}/69f326b062f8cffa2ee10ca1_openai-2.svg`,
      },
      {
        id: "azure-openai",
        name: "Azure OpenAI",
        iconUrl: `${CDN}/69f326bd9bf355b23686d9af_Azure-OpenAI-Icon48px.svg`,
      },
      {
        id: "anthropic",
        name: "Anthropic",
        iconUrl: `${CDN}/69e8a9ac046b54c24d008aed_anthropic.svg`,
      },
      {
        id: "google-ai",
        name: "Google AI",
        iconUrl: `${CDN}/69e8abaccd7cfdce2d3ae140_gemini-color.svg`,
      },
      {
        id: "aws-bedrock",
        name: "AWS Bedrock",
        iconUrl: `${CDN}/69f32721a5271bad63690b03_aws-bedrock-icon.svg`,
      },
      {
        id: "cohere",
        name: "Cohere",
        iconUrl: `${CDN}/69f3274f78d4bf614c12bd5b_cohere-color.svg`,
      },
      {
        id: "replicate",
        name: "Replicate",
        iconUrl: `${CDN}/69f3279f89cda15f55f924ce_replicate.webp`,
      },
      {
        id: "hugging-face",
        name: "Hugging Face",
        iconUrl: `${CDN}/69f327b550a98aff51a18f71_huggingface-color.svg`,
      },
      {
        id: "together-ai",
        name: "Together AI",
        iconUrl: `${CDN}/69f327cc4c4c86b4ea9d531b_together-color.svg`,
      },
      {
        id: "anyscale",
        name: "Anyscale",
        iconUrl: `${CDN}/69f327e327a34a8dbdf4d1a4_anyscale-color.svg`,
      },
    ],
  },
  {
    id: "saas",
    title: "SaaS",
    description:
      "Verify SaaS billing against actual usage, licenses, and contract terms to uncover unused seats, overcharges, and contract leakage.",
    vendors: [
      {
        id: "salesforce",
        name: "Salesforce",
        iconUrl: `${CDN}/69e8aa1be867fd9d7a66f538_salesforce.svg`,
      },
      {
        id: "hubspot",
        name: "HubSpot",
        iconUrl: `${ICONIFY}/hubspot.svg`,
      },
      {
        id: "slack",
        name: "Slack",
        iconUrl: `${ICONIFY}/slack-icon.svg`,
      },
    ],
  },
  {
    id: "cloud",
    title: "Cloud",
    description:
      "Validate cloud billing against usage and pricing structures to detect overcharges, misconfigurations, and inefficient spend.",
    vendors: [
      {
        id: "aws",
        name: "AWS",
        iconUrl: `${CDN}/69e8a986401a04fdfb516c2f_aws.svg`,
      },
      {
        id: "azure",
        name: "Azure",
        iconUrl: `${ICONIFY}/microsoft-azure.svg`,
      },
      {
        id: "google-cloud",
        name: "Google Cloud",
        iconUrl: `${CDN}/69e8a98614c119b6d0b24519_gcp.svg`,
      },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    description:
      "Verify payment processing fees against contracted rates to identify incorrect charges, hidden fees, and reconciliation gaps.",
    vendors: [
      {
        id: "stripe",
        name: "Stripe",
        iconUrl: `${CDN}/69e8a98d555377a44d02f6f1_stripe.svg`,
      },
      {
        id: "shopify-payments",
        name: "Shopify Payments",
        iconUrl: `${CDN}/69e8a98de0d6b803860417b8_shopify.svg`,
      },
      {
        id: "paypal",
        name: "PayPal",
        iconUrl: `${ICONIFY}/paypal.svg`,
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Logistics",
    description:
      "Validate shipping and carrier billing against contracts, surcharges, and delivery terms to uncover overcharges and missed refunds.",
    vendors: [
      {
        id: "ups",
        name: "UPS",
        iconUrl: `${CDN}/69e8a9a3e807d12509c3513b_ups.svg`,
      },
      {
        id: "fedex",
        name: "FedEx",
        iconUrl: `${CDN}/69e8a9a37f220d58951c852a_fedex.svg`,
      },
      {
        id: "dhl",
        name: "DHL",
        iconUrl: `${CDN}/69e8a9a3d59d49c6bf3d32dd_dhl.svg`,
      },
    ],
  },
];

export const meta: ComponentMeta<VendorCoverageProps> = {
  description:
    "Vendor coverage section — categorized neon-card grid with one anchor-targeted card per vendor, mirroring the /ad-id `.what-vaudit-do` design.",
  props: {
    heading: {
      type: "string",
      description: "Section heading rendered above the categories.",
      default: `"${DEFAULT_HEADING}"`,
    },
    subheading: {
      type: "string",
      description: "Optional supporting line under the heading.",
      default: "none",
    },
    categories: {
      type: "VendorCategory[]",
      description:
        "Override the bundled vendor list. Each category renders a header + grid of cards; each card carries an `id` so chip clicks anywhere on the page can smooth-scroll to it.",
      default: "bundled list of 6 categories / 18 vendors",
    },
  },
  variants: {
    default: {},
  },
};

export default function VendorCoverage({
  heading = DEFAULT_HEADING,
  subheading,
  categories = DEFAULT_CATEGORIES,
}: VendorCoverageProps) {
  return (
    <section className="rc-vendor-coverage">
      <div className="rc-vendor-coverage__container">
        <header className="rc-vendor-coverage__head">
          <h2 className="rc-vendor-coverage__heading">{heading}</h2>
          {subheading && (
            <p className="rc-vendor-coverage__subheading">{subheading}</p>
          )}
        </header>

        {categories.map((cat) => (
          <div
            key={cat.id}
            id={cat.id}
            className="rc-vendor-coverage__category"
          >
            <div className="rc-vendor-coverage__category-header">
              <h3 className="rc-vendor-coverage__category-title">
                {cat.title}
              </h3>
              <p className="rc-vendor-coverage__category-desc">
                {cat.description}
              </p>
            </div>

            <div className="rc-vendor-coverage__grid">
              {cat.vendors.map((v) => (
                <article
                  key={v.id}
                  id={v.id}
                  className="rc-vendor-coverage__card neon-card"
                >
                  <span
                    className="rc-vendor-coverage__icon-wrap"
                    aria-hidden="true"
                  >
                    <img
                      className="rc-vendor-coverage__icon"
                      src={v.iconUrl}
                      alt=""
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                  </span>
                  <div className="rc-vendor-coverage__body">
                    <div className="rc-vendor-coverage__title">{v.name}</div>
                    {v.description && (
                      <div className="rc-vendor-coverage__desc">
                        {v.description}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
