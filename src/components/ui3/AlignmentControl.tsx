import { clsx } from "clsx";
import { useRef, type KeyboardEvent } from "react";
import { SegmentedControlGroup, SegmentedControlItem } from "./SegmentedControl";
import { nextSingleSelectionIndex, type SingleSelectionKey } from "./singleSelection";

export type AlignmentValue = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

/**
 * Which FACE the one alignment picker wears.
 *
 * RP-16a — "the alignment picker does not change to grid picker". The owner asked
 * for ONE control whose content changes with the frame's flow, not a second picker
 * and not a renamed dialog. `stack` is the historic single-dot face used by
 * freeform/auto-layout frames (a point inside a box). `grid` is the table face used
 * when the frame's flow is Grid: the same nine positions, drawn as cells of a table
 * so the control reads as a grid picker rather than as a box-alignment picker.
 *
 * Default is `stack`, so every existing call site keeps today's appearance.
 */
export type AlignmentControlVariant = "stack" | "grid";

export interface AlignmentControlProps {
  value: AlignmentValue;
  onChange: (value: AlignmentValue) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  variant?: AlignmentControlVariant;
}

const ALIGNMENTS: Array<{
  value: AlignmentValue;
  label: string;
  x: 2 | 8 | 14;
  y: 2 | 6 | 10;
  column: 0 | 1 | 2;
  row: 0 | 1 | 2;
}> = [
  { value: "tl", label: "Top left", x: 2, y: 2, column: 0, row: 0 },
  { value: "tc", label: "Top center", x: 8, y: 2, column: 1, row: 0 },
  { value: "tr", label: "Top right", x: 14, y: 2, column: 2, row: 0 },
  { value: "ml", label: "Middle left", x: 2, y: 6, column: 0, row: 1 },
  { value: "mc", label: "Middle center", x: 8, y: 6, column: 1, row: 1 },
  { value: "mr", label: "Middle right", x: 14, y: 6, column: 2, row: 1 },
  { value: "bl", label: "Bottom left", x: 2, y: 10, column: 0, row: 2 },
  { value: "bc", label: "Bottom center", x: 8, y: 10, column: 1, row: 2 },
  { value: "br", label: "Bottom right", x: 14, y: 10, column: 2, row: 2 },
];

function AlignmentGlyph({ x, y }: { x: number; y: number }) {
  return (
    <svg aria-hidden width="16" height="12" viewBox="0 0 16 12" fill="none">
      <circle cx={x} cy={y} r="1.5" fill="currentColor" />
    </svg>
  );
}

// Grid face. The glyph is a 3×3 TABLE (two column rules, two row rules) with the
// one cell this button selects filled in — so the nine buttons together read as a
// grid, and a single button reads as "place items in this cell", not "align to this
// point". Same 16×12 box as AlignmentGlyph so swapping faces cannot resize the row.
const GRID_COLUMN_W = 16 / 3;
const GRID_ROW_H = 4;
const CELL_INSET_X = 0.9;
const CELL_INSET_Y = 0.6;

function GridCellGlyph({ column, row }: { column: number; row: number }) {
  return (
    <svg aria-hidden width="16" height="12" viewBox="0 0 16 12" fill="none">
      <g stroke="currentColor" strokeWidth="0.75" opacity="0.4">
        <path d={`M${GRID_COLUMN_W} 0v12`} />
        <path d={`M${GRID_COLUMN_W * 2} 0v12`} />
        <path d={`M0 ${GRID_ROW_H}h16`} />
        <path d={`M0 ${GRID_ROW_H * 2}h16`} />
      </g>
      <rect
        x={column * GRID_COLUMN_W + CELL_INSET_X}
        y={row * GRID_ROW_H + CELL_INSET_Y}
        width={GRID_COLUMN_W - CELL_INSET_X * 2}
        height={GRID_ROW_H - CELL_INSET_Y * 2}
        rx="0.5"
        fill="currentColor"
      />
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
  variant = "stack",
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
      data-alignment-variant={variant}
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
          icon={variant === "grid"
            ? <GridCellGlyph column={alignment.column} row={alignment.row} />
            : <AlignmentGlyph x={alignment.x} y={alignment.y} />}
          className="!h-[18px] !px-0"
        />
      ))}
    </SegmentedControlGroup>
  );
}
