import type { StorybookConfig } from "@storybook/react-vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");

// One story per annotated component lives in docs-site/stories/, reusing the
// same live fixtures the docs previews render (docs-site/app/fixtures.tsx), so
// stories and docs share one source of truth.
const config: StorybookConfig = {
  stories: ["../docs-site/stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: { name: "@storybook/react-vite", options: {} },
  core: { disableTelemetry: true },
  async viteFinal(cfg) {
    const { mergeConfig } = await import("vite");
    // The fixtures import the real components via the "@" alias, and the DS
    // styles (imported in preview.tsx) are Tailwind v4 — both must be wired into
    // Storybook's own Vite pipeline. Asset paths stay relative so the static
    // build serves correctly from the /react-ui/storybook/ subpath on Pages.
    return mergeConfig(cfg, {
      plugins: [tailwindcss()],
      resolve: {
        alias: { "@": path.resolve(repoRoot, "src") },
      },
    });
  },
};

export default config;
