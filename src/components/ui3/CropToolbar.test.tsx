import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { CanvasCropOverlay, CropToolbar } from "./CropToolbar";

describe("CropToolbar", () => {
  it("exposes resize, aspect, and completion without owning document state", () => {
    const calls: string[] = [];
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<CropToolbar aspect="16:9" onAspectChange={value => calls.push(value)} onResizeToFit={() => calls.push("fit")} onDone={() => calls.push("done")} />); });
    expect(renderer.root.findByProps({ role: "toolbar" }).props["aria-label"]).toBe("Crop tools");
    act(() => renderer.root.findByProps({ label: "Resize to fit" }).props.onClick());
    act(() => renderer.root.findByProps({ label: "Done" }).props.onClick());
    expect(calls).toEqual(["fit", "done"]);
  });

  it("publishes a move-cursor crop overlay", () => {
    let renderer!: ReactTestRenderer;
    act(() => { renderer = create(<CanvasCropOverlay onMove={() => undefined} />); });
    const overlay = renderer.root.findByProps({ "data-composa-crop-overlay": true });
    expect(overlay.props.className).toContain("cursor-move");
  });
});
