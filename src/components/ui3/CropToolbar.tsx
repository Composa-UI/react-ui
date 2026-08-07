import { Check, Proportions } from "lucide-react";
import { clsx } from "clsx";
import { useState } from "react";
import { Button } from "./Button";
import { Menu, MenuRow } from "./Menu";
import { Slider } from "./Slider";
import { SplitButton } from "./SplitButton";
import { iconForSemantic } from "./IconSemantics";
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

function CropAspectControl({ aspect, onAspectChange }: Pick<CropToolbarProps, "aspect" | "onAspectChange">) {
  const [open, setOpen] = useState(false);
  const aspects = Object.keys(LABELS) as CropAspect[];

  return (
    <div
      className="relative shrink-0"
      onBlur={event => {
        if (open && !event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDownCapture={event => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <SplitButton
        icon={<Proportions size={16} strokeWidth={1.5} />}
        actionLabel="Unlock crop proportions"
        menuLabel={`Crop aspect ratio: ${LABELS[aspect]}`}
        selected={aspect !== "free"}
        menuOpen={open}
        onIconClick={() => onAspectChange("free")}
        onChevronClick={() => setOpen(value => !value)}
      />
      {open && (
        <>
          <div aria-hidden className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-[calc(100%+4px)] z-50">
            <Menu>
              {aspects.map(value => (
                <MenuRow
                  key={value}
                  label={LABELS[value]}
                  checked={aspect === value}
                  selectionRole="radio"
                  onClick={() => { onAspectChange(value); setOpen(false); }}
                />
              ))}
            </Menu>
          </div>
        </>
      )}
    </div>
  );
}

export function CropToolbar({ aspect, onAspectChange, onResizeToFill, zoom, onZoomChange, onCancel, onDone, className }: CropToolbarProps) {
  return <div role="toolbar" aria-label="Crop tools" className={clsx(
    "inline-flex h-[40px] items-center gap-[4px] rounded-c-md bg-c-bg px-[8px] ring-1 ring-inset ring-c-border-translucent",
    "shadow-[0px_0px_0.5px_rgba(0,0,0,0.18),0px_3px_8px_rgba(0,0,0,0.12),0px_1px_2px_rgba(0,0,0,0.1)]",
    className,
  )}>
    <span className="px-[4px] text-[length:var(--composa-body-medium-size)] font-[450] leading-[var(--composa-body-medium-line)] text-c-text">Crop</span>
    <span aria-hidden className="h-[24px] w-px bg-c-border" />
    <div className="flex h-[24px] w-[160px] items-center rounded-c-md bg-c-bg-secondary px-[8px]">
      <Slider ariaLabel="Crop zoom" size="compact" min={1} max={4} step={0.01} value={zoom} defaultValue={1} onChange={onZoomChange} />
    </div>
    <CropAspectControl aspect={aspect} onAspectChange={onAspectChange} />
    <Button variant="Ghost" ariaLabel="Resize to fill" iconLead="center" icon={<ResizeToFitIcon size={16} strokeWidth={1.5} />} onClick={onResizeToFill} className="size-[24px]" />
    <span aria-hidden className="mx-[4px] h-[24px] w-px bg-c-border" />
    <Button variant="Secondary" label="Cancel" onClick={onCancel} />
    <Button variant="Primary" ariaLabel="Done" iconLead="center" icon={<Check size={16} strokeWidth={1.5} />} onClick={onDone} className="size-[24px]" />
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
