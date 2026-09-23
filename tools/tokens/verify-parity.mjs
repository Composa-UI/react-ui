// Drift-check (CI gate): two guarantees, both from the single token source
// tokens/composa.tokens.json:
//   1. the shipped composa-tokens.css defines exactly the same variables and
//      values, in both light and dark;
//   2. the committed tokens/figma-variables.json is exactly what
//      build-figma-vars.mjs would regenerate from that source.
// Fails the build on any drift. Zero-dependency: `node tools/tokens/verify-parity.mjs`.
import { readTokensCss } from "./parse-css.mjs";
import { buildFigmaVariables, serialize, OUT as FIGMA_OUT, readTokenDoc } from "./build-figma-vars.mjs";
import { readFile } from "node:fs/promises";

const CSS = new URL("../../src/styles/composa-tokens.css", import.meta.url);
const JSON_PATH = new URL("../../tokens/composa.tokens.json", import.meta.url);

const css = await readTokensCss(CSS);
const doc = JSON.parse(await readFile(JSON_PATH, "utf8"));

const jsonLight = {};
const jsonDark = {};
for (const [group, keys] of Object.entries(doc.tokens)) {
  for (const [key, entry] of Object.entries(keys)) {
    const name = key === "_" ? group : `${group}-${key}`;
    jsonLight[name] = entry.value;
    if (entry.dark !== undefined) jsonDark[name] = entry.dark;
  }
}

const errors = [];
function compare(cssMap, jsonMap, label) {
  for (const k of Object.keys(cssMap)) {
    if (!(k in jsonMap)) errors.push(`${label}: --${k} in CSS but missing from JSON`);
    else if (cssMap[k] !== jsonMap[k])
      errors.push(`${label}: --${k} = "${cssMap[k]}" (CSS) vs "${jsonMap[k]}" (JSON)`);
  }
  for (const k of Object.keys(jsonMap)) {
    if (!(k in cssMap)) errors.push(`${label}: --${k} in JSON but missing from CSS`);
  }
}
compare(css.light, jsonLight, "light");
compare(css.dark, jsonDark, "dark");

if (errors.length) {
  console.error("TOKEN DRIFT — composa-tokens.css and composa.tokens.json disagree:\n  " + errors.join("\n  "));
  process.exit(1);
}

// Figma-variables drift: the committed file must equal a fresh regeneration from
// the same token source, so a token edit that skips `npm run tokens:figma` (or a
// hand-edit of the generated file) fails CI instead of silently rotting.
const expectedFigma = serialize(buildFigmaVariables(doc));
let committedFigma = null;
try {
  committedFigma = await readFile(FIGMA_OUT, "utf8");
} catch {
  console.error(
    "TOKEN DRIFT — tokens/figma-variables.json is missing. Regenerate with `node tools/tokens/build-figma-vars.mjs`.",
  );
  process.exit(1);
}
if (committedFigma !== expectedFigma) {
  console.error(
    "TOKEN DRIFT — tokens/figma-variables.json is stale (does not match the token source). Regenerate with `node tools/tokens/build-figma-vars.mjs`.",
  );
  process.exit(1);
}

console.log(
  `token parity OK — ${Object.keys(css.light).length} light vars, ${Object.keys(css.dark).length} dark overrides; CSS, JSON, and figma-variables.json all agree.`,
);
