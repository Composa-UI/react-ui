import { act, create } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ColorInput, ComboInput, formatNumericDisplay, NumericComboInput, NumericEditSessionProvider, NumericInput, NumericInputMulti, NumericPairInput } from "./Input";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("NumericInput presentation contract", () => {
  it("rounds only the unfocused presentation to at most two decimals", () => {
    expect(formatNumericDisplay(127.6969)).toBe("127.7");
    expect(formatNumericDisplay(1.234)).toBe("1.23");
    expect(formatNumericDisplay(1.2)).toBe("1.2");
    expect(formatNumericDisplay(-1.005)).toBe("-1.01");
    expect(formatNumericDisplay(123456789.9876)).toBe("123456789.99");
    expect(formatNumericDisplay(-0)).toBe("0");
  });

  it("uses a truncating text spinbutton so overflow can ellipsize", () => {
    const html = renderToStaticMarkup(<NumericInput ariaLabel="Position X" value={127.6969} />);
    expect(html).toContain('role="spinbutton"');
    expect(html).toContain('inputMode="decimal"');
    expect(html).toContain('value="127.7"');
    expect(html).toContain("truncate");
  });

  it("keeps multi-value controls outside the single-value session contract", () => {
    const value = { value: 4, onChange: () => undefined };
    const html = renderToStaticMarkup(
      <NumericEditSessionProvider onEditStart={() => undefined}>
        <NumericInputMulti values={[value, value, value, value]} />
      </NumericEditSessionProvider>,
    );
    expect(html).not.toContain("data-composa-numeric-input");
    expect(html.match(/type="number"/g)).toHaveLength(4);
  });

  it("shows a relative-mode label over the idle value and leaves the trigger icon-only", () => {
    const html = renderToStaticMarkup(<NumericComboInput ariaLabel="Width" dropdownAriaLabel="Width sizing mode: Hug" idleLabel="Hug" value={240} menu={() => null} />);
    expect(html).toContain('aria-label="Width sizing mode: Hug"');
    expect(html).toContain("data-composa-relative-mode-label");
    expect(html).toMatch(/data-composa-relative-mode-label[^>]*>Hug<\/span>/);
    expect(html).toContain("[&amp;_input]:text-transparent");
    expect(html).not.toContain("group-hover:[&amp;_input]:text-c-text");
    expect(html).not.toContain("group-hover:hidden");
    expect(html).toContain("group-focus-within:[&amp;_input]:text-c-text");
    const trigger = html.match(/<button[^>]*aria-label="Width sizing mode: Hug"[^>]*>[\s\S]*?<\/button>/)?.[0];
    expect(trigger).toBeTruthy();
    expect(trigger).not.toContain("<span");
  });

  it("reserves the leading anatomy for suffix fields and gives active keyframes the selected-blue surface", () => {
    const opacity = renderToStaticMarkup(<NumericInput ariaLabel="Opacity" reserveLeadingSlot value={75} suffix="%" />);
    expect(opacity).toContain("pl-[26px]");
    expect(opacity).toContain('value="75"');
    expect(opacity).toContain(">%<");

    const single = renderToStaticMarkup(<NumericInput ariaLabel="Rotation" value={30} keyframe={{ active: true, onToggle: () => undefined }} />);
    expect(single).toMatch(/aria-label="Rotation keyframe"[^>]*class="[^"]*bg-c-bg-selected/);
    expect(single).toContain("text-c-text-brand");

    const pair = renderToStaticMarkup(<NumericPairInput
      a={{ ariaLabel: "Position X", iconLead: "X", value: 10 }}
      b={{ ariaLabel: "Position Y", iconLead: "Y", value: 20 }}
      keyframe={{ active: true, onToggle: () => undefined }}
    />);
    expect(pair).toMatch(/aria-label="Position X\/Position Y keyframe"[^>]*class="[^"]*bg-c-bg-selected/);
  });

  it("makes a disabled numeric field's keyframe affordance inert", () => {
    const onToggle = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NumericInput ariaLabel="Locked padding" value={12} disabled keyframe={{ active: true, onToggle }} />); });
    const button = renderer!.root.findByProps({ "aria-label": "Locked padding keyframe" });
    expect(button.props.disabled).toBe(true);
    act(() => button.props.onClick({ stopPropagation: () => undefined }));
    expect(onToggle).not.toHaveBeenCalled();
    act(() => renderer!.unmount());
  });
});

