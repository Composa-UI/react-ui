import { renderToStaticMarkup } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ACTION_STYLE_OPTIONS, AnimatePanel, type ObjectAnimationItem } from "./AnimatePanel";
import { PopoverMenu } from "./Menu";
import { AnimationStylesDialog } from "./AnimationStylesDialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ANIMS: ObjectAnimationItem[] = [
  { id: "a1", n: 1, name: "Title", kind: "In", duration: "0.6s", style: "fade-in", buildDuration: "600ms" },
  { id: "a2", n: 2, name: "Subtitle", kind: "In", duration: "0.4s", style: "slide-in", buildDuration: "400ms", direction: "left", selected: true },
  { id: "a3", n: 3, name: "Body", kind: "Action", duration: "0.5s", style: "pulse" },
];

// Composa-App/Composa#174
describe("AnimatePanel — Comp transition reflects the slide's real value (issue #174)", () => {
  it("shows the slide's real 'None' — not a phantom 'Fade' — when an element is selected", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    expect(html).toContain(">None<");
    expect(html).not.toContain(">Fade<");
  });

  it("still reflects None even when compTransition is forwarded to an element (no internal demo fallback)", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={[]} />,
    );
    expect(html).not.toContain(">Fade<");
  });
});

describe("AnimatePanel — object tint and exact-card focus stay distinct (issue #305)", () => {
  it("slide selection expands the Comp transition card by default", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="slide" compTransition={{ style: "push", direction: "right", durationMs: 500, easing: "ease-in-out" }} anims={ANIMS} />,
    );
    // Expanded Comp transition card renders the selection-blue header + the editable Style row.
    expect(html).toContain("bg-c-bg-selected");
    expect(html).toContain(">Push<");
    // No object-animation card is auto-expanded for a slide selection: the per-phase
    // body label ("Build in") only renders inside an expanded card.
    expect(html).not.toContain(">Build in<");
  });

  it("element selection tints every matching card but auto-expands none", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel
        selectionType="element"
        compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }}
        anims={ANIMS.map(animation => ({ ...animation, selected: animation.id === "a1" || animation.id === "a2" }))}
      />,
    );
    expect(html.match(/data-animation-card-state="selected"/g)).toHaveLength(2);
    expect(html.match(/bg-c-bg-selected hover:bg-c-bg-selected/g)).toHaveLength(2);
    expect(html).not.toContain(">Build in<");
    expect(html).not.toContain('aria-expanded="true"');
    expect(html).toContain(">None<");
    expect(html).not.toContain(">Fade<");
  });

  it("retains the selected tint on every matching card when one is manually expanded", () => {
    let renderer: ReturnType<typeof create>;
    const selected = ANIMS.map(animation => ({
      ...animation,
      selected: animation.id === "a1" || animation.id === "a2",
    }));
    act(() => {
      renderer = create(<AnimatePanel selectionType="element" anims={selected} />);
    });
    act(() => renderer!.root.findByProps({ "data-animation-card-id": "a1" })
      .findByProps({ "aria-expanded": false }).props.onClick());
    const selectedCards = renderer!.root.findAll(node => node.props["data-animation-card-state"] === "selected");
    expect(selectedCards).toHaveLength(2);
    for (const card of selectedCards) {
      expect(card.findAll(node => typeof node.props.className === "string" && node.props.className.includes("bg-c-bg-selected"))).not.toHaveLength(0);
    }
    act(() => renderer!.unmount());
  });

  it("gives an exact timeline-focused preset precedence over the element-default card", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }}
        anims={ANIMS.map(animation => ({ ...animation, focused: animation.id === "a3" }))} />,
    );
    // a3 is an Action while the element-default a2 is Build in. The focused
    // timeline bar must reveal its own card, not merely the first selected one.
    expect(html).toContain(">Action<");
    expect(html).not.toContain(">Build in<");
  });
});

describe("AnimatePanel — visible Before / With / After sequencing targets (issue #305)", () => {
  it("reveals all explicit targets during drag, shows the active indicator, and emits the chosen placement", () => {
    const reorders: Array<[string, string, "before" | "with" | "after"]> = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <AnimatePanel
          selectionType="element"
          anims={ANIMS}
          objectAnimationCallbacks={{ onReorder: (id, targetId, placement) => reorders.push([id, targetId, placement]) }}
        />,
      );
    });
    const transfer = { effectAllowed: "", dropEffect: "", setData: vi.fn() };
    const dragBody = () => renderer!.root.findByProps({ "aria-label": "Drag Body animation" });

    for (const placement of ["before", "with", "after"] as const) {
      act(() => dragBody().props.onDragStart({ dataTransfer: transfer }));
      const target = renderer!.root.findAll(node =>
        node.props["data-animation-sequence-target"] === placement &&
        node.props["data-animation-sequence-target-for"] === "a2",
      )[0]!;
      expect(renderer!.root.findByProps({ "aria-label": "Place animation relative to Subtitle" })).toBeDefined();
      act(() => target.props.onDragEnter({ preventDefault: vi.fn(), stopPropagation: vi.fn() }));
      expect(renderer!.root.findByProps({ "data-animation-sequence-drop-indicator": placement })).toBeDefined();
      act(() => target.props.onDrop({ preventDefault: vi.fn(), stopPropagation: vi.fn() }));
    }

    expect(transfer.setData).toHaveBeenCalledWith("text/plain", "a3");
    expect(reorders).toEqual([
      ["a3", "a2", "before"],
      ["a3", "a2", "with"],
      ["a3", "a2", "after"],
    ]);
    act(() => renderer!.unmount());
  });

  it("renders no sequencing targets without an active drag", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel
        selectionType="element"
        anims={ANIMS}
        objectAnimationCallbacks={{ onReorder: () => undefined }}
      />,
    );
    expect(html).not.toContain("data-animation-sequence-target=");
    expect(html).not.toContain("data-animation-sequence-drop-indicator=");
  });
});

