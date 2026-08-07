import { Check, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./Button";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Slider } from "./Slider";
import { iconForSemantic } from "./icon-semantics";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export type CropAspect = "free" | "original" | "1:1" | "4:3" | "16:9";

const LABELS: Record<CropAspect, string> = {
  free: "Free", original: "Original", "1:1": "1:1", "4:3": "4:3", "16:9": "16:9",
};

export interface CropToolbarProps {
  aspect: CropAspect;
  onAspectChange: (aspect: CropAspect) => void;
  onResizeToFill: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onCancel: () => void;
  onDone: () => void;
  className?: string;
}

/** Canonical UI3 crop controls. The host owns document mutations and canvas geometry. */
const ResizeToFitIcon = iconForSemantic("resize-to-fit");

export function CropToolbar({ aspect, onAspectChange, onResizeToFill, zoom, onZoomChange, onCancel, onDone, className }: CropToolbarProps) {
  const aspects = Object.keys(LABELS) as CropAspect[];
  return <div role="toolbar" aria-label="Crop tools" className={clsx(
    "inline-flex h-[64px] items-center rounded-[16px] bg-c-bg px-[16px] ring-1 ring-inset ring-c-border-translucent",
    "shadow-[0px_0px_0.5px_rgba(0,0,0,0.18),0px_3px_8px_rgba(0,0,0,0.12),0px_1px_2px_rgba(0,0,0,0.1)]",
    className,
  )}>
    <span className="pr-[16px] text-[18px] font-[450] text-c-text">Crop</span>
    <span aria-hidden className="h-full w-px bg-c-border" />
    <div className="mx-[16px] flex h-[40px] w-[240px] items-center rounded-[10px] bg-c-bg-secondary px-[16px]">
      <Slider ariaLabel="Crop zoom" min={1} max={4} step={0.01} value={zoom} defaultValue={1} onChange={onZoomChange} />
    </div>
    <Button variant="Ghost" ariaLabel="Resize to fill" iconLead="center" icon={<ResizeToFitIcon size={20} strokeWidth={1.5} />} onClick={onResizeToFill} className="size-[40px]" />
    <PopoverMenu align="left" trigger={<Button variant="Ghost" ariaLabel={`Crop aspect ratio: ${LABELS[aspect]}`} iconLead="center" icon={<ChevronDown size={20} strokeWidth={1.5} />} className="size-[40px]" />}>
      {close => <Menu>{aspects.map(value => <MenuRow key={value} label={LABELS[value]} checked={aspect === value} selectionRole="radio" onClick={() => { onAspectChange(value); close(); }} />)}</Menu>}
    </PopoverMenu>
    <span aria-hidden className="mx-[16px] h-full w-px bg-c-border" />
    <Button variant="Ghost" label="Cancel" size="large" onClick={onCancel} className="text-[18px]" />
    <Button variant="Primary" ariaLabel="Done" iconLead="center" icon={<Check size={24} strokeWidth={1.5} />} onClick={onDone} className="ml-[12px] size-[48px] rounded-[12px]" />
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
