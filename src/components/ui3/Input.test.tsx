import { act, create } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ComboInput, formatNumericDisplay, NumericComboInput, NumericEditSessionProvider, NumericInput, NumericInputMulti } from "./Input";

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
    const trigger = html.match(/<button[^>]*aria-label="Width sizing mode: Hug"[^>]*>[\s\S]*?<\/button>/)?.[0];
    expect(trigger).toBeTruthy();
    expect(trigger).not.toContain("<span");
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
