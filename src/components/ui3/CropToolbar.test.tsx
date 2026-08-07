import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { CanvasCropOverlay, CropToolbar } from "./CropToolbar";
import { MenuRow, PopoverMenu } from "./Menu";

describe("CropToolbar", () => {
  it("exposes resize, aspect, and completion without owning document state", () => {
    const calls: string[] = [];
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<CropToolbar aspect="16:9" onAspectChange={value => calls.push(value)} onResizeToFill={() => calls.push("fill")} zoom={1} onZoomChange={value => calls.push(`zoom:${value}`)} onCancel={() => calls.push("cancel")} onDone={() => calls.push("done")} />); });
    expect(renderer.root.findByProps({ role: "toolbar" }).props["aria-label"]).toBe("Crop tools");
    act(() => renderer.root.findByProps({ "aria-label": "Crop zoom" }).props.onChange({ target: { value: "1.5" } }));
    act(() => renderer.root.findByProps({ ariaLabel: "Resize to fill" }).props.onClick());
    act(() => renderer.root.findByProps({ label: "Cancel" }).props.onClick());
    act(() => renderer.root.findByProps({ ariaLabel: "Done" }).props.onClick());
    expect(calls).toEqual(["zoom:1.5", "fill", "cancel", "done"]);

    const popover = renderer.root.findByType(PopoverMenu);
    let menu!: ReactTestRenderer;
    act(() => { menu = create(popover.props.children(() => calls.push("closed"))); });
    const rows = menu.root.findAllByType(MenuRow);
    expect(rows.map(row => row.props.label)).toEqual(["Free", "Original", "1:1", "4:3", "16:9"]);
    act(() => rows.find(row => row.props.label === "4:3")!.props.onClick());
    expect(calls).toEqual(["zoom:1.5", "fill", "cancel", "done", "4:3", "closed"]);
  });

  it("publishes pointer start, incremental deltas, and one end for pointer up/cancel", () => {
    const calls: unknown[] = [];
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<CanvasCropOverlay onMove={(x, y) => calls.push([x, y])} onMoveStart={() => calls.push("start")} onMoveEnd={() => calls.push("end")} />); });
    const overlay = renderer.root.findByProps({ "data-composa-crop-overlay": true });
    expect(overlay.props.className).toContain("cursor-move");
    expect(overlay.props.style.border).toBe("2px solid var(--color-border-selected)");
    expect(overlay.props.style.backgroundImage).toContain("linear-gradient");
    const target = { setPointerCapture: (id: number) => calls.push(["capture", id]), onpointermove: null as null | ((event: { clientX: number; clientY: number }) => void), onpointerup: null as null | (() => void), onpointercancel: null as null | (() => void) };
    act(() => overlay.props.onPointerDown({ button: 0, clientX: 10, clientY: 20, pointerId: 7, currentTarget: target, preventDefault: () => calls.push("prevent"), stopPropagation: () => calls.push("stop") }));
    target.onpointermove!({ clientX: 16, clientY: 24 });
    target.onpointermove!({ clientX: 19, clientY: 30 });
    target.onpointercancel!();
    expect(calls).toEqual(["prevent", "stop", "start", ["capture", 7], [6, 4], [3, 6], "end"]);
    expect(target.onpointermove).toBeNull();
    expect(target.onpointerup).toBeNull();
    expect(target.onpointercancel).toBeNull();
  });
});
