import { clsx } from "clsx";

export type ChitType = "Fill" | "Opacity" | "Gradient" | "Image" | "Video" | "Instance";
export type ChitVariant = "Square" | "Circle";

const CSS_CHECKERBOARD = "repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 8px 8px";

interface ChitProps {
  color?: string;
  /** Exact host-projected authored gradient. Omit to fall back to `color`, never demo rainbow artwork. */
  gradient?: string;
  /** Authored media URL. Image and video chits render the actual bound asset. */
  previewUrl?: string;
  type?: ChitType;
  variant?: ChitVariant;
  className?: string;
}

// Chit always renders fixed light colors — color swatches in the inspector
// are always shown on the light panel surface in UI3.
export function Chit({ color = "#ff24bd", gradient, previewUrl, type = "Fill", variant = "Square", className }: ChitProps) {
  return (
    <div className={clsx("overflow-clip relative shrink-0 size-[24px]", className)}>

      {variant === "Square" && type !== "Instance" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative rounded-[2px] overflow-hidden" style={{ width: 14, height: 14 }}>
            {/* white base */}
            <div className="absolute inset-0 bg-white rounded-[2px]" />

            {/* gradient or checkerboard layers */}
            {(type === "Opacity" || type === "Image" || type === "Video" || type === "Gradient") && (
              <div
                data-composa-gradient-preview={type === "Gradient" ? true : undefined}
                className="absolute inset-0 rounded-[2px]"
                style={{ background: type === "Gradient" ? gradient ?? color : color }}
              />
            )}
            {(type === "Opacity" || type === "Image" || type === "Video") && (
              <div className="absolute inset-0 rounded-[2px]" style={{ background: CSS_CHECKERBOARD }} />
            )}

            {previewUrl && type === "Image" && (
              <img src={previewUrl} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
            )}
            {previewUrl && type === "Video" && (
              <video src={previewUrl} aria-hidden muted playsInline preload="metadata" className="absolute inset-0 size-full object-cover" />
            )}

            {/* solid fill */}
            {type === "Fill" && (
              <div className="absolute inset-0 rounded-[2px]" style={{ backgroundColor: color }} />
            )}

            {/* opacity: left half solid, right half faded */}
            {type === "Opacity" && (
              <>
                <div
                  className="absolute top-0 bottom-0 left-0 rounded-l-[2px]"
                  style={{ width: 7, backgroundColor: color }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 rounded-r-[2px] opacity-[0.24]"
                  style={{ width: 7, backgroundColor: color }}
                />
              </>
            )}

            {/* border overlay */}
            {(type === "Fill" || type === "Image" || type === "Video") && (
              <div className="absolute inset-0 rounded-[2px] border border-black/10 pointer-events-none" />
            )}
          </div>
        </div>
      )}


{variant === "Circle" && type === "Fill" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full" style={{ width: 16, height: 16, backgroundColor: color }} />
        </div>
      )}

    </div>
  );
}
