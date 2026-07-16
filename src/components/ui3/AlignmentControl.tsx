import { clsx } from "clsx";
import { SegmentedControlGroup, SegmentedControlItem } from "./SegmentedControl";

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

export function AlignmentControl({
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel = "Alignment",
}: AlignmentControlProps) {
  return (
    <SegmentedControlGroup
      role="radiogroup"
      aria-label={ariaLabel}
      data-composa-component="AlignmentControl"
      className={clsx("grid grid-cols-3 w-[88px] p-[1px]", className)}
    >
      {ALIGNMENTS.map(alignment => (
        <SegmentedControlItem
          key={alignment.value}
          role="radio"
          aria-checked={alignment.value === value}
          aria-label={alignment.label}
          selected={alignment.value === value}
          disabled={disabled}
          onClick={() => onChange(alignment.value)}
          icon={<AlignmentGlyph x={alignment.x} y={alignment.y} />}
          className="!h-[18px] !px-0"
        />
      ))}
    </SegmentedControlGroup>
  );
}
