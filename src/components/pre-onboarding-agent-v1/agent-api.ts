import type { Product, Vendor } from "./types";

const STAGING_BASE = "https://onboarding-agent.staging.vaudit.com";
const PROD_BASE = "https://onboarding-agent.vaudit.com";

const TOKEN_ENDPOINT = "/presignup/token";
const SESSION_ENDPOINT = "/apps/presignup_agent/users/anonymous/sessions/";
const RUN_SSE_ENDPOINT = "/run_sse";
const AUDIT_REPORT_ENDPOINT = "/presignup/audit-report/";

const APP_NAME = "presignup_agent";
const USER_ID = "anonymous";
const SESSION_KEY = "vaudit-presignup-session";

export function getAgentBaseUrl(override?: string): string {
  if (override) return override;
  try {
    const host = window.location.hostname;
    if (host === "vaudit.com" || host === "www.vaudit.com") {
      return PROD_BASE;
    }
  } catch (_) {
    /* SSR / non-browser — use staging */
  }
  return STAGING_BASE;
}

export function getSessionId(): string {
  try {
    const cached = localStorage.getItem(SESSION_KEY);
    if (cached) return cached;
    const next =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "sess-" + Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch (_) {
    return "sess-" + Math.random().toString(36).slice(2) + Date.now();
  }
}

export function normalizeDomain(raw: string): string {
  if (!raw) return "";
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/^www\./, "");
  s = s.split("/")[0];
  s = s.replace(/\s+/g, "");
  return s;
}

export function isValidDomain(d: string): boolean {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(d);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getToken(baseUrl: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(baseUrl + TOKEN_ENDPOINT, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status}`);
  const data = await res.json();
  const token = data?.token || data?.access_token;
  if (!token) throw new Error("Token response missing token field");
  return token;
}

export async function ensureSession(
  baseUrl: string,
  sessionId: string,
  token: string,
  signal?: AbortSignal,
): Promise<string> {
  const url = baseUrl + SESSION_ENDPOINT + encodeURIComponent(sessionId);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Presignup-Token": token,
    },
    signal,
  });
  if (!res.ok && res.status !== 409) {
    throw new Error(`Session create failed: ${res.status}`);
  }
  return sessionId;
}

export async function streamAgent(
  baseUrl: string,
  body: Record<string, unknown>,
  token: string,
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["X-Presignup-Token"] = token;
  const res = await fetch(baseUrl + RUN_SSE_ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Agent request failed: ${res.status}`);
  return res.body;
}

export type SsePart = {
  text?: string;
  functionResponse?: unknown;
  functionCall?: unknown;
};

export type SseEvent = {
  partial?: boolean;
  content?: { parts?: SsePart[]; role?: string };
};

export async function consumeSSE(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: SseEvent) => void,
): Promise<void> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line || !line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (!data || data === "[DONE]") continue;
        try {
          onEvent(JSON.parse(data));
        } catch (_) {
          /* malformed SSE payload — skip */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Parse the `:::audit_products{...}\n:::` widget block from accumulated text. */
export function extractAuditProducts(text: string): Product[] | null {
  if (!text) return null;
  const m = text.match(/:::audit_products(\{[\s\S]*?\})\s*\n:::/);
  if (!m) return null;
  let parsed: { products?: unknown };
  try {
    parsed = JSON.parse(m[1]);
  } catch (_) {
    return null;
  }
  const raw = Array.isArray(parsed.products) ? parsed.products : [];
  const out: Product[] = [];
  for (const item of raw as Array<Record<string, unknown>>) {
    if (!item || typeof item.id !== "string") continue;
    const vendorsRaw = Array.isArray(item.vendors) ? item.vendors : [];
    const vendors: Vendor[] = [];
    for (const v of vendorsRaw as Array<Record<string, unknown>>) {
      if (!v || typeof v.name !== "string" || !v.name) continue;
      vendors.push({
        name: v.name,
        estSpend: Number(v.est_spend || 0),
        waste: Number(v.waste || 0),
      });
    }
    out.push({
      id: item.id,
      wasteTotal: Number(item.waste_total || 0),
      vendors,
    });
  }
  return out.length ? out : null;
}

export async function downloadAuditReport(
  baseUrl: string,
  sessionId: string,
  email: string,
): Promise<{ blob: Blob; filename: string }> {
  const token = await getToken(baseUrl);
  const res = await fetch(
    baseUrl + AUDIT_REPORT_ENDPOINT + encodeURIComponent(sessionId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Presignup-Token": token,
      },
      body: JSON.stringify({ email: email.trim() }),
    },
  );
  if (!res.ok) throw new Error(`Audit report request failed: ${res.status}`);

  let filename = "vaudit-audit-report.pdf";
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) {
    const m = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^";\r\n]+)/i);
    if (m && m[1]) {
      try {
        filename = decodeURIComponent(m[1].trim().replace(/^["']|["']$/g, ""));
      } catch (_) {
        filename = m[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  }

  const blob = await res.blob();
  return { blob, filename };
}

export function buildRunPayload(domain: string, sessionId: string) {
  return {
    appName: APP_NAME,
    userId: USER_ID,
    sessionId,
    newMessage: { role: "user", parts: [{ text: domain }] },
    streaming: true,
  };
}

export function idToKey(id: string): string {
  return String(id || "").trim().toLowerCase().replace(/_id$/i, "");
}

export const VENDOR_ICONS: Record<string, string> = {
  "google ads":       "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965ab121368400dc44f_google-ads.svg",
  "meta ads":         "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965d6f564a86b177302_meta-ads.svg",
  "tiktok ads":       "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a965a560d2adf0a6e474_tiktok-ads.svg",
  "applovin ads":     "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg",
  "applovin":         "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9651ab5a69f0c7e99c1_applovin-ads.svg",
  "aws":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a986401a04fdfb516c2f_aws.svg",
  "google cloud":     "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg",
  "gcp":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98614c119b6d0b24519_gcp.svg",
  "fedex":            "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a37f220d58951c852a_fedex.svg",
  "ups":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a3e807d12509c3513b_ups.svg",
  "dhl":              "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a3d59d49c6bf3d32dd_dhl.svg",
  "usps":             "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9a350def4cbca4a92eb_usps.svg",
  "stripe":           "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98d555377a44d02f6f1_stripe.svg",
  "adyen":            "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98df379ab43b9e1f8fc_adyen.svg",
  "shopify":          "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a98de0d6b803860417b8_shopify.svg",
  "salesforce":       "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8aa1be867fd9d7a66f538_salesforce.svg",
  "google workspace": "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a997ae02448a9e62d5c0_google-workspace.svg",
  "openai":           "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac553a539363414ad2_openai.svg",
  "anthropic":        "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8a9ac046b54c24d008aed_anthropic.svg",
  "gemini":           "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8abaccd7cfdce2d3ae140_gemini-color.svg",
  "google gemini":    "https://cdn.prod.website-files.com/67e174863b0c93ae0a0cffee/69e8abaccd7cfdce2d3ae140_gemini-color.svg",
};

export function vendorIcon(name: string): string | undefined {
  return VENDOR_ICONS[String(name || "").toLowerCase().trim()];
}

export const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
