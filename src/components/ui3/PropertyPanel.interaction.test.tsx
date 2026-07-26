import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { NumericComboInput, NumericInput } from "./Input";
import { DimensionSizingFields, PropertyPanel, SizingComboField, type ElementSizingMode, type SizingComboFieldProps } from "./PropertyPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function widthField(root: ReactTestInstance) {
  return root.findAllByType(SizingComboField).find(field => field.props.axis === "width")!;
}

function chooseMode(field: ReactTestInstance, mode: ElementSizingMode) {
  const combo = SizingComboField(field.props as SizingComboFieldProps);
  const menu = combo.props.menu(() => undefined);
  const label = mode === "fixed" ? `Fixed width (${field.props.value})` : mode === "hug" ? "Hug contents" : "Fill container";
  const row = menu.props.children.flat(Infinity).find((child: { props?: { label?: string } }) => child?.props?.label === label);
  if (!row?.props?.onClick) throw new Error(`Missing interactive sizing row: ${label}`);
  row.props.onClick();
}

describe("DimensionSizingFields interactions", () => {
  it("gives Add min/max actions leading icons before constraints exist", () => {
    const combo = SizingComboField({
      axis: "width",
      value: 320,
      mode: "fixed",
      onConstraintChange: () => undefined,
    });
    const menu = combo.props.menu(() => undefined);
    const rows = menu.props.children.flat(Infinity);
    for (const label of ["Add min width", "Add max width"]) {
      const row = rows.find((child: { props?: { label?: string } }) => child?.props?.label === label);
      expect(row?.props?.leading).toBeTruthy();
    }
  });

  it("keeps sizing mode local when only numeric dimensions are controlled", () => {
    const widthChanges: number[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="text" width={120} height={80} onWidthChange={value => widthChanges.push(value)} />); });

    expect(widthField(renderer!.root).props.mode).toBe("fixed");
    act(() => chooseMode(widthField(renderer!.root), "hug"));
    expect(widthField(renderer!.root).props.mode).toBe("hug");

    const combo = SizingComboField(widthField(renderer!.root).props as SizingComboFieldProps);
    act(() => combo.props.onChange(144));
    expect(widthChanges).toEqual([144]);
    expect(widthField(renderer!.root).props.mode).toBe("fixed");
    act(() => renderer!.unmount());
  });

  it("emits semantic mode and atomic relative-to-fixed numeric actions when controlled", () => {
    const actions: Array<{ axis: string; change: unknown }> = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<DimensionSizingFields width={320} height={180} widthMode="fill" heightMode="fixed" onSizingChange={(axis, change) => actions.push({ axis, change })} />); });

    act(() => chooseMode(widthField(renderer!.root), "hug"));
    const combo = SizingComboField(widthField(renderer!.root).props as SizingComboFieldProps);
    act(() => combo.props.onChange(360));

    expect(actions).toEqual([
      { axis: "width", change: { mode: "hug" } },
      { axis: "width", change: { mode: "fixed", value: 360 } },
    ]);
    expect(widthField(renderer!.root).props.mode).toBe("fill");
    act(() => renderer!.unmount());
  });

  it("houses constraint removal in each constraint ComboField menu", () => {
    const actions: Array<{ axis: string; constraint: string; value: number | undefined }> = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<DimensionSizingFields
      width={320}
      height={180}
      minWidth={120}
      maxHeight={360}
      onConstraintChange={(axis, constraint, value) => actions.push({ axis, constraint, value })}
    />); });

    const constraintCombos = renderer!.root.findAllByType(NumericComboInput)
      .filter(combo => combo.props.dataMode === "constraint");
    expect(constraintCombos).toHaveLength(2);
    const minWidth = constraintCombos.find(combo => combo.props.ariaLabel === "Min width")!;
    const menu = minWidth.props.menu(() => undefined);
    const remove = Array.isArray(menu.props.children)
      ? menu.props.children.find((child: { props?: { label?: string } }) => child?.props?.label === "Remove min width")
      : menu.props.children;
    act(() => remove.props.onClick());
    expect(actions).toEqual([{ axis: "width", constraint: "min", value: undefined }]);
    act(() => renderer!.unmount());
  });
});

