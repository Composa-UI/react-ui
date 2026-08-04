import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ColorDialog, type GradientStop } from "./ColorDialog";

// InspectorDialog is a Radix popover and renders no children in a bare renderer,
// so without this mock every assertion below would pass against an empty tree.
vi.mock("./InspectorDialog", () => ({
  InspectorDialog: ({ trigger, children }: { trigger: ReactElement; children: ReactNode }) => (
    <div>{trigger}{children}</div>
  ),
}));

// The gradient-type menu lives in a Radix portal, which a bare renderer never
// mounts. Flattening the primitives puts the menu rows in the tree so the test
// can read what the menu OFFERS, not merely that a popover exists.
vi.mock("@radix-ui/react-popover", async () => {
  const React = await import("react");
  // Positioning props are dropped rather than spread: they are not DOM
  // attributes, and this suite reads the menu's CONTENT, never its geometry.
  const passthrough = (name: string) => ({ children }: { children?: ReactNode }) =>
    React.createElement("div", { [`data-radix-${name}`]: true }, children);
  return {
    Root: passthrough("root"),
    Anchor: passthrough("anchor"),
    Trigger: passthrough("trigger"),
    Portal: passthrough("portal"),
    Content: passthrough("content"),
  };
});

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// ScrollArea measures itself once its ref resolves, and these tests hand every
// host node a mock ref so the stop track can report a width.
vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });

const html = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<ColorDialog open onClose={() => undefined} trigger={<button>Color</button>} {...props} />);

/** The stop handle track, 200px wide at viewport x=0 — so clientX IS the percent × 2. */
const TRACK_WIDTH = 200;
const nodeMock = (focus = vi.fn(), hexField: unknown = { focus }) => ({
  createNodeMock: () => ({
    getBoundingClientRect: () => ({ left: 0, top: 0, width: TRACK_WIDTH, height: 34 }),
    querySelector: () => hexField,
  }),
});

function render(props: Record<string, unknown> = {}, options?: Parameters<typeof create>[1]) {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(
      <ColorDialog open onClose={() => undefined} trigger={<button>Color</button>} {...props} />,
      options,
    );
  });
  return renderer;
}

const host = (renderer: ReactTestRenderer, match: (instance: ReactTestInstance) => boolean) =>
  renderer.root.findAll(instance => typeof instance.type === "string" && match(instance));

const byLabel = (renderer: ReactTestRenderer, label: string) =>
  host(renderer, instance => instance.props["aria-label"] === label);

// ── Item 5: close icon colour ────────────────────────────────────────────────

describe("close control", () => {
  it("uses the primary icon colour, not the de-emphasised one", () => {
    const renderer = render();
    const [close] = byLabel(renderer, "Close");
    expect(close).toBeDefined();                                   // guards the negative below
    expect(String(close.props.className).split(/\s+/)).toContain("text-c-icon");
    expect(close.props.className).not.toContain("text-c-icon-secondary");
    act(() => renderer.unmount());
  });
});

// ── Item 4: no inert trailing icons on the tab / toolbar rows ────────────────

describe("controls with nothing behind them are not rendered", () => {
  it("drops Swap gradient, which had no handler, while keeping the gradient toolbar", () => {
    const markup = html({ fillType: "linear" });
    expect(markup).toContain('aria-label="Gradient"');            // the row it lived on still renders
    expect(markup).not.toContain('aria-label="Swap gradient"');
  });

  it("offers the header's new-style action only when a host can service it", () => {
    expect(html()).not.toContain('aria-label="New style or variable"');

    const create = vi.fn();
    const renderer = render({ onCreateStyleOrVariable: create });
    const [button] = byLabel(renderer, "New style or variable");
    expect(button).toBeDefined();
    act(() => button.props.onClick());
    expect(create).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });
});

// ── Item 1: explicit image selection + adjustments ───────────────────────────

