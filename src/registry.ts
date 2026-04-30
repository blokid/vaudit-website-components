import type { ComponentType } from "react";
import Hello from "./components/hello";

export const registry: Record<string, ComponentType<Record<string, unknown>>> = {
  hello: Hello as ComponentType<Record<string, unknown>>,
};