describe("Auto-layout settings interactions", () => {
  it("expands controlled padding to four labelled physical sides when any side differs or is mixed", () => {
    const patches: unknown[] = [];
    const layout = {
      mode: "horizontal" as const,
      gap: 8,
      padding: { top: 8, right: 8, bottom: 8, left: 8 },
      align: "mc",
      widthMode: "fixed" as const,
      heightMode: "hug" as const,
      clipsContent: false,
    };
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto" layout={layout} onLayoutChange={patch => patches.push(patch)} />); });

    const labels = () => renderer!.root.findAllByType(NumericInput).map(input => input.props.ariaLabel).filter(Boolean);
    expect(labels()).toContain("Vertical padding");
    expect(labels()).toContain("Horizontal padding");
    expect(labels()).not.toContain("Top padding");

    act(() => { renderer!.update(<PropertyPanel
      elementType="frame-auto"
      layout={{ ...layout, padding: { ...layout.padding, left: 24 } }}
      onLayoutChange={patch => patches.push(patch)}
    />); });
    expect(labels()).toEqual(expect.arrayContaining(["Top padding", "Right padding", "Bottom padding", "Left padding"]));
    const left = renderer!.root.findAllByType(NumericInput).find(input => input.props.ariaLabel === "Left padding")!;
    act(() => left.props.onChange(32));
    expect(patches[patches.length - 1]).toEqual({ padding: { top: 8, right: 8, bottom: 8, left: 32 } });

    act(() => { renderer!.update(<PropertyPanel
      elementType="frame-auto"
      layout={{ ...layout, paddingLeftMixed: true, paddingDisabled: true }}
      onLayoutChange={patch => patches.push(patch)}
    />); });
    const mixedLeft = renderer!.root.findAllByType(NumericInput).find(input => input.props.ariaLabel === "Left padding")!;
    expect(mixedLeft.props.mixed).toBe(true);
    expect(mixedLeft.props.disabled).toBe(true);
    act(() => renderer!.unmount());
  });

  it("opens one anchored dialog from the section trigger and routes controlled patches", () => {
    let requests = 0;
    const patches: unknown[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="frame-auto"
      layout={{
        mode: "horizontal",
        gap: 8,
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
        align: "mc",
        widthMode: "fixed",
        heightMode: "hug",
        clipsContent: false,
        textBaseline: false,
        strokeSizing: "excluded",
        canvasStacking: "last-on-top",
      }}
      onLayoutChange={patch => patches.push(patch)}
      onAutoLayoutSettingsRequest={() => { requests += 1; }}
    />); });
    const triggers = renderer!.root.findAll(node => node.type === "button" && node.props["aria-label"] === "Auto-layout settings");
    expect(triggers).toHaveLength(1);
    act(() => triggers[0].props.onClick());
    let dialogs = renderer!.root.findAllByType(AutoLayoutSettingsDialog);
    expect(dialogs.map(dialog => dialog.props.open)).toEqual([true]);
    act(() => dialogs[0].props.onChange({ strokeSizing: "included" }));
    expect(requests).toBe(1);
    expect(patches).toEqual([{ strokeSizing: "included" }]);
    act(() => renderer!.unmount());
  });

  it("disables the settings trigger for a non-authorable selection", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="frame-auto"
      layout={{
        mode: "horizontal",
        gap: 8,
        padding: { top: 8, right: 8, bottom: 8, left: 8 },
        align: "mc",
        widthMode: "fixed",
        heightMode: "hug",
        clipsContent: false,
        autoLayoutSettingsDisabled: true,
      }}
    />); });
    const triggers = renderer!.root.findAll(node => node.type === "button" && node.props["aria-label"] === "Auto-layout settings");
    expect(triggers).toHaveLength(1);
    expect(triggers.every(trigger => trigger.props.disabled)).toBe(true);
    act(() => renderer!.unmount());
  });
});
