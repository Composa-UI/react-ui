import { clsx } from "clsx";
import { type ReactNode } from "react";

// Multiplayer identity colors — these are fixed, not mode-adaptive
export const AVATAR_COLORS = {
  purple: { bg: "#9747ff", text: "white" },
  blue:   { bg: "#007be5", text: "white" },
  pink:   { bg: "#ff24bd", text: "white" },
  red:    { bg: "#f24822", text: "white" },
  yellow: { bg: "#ffcd29", text: "rgba(0,0,0,0.9)" },
  green:  { bg: "#14ae5c", text: "white" },
  grey:   { bg: "#b3b3b3", text: "white" },
  teal:   { bg: "#18a0fb", text: "white" },
} as const;

export type AvatarColor = keyof typeof AVATAR_COLORS;
export type AvatarSize = "small" | "default" | "large";
export type AvatarShape = "circle" | "square";

const SIZES: Record<AvatarSize, { px: number; text: string; font: string }> = {
  small:   { px: 16, text: "text-[9px]",  font: "leading-[14px]" },
  default: { px: 24, text: "text-[13px]", font: "leading-[22px]" },
  large:   { px: 32, text: "text-[15px]", font: "leading-[24px]" },
};

interface AvatarProps {
  /** Initial letter or number to display */
  initial?: string;
  /** Photo src — renders an image instead of initials */
  src?: string;
  color?: AvatarColor;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Overflow count — renders a "+N" badge */
  overflow?: number;
  overflowRead?: boolean;
  /** Org/workspace icon slot */
  icon?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Avatar({
  initial = "A",
  src,
  color = "purple",
  size = "default",
  shape = "circle",
  overflow,
  overflowRead = false,
  icon,
  disabled = false,
  className,
}: AvatarProps) {
  const { px, text, font } = SIZES[size];
  const radius = shape === "circle" ? "rounded-full" : "rounded-[5px]";
  const colorCfg = AVATAR_COLORS[color];

  const base = clsx(
    "relative shrink-0 overflow-hidden",
    radius,
    disabled && "opacity-50",
  );

  // Overflow badge variant
  if (overflow !== undefined) {
    const bg = overflowRead ? "#b3b3b3" : "#007be5";
    return (
      <div
        className={clsx(base, className)}
        style={{ width: px, height: px, backgroundColor: bg }}
      >
        <span
          className={clsx(
            "absolute inset-0 flex items-center justify-center",
            "font-[family-name:var(--composa-font-family)] font-[450] text-white",
            text, font,
          )}
        >
          {overflow > 99 ? "99+" : overflow}
        </span>
      </div>
    );
  }

  // Photo variant
  if (src) {
    return (
      <div className={clsx(base, className)} style={{ width: px, height: px }}>
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  }

  // Icon/org variant
  if (icon) {
    return (
      <div
        className={clsx(base, className)}
        style={{ width: px, height: px, backgroundColor: colorCfg.bg }}
      >
        <span className="absolute inset-0 flex items-center justify-center">
          {icon}
        </span>
      </div>
    );
  }

  // Default — letter initial
  return (
    <div
      className={clsx(base, className)}
      style={{ width: px, height: px, backgroundColor: colorCfg.bg }}
    >
      <span
        className={clsx(
          "absolute inset-0 flex items-center justify-center",
          "font-[family-name:var(--composa-font-family)] font-[450] tracking-[-0.0325px]",
          text, font,
        )}
        style={{ color: colorCfg.text }}
      >
        {initial}
      </span>
    </div>
  );
}

// ─── AvatarStatus ─────────────────────────────────────────────────────────────
// Decorative ring/indicator rendered on top of or near an Avatar.

export type AvatarStatusType = "default" | "dash" | "design" | "spotlight" | "audio";

interface AvatarStatusProps {
  status?: AvatarStatusType;
  className?: string;
}

export function AvatarStatus({ status = "default", className }: AvatarStatusProps) {
  if (status === "default") return null;

  // absolute inset-0: fills the AvatarWithStatus wrapper so all child
  // positions are relative to the avatar bounds
  return (
    <span className={clsx("absolute inset-0 pointer-events-none", className)}>
      {status === "dash" && (
        // Yellow horizontal bar — sits above the avatar top edge
        <span
          className="absolute rounded-full"
          style={{ backgroundColor: "#ffcd29", height: 2, width: 14, top: -3, left: "50%", transform: "translateX(-50%)" }}
        />
      )}
      {status === "design" && (
        // Solid yellow ring — extends ~2.5px outside avatar circle
        <span
          className="absolute pointer-events-none"
          style={{
            inset: -3,
            border: "2.5px solid #ffcd29",
            borderRadius: "9999px",
          }}
        />
      )}
      {status === "spotlight" && (
        // Dashed yellow ring
        <span
          className="absolute pointer-events-none"
          style={{
            inset: -3,
            border: "2.5px dashed #ffcd29",
            borderRadius: "9999px",
          }}
        />
      )}
      {status === "audio" && (
        // Green sound bars — bottom-right corner
        <span
          className="absolute flex items-end gap-[1px]"
          style={{ bottom: -2, right: -2 }}
        >
          <span className="rounded-full bg-[#14ae5c]" style={{ width: 2, height: 4, outline: "1px solid white" }} />
          <span className="rounded-full bg-[#14ae5c]" style={{ width: 2, height: 6, outline: "1px solid white" }} />
          <span className="rounded-full bg-[#14ae5c]" style={{ width: 2, height: 4, outline: "1px solid white" }} />
        </span>
      )}
    </span>
  );
}

// ─── AvatarWithStatus ─────────────────────────────────────────────────────────
// Convenience wrapper combining Avatar + AvatarStatus.

interface AvatarWithStatusProps extends AvatarProps {
  status?: AvatarStatusType;
}

export function AvatarWithStatus({ status = "default", ...avatarProps }: AvatarWithStatusProps) {
  const { px } = SIZES[avatarProps.size ?? "default"];
  return (
    <span className="relative inline-block" style={{ width: px, height: px }}>
      <Avatar {...avatarProps} />
      {/* AvatarStatus uses absolute inset-0 so children position relative to this wrapper */}
      <AvatarStatus status={status} />
    </span>
  );
}
