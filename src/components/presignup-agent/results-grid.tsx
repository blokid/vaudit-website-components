import clsx from "clsx";
import type { Product, ResultsGridMessage, Vendor } from "./types";
import { CATEGORY_ICONS, CATEGORY_LABELS, IconCheck } from "./icons";
import { USD, compactUsd, vendorIcon } from "./agent-api";

type ResultsGridProps = {
  message: ResultsGridMessage;
};

const ANNUALIZE = 12;
const TOP_ORDER = ["ad_id", "token_id"]; // top row 2-up
const FULL = "vendor_id";

function pickProduct(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export default function ResultsGrid({ message }: ResultsGridProps) {
  const accurate = message.mode === "accurate";

  return (
    <section className="rc-pa-grid" aria-live="polite">
      <div className="rc-pa-grid__cards">
        {TOP_ORDER.map((id) => {
          const p = pickProduct(message.products, id);
          if (!p) return null;
          return <CategoryCard key={id} product={p} accurate={accurate} />;
        })}
        {(() => {
          const p = pickProduct(message.products, FULL);
          if (!p) return null;
          return <CategoryCard key={FULL} product={p} accurate={accurate} full />;
        })()}
      </div>
    </section>
  );
}

function CategoryCard({
  product,
  accurate,
  full,
}: {
  product: Product;
  accurate: boolean;
  full?: boolean;
}) {
  const Icon = CATEGORY_ICONS[product.id as keyof typeof CATEGORY_ICONS];
  const total = (product.wasteTotal || 0) * ANNUALIZE;
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
    </article>
  );
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const icon = vendorIcon(vendor.name);
  const annualSpend = (vendor.estSpend || 0) * ANNUALIZE;
  const annualWaste = (vendor.waste || 0) * ANNUALIZE;
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
      </div>
      <div className="rc-pa-vendor__fig">
        <span className="rc-pa-vendor__spend">{compactUsd(annualSpend)} spend</span>
        <span className="rc-pa-vendor__waste">{USD.format(annualWaste)} wasted</span>
      </div>
    </div>
  );
}
