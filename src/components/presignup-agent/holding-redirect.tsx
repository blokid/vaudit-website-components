import clsx from "clsx";
import { useState } from "react";
import type { HoldingRedirectMessage } from "./types";

/**
 * Stage 1 holding-company brand-picker widget. Build Guide §Stage 1:
 * when the visitor's domain matches a holding pattern, the backend
 * skips profiling and emits a `:::holding_redirect{...}:::` widget.
 * This component renders a free-text input + optional suggestion
 * chips, then calls `onSubmit` with the chosen subsidiary domain.
 *
 * Validation here is intentionally permissive — anything the visitor
 * types becomes the next domain submission. The backend's
 * `canonicalize_domain` strips scheme / path / www / case before
 * matching, so "https://www.Brand.com/" and "brand.com" land the same
 * spot. If the visitor types another holding domain, the short-circuit
 * just fires again with the new pattern.
 */
type HoldingRedirectProps = {
  message: HoldingRedirectMessage;
  onSubmit: (domain: string) => void;
};

export default function HoldingRedirect({ message, onSubmit }: HoldingRedirectProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submitted = message.submitted;

  const handleSubmit = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError("Please enter a domain.");
      return;
    }
    if (!/[a-zA-Z]/.test(trimmed)) {
      setError("Please enter a valid domain (e.g. brand.com).");
      return;
    }
    setError(null);
    onSubmit(trimmed);
  };

  return (
    <div className="rc-pa-holding" role="group" aria-label="Pick a brand to audit">
      <div className="rc-pa-holding__head">
        <span className="rc-pa-holding__eyebrow">● PICK A BRAND</span>
        <h3 className="rc-pa-holding__title">
          {message.domain} looks like a parent / holding company
        </h3>
        <p className="rc-pa-holding__copy">
          We audit the spend of one operating brand at a time. Which subsidiary
          would you like to audit? Type a domain below — or pick one we
          recognized.
        </p>
      </div>

      {message.suggestedBrands.length > 0 ? (
        <div className="rc-pa-holding__chips" role="list">
          {message.suggestedBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              role="listitem"
              className="rc-pa-holding__chip"
              disabled={submitted}
              onClick={() => handleSubmit(brand)}
            >
              {brand}
            </button>
          ))}
        </div>
      ) : null}

      <form
        className="rc-pa-holding__form"
        onSubmit={(e) => {
          e.preventDefault();
          if (submitted) return;
          handleSubmit(value);
        }}
      >
        <label className="rc-pa-holding__label" htmlFor="rc-pa-holding-input">
          Subsidiary domain
        </label>
        <div className="rc-pa-holding__row">
          <input
            id="rc-pa-holding-input"
            className="rc-pa-holding__input"
            type="text"
            inputMode="url"
            autoComplete="off"
            autoCapitalize="off"
            placeholder="e.g. brand.com"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            disabled={submitted}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "rc-pa-holding-error" : undefined}
          />
          <button
            type="submit"
            className={clsx(
              "rc-pa-holding__submit",
              submitted && "rc-pa-holding__submit--done",
            )}
            disabled={submitted || !value.trim()}
          >
            {submitted ? "Submitted" : "Audit this brand"}
          </button>
        </div>
        {error ? (
          <div className="rc-pa-holding__error" id="rc-pa-holding-error" role="alert">
            {error}
          </div>
        ) : null}
      </form>
    </div>
  );
}
