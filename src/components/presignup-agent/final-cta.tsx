import { useState } from "react";
import type { FinalCtaMessage } from "./types";
import {
  IconBolt,
  IconCalendar,
  IconCheck,
  IconDownload,
} from "./icons";
import { USD } from "./agent-api";
import EmailCapture from "./email-capture";

const ANNUALIZE = 12;

type Props = {
  message: FinalCtaMessage;
  /** "Get started" destination (signup/onboarding). */
  signupUrl: string;
  /** "Schedule a 15-min call" destination (booking link). */
  callUrl: string;
  /** Returns true on successful download so the inline form can hide itself. */
  onDownload: (email: string) => Promise<boolean>;
};

export default function FinalCta({ message, signupUrl, callUrl, onDownload }: Props) {
  const total = (message.total || 0) * ANNUALIZE;
  const [emailMode, setEmailMode] = useState(false);

  async function handleEmailSubmit(email: string): Promise<boolean> {
    const ok = await onDownload(email);
    if (ok) setEmailMode(false);
    return ok;
  }

  return (
    // Full-width result card, like the live-audit card and results grid — no
    // avatar/bubble wrapper (which would indent it and double-frame the card).
    <div className="rc-pa-cta-final">
      <span className="rc-pa-eyebrow">
          <span className="rc-pa-eyebrow__dot" aria-hidden="true" />
          <IconCheck style={{ width: 12, height: 12 }} aria-hidden="true" />
          {message.domain
            ? `${message.domain} · full accurate audit complete`
            : "Full accurate audit complete"}
        </span>
        <div className="rc-pa-cta-final__total">{USD.format(total)}</div>
        <p className="rc-pa-cta-final__sub">
          {message.domain ? (
            <>
              Every category for <strong>{message.domain}</strong> is locked in from its
              real spend — this is everything you can recover. Ready when you are.
            </>
          ) : (
            <>
              Every category locked in from your real spend. This is your full recoverable
              — ready when you are.
            </>
          )}
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
              <IconBolt />
              <span>Get started</span>
            </a>
            <a
              href={callUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rc-pa-btn rc-pa-btn--secondary"
            >
              <IconCalendar />
              <span>Schedule a 15-min call</span>
            </a>
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
  );
}
