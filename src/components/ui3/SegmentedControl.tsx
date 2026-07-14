import { clsx } from "clsx";
import { type ReactNode } from "react";

interface Segment {
  value: string;
  label?: string;
  ariaLabel?: string;
  icon?: ReactNode;
}

interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SegmentedControl({ segments, value, onChange, disabled = false, className }: SegmentedControlProps) {
  return (
    <div className={clsx(
      "bg-c-bg-secondary flex items-stretch overflow-hidden rounded-c-md shrink-0",
      className,
    )}>
      {segments.map((seg) => {
        const isActive = seg.value === value;
        return (
          <button
            key={seg.value}
            aria-label={seg.ariaLabel}
            onClick={() => !disabled && onChange(seg.value)}
            disabled={disabled}
            className={clsx(
              "relative flex flex-1 h-[24px] items-center justify-center gap-[4px] px-[8px] min-w-0",
              "transition-colors duration-100 outline-none rounded-c-md",
              "text-[length:var(--composa-body-medium-size)] tracking-[var(--composa-body-medium-letter-spacing)]",
              "font-[family-name:var(--composa-font-family)] whitespace-nowrap",
              isActive && !disabled
                ? "bg-c-bg text-c-text font-[550]"
                : disabled
                  ? "text-c-text-tertiary font-[450]"
                  : "text-c-text-secondary font-[450]",
            )}
          >
            {/* active tab: subtle border overlay */}
            {isActive && !disabled && (
              <div aria-hidden className="absolute inset-0 rounded-c-md ring-1 ring-inset ring-c-border-translucent pointer-events-none" />
            )}

            {seg.icon && (
              <span className={clsx(
                "flex items-center justify-center size-[16px]",
                disabled ? "opacity-30" : !isActive && "opacity-70",
              )}>
                {seg.icon}
              </span>
            )}
            {seg.label && <span>{seg.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
