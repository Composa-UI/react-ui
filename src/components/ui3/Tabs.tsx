import { useState, type ReactNode } from "react";
import { clsx } from "clsx";

// UI3 Tabs — inspector-style tabs used in the property panel header.
// Active tab: bg-c-bg-secondary + bold text.
// Inactive: bg-c-bg + muted text, hover darkens.
// These use fixed light-mode-derived colors matching the Figma spec.

interface Tab {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, defaultValue, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.value ?? "");
  const selected = value !== undefined ? value : internal;

  return (
    <div role="tablist" className={clsx("flex items-start gap-[4px]", className)}>
      {tabs.map(tab => {
        const isActive = tab.value === selected;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (!value) setInternal(tab.value);
              onChange?.(tab.value);
            }}
            className={clsx(
              "relative flex gap-[4px] h-[24px] items-center px-[8px] rounded-c-md",
              "text-[11px] leading-[16px] tracking-[0.055px] whitespace-nowrap",
              "font-[family-name:var(--composa-font-family)]",
              "transition-colors duration-100 outline-none",
              isActive
                ? "bg-c-bg-secondary text-c-text font-[550]"
                : "bg-c-bg text-c-text-secondary font-[450] hover:text-c-text hover:bg-c-bg-hover",
            )}
          >
            {tab.icon && (
              <span className="flex items-center justify-center size-[16px]">
                {tab.icon}
              </span>
            )}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// SingleTab — used when there's only one tab (just shows a bold label)
interface SingleTabProps {
  label: string;
  className?: string;
}

export function SingleTab({ label, className }: SingleTabProps) {
  return (
    <div className={clsx(
      "flex gap-[4px] h-[24px] items-center px-[8px] rounded-c-md bg-c-bg",
      "text-[11px] font-[550] leading-[16px] tracking-[0.055px]",
      "font-[family-name:var(--composa-font-family)] text-c-text",
      className,
    )}>
      {label}
    </div>
  );
}
