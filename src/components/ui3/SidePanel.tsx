import { useCallback, useRef, useState } from "react";
import clsx from "clsx";

/**
 * The resizable shell shared by every left-rail panel.
 *
 * Composition, Assets and Agent all occupy the same slot, but only
 * CompositionPanel owned a width and a drag handle — Assets and Agent hardcoded
 * `w-[240px]`. Switching tabs therefore lost the ability to resize at all, and
 * lost whatever width the user had chosen (Composa#664).
 *
 * Width lives here so the three panels cannot drift apart, and so a host that
 * controls `width` gets ONE value that survives switching tabs. Uncontrolled use
 * still works, but each panel then keeps its own width — which is why the host
 * should control it if the width is meant to persist across the rail.
 */

export const SIDE_PANEL_DEFAULT_WIDTH = 240;
export const SIDE_PANEL_MIN_WIDTH = 200;
export const SIDE_PANEL_MAX_WIDTH = 360;

export interface SidePanelProps extends Omit<React.ComponentPropsWithoutRef<"div">, "style" | "children" | "className"> {
  /** Panel width in px (controlled). */
  width?: number;
  /** Uncontrolled default when `width` is not provided. Default 240px. */
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
  /** Accessible name for the resize separator. */
  resizeLabel?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SidePanel({
  width: controlledWidth,
  defaultWidth = SIDE_PANEL_DEFAULT_WIDTH,
  onWidthChange,
  resizeLabel = "Resize panel width",
  className,
  children,
  ...rest
}: SidePanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalWidth, setInternalWidth] = useState(defaultWidth);
  const width = controlledWidth ?? internalWidth;
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  const setWidth = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, SIDE_PANEL_MIN_WIDTH), SIDE_PANEL_MAX_WIDTH);
      if (controlledWidth == null) setInternalWidth(clamped);
      onWidthChange?.(clamped);
    },
    [controlledWidth, onWidthChange],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!containerRef.current) return;
      dragRef.current = { pointerId: e.pointerId, startX: e.clientX, startWidth: width };
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [width],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setWidth(drag.startWidth + e.clientX - drag.startX);
  }, [setWidth]);

  const finishPointerDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if ((e.currentTarget as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); setWidth(width - 8); }
      else if (e.key === "ArrowRight") { e.preventDefault(); setWidth(width + 8); }
    },
    [width, setWidth],
  );

  return (
    <div
      ref={containerRef}
      className={clsx(
        "relative shrink-0 h-full flex flex-col bg-c-bg border-r border-c-border overflow-hidden",
        className,
      )}
      style={{ width }}
      {...rest}
    >
      {children}

      {/* Width resize affordance — thin invisible vertical strip on the RIGHT EDGE.
          No visible handle; only an ew-resize cursor on hover. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={resizeLabel}
        aria-valuenow={Math.round(width)}
        aria-valuemin={SIDE_PANEL_MIN_WIDTH}
        aria-valuemax={SIDE_PANEL_MAX_WIDTH}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointerDrag}
        onPointerCancel={finishPointerDrag}
        onKeyDown={onKeyDown}
        className={clsx(
          "absolute top-0 right-0 h-full w-[4px] z-20 cursor-ew-resize select-none outline-none",
          dragging && "bg-c-border-selected/40",
        )}
      />
    </div>
  );
}
