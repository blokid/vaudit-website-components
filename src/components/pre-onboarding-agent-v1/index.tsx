import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { ComponentMeta } from "../../registry";
import type { AgentPhase, Product, ScanItem } from "./types";
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
import "./pre-onboarding-agent-v1.css";

type PreOnboardingAgentV1Props = {
  /** Override the agent base URL — defaults to staging on non-vaudit.com origins. */
  agentBaseUrl?: string;
  /** Textarea placeholder copy. */
  placeholder?: string;
  /** Submit-button label. */
  ctaLabel?: string;
};

const DEFAULT_PLACEHOLDER =
  "Enter your website (e.g. stripe.com), describe your stack, or paste a list of vendors you want audited…";
const DEFAULT_CTA = "Audit My Vendors";

export const meta: ComponentMeta<PreOnboardingAgentV1Props> = {
  description:
    "Fallback v1 of the pre-onboarding agent — chat input + result cards only (no headers, chips, templates, or product overview).",
  props: {
    agentBaseUrl: {
      type: "string",
      description:
        "Override the agent base URL. When omitted, uses prod on vaudit.com origins and staging elsewhere.",
      default: "auto-detect",
    },
    placeholder: {
      type: "string",
      description: "Textarea placeholder copy.",
      default: "see source",
    },
    ctaLabel: {
      type: "string",
      description: "Submit-button label.",
      default: `"${DEFAULT_CTA}"`,
    },
  },
  variants: {
    "default (auto-detect prod/staging)": {},
    "force staging": {
      agentBaseUrl: "https://onboarding-agent.staging.vaudit.com",
    },
  },
};

const TITLE_STEP_MS = 650;
const PER_VENDOR_MS = 300;
const PER_VENDOR_NEXT_MS = 280;
const POST_MODULE_MS = 180;
const POST_FINAL_MS = 350;
const TOTALING_MS = 500;

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

