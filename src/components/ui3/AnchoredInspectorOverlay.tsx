import * as PopoverPrimitive from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from "react";
import { composaModeAt, useComposaMode } from "./useComposaMode";

export type AnchoredInspectorOverlaySide = "left" | "right" | "top" | "bottom";
export type AnchoredInspectorOverlayAlign = "start" | "center" | "end";
export type AnchoredInspectorOverlayElevation = 400 | 500;

export const ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING = 8;
export const ANCHORED_INSPECTOR_OVERLAY_Z_CLASS = "z-50";
export const COMPOSA_OVERLAY_BOUNDARY_SELECTOR = "[data-composa-overlay-boundary]";

export type AnchoredInspectorOverlayOffset = {
  x: number;
  y: number;
};

type OverlayBounds = Pick<DOMRect, "top" | "right" | "bottom" | "left">;

export function clampAnchoredInspectorOverlayOffset(
  surface: OverlayBounds,
  boundary: OverlayBounds,
  delta: AnchoredInspectorOverlayOffset,
  collisionPadding = ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
): AnchoredInspectorOverlayOffset {
  const minimumX = boundary.left + collisionPadding - surface.left;
  const maximumX = boundary.right - collisionPadding - surface.right;
  const minimumY = boundary.top + collisionPadding - surface.top;
  const maximumY = boundary.bottom - collisionPadding - surface.bottom;
  const clampAxis = (value: number, minimum: number, maximum: number) =>
    minimum <= maximum ? Math.min(maximum, Math.max(minimum, value)) : minimum;
  return {
    x: clampAxis(delta.x, minimumX, maximumX),
    y: clampAxis(delta.y, minimumY, maximumY),
  };
}

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
  minWidth?: number | string;
  side?: AnchoredInspectorOverlaySide;
  align?: AnchoredInspectorOverlayAlign;
  sideOffset?: number;
  collisionPadding?: number;
  /** Modal Popover mode traps focus and returns it to the captured trigger. */
  trapFocus?: boolean;
  blockOutsideDismiss?: boolean;
  onInteractOutside?: () => void;
  triggerClassName?: string;
  className?: string;
  /** Omits the default floating-panel surface while retaining positioning,
   * collision handling, focus behavior, and optional elevation. */
  surface?: "default" | "bare";
  /** Applies a canonical Composa elevation token without relying on generated utility CSS. */
  elevation?: AnchoredInspectorOverlayElevation;
  /**
   * Enables transient pointer-driven positioning from the matching descendant.
   * Interactive controls inside the handle keep their native behavior.
   */
  dragHandleSelector?: string;
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
  minWidth,
  side = "left",
  align = "start",
  sideOffset = 8,
  collisionPadding = ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  trapFocus = true,
  blockOutsideDismiss = false,
  onInteractOutside,
  triggerClassName,
  className,
  surface = "default",
  elevation,
  dragHandleSelector,
}: AnchoredInspectorOverlayProps) {
  const mode = useComposaMode();
  const triggerMode = useRef<string | undefined>(undefined);
  const triggerHost = useRef<HTMLSpanElement>(null);
  const openingGesture = useRef(false);
  const capturedRect = useRef<DOMRect | null>(null);
  const capturedBoundary = useRef<HTMLElement | null>(null);
  const [anchorVersion, setAnchorVersion] = useState(0);
  const [dragOffset, setDragOffset] = useState<AnchoredInspectorOverlayOffset>({ x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    startOffset: AnchoredInspectorOverlayOffset;
    surface: DOMRect;
    boundary: OverlayBounds;
  } | null>(null);
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
      drag.current = null;
      setDragOffset({ x: 0, y: 0 });
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
  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragHandleSelector || event.button !== 0 || !(event.target instanceof Element)) return;
    const handle = event.target.closest(dragHandleSelector);
    if (!handle || !event.currentTarget.contains(handle)) return;
    if (event.target.closest("button,[href],input,select,textarea,[role=button],[role=menuitem],[contenteditable=true]")) return;
    event.preventDefault();
    const surface = event.currentTarget.getBoundingClientRect();
    const boundary = capturedBoundary.current?.getBoundingClientRect() ?? {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    };
    drag.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      startOffset: dragOffset,
      surface,
      boundary,
    };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture unsupported */ }
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || event.pointerId !== active.pointerId) return;
    const delta = clampAnchoredInspectorOverlayOffset(active.surface, active.boundary, {
      x: event.clientX - active.clientX,
      y: event.clientY - active.clientY,
    }, collisionPadding);
    setDragOffset({
      x: active.startOffset.x + delta.x,
      y: active.startOffset.y + delta.y,
    });
  };
  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || event.pointerId !== active.pointerId) return;
    drag.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  };
  const cancelDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const active = drag.current;
    if (!active || event.pointerId !== active.pointerId) return;
    drag.current = null;
    setDragOffset(active.startOffset);
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  };

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
          data-composa-overlay-dragged={dragOffset.x !== 0 || dragOffset.y !== 0 ? "" : undefined}
          data-composa-mode={triggerMode.current ?? mode}
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionBoundary={capturedBoundary.current ?? undefined}
          collisionPadding={collisionPadding}
          avoidCollisions
          sticky="always"
          onInteractOutside={event => {
            onInteractOutside?.();
            if (blockOutsideDismiss) event.preventDefault();
          }}
          onEscapeKeyDown={event => {
            event.preventDefault();
            openingGesture.current = false;
            onClose();
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            triggerControl(triggerHost.current)?.focus();
          }}
          onPointerDownCapture={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={finishDrag}
          onPointerCancel={cancelDrag}
          onLostPointerCapture={event => {
            if (drag.current?.pointerId === event.pointerId) drag.current = null;
          }}
          className={clsx(
            ANCHORED_INSPECTOR_OVERLAY_Z_CLASS,
            "max-h-[var(--radix-popover-content-available-height)] max-w-[calc(100vw-16px)] overflow-hidden outline-none",
            surface === "default" && "rounded-c-lg bg-c-bg shadow-c-500",
            className,
          )}
          style={{
            width,
            minWidth,
            maxHeight: "var(--radix-popover-content-available-height)",
            translate: `${dragOffset.x}px ${dragOffset.y}px`,
            ...(elevation ? { boxShadow: `var(--elevation-${elevation})` } : {}),
          }}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
