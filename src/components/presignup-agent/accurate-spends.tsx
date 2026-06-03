import { useMemo, useState } from "react";
import clsx from "clsx";
import type { AccurateSpendsMessage, ExactMonthlyByVendor, Product } from "./types";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  IconArrowLeft,
  IconCheck,
  IconLock,
  IconSpinner,
} from "./icons";
import { vendorIcon } from "./agent-api";
import { AgentSection } from "./chat-message";

type Props = {
  message: AccurateSpendsMessage;
  onSubmit: (exact: ExactMonthlyByVendor) => void;
  /** Optional — the up-front spend form has no "Back" target. */
  onBack?: () => void;
};

/** Stable draft key — category id + vendor name uniquely identify a row. */
function draftKey(categoryId: string, vendorName: string): string {
  return `${categoryId}::${vendorName}`;
}

export default function AccurateSpends({ message, onSubmit, onBack }: Props) {
  const { products } = message;
  const locked = message.completed;
  const busy = message.busy;

  // Seed every input with the phase-1 estimate annualised (estSpend × 12), so
  // the prefilled figure matches exactly what the visitor just saw in the
  // results grid. Stored as the raw input string; parsed on submit.
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const seed: Record<string, string> = {};
    for (const p of products) {
      for (const v of p.vendors) {
        seed[draftKey(p.id, v.name)] = formatAnnual((v.estSpend || 0) * 12);
      }
    }
    return seed;
  });

  // Parse every draft up front; a row is valid when it parses to a
  // non-negative annual figure ($0 is allowed — it means "I don't spend on
  // this vendor", e.g. a seeded default the visitor leaves untouched). The
  // form can only run once every row is valid.
  const parsed = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const p of products) {
      for (const v of p.vendors) {
        const k = draftKey(p.id, v.name);
        out[k] = parseAnnualSpend(drafts[k] ?? "");
      }
    }
    return out;
  }, [drafts, products]);

  const allValid = useMemo(
    () => Object.values(parsed).every((n) => n != null && n >= 0),
    [parsed],
  );

  function setDraft(key: string, value: string) {
    if (locked) return;
    setDrafts((prev) => ({ ...prev, [key]: value }));
  }

  function handleRun() {
    if (!allValid || locked || busy) return;
    const exact: ExactMonthlyByVendor = {};
    for (const p of products) {
      const byVendor: Record<string, number> = {};
      for (const v of p.vendors) {
        const annual = parsed[draftKey(p.id, v.name)];
        if (annual == null) continue;
        // Persisted schema is monthly USD; the form edits annual figures.
        byVendor[v.name] = Math.round(annual / 12);
      }
      exact[p.id] = byVendor;
    }
    onSubmit(exact);
  }

  return (
    <AgentSection
      text={
        <>
          These are our estimates — <strong>edit any figure</strong> to match your{" "}
          <strong>actual annual spend</strong> and we'll recompute the recoverable amount
          against the same waste rates.
        </>
      }
    >
      <div className="rc-pa-spends">
        {products
          .filter((product) => product.vendors.length > 0)
          .map((product) => (
            <SpendGroup
              key={product.id}
              product={product}
              drafts={drafts}
              parsed={parsed}
              locked={locked}
              onChange={setDraft}
            />
          ))}

        <div className="rc-pa-spends__footer">
          <div className="rc-pa-spends__buttons">
            {onBack ? (
              <button
                type="button"
                className="rc-pa-btn rc-pa-btn--ghost"
                onClick={onBack}
                disabled={locked || busy}
              >
                <IconArrowLeft />
                <span>Back</span>
              </button>
            ) : null}
            <button
              type="button"
              className={clsx("rc-pa-btn rc-pa-btn--primary", busy && "is-busy")}
              onClick={handleRun}
              disabled={!allValid || locked || busy}
            >
              {busy ? <IconSpinner /> : <IconCheck />}
              <span>{busy ? "Calculating…" : "Run my recovery audit"}</span>
            </button>
          </div>
        </div>

        <span className="rc-pa-spends__note">
          <IconLock /> Your numbers stay in your browser. Nothing is saved or shared.
        </span>
      </div>
    </AgentSection>
  );
}

function SpendGroup({
  product,
  drafts,
  parsed,
  locked,
  onChange,
}: {
  product: Product;
  drafts: Record<string, string>;
  parsed: Record<string, number | null>;
  locked: boolean;
  onChange: (key: string, value: string) => void;
}) {
  const Icon = CATEGORY_ICONS[product.id as keyof typeof CATEGORY_ICONS];
  const label = CATEGORY_LABELS[product.id] ?? product.id;
  return (
    <div className="rc-pa-spends__group">
      <span className="rc-pa-spends__group-head">
        {Icon ? <Icon className="rc-pa-spends__group-icon" /> : null}
        {label}
      </span>
      {product.vendors.map((v) => {
        const key = draftKey(product.id, v.name);
        const logo = vendorIcon(v.name);
        // $0 is a valid answer ("I don't spend on this vendor") — only a parse
        // failure or a negative value is invalid, matching `allValid` above.
        const invalid = (() => {
          const n = parsed[key];
          return n == null || n < 0;
        })();
        return (
          <div className="rc-pa-spends__row" key={key}>
            <span className="rc-pa-spends__vendor">
              {logo ? (
                <img
                  className="rc-pa-spends__logo"
                  src={logo}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <span>{v.name}</span>
            </span>
            <span
              className={clsx(
                "rc-pa-spends__input-wrap",
                invalid && "is-invalid",
              )}
            >
              <span className="rc-pa-spends__currency" aria-hidden="true">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                className="rc-pa-spends__input"
                aria-label={`${v.name} annual spend`}
                aria-invalid={invalid}
                value={drafts[key] ?? ""}
                onChange={(e) => onChange(key, e.target.value)}
                disabled={locked}
              />
              <span className="rc-pa-spends__suffix" aria-hidden="true">
                /yr
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Parse a spend input into annual USD. Accepts "$2.5M", "750k",
 * "1,500,000", plain "46536", and "0". Returns null on parse failure or a
 * negative value; `0` is valid ("I don't spend on this vendor").
 */
function parseAnnualSpend(raw: string): number | null {
  const s = raw.replace(/[\s$,]/g, "").toLowerCase();
  if (!s) return null;
  const m = s.match(/^(\d+(?:\.\d+)?)([km]?)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  if (m[2] === "k") return Math.round(n * 1_000);
  if (m[2] === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
}

/** Comma-grouped integer for prefilling the input (no "$", no "/yr"). */
function formatAnnual(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  return Math.round(n).toLocaleString("en-US");
}