export default function PreOnboardingAgentV1({
  agentBaseUrl,
  placeholder = DEFAULT_PLACEHOLDER,
  ctaLabel = DEFAULT_CTA,
}: PreOnboardingAgentV1Props) {
  const [phase, setPhase] = useState<AgentPhase>({ kind: "idle" });
  const [scanItems, setScanItems] = useState<ScanItem[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanTitle, setScanTitle] = useState("");
  const [revealedProducts, setRevealedProducts] = useState<Product[]>([]);
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
      setScanItems((prev) => {
        const next = prev.slice();
        next[idx] = { ...next[idx], status: "active" };
        return next;
      });

      const product = products.find((p) => idToKey(p.id) === it.key);
      if (product?.vendors[0]) {
        setScanItems((prev) => {
          const next = prev.slice();
          next[idx] = {
            ...next[idx],
            vendorText: `checking ${product.vendors[0].name}…`,
          };
          return next;
        });
        await wait(PER_VENDOR_MS);
        if (cancelledRef.current) return;
      }
      if (product?.vendors[1]) {
        setScanItems((prev) => {
          const next = prev.slice();
          next[idx] = {
            ...next[idx],
            vendorText: `checking ${product.vendors[1].name}…`,
          };
          return next;
        });
        await wait(PER_VENDOR_NEXT_MS);
        if (cancelledRef.current) return;
      }

      setScanItems((prev) => {
        const next = prev.slice();
        next[idx] = {
          ...next[idx],
          status: "done",
          vendorText:
            (product?.vendors || []).map((v) => v.name).join(", ") || "—",
          amount: product?.wasteTotal || 0,
        };
        return next;
      });

      if (product) {
        setRevealedProducts((prev) =>
          prev.some((p) => idToKey(p.id) === it.key)
            ? prev
            : [...prev, product],
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

  const handleSubmit = useCallback(async () => {
    const domain = normalizeDomain(domainInput);
    if (!isValidDomain(domain)) {
      setPhase({
        kind: "error",
        message: "Enter a valid domain, like sportforlife.co.th.",
      });
      return;
    }

    cancelActive();
    cancelledRef.current = false;
    setRevealedProducts([]);
    setScanItems([]);
    setScanProgress(0);
    setScanTitle("");

    const controller = new AbortController();
    abortRef.current = controller;
    const baseUrl = getAgentBaseUrl(agentBaseUrl);
    const sessionId = getSessionId();

    let accumulatedText = "";
    let sizingTimer: number | null = null;

    try {
      setPhase({ kind: "running", step: "finding" });
      let token = await getToken(baseUrl, controller.signal);
      if (cancelledRef.current) return;

      await ensureSession(baseUrl, sessionId, token, controller.signal);
      if (cancelledRef.current) return;

      // Tokens are single-use — fetch a fresh one for run_sse.
      token = await getToken(baseUrl, controller.signal);
      if (cancelledRef.current) return;

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
        message:
          (err as Error)?.message || "Something went wrong. Please try again.",
      });
    } finally {
      if (sizingTimer != null) window.clearTimeout(sizingTimer);
      abortRef.current = null;
    }
  }, [agentBaseUrl, domainInput, cancelActive, runScanSequence]);

  const isLoading = phase.kind === "running" || phase.kind === "scanning";
  const showScanPanel = scanTitle !== "" || scanItems.length > 0;
  const isComplete = phase.kind === "complete";
  const isError = phase.kind === "error";

  // Section gets `.is-scanning` modifier while scan-list is animating.
  const sectionScanning = scanItems.length > 0 && !isComplete;

  return (
    <section className="rc-poav1-section">
      <div
        className={clsx("rc-poav1-shell", sectionScanning && "is-scanning")}
      >
        <div
          className="rc-poav1-input-row"
          data-state={isLoading ? "loading" : ""}
        >
          <div className="rc-poav1-input-top">
            <span className="rc-poav1-caret" aria-hidden="true">
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
              placeholder={placeholder}
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

          <div className="rc-poav1-input-bottom">
            <button
              type="button"
              className="rc-poav1-run"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {ctaLabel}
              <kbd className="rc-poav1-kbd" aria-hidden="true">
                ↵
              </kbd>
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
            <div className="rc-poav1-scan-panel" aria-live="polite">
              <div className="rc-poav1-scan-header">
                <div className="rc-poav1-scan-title-wrap">
                  <span className="rc-poav1-scan-eyebrow">Live Audit</span>
                  <div className="rc-poav1-scan-title">
                    {scanTitle}
                    <span className="rc-poav1-scan-caret" />
                  </div>
                </div>
              </div>
              <div className="rc-poav1-scan-list">
                {scanItems.map((item) => {
                  const spec = specForKey(item.key);
                  return (
                    <div
                      key={item.key}
                      className={clsx("rc-poav1-scan-item", `is-${item.status}`)}
                      data-key={item.key}
                    >
                      <span className="rc-poav1-scan-status" />
                      <span className="rc-poav1-scan-item-name">
                        <span className="rc-poav1-emoji">{spec.emoji}</span>
                        {spec.name}
                      </span>
                      <span className="rc-poav1-scan-item-vendor">
                        {item.vendorText}
                      </span>
                      <span className="rc-poav1-scan-item-amount">
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
              <div className="rc-poav1-scan-progress">
                <div
                  className="rc-poav1-scan-progress-fill"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {isError && phase.kind === "error" && (
          <div className="rc-poav1-status" aria-live="polite">
            <div className="rc-poav1-error" role="alert">
              <span>{phase.message}</span>
              <button
                type="button"
                className="rc-poav1-error-retry"
                onClick={() => {
                  setPhase({ kind: "idle" });
                }}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        <div className="rc-poav1-results" aria-live="polite">
          {revealedProducts.map((p) => (
            <ResultCard key={idToKey(p.id)} product={p} />
          ))}
          {isComplete && phase.kind === "complete" && (
            <TotalBanner
              products={phase.products}
              agentBaseUrl={agentBaseUrl}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// Stop the linter from flagging unused PRODUCT_SPECS — it's re-exported from
// products.tsx for future consumers; intentionally referenced here so
// tree-shaking doesn't drop it from the bundle.
void PRODUCT_SPECS;
