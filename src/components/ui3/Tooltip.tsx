import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { clsx } from "clsx";
import { type ReactNode } from "react";

// ─── Shared constants ─────────────────────────────────────────────────────────
// Tooltip always renders dark (#1e1e1e) — it floats above any surface.
const BG = "#1e1e1e";
const SHADOW = "drop-shadow-[0px_0px_0.25px_rgba(0,0,0,0.15),0px_5px_6px_rgba(0,0,0,0.13),0px_1px_1.5px_rgba(0,0,0,0.1)]";

// ─── Arrow ────────────────────────────────────────────────────────────────────

function TooltipArrow() {
  return (
    <TooltipPrimitive.Arrow
      width={12}
      height={6}
      className="fill-[#1e1e1e]"
    />
  );
}

// ─── TooltipContent (visual shell) ───────────────────────────────────────────

interface TooltipContentProps {
  label: string;
  hotkey?: string;
  className?: string;
}

function TooltipContent({ label, hotkey, className }: TooltipContentProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-[4px] px-[8px] py-[4px] rounded-[5px] max-w-[200px]",
        SHADOW,
        className,
      )}
      style={{ backgroundColor: BG }}
    >
      <span
        className="flex-1 min-w-0 text-white text-[11px] font-[450] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)]"
      >
        {label}
      </span>
      {hotkey && (
        <span
          className="shrink-0 text-[rgba(255,255,255,0.7)] text-[11px] font-[450] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)] whitespace-nowrap"
        >
          {hotkey}
        </span>
      )}
    </div>
  );
}

// ─── Tooltip (functional wrapper) ────────────────────────────────────────────

type TooltipSide = "top" | "bottom" | "left" | "right";
type TooltipAlign = "start" | "center" | "end";

// Maps the Figma direction names to Radix side/align
const DIRECTION_MAP: Record<
  string,
  { side: TooltipSide; align: TooltipAlign }
> = {
  TopCenter:    { side: "top",    align: "center" },
  TopLeft:      { side: "top",    align: "start"  },
  TopRight:     { side: "top",    align: "end"    },
  BottomCenter: { side: "bottom", align: "center" },
  BottomLeft:   { side: "bottom", align: "start"  },
  BottomRight:  { side: "bottom", align: "end"    },
  Left:         { side: "left",   align: "center" },
  Right:        { side: "right",  align: "center" },
};

interface TooltipProps {
  children: ReactNode;
  label: string;
  hotkey?: string;
  direction?: keyof typeof DIRECTION_MAP;
  delayDuration?: number;
  disabled?: boolean;
}

