import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";

vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR: "[data-composa-inspector-surface]",
  TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET: 8,
  InspectorDialog: ({ children, trigger, ...props }: { children: ReactNode; trigger?: ReactElement } & Record<string, unknown>) => (
    <div data-dialog={String(props.ariaLabel)} data-width={String(props.width)} data-side-offset={String(props.sideOffset)} data-anchor-surface={String(props.anchorSurfaceSelector)} data-elevation={String(props.elevation)}>
      {trigger}
      {children}
    </div>
  ),
}));

import { TypeSettingsDialog, type TypeSettingsValue } from "./TypeSettingsDialog";

const BASE: TypeSettingsValue = {
  lineHeight: 16,
  letterSpacing: 2,
  align: "left",
  verticalAlign: "top",
  decoration: "none",
  textCase: "none",
  weight: 400,
  fontFamily: "Inter",
};

function findButton(renderer: ReactTestRenderer, ariaLabel: string) {
  return renderer.root.findAll(
    node => node.type === "button" && node.props["aria-label"] === ariaLabel,
  )[0];
}

describe("TypeSettingsDialog", () => {
  it("shares the host-owned line-height and letter-spacing keyframes, but never weight", () => {
    const html = renderToStaticMarkup(
      <TypeSettingsDialog
        open
        onClose={() => undefined}
        trigger={<button>Type</button>}
        value={BASE}
        keyframes={{
          lineHeight: { active: true, onToggle: () => undefined },
          letterSpacing: { active: false, onToggle: () => undefined },
        }}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('aria-label="Type settings line height keyframe"');
    expect(html).toContain('aria-label="Type settings letter spacing keyframe"');
    expect(html).not.toContain("Weight keyframe");
  });

  it("keeps metric keyframes inert for a read-only selection", () => {
    const onToggle = vi.fn();
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<TypeSettingsDialog
      open readOnly value={BASE} trigger={<button>Type</button>} onClose={() => undefined}
      keyframes={{ lineHeight: { active: true, onToggle }, letterSpacing: { active: false, onToggle } }}
      onChange={() => undefined}
    />); });
    const button = findButton(renderer!, "Type settings line height keyframe");
    expect(button.props.disabled).toBe(true);
    act(() => button.props.onClick({ stopPropagation: () => undefined }));
    expect(onToggle).not.toHaveBeenCalled();
    act(() => renderer!.unmount());
  });

  it("uses the shared anchored inspector shell with the canonical width + elevation-400", () => {
    const html = renderToStaticMarkup(
      <TypeSettingsDialog
        open
        onClose={() => undefined}
        trigger={<button>Type</button>}
        value={BASE}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('data-dialog="Type settings"');
    expect(html).toContain('data-width="240"');
    // Anchored clear of the inspector by anchoring the side axis to the inspector
    // surface's LEFT edge (not a magic trigger-relative offset), so `sideOffset`
    // is just the approved 8px gutter regardless of trigger position/width (#499).
    expect(html).toContain('data-side-offset="8"');
    expect(html).toContain('data-anchor-surface="[data-composa-inspector-surface]"');
    expect(html).toContain('data-elevation="400"');
    // Both existing metrics survive.
    expect(html).toContain('aria-label="Type settings line height"');
    expect(html).toContain('aria-label="Type settings letter spacing"');
    // Full control set is present.
    expect(html).toContain('aria-label="Alignment: Align left"');
    expect(html).toContain('aria-label="Vertical trim: Align top"');
    expect(html).toContain('aria-label="Decoration: No decoration"');
    expect(html).toContain('aria-label="Case: Original case"');
    expect(html).toContain('aria-label="Font weight"');
  });

  it("wires alignment to the horizontal axis and vertical trim to the vertical axis (#495)", () => {
    const patches: unknown[] = [];
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <TypeSettingsDialog
          open
          onClose={() => undefined}
          trigger={<button>Type</button>}
          value={BASE}
          onChange={patch => patches.push(patch)}
        />,
      );
    });

    // Horizontal alignment control fires `align`, never `verticalAlign`.
    act(() => findButton(renderer, "Align center").props.onClick());
    act(() => findButton(renderer, "Align right").props.onClick());
    // Vertical trim control fires `verticalAlign`, never `align`.
    act(() => findButton(renderer, "Align bottom").props.onClick());
    act(() => findButton(renderer, "Align middle").props.onClick());

    expect(patches).toEqual([
      { align: "center" },
      { align: "right" },
      { verticalAlign: "bottom" },
      { verticalAlign: "middle" },
    ]);
  });

  it("emits decoration, case, and weight through the supported mutation contract", () => {
    const patches: unknown[] = [];
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <TypeSettingsDialog
          open
          onClose={() => undefined}
          trigger={<button>Type</button>}
          value={BASE}
          onChange={patch => patches.push(patch)}
        />,
      );
    });

    act(() => findButton(renderer, "Underline").props.onClick());
    act(() => findButton(renderer, "Strikethrough").props.onClick());
    act(() => findButton(renderer, "Uppercase").props.onClick());
    act(() => findButton(renderer, "Title case").props.onClick());

    expect(patches).toEqual([
      { decoration: "underline" },
      { decoration: "strikethrough" },
      { textCase: "upper" },
      { textCase: "title" },
    ]);
  });

  it("gates justify when the document model does not support it", () => {
    const html = renderToStaticMarkup(
      <TypeSettingsDialog
        open
        onClose={() => undefined}
        trigger={<button>Type</button>}
        value={BASE}
        justifySupported={false}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('aria-label="Justify: unavailable"');
    expect(html).toContain("Justified alignment is not supported by the current document model.");
  });

  it("shows mixed values without fabricating a concrete choice", () => {
    const html = renderToStaticMarkup(
      <TypeSettingsDialog
        open
        onClose={() => undefined}
        trigger={<button>Type</button>}
        value={{ ...BASE, alignMixed: true, decorationMixed: true, textCaseMixed: true, weightMixed: true }}
        onChange={() => undefined}
      />,
    );
    expect(html).toContain('aria-label="Alignment: Mixed"');
    expect(html).toContain('aria-label="Decoration: Mixed"');
    expect(html).toContain('aria-label="Case: Mixed"');
    // No alignment segment claims to be checked while the value is mixed.
    expect(html).not.toContain('aria-label="Alignment: Mixed"aria-checked="true"');
  });

  it("keeps locked selections readable but disables every mutating control", () => {
    const patches: unknown[] = [];
    let renderer!: ReactTestRenderer;
    act(() => {
      renderer = create(
        <TypeSettingsDialog
          open
          onClose={() => undefined}
          trigger={<button>Type</button>}
          value={BASE}
          readOnly
          onChange={patch => patches.push(patch)}
        />,
      );
    });

    // Clicks on disabled segments are inert.
    act(() => findButton(renderer, "Align center").props.onClick());
    act(() => findButton(renderer, "Underline").props.onClick());
    expect(patches).toEqual([]);

    const html = renderToStaticMarkup(
      <TypeSettingsDialog
        open
        onClose={() => undefined}
        trigger={<button>Type</button>}
        value={BASE}
        readOnly
        onChange={() => undefined}
      />,
    );
    expect(html).toContain("Unlock the selection to edit type settings.");
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(10);
  });
});
