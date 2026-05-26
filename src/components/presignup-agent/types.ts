// Shared types for the presignup-agent chat UI.
//
// The component is structured as a chat thread inside a single bordered card.
// Every entry in the thread is a ChatMessage; the union below describes the
// kinds of entries we render (plain text, the user's pill bubble, the live
// audit card, the expanded results grid, the CTA cards, the phase-2 widgets).

export type CategoryId = "ad_id" | "token_id" | "vendor_id";

/**
 * Per-provider verification depth for Token ID vendors. Marketing Language
 * Guide v1.0 requires this disclosure when Token ID products are shown:
 * - "full" — full billing reconciliation against usage logs (OpenAI, AWS Bedrock).
 * - "partial" — partial reconciliation, statistical matching with invoice-level
 *   verification (Anthropic).
 * - "statistical" — statistical cost modelling against usage patterns (Google AI).
 * Undefined for non-Token-ID vendors.
 */
export type VerificationDepth = "full" | "partial" | "statistical";

export type Vendor = {
  name: string;
  estSpend: number;
  waste: number;
  verificationDepth?: VerificationDepth;
};

export type Product = {
  /** Backend category id, e.g. "ad_id" / "token_id" / "vendor_id". */
  id: string;
  wasteTotal: number;
  vendors: Vendor[];
  /**
   * Pass 2 reasoning routing key. When present, matches the `pot` field on
   * `{step: "reasoning", pot, state, text}` SSE events from the backend so
   * the "HOW WE GOT HERE" container under this card can pick up the right
   * paragraph. Build Guide §Stage 5.5 Pass 2 / §Stage 7. Optional —
   * widgets emitted before Phase 6 backend ships don't carry it.
   */
  reasoningId?: string;
};

/**
 * Pass 2 per-pot reasoning paragraph + status. Backend SSE pushes
 * started → done/failed transitions; the UI renders a loading shimmer
 * while started, then types the paragraph in once a terminal event
 * arrives. Build Guide §Stage 5.5 Pass 2.
 */
export type ReasoningStatus = "started" | "done" | "failed";

export type ReasoningEntry = {
  status: ReasoningStatus;
  /** The paragraph itself. Present on `done` / `failed`; absent on `started`. */
  text?: string;
};

/**
 * Map of `pot` id → reasoning entry. Both display buckets (ad_id /
 * token_id / vendor_id) and the four vendor_id internal sub-pots
 * (kloud_id / seat_id / ship_id / payment_id) get their own entries —
 * the simple UI renders the bucket-level entry; richer UIs can drill
 * down into the four sub-pots.
 */
export type ReasoningMap = Record<string, ReasoningEntry>;

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
// Profiler progress (estimate phase only)
// ---------------------------------------------------------------------------
//
// While the backend's `save_website_info` tool is running, it publishes
// per-step progress events on a Redis pub/sub channel that the frontend
// subscribes to via `/presignup/progress/{session_id}` (SSE). Two payload
// shapes ride that channel:
//
//   1. {step, state: "started" | "done" | "failed"}
//      — coarse per-profiler ticks. Drives the timeline below.
//
//   2. {step: "business", state: "researching", detail: {...}}
//      — fine-grained timeline of the deep-research run inside the business
//        profiler. `detail.type` is one of the five variants below.

export type ProfilerStep = "dns" | "tech" | "apollo" | "business" | "spend";

export type ProfilerState = "started" | "done" | "failed";

export type ResearchEvent =
  | { type: "narration"; text: string }
  | { type: "search_started"; query: string }
  | { type: "search_results"; results: Array<{ url: string; title: string | null }> }
  | { type: "fetch_started"; url: string }
  | { type: "fetch_completed"; url: string; ok: boolean };

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
  /**
   * Per-profiler ticks observed on the progress SSE. Estimate phase only —
   * empty in accurate mode, where no profilers run. The presence of any
   * "started" entry tells the card to render the timeline view instead of
   * the row-scan view; once any product row goes active, we hide the
   * timeline so the rows can take centre stage.
   */
  profilers: Partial<Record<ProfilerStep, ProfilerState>>;
  /** Streamed deep-research timeline (business profiler only). */
  researchEvents: ResearchEvent[];
};

export type ResultsGridMessage = Base & {
  kind: "results_grid";
  mode: LiveAuditMode;
  domain: string;
  products: Product[];
  /**
   * Pass 2 reasoning paragraphs per pot id. Populated incrementally as
   * the backend's `step: "reasoning"` SSE events arrive. Build Guide
   * §Stage 5.5 Pass 2. Missing keys render an empty "HOW WE GOT HERE"
   * container; `status: "started"` renders a loading shimmer.
   */
  reasoning?: ReasoningMap;
};

export type EstimateCtaMessage = Base & {
  kind: "estimate_cta";
  total: number;
  categoryCount: number;
  /** While true, the lock-in button shows the calculating spinner. */
  busy: boolean;
  /**
   * True once the breakdown has been frozen by the backend (PDF render
   * locked the audit_breakdown row). When set, the "Lock in exact numbers"
   * button is hidden — phase-2 corrections are server-rejected with
   * `LOCKED`, so we shouldn't even offer the path.
   */
  locked?: boolean;
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

/**
 * Holding-company brand-picker prompt. Build Guide §Stage 1 — when the
 * visitor's domain matches a portfolio / parent pattern, the backend
 * skips profiling and asks for a specific operating subsidiary
 * instead. Renders a free-text input + optional chip suggestions; the
 * visitor's selection re-enters the flow with the new domain.
 */
export type HoldingRedirectMessage = Base & {
  kind: "holding_redirect";
  domain: string;
  pattern: string;
  suggestedBrands: string[];
  /** Flips true once the visitor submits a subsidiary — locks the chips. */
  submitted: boolean;
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
  | HoldingRedirectMessage
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
