// Drift-check (CI gate): assert tokens/composa.tokens.json and the shipped
// composa-tokens.css define exactly the same variables and values, in both
// light and dark. Fails the build on any drift. Zero-dependency:
// `node tools/tokens/verify-parity.mjs`.
import { readTokensCss } from "./parse-css.mjs";
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
console.log(
  `token parity OK — ${Object.keys(css.light).length} light vars, ${Object.keys(css.dark).length} dark overrides; CSS and JSON agree.`,
);
