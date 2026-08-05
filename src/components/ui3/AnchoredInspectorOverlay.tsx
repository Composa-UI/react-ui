import * as PopoverPrimitive from "@radix-ui/react-popover";
import { clsx } from "clsx";
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from "react";
import { composaModeAt, useComposaMode } from "./useComposaMode";

export type AnchoredInspectorOverlaySide = "left" | "right" | "top" | "bottom";
export type AnchoredInspectorOverlayAlign = "start" | "center" | "end";
export type AnchoredInspectorOverlayElevation = 400 | 500;

export const ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING = 8;
export const ANCHORED_INSPECTOR_OVERLAY_Z_CLASS = "z-50";
export const COMPOSA_OVERLAY_BOUNDARY_SELECTOR = "[data-composa-overlay-boundary]";
/** Marks the inspector panel surface so overlays can anchor to its edge (see `anchorSurfaceSelector`). */
export const COMPOSA_INSPECTOR_SURFACE_SELECTOR = "[data-composa-inspector-surface]";
/**
 * Application chrome should not paint browser text selections while the user
 * drags through controls. Editors and deliberately copyable content opt back in
 * at their own boundary.
 */
export const COMPOSA_NON_SELECTABLE_CHROME_CLASS =
  "select-none [&_input]:select-text [&_textarea]:select-text [&_[contenteditable='true']]:select-text [&_[data-composa-selectable]]:select-text";

export type AnchoredInspectorOverlayOffset = {
  x: number;
  y: number;
};

export type AnchoredInspectorOverlaySize = {
  width: number;
  height: number;
};

export interface AnchoredInspectorOverlayResize {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  ariaLabel?: string;
}

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

export function clampAnchoredInspectorOverlaySize(
  size: AnchoredInspectorOverlaySize,
  surface: Pick<DOMRect, "left" | "top">,
  boundary: OverlayBounds,
  limits: AnchoredInspectorOverlayResize,
  collisionPadding = ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
): AnchoredInspectorOverlaySize {
  const availableWidth = Math.max(0, boundary.right - collisionPadding - surface.left);
  const availableHeight = Math.max(0, boundary.bottom - collisionPadding - surface.top);
  const maximumWidth = Math.min(limits.maxWidth, availableWidth);
  const maximumHeight = Math.min(limits.maxHeight, availableHeight);
  const minimumWidth = Math.min(limits.minWidth, maximumWidth);
  const minimumHeight = Math.min(limits.minHeight, maximumHeight);
  return {
    width: Math.min(maximumWidth, Math.max(minimumWidth, size.width)),
    height: Math.min(maximumHeight, Math.max(minimumHeight, size.height)),
  };
}

export function shouldMountAnchoredInspectorOverlay(open: boolean, anchorReady: boolean): boolean {
  return open && anchorReady;
}

/**
 * Last-resort anchor for a free-floating overlay whose `anchorSelector` and
 * overlay boundary both resolve to nothing. Built by hand rather than through
 * `new DOMRect(...)` so the fallback also works where there is no DOM
 * constructor (SSR, and the node-environment unit tests).
 */
function viewportAnchorRect(): DOMRect {
  const width = typeof window === "undefined" ? 0 : window.innerWidth;
  const height = typeof window === "undefined" ? 0 : window.innerHeight;
  return {
    x: 0, y: 0, width, height, top: 0, right: width, bottom: height, left: 0,
    toJSON() { return this; },
  } as DOMRect;
}

