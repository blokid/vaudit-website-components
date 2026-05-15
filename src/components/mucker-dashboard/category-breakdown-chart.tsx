import type { CompanyData } from "./types";
import { USD } from "../presignup-agent/agent-api";

const CATEGORY_ORDER: Array<"ad_id" | "token_id" | "vendor_id"> = [
  "ad_id",
  "token_id",
  "vendor_id",
];

const CATEGORY_LABEL: Record<"ad_id" | "token_id" | "vendor_id", string> = {
  ad_id: "Ad",
  token_id: "AI / Token",
  vendor_id: "Vendor",
};

const ANNUALIZE = 12;

type ChartProps = {
  company: CompanyData;
};

// Horizontal stacked bar of annual recovery split across the three categories.
// Pure SVG-free implementation (just flex with percentage widths) — cheaper
// than pulling in a chart library, identical visual.
export default function CategoryBreakdownChart({ company }: ChartProps) {
  const slices = CATEGORY_ORDER.map((cat) => {
    const product = company.products.find((p) => p.id === cat);
    const annual = (product?.wasteTotal ?? 0) * ANNUALIZE;
    return { cat, annual };
  });
  const total = slices.reduce((acc, s) => acc + s.annual, 0);

  if (total <= 0) return null;

  return (
    <div className="rc-md__chart">
      <div className="rc-md__chart-bar" role="img" aria-label="Recovery by category">
        {slices.map((s) => {
          const pct = (s.annual / total) * 100;
          if (pct <= 0) return null;
          return (
            <span
              key={s.cat}
              className={`rc-md__chart-seg rc-md__chart-seg--${s.cat}`}
              style={{ width: `${pct}%` }}
              title={`${CATEGORY_LABEL[s.cat]}: ${USD.format(s.annual)}`}
            />
          );
        })}
      </div>
      <ul className="rc-md__chart-legend">
        {slices.map((s) => (
          <li key={s.cat} className="rc-md__chart-legend-item">
            <span className={`rc-md__chart-dot rc-md__chart-dot--${s.cat}`} aria-hidden="true" />
            <span className="rc-md__chart-legend-label">{CATEGORY_LABEL[s.cat]}</span>
            <span className="rc-md__chart-legend-val">{USD.format(s.annual)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