// Composa-App/Composa#179
describe("AnimatePanel — object-animations lead action is Play, gated like '+' (issue #179)", () => {
  // The play button is the first rightAction; capture just that <button> element.
  const playButton = (html: string) =>
    html.match(/<button[^>]*aria-label="Play all animations"[^>]*>/)?.[0] ?? "";

  it("renders a Play button (not the old 'Select object' control)", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={ANIMS} />);
    expect(html).toContain('aria-label="Play all animations"');
    expect(html).not.toContain('aria-label="Select object"');
  });

  it("enables Play when there are animations to play", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={ANIMS} />);
    expect(playButton(html)).not.toContain("disabled");
  });

  it("disables Play when there are no animations / no real selection (mirrors the '+' gate)", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={[]} />);
    expect(playButton(html)).toContain("disabled");
  });
});

// Composa-App/Composa#387
describe("AnimatePanel — stable topmost Add Action authoring", () => {
  const addActionButton = (html: string) => {
    const labelIndex = html.indexOf(">Add Action<");
    if (labelIndex < 0) return "";
    const start = html.lastIndexOf("<button", labelIndex);
    const end = html.indexOf("</button>", labelIndex);
    return start < 0 || end < 0 ? "" : html.slice(start, end + "</button>".length);
  };

  it("renders exactly one Add Action affordance above existing actions", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" anims={ANIMS} addablePhases={["action"]} />,
    );
    expect(html.match(/>Add Action</g)).toHaveLength(1);
    expect(html.indexOf(">Add Action<")).toBeLessThan(html.indexOf(">Title<"));
    expect(html).not.toContain('aria-label="Add animation"');
    expect(addActionButton(html)).not.toContain("disabled");
  });

  it("keeps the same top control in the empty state and disables it without a selection", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="slide" anims={[]} addablePhases={[]} />,
    );
    expect(html.match(/>Add Action</g)).toHaveLength(1);
    expect(html.indexOf(">Add Action<")).toBeLessThan(html.indexOf("Select an object on the slide"));
    expect(addActionButton(html)).toContain("disabled");
  });

  it("routes the Action menu item to the unchanged shared phase callback", () => {
    const phases: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AnimatePanel selectionType="element" anims={ANIMS} addablePhases={["action"]}
        objectAnimationCallbacks={{ onAdd: phase => phases.push(phase) }} />);
    });
    const popover = renderer!.root.findAllByType(PopoverMenu).find(item =>
      item.props.trigger?.props?.label === "Add Action",
    );
    expect(popover).toBeDefined();
    const menu = popover!.props.children(() => undefined);
    const action = menu.props.children.find((item: { props: { label?: string } }) => item.props.label === "Action");
    expect(action).toBeDefined();
    act(() => action.props.onClick());
    expect(phases).toEqual(["action"]);
    act(() => renderer!.unmount());
  });

  it("offers the canvas action families in the Action style picker", () => {
    expect(ACTION_STYLE_OPTIONS.slice(0, 4)).toEqual(["move", "opacity", "rotate", "scale"]);
  });
});

