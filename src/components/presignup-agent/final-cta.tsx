import { useState } from "react";
import type { FinalCtaMessage } from "./types";
import {
  IconCheck,
  IconDashboard,
  IconDownload,
  IconRefresh,
} from "./icons";
import { AgentMessage } from "./chat-message";
import { USD } from "./agent-api";
import EmailCapture from "./email-capture";

const ANNUALIZE = 12;

type Props = {
  message: FinalCtaMessage;
  signupUrl: string;
  onAuditAgain: () => void;
  /** Returns true on successful download so the inline form can hide itself. */
  onDownload: (email: string) => Promise<boolean>;
};

export default function FinalCta({ message, signupUrl, onAuditAgain, onDownload }: Props) {
  const total = (message.total || 0) * ANNUALIZE;
  const [emailMode, setEmailMode] = useState(false);

  async function handleEmailSubmit(email: string): Promise<boolean> {
    const ok = await onDownload(email);
    if (ok) setEmailMode(false);
    return ok;
  }

  return (
    <AgentMessage>
      <div className="rc-pa-cta-final">
        <span className="rc-pa-eyebrow">
          <span className="rc-pa-eyebrow__dot" aria-hidden="true" />
          <IconCheck style={{ width: 12, height: 12 }} aria-hidden="true" />
          Full accurate audit complete
        </span>
        <div className="rc-pa-cta-final__total">{USD.format(total)}</div>
        <p className="rc-pa-cta-final__sub">
          Every category locked in from your real spend. This is your full recoverable —
          ready when you are.
        </p>

        {emailMode ? (
          <EmailCapture
            onSubmit={handleEmailSubmit}
            onCancel={() => setEmailMode(false)}
          />
        ) : (
          <div className="rc-pa-cta-final__buttons">
            <a
              href={signupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rc-pa-btn rc-pa-btn--primary"
            >
              <IconDashboard />
              <span>Go to dashboard</span>
            </a>
            <button type="button" className="rc-pa-btn rc-pa-btn--secondary" onClick={onAuditAgain}>
              <IconRefresh />
              <span>Audit again</span>
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
      </div>
    </AgentMessage>
  );
}
