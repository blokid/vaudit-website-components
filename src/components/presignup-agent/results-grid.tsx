import clsx from "clsx";
import type {
  Product,
  ReasoningEntry,
  ReasoningMap,
  ResultsGridMessage,
  Vendor,
  VerificationDepth,
} from "./types";
import { CATEGORY_ICONS, CATEGORY_LABELS, IconCheck } from "./icons";
import { USD, compactUsd, vendorIcon } from "./agent-api";

type ResultsGridProps = {
  message: ResultsGridMessage;
};

const ANNUALIZE = 12;
const TOP_ORDER = ["ad_id", "token_id"]; // top row 2-up
const FULL = "vendor_id";

// Sub-pot ids the backend emits reasoning for inside the vendor_id
// display bucket. Build Guide §Stage 5.5 Pass 2 streams one event per
// sub-pot; the UI shows the kloud_id paragraph at the top-level (it's
// the dominant signal in most audits) and tucks the other three under
// a "see breakdown" toggle.
const VENDOR_SUB_POTS = ["kloud_id", "seat_id", "ship_id", "payment_id"] as const;

const SUB_POT_LABEL: Record<(typeof VENDOR_SUB_POTS)[number], string> = {
  kloud_id: "Cloud infrastructure",
  seat_id: "SaaS seats",
  ship_id: "Shipping",
  payment_id: "Payment processing",
};

// Marketing Language Guide v1.0 — visitor-facing one-liner per Token ID
// reconciliation depth tier. Mirrors `_DEPTH_DESCRIPTION` in
// `backend/presignup_agent/tools/recovery.py`.
const DEPTH_LABEL: Record<VerificationDepth, string> = {
  full: "Full billing reconciliation",
  partial: "Partial reconciliation",
  statistical: "Statistical cost model",
};

