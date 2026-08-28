import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Guards the Composa violet brand ramp that replaced the Figma-blue one.
// Two things are pinned here because neither is expressible in a component test:
//   1. the exact token values, so a "harmless" tweak cannot quietly reintroduce
//      Figma's accent (#0d99ff / #007be5 / #7cc4f8) into the product chrome;
//   2. the WCAG AA contrast of the brand pairs. This file checks 14 pairs: the
//      13 in the `it.each` table plus one pinned on its own. Of those 14 the
//      blue ramp failed 8 and the violet fails 1 -- dark `text-brand` on dark
//      `bg-selected`, 3.7596:1 against the 4.5 text floor, which is the pair
//      pinned separately. "The violet clears AA everywhere" is NOT true of this
//      ramp and must not be written down again.

const CSS = readFileSync(fileURLToPath(new URL("./composa-tokens.css", import.meta.url)), "utf8");

function block(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector);
  expect(start, `selector ${selector} not found`).toBeGreaterThan(-1);
  const open = CSS.indexOf("{", start);
  const end = CSS.indexOf("\n}", open);
  const body = CSS.slice(open + 1, end);
  const out: Record<string, string> = {};
  for (const line of body.split("\n")) {
    const m = /^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/.exec(line);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const light = block(":root {");
const dark = block('[data-composa-mode="dark"] {');

const LIGHT_EXPECTED = {
  "--color-text-brand": "#6b4fd1",
  "--color-icon-brand": "#6b4fd1",
  "--color-bg-selected": "#efeefd",
  "--color-bg-brand": "#795ee4",
  "--color-bg-brand-pressed": "#6b4fd1",
  "--color-border-onbrand-strong": "#6b4fd1",
  "--color-border-selected": "#795ee4",
  "--color-border-selected-strong": "#6b4fd1",
} as const;

const DARK_EXPECTED = {
  "--color-text-brand": "#bab5f3",
  "--color-icon-brand": "#bab5f3",
  "--color-bg-selected": "#57537a",
  "--color-bg-brand": "#6d53d1",
  "--color-bg-brand-pressed": "#5c44b4",
  "--color-border-onbrand-strong": "#5c44b4",
  // Selection borders outline document content on the canvas, not app chrome,
  // so they are mode-invariant — exactly as the retired blue pair was.
  "--color-border-selected": "#795ee4",
  "--color-border-selected-strong": "#6b4fd1",
} as const;

// ── WCAG 2.1 relative luminance / contrast ───────────────────────────────────
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const ch = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const [r, g, b] = ch.map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("brand ramp tokens", () => {
  it.each(Object.entries(LIGHT_EXPECTED))("light %s is %s", (name, value) => {
    expect(light[name]).toBe(value);
  });

  it.each(Object.entries(DARK_EXPECTED))("dark %s is %s", (name, value) => {
    expect(dark[name]).toBe(value);
  });

  it("carries no Figma-blue brand values anywhere in the token file", () => {
    // Declaration values only — the header prose names the retired hexes on purpose.
    const declared = [...CSS.matchAll(/^\s*--[a-z0-9-]+\s*:\s*([^;]+);/gm)].map(m => m[1].toLowerCase());
    for (const retired of ["#0d99ff", "#007be5", "#7cc4f8", "#0c8ce9", "#0a6dc2", "#e5f4ff", "#4a5878"]) {
      expect(declared.filter(v => v.includes(retired))).toEqual([]);
    }
  });
});

describe("brand ramp meets WCAG AA", () => {
  const AA_TEXT = 4.5;
  const AA_NONTEXT = 3;

  it.each([
    ["white text on light bg-brand", "#ffffff", light["--color-bg-brand"], AA_TEXT],
    ["white text on light bg-brand-pressed", "#ffffff", light["--color-bg-brand-pressed"], AA_TEXT],
    ["light text-brand on bg", light["--color-text-brand"], "#ffffff", AA_TEXT],
    ["light text-brand on bg-secondary", light["--color-text-brand"], "#f5f5f5", AA_TEXT],
    ["light text-brand on bg-selected", light["--color-text-brand"], light["--color-bg-selected"], AA_TEXT],
    ["dark text-brand on bg", dark["--color-text-brand"], "#2c2c2c", AA_TEXT],
    ["dark text-brand on bg-secondary", dark["--color-text-brand"], "#383838", AA_TEXT],
    // NOTE: "dark text-brand on dark bg-selected" is the twin of the light row
    // above and is deliberately NOT in this table -- it does not clear AA. It is
    // pinned in its own test below. Leaving it out silently is what let the
    // "clears AA everywhere" claim survive; the row below is the fix.
    ["white text on dark bg-brand", "#ffffff", dark["--color-bg-brand"], AA_TEXT],
    ["white text on dark bg-brand-pressed", "#ffffff", dark["--color-bg-brand-pressed"], AA_TEXT],
    ["white text on dark bg-selected", "#ffffff", dark["--color-bg-selected"], AA_TEXT],
    // Selection borders are non-text UI: 3:1. Checked on the white artboard they
    // most often sit on, and on the dark app chrome.
    ["border-selected on a white artboard", light["--color-border-selected"], "#ffffff", AA_NONTEXT],
    ["border-selected-strong on a white artboard", light["--color-border-selected-strong"], "#ffffff", AA_NONTEXT],
    ["border-selected on dark chrome", dark["--color-border-selected"], "#2c2c2c", AA_NONTEXT],
  ])("%s", (_label, fg, bg, threshold) => {
    expect(contrast(fg as string, bg as string)).toBeGreaterThanOrEqual(threshold as number);
  });

  // The one brand pair that does not clear AA, recorded so it cannot be
  // forgotten, quietly worsened, or claimed away in prose again.
  //
  // Dark `text-brand` (#bab5f3) on dark `bg-selected` (#57537a) = 3.7596:1,
  // below the 4.5 text floor. The blue pair it replaced (#7cc4f8 on #4a5878)
  // measured 3.7550:1, so the violet is a hair better, not a regression -- but
  // "better than a failing blue" is not "passes". Closing the gap means moving a
  // brand value, which is an owner decision, not a token-swap detail. The
  // light-mode twin (text-brand on bg-selected, 4.9992:1) does clear AA; the
  // asymmetry is real and this row is where it is written down.
  it("pins the one dark brand pair that is still below AA text contrast", () => {
    const measured = contrast(dark["--color-text-brand"], dark["--color-bg-selected"]);
    expect(measured).toBeCloseTo(3.7596, 3);
    // Documents the shortfall. If a future change clears AA, this line fails on
    // purpose: move the pair up into the table above and delete this test.
    expect(measured).toBeLessThan(AA_TEXT);
    // ...and it must never fall back below the blue it replaced.
    expect(measured).toBeGreaterThan(3.755);
  });

  it("beats the retired blue on three of the pairs the blue failed", () => {
    // Blue measured: 2.99 / 4.23 / 2.99 — all below their AA threshold. These are
    // three of the 8 pairs the blue failed, not the complete set.
    expect(contrast("#ffffff", light["--color-bg-brand"])).toBeGreaterThan(2.99);
    expect(contrast(light["--color-text-brand"], "#ffffff")).toBeGreaterThan(4.23);
    expect(contrast(light["--color-border-selected"], "#ffffff")).toBeGreaterThan(2.99);
  });
});
