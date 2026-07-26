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

const VALUE: StrokeSettingsValue = { style: "solid", join: "miter", cap: "none" };
const withTooltips = (dialog: ReactElement) => <TooltipProvider>{dialog}</TooltipProvider>;

describe("StrokeSettingsDialog", () => {
  it("uses the approved compact Effects placement and exposes truthful capability gates", () => {
    const html = renderToStaticMarkup(withTooltips(<StrokeSettingsDialog
      open
      trigger={<button type="button">Open stroke</button>}
      value={VALUE}
      onChange={() => undefined}
      onClose={() => undefined}
    />));

    expect(html).toContain('data-inspector-dialog="Stroke settings"');
    expect(html).toContain('data-width="240"');
    expect(html).toContain('data-side-offset="48"');
    expect(html).toContain('data-elevation="400"');
    expect(html).toContain("Dynamic stroke behavior needs an approved engine and persistence contract.");
    expect(html).toContain("Brush strokes need an approved engine and persistence contract.");
    expect(html).toContain("Width profiles and profile flipping are not supported by the current document model.");
    expect(html).toContain("Editable miter angle is not supported by the current document model.");
    expect(html).toContain('aria-label="Width profile: unavailable"');
    expect(html).toContain('aria-label="Miter angle: unavailable"');
    expect(html).toContain('aria-label="Flip width profile: unavailable"');
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
    expect(html.match(/disabled=""/g)?.length).toBeGreaterThanOrEqual(10);
  });
});
