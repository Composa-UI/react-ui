import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X, Minus, Plus } from "lucide-react";
import { clsx } from "clsx";
import { Modal } from "./Dialog";
import { Slider } from "./Slider";
import { Button } from "./Button";

// ImageAdjustDialog — the "adjust" (crop + zoom) step of the image-picker flow
// (Editor-Study node 289-6537). The flow is: native file picker → this dialog.
//
// Reusable for BOTH the user profile picture (shape="circle") and the team icon
// (shape="square"). Presentational: it owns local zoom/pan state and emits the
// committed transform on Save; the host performs the actual crop/export.

const FONT = "font-[family-name:var(--composa-font-family)]";

const VIEWPORT = 200; // px — crop preview (Figma "Canvas" is 200×200)
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

export interface ImageAdjustResult {
  /** Scale factor applied to the source image (1 = fit). */
  zoom: number;
  /** Pan offset in preview px, from centre. */
  offsetX: number;
  offsetY: number;
  /** Diameter/side of the square crop viewport in px. */
  viewport: number;
}

export interface ImageAdjustDialogProps {
  open: boolean;
  onClose: () => void;
  /** Object URL / data URL of the chosen image (from the native file picker). */
  src?: string;
  /** circle = profile picture (default); square = team icon. */
  shape?: "circle" | "square";
  onSave?: (result: ImageAdjustResult) => void;
  saveLabel?: string;
  /** sr-only dialog title for a11y. */
  title?: string;
}

export function ImageAdjustDialog({
  open,
  onClose,
  src,
  shape = "circle",
  onSave,
  saveLabel = "Save image",
  title = "Adjust image",
}: ImageAdjustDialogProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  // Clamp pan so the scaled image always covers the viewport.
  const clamp = (x: number, y: number, z: number) => {
    const max = (VIEWPORT * (z - 1)) / 2;
    return {
      x: Math.max(-max, Math.min(max, x)),
      y: Math.max(-max, Math.min(max, y)),
    };
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!src) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startY: e.clientY, baseX: offset.x, baseY: offset.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const next = clamp(
      drag.current.baseX + (e.clientX - drag.current.startX),
      drag.current.baseY + (e.clientY - drag.current.startY),
      zoom,
    );
    setOffset(next);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const handleZoom = (z: number) => {
    setZoom(z);
    setOffset(o => clamp(o.x, o.y, z));
  };

  return (
    <Modal open={open} onClose={onClose} width={328} backdrop className="items-center">
      <RadixDialog.Title className="sr-only">{title}</RadixDialog.Title>

      {/* Close — floats top-right (no header bar in the Figma) */}
      <div className="relative w-full">
        <RadixDialog.Close asChild>
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-[8px] top-[8px] z-10 flex items-center justify-center size-[24px] rounded-c-md text-c-icon-secondary hover:bg-c-bg-hover"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </RadixDialog.Close>
      </div>

      <div className="flex flex-col items-center gap-[24px] px-[16px] pt-[28px] pb-[16px]">
        {/* Crop viewport */}
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={clsx(
            "relative overflow-hidden bg-c-bg-secondary touch-none select-none",
            shape === "circle" ? "rounded-c-full" : "rounded-c-lg",
            src && "cursor-grab active:cursor-grabbing",
          )}
          style={{ width: VIEWPORT, height: VIEWPORT }}
          role="img"
          aria-label={title}
        >
          {src && (
            <img
              src={src}
              alt=""
              draggable={false}
              className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
              style={{
                width: VIEWPORT,
                height: VIEWPORT,
                objectFit: "cover",
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
          )}
        </div>

        {/* Zoom control: −  [slider]  + */}
        <div className="flex items-center gap-[16px] w-[264px]">
          <Minus size={16} strokeWidth={2} className="shrink-0 text-c-icon" aria-hidden />
          <div className="flex-1 min-w-0">
            <Slider
              value={zoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              onChange={handleZoom}
              className="w-full"
            />
          </div>
          <Plus size={16} strokeWidth={2} className="shrink-0 text-c-icon" aria-hidden />
        </div>

        {/* Save */}
        <Button
          variant="Primary"
          label={saveLabel}
          disabled={!src}
          onClick={() => onSave?.({ zoom, offsetX: offset.x, offsetY: offset.y, viewport: VIEWPORT })}
        />
      </div>
    </Modal>
  );
}
