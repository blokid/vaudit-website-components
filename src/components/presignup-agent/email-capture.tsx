import { useState } from "react";
import clsx from "clsx";
import { EMAIL_RE } from "./agent-api";
import { IconArrowLeft, IconCheck, IconSpinner } from "./icons";

type EmailCaptureProps = {
  /** Submit handler — returns true on a successful download. */
  onSubmit: (email: string) => Promise<boolean>;
  onCancel: () => void;
};

/**
 * Inline email-capture row used inside the CTA cards. Replaces the
 * `Download report` button when the visitor opts to grab the PDF.
 */
export default function EmailCapture({ onSubmit, onCancel }: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const trimmed = email.trim();
  const valid = EMAIL_RE.test(trimmed);

  async function handleSend() {
    if (submitting) return;
    if (!valid) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rc-pa-email">
      <label className="rc-pa-email__label" htmlFor="rc-pa-email-input">
        Email your audit report to:
      </label>
      <div className="rc-pa-email__row">
        <input
          id="rc-pa-email-input"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          autoFocus
          className="rc-pa-email__input"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          disabled={submitting}
        />
        <button
          type="button"
          className={clsx("rc-pa-btn rc-pa-btn--primary", submitting && "is-busy")}
          onClick={handleSend}
          disabled={!valid || submitting}
        >
          {submitting ? <IconSpinner /> : <IconCheck />}
          <span>{submitting ? "Sending…" : "Send report"}</span>
        </button>
        <button
          type="button"
          className="rc-pa-btn rc-pa-btn--ghost"
          onClick={onCancel}
          disabled={submitting}
          aria-label="Cancel"
        >
          <IconArrowLeft />
          <span>Cancel</span>
        </button>
      </div>
      {error && <p className="rc-pa-email__error">{error}</p>}
    </div>
  );
}
