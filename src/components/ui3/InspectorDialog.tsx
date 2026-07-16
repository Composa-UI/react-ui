import { type ReactElement, type ReactNode } from "react";
import { AnchoredInspectorOverlay } from "./AnchoredInspectorOverlay";

export interface InspectorDialogProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactElement;
  children: ReactNode;
  ariaLabel: string;
  width?: number;
  blockOutsideDismiss?: boolean;
  triggerClassName?: string;
  className?: string;
}

/** Non-modal inspector dialog anchored to the captured trigger and portalled above the canvas. */
export function InspectorDialog({ open, onClose, trigger, children, ariaLabel, width = 320, blockOutsideDismiss = false, triggerClassName = "block w-full", className }: InspectorDialogProps) {
  return <AnchoredInspectorOverlay
    open={open}
    onClose={onClose}
    trigger={trigger}
    ariaLabel={ariaLabel}
    width={width}
    trapFocus={false}
    blockOutsideDismiss={blockOutsideDismiss}
    triggerClassName={triggerClassName}
    className={className}
  >
    {children}
  </AnchoredInspectorOverlay>;
}
