import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { AutoLayoutSettingsDialog } from "./AutoLayoutSettingsDialog";
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
});

describe("Auto-layout settings interactions", () => {
  it("opens one anchored dialog from either settings trigger and routes controlled patches", () => {
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
    expect(triggers).toHaveLength(2);
    act(() => triggers[0].props.onClick());
    let dialogs = renderer!.root.findAllByType(AutoLayoutSettingsDialog);
    expect(dialogs.map(dialog => dialog.props.open)).toEqual([true, false]);
    act(() => dialogs[0].props.onChange({ strokeSizing: "included" }));
    act(() => triggers[1].props.onClick());
    dialogs = renderer!.root.findAllByType(AutoLayoutSettingsDialog);
    expect(dialogs.map(dialog => dialog.props.open)).toEqual([false, true]);
    expect(requests).toBe(2);
    expect(patches).toEqual([{ strokeSizing: "included" }]);
    act(() => renderer!.unmount());
  });

  it("disables both settings triggers for a non-authorable selection", () => {
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
    expect(triggers).toHaveLength(2);
    expect(triggers.every(trigger => trigger.props.disabled)).toBe(true);
    act(() => renderer!.unmount());
  });
});
