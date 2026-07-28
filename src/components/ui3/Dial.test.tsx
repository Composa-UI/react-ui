import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { Dial } from "./Dial";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// ── Fake events (react-test-renderer has no DOM) ────────────────────────────────
function pointerEvent(clientY: number, shiftKey = false) {
  return {
    clientY,
    shiftKey,
    pointerId: 1,
    preventDefault: vi.fn(),
    currentTarget: { focus: vi.fn(), setPointerCapture: vi.fn() },
  };
}
function keyEvent(key: string, shiftKey = false) {
  return { key, shiftKey, preventDefault: vi.fn() };
}
// Horizontal scrub across the value field (drag-to-scrub). Mirrors NumericInput's
// iconLead scrub: value += Math.round((clientX - startX) / 2) · step · (shift ? 10 : 1).
function scrubEvent(clientX: number, shiftKey = false) {
  return {
    clientX,
    shiftKey,
    pointerId: 1,
    preventDefault: vi.fn(),
    currentTarget: { setPointerCapture: vi.fn() },
  };
}

function knob(root: ReactTestInstance) {
  return root.find(node => node.props.role === "slider");
}
function valueField(root: ReactTestInstance) {
  return root.find(node => node.props.role === "spinbutton");
}

function render(ui: React.ReactElement) {
  let r!: ReactTestRenderer;
  act(() => { r = create(ui); });
  return r;
}

describe("Dial — controlled value contract", () => {
  it("reflects the controlled value via ARIA slider semantics", () => {
    const r = render(<Dial label="Reverb" value={42} min={0} max={100} onChange={() => {}} />);
    const el = knob(r.root);
    expect(el.props["aria-valuenow"]).toBe(42);
    expect(el.props["aria-valuemin"]).toBe(0);
    expect(el.props["aria-valuemax"]).toBe(100);
    expect(el.props["aria-label"]).toBe("Reverb");
    expect(el.props.role).toBe("slider");
  });

  it("does not mutate its own state when controlled (host owns value)", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Depth" value={30} min={0} max={100} step={1} onChange={onChange} />);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("ArrowUp")); });
    // Emits the requested value but the displayed value stays until the host re-renders.
    expect(onChange).toHaveBeenCalledWith(31);
    expect(knob(r.root).props["aria-valuenow"]).toBe(30);
  });
});

describe("Dial — pointer drag (up = increase)", () => {
  it("increases on upward drag and snaps to step", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    const el = knob(r.root);
    act(() => { el.props.onPointerDown(pointerEvent(100)); });
    // Drag up 50px. Sensitivity = range(100)/200px = 0.5 → +25 → 75.
    act(() => { knob(r.root).props.onPointerMove(pointerEvent(50)); });
    expect(onChange).toHaveBeenLastCalledWith(75);
  });

  it("decreases on downward drag", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    const el = knob(r.root);
    act(() => { el.props.onPointerDown(pointerEvent(100)); });
    act(() => { knob(r.root).props.onPointerMove(pointerEvent(120)); }); // down 20px → -10 → 40
    expect(onChange).toHaveBeenLastCalledWith(40);
  });

  it("Shift = fine control (smaller effective step)", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    const el = knob(r.root);
    act(() => { el.props.onPointerDown(pointerEvent(100)); });
    // 50px up with Shift → sensitivity 0.5 * 0.2 = 0.1 → +5 → 55.
    act(() => { knob(r.root).props.onPointerMove(pointerEvent(50, true)); });
    expect(onChange).toHaveBeenLastCalledWith(55);
  });

  it("clamps at max on a large upward drag", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    const el = knob(r.root);
    act(() => { el.props.onPointerDown(pointerEvent(100)); });
    act(() => { knob(r.root).props.onPointerMove(pointerEvent(-300)); }); // dy=400 → +200 → clamp 100
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("clamps at min on a large downward drag", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    const el = knob(r.root);
    act(() => { el.props.onPointerDown(pointerEvent(100)); });
    act(() => { knob(r.root).props.onPointerMove(pointerEvent(600)); }); // dy=-500 → clamp 0
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});

