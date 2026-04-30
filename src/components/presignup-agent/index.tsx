import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import type { AgentPhase, Product, ScanItem, StepName } from "./types";
import { KNOWN_KEYS, PRODUCT_SPECS, specForKey } from "./products";
import {
  buildRunPayload,
  consumeSSE,
  ensureSession,
  extractAuditProducts,
  getAgentBaseUrl,
  getSessionId,
  getToken,
  idToKey,
  isValidDomain,
  normalizeDomain,
  streamAgent,
  USD,
} from "./agent-api";
import ResultCard from "./result-card";
import TotalBanner from "./total-banner";
import ProductCards from "../product-cards";
import "./presignup-agent.css";

const PRODUCT_OVERVIEW_OVERRIDES = {
  ad: {
    description:
      "Verifies ad platform billing to identify invalid charges, missed credits, and recoverable spend across Google, Meta, DSPs, and programmatic platforms.",
  },
  pay: {
    title: "Vendor ID",
    description:
      "Verifies vendor billing across SaaS, cloud, payments, shipping, and operational spend to uncover hidden discrepancies, missed credits, and contract leakage.",
  },
  token: {
    description:
      "Verifies AI usage billing across LLM platforms to identify duplicate charges, pricing mismatches, unused spend, and inefficient token costs.",
  },
} as const;

type PresignupAgentProps = {
  /** Override the agent base URL — defaults to staging on non-vaudit.com origins. */
  agentBaseUrl?: string;
};

export const meta: ComponentMeta<PresignupAgentProps> = {
  description:
    "Live audit input + scan reveal. Hits the Vaudit onboarding-agent SSE endpoint.",
  props: {
    agentBaseUrl: {
      type: "string",
      description:
        "Override the agent base URL. When omitted, uses prod on vaudit.com origins and staging elsewhere.",
      default: "auto-detect",
    },
  },
  variants: {
    "default (auto-detect prod/staging)": {},
    "force staging": { agentBaseUrl: "https://onboarding-agent.staging.vaudit.com" },
  },
};

const TITLE_STEP_MS = 650;
const PER_VENDOR_MS = 300;
const PER_VENDOR_NEXT_MS = 280;
const POST_MODULE_MS = 180;
const POST_FINAL_MS = 350;
const TOTALING_MS = 500;

const TEMPLATES: { domain: string; label: string; iconPath: React.ReactNode }[] = [
  {
    domain: "stripe.com",
    label: "B2B SaaS",
    iconPath: (
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    ),
  },
  {
    domain: "sportforlife.co.th",
    label: "D2C E-commerce",
    iconPath: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
  },
  {
    domain: "plaid.com",
    label: "Enterprise Fintech",
    iconPath: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </>
    ),
  },
];

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildScanItems(products: Product[]): ScanItem[] {
  const returnedKeys = products.map((p) => idToKey(p.id));
  const items: ScanItem[] = products.map((p) => ({
    key: idToKey(p.id),
    matched: true,
    status: "pending",
    vendorText: "pending",
    amount: 0,
    vendors: p.vendors,
  }));
  for (const k of KNOWN_KEYS) {
    if (returnedKeys.includes(k)) continue;
    items.push({
      key: k,
      matched: false,
      status: "pending",
      vendorText: "n/a",
      amount: 0,
      vendors: [],
    });
  }
  return items;
}

