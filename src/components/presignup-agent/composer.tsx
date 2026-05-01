import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  IconAd,
  IconChevronDown,
  IconSend,
  IconShieldCheck,
  IconToken,
  IconVendor,
} from "./icons";

export type AuditScope = "all" | "ad_id" | "vendor_id" | "token_id";

const SCOPE_OPTIONS: { id: AuditScope; label: string; Icon: typeof IconAd }[] = [
  { id: "all", label: "Audit all", Icon: IconShieldCheck },
  { id: "ad_id", label: "Ad ID", Icon: IconAd },
  { id: "vendor_id", label: "Vendor ID", Icon: IconVendor },
  { id: "token_id", label: "Token ID", Icon: IconToken },
];

type ComposerProps = {
  /** True when the composer is the only thing on screen (initial empty state). */
  empty: boolean;
  value: string;
  onChange: (next: string) => void;
  onSubmit: () => void;
  placeholder: string;
  /** Disables the send button while a turn is in flight. */
  busy: boolean;
  /** Selected audit scope (only meaningful in the empty state). */
  scope?: AuditScope;
  onScopeChange?: (next: AuditScope) => void;
};

export default function Composer({
  empty,
  value,
  onChange,
  onSubmit,
  placeholder,
  busy,
  scope = "all",
  onScopeChange,
}: ComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea up to a few rows so paste-of-stack lists doesn't clip.
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

      {empty ? (
        <div className="rc-pa-composer__row">
          <ScopeDropdown scope={scope} onChange={onScopeChange ?? (() => {})} />
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
      ) : (
        <button
          type="button"
          className="rc-pa-composer__send"
          aria-label="Send"
          disabled={!canSend}
          onClick={() => canSend && onSubmit()}
        >
          <IconSend />
        </button>
      )}
    </div>
  );
}

function ScopeDropdown({
  scope,
  onChange,
}: {
  scope: AuditScope;
  onChange: (next: AuditScope) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close when the visitor clicks outside the dropdown.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selected = SCOPE_OPTIONS.find((o) => o.id === scope) ?? SCOPE_OPTIONS[0];
  const SelectedIcon = selected.Icon;

  return (
    <div className={clsx("rc-pa-scope", open && "is-open")} ref={wrapRef}>
      <button
        type="button"
        className="rc-pa-scope__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="rc-pa-scope__icon">
          <SelectedIcon />
        </span>
        <span className="rc-pa-scope__label">{selected.label}</span>
        <IconChevronDown className={clsx("rc-pa-scope__chev", open && "is-open")} />
      </button>
      {open && (
        <ul className="rc-pa-scope__menu" role="listbox">
          {SCOPE_OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const active = opt.id === scope;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  className={clsx("rc-pa-scope__item", active && "is-selected")}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                >
                  <span className="rc-pa-scope__icon">
                    <Icon />
                  </span>
                  <span className="rc-pa-scope__item-label">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
