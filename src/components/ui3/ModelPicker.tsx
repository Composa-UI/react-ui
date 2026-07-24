import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── ModelPicker ──────────────────────────────────────────────────────────────
// Compact no-stroke pill in the composer toolbar that shows the active model and
// opens a model menu. The menu itself is host-owned (wired in PR2 via PopoverMenu);
// this is the trigger control only, matching the export's "Default ▾" pill.

export interface ModelPickerProps {
  value?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ModelPicker({ value = "Default", disabled = false, onClick, className }: ModelPickerProps) {
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-label={`Model: ${value}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "h-[24px] shrink-0 flex items-center gap-[2px] rounded-c-full pl-[8px] pr-[4px] outline-none transition-colors",
        "hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <span className={clsx(FONT, "whitespace-nowrap text-[11px] leading-[16px] font-[550] tracking-[0.055px] text-c-text")}>{value}</span>
      <ChevronDown size={12} strokeWidth={2} className="shrink-0 text-c-icon-secondary" />
    </button>
  );
}
