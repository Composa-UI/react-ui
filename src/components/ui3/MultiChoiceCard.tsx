import { useState } from "react";
import { clsx } from "clsx";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── MultiChoiceCard ──────────────────────────────────────────────────────────
// Interactive A/B/C/D card embedded in an agent response. One option active at a
// time; selecting highlights it. Controlled via `selected`/`onSelect`, else
// internal state.

export interface MultiChoice {
  letter: string;
  label: string;
}

export interface MultiChoiceCardProps {
  question: string;
  choices: readonly MultiChoice[];
  selected?: string | null;
  onSelect?: (letter: string) => void;
  className?: string;
}

export function MultiChoiceCard({ question, choices, selected: controlledSelected, onSelect, className }: MultiChoiceCardProps) {
  const [internal, setInternal] = useState<string | null>(null);
  const selected = controlledSelected !== undefined ? controlledSelected : internal;

  const pick = (letter: string) => {
    if (controlledSelected === undefined) setInternal(letter);
    onSelect?.(letter);
  };

  return (
    <div className={clsx("w-full overflow-hidden rounded-c-lg ring-1 ring-inset ring-c-border", className)}>
      <div className="px-[12px] py-[8px]">
        <p className={clsx(FONT, "text-[13px] leading-[22px] font-[550] tracking-[-0.032px] text-c-text")}>{question}</p>
      </div>
      <div className="flex flex-col gap-[2px] px-[8px] pb-[8px]">
        {choices.map(({ letter, label }) => {
          const active = selected === letter;
          return (
            <button
              key={letter}
              type="button"
              aria-pressed={active}
              onClick={() => pick(letter)}
              className={clsx(
                "w-full flex items-center gap-[8px] p-[4px] rounded-c-md text-left outline-none transition-colors",
                "focus-visible:ring-1 focus-visible:ring-c-focus-ring",
                active ? "bg-c-bg-selected" : "hover:bg-c-bg-hover",
              )}
            >
              <span className={clsx(
                "size-[22px] shrink-0 flex items-center justify-center rounded-c-md",
                active ? "bg-c-bg-brand" : "ring-1 ring-inset ring-c-border",
              )}>
                <span className={clsx(FONT, "text-[11px] leading-[16px] font-[550] tracking-[0.055px]", active ? "text-c-text-on-brand" : "text-c-text")}>
                  {letter}
                </span>
              </span>
              <span className={clsx(FONT, "text-[13px] leading-[20px] font-[450] tracking-[-0.032px]", active ? "text-c-text" : "text-c-text-secondary")}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
