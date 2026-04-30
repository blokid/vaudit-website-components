import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const reactPlugin = react({
  babel: {
    plugins: [["babel-plugin-react-compiler", { target: "19" }]],
  },
});

export default defineConfig(({ mode }) => {
  if (mode === "playground") {
    return {
      root: fileURLToPath(new URL("./playground", import.meta.url)),
      plugins: [reactPlugin],
      server: { port: 5180, open: true },
      resolve: {
        alias: {
          "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
          "@registry": fileURLToPath(new URL("./src/registry.ts", import.meta.url)),
        },
      },
    };
  }

  return {
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    plugins: [reactPlugin],
    build: {
      target: "es2020",
      cssCodeSplit: false,
      lib: {
        entry: "src/main.tsx",
        name: "VauditComponents",
        formats: ["iife"],
        fileName: () => "vaudit.js",
      },
      rollupOptions: {
        output: {
          assetFileNames: (asset) => {
            if (asset.names?.some((n) => n.endsWith(".css"))) return "vaudit.css";
            return "[name][extname]";
          },
          inlineDynamicImports: true,
        },
      },
    },
  };
});
