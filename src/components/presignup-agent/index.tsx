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
  extractSpendForm,
  fetchPersistedBreakdown,
  freshStartSession,
  getAgentBaseUrl,
  getSessionId,
  getToken,
  isValidDomain,
  mergeStreamText,
  normalizeDomain,
  peekSessionId,
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
import FinalCta from "./final-cta";
import AccurateSpends from "./accurate-spends";
import HoldingRedirect from "./holding-redirect";
import { IconRefresh } from "./icons";
import type {
  AuditRow,
  ChatMessage,
  ExactMonthlyByVendor,
  Product,
} from "./types";
import "./presignup-agent.css";

const SIGNUP_URL = "https://app.vaudit.com/v2/sign-up";
const CALL_URL = "https://calendly.com/vaudit-support";

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
   * row-scan and posts the results grid + final CTA directly (the numbers
   * are already computed), skipping the edit-before-recovery flow and never
   * talking to the agent for phase 1. Follow-ups still hit the live agent
   * through the composer.
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

/** Estimate-mode initial title. We open directly on the profiler timeline (the
 *  DNS step shown in-flight) rather than a "Connecting…" placeholder, so the
 *  card lands on real work the instant the domain is submitted. Overridden by
 *  the active profiler step as soon as progress events start arriving. */
const INITIAL_ESTIMATE_TITLE = "Looking up DNS records";

// Categories we always offer in the spend form so the visitor can volunteer
// spend a static scan can't see (client-side ad pixels, undetected AI usage).
// Mirrors the backend `_FORM_DEFAULT_VENDORS` seed; the frontend re-adds them
// defensively because the spend_form widget is LLM-emitted and an LLM tends to
// drop a $0 category. The backend `apply_spend_edits` upserts these on submit,
// so they flow into recovery whether or not the widget included them.
const DEFAULT_SPEND_VENDORS: Record<string, string[]> = {
  ad_id: ["Google Ads", "Meta Ads"],
  token_id: ["OpenAI", "Anthropic"],
};
const SPEND_GROUP_ORDER = ["ad_id", "token_id", "vendor_id"];

/** Ensure AdID + Token ID groups expose every default vendor (seeded $0 when
 *  missing), in canonical order, so the form never silently drops a vendor the
 *  backend will upsert on submit. We merge per-vendor — not per-group — because
 *  the LLM widget may return a group with *some* vendors (e.g. Google Vertex AI,
 *  AWS Bedrock) while omitting the always-on defaults (OpenAI, Anthropic); the
 *  backend `apply_spend_edits` adds those back on submit, so they'd otherwise
 *  show up in the results grid with $0 having never appeared in the form. */
function ensureDefaultSpendGroups(products: Product[]): Product[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const [id, names] of Object.entries(DEFAULT_SPEND_VENDORS)) {
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, {
        id,
        wasteTotal: 0,
        vendors: names.map((name) => ({ name, estSpend: 0, waste: 0 })),
      });
      continue;
    }
    // Prepend any default vendors the widget dropped (seeded $0), matching the
    // results grid which lists the defaults first.
    const present = new Set(existing.vendors.map((v) => v.name.toLowerCase()));
    const missing = names
      .filter((name) => !present.has(name.toLowerCase()))
      .map((name) => ({ name, estSpend: 0, waste: 0 }));
    if (missing.length > 0) {
      byId.set(id, { ...existing, vendors: [...missing, ...existing.vendors] });
    }
  }
  const ordered: Product[] = [];
  for (const id of SPEND_GROUP_ORDER) {
    const p = byId.get(id);
    if (p) { ordered.push(p); byId.delete(id); }
  }
  for (const p of byId.values()) ordered.push(p);
  return ordered;
}

/** Build the backend `overrides` payload from the form's edited monthly spends. */
function toSpendOverrides(
  exact: ExactMonthlyByVendor,
): Record<string, Record<string, { monthly_spend: number }>> {
  const out: Record<string, Record<string, { monthly_spend: number }>> = {};
  for (const [productId, vendors] of Object.entries(exact)) {
    out[productId] = {};
    for (const [name, monthly] of Object.entries(vendors)) {
      out[productId][name] = { monthly_spend: Math.round(monthly) };
    }
  }
  return out;
}

