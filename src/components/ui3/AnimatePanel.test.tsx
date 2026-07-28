import { renderToStaticMarkup } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ACTION_STYLE_OPTIONS, AnimatePanel, buildAnimationUnits, type ObjectAnimationItem } from "./AnimatePanel";
import { PopoverMenu } from "./Menu";
import { NumericInput } from "./Input";
import { AnimationStylesDialog } from "./AnimationStylesDialog";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// ── Combined card + one signed gap (motion-mental-model.md) ─────────────────────────
// Two pulses on ONE object (shared elementId) — the exact case that used to render as
// two separate cards each labelled "1". They must collapse into one combined card.
const TWO_PULSES: ObjectAnimationItem[] = [
  { id: "p1", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "1.2s", style: "pulse", buildDuration: "1200ms", startMs: 0 },
  { id: "p2", elementId: "logo", n: 2, name: "Logo", kind: "Action", duration: "0.8s", style: "pulse", buildDuration: "800ms", startMs: 500 },
];
const delayField = (renderer: ReturnType<typeof create>, followingId: string) =>
  renderer.root.findAll(node => node.props["data-delay-between-following"] === followingId)[0]!.findByType(NumericInput);

describe("AnimatePanel — combined card groups an object's actions into one card (motion-mental-model)", () => {
  it("groups N same-object actions into ONE combined card, not N cards", () => {
    const units = buildAnimationUnits(TWO_PULSES);
    expect(units).toHaveLength(1);
    expect(units[0]!.kind).toBe("combined");

    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={TWO_PULSES} />);
    // Exactly one combined group for the object, and both action rows belong to it.
    expect(html.match(/data-combined-card-element-id="logo"/g)).toHaveLength(1);
    expect(html).toContain('data-animation-card-id="p1"');
    expect(html).toContain('data-animation-card-id="p2"');
    // Owner feedback: no heavy container, no group header / "N actions" label.
    expect(html).not.toContain(">2 actions<");
    // The relationship is carried by a connector line instead.
    expect(html).toContain("data-combined-connector");
  });

  it("renders the group WITHOUT a heavy container box (no border / overflow-hidden wrapper)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={TWO_PULSES} />); });
    const wrapper = renderer!.root.findAll(node => node.props["data-combined-card-element-id"] === "logo")[0]!;
    const className = String(wrapper.props.className);
    expect(className).not.toMatch(/\bborder\b/);
    expect(className).not.toMatch(/overflow-hidden/);
    act(() => renderer!.unmount());
  });

  it("connects the two cards with a vertical line, with the delay control IN THE GAP", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={TWO_PULSES} />); });
    // The connector for a delayed pair is the "gap" variant and contains the delay control.
    const gapConnector = renderer!.root.findAll(node => node.props["data-combined-connector"] === "gap")[0]!;
    expect(gapConnector.findAll(node => node.props["data-delay-between-following"] === "p2")).toHaveLength(1);
    act(() => renderer!.unmount());
  });

  it("keeps a single action on an object rendering EXACTLY as today (no combined chrome)", () => {
    const single: ObjectAnimationItem[] = [
      { id: "s1", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "0.6s", style: "pulse" },
    ];
    expect(buildAnimationUnits(single)[0]!.kind).toBe("single");
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={single} />);
    expect(html).not.toContain("data-combined-card-element-id");
    expect(html).not.toContain("Delay between");
    expect(html).toContain('data-animation-card-id="s1"');
  });

  it("renders no combined card for distinct objects each with one action", () => {
    const distinct: ObjectAnimationItem[] = [
      { id: "a", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "0.6s", style: "pulse" },
      { id: "b", elementId: "title", n: 2, name: "Title", kind: "In", duration: "0.4s", style: "fade-in" },
    ];
    const units = buildAnimationUnits(distinct);
    expect(units.every(unit => unit.kind === "single")).toBe(true);
  });
});

