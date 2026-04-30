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
import "./presignup-agent.css";

type PresignupAgentProps = {
  /** Override the agent base URL — defaults to staging on non-vaudit.com origins. */
  agentBaseUrl?: string;
};

export const meta: ComponentMeta<PresignupAgentProps> = {
  description:
    "Live audit input + scan reveal. Hits the Vaudit onboarding-agent SSE endpoint.",
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

function PlatformDisplay() {
  return (
    <div
      className="platform-display"
      role="img"
      aria-label="Supported ad platforms: Google Ads, Meta Ads, TikTok Ads, AppLovin"
    >
      <div className="platform-display-title">
        <strong>Start with ads.</strong> <span>Expand to every bill.</span>
      </div>
      <div className="platform-row">
        <PlatformCard variant="google" name="Google Ads" />
        <PlatformCard variant="meta" name="Meta Ads" />
        <PlatformCard variant="tiktok" name="TikTok Ads" />
        <PlatformCard variant="applovin" name="AppLovin" />
      </div>
    </div>
  );
}

function PlatformCard({ variant, name }: { variant: string; name: string }) {
  return (
    <div className="platform-card">
      <span className={`platform-icon platform-icon--${variant}`} aria-hidden="true">
        {variant === "google" && (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.51213 16.47L8.90274 3.81738C9.84152 4.37008 14.5754 6.9899 15.34 7.48817L7.94934 20.1415C7.14108 21.2093 0.488127 18.0904 1.51213 16.4693V16.47Z" fill="#FBBC04" />
            <path d="M22.7463 16.4697L15.3557 3.81791C14.3225 2.09843 12.0972 1.47356 10.2695 2.48913C8.44176 3.50469 7.88524 5.69234 8.91846 7.4886L16.3091 20.142C17.3423 21.8607 19.5676 22.4855 21.3953 21.47C23.1432 20.4543 23.7795 18.1891 22.7463 16.4712V16.4697Z" fill="#4285F4" />
            <path d="M4.70991 21.959C6.75884 21.959 8.41983 20.3393 8.41983 18.3412C8.41983 16.3432 6.75884 14.7235 4.70991 14.7235C2.66098 14.7235 1 16.3432 1 18.3412C1 20.3393 2.66098 21.959 4.70991 21.959Z" fill="#34A853" />
          </svg>
        )}
        {variant === "meta" && (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.16023 13.7606C4.16023 14.5243 4.32789 15.1106 4.54695 15.4653C4.83422 15.9299 5.26258 16.1267 5.69938 16.1267C6.26273 16.1267 6.77813 15.9869 7.77125 14.6133C8.56695 13.5123 9.50453 11.9669 10.1353 10.998L11.2037 9.35664C11.9458 8.21672 12.8047 6.94953 13.7896 6.09055C14.5934 5.38945 15.4608 5 16.3336 5C17.7991 5 19.1949 5.84922 20.2633 7.44195C21.4324 9.18625 22 11.3834 22 13.6507C22 14.9986 21.7344 15.989 21.2823 16.7715C20.8455 17.5282 19.9941 18.2842 18.5621 18.2842V16.1267C19.7883 16.1267 20.0943 15 20.0943 13.7105C20.0943 11.873 19.6659 9.83375 18.7221 8.37672C18.0523 7.34313 17.1843 6.71164 16.2294 6.71164C15.1966 6.71164 14.3654 7.49055 13.4313 8.87961C12.9348 9.6175 12.4249 10.5168 11.8526 11.5315L11.2224 12.6478C9.95656 14.8922 9.63594 15.4034 9.00305 16.247C7.89367 17.7244 6.94648 18.2842 5.69938 18.2842C4.22008 18.2842 3.28453 17.6436 2.70523 16.6783C2.23227 15.8916 2 14.8595 2 13.6834L4.16023 13.7606Z" fill="#0081FB" />
          </svg>
        )}
        {variant === "tiktok" && (
          <svg fill="#ffffff" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
          </svg>
        )}
        {variant === "applovin" && (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
            <path
              fill="#fff"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M23.9858 3.14392C20.9544 3.14392 18.4969 5.60137 18.4969 8.63279C18.4969 9.84493 18.8899 10.9653 19.5553 11.8735L19.4945 11.981L7.53539 33.5074C6.90296 33.2531 6.21226 33.1132 5.48887 33.1132C2.45745 33.1132 0 35.5706 0 38.602C0 41.6335 2.45745 44.0909 5.48887 44.0909C8.52029 44.0909 10.9777 41.6335 10.9777 38.602C10.9777 37.3266 10.5427 36.1528 9.81295 35.2208C14.5096 34.1184 19.3262 33.6069 24.1509 33.6986C28.8699 33.6513 33.5772 34.1687 38.1725 35.2395C37.4515 36.1684 37.0223 37.3351 37.0223 38.602C37.0223 41.6335 39.4797 44.0909 42.5112 44.0909C45.5426 44.0909 48 41.6335 48 38.602C48 35.5706 45.5426 33.1132 42.5112 33.1132C41.7593 33.1132 41.0427 33.2643 40.3901 33.538L28.4139 11.9627L28.3864 11.914C29.07 10.9987 29.4747 9.86301 29.4747 8.63279C29.4747 7.17705 28.8964 5.78094 27.867 4.75157C26.8377 3.72221 25.4416 3.14392 23.9858 3.14392ZM26.5954 13.4628C25.8193 13.8831 24.9304 14.1217 23.9858 14.1217C23.0247 14.1217 22.1213 13.8746 21.3356 13.4406L21.3333 13.4447L10.6483 32.6557C15.0882 31.7325 19.6166 31.3029 24.1509 31.375C28.5569 31.3413 32.9542 31.7736 37.2693 32.6649L26.5954 13.4628ZM27.2243 8.63279C27.2243 9.94262 26.4352 11.1235 25.2251 11.6247C24.015 12.126 22.6221 11.8489 21.6959 10.9227C20.7697 9.99653 20.4926 8.60362 20.9939 7.3935C21.4951 6.18338 22.676 5.39436 23.9858 5.39436C25.7723 5.39938 27.2192 6.84634 27.2243 8.63279ZM5.47674 41.8222C7.26288 41.8289 8.71721 40.3882 8.72731 38.602L8.70901 38.5837C8.70904 36.8023 7.27026 35.3554 5.48887 35.3453C3.70272 35.3453 2.25384 36.7915 2.25049 38.5777C2.24715 40.3638 3.69061 41.8154 5.47674 41.8222Z"
            />
          </svg>
        )}
      </span>
      <span className="platform-name">{name}</span>
    </div>
  );
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

        <PlatformDisplay />

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
