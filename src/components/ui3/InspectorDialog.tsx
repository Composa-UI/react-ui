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
  className?: string;
}

/** Non-modal inspector dialog anchored to the captured trigger and portalled above the canvas. */
export function InspectorDialog({ open, onClose, trigger, children, ariaLabel, width = 320, blockOutsideDismiss = false, className }: InspectorDialogProps) {
  return <AnchoredInspectorOverlay
    open={open}
    onClose={onClose}
    trigger={trigger}
    ariaLabel={ariaLabel}
    width={width}
    trapFocus={false}
    blockOutsideDismiss={blockOutsideDismiss}
    triggerClassName="block w-full"
    className={className}
  >
    {children}
  </AnchoredInspectorOverlay>;
}
