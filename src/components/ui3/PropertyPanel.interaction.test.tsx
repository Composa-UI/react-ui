import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { Button } from "./Button";
import { NumericComboInput, NumericInput } from "./Input";
import { PopoverMenu } from "./Menu";
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
    for (const label of ["Fixed width (320)", "Hug contents", "Fill container"]) {
      const row = rows.find((child: { props?: { label?: string } }) => child?.props?.label === label);
      expect(row?.props?.type).toBe("checkmark");
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

describe("Position alignment actions", () => {
  it("routes all six stateless commands through the host callback", () => {
    const actions: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" onAlignmentAction={action => actions.push(action)} />); });
    for (const label of ["Align left", "Align center", "Align right", "Align top", "Align middle", "Align bottom"]) {
      const button = renderer!.root.findAllByType("button").find(candidate => candidate.props["aria-label"] === label)!;
      expect(button.props["aria-pressed"]).toBeUndefined();
      act(() => button.props.onClick());
    }
    expect(actions).toEqual(["left", "center-x", "right", "top", "center-y", "bottom"]);
    act(() => renderer!.unmount());
  });

  it("changes only the UI-owned position presentation from the combined row", () => {
    const presentations: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="shape"
      positionPresentation="combined"
      onPositionPresentationChange={value => presentations.push(value)}
    />); });
    const separate = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Separate dimensions")!;
    act(() => separate.props.onClick());
    expect(presentations).toEqual(["separate"]);
    act(() => renderer!.unmount());
  });
});

describe("Inspector capability controls", () => {
  it("routes the controlled text resizing projection without changing dimensions locally", () => {
    const modes: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="text"
      textSizingMode="auto-height"
      availableTextSizingModes={["auto-width", "fixed-size"]}
      onTextSizingModeChange={mode => modes.push(mode)}
    />); });
    const popover = renderer!.root.findAllByType(PopoverMenu)
      .find(item => item.props.trigger.props.ariaLabel?.startsWith("Text resizing:"))!;
    const menu = popover.props.children(() => undefined);
    const fixed = menu.props.children.find((row: { props?: { label?: string } }) => row?.props?.label === "Fixed size");
    act(() => fixed.props.onClick());
    expect(modes).toEqual(["fixed-size"]);
    act(() => renderer!.unmount());
  });

  it("emits one atomic project canvas-size value and exposes the custom route", () => {
    const sizes: unknown[] = [];
    let customRequests = 0;
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="shape"
      projectWidth={1920}
      projectHeight={1080}
      onProjectCanvasSizeChange={size => sizes.push(size)}
      onCustomProjectCanvasSizeRequest={() => { customRequests += 1; }}
    />); });
    const popover = renderer!.root.findAllByType(PopoverMenu)
      .find(item => item.props.trigger.props.ariaLabel?.startsWith("Project canvas size:"))!;
    const menu = popover.props.children(() => undefined);
    const rows = menu.props.children.flat(Infinity);
    const square = rows.find((row: { props?: { label?: string } }) => row?.props?.label === "Square (1080 × 1080)");
    const custom = rows.find((row: { props?: { label?: string } }) => row?.props?.label === "Custom project canvas size…");
    act(() => square.props.onClick());
    act(() => custom.props.onClick());
    expect(sizes).toEqual([{ width: 1080, height: 1080 }]);
    expect(customRequests).toBe(1);
    act(() => renderer!.unmount());
  });

  it("authors a custom canvas size directly when the host exposes the atomic size mutation", () => {
    const sizes: unknown[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="shape"
      projectWidth={1920}
      projectHeight={1080}
      onProjectCanvasSizeChange={size => sizes.push(size)}
    />); });
    const getMenu = () => {
      const popover = renderer!.root.findAllByType(PopoverMenu)
        .find(item => item.props.trigger.props.ariaLabel?.startsWith("Project canvas size:"))!;
      return popover.props.children(() => undefined);
    };
    const initialRows = getMenu().props.children.flat(Infinity);
    const custom = initialRows.find((row: { props?: { label?: string } }) => row?.props?.label === "Custom project canvas size…");
    act(() => custom.props.onClick());

    let form = getMenu().props.children.flat(Infinity)
      .find((child: { props?: { "aria-label"?: string } }) => child?.props?.["aria-label"] === "Custom project canvas size");
    let fields = form.props.children[0].props.children;
    act(() => fields[0].props.onChange(1440));
    act(() => fields[1].props.onChange(900));

    form = getMenu().props.children.flat(Infinity)
      .find((child: { props?: { "aria-label"?: string } }) => child?.props?.["aria-label"] === "Custom project canvas size");
    const apply = form.props.children[1].props.children[1];
    act(() => apply.props.onClick());
    expect(sizes).toEqual([{ width: 1440, height: 900 }]);
    act(() => renderer!.unmount());
  });

  it("routes Share only when the host supplies an access surface", () => {
    let shares = 0;
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" onShare={() => { shares += 1; }} />); });
    const share = renderer!.root.findAllByType(Button).find(button => button.props.label === "Share")!;
    act(() => share.props.onClick());
    expect(shares).toBe(1);
    act(() => renderer!.unmount());
  });

  it("keeps the durable account action when live presence is disabled", () => {
    let accountOpens = 0;
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" presenceControlsEnabled={false}
      onAccountMenu={() => { accountOpens += 1; }} />); });
    const account = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Account menu")!;
    act(() => account.props.onClick());
    expect(accountOpens).toBe(1);
    expect(renderer!.root.findAllByType("button").some(button => button.props["aria-label"] === "Presence and spotlight")).toBe(false);
    act(() => renderer!.unmount());
  });

  it("routes rotate and flip actions through explicit host callbacks", () => {
    const actions: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape"
      onRotate90Clockwise={() => actions.push("rotate")}
      onFlipHorizontal={() => actions.push("flip-x")}
      onFlipVertical={() => actions.push("flip-y")} />); });
    for (const [label, expected] of [
      ["Rotate 90° CW", "rotate"],
      ["Flip horizontal", "flip-x"],
      ["Flip vertical", "flip-y"],
    ] as const) {
      const button = renderer!.root.findAllByType("button").find(item => item.props["aria-label"] === label)!;
      act(() => button.props.onClick());
      expect(actions[actions.length - 1]).toBe(expected);
    }
    act(() => renderer!.unmount());
  });
});