export default function PresignupAgent({ agentBaseUrl }: PresignupAgentProps) {
  const [phase, setPhase] = useState<AgentPhase>({ kind: "idle" });
  const [statusText, setStatusText] = useState<{ text: string; dot: boolean } | null>(null);
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTitle, setScanTitle] = useState("");
  const [revealedProducts, setRevealedProducts] = useState<Product[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [refreshSpinning, setRefreshSpinning] = useState(false);
  const [domainInput, setDomainInput] = useState("");

  const abortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef(false);

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

  const handleSubmit = useCallback(async () => {
    const domain = normalizeDomain(domainInput);
    if (!isValidDomain(domain)) {
      setPhase({ kind: "error", message: "Enter a valid domain, like sportforlife.co.th." });
      return;
    }

    cancelActive();
    cancelledRef.current = false;
    setRevealedProducts([]);
    setScanItems([]);
    setScanProgress(0);
    setScanTitle("");
    setStatusText(null);

    const controller = new AbortController();
    abortRef.current = controller;
    const baseUrl = getAgentBaseUrl(agentBaseUrl);
    const sessionId = getSessionId();

    let accumulatedText = "";
    let sizingTimer: number | null = null;

    try {
      setPhase({ kind: "running", step: "finding" });
      setStatusText({ text: "Authenticating…", dot: true });
      let token = await getToken(baseUrl, controller.signal);
      if (cancelledRef.current) return;

      setStatusText({ text: "Creating session…", dot: true });
      await ensureSession(baseUrl, sessionId, token, controller.signal);
      if (cancelledRef.current) return;

      // Tokens are single-use — fetch a fresh one for run_sse.
      token = await getToken(baseUrl, controller.signal);
      if (cancelledRef.current) return;

      setStatusText(null);
      const stream = await streamAgent(
        baseUrl,
        buildRunPayload(domain, sessionId),
        token,
        controller.signal,
      );

      await consumeSSE(stream, (event) => {
        if (!event?.content?.parts) return;
        for (const part of event.content.parts) {
          if (!part) continue;
          if (part.functionResponse) {
            setPhase({ kind: "running", step: "sizing" });
            if (sizingTimer != null) window.clearTimeout(sizingTimer);
            sizingTimer = window.setTimeout(() => {
              setPhase({ kind: "running", step: "auditing" });
            }, 1500);
          }
          if (typeof part.text === "string") {
            if (event.partial === true) {
              setPhase({ kind: "running", step: "auditing" });
            }
            accumulatedText += part.text;
          }
        }
      });

      if (cancelledRef.current) return;

      const products = extractAuditProducts(accumulatedText);
      if (!products?.length) {
        throw new Error("Agent did not return any audit products.");
      }

      setPhase({ kind: "running", step: "auditing" });
      await runScanSequence(products);
      if (cancelledRef.current) return;

      setPhase({ kind: "complete", products });
    } catch (err) {
      if ((err as Error)?.name === "AbortError" || cancelledRef.current) return;
      setPhase({
        kind: "error",
        message: (err as Error)?.message || "Something went wrong. Please try again.",
      });
    } finally {
      if (sizingTimer != null) window.clearTimeout(sizingTimer);
      abortRef.current = null;
    }
  }, [agentBaseUrl, domainInput, cancelActive]);

  // The scan-list animation. Drives state imperatively so each row visibly
  // moves through pending → active → done at the documented intervals.
  const runScanSequence = useCallback(async (products: Product[]) => {
    const items = buildScanItems(products);
    setScanItems(items);

    setScanTitle("Finding your vendors");
    await wait(TITLE_STEP_MS);
    if (cancelledRef.current) return;
    setScanTitle("Sizing your business");
    await wait(TITLE_STEP_MS);
    if (cancelledRef.current) return;
    setScanTitle("Running the audit");

    const animated = items.filter((it) => it.matched);

    for (let i = 0; i < animated.length; i++) {
      if (cancelledRef.current) return;
      const it = animated[i];
      const idx = items.indexOf(it);
      // active
      setScanItems((prev) => {
        const next = prev.slice();
        next[idx] = { ...next[idx], status: "active" };
        return next;
      });

      const product = products.find((p) => idToKey(p.id) === it.key);
      if (product?.vendors[0]) {
        setScanItems((prev) => {
          const next = prev.slice();
          next[idx] = { ...next[idx], vendorText: `checking ${product.vendors[0].name}…` };
          return next;
        });
        await wait(PER_VENDOR_MS);
        if (cancelledRef.current) return;
      }
      if (product?.vendors[1]) {
        setScanItems((prev) => {
          const next = prev.slice();
          next[idx] = { ...next[idx], vendorText: `checking ${product.vendors[1].name}…` };
          return next;
        });
        await wait(PER_VENDOR_NEXT_MS);
        if (cancelledRef.current) return;
      }

      // done
      setScanItems((prev) => {
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          status: "done",
          vendorText: (product?.vendors || []).map((v) => v.name).join(", ") || "—",
          amount: product?.wasteTotal || 0,
        };
        return next;
      });

      // Reveal the matching card in the grid.
      if (product) {
        setRevealedProducts((prev) =>
          prev.some((p) => idToKey(p.id) === it.key) ? prev : [...prev, product],
        );
      }

      const pct = ((i + 1) / Math.max(1, animated.length)) * 100;
      setScanProgress(pct);
      await wait(POST_MODULE_MS);
    }

    if (cancelledRef.current) return;
    setScanTitle("Totaling your recoverable");
    await wait(TOTALING_MS);
    if (cancelledRef.current) return;
    setScanTitle("Audit complete");
    await wait(POST_FINAL_MS);
  }, []);

  function pickTemplate(domain: string) {
    setActiveTemplate(domain);
    setDomainInput(domain);
  }

  function shuffleTemplate() {
    const pool = TEMPLATES.filter((t) => t.domain !== activeTemplate);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? TEMPLATES[0];
    setActiveTemplate(pick.domain);
    setDomainInput(pick.domain);
    setRefreshSpinning(true);
    window.setTimeout(() => setRefreshSpinning(false), 300);
  }

  const isLoading = phase.kind === "running" || phase.kind === "scanning";
  const showSteps = phase.kind === "running";
  const currentStep: StepName | null = phase.kind === "running" ? phase.step : null;
  const showScanPanel = scanTitle !== "" || scanItems.length > 0;
  const isComplete = phase.kind === "complete";
  const isError = phase.kind === "error";

  // Section gets `.scanning` class while scan-list is animating to mirror legacy CSS hooks.
  const sectionScanning = scanItems.length > 0 && !isComplete;

  return (
    <section className="presignup-agent-section">
      <div
        className={clsx("presignup-agent-container sim", sectionScanning && "scanning")}
        id="presignup-agent-root"
      >
        <h2 className="sim-title">Connect. Audit. Get Money Back</h2>
        <p className="sim-sub">
          See what Vaudit would recover for your business in under 10 seconds.
        </p>

        <div
          className="sim-input-row"
          data-state={isLoading ? "loading" : ""}
        >
          <div className="sim-input-top">
            <span className="caret-i" aria-hidden="true">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </span>
            <textarea
              rows={3}
              placeholder="Enter your website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isLoading}
            />
          </div>

          <div className="sim-input-bottom">
            <button
              type="button"
              className="sim-run"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              Audit My Vendors
              <kbd className="sim-kbd" aria-hidden="true">↵</kbd>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 15, height: 15 }}
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>
          </div>

          {showScanPanel && (
            <div className="scan-panel" aria-live="polite">
              <div className="scan-header">
                <div className="scan-title-wrap">
                  <span className="scan-eyebrow">Live Audit</span>
                  <div className="scan-title">
                    {scanTitle}
                    <span className="scan-caret" />
                  </div>
                </div>
              </div>
              <div className="scan-list">
                {scanItems.map((item) => {
                  const spec = specForKey(item.key);
                  return (
                    <div
                      key={item.key}
                      className={clsx("scan-item", item.status)}
                      data-key={item.key}
                    >
                      <span className="scan-status" />
                      <span className="scan-item-name">
                        <span className="emoji">{spec.emoji}</span>
                        {spec.name}
                      </span>
                      <span className="scan-item-vendor">{item.vendorText}</span>
                      <span className="scan-item-amount">
                        {item.matched && item.status === "done"
                          ? USD.format(item.amount)
                          : item.matched
                            ? "$0"
                            : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="scan-progress">
                <div className="scan-progress-fill" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="presignup-agent-steps" hidden={!showSteps}>
          {(["finding", "sizing", "auditing"] as StepName[]).map((step) => {
            const order = ["finding", "sizing", "auditing"];
            const idx = currentStep ? order.indexOf(currentStep) : -1;
            const pos = order.indexOf(step);
            return (
              <span key={step} style={{ display: "contents" }}>
                <div
                  className={clsx(
                    "presignup-agent-step",
                    pos < idx && "is-done",
                    pos === idx && "is-active",
                  )}
                  data-step={step}
                >
                  <span className="presignup-agent-step-dot" />
                  <span className="presignup-agent-step-label">
                    {step === "finding"
                      ? "Finding your vendors"
                      : step === "sizing"
                        ? "Sizing your business"
                        : "Running the audit"}
                  </span>
                </div>
                {step !== "auditing" && (
                  <span className="presignup-agent-step-sep" aria-hidden="true">›</span>
                )}
              </span>
            );
          })}
        </div>

        <div className="template-row">
          {TEMPLATES.map((t) => (
            <button
              key={t.domain}
              className={clsx("template", activeTemplate === t.domain && "active")}
              type="button"
              onClick={() => pickTemplate(t.domain)}
            >
              <svg
                className="t-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {t.iconPath}
              </svg>
              <span>{t.label}</span>
            </button>
          ))}
          <button
            className={clsx("template-refresh", refreshSpinning && "spin")}
            type="button"
            aria-label="Shuffle template"
            onClick={shuffleTemplate}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 0 0-15-6.7L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7" />
              <path d="M21 21v-5h-5" />
            </svg>
          </button>
        </div>

        <div className="presignup-agent-status" aria-live="polite">
          {statusText && (
            <>
              {statusText.dot && (
                <span className="presignup-agent-status-dot" aria-hidden="true" />
              )}
              {statusText.text}
            </>
          )}
          {isError && phase.kind === "error" && (
            <div className="presignup-agent-error" role="alert">
              <span>{phase.message}</span>
              <button
                type="button"
                className="presignup-agent-error-retry"
                onClick={() => {
                  setPhase({ kind: "idle" });
                }}
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <div className="presignup-agent-product-overview">
          <ProductCards
            order={["ad", "pay", "token"]}
            overrides={PRODUCT_OVERVIEW_OVERRIDES}
          />
        </div>

        <div className="presignup-agent-results" aria-live="polite">
          {revealedProducts.map((p) => (
            <ResultCard key={idToKey(p.id)} product={p} />
          ))}
          {isComplete && phase.kind === "complete" && (
            <TotalBanner products={phase.products} agentBaseUrl={agentBaseUrl} />
          )}
        </div>
      </div>
    </section>
  );
}

// Stop the linter from flagging unused PRODUCT_SPECS — it's re-exported from
// the file for future consumers; intentionally referenced here so tree-shaking
// doesn't drop it from the bundle.
void PRODUCT_SPECS;
