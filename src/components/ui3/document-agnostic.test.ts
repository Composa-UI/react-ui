import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// "Generic core stays document-agnostic" (design-system-slots DoD): the
// composable shell a second Figma-mental-model tool (e.g. a doc editor) would
// reuse must NOT bake in the design editor's timeline / animation modules. This
// guard makes that "checked, not assumed": it walks the shell's local import
// graph and fails if it ever reaches an editor-specific module.
const dir = fileURLToPath(new URL(".", import.meta.url)); // src/components/ui3/

// The reusable composable shell.
const ROOTS = ["Inspector", "Panel", "Tabs"];

// Document- / timeline- / animation-bound modules that must stay out of the shell.
const EDITOR_SPECIFIC = new Set([
  "Timeline",
  "PropertyPanel",
  "AnimatePanel",
  "EasingInspectorSection",
  "CompositionPanel",
  "SlidesPanel",
  "SlideInspector",
]);

function localImports(mod: string): string[] {
  for (const ext of [".tsx", ".ts"]) {
    const p = dir + mod + ext;
    if (existsSync(p)) {
      const src = readFileSync(p, "utf8");
      return [...src.matchAll(/from\s+"\.\/([\w-]+)"/g)].map(m => m[1]);
    }
  }
  return [];
}

function reachable(roots: string[]): Set<string> {
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length) {
    const mod = stack.pop() as string;
    if (seen.has(mod)) continue;
    seen.add(mod);
    for (const dep of localImports(mod)) if (!seen.has(dep)) stack.push(dep);
  }
  return seen;
}

describe("document-agnostic composable shell", () => {
  it("Inspector / Panel / Tabs never import editor-specific (timeline/animation) modules", () => {
    const graph = reachable(ROOTS);
    const leaks = [...graph].filter(m => EDITOR_SPECIFIC.has(m));
    expect(leaks).toEqual([]);
  });

  it("the guard exercises the real import graph (Inspector reaches its Panel base)", () => {
    expect(reachable(["Inspector"]).has("Panel")).toBe(true);
  });
});
