import type { ComponentType } from "react";

export type ComponentMeta<P = unknown> = {
  /** Description shown in the playground sidebar. */
  description?: string;
  /** Named prop presets for the playground variant picker. */
  variants?: Record<string, P>;
};

export type ComponentEntry<P = unknown> = {
  Component: ComponentType<P>;
  meta?: ComponentMeta<P>;
};

type ComponentModule = {
  default: ComponentType<unknown>;
  meta?: ComponentMeta<unknown>;
};

const modules = import.meta.glob<ComponentModule>("./components/*/index.tsx", {
  eager: true,
});

function nameFromPath(path: string): string {
  const match = path.match(/components\/([^/]+)\/index\.tsx$/);
  if (!match) throw new Error(`Unexpected component path: ${path}`);
  return match[1];
}

export const registry: Record<string, ComponentEntry> = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => {
    const name = nameFromPath(path);
    if (!mod.default) {
      throw new Error(`Component "${name}" must have a default export`);
    }
    return [name, { Component: mod.default, meta: mod.meta }];
  }),
);

export const componentNames: string[] = Object.keys(registry).sort();