describe("image fill", () => {
  it("hides the select control when no host picker is wired", () => {
    const markup = html({ fillType: "image" });
    expect(markup).toContain("repeating-conic-gradient");         // the image panel DID render
    expect(markup).not.toContain("Select image");
  });

  it("shows an explicit select control that actually calls the host picker", () => {
    const chooseImage = vi.fn();
    const renderer = render({ fillType: "image", onChooseImage: chooseImage });
    const [upload] = host(renderer, instance =>
      instance.type === "button" && String(renderToStaticMarkup(<>{instance.props.children}</>)).includes("Select image"));
    expect(upload).toBeDefined();
    act(() => upload.props.onClick({}));
    expect(chooseImage).toHaveBeenCalledOnce();
    act(() => renderer.unmount());
  });

  it("hides the seven adjustment sliders when nothing receives them", () => {
    const markup = html({ fillType: "image" });
    expect(markup).toContain("repeating-conic-gradient");          // guard, as above
    expect(markup).not.toContain("Exposure");
    expect(markup).not.toContain("Shadows");
  });

  it("commits each adjustment under its own name once a handler exists", () => {
    const onAdjust = vi.fn();
    const markup = html({ fillType: "image", onImageAdjustmentChange: onAdjust });
    expect(markup).toContain("Exposure");
    expect(markup).toContain("Shadows");

    // Each slider's own input has to reach the host — the regression was seven
    // sliders that moved, kept their own internal state, and told nobody.
    const renderer = render({ fillType: "image", onImageAdjustmentChange: onAdjust }, nodeMock());
    const sliders = host(renderer, instance => instance.type === "input" && instance.props.type === "range");
    expect(sliders).toHaveLength(7);
    act(() => sliders[0].props.onChange({ target: { value: "40" } }));
    expect(onAdjust).toHaveBeenCalledWith("exposure", 40);
    act(() => sliders[6].props.onChange({ target: { value: "-30" } }));
    expect(onAdjust).toHaveBeenCalledWith("shadows", -30);
    act(() => renderer.unmount());
  });

  it("keeps adjustment values visible while every editor and diamond is inert when read-only", () => {
    const onAdjust = vi.fn();
    const onToggle = vi.fn();
    const renderer = render({
      fillType: "image",
      imageSourceLabel: "locked.png",
      imageExposure: 37,
      imageAdjustmentsReadOnly: true,
      imageAdjustmentKeyframes: { exposure: { active: true, onToggle } },
      onImageAdjustmentChange: onAdjust,
    }, nodeMock());

    const sliders = host(renderer, instance => instance.type === "input" && instance.props.type === "range");
    expect(sliders).toHaveLength(7);
    expect(sliders.every(slider => slider.props.disabled === true)).toBe(true);
    act(() => sliders[0].props.onChange({ target: { value: "80" } }));

    const [exposure] = byLabel(renderer, "Exposure value");
    expect(exposure.props.value).toBe("37");
    expect(exposure.props.disabled).toBe(true);
    act(() => exposure.props.onChange({ target: { value: "80" } }));

    const [diamond] = byLabel(renderer, "Exposure value keyframe");
    expect(diamond.props.disabled).toBe(true);
    expect(diamond.props["aria-pressed"]).toBe(true);
    act(() => diamond.props.onClick({ stopPropagation: vi.fn() }));
    expect(onToggle).not.toHaveBeenCalled();
    expect(onAdjust).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });
});

// ── Item 3: gradient type is a menu, not a cycle ─────────────────────────────

describe("gradient type control", () => {
  const gradientMenuRows = (renderer: ReactTestRenderer) =>
    host(renderer, instance => instance.props.role === "menuitemradio");

  it("offers all four types at once instead of advancing one per press", () => {
    const renderer = render({ fillType: "linear" });
    const rows = gradientMenuRows(renderer);
    const labels = rows.map(row => renderToStaticMarkup(<>{row.props.children}</>));
    expect(labels.filter(label => label.includes("Linear"))).toHaveLength(1);
    expect(labels.filter(label => label.includes("Radial"))).toHaveLength(1);
    expect(labels.filter(label => label.includes("Angular"))).toHaveLength(1);
    expect(labels.filter(label => label.includes("Diamond"))).toHaveLength(1);
    expect(rows.filter(row => row.props["aria-checked"] === true)).toHaveLength(1);
    act(() => renderer.unmount());
  });

  it("does not change the fill just because the control was pressed", () => {
    // The regression: pressing the dropdown cycled linear → radial → angular →
    // diamond, so opening the control was itself a destructive edit.
    const onFillTypeChange = vi.fn();
    const renderer = render({ fillType: "linear", onFillTypeChange });
    const [trigger] = byLabel(renderer, "Gradient type");
    expect(trigger).toBeDefined();
    act(() => trigger.props.onClick({}));
    expect(onFillTypeChange).not.toHaveBeenCalled();
    act(() => renderer.unmount());
  });

  it("applies the type the user picked from the menu", () => {
    const onFillTypeChange = vi.fn();
    const renderer = render({ fillType: "linear", onFillTypeChange });
    const diamond = gradientMenuRows(renderer)
      .find(row => renderToStaticMarkup(<>{row.props.children}</>).includes("Diamond"));
    expect(diamond).toBeDefined();
    act(() => diamond!.props.onClick());
    expect(onFillTypeChange).toHaveBeenCalledWith("diamond");
    act(() => renderer.unmount());
  });
});

