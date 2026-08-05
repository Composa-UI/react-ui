import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Link2, Link2Off } from "lucide-react";
import { DimensionSizingFields, PropertyPanel, type ElementSizingAxis, type ElementSizingChange } from "./PropertyPanel";

// Iteration-3 owner feedback, inspector toggles.
//
//  1. Aspect-ratio chain link is SWAPPED. Owner, verbatim: "I still swapped.
//     Slash to me means its locked and I want to unlock it. No slash link means
//     I want to link it together to lock it." So the glyph reports the CURRENT
//     state: SLASHED (Link2Off) = locked now, UNSLASHED (Link2) = free now.
//     A previous pass (7a7b27f, Composa#661 item 5) fixed the aspect lock's
//     BEHAVIOUR and never touched the glyph expression, which is why the owner
//     saw no change. Both chain-link rows in the inspector are covered here —
//     Dimensions and Scale — because they were written out separately.
//
//  2. Detaching X/Y was one-way: the 'separate' Position row rendered no
//     rightAction at all, so pressing "Separate dimensions" destroyed the only
//     control that could undo it.
//
// Every assertion is scoped to a named control, and each negative is preceded by
// a positive that proves the surrounding row rendered.

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** The `button` host node carrying this aria-label. Throws if it is not there. */
function actionButton(renderer: ReactTestRenderer, label: string): ReactTestInstance {
  const matches = renderer.root.findAll(node => node.type === "button" && node.props?.["aria-label"] === label);
  expect(matches, `expected exactly one button labelled "${label}"`).toHaveLength(1);
  return matches[0];
}

/** The lucide component rendered inside a PanelActionBtn — its `icon` child. */
const iconTypeOf = (button: ReactTestInstance): unknown =>
  (button.props.children as { type?: unknown } | undefined)?.type;

describe("aspect-lock chain link reports the CURRENT lock state", () => {
  type Emitted = [ElementSizingAxis, ElementSizingChange];

  it("Dimensions: unslashed while free, slashed while locked — and slashed is the state that pairs the axes", () => {
    const emitted: Emitted[] = [];
    let renderer: ReactTestRenderer;
    act(() => {
      renderer = create(<DimensionSizingFields
        width={100} height={50}
        onSizingChange={(axis, change) => emitted.push([axis, change])}
      />);
    });
    const lock = () => actionButton(renderer, "Lock aspect ratio");

    // At rest the axes are free, so the link must NOT be slashed.
    expect(iconTypeOf(lock())).toBe(Link2);
    expect(lock().props["aria-pressed"]).toBe(false);
    expect(lock().props.className).not.toContain("bg-c-bg-selected");

    // …and a width edit must move width only. The positive assertion on the
    // width emit is what stops the missing height emit being vacuous.
    act(() => renderer.root.findAll(n => n.type === "input" && n.props?.["aria-label"] === "Width")[0].props.onChange({ target: { value: "200" } }));
    expect(emitted).toEqual([["width", { mode: "fixed", value: 200 }]]);

    // Press it: now locked, so the link must be SLASHED.
    act(() => lock().props.onClick());
    expect(iconTypeOf(lock())).toBe(Link2Off);
    expect(lock().props["aria-pressed"]).toBe(true);
    expect(lock().props.className).toContain("bg-c-bg-selected");
    expect(lock().props.className).toContain("text-c-text-brand");

    // The slashed state is the one that pairs the axes. This ties the glyph to
    // the behaviour so the two can never drift apart again.
    emitted.length = 0;
    act(() => renderer.root.findAll(n => n.type === "input" && n.props?.["aria-label"] === "Width")[0].props.onChange({ target: { value: "300" } }));
    expect(emitted).toEqual([
      ["width", { mode: "fixed", value: 300 }],
      ["height", { mode: "fixed", value: 150 }],
    ]);

    // Press again: back to free, back to the unslashed link.
    act(() => lock().props.onClick());
    expect(iconTypeOf(lock())).toBe(Link2);

    act(() => renderer.unmount());
  });

  it("Scale: same mapping, and it starts slashed because scale starts locked", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="shape" scaleApplicable />); });
    const lock = () => actionButton(renderer, "Lock scale aspect ratio");

    // scaleLocked defaults to true — the Scale row is locked at rest, so it
    // opens SLASHED. Under the conventional "icon shows the action" reading this
    // looks inverted; under the owner's it is correct.
    expect(iconTypeOf(lock())).toBe(Link2Off);
    expect(lock().props["aria-pressed"]).toBe(true);
    expect(lock().props.className).toContain("bg-c-bg-selected");
    act(() => lock().props.onClick());
    expect(iconTypeOf(lock())).toBe(Link2);
    expect(lock().props["aria-pressed"]).toBe(false);

    act(() => renderer.unmount());
  });

  it("the two chain links in one inspector never contradict each other", () => {
    // The regression this guards is not "one icon is wrong" but "the Dimensions
    // link and the Scale link disagree about what a slash means".
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel elementType="shape" scaleApplicable />); });
    const dimensions = actionButton(renderer, "Lock aspect ratio");
    const scale = actionButton(renderer, "Lock scale aspect ratio");

    // Dimensions starts unlocked, Scale starts locked — so at rest they must
    // show DIFFERENT glyphs, each drawn from the same {locked → slashed} map.
    expect(iconTypeOf(dimensions)).toBe(Link2);
    expect(iconTypeOf(scale)).toBe(Link2Off);

    act(() => renderer.unmount());
  });
});

