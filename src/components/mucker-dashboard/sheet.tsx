import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { CompanyData } from "./types";
import PresignupAgent from "../presignup-agent";
import VendorList from "./vendor-list";
import CategoryBreakdownChart from "./category-breakdown-chart";
import MiniResultsGrid from "./mini-results-grid";
import { USD } from "../presignup-agent/agent-api";

type SheetProps = {
  company: CompanyData;
  agentBaseUrl?: string;
  onClose: () => void;
};

export default function Sheet({ company, agentBaseUrl, onClose }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Body scroll lock + restore-focus + Esc handling — bundled because they
  // share the same open/close lifecycle.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // Focus the close button on next tick so the screen reader announces
    // the sheet first.
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(t);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [onClose]);

  const sheet = (
    <div className="rc-md__sheet-root" role="dialog" aria-modal="true" aria-label={`Audit detail for ${company.name}`}>
      <div className="rc-md__sheet-backdrop" onClick={onClose} />
      <aside className="rc-md__sheet">
        <header className="rc-md__sheet-head">
          <div className="rc-md__sheet-id">
            {company.logoUrl ? (
              <img
                className="rc-md__sheet-logo"
                src={company.logoUrl}
                alt=""
                aria-hidden="true"
              />
            ) : (
              <span className="rc-md__sheet-logo rc-md__sheet-logo--fallback" aria-hidden="true">
                {company.name.charAt(0)}
              </span>
            )}
            <div>
              <div className="rc-md__sheet-name">{company.name}</div>
              <div className="rc-md__sheet-domain">{company.domain}</div>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="rc-md__sheet-close"
            onClick={onClose}
            aria-label="Close audit detail"
          >
            ×
          </button>
        </header>

        <div className="rc-md__sheet-summary">
          <div className="rc-md__sheet-stat">
            <span>Annual spend</span>
            <strong>{USD.format(company.estimated_annual_spend)}</strong>
          </div>
          <div className="rc-md__sheet-stat rc-md__sheet-stat--recovery">
            <span>Estimated recovery</span>
            <strong>{USD.format(company.estimated_annual_recovery)}</strong>
          </div>
        </div>

        <section className="rc-md__sheet-section">
          <h3 className="rc-md__sheet-h">Vendors detected</h3>
          <VendorList vendors={company.vendors} />
        </section>

        <section className="rc-md__sheet-section">
          <h3 className="rc-md__sheet-h">Recovery by category</h3>
          <CategoryBreakdownChart company={company} />
        </section>

        <section className="rc-md__sheet-section">
          <h3 className="rc-md__sheet-h">Audit summary</h3>
          <MiniResultsGrid company={company} />
        </section>

        <section className="rc-md__sheet-section rc-md__sheet-section--chat">
          <h3 className="rc-md__sheet-h">Replay the audit</h3>
          {/*
            Re-key on company.id so the chat fully resets when switching
            companies — prior messages, refs, in-flight animation all
            wiped before the next replay kicks off.
          */}
          <PresignupAgent
            key={company.id}
            agentBaseUrl={agentBaseUrl}
            replay={{ domain: company.domain, products: company.products }}
          />
        </section>

        <footer className="rc-md__sheet-foot">
          <span>Mucker × Vaudit</span>
        </footer>
      </aside>
    </div>
  );

  return createPortal(sheet, document.body);
}
