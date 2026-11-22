import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  css: {
    // The site uses plain CSS with no PostCSS plugins. Providing an inline
    // (empty) PostCSS config stops Vite from searching parent folders and
    // picking up an unrelated postcss.config.* (e.g. a Tailwind config).
    postcss: { plugins: [] },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 4321,
    strictPort: false,
  },
});
