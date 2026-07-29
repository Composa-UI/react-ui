import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
import { Button } from "./Button";
import { NumericComboInput, NumericInput, NumericPairInput } from "./Input";
import { MenuRow, PopoverMenu } from "./Menu";
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
  it("routes the controlled text resizing projection through a segmented control", () => {
    const modes: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="text"
      textSizingMode="auto-height"
      availableTextSizingModes={["auto-width", "fixed-size"]}
      onTextSizingModeChange={mode => modes.push(mode)}
    />); });
    // Text resizing is a segmented control (not a dropdown): its options are
    // inline buttons, one per available mode. Clicking one emits that mode.
    const group = renderer!.root.findAll(node => node.props?.["aria-label"] === "Text resizing" && node.props?.role === "group")[0];
    const fixed = group.findAll(node => node.props?.["aria-label"] === "Fixed size" && typeof node.type === "string" && node.type === "button")[0];
    act(() => fixed.props.onClick());
    expect(modes).toEqual(["fixed-size"]);
    // No dropdown/menu trigger for text resizing — the control is fully inline.
    expect(renderer!.root.findAllByType(PopoverMenu)
      .some(item => item.props.trigger?.props?.ariaLabel?.startsWith("Text resizing:"))).toBe(false);
    // Owner ask: the segments carry icons, not text labels — each segment
    // button renders an svg child rather than a text-label node.
    const iconSegment = group.findAll(node => node.props?.["aria-label"] === "Auto width" && node.type === "button")[0];
    expect(iconSegment.findAllByType("svg").length).toBeGreaterThan(0);
    act(() => renderer!.unmount());
  });

  it("caps the blend-mode menu height so the long list scrolls instead of growing unbounded", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" blendMode="Normal" />); });
    const blendPopover = renderer!.root.findAllByType(PopoverMenu).find(item => {
      const trigger = item.props.trigger?.props ?? {};
      return trigger.label === "Blend mode" || trigger.ariaLabel?.startsWith("Blend mode");
    });
    expect(blendPopover).toBeTruthy();
    // The PopoverMenu content render-prop returns the shared blend Menu, which
    // must carry a fixed max-height so its overflow scrolls (owner ask #504).
    const menuEl = blendPopover!.props.children(() => undefined);
    expect(menuEl.props.maxHeight).toBe(280);
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

    const getForm = () => getMenu().props.children.flat(Infinity)
      .find((child: { props?: { "aria-label"?: string } }) => child?.props?.["aria-label"] === "Custom project canvas size");
    // The custom editor stacks its fields vertically (owner ask #4): W, then H,
    // (then Frame rate when supplied) — each a direct full-width child — so the
    // fields are addressed by aria-label rather than a horizontal W|H pair row.
    type El = { props?: { ariaLabel?: string; label?: string; className?: string; children?: unknown; onChange?: (v: number) => void; onClick?: () => void } };
    const fieldByLabel = (label: string): El => (getForm().props.children as El[])
      .filter(Boolean).find(child => child?.props?.ariaLabel === label)!;
    act(() => fieldByLabel("Custom canvas width").props!.onChange!(1440));
    act(() => fieldByLabel("Custom canvas height").props!.onChange!(900));

    const buttons = (getForm().props.children as El[]).filter(Boolean)
      .find(child => typeof child?.props?.className === "string" && child.props.className.includes("justify-end"))!;
    const apply = (buttons.props!.children as El[]).find(child => child?.props?.label === "Apply")!;
    act(() => apply.props!.onClick!());
    expect(sizes).toEqual([{ width: 1440, height: 900 }]);
    act(() => renderer!.unmount());
  });

  it("folds frame rate into the top-right canvas control", () => {
    const rates: number[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="shape"
      projectWidth={1920}
      projectHeight={1080}
      projectFrameRate={30}
      onProjectFrameRateChange={rate => rates.push(rate)}
    />); });
    const menu = renderer!.root.findAllByType(PopoverMenu)
      .find(item => item.props.trigger.props.ariaLabel?.startsWith("Project canvas size:"))!
      .props.children(() => undefined);
    // The canvas dropdown owns a Frame rate control (moved out of the project
    // inspector's Canvas section). Its ChoiceDropdown is a PopoverMenu whose
    // trigger reads "Frame rate: 30 fps".
    type El = { props?: { children?: unknown; ariaLabel?: string; "aria-label"?: string; value?: string; onChange?: (v: string) => void } };
    const flat = (menu.props.children as El[]).flat(Infinity) as El[];
    const frameRateBlock = flat.find(child => child?.props?.["aria-label"] === "Project frame rate")!;
    expect(frameRateBlock).toBeTruthy();
    // The block holds a Frame-rate ChoiceDropdown reflecting the current 30 fps.
    const choice = (frameRateBlock.props!.children as El[]).find(child => child?.props?.ariaLabel === "Frame rate")!;
    expect(choice.props!.value).toBe("30");
    act(() => choice.props!.onChange!("60"));
    expect(rates).toEqual([60]);
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

