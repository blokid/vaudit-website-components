import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { registry } from "./registry";

type MountedNode = HTMLElement & { __rcRoot?: Root };

function readProps(node: HTMLElement): Record<string, unknown> {
  const raw = node.dataset.prop;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    console.warn(`[vaudit-components] data-prop must be a JSON object on`, node);
    return {};
  } catch (err) {
    console.warn(`[vaudit-components] invalid JSON in data-prop on`, node, err);
    return {};
  }
}

function mountAll(): void {
  const nodes = document.querySelectorAll<MountedNode>("[data-rc]");
  nodes.forEach((node) => {
    if (node.dataset.rcMounted === "true") return;
    const name = node.dataset.rc;
    if (!name) return;
    const Component = registry[name];
    if (!Component) {
      console.warn(`[vaudit-components] unknown component: ${name}`);
      return;
    }
    node.dataset.rcMounted = "true";
    const root = createRoot(node);
    node.__rcRoot = root;
    root.render(createElement(Component, readProps(node)));
  });
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
