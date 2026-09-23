// Generate a Figma Variables import from the single token source
// (tokens/composa.tokens.json), so the Figma side is generated from the same
// source of truth as the CSS — not hand-maintained. Zero-dependency:
// `node tools/tokens/build-figma-vars.mjs`.
//
// Output: tokens/figma-variables.json. Collections map to Figma variable
// collections; COLOR values are per-mode CSS strings (hex/rgba) or { alias }
// references; FLOAT values are numbers (px). A small importer (or a use_figma
// script) applies it to the Figma library.
//
// The generation is a pure function (`buildFigmaVariables`) so the drift-check
// (tools/tokens/verify-parity.mjs) can regenerate in memory and compare against
// the committed file without shelling out or writing to disk.
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const SRC = new URL("../../tokens/composa.tokens.json", import.meta.url);
export const OUT = new URL("../../tokens/figma-variables.json", import.meta.url);

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

// Pure: token document -> Figma Variables import object. Deterministic, so the
// drift-check can byte-compare its JSON.stringify against the committed file.
export function buildFigmaVariables(doc) {
  const t = doc.tokens;
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

  return {
    $meta: {
      source: "tokens/composa.tokens.json",
      note: "Figma Variables import generated from the single token source. COLOR values are per-mode CSS strings or { alias } references; FLOAT values are px numbers. Regenerate with `node tools/tokens/build-figma-vars.mjs`.",
    },
    collections,
  };
}

// Canonical on-disk form: the exact bytes the drift-check compares against.
export const serialize = (out) => JSON.stringify(out, null, 2) + "\n";

export async function readTokenDoc() {
  return JSON.parse(await readFile(SRC, "utf8"));
}

// CLI: regenerate and write the file. Guarded so importing this module (from the
// drift-check) never writes or logs.
async function main() {
  const out = buildFigmaVariables(await readTokenDoc());
  await writeFile(OUT, serialize(out));
  const n = Object.fromEntries(
    Object.entries(out.collections).map(([c, v]) => [c, Object.keys(v.variables).length]),
  );
  console.log("wrote tokens/figma-variables.json —", JSON.stringify(n));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