export function Tooltip({
  children,
  label,
  hotkey,
  direction = "TopCenter",
  delayDuration = 400,
  disabled = false,
}: TooltipProps) {
  const { side, align } = DIRECTION_MAP[direction] ?? DIRECTION_MAP.TopCenter;

  if (disabled) return <>{children}</>;

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          className="z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <TooltipContent label={label} hotkey={hotkey} />
          <TooltipArrow />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

// ─── TooltipProvider (wrap your app with this) ────────────────────────────────

export function TooltipProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={400}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

// ─── TooltipBody (static, for showcase/documentation only) ────────────────────
// Renders the tooltip visually without hover behavior.

type TooltipDirection = keyof typeof DIRECTION_MAP;

interface TooltipBodyProps {
  label?: string;
  hotkey?: string;
  direction?: TooltipDirection;
}

const ARROW_POSITIONS: Record<TooltipDirection, string> = {
  TopCenter:    "-translate-x-1/2 left-1/2 top-[-6px]",
  TopLeft:      "left-[8px] top-[-6px]",
  TopRight:     "right-[8px] top-[-6px]",
  BottomCenter: "-translate-x-1/2 bottom-[-6px] left-1/2",
  BottomLeft:   "bottom-[-6px] left-[8px]",
  BottomRight:  "bottom-[-6px] right-[8px]",
  Left:         "-translate-y-1/2 left-[-6px] top-1/2",
  Right:        "-translate-y-1/2 right-[-6px] top-1/2",
};

// Arrow SVG path: triangle pointing UP — rotated per direction
const ARROW_ROTATION: Record<TooltipDirection, string> = {
  TopCenter:    "rotate-180",           // Up arrow placed at top = points up toward trigger
  TopLeft:      "rotate-180",
  TopRight:     "rotate-180",
  BottomCenter: "",                     // Down arrow (unrotated path flipped) placed at bottom
  BottomLeft:   "",
  BottomRight:  "",
  Left:         "-rotate-90",          // Points left
  Right:        "rotate-90",           // Points right
};

const ARROW_SIZE: Record<TooltipDirection, string> = {
  TopCenter: "w-[12px] h-[6px]", TopLeft: "w-[12px] h-[6px]", TopRight: "w-[12px] h-[6px]",
  BottomCenter: "w-[12px] h-[6px]", BottomLeft: "w-[12px] h-[6px]", BottomRight: "w-[12px] h-[6px]",
  Left: "w-[6px] h-[12px]",
  Right: "w-[6px] h-[12px]",
};

// Arrow SVG paths — each points in the correct direction directly, no rotation tricks
function StaticArrow({ direction }: { direction: TooltipDirection }) {
  const pos = ARROW_POSITIONS[direction];
  const isTop    = direction.startsWith("Top");
  const isBottom = direction.startsWith("Bottom");
  const isLeft   = direction === "Left";
  const isRight  = direction === "Right";

  const wrapClass = clsx(
    "absolute flex items-center justify-center",
    pos,
    (isTop || isBottom) ? "w-[12px] h-[6px]" : "w-[6px] h-[12px]",
  );

  return (
    <div className={wrapClass}>
      <svg fill="none"
        width={isTop || isBottom ? 12 : 6}
        height={isTop || isBottom ? 6 : 12}
        viewBox={isTop || isBottom ? "0 0 12 6" : "0 0 6 12"}
      >
        {isTop    && <path d="M6 0L12 6H0L6 0Z"   fill={BG} />}
        {isBottom && <path d="M6 6L0 0H12L6 6Z"   fill={BG} />}
        {isLeft   && <path d="M0 6L6 0V12L0 6Z"   fill={BG} />}
        {isRight  && <path d="M6 6L0 0V12L6 6Z"   fill={BG} />}
      </svg>
    </div>
  );
}

export function TooltipBody({
  label = "Tooltip text",
  hotkey = "⌘V",
  direction = "TopCenter",
}: TooltipBodyProps) {
  return (
    <div
      className={clsx("relative inline-flex flex-col items-center max-w-[200px] rounded-[5px]", SHADOW)}
      style={{ backgroundColor: BG }}
    >
      <div className="flex items-center gap-[4px] px-[8px] py-[4px]">
        <span className="text-white text-[11px] font-[450] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)]">
          {label}
        </span>
        {hotkey && (
          <span className="text-[rgba(255,255,255,0.7)] text-[11px] font-[450] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)] whitespace-nowrap">
            {hotkey}
          </span>
        )}
      </div>
      <StaticArrow direction={direction} />
    </div>
  );
}

// ─── TooltipLink ──────────────────────────────────────────────────────────────
// Special link-action tooltip variant shown on canvas hyperlinks.

type LinkVariant = "URL" | "Link" | "Phone" | "Email" | "Page" | "Prototype" | "Frame" | "File";

interface TooltipLinkProps {
  variant?: LinkVariant;
  label?: string;
  cta?: string[];
  onCtaClick?: (cta: string) => void;
}

const LINK_META: Record<Exclude<LinkVariant, "URL">, { icon: string; defaultLabel: string; ctas: string[] }> = {
  Link:      { icon: "🔗", defaultLabel: "Open google.com",    ctas: ["Edit"] },
  Phone:     { icon: "📞", defaultLabel: "Call (415) 355-0394", ctas: ["Edit"] },
  Email:     { icon: "✉️", defaultLabel: "Copy mail@mail.com",  ctas: ["Send mail", "Edit"] },
  Page:      { icon: "📄", defaultLabel: "Go to page",          ctas: ["Edit"] },
  Prototype: { icon: "▶",  defaultLabel: "Open prototype",      ctas: ["Edit"] },
  Frame:     { icon: "⊞",  defaultLabel: "Go to frame",         ctas: ["Edit"] },
  File:      { icon: "📁", defaultLabel: "Open file",           ctas: ["Edit"] },
};

const LINK_TEXT = "text-[11px] font-[450] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)]";

export function TooltipLink({
  variant = "URL",
  label,
  cta,
  onCtaClick,
}: TooltipLinkProps) {
  // Bottom-center caret — points DOWN (tooltip sits above the link)
  const Caret = () => (
    <div className="absolute -translate-x-1/2 bottom-[-6px] left-1/2 flex items-center justify-center w-[12px] h-[6px]">
      <svg width="12" height="6" viewBox="0 0 12 6" fill="none">
        <path d="M6 6L0 0H12L6 6Z" fill={BG} />
      </svg>
    </div>
  );

  if (variant === "URL") {
    return (
      <div
        className={clsx("relative flex flex-col max-w-[230px] w-[200px] px-[8px] py-[4px] rounded-[5px]", SHADOW)}
        style={{ backgroundColor: BG }}
      >
        <span className={clsx(LINK_TEXT, "text-[rgba(255,255,255,0.7)]")}>
          {label ?? "Type or paste URL"}
        </span>
        <Caret />
      </div>
    );
  }

  const meta = LINK_META[variant];
  const displayLabel = label ?? meta.defaultLabel;
  const displayCtas = cta ?? meta.ctas;

  return (
    <div
      className={clsx("relative flex items-center rounded-[5px] overflow-hidden", SHADOW)}
      style={{ backgroundColor: BG }}
    >
      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center size-[24px] text-[rgba(255,255,255,0.7)] text-[13px]">
        {meta.icon}
      </span>

      {/* Label */}
      <span className={clsx(LINK_TEXT, "text-white pr-[8px] whitespace-nowrap")}>
        {displayLabel}
      </span>

      {/* CTA buttons with separators — shrink-0 + whitespace-nowrap prevents wrapping/stretching */}
      {displayCtas.map((c, i) => (
        <div key={c} className="flex items-center self-stretch shrink-0">
          <div className="w-px self-stretch" style={{ backgroundColor: "#383838" }} />
          <button
            onClick={() => onCtaClick?.(c)}
            className={clsx(
              LINK_TEXT,
              "text-white px-[8px] whitespace-nowrap hover:bg-white/5 transition-colors h-full",
              i === displayCtas.length - 1 && "font-[550]",
            )}
          >
            {c}
          </button>
        </div>
      ))}

      <Caret />
    </div>
  );
}