describe("ColorInput motion controls", () => {
  it("renders bound image and video assets inside their shared fill chits", () => {
    const image = renderToStaticMarkup(<ColorInput fillType="Image" fillLabel="cover.png" previewUrl="blob:image-preview" />);
    const video = renderToStaticMarkup(<ColorInput fillType="Video" fillLabel="clip.mp4" previewUrl="blob:video-preview" />);

    expect(image).toContain('<img src="blob:image-preview"');
    expect(video).toContain('<video src="blob:video-preview"');
    expect(video).toContain('repeating-conic-gradient');
  });

  it("makes the component root fluid when fullWidth is requested", () => {
    const html = renderToStaticMarkup(<ColorInput ariaLabel="Selection color" fullWidth color="#336699" />);
    expect(html).toMatch(/^<div class="[^"]*w-full[^"]*min-w-0/);
  });

  it("renders the exact authored gradient in its chit and never generic rainbow artwork", () => {
    const gradient = "linear-gradient(135deg, #112233 0%, #aabbcc 37%, #ff0066 100%)";
    const html = renderToStaticMarkup(<ColorInput fillType="Gradient" fillLabel="Linear gradient" gradient={gradient} />);
    expect(html).toContain("data-composa-gradient-preview=\"true\"");
    expect(html).toContain("#112233 0%");
    expect(html).toContain("#aabbcc 37%");
    expect(html).not.toContain("#fc0");
    expect(html).not.toContain("#0cf");
  });

  it("uses the supplied paint color as a truthful flat fallback when no gradient projection exists", () => {
    const html = renderToStaticMarkup(<ColorInput fillType="Gradient" color="#123456" />);
    expect(html).toContain("background:#123456");
    expect(html).not.toContain("linear-gradient(135deg, #f06");
  });

  it("does not render a dangling opacity diamond when the opacity segment is hidden", () => {
    const html = renderToStaticMarkup(<ColorInput color="#336699" showOpacity={false}
      opacityKeyframe={{ active: false, onToggle: () => undefined }} />);
    expect(html).not.toContain("Color opacity keyframe");
  });
});

describe("joined combo field/action anatomy", () => {
  const leadingNumericShell = (html: string) =>
    html.match(/<div data-composa-numeric-input="" class="([^"]*)">/)?.[1] ?? "";

  it("joins the single numeric editor and keyframe without a rounded leading seam", () => {
    const html = renderToStaticMarkup(<NumericInput ariaLabel="Rotation" value={30} keyframe={{ active: false, onToggle: () => undefined }} />);
    expect(html).toContain("data-composa-separated-field-actions");
    expect(html).toContain("gap-px");
    expect(html).toContain("!rounded-r-none");
    expect(html).toContain("last:rounded-r-c-md");
    expect(html).toContain("pr-[8px]");
    expect(html).toMatch(/data-composa-field-action[^>]*aria-label="Rotation keyframe"[^>]*class="[^"]*size-\[24px\][^"]*focus-visible:ring-c-focus-ring/);
    // The action is not an internal border-left segment of the editable shell.
    const action = html.match(/<button[^>]*data-composa-field-action[^>]*>/)?.[0] ?? "";
    expect(action).not.toContain("border-l");
    expect(leadingNumericShell(html)).toContain("!rounded-r-none");
  });

  it("makes the Duration editor the leading segment of its mode-menu combo", () => {
    const html = renderToStaticMarkup(
      <NumericComboInput
        ariaLabel="Duration"
        dropdownAriaLabel="Duration mode"
        value={4}
        menu={() => null}
      />,
    );
    expect(html).toContain("gap-px");
    expect(leadingNumericShell(html)).toContain("!rounded-r-none");
    expect(html).toMatch(/aria-label="Duration mode"[^>]*class="[^"]*rounded-r-c-md/);
  });

  it("reserves independent cells after a pair without shrinking either input into an action segment", () => {
    const html = renderToStaticMarkup(<NumericPairInput
      a={{ ariaLabel: "Position X", iconLead: "X", value: 10 }}
      b={{ ariaLabel: "Position Y", iconLead: "Y", value: 20 }}
      keyframe={{ active: false, onToggle: () => undefined }}
      trailing={<button type="button" aria-label="Aspect ratio lock">Lock</button>}
    />);
    expect(html.match(/data-composa-field-action/g)).toHaveLength(2);
    expect(html).toContain('aria-label="Position X/Position Y keyframe"');
    expect(html).toContain('aria-label="Aspect ratio lock"');
    expect(html).toContain("flex-1 min-w-0");
    expect(leadingNumericShell(html)).toContain("!rounded-r-none");
  });

  it("places each color/opacity keyframe action immediately after its value", () => {
    const html = renderToStaticMarkup(<ColorInput ariaLabel="Fill color" fullWidth color="#336699"
      colorKeyframe={{ active: false, onToggle: () => undefined }}
      opacityKeyframe={{ active: false, onToggle: () => undefined }} />);
    const labels = ["Fill color hex", "Fill color color keyframe", "Fill color opacity", "Fill color opacity keyframe"];
    const indices = labels.map(label => html.indexOf(`aria-label="${label}"`));
    expect(indices.every(index => index >= 0)).toBe(true);
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it("gives color and opacity actions the same separate active, disabled, and pressed semantics", () => {
    const onColorToggle = vi.fn();
    const onOpacityToggle = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<ColorInput ariaLabel="Fill color" fullWidth disabled color="#336699"
      colorKeyframe={{ active: true, onToggle: onColorToggle }}
      opacityKeyframe={{ active: false, onToggle: onOpacityToggle }}
    />); });
    const actions = renderer!.root.findAllByProps({ "data-composa-field-action": "" });
    expect(actions).toHaveLength(2);
    const colorAction = renderer!.root.findByProps({ "aria-label": "Fill color color keyframe" });
    expect(colorAction.props["aria-pressed"]).toBe(true);
    expect(colorAction.props.disabled).toBe(true);
    expect(colorAction.props.className).toContain("bg-c-bg-selected");
    act(() => colorAction.props.onClick({ stopPropagation: () => undefined }));
    expect(onColorToggle).not.toHaveBeenCalled();
    expect(renderer!.root.findByProps({ "aria-label": "Fill color opacity keyframe" }).props["aria-pressed"]).toBe(false);
    act(() => renderer!.unmount());
  });

  it("keeps the ColorInput shell square at its trailing seam when a keyframe action follows", () => {
    const html = renderToStaticMarkup(<ColorInput
      ariaLabel="Fill color"
      color="#336699"
      keyframe={{ active: false, onToggle: () => undefined }}
    />);
    expect(html).toContain("!rounded-r-none");
    expect(html).toContain("last:rounded-r-c-md");
  });
});