// Composa-App/Composa#410
describe("AnimatePanel — action intensity uses the canonical dropdown", () => {
  const ACTION: ObjectAnimationItem = {
    id: "action-1", n: 1, name: "Title", kind: "Action", duration: "0.6s", style: "pulse", intensity: "medium", selected: true, focused: true,
  };

  const intensityPopover = (renderer: ReturnType<typeof create>) =>
    renderer.root.findAllByType(PopoverMenu).find(item => item.props.trigger?.props?.ariaLabel === "Intensity");

  it("keeps the constrained action row to one accessible Dropdown trigger, not three segments", () => {
    const html = renderToStaticMarkup(
      <div className="w-[240px]" data-issue-410-narrow-inspector>
        <AnimatePanel selectionType="element" anims={[ACTION]} />
      </div>,
    );
    expect(html).toContain('data-issue-410-narrow-inspector="true"');
    expect(html).toContain('aria-label="Intensity"');
    expect(html).toContain(">Medium<");
    expect(html).not.toContain("data-composa-segmented-surface");
  });

  it("renders all intensities as a radio menu, dismisses after selection, and round-trips the controlled value", () => {
    const changes: string[] = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(
        <AnimatePanel selectionType="element" anims={[ACTION]}
          objectAnimationCallbacks={{ onIntensityChange: (_id, intensity) => changes.push(intensity) }} />,
      );
    });

    const popover = intensityPopover(renderer!);
    expect(popover).toBeDefined();
    expect(popover!.props.trigger.props.value).toBe("Medium");
    const close = vi.fn();
    const menu = popover!.props.children(close);
    const options = menu.props.children as Array<{ props: { label: string; checked: boolean; selectionRole: string; onClick: () => void } }>;
    expect(options.map(option => option.props.label)).toEqual(["Small", "Medium", "Large"]);
    expect(options.map(option => option.props.selectionRole)).toEqual(["radio", "radio", "radio"]);
    expect(options.map(option => option.props.checked)).toEqual([false, true, false]);

    act(() => options[2]!.props.onClick());
    expect(changes).toEqual(["large"]);
    expect(close).toHaveBeenCalledOnce();

    act(() => {
      renderer!.update(
        <AnimatePanel selectionType="element" anims={[{ ...ACTION, intensity: "large" }]}
          objectAnimationCallbacks={{ onIntensityChange: (_id, intensity) => changes.push(intensity) }} />,
      );
    });
    expect(intensityPopover(renderer!)!.props.trigger.props.value).toBe("Large");
    act(() => renderer!.unmount());
  });
});

// Composa-App/Composa#222
describe("AnimatePanel — settings icon + delay gated behind the animationDelay capability (issue #222)", () => {
  it("hides the settings icon and the start/delay block by default (flag OFF)", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    // No settings affordance on either card.
    expect(html).not.toContain('aria-label="Object animation settings"');
    expect(html).not.toContain('aria-label="Comp transition settings"');
    // No dangling "starts automatically" / delay authoring in the default path.
    expect(html).not.toContain(">Start<");
    expect(html).not.toContain(">Delay<");
  });

  it("restores the settings icon and the start/delay block when animationDelay is ON", () => {
    const html = renderToStaticMarkup(
      <AnimatePanel selectionType="element" animationDelay compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }} anims={ANIMS} />,
    );
    expect(html).toContain('aria-label="Object animation settings"');
    expect(html).toContain('aria-label="Comp transition settings"');
    expect(html).toContain(">Start<");
    expect(html).toContain(">Delay<");
  });
});

// Composa-App/Composa#303 — the object-animation Style control opens the anchored
// AnimationStylesDialog (not the old bottom popover), with single-open exclusivity.
describe("AnimatePanel — object-animation Style opens the anchored dialog (issue #303)", () => {
  const STYLED: ObjectAnimationItem = {
    id: "s1", n: 1, name: "Title", kind: "Action", duration: "0.6s", style: "pulse", intensity: "medium", selected: true, focused: true,
  };

  const styleDialog = (renderer: ReturnType<typeof create>) => renderer.root.findByType(AnimationStylesDialog);

  it("routes the Style control through AnimationStylesDialog, closed until its trigger is clicked", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={[STYLED]} />); });
    // Exactly one Style dialog, phase-labelled, anchored to a Style trigger — and closed.
    const dialog = styleDialog(renderer!);
    expect(dialog.props.title).toBe("Action styles");
    expect(dialog.props.open).toBe(false);
    expect(dialog.props.trigger.props["aria-haspopup"]).toBe("dialog");
    expect(dialog.props.trigger.props.ariaLabel).toBe("Style: Pulse");

    act(() => dialog.props.trigger.props.onClick());
    expect(styleDialog(renderer!).props.open).toBe(true);
    // Single-open exclusivity: never more than one anchored Style dialog exists.
    expect(renderer!.root.findAllByType(AnimationStylesDialog)).toHaveLength(1);
    act(() => renderer!.unmount());
  });

  it("applies the picked style through the unchanged onStyleChange path and closes on select", () => {
    const changes: Array<[string, string]> = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AnimatePanel selectionType="element" anims={[STYLED]}
        objectAnimationCallbacks={{ onStyleChange: (id, style) => changes.push([id, style]) }} />);
    });
    act(() => styleDialog(renderer!).props.trigger.props.onClick());
    expect(styleDialog(renderer!).props.open).toBe(true);

    act(() => styleDialog(renderer!).props.onSelect("bounce"));
    expect(changes).toEqual([["s1", "bounce"]]);
    expect(styleDialog(renderer!).props.open).toBe(false);
    act(() => renderer!.unmount());
  });

  it("dismisses the Style dialog when the card is collapsed", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={[STYLED]} />); });
    act(() => styleDialog(renderer!).props.trigger.props.onClick());
    expect(styleDialog(renderer!).props.open).toBe(true);

    // Collapse via the expanded card header toggle.
    const header = renderer!.root.findAll(node => node.type === "button" && node.props["aria-expanded"] === true)[0];
    act(() => header.props.onClick());
    expect(renderer!.root.findAllByType(AnimationStylesDialog)).toHaveLength(0);
    act(() => renderer!.unmount());
  });
});
