import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { registry } from "./registry";

type MountedNode = HTMLElement & { __rcRoot?: Root };

function readProps(node: HTMLElement): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(node.dataset)) {
    if (!key.startsWith("rc") || key === "rc" || key === "rcMounted") continue;
    const propName = key.charAt(2).toLowerCase() + key.slice(3);
    props[propName] = coerce(raw);
  }
  return props;
}

function coerce(value: string | undefined): unknown {
  if (value === undefined) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  if (value !== "" && !Number.isNaN(Number(value))) return Number(value);
  return value;
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
