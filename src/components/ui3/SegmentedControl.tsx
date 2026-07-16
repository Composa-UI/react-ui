import { clsx } from "clsx";
import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export interface Segment {
  value: string;
  label?: string;
  ariaLabel?: string;
  icon?: ReactNode;
}

export interface SegmentedControlGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function SegmentedControlGroup({ children, className, ...props }: SegmentedControlGroupProps) {
  return (
    <div
      data-composa-segmented-surface
      className={clsx(
        "bg-c-bg-secondary flex items-stretch overflow-hidden rounded-c-md shrink-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface SegmentedControlItemProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  selected: boolean;
  icon?: ReactNode;
  label?: string;
}

export function SegmentedControlItem({
  selected,
  icon,
  label,
  className,
  disabled,
  type = "button",
  ...props
}: SegmentedControlItemProps) {
  return (
    <button
      type={type}
      data-composa-segment
      data-state={selected ? "selected" : "idle"}
      disabled={disabled}
      className={clsx(
        "relative flex flex-1 h-[24px] items-center justify-center gap-[4px] px-[8px] min-w-0",
        "transition-colors duration-100 outline-none rounded-c-md",
        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-c-border-selected-strong",
        "text-[length:var(--composa-body-medium-size)] tracking-[var(--composa-body-medium-letter-spacing)]",
        "font-[family-name:var(--composa-font-family)] whitespace-nowrap",
        selected && !disabled
          ? "bg-c-bg text-c-text font-[550]"
          : disabled
            ? "text-c-text-tertiary font-[450]"
            : "text-c-text-secondary font-[450] hover:bg-c-bg",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className={clsx(
          "flex items-center justify-center size-[16px]",
          disabled ? "opacity-30" : !selected && "opacity-70",
        )}>
          {icon}
        </span>
      )}
      {label && <span>{label}</span>}
    </button>
  );
}

export interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl({ segments, value, onChange, disabled = false, className, ariaLabel }: SegmentedControlProps) {
  return (
    <SegmentedControlGroup role="group" aria-label={ariaLabel} className={className}>
      {segments.map((seg) => {
        const isActive = seg.value === value;
        return (
          <SegmentedControlItem
            key={seg.value}
            selected={isActive}
            aria-label={seg.ariaLabel}
            onClick={() => !disabled && onChange(seg.value)}
            disabled={disabled}
            icon={seg.icon}
            label={seg.label}
          />
        );
      })}
    </SegmentedControlGroup>
  );
}