/** One "Ad spend: $X /yr"-style line per edited category, for the user echo. */
function spendEditEcho(exact: ExactMonthlyByVendor): string[] {
  const LABEL: Record<string, string> = {
    ad_id: "Ad spend",
    token_id: "AI / API spend",
    vendor_id: "Vendor spend",
  };
  const lines: string[] = [];
  for (const [productId, vendors] of Object.entries(exact)) {
    const annual = Object.values(vendors).reduce((acc, m) => acc + (m || 0), 0) * 12;
    if (annual <= 0) continue;
    lines.push(`${LABEL[productId] ?? productId}: $${Math.round(annual).toLocaleString("en-US")} /yr`);
  }
  return lines.length ? lines : ["Here are my actual monthly spends."];
}

export default function PresignupAgent({ agentBaseUrl, replay }: PresignupAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [breakdownLocked, setBreakdownLocked] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const phase1ProductsRef = useRef<Product[] | null>(null);
  const domainRef = useRef<string>("");
  const latestTotalRef = useRef<number>(0);
  // Auto-follow the latest content as the audit streams / phase-2 turns land,
  // but only while the visitor is already pinned to the bottom — if they've
  // scrolled up to re-read earlier content, leave their position alone.
  const threadRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const handleThreadScroll = useCallback(() => {
    const el = threadRef.current;
    if (!el) return;
    stickToBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  // Mirror of `messages` for reads inside async callbacks (rehydration)
  // without adding them to effect deps.
  const messagesRef = useRef<ChatMessage[]>([]);

  const isEmpty = messages.length === 0;

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep the thread scrolled to the newest content. `update` replaces the
  // messages array on every streamed token, so this fires throughout a stream.
  useEffect(() => {
    const el = threadRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
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
        // Seed the first profiler as in-flight so the timeline view renders
        // immediately (showTimeline keys off a non-empty profilers map). Real
        // SSE profiler events overwrite this as they arrive.
        profilers: { dns: "started" },
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

        // Turn 1 stops after spend + logic-check: the agent emits a
        // spend_form widget (estimated per-vendor monthly spends, no
        // recovery yet) instead of audit_products. Show the prefilled,
        // editable form; recovery runs on submit (handleSpendsSubmit).
        const parsed = extractSpendForm(accumulated);
        if (!parsed?.length) {
          throw new Error("Agent did not return any estimated spends.");
        }
        // Defensively guarantee the AdID + Token ID groups (seeded $0 if the
        // LLM widget dropped them) so a zero-spend category is never hidden.
        const products = ensureDefaultSpendGroups(parsed);
        phase1ProductsRef.current = products;

        // The live-audit card only made sense for the old estimate→recovery
        // flow (it shows a "recoverable so far" total). In turn 1 there's no
        // recovery yet, so once the spend form is ready we drop the card —
        // it served its purpose as a progress indicator during profiling.
        setMessages((prev) => prev.filter((m) => m.id !== liveId));

        append({
          id: nextId("spends"),
          kind: "accurate_spends",
          products,
          busy: false,
          completed: false,
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

        const total = products.reduce((acc, p) => acc + (p.wasteTotal || 0), 0);
        latestTotalRef.current = total * 12;
        // Replay (Mucker portfolio view) is a pre-computed audit with
        // recoverable amounts already in hand — show the results + final CTA
        // directly, skipping the edit-before-recovery flow.
        append({
          id: nextId("grid"),
          kind: "results_grid",
          mode: "accurate",
          domain,
          products,
        });
        append({ id: nextId("final-cta"), kind: "final_cta", total, domain: domain || "" });
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
        mode: "accurate",
        domain,
        products,
      });
      append({ id: nextId("final-cta"), kind: "final_cta", total, domain: domain || "" });
    })();
  }, [replay, agentBaseUrl, append]);

  // ------------------------------------------------------------------------
  // Phase 2 — client-driven (picker → ranges → recalc → persist → grid)
  // ------------------------------------------------------------------------

  // Turn 2 of phase-1: the visitor submits the prefilled spend form. We send
  // their edited per-vendor monthly spends to the agent as a [SPEND_EDITS]
  // message; the backend applies them and runs recovery on the actual spend,
  // streaming back the audit_products widget with recoverable amounts.
  const handleSpendsSubmit = useCallback(
    async (spendsId: string, exact: ExactMonthlyByVendor) => {
      cancelActive();
      cancelledRef.current = false;
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);

      update(spendsId, (m) =>
        m.kind === "accurate_spends" ? { ...m, busy: true } : m,
      );
      append({
        id: nextId("user"),
        kind: "user_text",
        text: spendEditEcho(exact).join("\n"),
      });

      const liveId = nextId("live-acc");
      append({
        id: liveId,
        kind: "live_audit",
        mode: "accurate",
        domain: domainRef.current,
        title: "Calculating recoverable spend",
        total: 0,
        progress: 0,
        rows: queuedRows(),
        completed: false,
        profilers: {},
        researchEvents: [],
      });

      let closeProgress: () => void = () => {};
      // Honest client-side "working" feedback for the recalc wait (phase 2
      // sends no profiler events). Stopped before the real row-scan, and again
      // in finally to cover the cancel/error paths.
      const stopRecalcProgress = startAccurateRecalcProgress(liveId, update);
      try {
        const baseUrl = getAgentBaseUrl(agentBaseUrl);
        const sessionId = getSessionId();

        let token = await getToken(baseUrl, controller.signal);
        if (cancelledRef.current) return;
        await ensureSession(baseUrl, sessionId, token, controller.signal);
        if (cancelledRef.current) return;
        token = await getToken(baseUrl, controller.signal);
        if (cancelledRef.current) return;

        closeProgress = subscribePresignupProgress(
          baseUrl,
          sessionId,
          (event) => applyProgressEvent(liveId, event, update, setMessages),
        );

        const message = `[SPEND_EDITS]${JSON.stringify(toSpendOverrides(exact))}`;
        const stream = await streamAgent(
          baseUrl,
          buildRunPayload(message, sessionId),
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

        const result = extractAuditProducts(accumulated);
        if (!result?.products.length) {
          throw new Error("We couldn't compute your recoverable amounts. Please try again.");
        }
        const { products } = result;

        update(spendsId, (m) =>
          m.kind === "accurate_spends" ? { ...m, busy: false, completed: true } : m,
        );
        // Real products are in — hand the bar/title off to the row-scan.
        stopRecalcProgress();
        await runScanSequence(liveId, products, "accurate", update);
        if (cancelledRef.current) return;

        const total = products.reduce((acc, p) => acc + (p.wasteTotal || 0), 0);
        latestTotalRef.current = total * 12;
        append({
          id: nextId("grid-acc"),
          kind: "results_grid",
          mode: "accurate",
          domain: domainRef.current,
          products,
        });
        append({ id: nextId("final-cta"), kind: "final_cta", total, domain: domainRef.current });
      } catch (err) {
        if ((err as Error)?.name === "AbortError" || cancelledRef.current) return;
        update(spendsId, (m) =>
          m.kind === "accurate_spends" ? { ...m, busy: false } : m,
        );
        append({
          id: nextId("err"),
          kind: "error",
          text: (err as Error)?.message || "Something went wrong. Please try again.",
          retry: false,
        });
      } finally {
        stopRecalcProgress();
        closeProgress();
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
      }
    },
    [agentBaseUrl, append, cancelActive, update],
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
        // PDF render locks the breakdown server-side so the report can't
        // desync from what the visitor saw.
        const wasLocked = breakdownLocked;
        setBreakdownLocked(true);
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
    [agentBaseUrl, append, breakdownLocked],
  );

  // Clear all client-side audit state back to the empty hero, aborting any
  // in-flight stream. Does NOT touch the session id — callers decide whether
  // to keep it (same-id backend teardown) or rotate it (`resetSession`).
  const resetLocalUiState = useCallback(() => {
    cancelActive();
    cancelledRef.current = false;
    phase1ProductsRef.current = null;
    domainRef.current = "";
    latestTotalRef.current = 0;
    setMessages([]);
    setComposerValue("");
    setComposerError(null);
    setBusy(false);
    setBreakdownLocked(false);
  }, [cancelActive]);

  // Always-visible "Start over": clean restart on the SAME session id. Ask the
  // backend to tear down + recreate the session under the same id (wipes any
  // PDF lock); on failure (trust window lapsed → 401, or network) fall back to
  // rotating the id so the next submit still starts clean. Uses `peekSessionId`
  // so a brand-new visitor with no cached id doesn't mint one just to reset.
  const handleStartOver = useCallback(async () => {
    const sessionId = peekSessionId();
    resetLocalUiState();
    if (!sessionId) return;
    // Gate the composer until the backend teardown+recreate finishes.
    // resetLocalUiState() just set busy=false (reopening the composer), but
    // the fresh-start POST tears down and recreates the ADK session under the
    // same id — a domain submit racing that window starts a /run_sse whose
    // append_event hits a half-deleted session ("Session not found"). Holding
    // busy until freshStartSession resolves means no submit can race it.
    setBusy(true);
    try {
      await freshStartSession(getAgentBaseUrl(agentBaseUrl), sessionId);
    } catch (_) {
      resetSession();
    } finally {
      setBusy(false);
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
        <div
          ref={threadRef}
          onScroll={handleThreadScroll}
          className={`rc-pa-thread${isEmpty ? " is-empty" : ""}`}
        >
          {messages.map((msg) =>
            renderMessage(msg, {
              onSpendsSubmit: handleSpendsSubmit,
              onDownloadReport: handleDownloadReport,
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
      {!isEmpty && (
        <div className="rc-pa-startover-row">
          <button
            type="button"
            className="rc-pa-btn rc-pa-btn--secondary rc-pa-startover"
            onClick={handleStartOver}
            title="Clear this audit and start a new one"
          >
            <IconRefresh aria-hidden="true" />
            Start over
          </button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Render dispatch
// ---------------------------------------------------------------------------

type RenderHandlers = {
  onSpendsSubmit: (spendsId: string, exact: ExactMonthlyByVendor) => void;
  onDownloadReport: (email: string) => Promise<boolean>;
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
    case "final_cta":
      return (
        <FinalCta
          key={msg.id}
          message={msg}
          signupUrl={SIGNUP_URL}
          callUrl={CALL_URL}
          onDownload={(email) => h.onDownloadReport(email)}
        />
      );
    case "accurate_spends":
      return (
        <AccurateSpends
          key={msg.id}
          message={msg}
          onSubmit={(exact) => h.onSpendsSubmit(msg.id, exact)}
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
// Accurate-phase recalc progress (client-side)
// ---------------------------------------------------------------------------
//
// The recalc card has three stages, driven by the backend's `recovery`
// progress event (recorded into `m.profilers.recovery` by applyProgressEvent):
//   0 — before recovery starts: applying the visitor's edited spends
//   1 — recovery "started":     the heavy compute step is running
//   2 — recovery "done"/"failed": finalizing, widget about to stream
// Each stage drives the card title, the per-row caption, and the bar ceiling,
// so the bar advances in step with the real backend work rather than a blind
// timer. A time-based fallback still bumps the stage if the event never
// arrives (older backend / dropped SSE), so the card never sits frozen. No
// fake totals or row completions — once the real products land, the ticker is
// stopped and runScanSequence finishes the bar and fills in the rows.
const ACCURATE_RECALC_STAGES: ReadonlyArray<{ title: string; caption: string; ceiling: number }> = [
  { title: "Applying your spend figures", caption: "applying your figures…", ceiling: 0.55 },
  { title: "Computing recoverable waste", caption: "computing waste…", ceiling: 0.82 },
  { title: "Finalizing your audit", caption: "finalizing…", ceiling: 0.95 },
];

const RECALC_TICK_MS = 800;
// Fallback stage advancement (ms elapsed → stage) when no `recovery` event
// arrives. Real events take precedence via Math.max, so they only ever speed
// the card up, never slow it down.
const RECALC_FALLBACK_PHASE1_MS = 3000;
const RECALC_FALLBACK_PHASE2_MS = 7000;

function startAccurateRecalcProgress(
  liveId: string,
  update: (id: string, patch: (m: ChatMessage) => ChatMessage) => void,
): () => void {
  let progress = 0.08;
  let ticks = 0;
  const apply = () =>
    update(liveId, (m) => {
      if (m.kind !== "live_audit") return m;
      const rec = m.profilers.recovery;
      const eventPhase = rec === "done" || rec === "failed" ? 2 : rec === "started" ? 1 : 0;
      const elapsed = ticks * RECALC_TICK_MS;
      const timePhase =
        elapsed >= RECALC_FALLBACK_PHASE2_MS ? 2 : elapsed >= RECALC_FALLBACK_PHASE1_MS ? 1 : 0;
      const phase = Math.max(eventPhase, timePhase);
      const stage = ACCURATE_RECALC_STAGES[phase];
      // Ease toward the stage ceiling; never regress (runScanSequence finishes
      // the bar after the ticker stops).
      progress = Math.min(stage.ceiling, progress + (stage.ceiling - progress) * 0.4);
      return {
        ...m,
        title: stage.title,
        progress: Math.max(m.progress, progress),
        // Animate every row the real scan hasn't finished yet — "active"
        // gives the status circle its pulse and shows the stage caption.
        rows: m.rows.map((row) =>
          row.state === "done"
            ? row
            : { ...row, state: "active", activeCaption: stage.caption },
        ),
      };
    });
  apply();
  const id: ReturnType<typeof setInterval> = setInterval(() => {
    ticks += 1;
    apply();
  }, RECALC_TICK_MS);
  return () => clearInterval(id);
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
        // Monotonic: the accurate phase pre-fills the bar to ~0.9 via the
        // recalc ticker, so never let a row update drag it backward.
        progress: Math.max(m.progress, (i + 1) / ordered.length),
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

