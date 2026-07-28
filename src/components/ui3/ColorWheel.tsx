import { useCallback, useId, useRef, useState } from "react";
import { clsx } from "clsx";

// ─── ColorWheel ───────────────────────────────────────────────────────────────
// A circular hue/saturation "colour well" for the video Color Wheels grade
// controls (Shadows / Midtones / Highlights). A round hue-saturation disc — hue
// around the circle, saturation from the neutral centre to the fully-saturated
// edge — with a draggable centre handle. Same controlled/uncontrolled + real
// PointerEvents discipline as the Dial; DS CSS-variable theming only.
//
// Value model: `hue` (0–360°, measured counter-clockwise from the +x axis) and
// `saturation` (0–1, radius from centre). A grade wheel reads as "push this
// tonal range toward this hue by this much"; centre = neutral (no push).
//
// Interaction (real PointerEvents):
//   • Drag anywhere on the disc — the handle follows the pointer, clamped to the
//     disc radius (edge = full saturation).
//   • Double-click — reset to neutral centre (saturation 0).
//   • Keyboard (disc is role="slider", focusable): Arrow ←/→ rotate hue ∓, ↑/↓
//     change saturation, Shift = ×5 step, Home = neutral centre.

export interface ColorWheelProps {
  /** Controlled hue in degrees (0–360). Omit for uncontrolled (defaultHue). */
  hue?: number;
  /** Controlled saturation 0–1 (radius). Omit for uncontrolled (defaultSaturation). */
  saturation?: number;
  defaultHue?: number;
  defaultSaturation?: number;
  /** Disc diameter in px. */
  size?: number;
  disabled?: boolean;
  ariaLabel?: string;
  onChange?: (hue: number, saturation: number) => void;
  className?: string;
}

const HUE_STEP = 4;   // degrees per arrow press
const SAT_STEP = 0.04; // saturation per arrow press
const SHIFT_MULT = 5;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const wrapHue = (h: number) => ((h % 360) + 360) % 360;

export function ColorWheel({
  hue,
  saturation,
  defaultHue = 0,
  defaultSaturation = 0,
  size = 132,
  disabled = false,
  ariaLabel = "Color wheel",
  onChange,
  className,
}: ColorWheelProps) {
  const id = useId();
  const discRef = useRef<HTMLDivElement>(null);
  const [internalHue, setInternalHue] = useState(defaultHue);
  const [internalSat, setInternalSat] = useState(defaultSaturation);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const hueControlled = hue !== undefined;
  const satControlled = saturation !== undefined;
  const curHue = hueControlled ? hue! : internalHue;
  const curSat = satControlled ? saturation! : internalSat;

  const commit = useCallback((nextHue: number, nextSat: number) => {
    const h = wrapHue(nextHue);
    const s = clamp01(nextSat);
    if (!hueControlled) setInternalHue(h);
    if (!satControlled) setInternalSat(s);
    onChange?.(h, s);
  }, [hueControlled, satControlled, onChange]);

  const updateFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = discRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const radius = r.width / 2;
    const dist = Math.hypot(dx, dy);
    const sat = clamp01(dist / radius);
    // atan2(-dy, dx): counter-clockwise from +x, screen-y inverted.
    const hueDeg = wrapHue((Math.atan2(-dy, dx) * 180) / Math.PI);
    commit(hueDeg, sat);
  }, [commit]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).focus();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromPointer(e.clientX, e.clientY);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateFromPointer(e.clientX, e.clientY);
  };
  const endDrag = () => setDragging(false);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const mult = e.shiftKey ? SHIFT_MULT : 1;
    switch (e.key) {
      case "ArrowLeft": e.preventDefault(); commit(curHue - HUE_STEP * mult, curSat); break;
      case "ArrowRight": e.preventDefault(); commit(curHue + HUE_STEP * mult, curSat); break;
      case "ArrowUp": e.preventDefault(); commit(curHue, curSat + SAT_STEP * mult); break;
      case "ArrowDown": e.preventDefault(); commit(curHue, curSat - SAT_STEP * mult); break;
      case "Home": e.preventDefault(); commit(curHue, 0); break;
      default: break;
    }
  };

  // Handle position: centre + (cosθ, -sinθ) · saturation · radius.
  const rad = (curHue * Math.PI) / 180;
  const handleX = 50 + Math.cos(rad) * curSat * 50; // percent
  const handleY = 50 - Math.sin(rad) * curSat * 50;
  const valueText = `hue ${Math.round(curHue)}°, saturation ${Math.round(curSat * 100)}%`;

  return (
    <div className={clsx("flex flex-col items-center", disabled && "opacity-40", className)}>
      <div
        ref={discRef}
        role="slider"
        aria-label={ariaLabel}
        aria-valuetext={valueText}
        aria-valuenow={Math.round(curHue)}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-disabled={disabled || undefined}
        id={id}
        tabIndex={disabled ? -1 : 0}
        data-composa-color-wheel=""
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onDoubleClick={() => !disabled && commit(curHue, 0)}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          "relative rounded-full outline-none touch-none select-none",
          !disabled && (dragging ? "cursor-grabbing" : "cursor-crosshair"),
          disabled && "cursor-not-allowed",
        )}
        style={{ width: size, height: size }}
      >
        {/* Hue ring (conic) × saturation (radial white centre → transparent edge). */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, var(--color-bg) 0%, transparent 70%), " +
              "conic-gradient(from 90deg, #ff0000, #ff00ff, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)",
          }}
        />
        {/* Rim + focus ring, DS-tokened. */}
        <div className={clsx(
          "absolute inset-0 rounded-full ring-1 ring-inset",
          focused && !disabled ? "ring-[color:var(--color-focus-ring)] ring-2" : "ring-[color:var(--color-border-translucent)]",
        )} />
        {/* Draggable handle. */}
        <div
          className="absolute size-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-c-200 pointer-events-none"
          style={{
            left: `${handleX}%`,
            top: `${handleY}%`,
            backgroundColor: curSat === 0 ? "var(--color-bg)" : `hsl(${curHue}, ${Math.round(curSat * 100)}%, 55%)`,
          }}
        />
      </div>
    </div>
  );
}
