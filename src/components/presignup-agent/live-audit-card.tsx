import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { LiveAuditMessage } from "./types";
import { CATEGORY_ICONS, CATEGORY_LABELS, IconCheck } from "./icons";
import { USD } from "./agent-api";

type LiveAuditCardProps = {
  message: LiveAuditMessage;
};

const ANNUALIZE = 12;

const ROW_LABEL: Record<string, string> = CATEGORY_LABELS;

const ESTIMATE_PILL_LABEL = (completed: boolean) => (completed ? "Audited" : "Scanning");
const ACCURATE_PILL_LABEL = (completed: boolean) => (completed ? "Audited" : "Recalculating");

const ESTIMATE_TOTAL_LABEL = "Recoverable so far";
const ACCURATE_TOTAL_LABEL = "Accurate so far";

const ESTIMATE_EYEBROW = "Live audit";
const ACCURATE_EYEBROW = "Accurate audit";

function useAnimatedNumber(target: number, ms = 600): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = now - start;
      const p = ms > 0 ? Math.min(1, t / ms) : 1;
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (target - from) * eased);
      setValue(v);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

export default function LiveAuditCard({ message }: LiveAuditCardProps) {
  const isAccurate = message.mode === "accurate";
  const pillLabel = isAccurate
    ? ACCURATE_PILL_LABEL(message.completed)
    : ESTIMATE_PILL_LABEL(message.completed);
  const totalAnnual = (message.total || 0) * ANNUALIZE;
  const animatedTotal = useAnimatedNumber(totalAnnual);

  return (
    <section className="rc-pa-live" aria-live="polite">
      <div className="rc-pa-live__pill-row">
        <span className={clsx("rc-pa-pill", message.completed && "is-done")}>
          <span className="rc-pa-pill__dot" aria-hidden="true" />
          {pillLabel}
          {" "}
          <span className="rc-pa-pill__domain">{message.domain}</span>
          <span className="rc-pa-pill__sep">·</span>
          <span>3 categories</span>
        </span>
      </div>

      <div className="rc-pa-progress" aria-hidden="true">
        <div
          className="rc-pa-progress__fill"
          style={{ width: `${Math.round(Math.max(0, Math.min(1, message.progress)) * 100)}%` }}
        />
      </div>

      <div className="rc-pa-live__panel">
        <div className="rc-pa-live__head">
          <div className="rc-pa-live__title-wrap">
            <span className="rc-pa-eyebrow">
              <span className="rc-pa-eyebrow__dot" aria-hidden="true" />
              {isAccurate ? ACCURATE_EYEBROW : ESTIMATE_EYEBROW}
            </span>
            <div className="rc-pa-live__title">
              {message.title}
              {!message.completed && <span className="rc-pa-live__caret" aria-hidden="true" />}
            </div>
          </div>
          <div className="rc-pa-live__total">
            <span className="rc-pa-live__total-label">
              {isAccurate ? ACCURATE_TOTAL_LABEL : ESTIMATE_TOTAL_LABEL}
            </span>
            <span className="rc-pa-live__total-value">{USD.format(animatedTotal)}</span>
          </div>
        </div>

        <div className="rc-pa-live__rows">
          {message.rows.map((row) => {
            const Icon = CATEGORY_ICONS[row.category];
            const amountAnnual = (row.amount || 0) * ANNUALIZE;
            return (
              <div
                key={row.category}
                className={clsx("rc-pa-live__row", `is-${row.state}`)}
              >
                <span className="rc-pa-live__row-status" aria-hidden="true">
                  <IconCheck />
                </span>
                <span className="rc-pa-live__row-name">
                  <Icon className="rc-pa-live__row-icon" />
                  {ROW_LABEL[row.category]}
                </span>
                <span className="rc-pa-live__row-vendors">
                  {row.state === "active"
                    ? row.activeCaption || row.vendorText
                    : row.state === "done"
                      ? row.vendorText
                      : row.state === "queued"
                        ? "Queued"
                        : "Pending"}
                </span>
                <span className="rc-pa-live__row-amount">
                  {row.state === "done"
                    ? USD.format(amountAnnual)
                    : row.state === "active"
                      ? "—"
                      : ""}
                </span>
              </div>
            );
          })}
        </div>

        {!message.completed && (
          <div className="rc-pa-live__row-tail" aria-hidden="true">
            <div
              className="rc-pa-live__row-tail-fill"
              style={{ width: `${Math.round(Math.max(0, Math.min(1, message.progress)) * 100)}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
