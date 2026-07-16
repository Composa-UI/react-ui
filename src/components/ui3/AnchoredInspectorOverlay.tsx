import * as PopoverPrimitive from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { composaModeAt, useComposaMode } from "./useComposaMode";

export type AnchoredInspectorOverlaySide = "left" | "right" | "top" | "bottom";
export type AnchoredInspectorOverlayAlign = "start" | "center" | "end";

export const ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING = 8;
export const ANCHORED_INSPECTOR_OVERLAY_Z_CLASS = "z-[70]";

export function shouldMountAnchoredInspectorOverlay(open: boolean, anchorReady: boolean): boolean {
  return open && anchorReady;
}

export interface AnchoredInspectorOverlayProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactElement;
  children: ReactNode;
  ariaLabel: string;
  width?: number | string;
  side?: AnchoredInspectorOverlaySide;
  align?: AnchoredInspectorOverlayAlign;
  sideOffset?: number;
  collisionPadding?: number;
  /** Modal Popover mode traps focus and returns it to the captured trigger. */
  trapFocus?: boolean;
  blockOutsideDismiss?: boolean;
  triggerClassName?: string;
  className?: string;
}

function triggerControl(host: HTMLElement | null): HTMLElement | null {
  return host?.querySelector<HTMLElement>("button,[href],input,select,textarea,[role=button],[tabindex]:not([tabindex='-1'])") ?? host;
}

/**
 * Shared inspector overlay boundary. It captures the launch rectangle before
 * mounting portalled content, so a controlled open never flashes at viewport
 * origin and panel scrolling cannot drag the open surface.
 */
export function AnchoredInspectorOverlay({
  open,
  onClose,
  trigger,
  children,
  ariaLabel,
  width = 240,
  side = "left",
  align = "start",
  sideOffset = 8,
  collisionPadding = ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  trapFocus = true,
  blockOutsideDismiss = false,
  triggerClassName,
  className,
}: AnchoredInspectorOverlayProps) {
  const mode = useComposaMode();
  const [triggerMode, setTriggerMode] = useState<string>();
  const triggerHost = useRef<HTMLSpanElement>(null);
  const capturedRect = useRef<DOMRect | null>(null);
  const [anchorVersion, setAnchorVersion] = useState(0);
  const virtualAnchor = useRef({ getBoundingClientRect: () => capturedRect.current! });

  const capture = () => {
    const target = triggerControl(triggerHost.current);
    if (target) {
      capturedRect.current = target.getBoundingClientRect();
      setTriggerMode(composaModeAt(target) ?? mode);
      setAnchorVersion(version => version + 1);
    }
  };

  useLayoutEffect(() => {
    if (open && !capturedRect.current) capture();
    if (!open && capturedRect.current) {
      capturedRect.current = null;
      setTriggerMode(undefined);
      setAnchorVersion(0);
    }
  }, [open]);

  const contentOpen = shouldMountAnchoredInspectorOverlay(open, capturedRect.current !== null);

  return (
    <PopoverPrimitive.Root modal={trapFocus} open={contentOpen} onOpenChange={next => { if (!next && open) onClose(); }}>
      <span
        ref={triggerHost}
        className={clsx("inline-flex", triggerClassName)}
        onPointerDownCapture={capture}
        onKeyDownCapture={event => { if (event.key === "Enter" || event.key === " ") capture(); }}
      >
        {trigger}
      </span>
      {capturedRect.current && <PopoverPrimitive.Anchor key={anchorVersion} virtualRef={virtualAnchor} />}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          role="dialog"
          aria-label={ariaLabel}
          aria-modal={trapFocus}
          data-composa-component="AnchoredInspectorOverlay"
          data-composa-mode={triggerMode ?? mode}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          avoidCollisions
          sticky="always"
          onInteractOutside={event => { if (blockOutsideDismiss) event.preventDefault(); }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            triggerControl(triggerHost.current)?.focus();
          }}
          className={clsx(
            ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
            "max-h-[calc(100vh-16px)] max-w-[calc(100vw-16px)] overflow-hidden rounded-c-lg bg-c-bg shadow-c-500 outline-none",
            className,
          )}
          style={{ width }}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
