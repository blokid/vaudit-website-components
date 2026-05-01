import { useMemo, useState } from "react";
import clsx from "clsx";
import type { AccurateRangesMessage, SpendRange } from "./types";
import {
  IconAd,
  IconArrowLeft,
  IconCheck,
  IconLock,
  IconSpinner,
  IconToken,
  IconVendor,
} from "./icons";
import { rangeKeysForSelection, SPEND_RANGE_PRESETS } from "./recalc";
import { AgentSection } from "./chat-message";

type RangeKey = "ad" | "ai" | "vendor";

const ALL_ROWS: { key: RangeKey; label: string; Icon: typeof IconAd }[] = [
  { key: "ad", label: "Ad spend / yr", Icon: IconAd },
  { key: "ai", label: "AI / API spend / yr", Icon: IconToken },
  { key: "vendor", label: "Vendor spend / yr", Icon: IconVendor },
];

type Props = {
  message: AccurateRangesMessage;
  onSubmit: (ranges: Partial<Record<RangeKey, SpendRange>>) => void;
  onBack: () => void;
};

export default function AccurateRanges({ message, onSubmit, onBack }: Props) {
  const [picked, setPicked] = useState<Partial<Record<RangeKey, SpendRange>>>(
    message.ranges || {},
  );
  const [customDraft, setCustomDraft] = useState<Record<RangeKey, string>>({
    ad: "",
    ai: "",
    vendor: "",
  });
  const [customOpen, setCustomOpen] = useState<Record<RangeKey, boolean>>({
    ad: false,
    ai: false,
    vendor: false,
  });

  // Only ask about the categories the visitor opted into via the picker.
  const askedKeys = useMemo(() => rangeKeysForSelection(message.selection), [message.selection]);
  const rows = useMemo(() => ALL_ROWS.filter((r) => askedKeys.includes(r.key)), [askedKeys]);

  const allPicked = askedKeys.every((k) => Boolean(picked[k]));
  const locked = message.completed;
  const busy = message.busy;

  function pick(key: RangeKey, range: SpendRange) {
    if (locked) return;
    setPicked((prev) => ({ ...prev, [key]: range }));
    setCustomOpen((prev) => ({ ...prev, [key]: false }));
  }

  function openCustom(key: RangeKey) {
    if (locked) return;
    setCustomOpen((prev) => ({ ...prev, [key]: true }));
  }

  function commitCustom(key: RangeKey) {
    const raw = customDraft[key].trim();
    const parsed = parseCustomAnnual(raw);
    if (parsed == null) return;
    pick(key, {
      min: parsed,
      max: parsed,
      label: formatCustomLabel(parsed),
      custom: true,
    });
  }

  function handleRun() {
    if (!allPicked || locked || busy) return;
    const out: Partial<Record<RangeKey, SpendRange>> = {};
    for (const k of askedKeys) {
      const v = picked[k];
      if (v) out[k] = v;
    }
    onSubmit(out);
  }

  return (
    <AgentSection
      text={
        <>
          Pick the range that matches your <strong>actual annual spend</strong>. A rough
          range gets us within <strong>±5%</strong> — no exact figure needed.
        </>
      }
    >
      <div className="rc-pa-ranges">
        {rows.map((row) => {
          const presets = SPEND_RANGE_PRESETS[row.key];
          const value = picked[row.key];
          const isCustomOpen = customOpen[row.key];
          return (
            <div className="rc-pa-ranges__row" key={row.key}>
              <span className="rc-pa-ranges__label">
                <row.Icon className="rc-pa-ranges__icon" />
                {row.label}
              </span>
              <div className="rc-pa-ranges__chips">
                {presets.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    className={clsx(
                      "rc-pa-chip",
                      value && !value.custom && value.label === r.label && "is-selected",
                    )}
                    onClick={() => pick(row.key, r)}
                    disabled={locked}
                  >
                    {r.label}
                  </button>
                ))}
                {!isCustomOpen ? (
                  <button
                    type="button"
                    className={clsx("rc-pa-chip", value?.custom && "is-selected")}
                    onClick={() => openCustom(row.key)}
                    disabled={locked}
                  >
                    {value?.custom ? value.label : "Custom"}
                  </button>
                ) : (
                  <input
                    type="text"
                    className="rc-pa-chip-custom-input"
                    placeholder="$2.5M"
                    value={customDraft[row.key]}
                    onChange={(e) =>
                      setCustomDraft((prev) => ({ ...prev, [row.key]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        commitCustom(row.key);
                      } else if (e.key === "Escape") {
                        setCustomOpen((prev) => ({ ...prev, [row.key]: false }));
                      }
                    }}
                    onBlur={() => commitCustom(row.key)}
                    autoFocus
                  />
                )}
              </div>
            </div>
          );
        })}

        <div className="rc-pa-ranges__footer">
          <div className="rc-pa-ranges__buttons">
            <button
              type="button"
              className="rc-pa-btn rc-pa-btn--ghost"
              onClick={onBack}
              disabled={locked || busy}
            >
              <IconArrowLeft />
              <span>Back</span>
            </button>
            <button
              type="button"
              className={clsx("rc-pa-btn rc-pa-btn--primary", busy && "is-busy")}
              onClick={handleRun}
              disabled={!allPicked || locked || busy}
            >
              {busy ? <IconSpinner /> : <IconCheck />}
              <span>{busy ? "Calculating…" : "Run accurate audit"}</span>
            </button>
          </div>
        </div>

        <span className="rc-pa-ranges__note">
          <IconLock /> Your numbers stay in your browser. Nothing is saved or shared.
        </span>
      </div>
    </AgentSection>
  );
}

/**
 * Parse free-form custom-spend strings: "$2.5M", "1,500,000", "750k".
 * Returns annual USD or null on parse failure.
 */
function parseCustomAnnual(raw: string): number | null {
  if (!raw) return null;
  const s = raw.replace(/[\s$,]/g, "").toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)([km]?)$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (m[2] === "k") return Math.round(n * 1_000);
  if (m[2] === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
}

function formatCustomLabel(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    return `$${Math.round(n / 1_000)}k`;
  }
  return `$${n}`;
}
