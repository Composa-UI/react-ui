import { type ReactNode } from "react";
import { clsx } from "clsx";
import { Tooltip } from "./Tooltip";

export interface IconButtonProps {
  /** The glyph to render (a sized lucide icon or equivalent). The caller sizes
   *  the icon; the button is a fixed 24px hit target and centers it. */
  icon: ReactNode;
  /** Accessible name. Icon-only buttons carry no visible text, so this is both
   *  the `aria-label` and the hover/focus tooltip (Composa#661: a bare glyph is
   *  otherwise unexplained). */
  label: string;
  /** Toggle "on" state: paints the selected ground and advertises `aria-pressed`.
   *  Leave undefined for a plain action button, which stays unpressed. */
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Override the hover tooltip; defaults to `label`. Suppressed when disabled,
   *  the same way IconButtonRow / PanelActionBtn suppress theirs. */
  tooltip?: string;
  className?: string;
}

/**
 * The shared 24px icon-only button. Panels and toolbars use this instead of
 * re-implementing a private `<button>` per file — the drift the contract's
 * `no-adhoc-icon-button` check forbids. For a connected row of these use
 * `IconButtonRow`, and for a section right-action with an accent "on" glyph use
 * `PanelActionBtn` (both in Panel.tsx); this is the standalone one.
 */
export function IconButton({
  icon,
  label,
  active,
  disabled = false,
  onClick,
  tooltip,
  className,
}: IconButtonProps) {
  const button = (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        "flex items-center justify-center size-[24px] shrink-0 rounded-c-md outline-none transition-colors",
        "text-c-icon hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring",
        active && "bg-c-bg-selected",
        disabled && "cursor-not-allowed text-c-text-disabled",
        className,
      )}
    >
      {icon}
    </button>
  );
  return <Tooltip label={tooltip ?? label} disabled={disabled}>{button}</Tooltip>;
}
