import { clsx } from "clsx";
import { X } from "lucide-react";

export type ChipVariableState =
  | "Default"
  | "Selected"
  | "OnSelected"
  | "Hover"
  | "SoftDeleted"
  | "DisabledSecondary"
  | "DisabledTertiary"
  | "ValueNotRendered";

interface ChipVariableProps {
  value: string;
  state?: ChipVariableState;
  onDetach?: () => void;
  className?: string;
}

// ChipVariable always renders with fixed light colors — it lives inside
// inspector inputs which are always rendered on a light surface in UI3.
export function ChipVariable({ value, state = "Default", onDetach, className }: ChipVariableProps) {
  const isDisabled = state === "DisabledSecondary" || state === "DisabledTertiary";
  const isMuted = state === "SoftDeleted" || state === "ValueNotRendered" || isDisabled;

  const bg =
    state === "Selected"   ? "bg-[#e5f4ff]" :
    state === "OnSelected" ? "bg-[#bde3ff]" :
    state === "Hover"      ? "bg-[#e6e6e6]" :
    isMuted                ? "bg-[#f5f5f5]" :
    /* Default */            "bg-white";

  const border =
    state === "Selected"   ? "border-[#0d99ff]" :
    state === "OnSelected" ? "border-[#bde3ff]" :
    /* rest */               "border-[#e6e6e6]";

  const textColor =
    isDisabled ? "text-[rgba(0,0,0,0.3)]" : "text-[rgba(0,0,0,0.9)]";

  return (
    <div className={clsx(
      "inline-flex items-center gap-[4px] px-[4px] rounded-[5px] relative shrink-0",
      "border border-solid",
      bg, border,
      className,
    )}>
      <span className={clsx(
        "text-[11px] font-[450] leading-[16px] tracking-[0.055px]",
        "font-[family-name:var(--composa-font-family)]",
        "overflow-hidden text-ellipsis whitespace-nowrap max-w-[80px]",
        textColor,
      )}>
        {value}
      </span>
      {onDetach && (
        <button
          onClick={onDetach}
          className="flex items-center justify-center size-[16px] shrink-0 text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.9)] transition-colors"
        >
          <X size={10} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
