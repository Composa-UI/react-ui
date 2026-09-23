// Assembles the single GitHub Pages output directory.
//
// `npm run docs` runs, in order:
//   1. docs:app        → vite build → docs-site/dist  (docs app at the site root)
//   2. build-storybook → storybook build → storybook-static  (base-relative)
//   3. this script     → copy storybook-static → docs-site/dist/storybook
//
// The result served under the /react-ui/ Pages prefix:
//   /react-ui/            → the docs app
//   /react-ui/storybook/  → Storybook
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, "..");

const src = path.join(repoRoot, "storybook-static");
const dest = path.join(repoRoot, "docs-site/dist/storybook");

if (!fs.existsSync(src)) {
  console.error(`[assemble-storybook] missing ${src} — did "storybook build" run?`);
  process.exit(1);
}
if (!fs.existsSync(path.join(repoRoot, "docs-site/dist"))) {
  console.error(`[assemble-storybook] missing docs-site/dist — did "docs:app" run?`);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });

console.log(`[assemble-storybook] copied Storybook → ${path.relative(repoRoot, dest)}/`);