// ── Item 2: gradient stops drag, re-order, and never open the native picker ──

describe("gradient stops", () => {
  /** What the dialog last handed the host — the committed gradient, in order. */
  const lastStops = (spy: ReturnType<typeof vi.fn>): GradientStop[] =>
    spy.mock.calls[spy.mock.calls.length - 1][0] as GradientStop[];
  const stops = [
    { id: "a", position: 0,   color: "000000", opacity: 100 },
    { id: "b", position: 50,  color: "888888", opacity: 100 },
    { id: "c", position: 100, color: "ffffff", opacity: 100 },
  ];
  const pointer = (clientX: number) => ({
    button: 0,
    pointerId: 3,
    clientX,
    clientY: 0,
    currentTarget: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
    preventDefault: vi.fn(),
  });

  it("never falls through to the browser's native colour picker", () => {
    const markup = html({ fillType: "linear", gradientStops: stops });
    expect(markup).toContain('aria-label="Stop 1 hex"');           // the stop rows DID render
    expect(markup).not.toContain('type="color"');
  });

  it("re-orders the gradient when a stop is dragged past its neighbour", () => {
    const onStopsChange = vi.fn();
    const renderer = render({ fillType: "linear", gradientStops: stops, onStopsChange }, nodeMock());
    const grab = () => byLabel(renderer, "Stop 1")[0];
    expect(grab()).toBeDefined();
    act(() => grab().props.onPointerDown(pointer(0)));
    act(() => grab().props.onPointerMove(pointer(150)));           // 150 / 200 → 75%

    expect(onStopsChange).toHaveBeenCalled();
    const committed = lastStops(onStopsChange);
    expect(committed.map(stop => stop.id)).toEqual(["b", "a", "c"]);
    expect(committed.find(stop => stop.id === "a")!.position).toBe(75);
    act(() => renderer.unmount());
  });

  it("sends a tapped stop to its hex field rather than a colour picker", () => {
    const focus = vi.fn();
    const onStopsChange = vi.fn();
    const renderer = render({ fillType: "linear", gradientStops: stops, onStopsChange }, nodeMock(focus));
    const grab = () => byLabel(renderer, "Stop 1")[0];
    act(() => grab().props.onPointerDown(pointer(0)));
    act(() => grab().props.onPointerUp(pointer(0)));               // pressed, never moved
    expect(focus).toHaveBeenCalledOnce();
    expect(onStopsChange).not.toHaveBeenCalled();                  // a tap is not an edit
    act(() => renderer.unmount());
  });

  it("moves a stop from the keyboard, so dragging is not the only way", () => {
    const onStopsChange = vi.fn();
    const renderer = render({ fillType: "linear", gradientStops: stops, onStopsChange }, nodeMock());
    const [handle] = byLabel(renderer, "Stop 2");
    expect(handle.props["aria-valuenow"]).toBe(50);
    act(() => handle.props.onKeyDown({ key: "ArrowRight", shiftKey: true, preventDefault: vi.fn() }));
    expect(lastStops(onStopsChange).find(stop => stop.id === "b")!.position).toBe(60);
    act(() => renderer.unmount());
  });

  it("draws the preview bar from every stop, at its own position", () => {
    // The bar used to interpolate the first colour straight to the last, so a
    // middle stop — and any drag of one — was invisible.
    const [bar] = host(render({ fillType: "linear", gradientStops: stops }, nodeMock()),
      instance => typeof instance.props.style?.background === "string"
        && instance.props.style.background.includes("#888888"));
    expect(bar.props.style.background).toBe("linear-gradient(to right, #000000 0%, #888888 50%, #ffffff 100%)");
  });

  it("routes position, color, and opacity diamonds by stable stop id", () => {
    const position = vi.fn(), color = vi.fn(), opacity = vi.fn();
    const renderer = render({
      fillType: "linear", gradientStops: stops,
      gradientStopKeyframes: { b: {
        position: { active: true, onToggle: position },
        color: { active: false, onToggle: color },
        opacity: { active: false, onToggle: opacity },
      } },
    }, nodeMock());

    for (const [label, callback] of [
      ["Stop 2 position keyframe", position],
      ["Stop 2 color keyframe", color],
      ["Stop 2 opacity keyframe", opacity],
    ] as const) {
      const [button] = byLabel(renderer, label);
      expect(button).toBeDefined();
      act(() => button.props.onClick({ stopPropagation: vi.fn() }));
      expect(callback).toHaveBeenCalledOnce();
    }
    expect(byLabel(renderer, "Stop 1 position keyframe")).toHaveLength(0);
    act(() => renderer.unmount());
  });
});
