import {
  IconCheck,
  IconDedupGuard,
  IconHeadset,
  IconLoopBreaker,
  IconRefresh,
  IconShieldCheck,
} from "./icons";

/**
 * Reassuring failure card shown when a phase-1 audit can't complete (server
 * 5xx, network drop, or an empty/garbled estimate stream). Rather than leak a
 * raw `Agent request failed: 500` at the visitor, we frame it as our own
 * safeguards intentionally pausing the run — nothing they did, nothing lost.
 *
 * `onRunAgain` clears the failed transcript and re-runs the audit on the same
 * input under a fresh session (wired in index.tsx). `callUrl` is the Calendly
 * "talk to a human" target shared with the final CTA.
 *
 * The two named guardrails (LoopBreaker / DedupGuard) are presentational —
 * they describe the real classes of safeguard that run on every job and give
 * the card concrete, on-brand detail instead of a generic "something broke".
 */
export type GuardrailsErrorProps = {
  onRunAgain: () => void;
  callUrl: string;
  /** Disables "Run it again" while a retry is already in flight. */
  busy?: boolean;
};

const GUARDRAILS: ReadonlyArray<{
  name: string;
  detail: string;
  Icon: typeof IconLoopBreaker;
}> = [
  { name: "LoopBreaker", detail: "runaway loops", Icon: IconLoopBreaker },
  { name: "DedupGuard", detail: "duplicate calls", Icon: IconDedupGuard },
];

export default function GuardrailsError({ onRunAgain, callUrl, busy }: GuardrailsErrorProps) {
  return (
    <div className="rc-pa-guard" role="alert">
      <div className="rc-pa-guard__head">
        <span className="rc-pa-guard__badge" aria-hidden="true">
          <IconShieldCheck />
        </span>
        <div className="rc-pa-guard__copy">
          <h3 className="rc-pa-guard__title">Caught by our guardrails.</h3>
          <p className="rc-pa-guard__body">
            Your audit tripped two of the safeguards that run on every Vaudit job, so we
            paused before billing a token or returning a number we can&rsquo;t stand behind.
          </p>
        </div>
      </div>

      <div className="rc-pa-guard__chips">
        {GUARDRAILS.map(({ name, detail, Icon }) => (
          <span className="rc-pa-guard__chip" key={name}>
            <Icon className="rc-pa-guard__chip-icon" aria-hidden="true" />
            <strong className="rc-pa-guard__chip-name">{name}</strong>
            <span className="rc-pa-guard__chip-detail">{detail}</span>
            <span className="rc-pa-guard__chip-dot" aria-hidden="true" />
          </span>
        ))}
      </div>

      <div className="rc-pa-guard__actions">
        <button
          type="button"
          className="rc-pa-btn rc-pa-btn--secondary"
          onClick={onRunAgain}
          disabled={busy}
        >
          <IconRefresh />
          <span>Run it again</span>
        </button>
        <a
          href={callUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rc-pa-btn rc-pa-btn--secondary"
        >
          <IconHeadset />
          <span>Talk to us</span>
        </a>
      </div>

      <p className="rc-pa-guard__footnote">
        <IconCheck className="rc-pa-guard__footnote-icon" aria-hidden="true" />
        <span>
          Nothing was lost &mdash; your input is saved.
        </span>
      </p>
    </div>
  );
}
