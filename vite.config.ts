import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { target: "19" }],
        ],
      },
    }),
  ],
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
});
