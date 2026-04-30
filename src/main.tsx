import { createElement, useLayoutEffect, useRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { registry } from "./registry";

function readProps(node: HTMLElement): Record<string, unknown> {
  const raw = node.dataset.prop;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    console.warn("[vaudit-components] data-prop must be a JSON object on", node);
    return {};
  } catch (err) {
    console.warn("[vaudit-components] invalid JSON in data-prop on", node, err);
    return {};
  }
}

// First-batch tracking for `html.rc-ready`. -1 = not started, -2 = already fired.
let firstBatchPending = -1;

function markReadyIfDone(): void {
  if (firstBatchPending === 0) {
    document.documentElement.classList.add("rc-ready");
    firstBatchPending = -2;
  }
}

function MountSignal({ node, children }: { node: HTMLElement; children: ReactNode }) {
  const fired = useRef(false);
  useLayoutEffect(() => {
    if (fired.current) return;
    fired.current = true;
    node.setAttribute("data-rc-mounted", "true");
    if (firstBatchPending > 0) {
      firstBatchPending -= 1;
      markReadyIfDone();
    }
  }, [node]);
  return children as React.ReactElement;
}

function mountAll(): void {
  const isFirstBatch = firstBatchPending === -1;
  if (isFirstBatch) firstBatchPending = 0;

  const nodes = document.querySelectorAll<HTMLElement>("[data-rc]");
  nodes.forEach((node) => {
    if (node.dataset.rcMounted === "true") return;
    const name = node.dataset.rc;
    if (!name) return;
    const entry = registry[name];
    if (!entry) {
      console.warn(`[vaudit-components] unknown component: ${name}`);
      return;
    }
    if (isFirstBatch) firstBatchPending += 1;
    const root = createRoot(node);
    root.render(
      createElement(MountSignal, {
        node,
        children: createElement(entry.Component, readProps(node)),
      }),
    );
  });

  if (isFirstBatch) markReadyIfDone();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAll);
} else {
  mountAll();
}

declare global {
  interface Window {
    VauditComponents?: { mount: () => void };
  }
}
window.VauditComponents = { mount: mountAll };
