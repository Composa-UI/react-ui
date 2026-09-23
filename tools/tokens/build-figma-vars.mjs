// Generate a Figma Variables import from the single token source
// (tokens/composa.tokens.json), so the Figma side is generated from the same
// source of truth as the CSS — not hand-maintained. Zero-dependency:
// `node tools/tokens/build-figma-vars.mjs`.
//
// Output: tokens/figma-variables.json. Collections map to Figma variable
// collections; COLOR values are per-mode CSS strings (hex/rgba) or { alias }
// references; FLOAT values are numbers (px). A small importer (or a use_figma
// script) applies it to the Figma library.
import { readFile, writeFile } from "node:fs/promises";

const SRC = new URL("../../tokens/composa.tokens.json", import.meta.url);
const OUT = new URL("../../tokens/figma-variables.json", import.meta.url);

const doc = JSON.parse(await readFile(SRC, "utf8"));
const t = doc.tokens;

// Figma name: first group-dash becomes a slash (bg-secondary -> bg/secondary).
const figmaName = (key) => key.replace(/^([a-z0-9]+)-/, "$1/");
// CSS custom-property name for codeSyntax.WEB.
const cssVar = (group, key) => `var(--${group}-${key})`;

// A --color-* value may alias another token: `var(--color-border-selected)`.
function colorValue(raw) {
  const alias = raw.match(/^var\(--color-([\w-]+)\)$/);
  return alias ? { alias: figmaName(alias[1]) } : raw;
}

const scopeForColor = (key) =>
  key === "bg" || key.startsWith("bg-") ? ["FRAME_FILL", "SHAPE_FILL"]
  : key === "text" || key.startsWith("text-") ? ["TEXT_FILL"]
  : key === "icon" || key.startsWith("icon-") ? ["SHAPE_FILL", "FRAME_FILL"]
  : key === "border" || key.startsWith("border-") || key === "focus-ring" ? ["STROKE_COLOR"]
  : ["FRAME_FILL", "SHAPE_FILL", "STROKE_COLOR", "TEXT_FILL"];

const px = (v) => Number(String(v).replace("px", "")) || 0;

const collections = {
  Color: { modes: ["Light", "Dark"], variables: {} },
  Radius: { modes: ["Value"], variables: {} },
  Spacing: { modes: ["Value"], variables: {} },
};

for (const [key, entry] of Object.entries(t.color ?? {})) {
  collections.Color.variables[figmaName(key)] = {
    type: "COLOR",
    scopes: scopeForColor(key),
    codeSyntax: { WEB: cssVar("color", key) },
    values: { Light: colorValue(entry.value), Dark: colorValue(entry.dark ?? entry.value) },
  };
}
for (const [key, entry] of Object.entries(t.radius ?? {})) {
  collections.Radius.variables[`radius/${key}`] = {
    type: "FLOAT",
    scopes: ["CORNER_RADIUS"],
    codeSyntax: { WEB: cssVar("radius", key) },
    values: { Value: px(entry.value) },
  };
}
for (const [key, entry] of Object.entries(t.spacer ?? {})) {
  collections.Spacing.variables[`spacing/${key}`] = {
    type: "FLOAT",
    scopes: ["GAP"],
    codeSyntax: { WEB: cssVar("spacer", key) },
    values: { Value: px(entry.value) },
  };
}

const out = {
  $meta: {
    source: "tokens/composa.tokens.json",
    note: "Figma Variables import generated from the single token source. COLOR values are per-mode CSS strings or { alias } references; FLOAT values are px numbers. Regenerate with `node tools/tokens/build-figma-vars.mjs`.",
  },
  collections,
};

await writeFile(OUT, JSON.stringify(out, null, 2) + "\n");
const n = Object.fromEntries(Object.entries(collections).map(([c, v]) => [c, Object.keys(v.variables).length]));
console.log("wrote tokens/figma-variables.json —", JSON.stringify(n));