// Composa#661 item 1: the idle field read "758.46" but focusing it dumped the
// raw stored float ("758.4596697032626") into the editor. The draft is the
// editing surface, so it is seeded at display precision at every entry point.
describe("NumericInput — editing precision", () => {
  const RAW = 758.4596697032626;
  const focus = (input: { props: Record<string, (event: unknown) => void> }) =>
    act(() => input.props.onFocus({ target: { select: () => undefined } }));

  it("seeds the editing draft at two decimals when the field is focused", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NumericInput ariaLabel="Position X" value={RAW} />); });
    const input = renderer!.root.findByProps({ "aria-label": "Position X" });
    expect(input.props.value).toBe("758.46"); // idle presentation
    focus(input);
    expect(renderer!.root.findByProps({ "aria-label": "Position X" }).props.value).toBe("758.46");
    act(() => renderer!.unmount());
  });

  it("seeds each pair segment's draft at two decimals too", () => {
    let renderer: ReturnType<typeof create>;
    act(() => {
      renderer = create(<NumericPairInput
        a={{ ariaLabel: "Position X", iconLead: "X", value: RAW }}
        b={{ ariaLabel: "Position Y", iconLead: "Y", value: 12 }}
      />);
    });
    const x = renderer!.root.findByProps({ "aria-label": "Position X" });
    focus(x);
    expect(renderer!.root.findByProps({ "aria-label": "Position X" }).props.value).toBe("758.46");
    act(() => renderer!.unmount());
  });

  it("steps from the displayed value rather than the raw float", () => {
    const onChange = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NumericInput ariaLabel="Position X" value={RAW} onChange={onChange} />); });
    const input = renderer!.root.findByProps({ "aria-label": "Position X" });
    focus(input);
    act(() => renderer!.root.findByProps({ "aria-label": "Position X" }).props.onKeyDown({
      key: "ArrowUp", shiftKey: false, preventDefault: () => undefined,
    }));
    expect(renderer!.root.findByProps({ "aria-label": "Position X" }).props.value).toBe("759.46");
    act(() => renderer!.unmount());
  });

  it("does not quantise the stored value when a commitOnBlur field is focused and left alone", () => {
    // The draft now reads "758.46"; committing it verbatim would silently
    // rewrite 758.4596697032626 on a bare focus/blur.
    const onChange = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<NumericInput ariaLabel="Gap" commitOnBlur value={RAW} onChange={onChange} />); });
    const input = renderer!.root.findByProps({ "aria-label": "Gap" });
    focus(input);
    act(() => renderer!.root.findByProps({ "aria-label": "Gap" }).props.onBlur());
    expect(onChange).not.toHaveBeenCalled();
    act(() => renderer!.unmount());
  });
});

