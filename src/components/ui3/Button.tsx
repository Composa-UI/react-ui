import { type ReactNode } from "react";
import { clsx } from "clsx";

export type ButtonVariant =
  | "Primary" | "Secondary" | "Destructive" | "Inverse"
  | "Success" | "FigJam" | "SecondaryDestruct"
  | "Link" | "LinkDanger" | "Ghost";

export type ButtonSize = "small" | "default" | "large" | "wide";
export type ButtonIconLead = "none" | "left" | "center";

interface ButtonProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLead?: ButtonIconLead;
  icon?: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

type VariantConfig = {
  base: string;
  hover: string;
  disabled: string;
  focused: string;
};

const VARIANTS: Record<ButtonVariant, VariantConfig> = {
  Primary: {
    base:     "bg-c-bg-brand text-c-text-on-brand",
    hover:    "hover:bg-c-bg-brand-pressed active:bg-c-bg-brand-pressed",
    disabled: "bg-c-bg-disabled text-c-text-on-brand",
    focused:  "focus-visible:bg-c-bg-brand focus-visible:shadow-[inset_0_0_0_2px_white,0_0_0_1px_var(--composa-control-focus-ring)]",
  },
  FigJam: {
    base:     "bg-c-component text-c-text-on-brand",
    hover:    "hover:brightness-90 active:brightness-90",
    disabled: "bg-c-bg-disabled text-c-text-on-brand",
    focused:  "focus-visible:shadow-[inset_0_0_0_2px_white,0_0_0_1px_var(--composa-control-focus-ring)]",
  },
  Destructive: {
    base:     "bg-c-bg-danger text-c-text-on-brand",
    hover:    "hover:brightness-90 active:brightness-90",
    disabled: "bg-c-bg-disabled text-c-text-on-brand",
    focused:  "focus-visible:bg-c-bg-danger focus-visible:shadow-[inset_0_0_0_2px_white,0_0_0_1px_var(--composa-control-focus-ring)]",
  },
  Inverse: {
    base:     "bg-c-bg-inverse text-c-text-on-inverse",
    hover:    "hover:brightness-110 active:brightness-110",
    disabled: "bg-c-bg-disabled text-c-text-on-brand",
    focused:  "focus-visible:bg-c-bg-inverse focus-visible:shadow-[inset_0_0_0_2px_white,0_0_0_1px_var(--composa-control-focus-ring)]",
  },
  Success: {
    base:     "bg-c-bg-success text-c-text-on-brand",
    hover:    "hover:brightness-90 active:brightness-90",
    disabled: "bg-c-bg-disabled text-c-text-on-brand",
    focused:  "focus-visible:bg-c-bg-success focus-visible:shadow-[inset_0_0_0_2px_white,0_0_0_1px_var(--composa-control-focus-ring)]",
  },
  Secondary: {
    base:     "bg-transparent text-c-text ring-1 ring-inset ring-c-border-translucent",
    hover:    "hover:bg-c-bg-hover active:bg-c-bg-pressed",
    disabled: "bg-transparent text-c-text-disabled ring-1 ring-inset ring-c-border-disabled",
    focused:  "focus-visible:ring-c-focus-ring",
  },
  SecondaryDestruct: {
    base:     "bg-transparent text-c-text-danger ring-1 ring-inset ring-c-border-danger",
    hover:    "hover:bg-c-bg-hover active:bg-c-bg-pressed",
    disabled: "bg-transparent text-c-text-disabled ring-1 ring-inset ring-c-border-disabled",
    focused:  "focus-visible:ring-c-focus-ring",
  },
  Link: {
    base:     "bg-transparent text-c-text-brand",
    hover:    "hover:bg-c-bg-hover active:bg-c-bg-pressed",
    disabled: "bg-transparent text-c-text-disabled",
    focused:  "focus-visible:ring-1 focus-visible:ring-c-focus-ring",
  },
  LinkDanger: {
    base:     "bg-transparent text-c-text-danger",
    hover:    "hover:bg-c-bg-hover active:bg-c-bg-pressed",
    disabled: "bg-transparent text-c-text-disabled",
    focused:  "focus-visible:ring-1 focus-visible:ring-c-focus-ring",
  },
  Ghost: {
    base:     "bg-transparent text-c-text",
    hover:    "hover:bg-c-bg-hover active:bg-c-bg-pressed",
    disabled: "bg-transparent text-c-text-disabled",
    focused:  "focus-visible:ring-1 focus-visible:ring-c-focus-ring",
  },
};

export function Button({
  label = "Button",
  variant = "Primary",
  size = "default",
  iconLead = "none",
  icon,
  disabled = false,
  onClick,
  className,
}: ButtonProps) {
  const cfg = VARIANTS[variant];
  const hasIcon = iconLead !== "none" && !!icon;
  const iconOnly = iconLead === "center" && !!icon && !label;

  const heightClass =
    size === "small"  ? "h-[20px]" :
    size === "large"  ? "h-[32px]" :
    /* default/wide */  "h-[24px]";

  const paddingClass = iconOnly
    ? "px-[4px]"
    : hasIcon
      ? size === "large" ? "pl-[6px] pr-[12px]" : "pl-[4px] pr-[8px]"
      : size === "large" ? "px-[12px]" :
        size === "small" ? "px-[6px]" : "px-[8px]";

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={clsx(
        "relative inline-flex items-center justify-center gap-[4px] rounded-c-md py-[4px]",
        "font-[family-name:var(--composa-font-family)] font-[450]",
        "text-[length:var(--composa-body-medium-size)] leading-[var(--composa-body-medium-line)]",
        "tracking-[var(--composa-body-medium-letter-spacing)] whitespace-nowrap",
        "transition-colors duration-100 outline-none select-none",
        size === "wide" && "w-full",
        heightClass,
        paddingClass,
        disabled ? cfg.disabled : [cfg.base, cfg.hover],
        !disabled && cfg.focused,
        disabled && "cursor-not-allowed",
        className,
      )}
    >
      {hasIcon && !iconOnly && (
        <span className="shrink-0 flex items-center justify-center size-[16px]">{icon}</span>
      )}
      {iconOnly
        ? <span className="shrink-0 flex items-center justify-center size-[16px]">{icon}</span>
        : <span>{label}</span>
      }
    </button>
  );
}
