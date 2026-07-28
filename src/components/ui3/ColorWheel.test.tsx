import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { ColorWheel } from "./ColorWheel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function keyEvent(key: string, shiftKey = false) {
  return { key, shiftKey, preventDefault: vi.fn() };
}
function disc(root: ReactTestInstance) {
  return root.find(node => node.props.role === "slider");
}
function render(ui: React.ReactElement) {
  let r!: ReactTestRenderer;
  act(() => { r = create(ui); });
  return r;
}

describe("ColorWheel — semantics", () => {
  it("exposes a labelled slider with a hue/saturation value description", () => {
    const r = render(<ColorWheel ariaLabel="Midtones color wheel" defaultHue={0} defaultSaturation={0} />);
    const el = disc(r.root);
    expect(el.props.role).toBe("slider");
    expect(el.props["aria-label"]).toBe("Midtones color wheel");
    expect(el.props["aria-valuetext"]).toBe("hue 0°, saturation 0%");
    expect(el.props.tabIndex).toBe(0);
  });
});

describe("ColorWheel — keyboard", () => {
  it("raises saturation on ArrowUp and reports the change", () => {
    const onChange = vi.fn();
    const r = render(<ColorWheel ariaLabel="wheel" defaultHue={0} defaultSaturation={0} onChange={onChange} />);
    act(() => { disc(r.root).props.onKeyDown(keyEvent("ArrowUp")); });
    expect(onChange).toHaveBeenCalledWith(0, expect.any(Number));
    expect(onChange.mock.calls[0][1]).toBeGreaterThan(0);
  });

  it("rotates hue on ArrowRight", () => {
    const onChange = vi.fn();
    const r = render(<ColorWheel ariaLabel="wheel" defaultHue={0} defaultSaturation={0.5} onChange={onChange} />);
    act(() => { disc(r.root).props.onKeyDown(keyEvent("ArrowRight")); });
    expect(onChange).toHaveBeenCalledWith(expect.any(Number), 0.5);
    expect(onChange.mock.calls[0][0]).toBeGreaterThan(0);
  });

  it("is not focusable and emits nothing when disabled", () => {
    const onChange = vi.fn();
    const r = render(<ColorWheel ariaLabel="wheel" disabled onChange={onChange} />);
    const el = disc(r.root);
    expect(el.props.tabIndex).toBe(-1);
    act(() => { el.props.onKeyDown(keyEvent("ArrowUp")); });
    expect(onChange).not.toHaveBeenCalled();
  });
});
