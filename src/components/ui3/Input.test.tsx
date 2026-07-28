import { act, create } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ComboInput, formatNumericDisplay, NumericComboInput, NumericEditSessionProvider, NumericInput, NumericInputMulti, NumericPairInput } from "./Input";

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
