import { useState } from "react";
import type { Product } from "./types";
import { downloadAuditReport, EMAIL_RE, getAgentBaseUrl, getSessionId, USD } from "./agent-api";

type TotalBannerProps = {
  products: Product[];
  agentBaseUrl?: string;
};

export default function TotalBanner({ products, agentBaseUrl }: TotalBannerProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = products.reduce((acc, p) => acc + Number(p.wasteTotal || 0), 0);
  const valid = EMAIL_RE.test(email.trim());

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getAgentBaseUrl(agentBaseUrl);
      const sessionId = getSessionId();
      const { blob, filename } = await downloadAuditReport(baseUrl, sessionId, email.trim());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("[pre-onboarding-agent-v1] audit report failed:", err);
      setError(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rc-poav1-total" role="group">
      <div className="rc-poav1-total-stack">
        <span className="rc-poav1-total-label">Total Recoverable</span>
        <span className="rc-poav1-total-value">{USD.format(total)}</span>
      </div>
      <form className="rc-poav1-total-form" onSubmit={onSubmit} noValidate>
        <svg
          className="rc-poav1-total-form-icon"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <input
          type="email"
          className="rc-poav1-total-email"
          required
          placeholder="you@company.com"
          aria-label="Email for report"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          type="submit"
          className={"rc-poav1-total-cta" + (loading ? " is-loading" : "")}
          disabled={!valid || loading}
          aria-busy={loading || undefined}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
          <span>{loading ? "Preparing…" : "Download Report"}</span>
        </button>
      </form>
      {error && (
        <div className="rc-poav1-total-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
