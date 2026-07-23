import { clsx } from "clsx";
import {
  forwardRef,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { nextSingleSelectionIndex, type SingleSelectionKey } from "./singleSelection";

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
        // Enclosing stroke — same inset-ring + c-border token Dropdown/Button use, so the
        // segmented control reads as enclosed and consistent with the rest of the DS (#214).
        "ring-1 ring-inset ring-c-border",
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

export const SegmentedControlItem = forwardRef<HTMLButtonElement, SegmentedControlItemProps>(function SegmentedControlItem({
  selected,
  icon,
  label,
  className,
  disabled,
  type = "button",
  ...props
}, ref) {
  return (
    <button
      ref={ref}
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
});

export interface SegmentedControlProps {
  segments: Segment[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SegmentedControl({ segments, value, onChange, disabled = false, className, ariaLabel }: SegmentedControlProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, segments.findIndex(segment => segment.value === value));
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const nextIndex = nextSingleSelectionIndex(index, event.key as SingleSelectionKey, segments.length);
    const next = segments[nextIndex];
    if (!next) return;
    onChange(next.value);
    itemRefs.current[nextIndex]?.focus();
  };

  return (
    <SegmentedControlGroup role="group" aria-label={ariaLabel} className={className}>
      {segments.map((seg, index) => {
        const isActive = seg.value === value;
        return (
          <SegmentedControlItem
            ref={node => { itemRefs.current[index] = node; }}
            key={seg.value}
            selected={isActive}
            aria-pressed={isActive}
            aria-label={seg.ariaLabel}
            tabIndex={index === selectedIndex ? 0 : -1}
            onClick={() => !disabled && onChange(seg.value)}
            onKeyDown={event => handleKeyDown(event, index)}
            disabled={disabled}
            icon={seg.icon}
            label={seg.label}
          />
        );
      })}
    </SegmentedControlGroup>
  );
}