describe("Smart-selection spacing interactions", () => {
  it("routes the Layout spacing field through the host-controlled callback", () => {
    const changes: number[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="shape"
      width={120}
      height={80}
      spatialSelectionLayout={{ axis: "y", gap: 18, onGapChange: value => changes.push(value) }}
    />); });

    const input = renderer!.root.findAllByType(NumericInput)
      .find(candidate => candidate.props.ariaLabel === "Vertical spacing gap")!;
    expect(input.props.value).toBe(18);
    act(() => input.props.onChange(27));
    expect(changes).toEqual([27]);
    act(() => renderer!.unmount());
  });
});

describe("Auto-layout settings interactions", () => {
  it("uses Freeform as the controlled disable-auto-layout action", () => {
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
      }}
      onLayoutChange={patch => patches.push(patch)}
    />); });
    const freeform = renderer!.root.findAllByType("button").find(button => button.props["aria-label"] === "Freeform")!;
    act(() => freeform.props.onClick());
    expect(patches).toEqual([{ mode: "none" }]);
    act(() => renderer!.unmount());
  });

  it("expands controlled padding to four labelled physical sides when any side differs or is mixed", () => {
    const patches: unknown[] = [];
    const sideEdits: unknown[] = [];
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
      onPaddingChange={(padding, changedEdges) => sideEdits.push({ padding, changedEdges })}
    />); });
    expect(labels()).toEqual(expect.arrayContaining(["Top padding", "Right padding", "Bottom padding", "Left padding"]));
    const left = renderer!.root.findAllByType(NumericInput).find(input => input.props.ariaLabel === "Left padding")!;
    act(() => left.props.onChange(32));
    expect(sideEdits).toEqual([{
      padding: { top: 8, right: 8, bottom: 8, left: 32 },
      changedEdges: ["left"],
    }]);

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
