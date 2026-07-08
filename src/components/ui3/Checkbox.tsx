import { useState } from "react";
import { clsx } from "clsx";

export type CheckboxType = "Checked" | "Unchecked" | "Mixed";

interface CheckboxProps {
  checked?: boolean | "mixed";
  defaultChecked?: boolean;
  disabled?: boolean;
  /** muted = grayed-out appearance, used for soft-disabled or de-emphasized state */
  muted?: boolean;
  /** ghost = rendered on a dark canvas surface rather than the light inspector */
  ghost?: boolean;
  label?: string;
  state?: "default" | "focused";
  onChange?: (checked: boolean) => void;
  className?: string;
}

// Checkmark icon (8×7px)
function CheckIcon({ white }: { white: boolean }) {
  return (
    <svg width="8" height="7" viewBox="0 0 8 7" fill="none" className="absolute">
      <path
        d="M1 3.5L3 5.5L7 1.5"
        stroke={white ? "white" : "rgba(0,0,0,0.9)"}
        strokeOpacity={white ? 1 : 0.9}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Mixed/indeterminate dash (8×1px)
function MixedIcon({ white }: { white: boolean }) {
  return (
    <svg width="8" height="1" viewBox="0 0 8 1" fill="none" className="absolute">
      <rect
        width="8"
        height="1"
        fill={white ? "white" : "rgba(0,0,0,0.9)"}
        fillOpacity={white ? 1 : 0.5}
      />
    </svg>
  );
}

export function Checkbox({
  checked,
  defaultChecked = false,
  disabled = false,
  muted = false,
  ghost = false,
  label,
  state = "default",
  onChange,
  className,
}: CheckboxProps) {
  const [internal, setInternal] = useState<boolean | "mixed">(defaultChecked);
  const isControlled = checked !== undefined;
  const value = isControlled ? checked : internal;
  const focused = state === "focused";

  const handleClick = () => {
    if (disabled) return;
    const next = value === "mixed" ? true : !value;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const isChecked = value === true;
  const isMixed = value === "mixed";
  const isUnchecked = !isChecked && !isMixed;

  // ── Box background + border ──────────────────────────────────────────────
  const boxBg = disabled
    ? isUnchecked ? "" : "bg-c-bg-disabled"
    : muted
      ? "bg-c-bg-secondary"
      : ghost
        ? "bg-[#1e1e1e]"
        : isUnchecked
          ? "bg-c-bg-secondary"
          : "bg-c-bg-brand";

  const boxBorder =
    disabled && isUnchecked ? "border border-c-border-disabled" :
    disabled               ? "" :
    muted                  ? "border border-c-border" :
    isUnchecked && !ghost  ? focused ? "border border-c-border-selected-strong" : "border border-c-border" :
    isUnchecked && ghost   ? focused ? "border border-c-border-selected-strong" : "border border-c-border" :
    focused                ? "border border-c-border-selected-strong" :
    !ghost && !muted       ? "border border-c-border-onbrand-strong" :
    "";

  // Focused checked: inset white ring + outer blue border
  const focusedRing = focused && !isUnchecked && !disabled && !muted
    ? "shadow-[inset_0_0_0_2px_white]"
    : "";

  // ── Icon color ────────────────────────────────────────────────────────────
  // White icon: on brand bg or dark ghost bg; black icon: on muted/light bg
  const iconWhite = !muted && !disabled;

  // ── Label color ───────────────────────────────────────────────────────────
  const labelColor = disabled ? "text-c-text-tertiary" : "text-c-text";

  return (
    <button
      role="checkbox"
      aria-checked={isMixed ? "mixed" : isChecked}
      aria-disabled={disabled}
      aria-label={label}
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center gap-[8px] py-[4px] outline-none cursor-pointer",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      {/* Box */}
      <span
        className={clsx(
          "relative shrink-0 flex items-center justify-center",
          "size-[16px] rounded-[5px] transition-colors duration-100",
          boxBg,
          boxBorder,
          focusedRing,
        )}
      >
        {/* Focus ring overlay for checked/mixed focused */}
        {focused && !isUnchecked && !disabled && !muted && (
          <>
            <span className="absolute inset-0 rounded-[5px] bg-c-bg-brand pointer-events-none" />
            <span className="absolute inset-0 rounded-[5px] shadow-[inset_0_0_0_2px_white] pointer-events-none" />
            <span className="absolute inset-0 rounded-[5px] border border-c-border-selected-strong pointer-events-none" />
          </>
        )}

        {isChecked && <CheckIcon white={iconWhite} />}
        {isMixed && <MixedIcon white={iconWhite} />}
      </span>

      {/* Label */}
      {label && (
        <span className={clsx(
          "text-[11px] font-[450] leading-[16px] tracking-[0.005em]",
          "font-[family-name:var(--font-family-default)] whitespace-nowrap",
          labelColor,
        )}>
          {label}
        </span>
      )}
    </button>
  );
}