describe("Dial — keyboard", () => {
  it("Arrow up/down step by `step`", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="D" defaultValue={20} min={0} max={100} step={5} onChange={onChange} />);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("ArrowUp")); });
    expect(onChange).toHaveBeenLastCalledWith(25);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("ArrowDown")); });
    expect(onChange).toHaveBeenLastCalledWith(20);
  });

  it("Shift+Arrow uses the larger (×10) step", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="D" defaultValue={10} min={0} max={200} step={1} onChange={onChange} />);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("ArrowUp", true)); });
    expect(onChange).toHaveBeenLastCalledWith(20);
  });

  it("Home/End jump to min/max", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="D" defaultValue={50} min={5} max={95} onChange={onChange} />);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("End")); });
    expect(onChange).toHaveBeenLastCalledWith(95);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("Home")); });
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it("does not step past min/max via keyboard (clamp)", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="D" defaultValue={99} min={0} max={100} step={5} onChange={onChange} />);
    act(() => { knob(r.root).props.onKeyDown(keyEvent("ArrowUp")); });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });
});

describe("Dial — reset + typed entry", () => {
  it("double-click resets to defaultValue", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="D" defaultValue={60} min={0} max={100} step={1} onChange={onChange} />);
    // move it away first
    act(() => { knob(r.root).props.onKeyDown(keyEvent("ArrowUp")); });
    expect(onChange).toHaveBeenLastCalledWith(61);
    act(() => { knob(r.root).props.onDoubleClick(); });
    expect(onChange).toHaveBeenLastCalledWith(60);
  });

  it("renders the DS NumericInput primitive for typed entry", () => {
    const r = render(<Dial label="Loudness" value={70} min={0} max={100} onChange={() => {}} />);
    const field = valueField(r.root);
    expect(field).toBeTruthy();
    expect(field.props["aria-label"]).toBe("Loudness value");
    expect(field.props.value).toBe("70");
  });

  it("typed entry commits through the Dial onChange (clamped)", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Loudness" defaultValue={70} min={0} max={100} onChange={onChange} />);
    act(() => { valueField(r.root).props.onChange({ target: { value: "88" } }); });
    expect(onChange).toHaveBeenCalledWith(88);
    // Out-of-range typed value clamps.
    act(() => { valueField(r.root).props.onChange({ target: { value: "250" } }); });
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("hideValue omits the typed-entry field", () => {
    const r = render(<Dial label="Bare" value={10} min={0} max={100} hideValue onChange={() => {}} />);
    expect(r.root.findAll(node => node.props.role === "spinbutton")).toHaveLength(0);
  });
});

describe("Dial — value-field horizontal scrub", () => {
  it("increases the value on a rightward drag across the value field (same step + rounding as the other inputs)", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    act(() => { valueField(r.root).props.onPointerDown(scrubEvent(100)); });
    // +40px → Math.round(40/2)=20 · step 1 → 50 + 20 = 70.
    act(() => { valueField(r.root).props.onPointerMove(scrubEvent(140)); });
    expect(onChange).toHaveBeenLastCalledWith(70);
    act(() => { valueField(r.root).props.onPointerUp(scrubEvent(140)); });
  });

  it("decreases on a leftward drag", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={100} step={1} onChange={onChange} />);
    act(() => { valueField(r.root).props.onPointerDown(scrubEvent(100)); });
    act(() => { valueField(r.root).props.onPointerMove(scrubEvent(60)); }); // -40 → -20 → 30
    expect(onChange).toHaveBeenLastCalledWith(30);
  });

  it("Shift = ×10 step, matching the inspector's other numeric fields", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" defaultValue={50} min={0} max={200} step={1} onChange={onChange} />);
    act(() => { valueField(r.root).props.onPointerDown(scrubEvent(100)); });
    act(() => { valueField(r.root).props.onPointerMove(scrubEvent(104, true)); }); // round(4/2)=2 ·1·10 = 20 → 70
    expect(onChange).toHaveBeenLastCalledWith(70);
  });

  it("clamps the scrubbed value at max", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" value={90} min={0} max={100} step={1} onChange={onChange} />);
    act(() => { valueField(r.root).props.onPointerDown(scrubEvent(100)); });
    act(() => { valueField(r.root).props.onPointerMove(scrubEvent(200)); }); // +50 → 140 → clamp 100
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it("clamps the scrubbed value at min", () => {
    const onChange = vi.fn();
    const r = render(<Dial label="Freq" value={10} min={5} max={100} step={1} onChange={onChange} />);
    act(() => { valueField(r.root).props.onPointerDown(scrubEvent(100)); });
    act(() => { valueField(r.root).props.onPointerMove(scrubEvent(0)); }); // -50 → -40 → clamp 5
    expect(onChange).toHaveBeenLastCalledWith(5);
  });
});
