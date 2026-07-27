import { useEffect, useMemo, useState, type ReactElement } from "react";
import { clsx } from "clsx";
import { Check, Search, X } from "lucide-react";
import { ScrollArea } from "./Panel";
import {
  COMPACT_INSPECTOR_DIALOG_WIDTH,
  COMPOSA_INSPECTOR_SURFACE_SELECTOR,
  InspectorDialog,
  TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET,
} from "./InspectorDialog";

const FONT = "font-[family-name:var(--composa-font-family)]";

/* ─── Value contract ─────────────────────────────────────────────────────── */

export interface FontEntry {
  /** Display name and selection key. */
  name: string;
  /** CSS font-family stack used to render this row's own preview. */
  stack: string;
}

export interface FontPickerDialogProps {
  open: boolean;
  onClose: () => void;
  /** The Font control that anchors and re-receives focus on dismissal. */
  trigger: ReactElement;
  /** Capability-truthful font roster (host-provided). Each row previews in its own face. */
  fonts: ReadonlyArray<FontEntry>;
  /** Currently applied font name (rendered with a selected check + highlight). */
  value?: string;
  /** Fires with the chosen font name. The owner applies it and closes. */
  onSelect: (name: string) => void;
}

/* ─── Dialog ─────────────────────────────────────────────────────────────── */

/**
 * Anchored, non-modal font picker. Adapted from the owner's reference export into
 * canonical @composa/ui primitives + tokens and hosted on the shared
 * `InspectorDialog` / `AnchoredInspectorOverlay` contract (240px, elevation-400,
 * portalled + collision-safe) the Type/Stroke/Animation-styles dialogs use.
 *
 * Each row previews in its own typeface — the meaningful, in-surface preview. The
 * reference's absolute left-side hover tooltip is intentionally dropped: it lived
 * outside the panel and would be clipped by the anchored surface's overflow.
 *
 * The side axis anchors to the inspector surface's LEFT edge
 * (`anchorSurfaceSelector`) so it clears the inspector at ANY panel width (#499/#73).
 */
export function FontPickerDialog({ open, onClose, trigger, fonts, value, onSelect }: FontPickerDialogProps) {
  const [query, setQuery] = useState("");

  // Reopen clean: drop the transient search each time the dialog closes so a
  // stale query never survives to the next open.
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? fonts.filter(font => font.name.toLowerCase().includes(q)) : fonts;
  }, [fonts, query]);

  return (
    <InspectorDialog
      open={open}
      onClose={onClose}
      trigger={trigger}
      ariaLabel="Fonts"
      width={COMPACT_INSPECTOR_DIALOG_WIDTH}
      sideOffset={TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET}
      anchorSurfaceSelector={COMPOSA_INSPECTOR_SURFACE_SELECTOR}
      elevation={400}
    >
      {/* Header — title + close. First child so it doubles as the drag handle. */}
      <div className="flex h-[40px] shrink-0 items-center gap-[4px] border-b border-c-border pl-[16px] pr-[8px]">
        <span className={clsx(FONT, "min-w-0 flex-1 truncate text-[11px] font-[550] leading-[16px] text-c-text")}>Fonts</span>
        <button
          type="button"
          aria-label="Close fonts"
          onClick={onClose}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Search */}
      <div className="flex h-[40px] shrink-0 items-center gap-[8px] border-b border-c-border pl-[12px] pr-[8px]">
        <Search size={16} strokeWidth={1.5} className="shrink-0 text-c-icon-secondary" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search fonts"
          aria-label="Search fonts"
          className={clsx(
            FONT,
            "min-w-0 flex-1 bg-transparent text-[11px] leading-[16px] tracking-[0.055px] text-c-text outline-none placeholder:text-c-text-secondary",
          )}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="flex size-[20px] shrink-0 items-center justify-center rounded-c-sm text-c-icon-secondary hover:bg-c-bg-hover"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Font list */}
      <ScrollArea className="max-h-[316px]">
        <div className="py-[8px]">
          {filtered.length === 0 ? (
            <div className={clsx(FONT, "flex h-[48px] items-center justify-center text-[11px] font-[500] tracking-[0.055px] text-c-text-secondary")}>
              No fonts found
            </div>
          ) : (
            filtered.map(font => {
              const selected = font.name === value;
              return (
                <button
                  key={font.name}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(font.name)}
                  className={clsx(
                    "flex h-[32px] w-full items-center gap-[8px] pl-[8px] pr-[16px] text-left hover:bg-c-bg-hover",
                    selected && "bg-c-bg-secondary",
                  )}
                >
                  <span className="flex w-[16px] shrink-0 items-center justify-center text-c-icon-secondary">
                    {selected && <Check size={14} strokeWidth={1.5} />}
                  </span>
                  <span
                    style={{ fontFamily: font.stack }}
                    className="min-w-0 flex-1 truncate text-[13px] leading-[20px] text-c-text"
                  >
                    {font.name}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </InspectorDialog>
  );
}

export default FontPickerDialog;
