import * as PopoverPrimitive from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useComposaMode } from "./useComposaMode";

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
  const mode = useComposaMode();
  const triggerHost = useRef<HTMLSpanElement>(null);
  const previousOpen = useRef(false);
  const [anchorVersion, setAnchorVersion] = useState(0);
  const capturedRect = useRef<DOMRect>({ x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) } as DOMRect);
  const virtualAnchor = useRef({ getBoundingClientRect: () => capturedRect.current });
  const capture = () => {
    const target = triggerHost.current?.querySelector<HTMLElement>("button,[role=button]") ?? triggerHost.current;
    if (target) { capturedRect.current = target.getBoundingClientRect(); setAnchorVersion(version => version + 1); }
  };
  useLayoutEffect(() => {
    if (open && !previousOpen.current) capture();
    if (!open && previousOpen.current) (triggerHost.current?.querySelector<HTMLElement>("button,[role=button]") ?? triggerHost.current)?.focus();
    previousOpen.current = open;
  }, [open]);
  return <PopoverPrimitive.Root open={open} onOpenChange={next => { if (!next && !blockOutsideDismiss) onClose(); }}>
    <span ref={triggerHost} className="block w-full" onPointerDownCapture={capture} onKeyDownCapture={event => { if (event.key === "Enter" || event.key === " ") capture(); }}>{trigger}</span>
    <PopoverPrimitive.Anchor key={anchorVersion} virtualRef={virtualAnchor} />
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        role="dialog"
        aria-label={ariaLabel}
        aria-modal="false"
        data-composa-mode={mode}
        side="left"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        avoidCollisions
        onEscapeKeyDown={() => onClose()}
        onInteractOutside={event => { if (blockOutsideDismiss) event.preventDefault(); }}
        className={clsx("z-50 max-h-[calc(100vh-16px)] overflow-hidden rounded-c-lg bg-c-bg shadow-c-500 outline-none", className)}
        style={{ width }}
      >
        {children}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  </PopoverPrimitive.Root>;
}
