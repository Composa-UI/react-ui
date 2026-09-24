import { Children, cloneElement, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { clsx } from "clsx";
import { X } from "lucide-react";
import { AnchoredInspectorOverlay, COMPOSA_INSPECTOR_SURFACE_SELECTOR } from "./AnchoredInspectorOverlay";
import type { AnchoredInspectorOverlayAlign, AnchoredInspectorOverlayElevation, AnchoredInspectorOverlaySide } from "./AnchoredInspectorOverlay";
import type { AnchoredInspectorOverlayResize } from "./AnchoredInspectorOverlay";

export { COMPOSA_INSPECTOR_SURFACE_SELECTOR };

export const COMPACT_INSPECTOR_DIALOG_WIDTH = 240;
// The Effects trigger is the effect-type Dropdown inside a PanelEntry, which
// reserves a 16px grip column flush to the panel edge — so a trigger-relative 48
// landed the dialog 32px clear of the inspector, visibly further out than every
// other inspector dialog (#661). Like Type/Stroke/Export/Color, EffectDetails now
// anchors its side axis to the inspector surface's LEFT edge
// (`COMPOSA_INSPECTOR_SURFACE_SELECTOR`), so this offset is just the approved 8px
// gutter and stays correct however the row anatomy or panel width drifts.
export const EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET = 8;
// The stroke settings trigger sits inline in the Stroke row, deeper than the
// Effects trigger. A fixed trigger-relative offset (previously 41) had to encode
// BOTH the trigger inset AND the panel width, so it silently overlapped the
// inspector whenever either drifted (#502) — the same failure #499 fixed for
// Type settings. StrokeSettingsDialog now anchors its side axis to the inspector
// surface's LEFT edge (`COMPOSA_INSPECTOR_SURFACE_SELECTOR`), so this offset is
// just the approved 8px gutter and the dialog lands clear of the inspector
// regardless of where the trigger sits or how wide the panel is.
export const STROKE_SETTINGS_INSPECTOR_SIDE_OFFSET = 8;
// The Type settings trigger is a 24px action button in the Alignment row's
// far-right action gutter — unlike the Effects/Stroke triggers, which sit at the
// row's left. A fixed trigger-relative offset therefore has to encode BOTH the
// trigger inset AND the panel width (the prior 40 + (240 − 8) = 208 magic
// number), so it silently overlapped the inspector whenever either drifted — the
// isolated unit test only checked the number, never the geometry (#499). Instead
// this dialog anchors its side axis to the inspector surface's LEFT edge
// (`COMPOSA_INSPECTOR_SURFACE_SELECTOR`), so `sideOffset` is just the approved
// 8px gutter and the dialog lands clear of the inspector regardless of where the
// trigger sits or how wide the panel is.
export const TYPE_SETTINGS_INSPECTOR_SIDE_OFFSET = 8;
// The Auto Layout settings trigger sits in the Alignment/Gap row's far-right
// action gutter, exactly like the Type settings trigger. It previously passed no
// sideOffset and no anchor surface at all, so Radix anchored it to the trigger
// and the dialog landed ON TOP of the inspector (Composa#661 item 3). Anchoring
// to the inspector surface's LEFT edge gives the approved 8px gutter regardless
// of trigger position or panel width.
export const AUTO_LAYOUT_SETTINGS_INSPECTOR_SIDE_OFFSET = 8;
// The Grid settings trigger occupies the same Alignment/Gap action gutter as the
// Auto Layout one, so it anchors identically. It exists as its own constant
// rather than reusing the auto-layout name because the two triggers are separate
// surfaces that could diverge; sharing the name would hide that.
export const GRID_SETTINGS_INSPECTOR_SIDE_OFFSET = 8;
export const INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR = "[data-composa-inspector-dialog-drag-handle]";

export interface InspectorDialogProps {
  open: boolean;
  onClose: () => void;
  /** Omit for a free-floating dialog; pass `anchorSelector` instead. */
  trigger?: ReactElement;
  /**
   * Positions a dialog that has no persistent trigger against the element this
   * selector names (see `AnchoredInspectorOverlay`'s free-floating mode).
   */
  anchorSelector?: string;
  children: ReactNode;
  ariaLabel: string;
  /**
   * A string width (a CSS `min()`/`clamp()`) is allowed for surfaces sized
   * against the viewport rather than the 240/320 inspector grid; only numeric
   * widths pin `minWidth`, since a viewport-relative `minWidth` would fight the
   * overlay's own `max-w` clamp.
   */
  width?: number | string;
  sideOffset?: number;
  side?: AnchoredInspectorOverlaySide;
  collisionPadding?: number;
  align?: AnchoredInspectorOverlayAlign;
  blockOutsideDismiss?: boolean;
  /** Preserve the opener's focus instead of focusing the first dialog action. */
  preserveFocusOnOpen?: boolean;
  triggerClassName?: string;
  className?: string;
  elevation?: AnchoredInspectorOverlayElevation;
  draggable?: boolean;
  /** Optional shared bottom-right resize behavior for floating windows. */
  resizable?: AnchoredInspectorOverlayResize;
  /**
   * Anchor the dialog's side axis to the inspector surface's left edge instead
   * of the trigger. Pass `COMPOSA_INSPECTOR_SURFACE_SELECTOR` for a trigger that
   * does not sit at the panel's left (e.g. a far-right action button) so the
   * dialog lands clear of the inspector regardless of trigger position (#499).
   */
  anchorSurfaceSelector?: string;
  /** Optional explicit drag, resize, and collision boundary. */
  boundarySelector?: string;
}

function withInspectorDialogDragHandle(children: ReactNode): ReactNode {
  const items = Children.toArray(children);
  const headerIndex = items.findIndex(item => isValidElement<{ className?: string }>(item));
  if (headerIndex < 0) return children;
  const header = items[headerIndex] as ReactElement<{ className?: string }>;
  items[headerIndex] = cloneElement(header, {
    "data-composa-inspector-dialog-drag-handle": "",
    className: [header.props.className, "touch-none select-none"].filter(Boolean).join(" "),
  } as { className?: string });
  return items;
}

/** Non-modal inspector dialog anchored to the captured trigger and portalled above the canvas. */
export function InspectorDialog({ open, onClose, trigger, anchorSelector, children, ariaLabel, width = 320, sideOffset, side, collisionPadding, align, blockOutsideDismiss = false, preserveFocusOnOpen = false, triggerClassName = "block w-full", className, elevation = 400, draggable = true, resizable, anchorSurfaceSelector, boundarySelector }: InspectorDialogProps) {
  return <AnchoredInspectorOverlay
    open={open}
    onClose={onClose}
    trigger={trigger}
    anchorSelector={anchorSelector}
    ariaLabel={ariaLabel}
    width={width}
    minWidth={resizable?.minWidth ?? (typeof width === "number" ? width : undefined)}
    sideOffset={sideOffset}
    side={side}
    collisionPadding={collisionPadding}
    align={align}
    trapFocus={false}
    preserveFocusOnOpen={preserveFocusOnOpen}
    blockOutsideDismiss={blockOutsideDismiss}
    triggerClassName={triggerClassName}
    // Inspector dialogs behave like application chrome: labels and empty space
    // do not start browser text selection. Native editors explicitly opt back
    // into text selection so drag-select, Select All, and caret editing remain
    // untouched inside inputs and textareas (#625).
    className={clsx("select-none [&_input]:select-text [&_textarea]:select-text", className)}
    elevation={elevation}
    dragHandleSelector={draggable ? INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR : undefined}
    resizable={resizable}
    anchorSurfaceSelector={anchorSurfaceSelector}
    boundarySelector={boundarySelector}
  >
    {draggable ? withInspectorDialogDragHandle(children) : children}
  </AnchoredInspectorOverlay>;
}

// ─── InspectorDialogHeader ────────────────────────────────────────────────────
// The 40px title bar every floating inspector dialog opens with: title, an
// optional actions slot, and the close X. Colour, animation styles, effects and
// the rest each hand-rolled this markup; it is extracted here so a new floating
// surface reuses it instead of adding a sixth copy that can drift.
//
// It spreads unknown props onto its root on purpose: `InspectorDialog` tags its
// first element child as the drag handle by cloning a data attribute onto it, so
// a header that swallowed unknown props would silently stop being draggable.
//
// This is deliberately NOT `ModalHeader` — that one renders `RadixDialog.Title`
// and `RadixDialog.Close`, which throw outside a `Dialog.Root`, so it cannot be
// used on the Popover-based floating surface.

export interface InspectorDialogHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title: string;
  /** Rendered between the title and the close X (e.g. an "Open in new tab" button). */
  actions?: ReactNode;
  onClose?: () => void;
}

export function InspectorDialogHeader({ title, actions, onClose, className, ...rest }: InspectorDialogHeaderProps) {
  return (
    <div
      {...rest}
      className={clsx(
        "flex items-center h-[40px] shrink-0 pl-[16px] pr-[8px] gap-[4px] border-b border-c-border",
        className,
      )}
    >
      <span className="font-[family-name:var(--composa-font-family)] flex-1 min-w-0 [font-size:var(--composa-body-medium-size)] [line-height:var(--composa-body-medium-line)] [font-weight:var(--composa-body-medium-strong-weight)] [letter-spacing:var(--composa-body-medium-letter-spacing)] text-c-text truncate">
        {title}
      </span>
      {actions && <div className="shrink-0 flex items-center gap-[4px]">{actions}</div>}
      {onClose && (
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="shrink-0 flex items-center justify-center size-[24px] rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
