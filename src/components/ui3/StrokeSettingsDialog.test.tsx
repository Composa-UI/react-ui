import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { MenuRow, PopoverMenu } from "./Menu";
import {
  StrokeSettingsDialog,
  type StrokeSettingsValue,
} from "./StrokeSettingsDialog";
import { TooltipProvider } from "./Tooltip";

vi.mock("./InspectorDialog", () => ({
  COMPACT_INSPECTOR_DIALOG_WIDTH: 240,
  STROKE_SETTINGS_INSPECTOR_SIDE_OFFSET: 8,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR: "[data-composa-inspector-surface]",
  InspectorDialog: ({
    ariaLabel,
    width,
    sideOffset,
    anchorSurfaceSelector,
    elevation,
    trigger,
    children,
  }: {
    ariaLabel: string;
    width?: number;
    sideOffset?: number;
    anchorSurfaceSelector?: string;
    elevation?: number;
    trigger: ReactElement;
    children: ReactNode;
  }) => <div
    data-inspector-dialog={ariaLabel}
    data-width={width}
    data-side-offset={sideOffset}
    data-anchor-surface={anchorSurfaceSelector}
    data-elevation={elevation}
  >
    {trigger}{children}
  </div>,
}));

const VALUE: StrokeSettingsValue = { style: "solid", join: "miter", cap: "none" };
const withTooltips = (dialog: ReactElement) => <TooltipProvider>{dialog}</TooltipProvider>;

describe("StrokeSettingsDialog", () => {
  it("anchors clear of the inspector surface and renders only the engine-backed Basic fields with no tab strip", () => {
    const html = renderToStaticMarkup(withTooltips(<StrokeSettingsDialog
      open
      trigger={<button type="button">Open stroke</button>}
      value={VALUE}
      onChange={() => undefined}
      onClose={() => undefined}
    />));

    // Placement contract: 240px, elevation-400, and — the overlap fix (C) —
    // anchored to the inspector surface's left edge with the plain 8px gutter
    // rather than a trigger-relative magic offset.
    expect(html).toContain('data-inspector-dialog="Stroke settings"');
    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-side-offset="8"');
    expect(html).toContain('data-anchor-surface="[data-composa-inspector-surface]"');
    expect(html).toContain('data-elevation="400"');

    // Capability gate (D): only the engine-backed fields are present.
    expect(html).toContain('aria-label="Style: Solid"');
    expect(html).toContain('aria-label="Join: Miter"');
    expect(html).toContain('aria-label="Cap: None"');

    // No tab strip, and no unsupported controls are shipped inert.
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain("Dynamic");
    expect(html).not.toContain("Brush");
    expect(html).not.toContain("Width profile");
    expect(html).not.toContain("Miter angle");
    expect(html).not.toContain("not supported by the current document model");
    expect(html).not.toContain("approved engine and persistence contract");
    expect(html).not.toContain("unavailable");
  });

  it("emits only the supported Style, Join, and Cap fields", () => {
    const patches: unknown[] = [];
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(withTooltips(<StrokeSettingsDialog
        open
        trigger={<button type="button">Open stroke</button>}
        value={VALUE}
        onChange={patch => patches.push(patch)}
        onClose={() => undefined}
      />));
    });

    const popover = renderer!.root.findByType(PopoverMenu);
    let menu: ReactTestRenderer;
    act(() => { menu = create(popover.props.children(() => undefined)); });
    const dashed = menu!.root.findAllByType(MenuRow).find(row => row.props.label === "Dashed")!;
    act(() => dashed.props.onClick());

    const bevel = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Bevel")!;
    const square = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Square")!;
    act(() => bevel.props.onClick());
    act(() => square.props.onClick());

    expect(patches).toEqual([{ style: "dashed" }, { join: "bevel" }, { cap: "square" }]);
  });

  it("shows mixed values without claiming an active choice and keeps locked selections read-only", () => {
    const html = renderToStaticMarkup(withTooltips(<StrokeSettingsDialog
      open
      trigger={<button type="button">Open stroke</button>}
      value={{ style: "solid", join: "miter", cap: "none", styleMixed: true, joinMixed: true, capMixed: true }}
      readOnly
      onClose={() => undefined}
    />));

    expect(html).toContain('aria-label="Style: Mixed"');
    expect(html).toContain('aria-label="Join: Mixed"');
    expect(html).toContain('aria-label="Cap: Mixed"');
    expect(html).toContain("Unlock the selection to edit stroke settings.");
    // Read-only locks the Style dropdown plus all six Join/Cap segments.
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(6);
  });
});
