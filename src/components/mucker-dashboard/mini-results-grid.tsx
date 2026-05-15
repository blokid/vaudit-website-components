import type { CompanyData } from "./types";
import { USD } from "../presignup-agent/agent-api";

const ANNUALIZE = 12;

const CATEGORY_LABEL: Record<string, string> = {
  ad_id: "Ad ID",
  token_id: "Token ID",
  vendor_id: "Vendor ID",
};

type MiniResultsGridProps = {
  company: CompanyData;
};

// Compact 2x2-ish summary of per-category annual recovery. Mirrors the look
// of presignup-agent's full results-grid but at sheet-friendly density.
export default function MiniResultsGrid({ company }: MiniResultsGridProps) {
  return (
    <div className="rc-md__mini-grid">
      {company.products.map((p) => {
        const annual = (p.wasteTotal || 0) * ANNUALIZE;
        return (
          <article key={p.id} className="rc-md__mini-card">
            <header className="rc-md__mini-head">
              <span className="rc-md__mini-label">
                {CATEGORY_LABEL[p.id] ?? p.id}
              </span>
              <span className="rc-md__mini-status">Estimated</span>
            </header>
            <div className="rc-md__mini-total">{USD.format(annual)}</div>
            <div className="rc-md__mini-sub">
              {p.vendors.length} vendor{p.vendors.length === 1 ? "" : "s"} audited
            </div>
          </article>
        );
      })}
    </div>
  );
}
