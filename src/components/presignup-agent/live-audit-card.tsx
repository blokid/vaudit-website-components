import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type {
  LiveAuditMessage,
  ProfilerState,
  ProfilerStep,
  ResearchEvent,
} from "./types";
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconLink,
  IconResearch,
  IconSpinner,
  PROFILER_ICONS,
  PROFILER_LABELS,
} from "./icons";
import { USD } from "./agent-api";

type LiveAuditCardProps = {
  message: LiveAuditMessage;
};

const ANNUALIZE = 12;

const ROW_LABEL: Record<string, string> = CATEGORY_LABELS;

const ESTIMATE_PILL_LABEL = (completed: boolean) => (completed ? "Audited" : "Scanning");
const ACCURATE_PILL_LABEL = (completed: boolean) => (completed ? "Audited" : "Recalculating");

const ACCURATE_TOTAL_LABEL = "Accurate so far";

const ESTIMATE_EYEBROW = "Live audit";
const ACCURATE_EYEBROW = "Accurate audit";

const PROFILER_ORDER: ProfilerStep[] = ["dns", "tech", "apollo", "business", "spend"];

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

  // The timeline view (profilers + research events) shows while we're
  // still in the pre-products window of an estimate run. Once any row
  // has gone active or done — i.e. runScanSequence has begun — the
  // detailed rows take over.
  const rowsActive = message.rows.some(
    (row) => row.state === "active" || row.state === "done",
  );
  const showTimeline =
    !isAccurate &&
    !rowsActive &&
    !message.completed &&
    (Object.keys(message.profilers).length > 0 || message.researchEvents.length > 0);

  // Derive a coarse progress bar value from the profiler ticks while the
  // timeline is up. Once rows take over, fall back to the existing row-
  // driven `message.progress`.
  const timelineProgress = useMemo(() => {
    if (!showTimeline) return message.progress;
    const total = PROFILER_ORDER.length;
    let resolved = 0;
    for (const step of PROFILER_ORDER) {
      const s = message.profilers[step];
      if (s === "done" || s === "failed") resolved += 1;
      else if (s === "started") resolved += 0.4;
    }
    return Math.min(0.95, resolved / total);
  }, [showTimeline, message.profilers, message.progress]);

  const progressPct = Math.round(Math.max(0, Math.min(1, timelineProgress)) * 100);

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
          style={{ width: `${progressPct}%` }}
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
          {/* Phase-1 (estimate) sizes spend, not recovery, so it shows no
              running total. The accurate phase reveals the recoverable figure. */}
          {isAccurate && (
            <div className="rc-pa-live__total">
              <span className="rc-pa-live__total-label">{ACCURATE_TOTAL_LABEL}</span>
              <span className="rc-pa-live__total-value">{USD.format(animatedTotal)}</span>
            </div>
          )}
        </div>

        {showTimeline ? (
          <ProfilerTimeline
            profilers={message.profilers}
            researchEvents={message.researchEvents}
          />
        ) : (
          <ProductRows rows={message.rows} />
        )}

        {!message.completed && (
          <div className="rc-pa-live__row-tail" aria-hidden="true">
            <div
              className="rc-pa-live__row-tail-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Product rows — the existing row-scan view, unchanged.
// ---------------------------------------------------------------------------

function ProductRows({ rows }: { rows: LiveAuditMessage["rows"] }) {
  return (
    <div className="rc-pa-live__rows">
      {rows.map((row) => {
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
  );
}

// ---------------------------------------------------------------------------
// Profiler timeline — replaces the static "Pending" rows during the
// pre-products window with real, SSE-driven status.
// ---------------------------------------------------------------------------

function ProfilerTimeline({
  profilers,
  researchEvents,
}: {
  profilers: Partial<Record<ProfilerStep, ProfilerState>>;
  researchEvents: ResearchEvent[];
}) {
  return (
    <div className="rc-pa-timeline">
      {PROFILER_ORDER.map((step) => {
        const Icon = PROFILER_ICONS[step] ?? IconResearch;
        const state = profilers[step] ?? "pending";
        const label = PROFILER_LABELS[step] ?? step;
        const inFlight = state === "started";
        return (
          <div
            key={step}
            className={clsx("rc-pa-timeline__row", `is-${state}`)}
          >
            <span className="rc-pa-timeline__status" aria-hidden="true">
              {state === "done" ? (
                <IconCheck />
              ) : state === "failed" ? (
                <IconAlert />
              ) : inFlight ? (
                <IconSpinner className="rc-pa-timeline__spinner" />
              ) : null}
            </span>
            <span className="rc-pa-timeline__label">
              <Icon className="rc-pa-timeline__icon" />
              {label}
            </span>
            <span className="rc-pa-timeline__caption">
              {captionFor(step, state, researchEvents)}
            </span>
            {step === "business" && researchEvents.length > 0 && (
              <ResearchAccordion events={researchEvents} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function captionFor(
  step: ProfilerStep,
  state: ProfilerState | "pending",
  researchEvents: ResearchEvent[],
): string {
  if (state === "failed") return "skipped";
  if (state === "done") return "done";
  if (state === "started") {
    if (step === "business") {
      const stepCount = countResearchSteps(researchEvents);
      if (stepCount > 0) return `${stepCount} ${stepCount === 1 ? "step" : "steps"}`;
      return "researching…";
    }
    return "running…";
  }
  return "queued";
}

// ---------------------------------------------------------------------------
// Research accordion — Claude.ai-style "Researched N sources" dropdown
// for the business profiler timeline.
// ---------------------------------------------------------------------------

function countResearchSteps(events: ResearchEvent[]): number {
  // Count "real" steps the user would care about. Narration is interesting
  // commentary but doesn't count as a search/fetch step.
  let n = 0;
  for (const ev of events) {
    if (
      ev.type === "search_started" ||
      ev.type === "fetch_started"
    ) {
      n += 1;
    }
  }
  return n;
}

function ResearchAccordion({ events }: { events: ResearchEvent[] }) {
  const [open, setOpen] = useState(false);
  const stepCount = useMemo(() => countResearchSteps(events), [events]);
  const summary = stepCount > 0
    ? `Completed ${stepCount} ${stepCount === 1 ? "step" : "steps"}`
    : "Reading sources…";
  return (
    <div className={clsx("rc-pa-research", open && "is-open")}>
      <button
        type="button"
        className="rc-pa-research__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <IconResearch className="rc-pa-research__leading" />
        <span className="rc-pa-research__summary">{summary}</span>
        <IconChevronDown className="rc-pa-research__chevron" />
      </button>
      {open && (
        <ol className="rc-pa-research__list">
          {events.map((ev, i) => (
            <ResearchEventRow key={i} event={ev} />
          ))}
        </ol>
      )}
    </div>
  );
}

function ResearchEventRow({ event }: { event: ResearchEvent }) {
  switch (event.type) {
    case "narration":
      return (
        <li className="rc-pa-research__item rc-pa-research__item--narration">
          <span className="rc-pa-research__bullet" aria-hidden="true" />
          <span className="rc-pa-research__text">{event.text}</span>
        </li>
      );
    case "search_started":
      return (
        <li className="rc-pa-research__item">
          <IconResearch className="rc-pa-research__item-icon" />
          <span className="rc-pa-research__text">
            <span className="rc-pa-research__verb">Searching</span>{" "}
            <em>{event.query}</em>
          </span>
        </li>
      );
    case "search_results": {
      const count = event.results?.length ?? 0;
      return (
        <li className="rc-pa-research__item rc-pa-research__item--soft">
          <IconCheck className="rc-pa-research__item-icon" />
          <span className="rc-pa-research__text">
            Found {count} {count === 1 ? "result" : "results"}
          </span>
        </li>
      );
    }
    case "fetch_started":
      return (
        <li className="rc-pa-research__item">
          <IconLink className="rc-pa-research__item-icon" />
          <span className="rc-pa-research__text">
            <span className="rc-pa-research__verb">Reading</span>{" "}
            <span className="rc-pa-research__url">{cleanUrl(event.url)}</span>
          </span>
        </li>
      );
    case "fetch_completed":
      return (
        <li
          className={clsx(
            "rc-pa-research__item rc-pa-research__item--soft",
            !event.ok && "rc-pa-research__item--failed",
          )}
        >
          {event.ok ? (
            <IconCheck className="rc-pa-research__item-icon" />
          ) : (
            <IconAlert className="rc-pa-research__item-icon" />
          )}
          <span className="rc-pa-research__text">
            {event.ok ? "Read" : "Couldn't read"}{" "}
            <span className="rc-pa-research__url">{cleanUrl(event.url)}</span>
          </span>
        </li>
      );
    default:
      return null;
  }
}

function cleanUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch (_) {
    return url;
  }
}
