import { type ReactElement, type ReactNode } from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { Checkbox } from "./Checkbox";
import { Dropdown } from "./Dropdown";
import { MenuRow, PopoverMenu } from "./Menu";
import { Tooltip } from "./Tooltip";

vi.mock("./InspectorDialog", () => ({
  InspectorDialog: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) =>
    <div data-inspector-dialog {...props}>{children}</div>,
}));

vi.mock("./Tooltip", () => ({
  Tooltip: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) =>
    <div data-tooltip {...props}>{children}</div>,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function menuRows(popover: ReactTestInstance) {
  const menu = popover.props.children(() => undefined) as ReactElement<{
    children: ReactElement<{ label: string; onClick: () => void; selectionRole?: "radio" | "checkbox" }>[];
  }>;
  return menu.props.children;
}

describe("AutoLayoutSettingsDialog", () => {
  it("projects canonical values and emits controlled setting patches", () => {
    const patches: unknown[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AutoLayoutSettingsDialog
        open
        value={{ mode: "horizontal", textBaseline: false, strokeSizing: "excluded", canvasStacking: "last-on-top" }}
        trigger={<button type="button">Settings</button>}
        onChange={patch => patches.push(patch)}
        onClose={() => undefined}
      />);
    });
    const popovers = renderer!.root.findAllByType(PopoverMenu);
    expect(popovers[0].findByType(Dropdown).props.ariaLabel).toBe("Stroke inclusion: Excluded");
    expect(popovers[1].findByType(Dropdown).props.ariaLabel).toBe("Canvas stacking: Last on top");
    for (const row of [...menuRows(popovers[0]), ...menuRows(popovers[1])]) {
      expect(row.props.selectionRole).toBe("radio");
    }
    const strokeIncluded = menuRows(popovers[0]).find(row => row.type === MenuRow && row.props.label === "Included")!;
    const firstOnTop = menuRows(popovers[1]).find(row => row.type === MenuRow && row.props.label === "First on top")!;
    act(() => strokeIncluded.props.onClick());
    act(() => firstOnTop.props.onClick());
    act(() => renderer!.root.findByType(Checkbox).props.onChange(true));
    expect(patches).toEqual([
      { strokeSizing: "included" },
      { canvasStacking: "first-on-top" },
      { textBaseline: true },
    ]);
    act(() => renderer!.unmount());
  });

  it("disables baseline outside horizontal flow and exposes the required tooltip", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AutoLayoutSettingsDialog
        open
        value={{ mode: "vertical", textBaseline: false, strokeSizing: "included", canvasStacking: "first-on-top" }}
        trigger={<button type="button">Settings</button>}
        onClose={() => undefined}
      />);
    });
    expect(renderer!.root.findByType(Checkbox).props.disabled).toBe(true);
    expect(renderer!.root.findByType(Tooltip).props).toMatchObject({
      label: "Only applicable for horizontal layouts",
      disabled: false,
    });
    act(() => renderer!.unmount());
  });
});
