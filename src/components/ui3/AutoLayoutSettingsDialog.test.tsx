import { type ReactElement, type ReactNode } from "react";
import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { Dropdown } from "./Dropdown";
import { MenuRow, PopoverMenu } from "./Menu";
import { Tooltip } from "./Tooltip";
import { SegmentedControl } from "./SegmentedControl";

vi.mock("./InspectorDialog", async () => {
  // Keep the real placement constants — the anchoring contract is asserted in
  // AutoLayoutSettingsDialog.anchored.test.tsx against the real InspectorDialog.
  const actual = await vi.importActual<typeof import("./InspectorDialog")>("./InspectorDialog");
  return {
    ...actual,
    InspectorDialog: ({ children, ...props }: { children: ReactNode } & Record<string, unknown>) =>
      <div data-inspector-dialog {...props}>{children}</div>,
  };
});

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
    act(() => renderer!.root.findByType(SegmentedControl).props.onChange("on"));
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
    expect(renderer!.root.findByType(SegmentedControl).props.disabled).toBe(true);
    expect(renderer!.root.findByType(Tooltip).props).toMatchObject({
      label: "Only applicable for horizontal layouts",
      disabled: false,
    });
    act(() => renderer!.unmount());
  });

  it("projects mixed values and capability-intersection gating", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AutoLayoutSettingsDialog
        open
        value={{
          mode: "horizontal",
          baselineApplicable: false,
          textBaseline: "mixed",
          strokeSizing: "mixed",
          canvasStacking: "mixed",
        }}
        trigger={<button type="button">Settings</button>}
        onClose={() => undefined}
      />);
    });
    const dropdowns = renderer!.root.findAllByType(Dropdown);
    expect(dropdowns.map(dropdown => dropdown.props.ariaLabel)).toEqual([
      "Stroke inclusion: Mixed",
      "Canvas stacking: Mixed",
    ]);
    expect(dropdowns.every(dropdown => dropdown.props.mixed)).toBe(true);
    expect(renderer!.root.findByType(SegmentedControl).props).toMatchObject({ value: "off", disabled: true });
    act(() => renderer!.unmount());
  });

  it("disables every authoring control for a locked selection", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AutoLayoutSettingsDialog
        open
        disabled
        value={{ mode: "horizontal", textBaseline: false, strokeSizing: "excluded", canvasStacking: "last-on-top" }}
        trigger={<button type="button">Settings</button>}
        onClose={() => undefined}
      />);
    });
    expect(renderer!.root.findAllByType(Dropdown).every(dropdown => dropdown.props.disabled)).toBe(true);
    expect(renderer!.root.findByType(SegmentedControl).props.disabled).toBe(true);
    act(() => renderer!.unmount());
  });

  it("keeps Grid settings limited to the Strokes Included/Excluded control", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AutoLayoutSettingsDialog
        open
        value={{ mode: "grid", textBaseline: false, strokeSizing: "excluded", canvasStacking: "last-on-top" }}
        trigger={<button type="button">Settings</button>}
        onClose={() => undefined}
      />);
    });
    const popovers = renderer!.root.findAllByType(PopoverMenu);
    expect(popovers).toHaveLength(1);
    expect(popovers[0].findByType(Dropdown).props.ariaLabel).toBe("Stroke inclusion: Excluded");
    expect(menuRows(popovers[0]).map(row => row.props.label)).toEqual(["Excluded", "Included"]);
    expect(renderer!.root.findAllByType(SegmentedControl)).toHaveLength(0);
    expect(renderer!.root.findAllByType(Tooltip)).toHaveLength(0);
    act(() => renderer!.unmount());
  });
});
