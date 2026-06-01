import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentMeta } from "../../registry";
import {
  buildRunPayload,
  consumeSSE,
  downloadAuditReport,
  EMAIL_RE,
  ensureSession,
  extractAuditProducts,
  extractHoldingRedirect,
  fetchPersistedBreakdown,
  freshStartSession,
  getAgentBaseUrl,
  getSessionId,
  getToken,
  isValidDomain,
  mergeStreamText,
  normalizeDomain,
  peekSessionId,
  postAccurateBreakdown,
  resetSession,
  streamAgent,
  subscribePresignupProgress,
} from "./agent-api";
import type { ProgressEvent } from "./agent-api";
import {
  AgentMessage,
  AgentSection,
  UserBubble,
} from "./chat-message";
import Composer from "./composer";
import LiveAuditCard from "./live-audit-card";
import ResultsGrid from "./results-grid";
import EstimateCta from "./estimate-cta";
import FinalCta from "./final-cta";
import AccuratePicker from "./accurate-picker";
import AccurateRanges from "./accurate-ranges";
import HoldingRedirect from "./holding-redirect";
import { recalculateBreakdown, rangesSummaryLines } from "./recalc";
import type {
  AccurateRanges as AccurateRangesType,
  AccurateSelection,
  AuditRow,
  ChatMessage,
  Product,
  SpendRange,
} from "./types";
import "./presignup-agent.css";

const SIGNUP_URL = "https://app.vaudit.com/v2/sign-up";

// Pacing constants for the live-audit row animation. Long enough to feel
// real, short enough not to slow the demo down.
const ROW_ENTER_MS = 250;
const ROW_VENDOR_MS = 280;
const ROW_DONE_HOLD_MS = 220;
const FINAL_HOLD_MS = 350;
const ACCURATE_PER_ROW_MS = 1100;

const CATEGORY_ORDER: ("ad_id" | "vendor_id" | "token_id")[] = [
  "ad_id",
  "vendor_id",
  "token_id",
];

type PresignupAgentProps = {
  /** Override the agent base URL — defaults to staging on non-vaudit.com origins. */
  agentBaseUrl?: string;
  /**
   * When provided, skip the composer-entry flow and replay a pre-computed
   * audit (used by the Mucker portfolio dashboard). The replay animates the
   * same row-scan and posts the same results-grid + estimate-cta as a live
   * run, but never talks to the agent for phase 1. Phase 2 (lock-in + range
   * recalc) is unchanged — it was already client-driven. Follow-ups still
   * hit the live agent through the composer.
   */
  replay?: { domain: string; products: Product[] };
};

const REPLAY_DEMO_PRODUCTS: Product[] = [
  {
    id: "ad_id",
    wasteTotal: 14_200,
    vendors: [
      { name: "Google Ads", estSpend: 95_000, waste: 9_500 },
      { name: "Meta Ads", estSpend: 47_000, waste: 4_700 },
    ],
  },
  {
    id: "token_id",
    wasteTotal: 4_800,
    vendors: [
      { name: "OpenAI", estSpend: 12_000, waste: 3_600, verificationDepth: "full" },
      { name: "Anthropic", estSpend: 4_000, waste: 1_200, verificationDepth: "partial" },
    ],
  },
  {
    id: "vendor_id",
    wasteTotal: 6_900,
    vendors: [
      { name: "AWS", estSpend: 38_000, waste: 3_800 },
      { name: "Stripe", estSpend: 31_000, waste: 3_100 },
    ],
  },
];

export const meta: ComponentMeta<PresignupAgentProps> = {
  description:
    "Chat-style two-phase audit (estimate → accurate) with persistent composer.",
  props: {
    agentBaseUrl: {
      type: "string",
      description:
        "Override the agent base URL. When omitted, uses prod on vaudit.com origins and staging elsewhere.",
      default: "auto-detect",
    },
    replay: {
      type: "{ domain: string; products: Product[] }",
      description:
        "Replay a pre-computed audit instead of running live (used by Mucker dashboard).",
      default: "undefined",
    },
  },
  variants: {
    "default (auto-detect)": {},
    "force local": { agentBaseUrl: "http://localhost:3000" },
    "force staging": { agentBaseUrl: "https://onboarding-agent.staging.vaudit.com" },
    "replay (demo)": {
      replay: { domain: "stripe.com", products: REPLAY_DEMO_PRODUCTS },
    },
  },
};

