import { useState } from "react";
import clsx from "clsx";
import type { EstimateCtaMessage } from "./types";
import {
  IconCheck,
  IconDownload,
  IconLockTarget,
  IconSpinner,
} from "./icons";
import { AgentMessage } from "./chat-message";
import { USD } from "./agent-api";
import EmailCapture from "./email-capture";

const ANNUALIZE = 12;

type Props = {
  message: EstimateCtaMessage;
  onLockIn: () => void;
  /** Returns true on successful download so the inline form can hide itself. */
  onDownload: (email: string) => Promise<boolean>;
};

export default function EstimateCta({ message, onLockIn, onDownload }: Props) {
  const total = (message.total || 0) * ANNUALIZE;
  const [emailMode, setEmailMode] = useState(false);

  async function handleEmailSubmit(email: string): Promise<boolean> {
    const ok = await onDownload(email);
    if (ok) setEmailMode(false);
    return ok;
  }

  return (
    <AgentMessage>
      <div className="rc-pa-cta-est">
        <span className="rc-pa-eyebrow">
          <span className="rc-pa-eyebrow__dot" aria-hidden="true" />
          Estimated · ready in seconds
        </span>
        <div className="rc-pa-cta-est__total">{USD.format(total)}</div>
        <p className="rc-pa-cta-est__sub">
          Recoverable across <strong>{message.categoryCount} vendor categories</strong> —
          benchmarked to your size & sector. Want the exact number? Share your real spend
          and I'll tighten this to <strong>±5%</strong>.
        </p>

        {emailMode ? (
          <EmailCapture
            onSubmit={handleEmailSubmit}
            onCancel={() => setEmailMode(false)}
          />
        ) : (
          <div className="rc-pa-cta-est__buttons">
            <button
              type="button"
              className={clsx("rc-pa-btn rc-pa-btn--primary", message.busy && "is-busy")}
              onClick={onLockIn}
              disabled={message.busy}
            >
              {message.busy ? <IconSpinner /> : <IconLockTarget />}
              <span>Lock in exact numbers</span>
              <span className="rc-pa-btn__time">~30s</span>
            </button>
            <button
              type="button"
              className="rc-pa-btn rc-pa-btn--secondary"
              onClick={() => setEmailMode(true)}
            >
              <IconDownload />
              <span>Download report</span>
            </button>
          </div>
        )}

        <div className="rc-pa-trust-row">
          <span className="rc-pa-trust-row__item"><IconCheck /> Free</span>
          <span className="rc-pa-trust-row__item"><IconCheck /> No login</span>
          <span className="rc-pa-trust-row__item"><IconCheck /> No integrations</span>
        </div>
      </div>
    </AgentMessage>
  );
}
