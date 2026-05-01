import { useEffect, useRef } from "react";
import clsx from "clsx";
import { IconSend } from "./icons";

type ComposerProps = {
  /** True when the composer is the only thing on screen (initial empty state). */
  empty: boolean;
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  placeholder: string;
  /** Disables the send button while a turn is in flight. */
  busy: boolean;
};

export default function Composer({ empty, value, onChange, onSubmit, placeholder, busy }: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to 6 rows so paste-of-stack lists doesn't clip.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !busy) onSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !busy;

  return (
    <div className={clsx("rc-pa-composer", empty && "is-empty")}>
      <textarea
        ref={ref}
        className="rc-pa-composer__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
      <button
        type="button"
        className="rc-pa-composer__send"
        aria-label="Send"
        disabled={!canSend}
        onClick={() => canSend && onSubmit()}
      >
        <IconSend />
      </button>
    </div>
  );
}
