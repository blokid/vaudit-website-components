import type { ReactNode } from "react";
import clsx from "clsx";

export function AgentMessage({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return (
    <div className="rc-pa-msg-agent">
      <div className="rc-pa-avatar" aria-hidden="true">
        V
      </div>
      <div className="rc-pa-msg-agent__body">
        <div className="rc-pa-msg-agent__label">{eyebrow ?? "Vaudit AI"}</div>
        <div className="rc-pa-msg-agent__bubble">{children}</div>
      </div>
    </div>
  );
}

/**
 * Slim agent row used for widget messages (picker / ranges) where the agent
 * speaks above the widget but the widget itself is the primary surface.
 */
export function AgentSection({ text, children }: { text: ReactNode; children: ReactNode }) {
  return (
    <div className="rc-pa-msg-agent">
      <div className="rc-pa-avatar" aria-hidden="true">
        V
      </div>
      <div className="rc-pa-msg-agent__body">
        <div className="rc-pa-msg-agent__label">Vaudit AI</div>
        <div className="rc-pa-msg-agent__bubble">{text}</div>
        {children}
      </div>
    </div>
  );
}

export function UserBubble({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("rc-pa-msg-user", className)}>
      <div className="rc-pa-msg-user__bubble">{children}</div>
    </div>
  );
}