describe("separated X/Y can be re-attached (iteration-3)", () => {
  const render = (props: Parameters<typeof PropertyPanel>[0]) => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<PropertyPanel {...props} />); });
    return renderer!;
  };

  it("keeps a combine affordance on the separated row and reports 'combined'", () => {
    const onPositionPresentationChange = vi.fn();
    const renderer = render({ elementType: "shape", positionPresentation: "separate", onPositionPresentationChange });

    // Prove we are on the separated row before asserting anything about its
    // trailing control — two independent X and Y fields, not one paired field.
    expect(renderer.root.findAll(n => n.type === "input" && n.props?.["aria-label"] === "Position X")).toHaveLength(1);
    expect(renderer.root.findAll(n => n.type === "input" && n.props?.["aria-label"] === "Position Y")).toHaveLength(1);
    // The separate-only affordance must be gone; the combine one present.
    expect(renderer.root.findAll(n => n.type === "button" && n.props?.["aria-label"] === "Separate dimensions")).toHaveLength(0);

    const combine = actionButton(renderer, "Combine dimensions");
    act(() => combine.props.onClick());
    expect(onPositionPresentationChange).toHaveBeenCalledTimes(1);
    expect(onPositionPresentationChange).toHaveBeenCalledWith("combined");

    act(() => renderer.unmount());
  });

  it("round-trips: combined offers separate, separate offers combine", () => {
    const onPositionPresentationChange = vi.fn();
    const combined = render({ elementType: "shape", positionPresentation: "combined", onPositionPresentationChange });
    const separateAction = actionButton(combined, "Separate dimensions");
    expect(iconTypeOf(separateAction)).toBe(Link2Off);
    act(() => separateAction.props.onClick());
    expect(onPositionPresentationChange).toHaveBeenLastCalledWith("separate");
    expect(combined.root.findAll(n => n.type === "button" && n.props?.["aria-label"] === "Combine dimensions")).toHaveLength(0);
    act(() => combined.unmount());

    const separate = render({ elementType: "shape", positionPresentation: "separate", onPositionPresentationChange });
    const combineAction = actionButton(separate, "Combine dimensions");
    expect(iconTypeOf(combineAction)).toBe(Link2);
    act(() => combineAction.props.onClick());
    expect(onPositionPresentationChange).toHaveBeenLastCalledWith("combined");
    act(() => separate.unmount());
  });

  it("offers no combine when the host forces separation (no callback)", () => {
    // The master view pins presentation to 'separate' and passes no callback.
    // A combine button there would promise a change the host cannot honour.
    const renderer = render({ elementType: "shape", positionPresentation: "separate" });
    expect(renderer.root.findAll(n => n.type === "input" && n.props?.["aria-label"] === "Position X")).toHaveLength(1);
    expect(renderer.root.findAll(n => n.type === "button" && n.props?.["aria-label"] === "Combine dimensions")).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
