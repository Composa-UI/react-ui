import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Guards the Composa violet brand ramp that replaced the Figma-blue one.
// Two things are pinned here because neither is expressible in a component test:
//   1. the exact token values, so a "harmless" tweak cannot quietly reintroduce
//      Figma's accent (#0d99ff / #007be5 / #7cc4f8) into the product chrome;
//   2. the WCAG AA contrast of every brand pair. The blue ramp shipped three
//      sub-AA pairs; the violet clears AA everywhere and must keep doing so.

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

  it("beats the retired blue on the three pairs the blue failed", () => {
    // Blue measured: 2.99 / 4.23 / 2.99 — all below their AA threshold.
    expect(contrast("#ffffff", light["--color-bg-brand"])).toBeGreaterThan(2.99);
    expect(contrast(light["--color-text-brand"], "#ffffff")).toBeGreaterThan(4.23);
    expect(contrast(light["--color-border-selected"], "#ffffff")).toBeGreaterThan(2.99);
  });
});
