import { useState } from "react";
import { clsx } from "clsx";

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  mixed?: boolean;
  disabled?: boolean;
  size?: "medium" | "compact";
  state?: "rest" | "focused";
  label: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked,
  defaultChecked = false,
  mixed = false,
  disabled = false,
  size = "medium",
  state = "rest",
  label,
  onCheckedChange,
}: SwitchProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked! : internal;

  const handleClick = () => {
    if (disabled) return;
    const next = mixed ? true : !isOn;
    if (!isControlled) setInternal(next);
    onCheckedChange?.(next);
  };

  const compact = size === "compact";
  const trackW = compact ? "w-[24px]" : "w-[28px]";
  const trackH = compact ? "h-[14px]" : "h-[16px]";
  const thumbSize = compact ? "w-[10px] h-[10px]" : "w-[12px] h-[12px]";
  const thumbTranslate = (isOn || mixed)
    ? compact ? "translate-x-[10px]" : "translate-x-[12px]"
    : "translate-x-0";

  return (
    <button
      role="switch"
      aria-checked={mixed ? "mixed" : isOn}
      aria-label={label}
      aria-disabled={disabled}
      onClick={handleClick}
      data-scope="switch"
      data-part="track"
      data-type={mixed ? "mixed" : isOn ? "on" : "off"}
      className={clsx(
        "relative inline-flex shrink-0 items-center rounded-c-full p-[2px]",
        "transition-colors duration-150 outline-none",
        trackW, trackH,
        (isOn || mixed) ? "bg-c-bg-brand" : "bg-c-border",
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:brightness-95",
        (state === "focused") && "outline-2 outline-offset-2 outline-c-focus-ring",
        !disabled && "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-c-focus-ring",
      )}
    >
      <span
        data-scope="switch"
        data-part="thumb"
        className={clsx(
          "block rounded-c-full bg-c-bg shadow-c-100 transition-transform duration-150",
          thumbSize,
          thumbTranslate,
          mixed && "!w-[10px] !h-[2px] !rounded-[1px]",
        )}
      />
    </button>
  );
}
