// Shared types for the presignup-agent chat UI.
//
// The component is structured as a chat thread inside a single bordered card.
// Every entry in the thread is a ChatMessage; the union below describes the
// kinds of entries we render (plain text, the user's pill bubble, the live
// audit card, the expanded results grid, the CTA cards, the phase-2 widgets).

export type CategoryId = "ad_id" | "token_id" | "vendor_id";

export type Vendor = {
  name: string;
  estSpend: number;
  waste: number;
};

export type Product = {
  /** Backend category id, e.g. "ad_id" / "token_id" / "vendor_id". */
  id: string;
  wasteTotal: number;
  vendors: Vendor[];
};

/** A locked-in spend range chosen by the visitor in phase 2. */
export type SpendRange = {
  /** Inclusive lower bound in USD per year. */
  min: number;
  /** Exclusive upper bound in USD per year. `Infinity` for the open "$X+" chip. */
  max: number;
  /** Display label, e.g. "$5M – $25M" or "$25M+". */
  label: string;
  /** True when the visitor entered a custom value. */
  custom?: boolean;
};

export type AccurateRanges = {
  ad: SpendRange;
  ai: SpendRange;
  vendor: SpendRange;
};

/** Selection from the phase-2 product picker widget. */
export type AccurateSelection = "ad_id" | "token_id" | "vendor_id" | "all";

/** Per-row state in the live-audit card. */
export type AuditRowState = "pending" | "active" | "done" | "queued";

export type AuditRow = {
  category: CategoryId;
  state: AuditRowState;
  /** Vendor list joined with ", " when done. Empty until known. */
  vendorText: string;
  /** Caption shown in active state, e.g. "checking OpenAI…". Empty otherwise. */
  activeCaption: string;
  /** Dollar amount when done. Zero until then. */
  amount: number;
};

/** Eyebrow + title shown above the rows in the live-audit card. */
export type LiveAuditMode = "estimate" | "accurate";

// ---------------------------------------------------------------------------
// Chat thread
// ---------------------------------------------------------------------------

type Base = { id: string };

export type AgentTextMessage = Base & {
  kind: "agent_text";
  text: string;
  /** Optional eyebrow rendered above the bubble (small caps, orange dot). */
  eyebrow?: string;
};

export type UserTextMessage = Base & {
  kind: "user_text";
  /** Plain text. Newlines render as line breaks in the bubble. */
  text: string;
};

export type LiveAuditMessage = Base & {
  kind: "live_audit";
  mode: LiveAuditMode;
  /** "vaudit.com" — shown in the scanning/audited pill. */
  domain: string;
  /** "Sizing recoverable spend" / "Cross-checking vendor billing" / etc. */
  title: string;
  /** Currently-running orange total (animated up). */
  total: number;
  /** 0..1 — drives the progress bar. */
  progress: number;
  rows: AuditRow[];
  /** True once all rows are done. */
  completed: boolean;
};

export type ResultsGridMessage = Base & {
  kind: "results_grid";
  mode: LiveAuditMode;
  domain: string;
  products: Product[];
};

export type EstimateCtaMessage = Base & {
  kind: "estimate_cta";
  total: number;
  categoryCount: number;
  /** While true, the lock-in button shows the calculating spinner. */
  busy: boolean;
};

export type FinalCtaMessage = Base & {
  kind: "final_cta";
  total: number;
};

export type AccuratePickerMessage = Base & {
  kind: "accurate_picker";
  selection: AccurateSelection | null;
  /** True once the visitor confirms their selection. */
  completed: boolean;
};

export type AccurateRangesMessage = Base & {
  kind: "accurate_ranges";
  /** Which categories the form should ask about — derived from the picker. */
  selection: AccurateSelection;
  ranges: Partial<AccurateRanges>;
  busy: boolean;
  completed: boolean;
};

export type ErrorMessage = Base & {
  kind: "error";
  text: string;
  retry: boolean;
};

export type ChatMessage =
  | AgentTextMessage
  | UserTextMessage
  | LiveAuditMessage
  | ResultsGridMessage
  | EstimateCtaMessage
  | FinalCtaMessage
  | AccuratePickerMessage
  | AccurateRangesMessage
  | ErrorMessage;

// ---------------------------------------------------------------------------
// Phase-2 widget marker contract (agent-driven via SSE text)
// ---------------------------------------------------------------------------
// The agent emits these inline `:::name{json}\n:::` blocks so the client knows
// when to render phase-2 UI. They mirror the existing `audit_products` widget
// pattern. The first widget appears after the visitor clicks "Lock in exact
// numbers"; the second after they pick which products to audit.

export type AccuratePickerWidgetParams = {
  /** Order of options to render in the 2x2 grid. Defaults to all four. */
  options?: AccurateSelection[];
  /** Defaults to "all" — pre-selected with the MOST ACCURATE ribbon. */
  default?: AccurateSelection;
};

export type AccurateRangesWidgetParams = {
  /** Categories whose ranges we ask for. Defaults to all three. */
  ask?: ("ad" | "ai" | "vendor")[];
};
