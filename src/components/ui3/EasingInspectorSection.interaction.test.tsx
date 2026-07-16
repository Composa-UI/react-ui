import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { EasingInspectorSection } from "./EasingInspectorSection";
import { NumericInput } from "./Input";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("EasingInspectorSection interactions", () => {
  it("emits Custom for numeric and keyboard handle edits", () => {
    const changes: unknown[] = [], lifecycle: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<EasingInspectorSection value={{ preset: "ease-out", editable: true }}
      onChange={value => changes.push(value)}
      onCurveEditStart={() => lifecycle.push("start")}
      onCurveEditCommit={() => lifecycle.push("commit")} />); });

    const x1 = renderer!.root.findAllByType(NumericInput).find(input => input.props.ariaLabel === "Easing X1")!;
    act(() => x1.props.onChange(0.4));
    expect(changes[0]).toEqual({ preset: "custom", controlPoints: [0.4, 0, 0.58, 1] });

    act(() => { renderer!.update(<EasingInspectorSection value={{ preset: "custom", controlPoints: [0.4, 0, 0.58, 1], editable: true }}
      onChange={value => changes.push(value)}
      onCurveEditStart={() => lifecycle.push("start")}
      onCurveEditCommit={() => lifecycle.push("commit")} />); });
    const handle = renderer!.root.findAll(node => node.props["aria-label"] === "Easing control point 1")[0];
    act(() => handle.props.onKeyDown({ key: "ArrowUp", shiftKey: false, preventDefault() {}, stopPropagation() {} }));
    expect(changes[1]).toEqual({ preset: "custom", controlPoints: [0.4, 0.01, 0.58, 1] });
    expect(lifecycle).toEqual(["start", "commit"]);
    act(() => renderer!.unmount());
  });

  it("restores and cancels an active pointer edit exactly once when context unmounts", () => {
    const changes: unknown[] = [], lifecycle: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<EasingInspectorSection
      value={{ preset: "custom", controlPoints: [0.2, -0.1, 0.75, 1.15], editable: true, interactionKey: "first" }}
      onChange={value => changes.push(value)}
      onCurveEditStart={() => lifecycle.push("start")}
      onCurveEditCancel={() => lifecycle.push("cancel")} />); });
    const handle = renderer!.root.findAll(node => node.props["aria-label"] === "Easing control point 1")[0];
    act(() => handle.props.onPointerDown({
      button: 0, isPrimary: true, pointerId: 7, preventDefault() {},
      currentTarget: { setPointerCapture() {} },
    }));
    expect(lifecycle).toEqual(["start"]);
    act(() => renderer!.unmount());
    expect(changes).toEqual([{ preset: "custom", controlPoints: [0.2, -0.1, 0.75, 1.15] }]);
    expect(lifecycle).toEqual(["start", "cancel"]);
  });
});
