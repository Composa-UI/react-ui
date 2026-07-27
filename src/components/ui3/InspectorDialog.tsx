import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { AnchoredInspectorOverlay, COMPOSA_INSPECTOR_SURFACE_SELECTOR } from "./AnchoredInspectorOverlay";
import type { AnchoredInspectorOverlayAlign, AnchoredInspectorOverlayElevation } from "./AnchoredInspectorOverlay";

export { COMPOSA_INSPECTOR_SURFACE_SELECTOR };

export const COMPACT_INSPECTOR_DIALOG_WIDTH = 240;
/**
 * The settings/effects trigger sits inside the Inspector's row action gutter.
 * This compensated offset yields the approved 8px visual gutter at the panel edge.
 */
export const EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET = 48;
// The stroke settings action sits 7px farther into its row than the Effects
// trigger. Compensate so both dialogs land on the same 8px inspector gutter.
export const STROKE_SETTINGS_INSPECTOR_SIDE_OFFSET = 41;
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
export const INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR = "[data-composa-inspector-dialog-drag-handle]";

export interface InspectorDialogProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactElement;
  children: ReactNode;
  ariaLabel: string;
  width?: number;
  sideOffset?: number;
  align?: AnchoredInspectorOverlayAlign;
  blockOutsideDismiss?: boolean;
  triggerClassName?: string;
  className?: string;
  elevation?: AnchoredInspectorOverlayElevation;
  draggable?: boolean;
  /**
   * Anchor the dialog's side axis to the inspector surface's left edge instead
   * of the trigger. Pass `COMPOSA_INSPECTOR_SURFACE_SELECTOR` for a trigger that
   * does not sit at the panel's left (e.g. a far-right action button) so the
   * dialog lands clear of the inspector regardless of trigger position (#499).
   */
  anchorSurfaceSelector?: string;
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
export function InspectorDialog({ open, onClose, trigger, children, ariaLabel, width = 320, sideOffset, align, blockOutsideDismiss = false, triggerClassName = "block w-full", className, elevation = 400, draggable = true, anchorSurfaceSelector }: InspectorDialogProps) {
  return <AnchoredInspectorOverlay
    open={open}
    onClose={onClose}
    trigger={trigger}
    ariaLabel={ariaLabel}
    width={width}
    minWidth={width}
    sideOffset={sideOffset}
    align={align}
    trapFocus={false}
    blockOutsideDismiss={blockOutsideDismiss}
    triggerClassName={triggerClassName}
    className={className}
    elevation={elevation}
    dragHandleSelector={draggable ? INSPECTOR_DIALOG_DRAG_HANDLE_SELECTOR : undefined}
    anchorSurfaceSelector={anchorSurfaceSelector}
  >
    {draggable ? withInspectorDialogDragHandle(children) : children}
  </AnchoredInspectorOverlay>;
}
