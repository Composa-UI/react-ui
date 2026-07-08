import { clsx } from "clsx";
import { type ReactNode } from "react";

// ListCell — mode-adaptive row primitive for panel / inspector surfaces.
// For menu surfaces (always dark, blue hover) use MenuRow in Menu.tsx instead.

export type ListCellSize = "compact" | "default" | "large";
export type ListCellVariant = "default" | "selected" | "disabled" | "destructive";

interface ListCellProps {
  label: string;
  sublabel?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  shortcut?: string;
  size?: ListCellSize;
  variant?: ListCellVariant;
  separator?: boolean;
  onClick?: () => void;
  className?: string;
}

// Heights per size — 4px increments matching Figma spec
const HEIGHTS: Record<ListCellSize, string> = {
  compact: "min-h-[24px]",
  default: "min-h-[28px]",
  large:   "min-h-[32px]",
};

const FONT = "font-[family-name:var(--composa-font-family)]";
const LABEL_BASE = clsx(FONT, "text-[11px] leading-[16px] tracking-[0.005em] font-[450]");

export function ListCell({
  label,
  sublabel,
  leading,
  trailing,
  shortcut,
  size = "default",
  variant = "default",
  separator = false,
  onClick,
  className,
}: ListCellProps) {
  const disabled    = variant === "disabled";
  const selected    = variant === "selected";
  const destructive = variant === "destructive";
  const interactive = !disabled && !!onClick;

  const labelColor = destructive ? "text-c-text-danger"
    : disabled ? "text-c-text-tertiary"
    : "text-c-text";

  // Trailing and shortcut always use tertiary (muted) in panel context
  const mutedColor = disabled ? "text-c-text-tertiary" : "text-c-text-secondary";

  return (
    <>
      {separator && <div className="h-px mx-[4px] my-[2px] bg-c-border" />}
      <div
        role={onClick ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onClick={disabled ? undefined : onClick}
        onKeyDown={interactive ? e => (e.key === "Enter" || e.key === " ") && onClick?.() : undefined}
        className={clsx(
          "relative flex items-center gap-[8px] px-[8px] rounded-c-sm select-none",
          HEIGHTS[size],
          selected && "bg-c-bg-selected",
          interactive && "hover:bg-c-bg-hover cursor-pointer",
          disabled && "cursor-not-allowed",
          "outline-none focus-visible:ring-1 focus-visible:ring-c-focus-ring",
          className,
        )}
      >
        {leading && (
          // 24px container — foundational slot size matching Figma spec (avatar, icon, chit all fit)
          <span className={clsx(
            "shrink-0 flex items-center justify-center size-[24px]",
            disabled ? "text-c-text-tertiary" : "text-c-icon",
          )}>
            {leading}
          </span>
        )}

        <span className="flex-1 min-w-0 flex flex-col justify-center">
          <span className={clsx(LABEL_BASE, labelColor, "truncate")}>{label}</span>
          {sublabel && (
            <span className={clsx(
              FONT, "text-[9px] leading-[14px] tracking-[0.05em] font-[450]",
              disabled ? "text-c-text-tertiary" : "text-c-text-secondary",
              "truncate",
            )}>
              {sublabel}
            </span>
          )}
        </span>

        {(trailing || shortcut) && (
          <span className="shrink-0 flex items-center gap-[4px]">
            {/* Shortcut stays muted — it's a keyboard hint, not content */}
            {shortcut && (
              <span className={clsx(FONT, "text-[11px] leading-[16px] tracking-[0.005em] font-[450]", mutedColor)}>
                {shortcut}
              </span>
            )}
            {/* Trailing ReactNode owns its own color */}
            {trailing}
          </span>
        )}
      </div>
    </>
  );
}

export function ListCellGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx("flex flex-col p-[4px]", className)}>
      {children}
    </div>
  );
}