describe("Inspector Mixed values (Composa#406)", () => {
  const numericByLabel = (root: ReactTestInstance, label: string) =>
    root.findAllByType(NumericInput).find(input => input.props.ariaLabel === label)!;

  it("renders the Mixed state for differing transform/appearance values across a multi-selection", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel
      elementType="shape"
      multiSelect
      x={10} y={20} rotation={0} opacity={100} cornerRadius={4}
      xMixed yMixed rotationMixed opacityMixed cornerRadiusMixed
    />); });
    for (const label of ["Position X", "Position Y", "Rotation", "Opacity", "Corner radius"]) {
      const field = numericByLabel(renderer!.root, label);
      expect(field.props.mixed).toBe(true);
    }
    act(() => renderer!.unmount());
  });

  it("keeps single-value fields unmixed", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" x={10} y={20} rotation={0} opacity={100} />); });
    for (const label of ["Position X", "Position Y", "Rotation", "Opacity"]) {
      expect(numericByLabel(renderer!.root, label).props.mixed).toBeFalsy();
    }
    act(() => renderer!.unmount());
  });

  it("renders the combined Position row per-axis Mixed", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" multiSelect positionPresentation="combined" x={1} y={2} xMixed yMixed />); });
    const pair = renderer!.root.findAllByType(NumericPairInput)[0];
    expect(pair.props.a.mixed).toBe(true);
    expect(pair.props.b.mixed).toBe(true);
    act(() => renderer!.unmount());
  });

  it("propagates numeric W/H Mixed through the sizing combo value field", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<DimensionSizingFields width={100} height={50} widthValueMixed heightValueMixed />); });
    const width = renderer!.root.findAllByType(SizingComboField).find(f => f.props.axis === "width")!;
    const height = renderer!.root.findAllByType(SizingComboField).find(f => f.props.axis === "height")!;
    expect(width.props.valueMixed).toBe(true);
    expect(height.props.valueMixed).toBe(true);
    const widthCombo = renderer!.root.findAllByType(NumericComboInput).find(c => c.props.ariaLabel === "Width")!;
    expect(widthCombo.props.mixed).toBe(true);
    act(() => renderer!.unmount());
  });
});

