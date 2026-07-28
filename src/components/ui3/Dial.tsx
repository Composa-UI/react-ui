import { useCallback, useId, useRef, useState } from "react";
import { clsx } from "clsx";
import { NumericInput } from "./Input";

// ─── Dial ───────────────────────────────────────────────────────────────────
// Rotary knob for the audio inspector (Frequency, Harmonics, Sharpness, Depth,
// Reverb, Loudness, …). A real dial — not a styled number field — with an arc
// indicator that fills from the min angle to the current-value angle and a notch
// pointer at the value.
//
// Controlled + uncontrolled discipline (mirrors Slider): `value` drives the
// component and `onChange` emits committed values; without `value` it keeps its
// own state seeded from `defaultValue`.
//
// Interaction (real PointerEvents — not synthetic clicks):
//   • Vertical drag — up = increase, down = decrease (standard knob gesture).
//   • Shift while dragging — fine control (smaller step / lower sensitivity).
//   • Double-click the knob — reset to `defaultValue` (reset affordance).
//   • Keyboard (knob is role="slider", focusable): Arrow ↑/→ +step, ↓/← −step,
//     Shift+Arrow = ×10 (larger step), Home = min, End = max.
//
// Typed entry reuses the DS `NumericInput` primitive rendered under the knob as
// the label+value row, so typed edits, formatting, and a11y match every other
// inspector control. That value field is also a horizontal drag-scrub surface
// (`scrub`) — dragging across it left/right changes the value with the same
// ew-resize idiom, step and clamp as the inspector's other numeric fields; a
// plain click still focuses it for typing. (Vertical knob drag is unchanged.)
//
// Theming: DS CSS variables only (light + [data-composa-mode="dark"]); no hex.

// Sweep geometry: a 270° arc with a 90° gap centred at the bottom.
// Angles measured clockwise from 12 o'clock (top): 0 = top, 90 = right,
// 180 = bottom, 270 = left.
const START_ANGLE = -135; // 7:30 position (bottom-left)
const SWEEP = 270;        // total travel to +135° (4:30, bottom-right)

// How many pixels of vertical drag traverse the full min→max range.
const DRAG_RANGE_PX = 200;
// Shift = fine control: sensitivity multiplier while dragging.
const FINE_FACTOR = 0.2;
// Shift+Arrow = coarse keyboard step.
const COARSE_KEY_MULT = 10;

export type DialSize = "small" | "medium" | "large";

// Knob diameter per size (px). The whole SVG is drawn in a 100×100 viewBox and
// scaled to this box, so stroke widths stay proportional.
const DIAL_PX: Record<DialSize, number> = {
  small: 36,
  medium: 48,
  large: 64,
};

const LABEL_T: Record<DialSize, string> = {
  small: "text-[9px] leading-[14px]",
  medium: "text-[11px] leading-[16px]",
  large: "text-[11px] leading-[16px]",
};

const FONT = "font-[family-name:var(--composa-font-family)] font-[450] tracking-[0.005em]";

export interface DialProps {
  /** Controlled value. Omit for uncontrolled (seeded from defaultValue). */
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Accessible name + the label shown under the knob (e.g. "Frequency"). */
  label?: string;
  /** Overrides `label` for the accessible name only (when no visible label). */
  ariaLabel?: string;
  /** Unit shown after the value in the typed-entry field (e.g. "Hz", "%"). */
  suffix?: string;
  size?: DialSize;
  /** Hide the label+value NumericInput row and render the knob alone. */
  hideValue?: boolean;
  /**
   * Where the label sits relative to the knob. "bottom" (default) keeps the
   * label with the value field beneath the knob. "top" places the label ABOVE
   * the knob and leaves only the value field below — the inspector knob-row
   * layout (label → dial → value), matching the Sequence audio reference.
   */
  labelPlacement?: "top" | "bottom";
  onChange?: (value: number) => void;
  className?: string;
}

