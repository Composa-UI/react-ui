import { useState, useId } from "react";
import { clsx } from "clsx";

// ─── Slider ───────────────────────────────────────────────────────────────────
// Matches Figma UI3 SliderBackground + SliderHandle spec.
//
// Track:  16px tall pill — bg-c-bg-secondary + 1px border
// Fill:   bg-c-bg-brand, left edge → handle centre
// Handle: 16px white circle, CSS filter drop-shadow
// Focus:  track border changes to border-c-border-selected;
//         handle SVG circle gets r→7.5 + blue inner stroke
//
// Handle variants:
//   "fill"   — plain white circle (default / unmodified value)
//   "stroke" — white circle + inner hole-punch ring (modified / non-default value)
//   "chit"   — white circle + small colour swatch inside (gradient stop handle)
//
// Track variants:
//   "default"  — bg-c-bg-secondary with translucent border
//   "gradient" — CSS gradient string fills the track
//   "alpha"    — checkerboard + CSS gradient (opacity/alpha sliders)
//
// Delta indicator:
//   When `showDelta` is true and the current value ≠ defaultValue, a thin
//   vertical line appears at the defaultValue position on the track.
//
// Disabled:
//   Entire component renders at 30% opacity (per Figma spec).

const THUMB = 16; // px — handle diameter, equals track height

const HANDLE_SHADOW =
  "drop-shadow(0px 0px 0.25px rgba(0,0,0,0.18)) drop-shadow(0px 3px 4px rgba(0,0,0,0.1)) drop-shadow(0px 1px 1.5px rgba(0,0,0,0.1))";

export type SliderHandleVariant = "fill" | "stroke" | "chit";
export type SliderTrackVariant  = "default" | "gradient" | "alpha";

interface SliderProps {
  /** Accessible name for the native range input when its visible label lives outside this primitive. */
  ariaLabel?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** fill = unmodified (white), stroke = modified (hole-punch), chit = colour swatch */
  handleVariant?: SliderHandleVariant;
  /** Colour shown inside the chit handle */
  chitColor?: string;
  /** Show a delta marker at the defaultValue position when value ≠ defaultValue */
  showDelta?: boolean;
  /** Show circular step dots on the track at each step interval */
  showSteps?: boolean;
  /** alpha = checkerboard + gradient; gradient = pure CSS gradient */
  trackVariant?: SliderTrackVariant;
  /** CSS gradient string for gradient / alpha track variants */
  trackGradient?: string;
  onChange?: (value: number) => void;
  className?: string;
}

// ─── Handle ───────────────────────────────────────────────────────────────────

