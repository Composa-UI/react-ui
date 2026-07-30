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
  className?: string;
  children?: React.ReactNode;
}

export function SidePanel({
  width: controlledWidth,
  defaultWidth = SIDE_PANEL_DEFAULT_WIDTH,
  onWidthChange,
  className,
  children,
  ...rest
}: SidePanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [internalWidth, setInternalWidth] = useState(defaultWidth);
  const width = controlledWidth ?? internalWidth;
  const [dragging, setDragging] = useState(false);

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
      const el = containerRef.current;
      if (!el) return;
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        setWidth(ev.clientX - rect.left);
      };
      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [setWidth],
  );

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
        aria-label="Resize panel width"
        aria-valuenow={Math.round(width)}
        aria-valuemin={SIDE_PANEL_MIN_WIDTH}
        aria-valuemax={SIDE_PANEL_MAX_WIDTH}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
        className={clsx(
          "absolute top-0 right-0 h-full w-[4px] z-20 cursor-ew-resize select-none outline-none translate-x-1/2",
          dragging && "bg-c-border-selected/40",
        )}
      />
    </div>
  );
}
