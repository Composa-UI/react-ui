/// <reference types="vite/client" />
// Vite config for the design-system docs site (the "Storybook" half).
// Builds docs-site/app -> docs-site/dist, the directory the Pages workflow uploads.
//   npm run docs   ->   vite build --config docs-site/vite.docs.config.ts
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const repoRoot = path.resolve(__dirname, "..");

export default defineConfig({
  // The app (index.html + main.tsx) lives here; annotations/tokens/src are read
  // via relative imports that climb back to the repo root.
  root: path.resolve(__dirname, "app"),
  // Relative asset URLs so the site works from a GitHub Pages project subpath.
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(repoRoot, "src") },
  },
  build: {
    outDir: path.resolve(repoRoot, "docs-site/dist"),
    emptyOutDir: true,
  },
});
