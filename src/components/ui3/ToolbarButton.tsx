import { type ReactNode } from "react";
import { clsx } from "clsx";

interface ToolbarButtonProps {
  icon: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ToolbarButton({ icon, active, onClick, className }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center p-[4px] rounded-c-md shrink-0",
        "transition-colors duration-100 outline-none",
        "text-c-icon",
        active
          ? "bg-c-bg-secondary"
          : "hover:bg-c-bg-hover-transparent active:bg-c-bg-secondary",
        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-c-focus-ring",
        className,
      )}
    >
      {icon}
    </button>
  );
}
