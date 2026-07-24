import type { ReactNode } from "react";
import { clsx } from "clsx";
import { CircleCheck, ChevronDown, Github } from "lucide-react";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── GitHubToolResultCard ─────────────────────────────────────────────────────
// Connector card shown after a GitHub tool call completes. The GitHub brand mark
// is lucide `Github` (rule 1 — no raster octocat); the blue check marks success.

export interface GitHubToolResultCardProps {
  /** Tool function name, e.g. "get_me". */
  toolName: string;
  /** Optional result summary rendered beneath the tool row. */
  children?: ReactNode;
  className?: string;
}

export function GitHubToolResultCard({ toolName, children, className }: GitHubToolResultCardProps) {
  return (
    <div className={clsx("w-full overflow-hidden rounded-c-lg ring-1 ring-inset ring-c-border", className)}>
      {/* Connector header */}
      <div className="flex items-center gap-[8px] px-[12px] py-[8px] border-b border-c-border">
        <span className="size-[24px] shrink-0 flex items-center justify-center text-c-icon">
          <Github size={18} strokeWidth={1.5} />
        </span>
        <p className={clsx(FONT, "text-[13px] leading-[22px] font-[550] tracking-[-0.032px] text-c-text")}>GitHub</p>
      </div>
      {/* Tool row — blue check = completed */}
      <div className="flex items-center gap-[8px] px-[8px] py-[8px]">
        <span className="size-[24px] shrink-0 flex items-center justify-center text-c-text-brand">
          <CircleCheck size={18} strokeWidth={1.5} />
        </span>
        <p className={clsx(FONT, "flex-1 min-w-0 truncate text-[13px] leading-[22px] font-[550] tracking-[-0.032px] text-c-text")}>{toolName}</p>
        <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-c-icon" />
      </div>
      {children && <div className="px-[12px] pb-[10px]">{children}</div>}
    </div>
  );
}