describe("More alignment menu (Composa#406)", () => {
  const moreMenuContent = (root: ReactTestInstance) => {
    const popover = root.findAllByType(PopoverMenu)
      .find(item => item.props.trigger?.props?.label === "More alignment")!;
    return popover.props.children(() => undefined);
  };

  it("only exposes the More alignment overflow for multi-selection", () => {
    let single: ReturnType<typeof create>;
    act(() => { single = create(<PropertyPanel elementType="shape" onAlignmentAction={() => undefined} />); });
    expect(single!.root.findAllByType(PopoverMenu).some(item => item.props.trigger?.props?.label === "More alignment")).toBe(false);
    act(() => single!.unmount());

    let multi: ReturnType<typeof create>;
    act(() => { multi = create(<PropertyPanel elementType="shape" multiSelect onAlignmentAction={() => undefined} />); });
    expect(multi!.root.findAllByType(PopoverMenu).some(item => item.props.trigger?.props?.label === "More alignment")).toBe(true);
    act(() => multi!.unmount());
  });

  it("routes distribute and tidy-up commands through the host callback", () => {
    const actions: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="shape" multiSelect onAlignmentAction={action => actions.push(action)} />); });
    const rows = moreMenuContent(renderer!.root).props.children.flat(Infinity);
    for (const label of ["Distribute horizontal spacing", "Distribute vertical spacing", "Tidy up"]) {
      const row = rows.find((child: { props?: { label?: string } }) => child?.props?.label === label);
      if (!row?.props?.onClick) throw new Error(`Missing interactive row: ${label}`);
      act(() => row.props.onClick());
    }
    expect(actions).toEqual(["distribute-horizontal", "distribute-vertical", "tidy-up"]);
    act(() => renderer!.unmount());
  });
});

describe("Present/Preview split button (Composa#575)", () => {
  const findButton = (root: ReactTestInstance, label: string) =>
    root.findAll(node => node.type === "button" && node.props["aria-label"] === label)[0];
  const menuRow = (root: ReactTestInstance, label: string) =>
    root.findAllByType(MenuRow).find(row => row.props.label === label);

  it("presents from the primary segment and opens a Present/Preview menu from the chevron", () => {
    let presents = 0;
    let previews = 0;
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<PropertyPanel mode="project"
        onPreviewToggle={() => { presents += 1; }}
        onPreviewOpen={() => { previews += 1; }}
        previewAvailable />);
    });
    const root = renderer!.root;

    // Primary segment presents immediately.
    act(() => findButton(root, "Present").props.onClick());
    expect(presents).toBe(1);

    // Menu is closed until the chevron is used — no rows in the tree yet.
    expect(root.findAllByType(MenuRow).length).toBe(0);
    expect(findButton(root, "Present and preview options").props["aria-expanded"]).toBe(false);

    // Chevron opens the menu with Present + Preview rows.
    act(() => findButton(root, "Present and preview options").props.onClick());
    expect(findButton(root, "Present and preview options").props["aria-expanded"]).toBe(true);
    expect(menuRow(root, "Present")).toBeTruthy();
    const preview = menuRow(root, "Preview")!;
    expect(preview.props.disabled).toBe(false);

    // Preview row routes to the floating-preview handler and closes the menu.
    act(() => preview.props.onClick());
    expect(previews).toBe(1);
    expect(root.findAllByType(MenuRow).length).toBe(0);
    act(() => renderer!.unmount());
  });

  it("disables the Preview menu row with a reason when preview is unavailable", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel mode="project" onPreviewToggle={() => undefined} />); });
    const root = renderer!.root;

    act(() => findButton(root, "Present and preview options").props.onClick());
    const preview = menuRow(root, "Preview")!;
    expect(preview.props.disabled).toBe(true);
    expect(preview.props.disabledReason).toBe("Preview unavailable");
    expect(preview.props.onClick).toBeUndefined();
    act(() => renderer!.unmount());
  });

  it("keeps Share as a separate button beside the split button (not inside the split group)", () => {
    let shares = 0;
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<PropertyPanel mode="project"
        onPreviewToggle={() => undefined}
        onShare={() => { shares += 1; }} />);
    });
    const root = renderer!.root;
    // Share is a standalone Button, distinct from the split button's segments.
    const share = root.findAllByType(Button).find(button => button.props.label === "Share")!;
    expect(share).toBeTruthy();
    act(() => share.props.onClick());
    expect(shares).toBe(1);
    act(() => renderer!.unmount());
  });
});
