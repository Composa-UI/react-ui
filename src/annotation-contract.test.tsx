import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ReactElement } from "react";
import { Inspector } from "./components/ui3/Inspector";
import { EditorShell } from "./components/ui3/EditorShell";

// Annotation contract v1 enforcement (design-system-slots DoD: "a component is
// 'done' only when annotated"). Three layers, zero extra deps:
//   1. every annotation validates against annotations/annotation.schema.json;
//   2. coverage — the components the DS considers contract-complete each HAVE one;
//   3. truthfulness — the annotation's machine-checkable `enforce` claims are
//      verified against the real component (rendered role, tokens-only source).

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
function render(el: ReactElement): ReactTestRenderer {
  let r!: ReactTestRenderer;
  act(() => { r = create(el); });
  return r;
}

const annDir = fileURLToPath(new URL("../annotations/", import.meta.url));
const srcDir = fileURLToPath(new URL("./components/ui3/", import.meta.url));
const readJson = (name: string) => JSON.parse(readFileSync(annDir + name, "utf8"));

const schema = readJson("annotation.schema.json");
const files = readdirSync(annDir).filter(f => f.endsWith(".json") && f !== "annotation.schema.json");
const annotations = files.map(readJson) as Array<Record<string, unknown>>;

// Components the DS considers contract-complete: adding one without a valid,
// truthful annotation must fail here.
const REQUIRED = ["Button", "Tabs", "Inspector", "EditorShell", "Dropdown", "MenuRow"];

// Components this test can render trivially to verify an ARIA-role claim.
const RENDERABLE: Record<string, () => ReactElement> = {
  Inspector: () => <Inspector aria-label="contract" />,
  EditorShell: () => <EditorShell aria-label="contract" canvas={<div />} />,
};

type Spec = { type?: string; required?: string[]; properties?: Record<string, Spec> };
const typeOk = (val: unknown, type?: string): boolean => {
  if (!type) return true;
  if (type === "object") return val !== null && typeof val === "object" && !Array.isArray(val);
  if (type === "array") return Array.isArray(val);
  return typeof val === type;
};
function validate(ann: Record<string, unknown>, s: Spec): string[] {
  const errors: string[] = [];
  for (const key of s.required ?? []) if (!(key in ann)) errors.push(`missing '${key}'`);
  for (const [key, spec] of Object.entries(s.properties ?? {})) {
    if (!(key in ann)) continue;
    const val = ann[key];
    if (!typeOk(val, spec.type)) errors.push(`'${key}' should be ${spec.type}`);
    if (typeOk(val, "object")) {
      const obj = val as Record<string, unknown>;
      for (const rk of spec.required ?? []) if (!(rk in obj)) errors.push(`'${key}.${rk}' missing`);
      for (const [nk, nspec] of Object.entries(spec.properties ?? {})) {
        if (nk in obj && !typeOk(obj[nk], nspec.type)) errors.push(`'${key}.${nk}' should be ${nspec.type}`);
      }
    }
  }
  return errors;
}

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");

describe("annotation contract v1", () => {
  it("has at least the required components annotated", () => {
    const present = annotations.map(a => a.component);
    for (const name of REQUIRED) expect(present).toContain(name);
  });

  it.each(files)("%s validates against annotation.schema.json", (file) => {
    expect(validate(readJson(file), schema)).toEqual([]);
  });

  it("enforce.role is truthful: a component claiming an ARIA role renders it", () => {
    for (const ann of annotations) {
      const enforce = (ann.enforce ?? {}) as { role?: string; ariaRole?: boolean };
      if (enforce.ariaRole !== true) continue;
      const name = ann.component as string;
      const factory = RENDERABLE[name];
      // If it claims an ARIA role, it must be render-verifiable here.
      expect(factory, `no render fixture for ${name} (enforce.ariaRole=true)`).toBeTypeOf("function");
      const r = render(factory());
      const hits = r.root.findAll(n => n.props.role === enforce.role);
      expect(hits.length, `${name} should render role="${enforce.role}"`).toBeGreaterThan(0);
    }
  });

  it("enforce.tokensOnly is truthful: the component source carries no hardcoded hex", () => {
    for (const ann of annotations) {
      const enforce = (ann.enforce ?? {}) as { tokensOnly?: boolean };
      if (enforce.tokensOnly !== true) continue;
      const name = ann.component as string;
      const src = stripComments(readFileSync(srcDir + name + ".tsx", "utf8"));
      expect(src, `${name} declares tokensOnly but contains a hex literal`).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });
});
