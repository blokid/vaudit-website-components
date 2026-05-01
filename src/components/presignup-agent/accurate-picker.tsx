import { useState } from "react";
import clsx from "clsx";
import type { AccuratePickerMessage, AccurateSelection } from "./types";
import { IconAd, IconLock, IconToken, IconVendor } from "./icons";
import { AgentSection } from "./chat-message";

const OPTIONS: {
  id: AccurateSelection;
  name: string;
  desc: string;
  Icon: typeof IconAd;
  ribbon?: string;
}[] = [
  { id: "ad_id", name: "Ad ID", desc: "Google, Meta, TikTok ad spend", Icon: IconAd },
  { id: "token_id", name: "Token ID", desc: "OpenAI, Anthropic AI spend", Icon: IconToken },
  { id: "vendor_id", name: "Vendor ID", desc: "Cloud, payments, shipping, SaaS", Icon: IconVendor },
  {
    id: "all",
    name: "All three",
    desc: "Full audit · ~90 seconds",
    Icon: IconAd,
    ribbon: "Most accurate",
  },
];

type Props = {
  message: AccuratePickerMessage;
  /** Called when the visitor confirms a selection. */
  onConfirm: (selection: AccurateSelection) => void;
};

export default function AccuratePicker({ message, onConfirm }: Props) {
  const [draft, setDraft] = useState<AccurateSelection>(message.selection ?? "all");
  const locked = message.completed;

  function handlePick(id: AccurateSelection) {
    if (locked) return;
    setDraft(id);
    // Single-click confirm — same UX as the legacy widget protocol elsewhere.
    onConfirm(id);
  }

  return (
    <AgentSection
      text={
        <>
          Which products should I audit precisely? I'll ask one quick question per
          product, then run a real-spend recalculation.
        </>
      }
    >
      <div className="rc-pa-picker">
        <div className="rc-pa-picker__grid">
          {OPTIONS.map((opt) => {
            const selected = (locked ? message.selection : draft) === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                className={clsx("rc-pa-picker__option", selected && "is-selected")}
                onClick={() => handlePick(opt.id)}
                disabled={locked}
                aria-pressed={selected}
              >
                {opt.ribbon ? <span className="rc-pa-picker__ribbon">{opt.ribbon}</span> : null}
                <span className="rc-pa-picker__option-icon">
                  <opt.Icon />
                </span>
                <span className="rc-pa-picker__option-body">
                  <span className="rc-pa-picker__option-name">{opt.name}</span>
                  <span className="rc-pa-picker__option-desc">{opt.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
        <span className="rc-pa-picker__footnote">
          <IconLock /> Spend ranges only — no exact figures, no integrations needed.
        </span>
      </div>
    </AgentSection>
  );
}
