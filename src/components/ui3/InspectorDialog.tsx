import { type ReactElement, type ReactNode } from "react";
import { AnchoredInspectorOverlay } from "./AnchoredInspectorOverlay";
import type { AnchoredInspectorOverlayAlign, AnchoredInspectorOverlayElevation } from "./AnchoredInspectorOverlay";

export const COMPACT_INSPECTOR_DIALOG_WIDTH = 240;
/**
 * The settings/effects trigger sits inside the Inspector's row action gutter.
 * This compensated offset yields the approved 8px visual gutter at the panel edge.
 */
export const EFFECTS_INSPECTOR_DIALOG_SIDE_OFFSET = 48;

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
}

/** Non-modal inspector dialog anchored to the captured trigger and portalled above the canvas. */
export function InspectorDialog({ open, onClose, trigger, children, ariaLabel, width = 320, sideOffset, align, blockOutsideDismiss = false, triggerClassName = "block w-full", className, elevation }: InspectorDialogProps) {
  return <AnchoredInspectorOverlay
    open={open}
    onClose={onClose}
    trigger={trigger}
    ariaLabel={ariaLabel}
    width={width}
    sideOffset={sideOffset}
    align={align}
    trapFocus={false}
    blockOutsideDismiss={blockOutsideDismiss}
    triggerClassName={triggerClassName}
    className={className}
    elevation={elevation}
  >
    {children}
  </AnchoredInspectorOverlay>;
}