function Handle({
  pct,
  focused,
  variant = "fill",
  chitColor = "#0d99ff",
}: {
  pct: number;
  focused: boolean;
  variant?: SliderHandleVariant;
  chitColor?: string;
}) {
  // Handle travels within the track bounds:
  //   left = (trackWidth - thumbSize) × pct   →  CSS: calc((100% - 16px) × pct)
  const left = `calc((100% - ${THUMB}px) * ${pct / 100})`;

  return (
    <div
      // Vertically centered on the track (top-1/2 + -translate-y-1/2) rather than
      // pinned to top-0 — keeps the handle centred regardless of track height and
      // matches the delta-marker / step-dot positioning in this component.
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
      style={{ left, width: THUMB, height: THUMB, filter: HANDLE_SHADOW }}
    >
      {/* Outer SVG circle — focus ring via inner stroke (r shrinks to keep 16px bounds) */}
      <svg viewBox="0 0 16 16" fill="none" className="absolute inset-0 size-full">
        <circle
          cx="8" cy="8"
          r={focused ? 7.5 : 8}
          fill="white"
          stroke={focused ? "var(--color-border-selected)" : undefined}
          strokeWidth={focused ? 1 : undefined}
        />
      </svg>

      {/* Stroke (modified) — hole-punch inner ring */}
      {variant === "stroke" && (
        <svg viewBox="0 0 16 16" fill="none" className="absolute inset-0 size-full">
          <circle cx="8" cy="8" r="3.75"
            stroke="rgba(0,0,0,0.15)" strokeWidth="0.5"
          />
        </svg>
      )}

      {/* Chit — small colour dot inside */}
      {variant === "chit" && (
        <div
          className="absolute rounded-full"
          style={{ inset: "25%", backgroundColor: chitColor, border: "0.5px solid rgba(0,0,0,0.1)" }}
        />
      )}
    </div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────

export function Slider({
  ariaLabel,
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  handleVariant = "fill",
  chitColor,
  showDelta = false,
  showSteps = false,
  trackVariant = "default",
  trackGradient,
  onChange,
  className,
}: SliderProps) {
  const id = useId();
  const [internal, setInternal] = useState(defaultValue);
  const [focused,  setFocused]  = useState(false);

  const isControlled = value !== undefined;
  const current = isControlled ? value! : internal;

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const pct = ((clamp(current) - min) / (max - min)) * 100;
  const defaultPct = ((clamp(defaultValue) - min) / (max - min)) * 100;
  const hasDelta = showDelta && Math.abs(current - defaultValue) > (step * 0.01);

  const set = (n: number) => {
    const v = clamp(n);
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  // Fill: extends from left edge to the centre of the handle.
  // At pct=0 the fill is 0 (no blue visible); above 0 it reaches handle centre.
  //   width = (trackWidth - thumbSize) × pct/100 + thumbSize/2
  //   CSS  = calc((100% - 16px) × pct + 8px)
  // Special-cased to 0 at pct=0 so no blue sliver appears.
  const fillWidth = pct === 0
    ? "0px"
    : `calc((100% - ${THUMB}px) * ${pct / 100} + ${THUMB / 2}px)`;

  // Delta marker: thin vertical line at defaultValue position on track
  const deltaLeft = `calc((100% - ${THUMB}px) * ${defaultPct / 100} + ${THUMB / 2}px)`;

  // Step dots: small circles at each step position inside the track
  const stepDots = showSteps && step > 0
    ? Array.from(
        { length: Math.floor((max - min) / step) + 1 },
        (_, i) => ((i * step) / (max - min)) * 100,
      )
    : [];

  // Track border — changes to selected on focus
  const trackBorderColor = focused && !disabled
    ? "var(--color-border-selected)"
    : "var(--color-border-translucent)";

  return (
    // Disabled = 30% opacity on the whole component (Figma spec)
    <div className={clsx("relative h-[16px] w-full", disabled && "opacity-30", className)}>

      {/* ── Track background ─────────────────────────────────────────────── */}
      {trackVariant === "default" && (
        <div
          className="absolute inset-0 rounded-full bg-c-bg-secondary"
          style={{ border: `1px solid ${trackBorderColor}` }}
        />
      )}

      {trackVariant === "gradient" && (
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ border: `1px solid ${trackBorderColor}` }}
        >
          {trackGradient && (
            <div className="absolute inset-0" style={{ background: trackGradient }} />
          )}
        </div>
      )}

      {trackVariant === "alpha" && (
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ border: `1px solid ${trackBorderColor}` }}
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)",
              backgroundSize: "8px 8px",
            }}
          />
          {trackGradient && (
            <div className="absolute inset-0" style={{ background: trackGradient }} />
          )}
        </div>
      )}

      {/* ── Fill (brand blue) ────────────────────────────────────────────── */}
      {trackVariant === "default" && pct > 0 && (
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-c-bg-brand pointer-events-none"
          style={{ width: fillWidth }}
        />
      )}

      {/* ── Step dots ────────────────────────────────────────────────────── */}
      {stepDots.map((dotPct, i) => {
        const dotLeft = `calc((100% - ${THUMB}px) * ${dotPct / 100} + ${THUMB / 2}px)`;
        const isFilled = dotPct <= pct;
        return (
          <div
            key={i}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              left: dotLeft,
              width: 3,
              height: 3,
              backgroundColor: isFilled
                ? "rgba(255,255,255,0.8)"
                : "rgba(0,0,0,0.15)",
            }}
          />
        );
      })}

      {/* ── Delta indicator (default value marker) ───────────────────────── */}
      {hasDelta && (
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none bg-c-bg-brand-pressed"
          style={{ left: deltaLeft, width: 2, height: 8 }}
        />
      )}

      {/* ── Handle ───────────────────────────────────────────────────────── */}
      <Handle
        pct={pct}
        focused={focused && !disabled}
        variant={handleVariant}
        chitColor={chitColor}
      />

      {/* ── Native input (interaction + a11y) ────────────────────────────── */}
      <input
        id={id}
        aria-label={ariaLabel}
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        disabled={disabled}
        onChange={e => set(parseFloat(e.target.value))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={clsx(
          "absolute inset-0 w-full h-full opacity-0",
          disabled ? "cursor-not-allowed" : "cursor-pointer",
        )}
        style={{ WebkitAppearance: "none" }}
      />
    </div>
  );
}

