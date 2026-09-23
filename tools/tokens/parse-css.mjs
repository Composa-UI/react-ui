// Parse composa-tokens.css into { light, dark } maps of { varName: value }.
// Zero-dependency. Shared by build-json.mjs (bootstrap) and verify-parity.mjs (CI).
import { readFile } from "node:fs/promises";

export function parseTokensCss(css) {
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = { light: {}, dark: {} };
  const blockRe = /(:root|\[data-composa-mode="dark"\])\s*\{([^}]*)\}/g;
  let block;
  while ((block = blockRe.exec(noComments))) {
    const mode = block[1] === ":root" ? "light" : "dark";
    const declRe = /--([\w-]+)\s*:\s*([^;]+);/g;
    let decl;
    while ((decl = declRe.exec(block[2]))) {
      out[mode][decl[1]] = decl[2].trim().replace(/\s+/g, " ");
    }
  }
  return out;
}

export async function readTokensCss(path) {
  return parseTokensCss(await readFile(path, "utf8"));
}
