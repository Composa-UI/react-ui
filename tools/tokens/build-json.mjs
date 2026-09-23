// One-time bootstrap: derive tokens/composa.tokens.json from the shipped
// composa-tokens.css so the JSON becomes the reviewable single source of truth.
// After this, verify-parity.mjs enforces that the two never drift.
// Zero-dependency: `node tools/tokens/build-json.mjs`.
import { readTokensCss } from "./parse-css.mjs";
import { writeFile, mkdir } from "node:fs/promises";

const CSS = new URL("../../src/styles/composa-tokens.css", import.meta.url);
const OUT = new URL("../../tokens/composa.tokens.json", import.meta.url);
await mkdir(new URL("../../tokens/", import.meta.url), { recursive: true });

const { light, dark } = await readTokensCss(CSS);

const groups = {};
for (const [name, value] of Object.entries(light)) {
  const dash = name.indexOf("-");
  const group = dash === -1 ? name : name.slice(0, dash);
  const key = dash === -1 ? "_" : name.slice(dash + 1);
  (groups[group] ||= {});
  const entry = { value };
  if (name in dark) entry.dark = dark[name];
  groups[group][key] = entry;
}

const tokens = {};
for (const g of Object.keys(groups).sort()) {
  tokens[g] = {};
  for (const k of Object.keys(groups[g]).sort()) tokens[g][k] = groups[g][k];
}

const doc = {
  $meta: {
    source: "src/styles/composa-tokens.css",
    note: "Single source of truth for @composa/ui tokens. --<group>-<key> => tokens[group][key]. `value` is light; `dark` (when present) is the [data-composa-mode=\"dark\"] override. Enforced by tools/tokens/verify-parity.mjs.",
    modes: ["light", "dark"],
  },
  tokens,
};

await writeFile(OUT, JSON.stringify(doc, null, 2) + "\n");
console.log(
  `wrote tokens/composa.tokens.json — ${Object.keys(light).length} light vars, ${Object.keys(dark).length} dark overrides`,
);
