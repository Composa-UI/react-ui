import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── WorkedLabel ──────────────────────────────────────────────────────────────
// The agent's work indicator shown above a response. Two states:
//   • thinking — animated bouncing dots + "Thinking…" (in-progress, not expandable)
//   • worked   — "Worked for {seconds}" with a chevron that expands the reasoning
//                step list (`steps`).
// Reconciles with AgentPanel's `work` message; PR2 wires this into the message
// renderer (thinking = status "running", worked = "complete").

export interface WorkedLabelProps {
  /** Duration label, e.g. "16s". Ignored while thinking. */
  seconds?: string;
  /** In-progress state — shows bouncing dots + "Thinking…", not expandable. */
  thinking?: boolean;
  /** Reasoning steps revealed when expanded. */
  steps?: readonly string[];
  /** Controlled expansion. Omit for internal (uncontrolled) state. */
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

const DEFAULT_STEPS = [
  "Reading the conversation context...",
  "Determining the best approach...",
  "Formulating a response...",
];

export function WorkedLabel({ seconds, thinking = false, steps, expanded: controlledExpanded, onToggle, className }: WorkedLabelProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const resolvedSteps = steps ?? DEFAULT_STEPS;

  const toggle = () => {
    if (thinking) return;
    if (controlledExpanded === undefined) setInternalExpanded(v => !v);
    onToggle?.();
  };

  return (
    <div className={clsx("flex flex-col gap-[4px]", className)}>
      <button
        type="button"
        onClick={toggle}
        disabled={thinking}
        aria-expanded={thinking ? undefined : expanded}
        className="group w-fit flex items-center gap-[4px] outline-none rounded-c-sm focus-visible:ring-1 focus-visible:ring-c-focus-ring"
      >
        {thinking ? (
          <span className="flex items-center gap-[6px]">
            <span className="flex items-center gap-[3px]" aria-hidden>
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="size-[4px] rounded-full bg-c-icon-tertiary animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
                />
              ))}
            </span>
            <span className={clsx(FONT, "text-[13px] leading-[22px] font-[450] tracking-[-0.032px] text-c-text-secondary")}>Thinking…</span>
          </span>
        ) : (
          <span className="flex items-center gap-[4px]">
            <span className={clsx(FONT, "text-[13px] leading-[22px] font-[450] tracking-[-0.032px] text-c-text-secondary")}>
              Worked{seconds ? <span className="text-c-text-tertiary"> for {seconds}</span> : null}
            </span>
            <ChevronDown
              size={14}
              className={clsx(
                "text-c-icon-tertiary transition-transform duration-200 group-hover:text-c-icon-secondary",
                expanded && "rotate-180",
              )}
            />
          </span>
        )}
      </button>

      {expanded && !thinking && (
        <div className="ml-[1px] pl-[2px] border-l-2 border-c-border flex flex-col gap-[2px]">
          {resolvedSteps.map((step, i) => (
            <p key={i} className={clsx(FONT, "pl-[8px] text-[11px] leading-[18px] font-[450] text-c-text-tertiary")}>{step}</p>
          ))}
        </div>
      )}
    </div>
  );
}
