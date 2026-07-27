import { clsx } from "clsx";
import type { ReactNode } from "react";

// ─── Tokens ───────────────────────────────────────────────────────────────────
const BG = "#1e1e1e";
// matches Figma exactly: drop-shadow(0 2px 3.5px ...) drop-shadow(0 5px 8.5px ...)
const SHADOW = "drop-shadow-[0px_2px_3.5px_rgba(0,0,0,0.15),0px_5px_8.5px_rgba(0,0,0,0.2)]";

const TEXT_MSG  = "text-[11px] font-[450] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)]";
const TEXT_CTA  = "text-[11px] font-[550] leading-[16px] tracking-[0.055px] font-[family-name:var(--composa-font-family)]";

// ─── Component icon (diamond/4-pointed star shape used in Figma UI) ───────────
function ComponentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-white">
      <path
        d="M6.29 0.71a1 1 0 011.42 0l5.58 5.58a1 1 0 010 1.42l-5.58 5.58a1 1 0 01-1.42 0L0.71 7.71a1 1 0 010-1.42L6.29.71z"
        stroke="white"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

// ─── Notification ─────────────────────────────────────────────────────────────
// Matches the Figma spec exactly:
//   [icon + message text  |  stacked CTAs]
// Actions column is fixed 72px, content is fixed 212px.
// With 2 actions the column splits in half with a horizontal separator.

interface NotificationAction {
  label: string;
  onClick?: () => void;
}

interface NotificationProps {
  message: string;
  /** One or two actions. Two renders stacked vertically. */
  actions?: [NotificationAction] | [NotificationAction, NotificationAction];
  /**
   * Leading glyph, rendered in the fixed 24px icon slot (white, to read on the
   * dark pill). Defaults to the generic component diamond. Pass a contextual
   * icon so the toast's iconography matches how the same subject is shown
   * elsewhere (e.g. a video toast reuses the timeline's video glyph).
   */
  icon?: ReactNode;
  className?: string;
}

export function Notification({ message, actions = [{ label: "Action" }], icon, className }: NotificationProps) {
  const [primary, secondary] = actions;

  return (
    <div
      className={clsx(
        "flex items-stretch rounded-[5px] pl-[8px]",
        SHADOW,
        className,
      )}
      style={{ backgroundColor: BG, minHeight: 56 }}
    >
      {/* Content: icon + message */}
      <div className="flex gap-[4px] items-center pr-[4px] w-[212px] py-[8px]">
        <span className="shrink-0 flex items-center justify-center size-[24px] text-white">
          {icon ?? <ComponentIcon />}
        </span>
        <p className={clsx(TEXT_MSG, "text-white overflow-hidden")}>
          {message}
        </p>
      </div>

      {/* Vertical separator */}
      <div className="w-px self-stretch" style={{ backgroundColor: "#383838" }} />

      {/* Actions column — hugs content */}
      <div className="flex flex-col shrink-0">
        {/* Primary CTA */}
        <button
          onClick={primary.onClick}
          className={clsx(
            TEXT_CTA,
            "flex-1 flex items-center justify-end px-[8px] text-white whitespace-nowrap hover:opacity-75 transition-opacity",
          )}
        >
          {primary.label}
        </button>

        {/* Secondary CTA (optional) */}
        {secondary && (
          <>
            <div className="h-px w-full" style={{ backgroundColor: "#383838" }} />
            <button
              onClick={secondary.onClick}
              className={clsx(
                TEXT_CTA,
                "flex-1 flex items-center justify-end px-[8px] text-white whitespace-nowrap hover:opacity-75 transition-opacity",
              )}
            >
              {secondary.label}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── VisualBell ────────────────────────────────────────────────────────────────

interface VisualBellProps {
  count?: number;
  dot?: boolean;
  className?: string;
}

export function VisualBell({ count, dot = false, className }: VisualBellProps) {
  if (dot) {
    return <span className={clsx("inline-block rounded-full size-[6px] bg-c-bg-brand", className)} />;
  }
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full h-[14px] min-w-[14px] px-[3px]",
        "text-white text-[9px] font-[550] leading-[14px] font-[family-name:var(--composa-font-family)]",
        className,
      )}
      style={{ backgroundColor: BG }}
    >
      {count !== undefined ? (count > 99 ? "99+" : count) : ""}
    </span>
  );
}
