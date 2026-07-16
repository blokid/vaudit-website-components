import { useEffect, useRef } from "react";
import clsx from "clsx";
import { IconCaretRight, IconSend } from "./icons";

type ComposerProps = {
  /** True when the composer is the only thing on screen (initial empty state). */
  empty: boolean;
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  placeholder: string;
  /** Disables the send button while a turn is in flight. */
  busy: boolean;
  /** Inline validation error rendered below the textarea (empty state only). */
  error?: string | null;
};

export default function Composer({
  empty,
  value,
  onChange,
  onSubmit,
  placeholder,
  busy,
  error,
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a few rows so a paste-of-stack list doesn't
  // clip. Starts at one line height; grows only as the user types past it.
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

  if (empty) {
    return (
      <div className="rc-pa-composer is-empty">
        <div className="rc-pa-composer__top">
          <span className="rc-pa-composer__caret" aria-hidden="true">
            <IconCaretRight />
          </span>
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
        </div>
        {error && (
          <p className="rc-pa-composer__error" role="alert">
            {error}
          </p>
        )}
        <div className="rc-pa-composer__row">
          <button
            type="button"
            className="rc-pa-cta-audit"
            onClick={() => canSend && onSubmit()}
            disabled={!canSend}
          >
            <span className="rc-pa-cta-audit__label">Audit my vendors</span>
            <kbd className="rc-pa-cta-audit__kbd" aria-hidden="true">↵</kbd>
            <IconSend className="rc-pa-cta-audit__send" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("rc-pa-composer")}>
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
