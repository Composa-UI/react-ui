import { type ReactElement, type ReactNode } from "react";
import { AnchoredInspectorOverlay } from "./AnchoredInspectorOverlay";
import type { AnchoredInspectorOverlayAlign, AnchoredInspectorOverlayElevation } from "./AnchoredInspectorOverlay";

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
