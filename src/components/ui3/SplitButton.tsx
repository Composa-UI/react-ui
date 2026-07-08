import { type ReactNode } from "react";
import { clsx } from "clsx";

interface SplitButtonProps {
  icon: ReactNode;
  accentColor?: string;
  size?: "default" | "large";
  onIconClick?: () => void;
  onChevronClick?: () => void;
  className?: string;
}

export function SplitButton({ icon, accentColor, size = "default", onIconClick, onChevronClick, className }: SplitButtonProps) {
  const large = size === "large";
  return (
    <div className={clsx("bg-c-bg-secondary flex gap-px items-center rounded-c-md shrink-0 overflow-hidden", large && "h-[32px]", className)}>
      <button
        onClick={onIconClick}
        style={accentColor ? { backgroundColor: accentColor } : undefined}
        className={clsx(
          "flex items-center justify-center rounded-l-c-md transition-colors duration-100 outline-none text-c-icon",
          large ? "px-[8px] h-full" : "p-[4px]",
          !accentColor && "bg-c-bg hover:bg-c-bg-hover active:bg-c-bg-secondary",
        )}
      >
        {icon}
      </button>
      <button
        onClick={onChevronClick}
        className={clsx(
          "flex items-center justify-center self-stretch rounded-r-c-md transition-colors duration-100 outline-none text-c-icon bg-c-bg hover:bg-c-bg-hover active:bg-c-bg-secondary",
          large ? "w-[20px]" : "py-[4px] w-[16px]",
        )}
      >
        <svg width="6" height="4" viewBox="0 0 6 4" fill="none">
          <path d="M0.5 0.5L3 3L5.5 0.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