describe("ComboInput focus contract", () => {
  it("selects an editable value only when the consumer opts in", () => {
    const selected = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<ComboInput ariaLabel="Font size" value="48" selectAllOnFocus />); });

    const input = renderer!.root.findByProps({ "aria-label": "Font size" });
    act(() => input.props.onFocus({ currentTarget: { select: selected } }));

    expect(selected).toHaveBeenCalledOnce();
    act(() => renderer!.unmount());
  });

  it("does not select ordinary or non-editable combo values", () => {
    const ordinarySelect = vi.fn();
    let ordinary: ReturnType<typeof create>;
    act(() => { ordinary = create(<ComboInput ariaLabel="Family" value="Inter" />); });
    const ordinaryInput = ordinary!.root.findByProps({ "aria-label": "Family" });
    act(() => ordinaryInput.props.onFocus({ currentTarget: { select: ordinarySelect } }));
    expect(ordinarySelect).not.toHaveBeenCalled();
    act(() => ordinary!.unmount());

    const locked = renderToStaticMarkup(<ComboInput ariaLabel="Variable font size" variableValue="Size/Large" selectAllOnFocus />);
    expect(locked).not.toContain('aria-label="Variable font size"');
  });
});

describe("NumericInput — whole-field scrub (opt-in `scrub`)", () => {
  function scrubEvent(clientX: number, shiftKey = false) {
    return {
      clientX,
      shiftKey,
      pointerId: 1,
      preventDefault: vi.fn(),
      currentTarget: { setPointerCapture: vi.fn() },
    };
  }
  const field = (renderer: ReturnType<typeof create>) => renderer.root.findByProps({ role: "spinbutton" });

  it("changes the value on horizontal drag with the shared step + rounding (delta/2 · step)", () => {
    const onChange = vi.fn();
    let r: ReturnType<typeof create>;
    act(() => { r = create(<NumericInput ariaLabel="V" scrub value={10} step={1} onChange={onChange} />); });
    act(() => field(r!).props.onPointerDown(scrubEvent(100)));
    // +40px → Math.round(40/2)=20 · step 1 → 10 + 20 = 30. (Same math as the iconLead scrub.)
    act(() => field(r!).props.onPointerMove(scrubEvent(140)));
    expect(onChange).toHaveBeenLastCalledWith(30);
    act(() => field(r!).props.onPointerUp(scrubEvent(140)));
    act(() => r!.unmount());
  });

  it("Shift multiplies the step by 10 (matches the other numeric inputs)", () => {
    const onChange = vi.fn();
    let r: ReturnType<typeof create>;
    act(() => { r = create(<NumericInput ariaLabel="V" scrub value={10} step={1} onChange={onChange} />); });
    act(() => field(r!).props.onPointerDown(scrubEvent(100)));
    // +4px → round(4/2)=2 · step 1 · 10 = 20 → 10 + 20 = 30.
    act(() => field(r!).props.onPointerMove(scrubEvent(104, true)));
    expect(onChange).toHaveBeenLastCalledWith(30);
    act(() => r!.unmount());
  });

  it("clamps the scrubbed value at min and max", () => {
    const onChangeMax = vi.fn();
    let rMax: ReturnType<typeof create>;
    act(() => { rMax = create(<NumericInput ariaLabel="V" scrub value={10} step={1} max={25} onChange={onChangeMax} />); });
    act(() => field(rMax!).props.onPointerDown(scrubEvent(100)));
    act(() => field(rMax!).props.onPointerMove(scrubEvent(140))); // +20 → 30 → clamp 25
    expect(onChangeMax).toHaveBeenLastCalledWith(25);
    act(() => rMax!.unmount());

    const onChangeMin = vi.fn();
    let rMin: ReturnType<typeof create>;
    act(() => { rMin = create(<NumericInput ariaLabel="V" scrub value={10} step={1} min={5} onChange={onChangeMin} />); });
    act(() => field(rMin!).props.onPointerDown(scrubEvent(100)));
    act(() => field(rMin!).props.onPointerMove(scrubEvent(20))); // -80 → round(-40) → -30 → clamp 5
    expect(onChangeMin).toHaveBeenLastCalledWith(5);
    act(() => rMin!.unmount());
  });

  it("attaches scrub pointer handlers only when `scrub` is set", () => {
    let plain: ReturnType<typeof create>;
    act(() => { plain = create(<NumericInput ariaLabel="V" value={10} onChange={() => {}} />); });
    expect(field(plain!).props.onPointerDown).toBeUndefined();
    act(() => plain!.unmount());

    let scrubbable: ReturnType<typeof create>;
    act(() => { scrubbable = create(<NumericInput ariaLabel="V" scrub value={10} onChange={() => {}} />); });
    expect(typeof field(scrubbable!).props.onPointerDown).toBe("function");
    act(() => scrubbable!.unmount());
  });
});