// ── Unit-level numbering: one number per unit (combined card = ONE number) ──────────
// #78 over-corrected and dropped ALL numbers. The owner wants numbers back, but at the
// UNIT level: a standalone action gets its own number and a combined card carries a
// SINGLE number for the whole card — not one per action-row inside it.
describe("AnimatePanel — object-animations number by UNIT (combined card = one number)", () => {
  // Two actions on `logo` collapse into one combined card (unit 1); a standalone action
  // on `caption` is the next unit (unit 2).
  const MIXED: ObjectAnimationItem[] = [
    { id: "p1", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "1.2s", style: "pulse", buildDuration: "1200ms", startMs: 0 },
    { id: "p2", elementId: "logo", n: 2, name: "Logo", kind: "Action", duration: "0.8s", style: "pulse", buildDuration: "800ms", startMs: 500 },
    { id: "r1", elementId: "caption", n: 3, name: "Caption", kind: "In", duration: "0.4s", style: "fade-in", buildDuration: "400ms" },
  ];

  const unitNumbers = (renderer: ReturnType<typeof create>) =>
    renderer.root
      .findAll(node => node.props["data-animation-unit-number"] !== undefined)
      .map(node => node.props["data-animation-unit-number"] as number);

  it("emits exactly ONE number per unit — a combined card is a single index, not per-row", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={MIXED} />); });
    // Two units (combined logo + standalone caption) → two numbers, "1" then "2".
    expect(unitNumbers(renderer!)).toEqual([1, 2]);
    // The combined card (two rows) contributed exactly one number, not two.
    const combined = renderer!.root.findAll(node => node.props["data-combined-card-element-id"] === "logo")[0]!;
    expect(combined.findAll(node => node.props["data-animation-unit-number"] !== undefined)).toHaveLength(0);
    act(() => renderer!.unmount());
  });

  it("numbers a combined card as ONE index in static markup — [combined, standalone] → 1, 2", () => {
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={MIXED} />);
    // The two-row combined card yields a single unit number; there is no per-row number.
    expect(html.match(/data-animation-unit-number="1"/g)).toHaveLength(1);
    expect(html.match(/data-animation-unit-number="2"/g)).toHaveLength(1);
    // Exactly two unit numbers total for two units (one combined + one standalone).
    expect(html.match(/data-animation-unit-number=/g)).toHaveLength(2);
  });

  it("numbers each standalone action in a distinct-object list sequentially", () => {
    const distinct: ObjectAnimationItem[] = [
      { id: "a", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "0.6s", style: "pulse" },
      { id: "b", elementId: "title", n: 2, name: "Title", kind: "In", duration: "0.4s", style: "fade-in" },
      { id: "c", elementId: "body", n: 3, name: "Body", kind: "Action", duration: "0.5s", style: "jiggle" },
    ];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={distinct} />); });
    expect(unitNumbers(renderer!)).toEqual([1, 2, 3]);
    act(() => renderer!.unmount());
  });
});

describe("AnimatePanel — 'delay between' is the signed start-to-start gap (locked)", () => {
  it("derives the gap as following.startMs − preceding.startMs (positive stagger)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={TWO_PULSES} />); });
    const field = delayField(renderer!, "p2");
    expect(field.props.value).toBe(500); // 500 − 0
    // Never clamped: no `min`, so the numeric field accepts negatives (overlap).
    expect(field.props.min).toBeUndefined();
    act(() => renderer!.unmount());
  });

  it("derives and shows a NEGATIVE gap (overlap) without clamping", () => {
    const overlap: ObjectAnimationItem[] = [
      { ...TWO_PULSES[0]!, startMs: 500 },
      { ...TWO_PULSES[1]!, startMs: 200 },
    ];
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={overlap} />); });
    expect(delayField(renderer!, "p2").props.value).toBe(-300); // 200 − 500
    act(() => renderer!.unmount());
  });

  it("emits onDelayBetweenChange(precedingId, followingId, signed ms) — including negative", () => {
    const calls: Array<[string, string, number]> = [];
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<AnimatePanel selectionType="element" anims={TWO_PULSES}
        objectAnimationCallbacks={{ onDelayBetweenChange: (preceding, following, ms) => calls.push([preceding, following, ms]) }} />);
    });
    act(() => delayField(renderer!, "p2").props.onChange(-150));
    expect(calls).toEqual([["p1", "p2", -150]]);
    act(() => renderer!.unmount());
  });

  it("omits the delay-between control when a start time is missing (no invented gap)", () => {
    const noStart: ObjectAnimationItem[] = [
      { id: "p1", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "1.2s", style: "pulse" },
      { id: "p2", elementId: "logo", n: 2, name: "Logo", kind: "Action", duration: "0.8s", style: "pulse" },
    ];
    const html = renderToStaticMarkup(<AnimatePanel selectionType="element" anims={noStart} />);
    // Still one combined group, but no derived delay control without start data.
    expect(html).toContain('data-combined-card-element-id="logo"');
    expect(html).not.toContain("data-delay-between-following");
    // The connector line is CONTINUOUS (no gap variant) when there is no delay control.
    expect(html).toContain('data-combined-connector="continuous"');
    expect(html).not.toContain('data-combined-connector="gap"');
  });
});

describe("AnimatePanel — two-tier selection inside a combined card (motion-mental-model)", () => {
  const rowState = (renderer: ReturnType<typeof create>, id: string) =>
    renderer.root.findAll(node => node.props["data-animation-card-id"] === id)[0]!.props["data-animation-card-state"];

  it("object selection lights EVERY action row", () => {
    const anims = TWO_PULSES.map(anim => ({ ...anim, selected: true }));
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={anims} />); });
    expect(rowState(renderer!, "p1")).toBe("selected");
    expect(rowState(renderer!, "p2")).toBe("selected");
    act(() => renderer!.unmount());
  });

  it("a single focused action lights ONLY that row — the lit sibling is suppressed", () => {
    // Real app: focusing one action still marks the whole object selected; the combined
    // card must NOT leave the sibling tinted next to the focused/expanded row.
    const anims = TWO_PULSES.map(anim => ({ ...anim, selected: true, focused: anim.id === "p2" }));
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AnimatePanel selectionType="element" anims={anims} />); });
    expect(rowState(renderer!, "p2")).toBe("focused");
    expect(rowState(renderer!, "p1")).toBe("neutral");
    act(() => renderer!.unmount());
  });
});

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