export interface AnchoredInspectorOverlayProps {
  open: boolean;
  onClose: () => void;
  /**
   * The control the overlay launches from. Optional: see {@link
   * AnchoredInspectorOverlayProps.anchorSelector} for surfaces that have no
   * persistent trigger to capture.
   */
  trigger?: ReactElement;
  /**
   * FREE-FLOATING mode — used when no `trigger` is supplied. Names the element
   * the overlay positions against, which then plays every role the trigger
   * normally plays: it supplies the anchor rect, the drag/collision boundary,
   * and the Composa mode. `side` / `align` / `sideOffset` are interpreted
   * against it exactly as they are against a trigger.
   *
   * This exists because not every floating surface HAS a launch control to
   * capture: a mini-player opened from a menu row that closes itself on select,
   * or straight from a URL, would otherwise need a phantom trigger element
   * whose only job is to satisfy this API.
   *
   * If the selector matches nothing the anchor falls back to the nearest
   * `[data-composa-overlay-boundary]`, and then to the viewport. That fallback
   * is deliberate: a trigger-anchored overlay can safely wait for its trigger to
   * appear, but a free-floating one has nothing to wait for, so a missed
   * selector would leave `open` painting nothing at all.
   *
   * Ignored when `trigger` is supplied.
   */
  anchorSelector?: string;
  children: ReactNode;
  ariaLabel: string;
  width?: number | string;
  minWidth?: number | string;
  side?: AnchoredInspectorOverlaySide;
  align?: AnchoredInspectorOverlayAlign;
  sideOffset?: number;
  /** Cross-axis offset from the selected alignment edge. For a right/left
   * overlay this is the vertical inset; for a top/bottom overlay it is the
   * horizontal inset. */
  alignOffset?: number;
  collisionPadding?: number;
  /** Modal Popover mode traps focus and returns it to the captured trigger. */
  trapFocus?: boolean;
  /**
   * Keep focus on the control that opened a non-modal surface instead of
   * moving it to the first focusable child. This is useful for passive
   * application chrome such as Preview: auto-focusing its first icon action
   * would also display that action's focus tooltip before the user interacts.
   */
  preserveFocusOnOpen?: boolean;
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
  /** Adds the canonical bottom-right resize affordance and clamps the window to
   * both explicit product limits and the current overlay boundary. */
  resizable?: AnchoredInspectorOverlayResize;
  /**
   * Anchors the overlay's `side` axis to the LEFT edge of the nearest ancestor
   * matching this selector (the inspector panel), instead of to the trigger.
   * The trigger still supplies the cross-axis (vertical) position. This keeps a
   * left-docked dialog clear of the inspector regardless of where its trigger
   * sits in the row — a fixed trigger-relative `sideOffset` silently overlaps as
   * soon as the trigger inset or panel width drifts from the value it was tuned
   * to (see #499). With this set, `sideOffset` is simply the gutter to the edge.
   */
  anchorSurfaceSelector?: string;
  /**
   * Names an explicit host boundary for Radix collision handling and every drag
   * and resize path. The selector is resolved when the overlay opens. If it is
   * absent, invalid, or matches nothing, the overlay preserves its established
   * nearest `[data-composa-overlay-boundary]` and viewport fallbacks.
   */
  boundarySelector?: string;
}

function triggerControl(host: HTMLElement | null): HTMLElement | null {
  return host?.querySelector<HTMLElement>("button,[href],input,select,textarea,[role=button],[tabindex]:not([tabindex='-1'])") ?? host;
}