function pickProduct(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export default function ResultsGrid({ message }: ResultsGridProps) {
  const accurate = message.mode === "accurate";
  const reasoning = message.reasoning ?? {};

  return (
    <section className="rc-pa-grid" aria-live="polite">
      <div className="rc-pa-grid__cards">
        {TOP_ORDER.map((id) => {
          const p = pickProduct(message.products, id);
          if (!p) return null;
          return (
            <CategoryCard
              key={id}
              product={p}
              accurate={accurate}
              reasoning={reasoning}
            />
          );
        })}
        {(() => {
          const p = pickProduct(message.products, FULL);
          if (!p) return null;
          return (
            <CategoryCard
              key={FULL}
              product={p}
              accurate={accurate}
              reasoning={reasoning}
              full
            />
          );
        })()}
      </div>
    </section>
  );
}

function CategoryCard({
  product,
  accurate,
  reasoning,
  full,
}: {
  product: Product;
  accurate: boolean;
  reasoning: ReasoningMap;
  full?: boolean;
}) {
  const Icon = CATEGORY_ICONS[product.id as keyof typeof CATEGORY_ICONS];
  const total = (product.wasteTotal || 0) * ANNUALIZE;
  // Pass 2 reasoning routing: prefer the widget's reasoningId (set by
  // the coordinator), fall back to the product's display id. For the
  // vendor_id bucket we pick kloud_id as the primary paragraph since
  // cloud infra is the dominant signal across most industries.
  const primaryReasoningKey = product.reasoningId || product.id;
  const primaryEntry: ReasoningEntry | undefined =
    primaryReasoningKey === "vendor_id"
      ? reasoning["kloud_id"] ?? reasoning["vendor_id"]
      : reasoning[primaryReasoningKey];
  return (
    <article className={clsx("rc-pa-card-cat", full && "rc-pa-card-cat--full")}>
      <div className="rc-pa-card-cat__head">
        <span className="rc-pa-card-cat__name">
          {Icon ? <Icon className="rc-pa-card-cat__icon" /> : null}
          {CATEGORY_LABELS[product.id] ?? product.id}
        </span>
        <span
          className={clsx("rc-pa-chip-status", accurate && "rc-pa-chip-status--accurate")}
        >
          {accurate && <IconCheck />}
          {accurate ? "Accurate" : "Completed"}
        </span>
      </div>
      <div className="rc-pa-card-cat__total">{USD.format(total)}</div>
      <div className="rc-pa-card-cat__vendors">
        {product.vendors.map((v, i) => (
          <VendorRow vendor={v} key={`${v.name}-${i}`} />
        ))}
      </div>
      <ReasoningContainer
        productId={product.id}
        primary={primaryEntry}
        reasoning={reasoning}
        showSubPots={product.id === "vendor_id"}
      />
    </article>
  );
}

function ReasoningContainer({
  productId,
  primary,
  reasoning,
  showSubPots,
}: {
  productId: string;
  primary: ReasoningEntry | undefined;
  reasoning: ReasoningMap;
  showSubPots: boolean;
}) {
  // Pass 2 reasoning paragraphs stream in async after the widget
  // ships (Build Guide §Stage 5.5 Pass 2). While the backend hasn't
  // pushed *any* event for this card yet, hide the container so the
  // visitor doesn't see an empty stub — appears on the first event.
  if (!primary && !showSubPots) return null;
  // For the vendor_id bucket, even if the kloud_id pot isn't started
  // yet we keep the container around so the "see breakdown" toggle
  // surfaces once any of the four sub-pots have data.
  const hasAnySubData =
    showSubPots && VENDOR_SUB_POTS.some((p) => Boolean(reasoning[p]));
  if (!primary && !hasAnySubData) return null;

  return (
    <details className="rc-pa-reasoning" open>
      <summary className="rc-pa-reasoning__head">
        <span className="rc-pa-reasoning__label">How we got here</span>
      </summary>
      <ReasoningBody entry={primary} />
      {showSubPots && hasAnySubData ? (
        <details className="rc-pa-reasoning__sub">
          <summary className="rc-pa-reasoning__sub-head">See breakdown</summary>
          <div className="rc-pa-reasoning__sub-grid">
            {VENDOR_SUB_POTS.filter((p) => p !== productId).map((sub) => {
              const entry = reasoning[sub];
              if (!entry) return null;
              return (
                <div key={sub} className="rc-pa-reasoning__sub-item">
                  <div className="rc-pa-reasoning__sub-label">{SUB_POT_LABEL[sub]}</div>
                  <ReasoningBody entry={entry} compact />
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </details>
  );
}

function ReasoningBody({
  entry,
  compact,
}: {
  entry: ReasoningEntry | undefined;
  compact?: boolean;
}) {
  if (!entry || entry.status === "started") {
    return (
      <div
        className={clsx(
          "rc-pa-reasoning__shimmer",
          compact && "rc-pa-reasoning__shimmer--compact",
        )}
        aria-label="Generating reasoning…"
      >
        <span />
        <span />
        <span />
      </div>
    );
  }
  return (
    <p
      className={clsx(
        "rc-pa-reasoning__text",
        compact && "rc-pa-reasoning__text--compact",
        entry.status === "failed" && "rc-pa-reasoning__text--fallback",
      )}
    >
      {entry.text}
    </p>
  );
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const icon = vendorIcon(vendor.name);
  const annualSpend = (vendor.estSpend || 0) * ANNUALIZE;
  const annualWaste = (vendor.waste || 0) * ANNUALIZE;
  const depthLabel = vendor.verificationDepth
    ? DEPTH_LABEL[vendor.verificationDepth]
    : null;
  return (
    <div className="rc-pa-vendor">
      <div className="rc-pa-vendor__name">
        {icon ? (
          <img
            className="rc-pa-vendor__logo"
            src={icon}
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        <span>{vendor.name}</span>
        {depthLabel ? (
          <span
            className={clsx(
              "rc-pa-vendor__depth",
              `rc-pa-vendor__depth--${vendor.verificationDepth}`,
            )}
            title={depthLabel}
          >
            {depthLabel}
          </span>
        ) : null}
      </div>
      <div className="rc-pa-vendor__fig">
        <span className="rc-pa-vendor__spend">{compactUsd(annualSpend)} spend</span>
        <span className="rc-pa-vendor__waste">{USD.format(annualWaste)} wasted</span>
      </div>
    </div>
  );
}
