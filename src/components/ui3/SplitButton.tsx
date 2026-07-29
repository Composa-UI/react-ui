import { type ReactNode } from "react";
import { clsx } from "clsx";

interface SplitButtonProps {
  icon: ReactNode;
  accentColor?: string;
  size?: "default" | "large";
  actionLabel?: string;
  menuLabel?: string;
  /** Brand-active state on the primary segment (e.g. a playing/pressed action). */
  selected?: boolean;
  /** Disable only the primary action segment; the chevron stays operable so the
   *  menu is always reachable (capability gating without an inert control). */
  disabled?: boolean;
  /**
   * Controlled disclosure state for the chevron's menu. When provided, the
   * chevron advertises `aria-haspopup="menu"` + `aria-expanded` and reflects the
   * open state visually — matching the creation toolbar's split-button chevron.
   */
  menuOpen?: boolean;
  onIconClick?: () => void;
  onChevronClick?: () => void;
  className?: string;
}

export function SplitButton({ icon, accentColor, size = "default", actionLabel, menuLabel, selected, disabled, menuOpen, onIconClick, onChevronClick, className }: SplitButtonProps) {
  const large = size === "large";
  const hasMenuSemantics = menuOpen !== undefined;
  return (
    <div className={clsx("bg-c-bg-secondary flex gap-px items-center rounded-c-md shrink-0 overflow-hidden", large && "h-[32px]", className)}>
      <button
        type="button"
        aria-label={actionLabel}
        aria-pressed={selected !== undefined ? selected : undefined}
        disabled={disabled}
        onClick={onIconClick}
        style={accentColor && !selected ? { backgroundColor: accentColor } : undefined}
        className={clsx(
          "flex items-center justify-center rounded-l-c-md transition-colors duration-100 outline-none",
          large ? "px-[8px] h-full" : "p-[4px]",
          selected
            ? "bg-c-bg-brand text-c-text-on-brand"
            : clsx("text-c-icon", !accentColor && "bg-c-bg hover:bg-c-bg-hover active:bg-c-bg-secondary"),
          disabled && "opacity-40 cursor-not-allowed",
        )}
      >
        {icon}
      </button>
      <button
        type="button"
        aria-label={menuLabel}
        aria-haspopup={hasMenuSemantics ? "menu" : undefined}
        aria-expanded={hasMenuSemantics ? menuOpen : undefined}
        onClick={onChevronClick}
        className={clsx(
          "flex items-center justify-center self-stretch rounded-r-c-md transition-colors duration-100 outline-none text-c-icon bg-c-bg hover:bg-c-bg-hover active:bg-c-bg-secondary",
          large ? "w-[20px]" : "py-[4px] w-[16px]",
          menuOpen && "bg-c-bg-hover",
        )}
      >
        <svg width="6" height="4" viewBox="0 0 6 4" fill="none">
          <path d="M0.5 0.5L3 3L5.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
