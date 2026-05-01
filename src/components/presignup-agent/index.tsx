import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentMeta } from "../../registry";
import {
  buildRunPayload,
  consumeSSE,
  downloadAuditReport,
  EMAIL_RE,
  ensureSession,
  extractAuditProducts,
  getAgentBaseUrl,
  getSessionId,
  getToken,
  isValidDomain,
  mergeStreamText,
  normalizeDomain,
  postAccurateBreakdown,
  resetSession,
  streamAgent,
} from "./agent-api";
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
const TITLE_TICK_MS = 650;
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
};

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
  },
  variants: {
    "default (auto-detect)": {},
    "force local": { agentBaseUrl: "http://localhost:3000" },
    "force staging": { agentBaseUrl: "https://onboarding-agent.staging.vaudit.com" },
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

const SELECTION_LABEL: Record<AccurateSelection, string> = {
  ad_id: "Ad ID",
  token_id: "Token ID",
  vendor_id: "Vendor ID",
  all: "all three products",
};

export default function PresignupAgent({ agentBaseUrl }: PresignupAgentProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [composerValue, setComposerValue] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);
  const phase1ProductsRef = useRef<Product[] | null>(null);
  const domainRef = useRef<string>("");
  const phase2SelectionRef = useRef<AccurateSelection | null>(null);

  const isEmpty = messages.length === 0;

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
        title: "Finding your vendors",
        total: 0,
        progress: 0,
        rows: blankRows(),
        completed: false,
      });

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
          buildRunPayload(domain, sessionId),
          token,
          controller.signal,
        );

        const ticker = startTitleTicker(liveId, update);

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
        ticker.stop();

        if (cancelledRef.current) return;

        const products = extractAuditProducts(accumulated);
        if (!products?.length) {
          throw new Error("Agent did not return any audit products.");
        }
        phase1ProductsRef.current = products;

        await runScanSequence(liveId, products, "estimate", update);
        if (cancelledRef.current) return;

        const total = products.reduce((acc, p) => acc + (p.wasteTotal || 0), 0);
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
        if (abortRef.current === controller) abortRef.current = null;
        setBusy(false);
      }
    },
    [agentBaseUrl, append, cancelActive, update],
  );

  // ------------------------------------------------------------------------
  // Phase 2 — client-driven (picker → ranges → recalc → persist → grid)
  // ------------------------------------------------------------------------

  const startAccurate = useCallback(() => {
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

      try {
        const baseUrl = getAgentBaseUrl(agentBaseUrl);
        const sessionId = getSessionId();
        const { blob, filename } = await downloadAuditReport(baseUrl, sessionId, trimmed);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const handleAuditAgain = useCallback(() => {
    cancelActive();
    cancelledRef.current = false;
    phase1ProductsRef.current = null;
    phase2SelectionRef.current = null;
    domainRef.current = "";
    setMessages([]);
    setComposerValue("");
    setComposerError(null);
    setBusy(false);
    resetSession();
  }, [cancelActive]);

  const placeholder = useMemo(() => {
    if (isEmpty) {
      return "Enter a website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…";
    }
    return "Ask a follow-up…";
  }, [isEmpty]);

  return (
    <section className="rc-pa-section">
      <div className={`rc-pa-card${isEmpty ? " is-empty" : ""}`}>
        {isEmpty && <span className="rc-pa-card__shimmer" aria-hidden="true" />}
        <div className={`rc-pa-thread${isEmpty ? " is-empty" : ""}`}>
          {messages.map((msg) =>
            renderMessage(msg, {
              onLockIn: startAccurate,
              onPickerConfirm: handlePickerConfirm,
              onRangesBack: handleRangesBack,
              onRangesSubmit: handleRangesSubmit,
              onDownloadReport: handleDownloadReport,
              onAuditAgain: handleAuditAgain,
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
// Live-audit row animation
// ---------------------------------------------------------------------------

function startTitleTicker(
  liveId: string,
  update: (id: string, patch: (m: ChatMessage) => ChatMessage) => void,
) {
  const titles = [
    "Finding your vendors",
    "Sizing recoverable spend",
    "Running the audit",
  ];
  let i = 0;
  const tick = () => {
    update(liveId, (m) =>
      m.kind === "live_audit" ? { ...m, title: titles[i] } : m,
    );
    i = Math.min(i + 1, titles.length - 1);
  };
  tick();
  const handle = window.setInterval(tick, TITLE_TICK_MS);
  return {
    stop() {
      window.clearInterval(handle);
    },
  };
}

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
            title: m.mode === "accurate" ? "Cross-checking vendor billing" : m.title,
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