/** Cartesian point on the dial circle for an angle measured clockwise from top. */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** SVG arc path between two angles (clockwise, clockwise-from-top convention). */
function arcPath(cx: number, cy: number, r: number, fromDeg: number, toDeg: number) {
  const from = polar(cx, cy, r, fromDeg);
  const to = polar(cx, cy, r, toDeg);
  const largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  // sweep-flag 1 = clockwise on screen for increasing (clockwise-from-top) angle.
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${largeArc} 1 ${to.x} ${to.y}`;
}

export function Dial({
  value,
  defaultValue = 0,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  label,
  ariaLabel,
  suffix,
  size = "medium",
  hideValue = false,
  labelPlacement = "bottom",
  onChange,
  className,
}: DialProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ y: number; value: number } | null>(null);

  const isControlled = value !== undefined;
  const current = isControlled ? value! : internal;

  const clamp = useCallback((n: number) => Math.min(max, Math.max(min, n)), [min, max]);
  // Snap a raw value to the step grid, anchored at min.
  const snap = useCallback((n: number) => {
    if (!(step > 0)) return clamp(n);
    const snapped = min + Math.round((n - min) / step) * step;
    // Keep the numeric precision of the step (avoid 0.1+0.2 drift).
    const decimals = (String(step).split(".")[1] ?? "").length;
    return clamp(Number(snapped.toFixed(decimals)));
  }, [clamp, min, step]);

  const commit = useCallback((n: number) => {
    const v = clamp(n);
    if (!isControlled) setInternal(v);
    onChange?.(v);
  }, [clamp, isControlled, onChange]);

  const range = max - min || 1;
  const pct = (clamp(current) - min) / range; // 0..1
  const valueAngle = START_ANGLE + pct * SWEEP;

  const px = DIAL_PX[size];
  const name = ariaLabel ?? label ?? "Dial";

  // ── Geometry (100×100 viewBox) ──────────────────────────────────────────────
  const C = 50;
  const R = 40;           // arc radius
  const notchOuter = 40;  // notch reaches the arc
  const notchInner = 22;  // notch starts inside the hub
  const trackPath = arcPath(C, C, R, START_ANGLE, START_ANGLE + SWEEP);
  const valuePath = arcPath(C, C, R, START_ANGLE, valueAngle);
  const notchA = polar(C, C, notchOuter, valueAngle);
  const notchB = polar(C, C, notchInner, valueAngle);
  const arcStroke = 6;

  // ── Pointer drag (vertical; up = increase) ──────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).focus();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStart.current = { y: e.clientY, value: current };
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart.current) return;
    const dy = dragStart.current.y - e.clientY; // up = positive
    const sensitivity = (range / DRAG_RANGE_PX) * (e.shiftKey ? FINE_FACTOR : 1);
    commit(snap(dragStart.current.value + dy * sensitivity));
  };

  const endDrag = useCallback(() => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setDragging(false);
  }, []);

  const onDoubleClick = () => {
    if (disabled) return;
    commit(snap(defaultValue));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const mult = e.shiftKey ? COARSE_KEY_MULT : 1;
    switch (e.key) {
      case "ArrowUp":
      case "ArrowRight":
        e.preventDefault();
        commit(snap(current + step * mult));
        break;
      case "ArrowDown":
      case "ArrowLeft":
        e.preventDefault();
        commit(snap(current - step * mult));
        break;
      case "Home":
        e.preventDefault();
        commit(min);
        break;
      case "End":
        e.preventDefault();
        commit(max);
        break;
      default:
        break;
    }
  };

  const valueText = suffix ? `${current} ${suffix}` : String(current);

  const topLabel = labelPlacement === "top" && !hideValue && label;

  return (
    <div className={clsx("flex flex-col items-center gap-[6px]", disabled && "opacity-30", className)}>
      {/* ── Label above the knob (inspector knob-row layout) ─────────────────── */}
      {topLabel && (
        <label htmlFor={id} className={clsx("text-c-text-secondary", LABEL_T[size], FONT)}>
          {label}
        </label>
      )}
      {/* ── Knob ────────────────────────────────────────────────────────────── */}
      <div
        role="slider"
        aria-label={name}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={valueText}
        aria-orientation="vertical"
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        data-composa-dial=""
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDoubleClick={onDoubleClick}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          "relative rounded-full outline-none touch-none select-none",
          !disabled && (dragging ? "cursor-grabbing" : "cursor-grab"),
          disabled && "cursor-not-allowed",
        )}
        style={{ width: px, height: px }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" fill="none">
          {/* Focus ring */}
          {focused && !disabled && (
            <circle cx={C} cy={C} r={47} stroke="var(--color-focus-ring)" strokeWidth={2} />
          )}
          {/* Hub */}
          <circle cx={C} cy={C} r={30} fill="var(--color-bg-secondary)" stroke="var(--color-border-translucent)" strokeWidth={1} />
          {/* Track arc */}
          <path d={trackPath} stroke="var(--color-border-translucent)" strokeWidth={arcStroke} strokeLinecap="round" />
          {/* Value arc */}
          {pct > 0 && (
            <path d={valuePath} stroke="var(--color-bg-brand)" strokeWidth={arcStroke} strokeLinecap="round" />
          )}
          {/* Notch pointer */}
          <line
            x1={notchB.x} y1={notchB.y} x2={notchA.x} y2={notchA.y}
            stroke="var(--color-icon)" strokeWidth={2.5} strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── Label + typed-entry value (reuses DS NumericInput) ─────────────────── */}
      {!hideValue && (
        <div className="flex flex-col items-center gap-[2px] w-full">
          {label && labelPlacement === "bottom" && (
            <label htmlFor={id} className={clsx("text-c-text-secondary", LABEL_T[size], FONT)}>
              {label}
            </label>
          )}
          <div className="w-[64px]">
            <NumericInput
              ariaLabel={`${name} value`}
              value={current}
              defaultValue={defaultValue}
              min={min}
              max={max}
              step={step}
              suffix={suffix}
              size="small"
              disabled={disabled}
              onChange={commit}
              scrub
            />
          </div>
        </div>
      )}
    </div>
  );
}
