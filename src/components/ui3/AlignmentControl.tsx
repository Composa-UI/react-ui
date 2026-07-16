import { clsx } from "clsx";
import { useRef, type KeyboardEvent } from "react";
import { SegmentedControlGroup, SegmentedControlItem } from "./SegmentedControl";
import { nextSingleSelectionIndex, type SingleSelectionKey } from "./singleSelection";

export type AlignmentValue = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

export interface AlignmentControlProps {
  value: AlignmentValue;
  onChange: (value: AlignmentValue) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const ALIGNMENTS: Array<{
  value: AlignmentValue;
  label: string;
  x: 2 | 8 | 14;
  y: 2 | 6 | 10;
}> = [
  { value: "tl", label: "Top left", x: 2, y: 2 },
  { value: "tc", label: "Top center", x: 8, y: 2 },
  { value: "tr", label: "Top right", x: 14, y: 2 },
  { value: "ml", label: "Middle left", x: 2, y: 6 },
  { value: "mc", label: "Middle center", x: 8, y: 6 },
  { value: "mr", label: "Middle right", x: 14, y: 6 },
  { value: "bl", label: "Bottom left", x: 2, y: 10 },
  { value: "bc", label: "Bottom center", x: 8, y: 10 },
  { value: "br", label: "Bottom right", x: 14, y: 10 },
];

function AlignmentGlyph({ x, y }: { x: number; y: number }) {
  return (
    <svg aria-hidden width="16" height="12" viewBox="0 0 16 12" fill="none">
      <circle cx={x} cy={y} r="1.5" fill="currentColor" />
    </svg>
  );
}

function nextAlignmentIndex(index: number, key: SingleSelectionKey): number {
  if (key === "ArrowRight" || key === "ArrowLeft") {
    const rowStart = Math.floor(index / 3) * 3;
    const column = index % 3;
    const nextColumn = key === "ArrowRight" ? (column + 1) % 3 : (column + 2) % 3;
    return rowStart + nextColumn;
  }
  return nextSingleSelectionIndex(index, key, ALIGNMENTS.length, 3);
}

export function AlignmentControl({
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel = "Alignment",
}: AlignmentControlProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, ALIGNMENTS.findIndex(alignment => alignment.value === value));
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (disabled || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    const nextIndex = nextAlignmentIndex(index, event.key as SingleSelectionKey);
    const next = ALIGNMENTS[nextIndex];
    if (!next) return;
    onChange(next.value);
    itemRefs.current[nextIndex]?.focus();
  };

  return (
    <SegmentedControlGroup
      role="radiogroup"
      aria-label={ariaLabel}
      data-composa-component="AlignmentControl"
      className={clsx("grid grid-cols-3 w-[88px] p-[1px]", className)}
    >
      {ALIGNMENTS.map((alignment, index) => (
        <SegmentedControlItem
          ref={node => { itemRefs.current[index] = node; }}
          key={alignment.value}
          role="radio"
          aria-checked={alignment.value === value}
          aria-label={alignment.label}
          tabIndex={index === selectedIndex ? 0 : -1}
          selected={alignment.value === value}
          disabled={disabled}
          onClick={() => onChange(alignment.value)}
          onKeyDown={event => handleKeyDown(event, index)}
          icon={<AlignmentGlyph x={alignment.x} y={alignment.y} />}
          className="!h-[18px] !px-0"
        />
      ))}
    </SegmentedControlGroup>
  );
}
