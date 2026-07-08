import { clsx } from "clsx";
import { type ReactNode } from "react";

// TextPair — label + value display primitive.
// Used in inspector rows, property panels, tooltips, section headers.

type TextPairSize = "small" | "default";
type TextPairLayout = "horizontal" | "vertical";

interface TextPairProps {
  label: string;
  value?: string | ReactNode;
  layout?: TextPairLayout;
  size?: TextPairSize;
  /** Mute the label (e.g. inside a section that already has context) */
  mutedLabel?: boolean;
  /** Make the value visually prominent */
  prominentValue?: boolean;
  className?: string;
}

const SIZE_LABEL: Record<TextPairSize, string> = {
  small:   "text-[9px] leading-[14px] tracking-[0.05em]",
  default: "text-[11px] leading-[16px] tracking-[0.005em]",
};
const SIZE_VALUE: Record<TextPairSize, string> = {
  small:   "text-[9px] leading-[14px] tracking-[0.05em]",
  default: "text-[11px] leading-[16px] tracking-[0.005em]",
};

const FONT = "font-[family-name:var(--composa-font-family)]";

export function TextPair({
  label,
  value,
  layout = "horizontal",
  size = "default",
  mutedLabel = false,
  prominentValue = false,
  className,
}: TextPairProps) {
  const labelClass = clsx(
    FONT, SIZE_LABEL[size], "shrink-0",
    mutedLabel ? "text-c-text-tertiary" : "text-c-text-secondary",
    "font-[450]",
  );
  const valueClass = clsx(
    FONT, SIZE_VALUE[size],
    prominentValue ? "font-[550]" : "font-[450]",
    "text-c-text",
  );

  if (layout === "vertical") {
    return (
      <div className={clsx("flex flex-col gap-[1px]", className)}>
        <span className={labelClass}>{label}</span>
        {value !== undefined && <span className={valueClass}>{value}</span>}
      </div>
    );
  }

  return (
    <div className={clsx("flex items-baseline gap-[6px] min-w-0", className)}>
      <span className={labelClass}>{label}</span>
      {value !== undefined && (
        <span className={clsx(valueClass, "truncate min-w-0")}>{value}</span>
      )}
    </div>
  );
}

// ─── SectionHeader ─────────────────────────────────────────────────────────────
// Uppercase label used as a section divider within panels / menus.

interface SectionHeaderProps {
  label: string;
  trailing?: ReactNode;
  className?: string;
}

export function SectionHeader({ label, trailing, className }: SectionHeaderProps) {
  return (
    <div className={clsx("flex items-center justify-between h-[24px] px-[8px]", className)}>
      <span className={clsx(
        FONT,
        "text-[9px] font-[550] leading-[14px] tracking-[0.08em] uppercase",
        "text-c-text-tertiary",
      )}>
        {label}
      </span>
      {trailing && (
        <span className="text-c-icon-secondary">{trailing}</span>
      )}
    </div>
  );
}
