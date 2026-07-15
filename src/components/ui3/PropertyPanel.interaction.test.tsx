import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
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
  it("routes both settings triggers to the same host callback", () => {
    let requests = 0;
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="frame-auto" onAutoLayoutSettingsRequest={() => { requests += 1; }} />); });
    const triggers = renderer!.root.findAll(node => node.type === "button" && node.props["aria-label"] === "Auto-layout settings");
    expect(triggers).toHaveLength(2);
    act(() => triggers.forEach(trigger => trigger.props.onClick()));
    expect(requests).toBe(2);
    act(() => renderer!.unmount());
  });
});

describe("Plain-frame layout actions", () => {
  it("routes Resize to fit to the host callback", () => {
    let requests = 0;
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<PropertyPanel elementType="frame" onResizeToFit={() => { requests += 1; }} />); });
    const trigger = renderer!.root.find(node => node.type === "button" && node.props["aria-label"] === "Resize to fit");
    act(() => trigger.props.onClick());
    expect(requests).toBe(1);
    act(() => renderer!.unmount());
  });
});
