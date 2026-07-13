import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { visualizer } from "rollup-plugin-visualizer";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import svgr from "vite-plugin-svgr";

export default defineConfig(({ mode }) => ({
  envPrefix: ["VITE_", "REACT_APP_"],
  plugins: [
    react(),
    svgr(),
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
  build: {
    outDir: "build",
    emptyOutDir: true,
    sourcemap: false,
    target: "es2020",
    chunkSizeWarningLimit: 900
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"]
  }
}));
