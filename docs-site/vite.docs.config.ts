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
  // The site is a GitHub Pages PROJECT page served at
  // https://composa-ui.github.io/react-ui/ , so assets resolve under /react-ui/.
  // import.meta.env.BASE_URL is this value, which the "View in Storybook" links
  // use to reach the sibling Storybook build at /react-ui/storybook/.
  base: "/react-ui/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(repoRoot, "src") },
  },
  build: {
    outDir: path.resolve(repoRoot, "docs-site/dist"),
    emptyOutDir: true,
  },
});
