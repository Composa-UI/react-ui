export type RowSelectionState = "none" | "selected" | "descendant";

/**
 * Shared Layers/Timeline row projection:
 * - selected: emphasized accent
 * - descendant: de-emphasized accent promoted on hover
 * - none: neutral hover only
 */
export function rowSelectionHighlightClassName(state: RowSelectionState): string {
  if (state === "selected") return "bg-c-bg-selected group-hover/selection-row:bg-c-bg-selected";
  if (state === "descendant") return "bg-c-bg-selected/50 group-hover/selection-row:bg-c-bg-selected";
  return "bg-transparent group-hover/selection-row:bg-c-bg-hover";
}