// ─── PickerHandle ─────────────────────────────────────────────────────────────
// Shared with 2D color-area pickers. Same visual as Slider's chit variant:
// white circle with drop-shadow + small colour dot inside.

interface PickerHandleProps {
  color: string;
  focused?: boolean;
  className?: string;
}

export function PickerHandle({ color, focused = false, className }: PickerHandleProps) {
  return (
    <div
      className={clsx("relative pointer-events-none", className)}
      style={{ width: THUMB, height: THUMB, filter: HANDLE_SHADOW }}
    >
      <svg viewBox="0 0 16 16" fill="none" className="absolute inset-0 size-full">
        <circle
          cx="8" cy="8"
          r={focused ? 7.5 : 8}
          fill="white"
          stroke={focused ? "var(--color-border-selected)" : undefined}
          strokeWidth={focused ? 1 : undefined}
        />
      </svg>
      <div
        className="absolute rounded-full"
        style={{ inset: "25%", backgroundColor: color, border: "0.5px solid rgba(0,0,0,0.1)" }}
      />
    </div>
  );
}

// ─── GradientStopHandle ────────────────────────────────────────────────────────
// Figma SliderGradientStop: colour-stop marker with 24px chit + triangle pointer.
// radius-medium (5px) on the chit square per Figma spec.

interface GradientStopHandleProps {
  color: string;
  selected?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
  /** Names the handle for assistive tech and gives drag tests something to grab. */
  ariaLabel?: string;
  /** The stop's position, so a keyboard user can read where the handle sits. */
  position?: number;
  /**
   * Pointer handlers, so the owner can drag the handle along its track. Without
   * them the handle is a static marker — the state it shipped in, which read as
   * a draggable control while ignoring every pointer that touched it.
   */
  onPointerDown?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel?: (event: React.PointerEvent<HTMLDivElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function GradientStopHandle({
  color,
  selected = false,
  style,
  className,
  onClick,
  ariaLabel,
  position,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onKeyDown,
}: GradientStopHandleProps) {
  const bg = selected ? "var(--color-bg-brand)" : "var(--color-bg-secondary)";
  // A handle that can be moved is a slider; one that is only a marker keeps the
  // plain presentational shape it had, so nothing promises interaction it lacks.
  const interactive = Boolean(onPointerDown || onKeyDown || onClick);

  return (
    <div
      className={clsx(
        "flex flex-col items-center cursor-pointer select-none",
        interactive && "touch-none outline-none",
        className,
      )}
      style={{
        filter: HANDLE_SHADOW,
        ...style,
      }}
      role={interactive ? "slider" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={ariaLabel}
      aria-valuemin={interactive && position !== undefined ? 0 : undefined}
      aria-valuemax={interactive && position !== undefined ? 100 : undefined}
      aria-valuenow={interactive ? position : undefined}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    >
      {/* Chit — rounded-c-md = radius-medium = 5px */}
      <div
        className="relative rounded-c-md size-[24px] overflow-hidden"
        style={{ backgroundColor: bg }}
      >
        <div
          className="absolute rounded-[2px]"
          style={{ inset: 5, backgroundColor: color }}
        />
      </div>

      {/* Triangle pointer (inverted) */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: `6px solid ${bg}`,
        }}
      />
    </div>
  );
}
