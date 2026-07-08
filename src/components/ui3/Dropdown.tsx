import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

// Dropdown is the trigger control only — the panel/menu is handled separately.
// Matches UI3 inspector dropdown: bg-c-bg, border, value text + chevron.

interface DropdownProps {
  value?: string;
  placeholder?: string;
  size?: "default" | "large";
  state?: "default" | "focused" | "active";
  mixed?: boolean;            // multi-select with differing values — shows "Mixed" (v5 §7)
  disabled?: boolean;
  stroke?: boolean;           // whether to show a border (default true)
  editable?: boolean;         // combo-style (type-to-edit) — only these highlight the value text when active
  fullWidth?: boolean;        // fill the container instead of the fixed 117px
  leadingIcon?: ReactNode;    // optional icon slot (large size only)
  onClick?: () => void;
  className?: string;
}

export function Dropdown({
  value,
  placeholder = "Value",
  size = "default",
  state = "default",
  mixed = false,
  disabled = false,
  stroke = true,
  editable = false,
  fullWidth = false,
  leadingIcon,
  onClick,
  className,
}: DropdownProps) {
  const [internalActive, setInternalActive] = useState(false);
  const h = size === "large" ? "h-[32px]" : "h-[24px]";
  const focused = state === "focused";
  const active = state === "active" || internalActive;

  const ring = stroke
    ? clsx(
        "ring-1 ring-inset",
        disabled ? "ring-c-border-disabled" :
        // Blue selected ring only for editable (type-to-edit) dropdowns; menu dropdowns
        // just open a list and keep the neutral border.
        (focused || active) && editable ? "ring-c-border-selected" :
        "ring-c-border",
      )
    : "";

  const textColor = disabled || mixed ? "text-c-text-tertiary" : "text-c-text";

  // Only editable (type-to-edit) dropdowns highlight the value text on active —
  // menu-pick dropdowns just open a list, so no text-selection highlight.
  const valueHighlight = active && !disabled && editable
    ? "bg-[rgba(13,153,255,0.4)]"
    : "";

  return (
    <button
      onClick={disabled ? undefined : (e) => { setInternalActive(true); onClick?.(); }}
      onBlur={() => setInternalActive(false)}
      disabled={disabled}
      className={clsx(
        "relative inline-flex items-center rounded-c-md bg-c-bg overflow-hidden",
        "transition-colors duration-100 outline-none",
        h,
        ring,
        !stroke && "w-auto",
        stroke && !fullWidth && "w-[117px]",
        fullWidth && "w-full",
        size === "large" && stroke && leadingIcon ? "pr-[4px]" :
        size === "large" && !stroke && leadingIcon ? "pr-[4px]" :
        "px-[0px]",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      {/* Leading icon slot (large only) */}
      {leadingIcon && size === "large" && (
        <span className="shrink-0 flex items-center justify-center size-[32px]">
          <span className={clsx(
            "flex items-center justify-center rounded-c-md size-[24px]",
            disabled ? "bg-transparent" : "bg-c-bg-secondary",
          )}>
            {leadingIcon}
          </span>
        </span>
      )}

      {/* Leading icon slot (default size) */}
      {leadingIcon && size === "default" && (
        <span className={clsx(
          "shrink-0 flex items-center justify-center size-[24px] text-c-icon-secondary",
          disabled && "opacity-50",
        )}>
          {leadingIcon}
        </span>
      )}

      {/* Value text */}
      <span className={clsx(
        "flex-1 min-w-0 flex items-center h-full overflow-hidden",
        leadingIcon ? "px-[4px]" : "pl-[8px]",
      )}>
        <span className={clsx(
          "text-[11px] font-[450] leading-[16px] tracking-[0.055px] whitespace-nowrap overflow-hidden text-ellipsis",
          "font-[family-name:var(--composa-font-family)]",
          textColor,
          valueHighlight,
        )}>
          {mixed ? "Mixed" : (value ?? placeholder)}
        </span>
      </span>

      {/* Chevron */}
      <span className={clsx(
        "shrink-0 flex items-center justify-center size-[24px]",
        disabled ? "text-c-icon-tertiary" : "text-c-icon-secondary",
      )}>
        <ChevronDown size={10} strokeWidth={2} />
      </span>
    </button>
  );
}