function resolveOverlayBoundary(anchor: HTMLElement | null, boundarySelector?: string): HTMLElement | null {
  if (boundarySelector && typeof document !== "undefined") {
    try {
      const explicitBoundary = document.querySelector<HTMLElement>(boundarySelector);
      if (explicitBoundary) return explicitBoundary;
    } catch {
      // An invalid or stale host selector must preserve the established fallback.
    }
  }
  return anchor?.closest<HTMLElement>(COMPOSA_OVERLAY_BOUNDARY_SELECTOR) ?? null;
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
  anchorSelector,
  children,
  ariaLabel,
  width = 240,
  minWidth,
  side = "left",
  align = "start",
  sideOffset = 8,
  alignOffset = 0,
  collisionPadding = ANCHORED_INSPECTOR_OVERLAY_COLLISION_PADDING,
  trapFocus = true,
  preserveFocusOnOpen = false,
  blockOutsideDismiss = false,
  onInteractOutside,
  triggerClassName,
  className,
  surface = "default",
  elevation,
  dragHandleSelector,
  resizable,
  anchorSurfaceSelector,
  boundarySelector,
}: AnchoredInspectorOverlayProps) {
  const mode = useComposaMode();
  const triggerMode = useRef<string | undefined>(undefined);
  const triggerHost = useRef<HTMLSpanElement>(null);
  const openingGesture = useRef(false);
  const capturedRect = useRef<DOMRect | null>(null);
  const capturedSurfaceRect = useRef<DOMRect | null>(null);
  const capturedBoundary = useRef<HTMLElement | null>(null);
  const [anchorVersion, setAnchorVersion] = useState(0);
  const [dragOffset, setDragOffset] = useState<AnchoredInspectorOverlayOffset>({ x: 0, y: 0 });
  const [resizedSize, setResizedSize] = useState<AnchoredInspectorOverlaySize | null>(null);
  const drag = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    startOffset: AnchoredInspectorOverlayOffset;
    surface: DOMRect;
    boundary: OverlayBounds;
  } | null>(null);
  const resize = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    startSize: AnchoredInspectorOverlaySize;
    surface: DOMRect;
    boundary: OverlayBounds;
  } | null>(null);
  // When anchoring to the inspector surface edge, keep the trigger's vertical
  // extent (cross axis) but collapse the horizontal position onto the surface's
  // LEFT edge, so a side="left" placement rests `sideOffset` to the left of the
  // inspector regardless of the trigger's own x (see `anchorSurfaceSelector`).
  const virtualAnchor = useRef({
    getBoundingClientRect: () => {
      const trigger = capturedRect.current!;
      const surface = capturedSurfaceRect.current;
      if (!surface) return trigger;
      const left = surface.left;
      return {
        x: left,
        y: trigger.top,
        left,
        right: left,
        top: trigger.top,
        bottom: trigger.bottom,
        width: 0,
        height: trigger.height,
        toJSON() { return this; },
      } as DOMRect;
    },
  });

  const capture = (markOpeningGesture = false) => {
    if (!trigger) {
      // Free-floating: there is no launch control to capture, so the anchor is
      // whatever `anchorSelector` names. This branch always succeeds (see the
      // prop doc) — a free-floating surface has no trigger to wait for, so
      // failing here would mean `open` renders nothing.
      const anchor = (anchorSelector && typeof document !== "undefined"
        ? document.querySelector<HTMLElement>(anchorSelector)
        : null)
        ?? (typeof document === "undefined"
          ? null
          : document.querySelector<HTMLElement>(COMPOSA_OVERLAY_BOUNDARY_SELECTOR));
      openingGesture.current = markOpeningGesture;
      capturedRect.current = anchor?.getBoundingClientRect() ?? viewportAnchorRect();
      capturedSurfaceRect.current = anchorSurfaceSelector
        ? anchor?.closest<HTMLElement>(anchorSurfaceSelector)?.getBoundingClientRect() ?? null
        : null;
      capturedBoundary.current = resolveOverlayBoundary(anchor, boundarySelector);
      triggerMode.current = (anchor ? composaModeAt(anchor) : undefined) ?? mode;
      return true;
    }
    const target = triggerControl(triggerHost.current);
    if (target) {
      openingGesture.current = markOpeningGesture;
      capturedRect.current = target.getBoundingClientRect();
      capturedSurfaceRect.current = anchorSurfaceSelector
        ? target.closest<HTMLElement>(anchorSurfaceSelector)?.getBoundingClientRect() ?? null
        : null;
      capturedBoundary.current = resolveOverlayBoundary(target, boundarySelector);
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
      capturedSurfaceRect.current = null;
      capturedBoundary.current = null;
      triggerMode.current = undefined;
      drag.current = null;
      resize.current = null;
      setDragOffset({ x: 0, y: 0 });
      setResizedSize(null);
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
  const beginResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!resizable || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const surfaceElement = event.currentTarget.closest<HTMLElement>("[data-composa-component='AnchoredInspectorOverlay']");
    if (!surfaceElement) return;
    const surface = surfaceElement.getBoundingClientRect();
    const boundary = capturedBoundary.current?.getBoundingClientRect() ?? {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    };
    resize.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      startSize: { width: surface.width, height: surface.height },
      surface,
      boundary,
    };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* capture unsupported */ }
  };
  const moveResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = resize.current;
    if (!resizable || !active || event.pointerId !== active.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    setResizedSize(clampAnchoredInspectorOverlaySize({
      width: active.startSize.width + event.clientX - active.clientX,
      height: active.startSize.height + event.clientY - active.clientY,
    }, active.surface, active.boundary, resizable, collisionPadding));
  };
  const finishResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const active = resize.current;
    if (!active || event.pointerId !== active.pointerId) return;
    resize.current = null;
    try { event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* already released */ }
  };
  const resizeFromKeyboard = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!resizable || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const surfaceElement = event.currentTarget.closest<HTMLElement>("[data-composa-component='AnchoredInspectorOverlay']");
    if (!surfaceElement) return;
    const surface = surfaceElement.getBoundingClientRect();
    const boundary = capturedBoundary.current?.getBoundingClientRect() ?? {
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
      left: 0,
    };
    const step = event.shiftKey ? 1 : 8;
    const horizontal = event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0;
    const vertical = event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0;
    setResizedSize(current => clampAnchoredInspectorOverlaySize({
      width: (current?.width ?? surface.width) + horizontal,
      height: (current?.height ?? surface.height) + vertical,
    }, surface, boundary, resizable, collisionPadding));
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
      {trigger !== undefined && (
        <span
          ref={triggerHost}
          className={clsx("inline-flex", triggerClassName)}
          onPointerDownCapture={() => { capture(true); }}
          onKeyDownCapture={event => { if (event.key === "Enter" || event.key === " ") capture(true); }}
        >
          {trigger}
        </span>
      )}
      {capturedRect.current && <PopoverPrimitive.Anchor key={anchorVersion} virtualRef={virtualAnchor} />}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          role="dialog"
          aria-label={ariaLabel}
          aria-modal={trapFocus}
          data-composa-component="AnchoredInspectorOverlay"
          data-composa-overlay-dragged={dragOffset.x !== 0 || dragOffset.y !== 0 ? "" : undefined}
          data-composa-overlay-resized={resizedSize ? "" : undefined}
          data-composa-mode={triggerMode.current ?? mode}
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
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
          onOpenAutoFocus={event => {
            if (preserveFocusOnOpen) event.preventDefault();
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
            // Floating surfaces are application chrome: dragging labels or blank
            // space must move the window/control rather than paint a browser text
            // selection. Native editors and explicitly copyable content opt back
            // in at their own boundary.
            COMPOSA_NON_SELECTABLE_CHROME_CLASS,
            "relative max-h-[var(--radix-popover-content-available-height)] max-w-[calc(100vw-16px)] overflow-hidden outline-none",
            surface === "default" && "rounded-c-lg bg-c-bg shadow-c-500",
            className,
          )}
          style={{
            width: resizedSize?.width ?? width,
            height: resizedSize?.height,
            minWidth,
            minHeight: resizable?.minHeight,
            maxHeight: "var(--radix-popover-content-available-height)",
            translate: `${dragOffset.x}px ${dragOffset.y}px`,
            ...(elevation ? { boxShadow: `var(--elevation-${elevation})` } : {}),
          }}
        >
          {children}
          {resizable && (
            <button
              type="button"
              aria-label={resizable.ariaLabel ?? "Resize floating dialog"}
              data-composa-overlay-resize-handle="bottom-right"
              className="absolute bottom-0 right-0 z-10 flex size-[20px] touch-none select-none cursor-nwse-resize items-end justify-end bg-transparent p-[4px] text-c-icon-secondary"
              onPointerDown={beginResize}
              onPointerMove={moveResize}
              onPointerUp={finishResize}
              onPointerCancel={finishResize}
              onLostPointerCapture={event => {
                if (resize.current?.pointerId === event.pointerId) resize.current = null;
              }}
              onKeyDown={resizeFromKeyboard}
            >
              <span aria-hidden className="block size-[8px] border-b border-r border-current" />
            </button>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
