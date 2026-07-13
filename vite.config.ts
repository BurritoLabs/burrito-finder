import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "REACT_APP_"],
  plugins: [
    react(),
    nodePolyfills({
      include: [
        "assert",
        "buffer",
        "crypto",
        "http",
        "https",
        "os",
        "process",
        "stream",
        "url",
        "util"
      ],
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true
    }),
    ...(mode === "analyze"
      ? [
          visualizer({
            filename: "build/bundle-report.html",
            gzipSize: true,
            brotliSize: true,
            open: false
          })
        ]
      : [])
  ],
  resolve: {
    alias: {
      vm: fileURLToPath(new URL("./src/shims/vm.ts", import.meta.url))
    }
  },
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2020",
    // terra.js is a legacy CommonJS SDK and ships as one minified module.
    chunkSizeWarningLimit: 2500
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"]
  }
}));
