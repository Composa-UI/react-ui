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
  panelId?: string;
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
        const activate = () => {
          if (value === undefined) setInternal(tab.value);
          onChange?.(tab.value);
        };
        return (
          <button
            key={tab.value}
            role="tab"
            id={tab.panelId ? `${tab.panelId}-tab` : undefined}
            aria-controls={tab.panelId}
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={activate}
            onKeyDown={event => {
              const currentIndex = tabs.indexOf(tab);
              const nextIndex = event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length
                : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length
                : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (nextIndex < 0) return;
              event.preventDefault();
              const next = tabs[nextIndex];
              if (value === undefined) setInternal(next.value);
              onChange?.(next.value);
              const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
              buttons?.[nextIndex]?.focus();
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