let MESSAGE_SEQ = 0;
function nextId(prefix: string): string {
  MESSAGE_SEQ += 1;
  return `${prefix}-${MESSAGE_SEQ}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

type PostHog = {
  identify?: (distinctId: string, properties?: Record<string, unknown>) => void;
  capture?: (event: string, properties?: Record<string, unknown>) => void;
};

function trackReportEmailSubmission(
  email: string,
  sessionId: string,
  estimateAmount: number,
) {
  const ph = (window as unknown as { posthog?: PostHog }).posthog;
  console.log("[presignup-agent] track email submission:", {
    email,
    sessionId,
    estimateAmount,
    posthog: typeof ph,
  });
  if (!ph) return;
  // Capture FIRST so the event lands even if identify misbehaves.
  try {
    ph.capture?.("presignup_report_email_submitted", {
      email,
      session_id: sessionId,
      calculator_estimate_amount: estimateAmount,
    });
  } catch (err) {
    console.warn("[presignup-agent] posthog capture failed:", err);
  }
  try {
    ph.identify?.(email, { email });
  } catch (err) {
    console.warn("[presignup-agent] posthog identify failed:", err);
  }
}

function blankRows(): AuditRow[] {
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    state: "pending",
    vendorText: "",
    activeCaption: "",
    amount: 0,
  }));
}

function queuedRows(): AuditRow[] {
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    state: "queued",
    vendorText: "",
    activeCaption: "",
    amount: 0,
  }));
}

/** Estimate-mode initial title — overridden by the active profiler step
 *  as soon as progress events start arriving. */
const INITIAL_ESTIMATE_TITLE = "Connecting to audit service";

const SELECTION_LABEL: Record<AccurateSelection, string> = {
  ad_id: "Ad ID",
  token_id: "Token ID",
  vendor_id: "Vendor ID",
  all: "all three products",
};

export default function PresignupAgent({ agentBaseUrl, replay }: PresignupAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [breakdownLocked, setBreakdownLocked] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const phase1ProductsRef = useRef<Product[] | null>(null);
  const phase1LockedRef = useRef<boolean>(false);
  const domainRef = useRef<string>("");
  const phase2SelectionRef = useRef<AccurateSelection | null>(null);
  const latestTotalRef = useRef<number>(0);
  // Mirror of `messages` for reads inside async callbacks (rehydration)
  // without adding them to effect deps.
  const messagesRef = useRef<ChatMessage[]>([]);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const append = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const update = useCallback((id: string, patch: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? patch(m) : m)));
  }, []);

  const cancelActive = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch (_) {
        /* ignore */
      }
      abortRef.current = null;
    }
    cancelledRef.current = true;
  }, []);

  useEffect(() => {
    const handler = () => cancelActive();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cancelActive]);

  // ------------------------------------------------------------------------
  // Phase 1 — domain in → estimate audit
  // ------------------------------------------------------------------------

  const runEstimate = useCallback(
    async (domain: string) => {
      cancelActive();
      cancelledRef.current = false;
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);

      const ackId = nextId("ack");
      append({
        id: ackId,
        kind: "agent_text",
        text: ackTextFor(domain),
      });

      const liveId = nextId("live");
      append({
        id: liveId,
        kind: "live_audit",
        mode: "estimate",
        domain,
        title: INITIAL_ESTIMATE_TITLE,
        total: 0,
        progress: 0,
        rows: blankRows(),
        completed: false,
        profilers: {},
        researchEvents: [],
      });

      let closeProgress: () => void = () => {};
      try {
        const baseUrl = getAgentBaseUrl(agentBaseUrl);
        const sessionId = getSessionId();

        let token = await getToken(baseUrl, controller.signal);
        if (cancelledRef.current) return;
        await ensureSession(baseUrl, sessionId, token, controller.signal);
        if (cancelledRef.current) return;
        token = await getToken(baseUrl, controller.signal);
        if (cancelledRef.current) return;

        // Subscribe to the per-step progress channel BEFORE we kick off
        // the agent stream so we don't miss the first profiler `started`
        // tick (Redis pub/sub drops messages with no live subscribers).
        // Pass `setMessages` directly so reasoning events (which post
        // after the live_audit is gone and the results_grid is on
        // screen) can find the grid by kind via a setState-based lookup.
        closeProgress = subscribePresignupProgress(
          baseUrl,
          sessionId,
          (event) => applyProgressEvent(liveId, event, update, setMessages),
        );

        const stream = await streamAgent(
          baseUrl,
          buildRunPayload(domain, sessionId),
          token,
          controller.signal,
        );

        let pending = "";
        let committed = "";
        await consumeSSE(stream, (event) => {
          if (!event?.content?.parts) return;
          let chunk = "";
          for (const part of event.content.parts) {
            if (typeof part?.text === "string") chunk += part.text;
          }
          if (!chunk) return;
          if (event.partial === true) {
            pending = mergeStreamText(pending, chunk);
          } else if (!pending) {
            committed += chunk;
          } else {
            committed += pending;
            pending = "";
          }
        });
        const accumulated = committed + pending;

        if (cancelledRef.current) return;

        // Stage 1 holding-company short-circuit (Build Guide §Stage 1).
        // When the backend detected the visitor's domain is a holding /
        // portfolio pattern, it emits a holding_redirect widget instead
        // of audit_products and skips profiling. Render the brand
        // picker and bail out of the audit flow — the visitor's
        // subsidiary choice re-enters the flow as a fresh domain
        // submission.
        const holding = extractHoldingRedirect(accumulated);
        if (holding) {
          // Drop the live_audit stub — there are no profilers to scan.
          update(liveId, (m) =>
            m.kind === "live_audit"
              ? {
                  ...m,
                  rows: m.rows.map((row) => ({ ...row, state: "done" })),
                  title: "Domain looks like a holding company",
                }
              : m,
          );
          append({
            id: nextId("holding"),
            kind: "holding_redirect",
            domain: holding.domain,
            pattern: holding.pattern,
            suggestedBrands: holding.suggestedBrands,
            submitted: false,
          });
          return;
        }

        const result = extractAuditProducts(accumulated);
        if (!result?.products.length) {
          throw new Error("Agent did not return any audit products.");
        }
        const { products, locked } = result;
        phase1ProductsRef.current = products;
        phase1LockedRef.current = locked;

        await runScanSequence(liveId, products, "estimate", update);
        if (cancelledRef.current) return;

        const total = products.reduce((acc, p) => acc + (p.wasteTotal || 0), 0);
        latestTotalRef.current = total * 12;
        append({
          id: nextId("grid"),
          kind: "results_grid",
          mode: "estimate",
          domain,
          products,
        });
        append({
          id: nextId("est-cta"),
          kind: "estimate_cta",
          total,
          categoryCount: products.length,
          busy: false,
          locked,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError" || cancelledRef.current) return;
        append({
          id: nextId("err"),
          kind: "error",
          text: (err as Error)?.message || "Something went wrong. Please try again.",
          retry: true,
        });
      } finally {
        closeProgress();
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
      }
    },
    [agentBaseUrl, append, cancelActive, update],
  );

  // ------------------------------------------------------------------------
  // Replay mode — no SSE, no auth, just animate against pre-computed products.
  // Used by the Mucker dashboard. Phase 2 still runs live against the real
  // agent, but phase-2 is already client-driven so nothing else changes.
  // ------------------------------------------------------------------------

  const runReplay = useCallback(
    async (domain: string, products: Product[]) => {
      cancelActive();
      cancelledRef.current = false;
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);

      append({
        id: nextId("ack"),
        kind: "agent_text",
        text: ackTextFor(domain),
      });

      const liveId = nextId("live");
      append({
        id: liveId,
        kind: "live_audit",
        mode: "estimate",
        domain,
        title: "Sizing recoverable spend",
        total: 0,
        progress: 0,
        rows: blankRows(),
        completed: false,
        profilers: {},
        researchEvents: [],
      });

      try {
        await runScanSequence(liveId, products, "estimate", update);
        if (cancelledRef.current) return;

        phase1ProductsRef.current = products;
        phase1LockedRef.current = false;

        const total = products.reduce((acc, p) => acc + (p.wasteTotal || 0), 0);
        latestTotalRef.current = total * 12;
        append({
          id: nextId("grid"),
          kind: "results_grid",
          mode: "estimate",
          domain,
          products,
        });
        append({
          id: nextId("est-cta"),
          kind: "estimate_cta",
          total,
          categoryCount: products.length,
          busy: false,
          locked: false,
        });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
      }
    },
    [append, cancelActive, update],
  );

  useEffect(() => {
    if (!replay) return;
    domainRef.current = replay.domain;
    runReplay(replay.domain, replay.products);
    // Cleanup on prop-change cancels any in-flight animation so the next
    // replay starts cleanly. Parent should also re-key the component when
    // switching companies for a hard reset of message state.
    return () => cancelActive();
  }, [replay, runReplay, cancelActive]);

  // ------------------------------------------------------------------------
  // Rehydrate a prior audit on mount — page-refresh recovery.
  // ------------------------------------------------------------------------
  // The session id is cached in localStorage, so a refresh reuses the same
  // backend session: its persisted breakdown survives but the rendered
  // transcript does not, and the next turn is classified phase-2
  // ``followup`` (prose, no widget). Without re-painting the breakdown the
  // visitor sees "Agent did not return any audit products". Fetch the
  // persisted breakdown and re-render the results grid + CTA so phase-2's
  // "correct the estimates above" has its referent. Best-effort and silent:
  // any miss falls through to the normal landing input.
  const rehydratedRef = useRef(false);
  useEffect(() => {
    if (replay) return; // replay owns the transcript
    if (rehydratedRef.current) return;
    rehydratedRef.current = true;

    const cached = peekSessionId();
    if (!cached) return; // brand-new visitor — nothing to rehydrate

    (async () => {
      const baseUrl = getAgentBaseUrl(agentBaseUrl);
      const bd = await fetchPersistedBreakdown(baseUrl, cached);
      if (!bd || !bd.products.length) return;
      // Don't clobber a live run that the visitor kicked off in the gap
      // between mount and this resolving.
      if (messagesRef.current.length > 0) return;

      const domain = bd.domain || "";
      const { products, locked } = bd;
      domainRef.current = domain;
      phase1ProductsRef.current = products;
      phase1LockedRef.current = locked;
      setBreakdownLocked(locked);

      const total = products.reduce((acc, p) => acc + (p.wasteTotal || 0), 0);
      latestTotalRef.current = total * 12;

      append({
        id: nextId("rehydrate-ack"),
        kind: "agent_text",
        text: domain
          ? `Welcome back — here's the audit we saved for ${domain}. ` +
            `Ask me to refine any number, see how we got here, or download the report.`
          : `Welcome back — here's the audit we saved for you. ` +
            `Ask me to refine any number, see how we got here, or download the report.`,
      });
      append({
        id: nextId("grid"),
        kind: "results_grid",
        mode: "estimate",
        domain,
        products,
      });
      append({
        id: nextId("est-cta"),
        kind: "estimate_cta",
        total,
        categoryCount: products.length,
        busy: false,
        locked,
      });
    })();
  }, [replay, agentBaseUrl, append]);

  // ------------------------------------------------------------------------
  // Phase 2 — client-driven (picker → ranges → recalc → persist → grid)
  // ------------------------------------------------------------------------

  const startAccurate = useCallback(() => {
    // PDF render locks the breakdown server-side; phase-2 corrections are
    // rejected with `LOCKED`. Don't even open the picker — the visitor was
    // just emailed a frozen report and we'd be inviting a desync.
    if (phase1LockedRef.current) return;
    append({
      id: nextId("user"),
      kind: "user_text",
      text: "Yes — let's run the accurate audit.",
    });
    append({
      id: nextId("picker"),
      kind: "accurate_picker",
      selection: "all",
      completed: false,
    });
  }, [append]);

  const handlePickerConfirm = useCallback(
    (pickerId: string, selection: AccurateSelection) => {
      phase2SelectionRef.current = selection;
      update(pickerId, (m) =>
        m.kind === "accurate_picker"
          ? { ...m, selection, completed: true }
          : m,
      );
      append({
        id: nextId("user"),
        kind: "user_text",
        text: `I want an accurate audit for ${SELECTION_LABEL[selection]}.`,
      });
      append({
        id: nextId("ranges"),
        kind: "accurate_ranges",
        selection,
        ranges: {},
        busy: false,
        completed: false,
      });
    },
    [append, update],
  );

  const handleRangesBack = useCallback((rangesId: string) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === rangesId);
      if (idx < 0) return prev;
      const before = prev.slice(0, idx);
      let stripIdx = before.length - 1;
      while (stripIdx >= 0 && before[stripIdx].kind !== "user_text") stripIdx -= 1;
      const trimmed = stripIdx >= 0 ? before.slice(0, stripIdx) : before;
      return trimmed.map((m) =>
        m.kind === "accurate_picker" ? { ...m, completed: false } : m,
      );
    });
    phase2SelectionRef.current = null;
  }, []);

  const handleRangesSubmit = useCallback(
    async (
      rangesId: string,
      partialRanges: Partial<Record<"ad" | "ai" | "vendor", SpendRange>>,
    ) => {
      const selection = phase2SelectionRef.current ?? "all";
      const phase1 = phase1ProductsRef.current;
      if (!phase1) return;

      // recalculateBreakdown ignores ranges for categories not in `selection`,
      // so we can stub anything for the missing ones — use a no-op zero range.
      const NOOP: SpendRange = { min: 0, max: 0, label: "—" };
      const ranges: AccurateRangesType = {
        ad: partialRanges.ad ?? NOOP,
        ai: partialRanges.ai ?? NOOP,
        vendor: partialRanges.vendor ?? NOOP,
      };

      update(rangesId, (m) =>
        m.kind === "accurate_ranges" ? { ...m, ranges, busy: true } : m,
      );

      append({
        id: nextId("user"),
        kind: "user_text",
        text: rangesSummaryLines(partialRanges).join("\n"),
      });

      const liveId = nextId("live-acc");
      append({
        id: liveId,
        kind: "live_audit",
        mode: "accurate",
        domain: domainRef.current,
        title: "Cross-checking vendor billing",
        total: 0,
        progress: 0,
        rows: queuedRows(),
        completed: false,
        profilers: {},
        researchEvents: [],
      });

      const recalc = recalculateBreakdown(phase1, ranges, selection);

      await runScanSequence(liveId, recalc.products, "accurate", update);

      update(rangesId, (m) =>
        m.kind === "accurate_ranges" ? { ...m, busy: false, completed: true } : m,
      );

      try {
        const baseUrl = getAgentBaseUrl(agentBaseUrl);
        const sessionId = getSessionId();
        const payloadRanges: Partial<Record<"ad" | "ai" | "vendor",
          { min: number; max: number; label: string }>> = {};
        if (partialRanges.ad) {
          payloadRanges.ad = {
            min: partialRanges.ad.min,
            max: finiteOr(partialRanges.ad.max),
            label: partialRanges.ad.label,
          };
        }
        if (partialRanges.ai) {
          payloadRanges.ai = {
            min: partialRanges.ai.min,
            max: finiteOr(partialRanges.ai.max),
            label: partialRanges.ai.label,
          };
        }
        if (partialRanges.vendor) {
          payloadRanges.vendor = {
            min: partialRanges.vendor.min,
            max: finiteOr(partialRanges.vendor.max),
            label: partialRanges.vendor.label,
          };
        }
        await postAccurateBreakdown(baseUrl, sessionId, {
          products: recalc.products,
          total: recalc.total,
          ranges: payloadRanges,
          selection,
        });
      } catch (err) {
        // Persist failure is non-fatal — keep the accurate UI on screen.
        console.warn("[presignup-agent] accurate breakdown persist failed:", err);
      }

      append({
        id: nextId("grid-acc"),
        kind: "results_grid",
        mode: "accurate",
        domain: domainRef.current,
        products: recalc.products,
      });
      latestTotalRef.current = recalc.total * 12;
      append({
        id: nextId("final-cta"),
        kind: "final_cta",
        total: recalc.total,
      });
    },
    [agentBaseUrl, append, update],
  );

  // ------------------------------------------------------------------------
  // Composer wiring
  // ------------------------------------------------------------------------

  const handleComposerSubmit = useCallback(() => {
    const raw = composerValue.trim();
    if (!raw || busy) return;

    if (isEmpty) {
      const domain = normalizeDomain(raw);
      if (!isValidDomain(domain)) {
        // Inline error below the textarea — keeps the empty-state card clean
        // (don't shove a chat bubble above the composer for a typo).
        setComposerError("Enter a valid domain, like sportforlife.co.th.");
        return;
      }
      setComposerError(null);
      setComposerValue("");
      domainRef.current = domain;
      runEstimate(domain);
      return;
    }

    setComposerValue("");
    append({ id: nextId("user"), kind: "user_text", text: raw });
    runFollowUp(raw);
  }, [busy, composerValue, isEmpty, append, runEstimate]);

  const handleComposerChange = useCallback((next: string) => {
    setComposerValue(next);
    setComposerError(null);
  }, []);

  const runFollowUp = useCallback(
    async (text: string) => {
      cancelActive();
      cancelledRef.current = false;
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);

      const replyId = nextId("agent-reply");
      append({ id: replyId, kind: "agent_text", text: "" });

      try {
        const baseUrl = getAgentBaseUrl(agentBaseUrl);
        const sessionId = getSessionId();

        let token = await getToken(baseUrl, controller.signal);
        if (cancelledRef.current) return;
        await ensureSession(baseUrl, sessionId, token, controller.signal);
        if (cancelledRef.current) return;
        token = await getToken(baseUrl, controller.signal);
        if (cancelledRef.current) return;

        const stream = await streamAgent(
          baseUrl,
          buildRunPayload(text, sessionId),
          token,
          controller.signal,
        );

        // Mirror onboarding-agent/frontend ChatPanel.tsx: split into a
        // committed buffer (finalised turns) + a pending buffer (in-flight
        // partials). `mergeStreamText` handles snapshot-style chunks
        // (each partial may already contain the full prior text).
        let pending = "";
        let committed = "";
        await consumeSSE(stream, (event) => {
          if (!event?.content?.parts) return;
          let chunk = "";
          for (const part of event.content.parts) {
            if (typeof part?.text === "string") chunk += part.text;
          }
          if (!chunk) return;
          if (event.partial === true) {
            pending = mergeStreamText(pending, chunk);
          } else if (!pending) {
            // Non-partial with no prior partials — non-streaming reply.
            committed += chunk;
          } else {
            // Non-partial after partials = turn-complete signal; commit + reset.
            committed += pending;
            pending = "";
          }
          const acc = committed + pending;
          const visible = acc.replace(/:::[\s\S]*?:::/g, "").trim();
          update(replyId, (m) =>
            m.kind === "agent_text" ? { ...m, text: visible } : m,
          );
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError" || cancelledRef.current) return;
        update(replyId, (m) =>
          m.kind === "agent_text"
            ? { ...m, text: "Sorry — I couldn't reach the agent. Try again in a moment." }
            : m,
        );
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
      }
    },
    [agentBaseUrl, append, cancelActive, update],
  );

  // ------------------------------------------------------------------------
  // CTA actions
  // ------------------------------------------------------------------------

  const handleDownloadReport = useCallback(
    async (email: string): Promise<boolean> => {
      const trimmed = email.trim();
      if (!EMAIL_RE.test(trimmed)) return false;

      const sessionId = getSessionId();
      trackReportEmailSubmission(trimmed, sessionId, latestTotalRef.current);

      try {
        const baseUrl = getAgentBaseUrl(agentBaseUrl);
        const { blob, filename } = await downloadAuditReport(baseUrl, sessionId, trimmed);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        // PDF render locks the breakdown server-side. Reflect that on every
        // open `estimate_cta` so the "Lock in exact numbers" button hides
        // (the route would 409 anyway, but the visitor shouldn't be invited
        // down a path that's just been frozen against them).
        const wasLocked = phase1LockedRef.current;
        phase1LockedRef.current = true;
        setBreakdownLocked(true);
        setMessages((prev) =>
          prev.map((m) =>
            m.kind === "estimate_cta" ? { ...m, locked: true } : m,
          ),
        );
        if (!wasLocked) {
          append({
            id: nextId("agent-locked"),
            kind: "agent_text",
            eyebrow: "Report sent",
            text:
              "Your audit is now locked in — the numbers in the report match what you saw here. " +
              "Need to change them? Audit again with a fresh domain or email us and we'll re-run it.",
          });
        }
        return true;
      } catch (err) {
        console.error("[presignup-agent] download failed:", err);
        append({
          id: nextId("err"),
          kind: "error",
          text:
            err instanceof Error ? err.message : "Couldn't generate the report. Try again.",
          retry: false,
        });
        return false;
      }
    },
    [agentBaseUrl, append],
  );

  // Clear all client-side audit state back to the empty hero, aborting any
  // in-flight stream. Does NOT touch the session id — callers decide whether
  // to keep it (same-id backend teardown) or rotate it (`resetSession`).
  const resetLocalUiState = useCallback(() => {
    cancelActive();
    cancelledRef.current = false;
    phase1ProductsRef.current = null;
    phase1LockedRef.current = false;
    phase2SelectionRef.current = null;
    domainRef.current = "";
    latestTotalRef.current = 0;
    setMessages([]);
    setComposerValue("");
    setComposerError(null);
    setBusy(false);
    setBreakdownLocked(false);
  }, [cancelActive]);

  // Post-results "Audit again" (FinalCta): hard break — reset local state and
  // rotate the session id so the new audit starts on a brand-new session.
  const handleAuditAgain = useCallback(() => {
    resetLocalUiState();
    resetSession();
  }, [resetLocalUiState]);

  // Always-visible "Start over": clean restart on the SAME session id. Ask the
  // backend to tear down + recreate the session under the same id (wipes any
  // PDF lock); on failure (trust window lapsed → 401, or network) fall back to
  // rotating the id so the next submit still starts clean. Uses `peekSessionId`
  // so a brand-new visitor with no cached id doesn't mint one just to reset.
  const handleStartOver = useCallback(async () => {
    const sessionId = peekSessionId();
    resetLocalUiState();
    if (!sessionId) return;
    try {
      await freshStartSession(getAgentBaseUrl(agentBaseUrl), sessionId);
    } catch (_) {
      resetSession();
    }
  }, [agentBaseUrl, resetLocalUiState]);

  const handleHoldingSubmit = useCallback(
    (holdingId: string, rawDomain: string) => {
      const domain = normalizeDomain(rawDomain);
      if (!isValidDomain(domain) || busy) return;

      // Stage 1 brand-picker submission. Lock the picker (visible "Submitted"
      // state on the button), echo the visitor's pick as a user bubble, then
      // reset the session so backend state — including ``holding_redirect_
      // active`` — starts clean for the new domain. Running with a stale
      // session would re-trip the short-circuit since the flag never clears
      // on its own.
      update(holdingId, (m) =>
        m.kind === "holding_redirect" ? { ...m, submitted: true } : m,
      );
      append({ id: nextId("user"), kind: "user_text", text: rawDomain });
      resetSession();
      domainRef.current = domain;
      runEstimate(domain);
    },
    [append, busy, runEstimate, update],
  );

  const placeholder = useMemo(() => {
    if (isEmpty) {
      return "Enter a website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…";
    }
    if (breakdownLocked) {
      return "Audit again with a different domain…";
    }
    return "Ask a follow-up…";
  }, [isEmpty, breakdownLocked]);

  return (
    <section className="rc-pa-section">
      <div className={`rc-pa-card${isEmpty ? " is-empty" : ""}`}>
        {isEmpty && <span className="rc-pa-card__shimmer" aria-hidden="true" />}
        {!isEmpty && (
          <button
            type="button"
            className="rc-pa-startover"
            onClick={handleStartOver}
            title="Clear this audit and start a new one"
          >
            Start over
          </button>
        )}
        <div className={`rc-pa-thread${isEmpty ? " is-empty" : ""}`}>
          {messages.map((msg) =>
            renderMessage(msg, {
              onLockIn: startAccurate,
              onPickerConfirm: handlePickerConfirm,
              onRangesBack: handleRangesBack,
              onRangesSubmit: handleRangesSubmit,
              onDownloadReport: handleDownloadReport,
              onAuditAgain: handleAuditAgain,
              onHoldingSubmit: handleHoldingSubmit,
            }),
          )}
        </div>
        <Composer
          empty={isEmpty}
          value={composerValue}
          onChange={handleComposerChange}
          onSubmit={handleComposerSubmit}
          placeholder={placeholder}
          busy={busy}
          error={isEmpty ? composerError : null}
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Render dispatch
// ---------------------------------------------------------------------------

type RenderHandlers = {
  onLockIn: () => void;
  onPickerConfirm: (pickerId: string, selection: AccurateSelection) => void;
  onRangesBack: (rangesId: string) => void;
  onRangesSubmit: (
    rangesId: string,
    ranges: Partial<Record<"ad" | "ai" | "vendor", SpendRange>>,
  ) => void;
  onDownloadReport: (email: string) => Promise<boolean>;
  onAuditAgain: () => void;
  onHoldingSubmit: (holdingId: string, domain: string) => void;
};

function renderMessage(msg: ChatMessage, h: RenderHandlers) {
  switch (msg.kind) {
    case "agent_text":
      return (
        <AgentMessage key={msg.id}>
          <AckText text={msg.text} />
        </AgentMessage>
      );
    case "user_text":
      return <UserBubble key={msg.id}>{msg.text}</UserBubble>;
    case "live_audit":
      return <LiveAuditCard key={msg.id} message={msg} />;
    case "results_grid":
      return <ResultsGrid key={msg.id} message={msg} />;
    case "estimate_cta":
      return (
        <EstimateCta
          key={msg.id}
          message={msg}
          onLockIn={h.onLockIn}
          onDownload={(email) => h.onDownloadReport(email)}
        />
      );
    case "final_cta":
      return (
        <FinalCta
          key={msg.id}
          message={msg}
          signupUrl={SIGNUP_URL}
          onAuditAgain={h.onAuditAgain}
          onDownload={(email) => h.onDownloadReport(email)}
        />
      );
    case "accurate_picker":
      return (
        <AccuratePicker
          key={msg.id}
          message={msg}
          onConfirm={(s) => h.onPickerConfirm(msg.id, s)}
        />
      );
    case "accurate_ranges":
      return (
        <AccurateRanges
          key={msg.id}
          message={msg}
          onSubmit={(ranges) => h.onRangesSubmit(msg.id, ranges)}
          onBack={() => h.onRangesBack(msg.id)}
        />
      );
    case "holding_redirect":
      return (
        <HoldingRedirect
          key={msg.id}
          message={msg}
          onSubmit={(domain) => h.onHoldingSubmit(msg.id, domain)}
        />
      );
    case "error":
      return (
        <AgentSection key={msg.id} text={<span className="rc-pa-error">{msg.text}</span>}>
          {null}
        </AgentSection>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Agent ack — interpret a small subset of bold markup
// ---------------------------------------------------------------------------

function ackTextFor(domain: string): string {
  return `On it. Scanning **${domain}** against our vendor benchmarks now — this gives you an **estimate in ~10 seconds**. You can lock in exact numbers right after.`;
}

function AckText({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith("**") && p.endsWith("**")) {
          return <strong key={i}>{p.slice(2, -2)}</strong>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Progress-SSE → live-audit message
// ---------------------------------------------------------------------------

const PROFILER_TITLE: Record<string, string> = {
  dns: "Looking up DNS records",
  tech: "Scanning your tech stack",
  apollo: "Pulling company profile",
  business: "Researching your business",
  spend: "Estimating monthly spend",
};

const PROFILER_PRIORITY: ReadonlyArray<"business" | "tech" | "apollo" | "dns" | "spend"> = [
  // Pick the title from the most "interesting" still-running step. Business
  // takes priority because it has the longest visible tail (deep-research)
  // and most users want to know that's what's happening.
  "business",
  "spend",
  "tech",
  "apollo",
  "dns",
];

function applyProgressEvent(
  liveId: string,
  event: ProgressEvent,
  update: (id: string, patch: (m: ChatMessage) => ChatMessage) => void,
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>,
) {
  // Pass 2 reasoning events (Build Guide §Stage 5.5 Pass 2) arrive
  // post-widget-emit — by the time they land, the live_audit is gone
  // and the results_grid is on screen. Route them into the most-recent
  // results_grid via a setState-based search; ignore when no grid is
  // present (e.g. holding-company redirect path or audit error).
  if (event.step === "reasoning") {
    setMessages((prev) => {
      // Walk in reverse so we land on the latest grid (phase-2
      // corrections re-emit a new one).
      for (let i = prev.length - 1; i >= 0; i--) {
        const m = prev[i];
        if (m.kind !== "results_grid") continue;
        const reasoning = { ...(m.reasoning ?? {}) };
        reasoning[event.pot] = {
          status: event.state,
          ...(event.text ? { text: event.text } : {}),
        };
        const next = [...prev];
        next[i] = { ...m, reasoning };
        return next;
      }
      return prev;
    });
    return;
  }

  update(liveId, (m) => {
    if (m.kind !== "live_audit") return m;
    // If the row-scan animation has already started, the rows take over the
    // visual story — don't keep mutating the timeline header. We still want
    // to record events though, so the research dropdown stays consistent.
    const rowsActive = m.rows.some(
      (row) => row.state === "active" || row.state === "done",
    );

    if (event.state === "researching" && event.detail) {
      return {
        ...m,
        researchEvents: [...m.researchEvents, event.detail],
        title: rowsActive ? m.title : (PROFILER_TITLE.business ?? m.title),
      };
    }

    const profilers = { ...m.profilers, [event.step]: event.state };
    const nextTitle = rowsActive ? m.title : pickActiveTitle(profilers, m.title);
    return { ...m, profilers, title: nextTitle };
  });
}

function pickActiveTitle(
  profilers: Partial<Record<string, "started" | "done" | "failed">>,
  fallback: string,
): string {
  for (const step of PROFILER_PRIORITY) {
    if (profilers[step] === "started") {
      return PROFILER_TITLE[step] ?? fallback;
    }
  }
  // Nothing in flight — keep the last title (or the connecting fallback).
  return fallback;
}

// ---------------------------------------------------------------------------
// Live-audit row animation
// ---------------------------------------------------------------------------

async function runScanSequence(
  liveId: string,
  products: Product[],
  mode: "estimate" | "accurate",
  update: (id: string, patch: (m: ChatMessage) => ChatMessage) => void,
) {
  const ordered = CATEGORY_ORDER.map((cat) => products.find((p) => p.id === cat)).filter(
    (p): p is Product => Boolean(p),
  );

  for (let i = 0; i < ordered.length; i++) {
    const product = ordered[i];

    update(liveId, (m) =>
      m.kind === "live_audit"
        ? {
            ...m,
            rows: m.rows.map((row) =>
              row.category === product.id
                ? {
                    ...row,
                    state: "active",
                    activeCaption: product.vendors[0]
                      ? `checking ${product.vendors[0].name}…`
                      : "checking…",
                  }
                : row,
            ),
            title:
              m.mode === "accurate"
                ? "Cross-checking vendor billing"
                : "Sizing recoverable spend",
          }
        : m,
    );
    await wait(mode === "accurate" ? ACCURATE_PER_ROW_MS / 2 : ROW_ENTER_MS);

    if (product.vendors[1]) {
      update(liveId, (m) =>
        m.kind === "live_audit"
          ? {
              ...m,
              rows: m.rows.map((row) =>
                row.category === product.id
                  ? { ...row, activeCaption: `checking ${product.vendors[1].name}…` }
                  : row,
              ),
            }
          : m,
      );
      await wait(mode === "accurate" ? ACCURATE_PER_ROW_MS / 2 : ROW_VENDOR_MS);
    }

    update(liveId, (m) => {
      if (m.kind !== "live_audit") return m;
      const vendorText = product.vendors.map((v) => v.name).join(", ") || "—";
      const newTotal = m.total + (product.wasteTotal || 0);
      return {
        ...m,
        rows: m.rows.map((row) =>
          row.category === product.id
            ? {
                ...row,
                state: "done",
                vendorText,
                activeCaption: "",
                amount: product.wasteTotal || 0,
              }
            : row,
        ),
        total: newTotal,
        progress: (i + 1) / ordered.length,
      };
    });
    await wait(ROW_DONE_HOLD_MS);
  }

  update(liveId, (m) =>
    m.kind === "live_audit"
      ? {
          ...m,
          rows: m.rows.map((row) =>
            row.state === "pending" || row.state === "queued"
              ? { ...row, state: "done", vendorText: "—", amount: 0 }
              : row,
          ),
          completed: true,
          title: m.mode === "accurate" ? "Accurate audit complete" : "Audit complete",
          progress: 1,
        }
      : m,
  );
  await wait(FINAL_HOLD_MS);
}

function finiteOr(n: number): number {
  return Number.isFinite(n) ? n : 1e15;
}
