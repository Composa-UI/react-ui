import * as PopoverPrimitive from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { composaModeAt, useComposaMode } from "./useComposaMode";

export type AnchoredInspectorOverlaySide = "left" | "right" | "top" | "bottom";
export type AnchoredInspectorOverlayAlign = "start" | "center" | "end";
export type AnchoredInspectorOverlayElevation = 400 | 500;

export const ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING = 8;
export const ANCHORED_INSPECTOR_OVERLAY_Z_CLASS = "z-50";
export const COMPOSA_OVERLAY_BOUNDARY_SELECTOR = "[data-composa-overlay-boundary]";

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
  /** Applies a canonical Composa elevation token without relying on generated utility CSS. */
  elevation?: AnchoredInspectorOverlayElevation;
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
  elevation,
}: AnchoredInspectorOverlayProps) {
  const mode = useComposaMode();
  const triggerMode = useRef<string | undefined>(undefined);
  const triggerHost = useRef<HTMLSpanElement>(null);
  const openingGesture = useRef(false);
  const capturedRect = useRef<DOMRect | null>(null);
  const capturedBoundary = useRef<HTMLElement | null>(null);
  const [anchorVersion, setAnchorVersion] = useState(0);
  const virtualAnchor = useRef({ getBoundingClientRect: () => capturedRect.current! });

  const capture = (markOpeningGesture = false) => {
    const target = triggerControl(triggerHost.current);
    if (target) {
      openingGesture.current = markOpeningGesture;
      capturedRect.current = target.getBoundingClientRect();
      capturedBoundary.current = target.closest<HTMLElement>(COMPOSA_OVERLAY_BOUNDARY_SELECTOR);
      triggerMode.current = composaModeAt(target) ?? mode;
      return true;
    }
    return false;
  };

  useLayoutEffect(() => {
    if (open && !capturedRect.current && capture()) {
      // Programmatic opens have no pointer/key gesture to trigger the host
      // render, so mount the virtual anchor once after capturing its refs.
      setAnchorVersion(version => version + 1);
    }
    if (!open && capturedRect.current) {
      capturedRect.current = null;
      capturedBoundary.current = null;
      triggerMode.current = undefined;
      setAnchorVersion(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      openingGesture.current = false;
      return;
    }
    const timer = setTimeout(() => { openingGesture.current = false; }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  const contentOpen = shouldMountAnchoredInspectorOverlay(open, capturedRect.current !== null);

  return (
    <PopoverPrimitive.Root modal={trapFocus} open={contentOpen} onOpenChange={next => {
      if (!next && open) {
        if (openingGesture.current) {
          openingGesture.current = false;
          return;
        }
        onClose();
      }
    }}>
      <span
        ref={triggerHost}
        className={clsx("inline-flex", triggerClassName)}
        onPointerDownCapture={() => { capture(true); }}
        onKeyDownCapture={event => { if (event.key === "Enter" || event.key === " ") capture(true); }}
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
          data-composa-mode={triggerMode.current ?? mode}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionBoundary={capturedBoundary.current ?? undefined}
          collisionPadding={collisionPadding}
          avoidCollisions
          sticky="always"
          onInteractOutside={event => { if (blockOutsideDismiss) event.preventDefault(); }}
          onEscapeKeyDown={event => {
            event.preventDefault();
            openingGesture.current = false;
            onClose();
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            triggerControl(triggerHost.current)?.focus();
          }}
          className={clsx(
            ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
            "max-h-[var(--radix-popover-content-available-height)] max-w-[calc(100vw-16px)] overflow-hidden rounded-c-lg bg-c-bg shadow-c-500 outline-none",
            className,
          )}
          style={{
            width,
            maxHeight: "var(--radix-popover-content-available-height)",
            ...(elevation ? { boxShadow: `var(--elevation-${elevation})` } : {}),
          }}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
