import { Check, Maximize2, X } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export type CropAspect = "free" | "original" | "1:1" | "4:3" | "16:9";

const LABELS: Record<CropAspect, string> = {
  free: "Free", original: "Original", "1:1": "1:1", "4:3": "4:3", "16:9": "16:9",
};

export interface CropToolbarProps {
  aspect: CropAspect;
  onAspectChange: (aspect: CropAspect) => void;
  onResizeToFill: () => void;
  onCancel: () => void;
  onDone: () => void;
  className?: string;
}

/** Canonical UI3 crop controls. The host owns document mutations and canvas geometry. */
export function CropToolbar({ aspect, onAspectChange, onResizeToFill, onCancel, onDone, className }: CropToolbarProps) {
  const aspects = Object.keys(LABELS) as CropAspect[];
  return <div role="toolbar" aria-label="Crop tools" className={clsx(
    "inline-flex items-center gap-[6px] rounded-c-lg bg-c-bg p-[6px] ring-1 ring-inset ring-c-border-translucent",
    "shadow-[0px_0px_0.5px_rgba(0,0,0,0.18),0px_3px_8px_rgba(0,0,0,0.12),0px_1px_2px_rgba(0,0,0,0.1)]",
    className,
  )}>
    <Button variant="Secondary" label="Resize to fill" iconLead="left" icon={<Maximize2 size={14} strokeWidth={1.5} />} onClick={onResizeToFill} />
    <PopoverMenu align="left" trigger={<Dropdown ariaLabel="Crop aspect ratio" value={LABELS[aspect]} />}>
      {close => <Menu>{aspects.map(value => <MenuRow key={value} label={LABELS[value]} checked={aspect === value} selectionRole="radio" onClick={() => { onAspectChange(value); close(); }} />)}</Menu>}
    </PopoverMenu>
    <Button variant="Secondary" label="Cancel" iconLead="left" icon={<X size={14} strokeWidth={1.5} />} onClick={onCancel} />
    <Button variant="Primary" label="Done" iconLead="left" icon={<Check size={14} strokeWidth={1.5} />} onClick={onDone} />
  </div>;
}

export interface CanvasCropOverlayProps {
  style?: CSSProperties;
  onMove: (deltaX: number, deltaY: number) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  className?: string;
}

/** Move-only crop viewport; resize/aspect controls live in CropToolbar. */
export function CanvasCropOverlay({ style, onMove, onMoveStart, onMoveEnd, className }: CanvasCropOverlayProps) {
  return <div data-composa-crop-overlay className={clsx("absolute z-[10020] box-border cursor-move", className)} style={{
    border: "2px solid var(--color-border-selected)",
    backgroundImage: "linear-gradient(to right, transparent 33.2%, rgba(255,255,255,.65) 33.2%, rgba(255,255,255,.65) 33.45%, transparent 33.45%, transparent 66.55%, rgba(255,255,255,.65) 66.55%, rgba(255,255,255,.65) 66.8%, transparent 66.8%), linear-gradient(to bottom, transparent 33.2%, rgba(255,255,255,.65) 33.2%, rgba(255,255,255,.65) 33.45%, transparent 33.45%, transparent 66.55%, rgba(255,255,255,.65) 66.55%, rgba(255,255,255,.65) 66.8%, transparent 66.8%)",
    ...style,
  }}
    onPointerDown={event => {
      if (event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      onMoveStart?.();
      let previousX = event.clientX, previousY = event.clientY;
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      const move = (next: ReactPointerEvent<HTMLDivElement>) => {
        onMove(next.clientX - previousX, next.clientY - previousY);
        previousX = next.clientX; previousY = next.clientY;
      };
      target.onpointermove = move as unknown as (event: PointerEvent) => void;
      target.onpointerup = target.onpointercancel = () => { target.onpointermove = null; target.onpointerup = null; target.onpointercancel = null; onMoveEnd?.(); };
    }}>
  </div>;
}
