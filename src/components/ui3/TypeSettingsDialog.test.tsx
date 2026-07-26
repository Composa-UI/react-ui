import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { TypeSettingsDialog, type TypeSettingsValue } from "./TypeSettingsDialog";

vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET: 48,
  InspectorDialog: ({
    ariaLabel,
    width,
    sideOffset,
    elevation,
    trigger,
    children,
  }: {
    ariaLabel: string;
    width?: number;
    sideOffset?: number;
    elevation?: number;
    trigger: ReactElement;
    children: ReactNode;
  }) => <div data-inspector-dialog={ariaLabel} data-width={width} data-side-offset={sideOffset} data-elevation={elevation}>
    {trigger}{children}
  </div>,
}));

const VALUE: TypeSettingsValue = {
  alignment: "left",
  decoration: "none",
  textCase: "none",
};

describe("TypeSettingsDialog", () => {
  it("uses the captured compact Effects placement and exposes only supported Basics controls", () => {
    const html = renderToStaticMarkup(<TypeSettingsDialog
      open
      trigger={<button type="button">Open type</button>}
      value={VALUE}
      onChange={() => undefined}
      onClose={() => undefined}
    />);

    expect(html).toContain('data-inspector-dialog="Type settings"');
    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-side-offset="48"');
    expect(html).toContain('data-elevation="400"');
    expect(html).toContain('aria-label="Justify"');
    expect(html).toContain('aria-label="Underline"');
    expect(html).toContain('aria-label="Strikethrough"');
    expect(html).not.toContain("Details");
    expect(html).not.toContain("Variable");
    expect(html).not.toContain("Small caps");
    expect(html).not.toContain("Vertical trim");
  });

  it("emits only alignment, decoration, and case patches", () => {
    const patches: unknown[] = [];
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<TypeSettingsDialog
        open
        trigger={<button type="button">Open type</button>}
        value={VALUE}
        onChange={patch => patches.push(patch)}
        onClose={() => undefined}
      />);
    });

    const button = (label: string) =>
      renderer!.root.findAllByType("button").find(item => item.props["aria-label"] === label)!;
    act(() => button("Justify").props.onClick());
    act(() => button("Underline").props.onClick());
    act(() => button("Title case").props.onClick());

    expect(patches).toEqual([
      { alignment: "justify" },
      { decoration: "underline" },
      { textCase: "title" },
    ]);
  });

  it("renders mixed truth without a selected option and disables inherited-locked controls", () => {
    const html = renderToStaticMarkup(<TypeSettingsDialog
      open
      trigger={<button type="button">Open type</button>}
      value={{
        ...VALUE,
        alignmentMixed: true,
        decorationMixed: true,
        textCaseMixed: true,
      }}
      readOnly
      onClose={() => undefined}
    />);

    expect(html).toContain('aria-label="Alignment: Mixed"');
    expect(html).toContain('aria-label="Decoration: Mixed"');
    expect(html).toContain('aria-label="Case: Mixed"');
    expect(html).toContain("Unlock the selection to edit type settings.");
    expect(html.match(/disabled=""/g)?.length).toBe(11);
    expect(html).not.toContain('aria-pressed="true"');
  });
});
