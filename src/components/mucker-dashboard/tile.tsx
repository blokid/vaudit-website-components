import type { CompanyData } from "./types";
import { USD } from "../presignup-agent/agent-api";

type TileProps = {
  company: CompanyData;
  onClick: () => void;
};

export default function Tile({ company, onClick }: TileProps) {
  return (
    <button
      type="button"
      className="rc-md__tile"
      onClick={onClick}
      aria-label={`Open audit for ${company.name}`}
    >
      <header className="rc-md__tile-head">
        {company.logoUrl ? (
          <img
            className="rc-md__tile-logo"
            src={company.logoUrl}
            alt=""
            aria-hidden="true"
            loading="lazy"
          />
        ) : (
          <span className="rc-md__tile-logo rc-md__tile-logo--fallback" aria-hidden="true">
            {company.name.charAt(0)}
          </span>
        )}
        <span className="rc-md__tile-name">{company.name}</span>
      </header>

      <dl className="rc-md__tile-stats">
        <div className="rc-md__tile-stat">
          <dt>Annual spend</dt>
          <dd>{USD.format(company.estimated_annual_spend)}</dd>
        </div>
        <div className="rc-md__tile-stat rc-md__tile-stat--recovery">
          <dt>Estimated recovery</dt>
          <dd>{USD.format(company.estimated_annual_recovery)}</dd>
        </div>
      </dl>

      <footer className="rc-md__tile-foot">
        {company.industry ? (
          <span className="rc-md__tile-tag">{company.industry}</span>
        ) : (
          <span />
        )}
        <span className="rc-md__tile-cta">View audit →</span>
      </footer>
    </button>
  );
}
