import { useState } from "react";
import { clsx } from "clsx";

// RadioButton has two visual variants:
// - "input": classic circular radio control
// - "button": a pill-shaped toggle button (like a tab)

interface RadioButtonProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  variant?: "input" | "button";
  state?: "default" | "active" | "focused" | "disabled";
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export function RadioButton({
  checked,
  defaultChecked = false,
  label,
  variant = "input",
  state = "default",
  disabled = false,
  onChange,
  className,
}: RadioButtonProps) {
  const [internal, setInternal] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked! : internal;
  const focused = state === "focused";

  const handleClick = () => {
    if (disabled) return;
    if (!isControlled) setInternal(true);
    onChange?.(true);
  };

  if (variant === "button") {
    // Pill-shaped toggle button
    const isActive = state === "active" || isOn;
    return (
      <button
        role="radio"
        aria-checked={isOn}
        aria-disabled={disabled}
        onClick={handleClick}
        className={clsx(
          "relative inline-flex items-center justify-center h-[24px] px-[8px] rounded-c-md",
          "ring-1 ring-inset transition-colors duration-100 outline-none",
          "text-[11px] font-[450] leading-[16px] tracking-[0.055px]",
          "font-[family-name:var(--composa-font-family)]",
          isActive && !disabled  ? "bg-c-bg-selected ring-[#dbd8ff] text-c-text" :
          focused && !disabled   ? "bg-c-bg ring-c-border-selected text-c-text" :
          disabled               ? "ring-c-border-disabled text-c-text-tertiary cursor-not-allowed" :
          /* default */            "ring-c-border-translucent text-c-text hover:bg-c-bg-hover",
          className,
        )}
      >
        {label ?? "Label"}
      </button>
    );
  }

  // Input variant — circular radio
  const ringColor =
    disabled  ? "border-c-border-disabled" :
    focused   ? "border-c-border-selected-strong" :
    "border-c-icon";

  return (
    <button
      role="radio"
      aria-checked={isOn}
      aria-disabled={disabled}
      onClick={handleClick}
      className={clsx(
        "inline-flex items-center gap-[8px] py-[4px] outline-none cursor-pointer",
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      {/* Circle control */}
      <span className={clsx(
        "relative shrink-0 flex items-center justify-center size-[16px] rounded-full",
        "border transition-colors duration-100",
        ringColor,
        disabled ? "bg-transparent" : "bg-c-bg",
      )}>
        {isOn && !disabled && (
          <span className={clsx(
            "rounded-full size-[8px] transition-colors duration-100",
            focused ? "bg-c-border-selected-strong" : "bg-c-icon",
          )} />
        )}
        {isOn && disabled && (
          <span className="rounded-full size-[8px] bg-c-border-disabled" />
        )}
      </span>

      {/* Label */}
      {label && (
        <span className={clsx(
          "text-[11px] font-[450] leading-[16px] tracking-[0.055px]",
          "font-[family-name:var(--composa-font-family)] whitespace-nowrap",
          disabled ? "text-c-text-tertiary" : "text-c-text",
        )}>
          {label}
        </span>
      )}
    </button>
  );
}

// RadioGroup — manages exclusive selection across RadioButtons
interface RadioGroupProps {
  options: Array<{ value: string; label: string }>;
  value?: string;
  defaultValue?: string;
  variant?: "input" | "button";
  disabled?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  options,
  value,
  defaultValue,
  variant = "input",
  disabled = false,
  onChange,
  className,
}: RadioGroupProps) {
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = value !== undefined ? value : internal;

  return (
    <div role="radiogroup" className={clsx("flex flex-col gap-[4px]", variant === "button" && "flex-row", className)}>
      {options.map(opt => (
        <RadioButton
          key={opt.value}
          label={opt.label}
          variant={variant}
          checked={selected === opt.value}
          disabled={disabled}
          onChange={() => {
            if (!value) setInternal(opt.value);
            onChange?.(opt.value);
          }}
        />
      ))}
    </div>
  );
}
