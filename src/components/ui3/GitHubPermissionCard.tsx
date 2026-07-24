import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Copy, Github, LoaderCircle } from "lucide-react";
import { Button } from "./Button";

const FONT = "font-[family-name:var(--composa-font-family)]";
const MONO = "font-[family-name:var(--font-family-mono)]";

// ─── GitHubPermissionCard ─────────────────────────────────────────────────────
// Connector card shown when a GitHub tool call needs permission. Pending shows a
// spinner + an expandable JSON request panel + Run / Always run / Cancel. After
// the user decides it collapses to a single summary row.
//
// NOTE (flagged for the owner): the export colours JSON strings blue (#007be5)
// and numbers magenta (#ea10ac). The DS has a brand token for strings but no
// syntax-number token, so numbers use the token-backed component accent here.
// Open question in the PR: add a `--color-c-syntax-*` token, or accept this.

export interface GitHubPermissionParam {
  key: string;
  value: string | number;
  type: "string" | "number";
}

export interface GitHubPermissionCardProps {
  /** Tool function name awaiting permission, e.g. "list_issues". */
  toolName: string;
  params?: readonly GitHubPermissionParam[];
  onRun?: () => void;
  onAlwaysRun?: () => void;
  onCancel?: () => void;
  className?: string;
}

const DEFAULT_PARAMS: readonly GitHubPermissionParam[] = [
  { key: "owner", value: "samuelalake", type: "string" },
  { key: "perPage", value: 1, type: "number" },
  { key: "repo", value: "samuelalake.github.io", type: "string" },
  { key: "state", value: "OPEN", type: "string" },
];

function ConnectorHeader() {
  return (
    <div className="flex items-center gap-[8px] px-[12px] py-[8px] border-b border-c-border">
      <span className="size-[24px] shrink-0 flex items-center justify-center text-c-icon">
        <Github size={18} strokeWidth={1.5} />
      </span>
      <p className={clsx(FONT, "text-[13px] leading-[22px] font-[550] tracking-[-0.032px] text-c-text")}>GitHub</p>
    </div>
  );
}

export function GitHubPermissionCard({ toolName, params, onRun, onAlwaysRun, onCancel, className }: GitHubPermissionCardProps) {
  const [decided, setDecided] = useState<string | null>(null);
  const resolvedParams = params ?? DEFAULT_PARAMS;

  // Collapsed state after the user decides.
  if (decided) {
    return (
      <div className={clsx("w-full overflow-hidden rounded-c-lg ring-1 ring-inset ring-c-border", className)}>
        <ConnectorHeader />
        <div className="flex items-center gap-[8px] px-[8px] py-[8px]">
          <span className="size-[24px] shrink-0 flex items-center justify-center text-c-icon-tertiary">
            <LoaderCircle size={18} strokeWidth={1.5} />
          </span>
          <p className={clsx(FONT, "flex-1 min-w-0 truncate text-[13px] leading-[22px] font-[550] tracking-[-0.032px] text-c-text")}>{toolName}</p>
          <p className={clsx(FONT, "shrink-0 text-[11px] leading-[16px] font-[450] text-c-text-tertiary")}>{decided}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("w-full overflow-hidden rounded-c-lg ring-1 ring-inset ring-c-border", className)}>
      <ConnectorHeader />
      {/* Tool row — spinner = awaiting permission */}
      <div className="flex items-center gap-[8px] px-[8px] py-[8px]">
        <span className="size-[24px] shrink-0 flex items-center justify-center text-c-icon-secondary">
          <LoaderCircle size={18} strokeWidth={1.5} className="animate-spin" />
        </span>
        <p className={clsx(FONT, "flex-1 min-w-0 truncate text-[13px] leading-[22px] font-[550] tracking-[-0.032px] text-c-text")}>{toolName}</p>
        <ChevronDown size={16} strokeWidth={1.5} className="shrink-0 text-c-icon" />
      </div>

      {/* JSON request panel */}
      <div className="pl-[40px] pr-[8px] pb-[8px]">
        <div className="overflow-hidden rounded-c-md bg-c-bg-secondary ring-1 ring-inset ring-c-border">
          <div className="flex items-center px-[12px] py-[8px]">
            <p className={clsx(FONT, "flex-1 text-[11px] leading-[16px] font-[450] tracking-[0.055px] text-c-text-secondary")}>Request</p>
            <button
              type="button"
              aria-label="Copy request"
              className="size-[24px] shrink-0 flex items-center justify-center rounded-c-sm text-c-icon-secondary outline-none transition-colors hover:bg-c-bg-hover focus-visible:ring-1 focus-visible:ring-c-focus-ring"
            >
              <Copy size={14} strokeWidth={1.5} />
            </button>
          </div>
          <div className={clsx(MONO, "px-[8px] pb-[8px] text-[11px] leading-[18px] tracking-[0.055px]")}>
            <p className="whitespace-nowrap text-c-text">{"{"}</p>
            {resolvedParams.map(({ key, value, type }, i) => (
              <p key={key} className="whitespace-nowrap pl-[16px] text-c-text">
                {`"${key}": `}
                <span className={type === "number" ? "text-[color:var(--color-accent-component)]" : "text-c-text-brand"}>
                  {type === "string" ? `"${value}"` : value}
                </span>
                {i < resolvedParams.length - 1 ? "," : ""}
              </p>
            ))}
            <p className="whitespace-nowrap text-c-text">{"}"}</p>
          </div>
        </div>
      </div>

      {/* Permission actions */}
      <div className="flex items-center gap-[8px] pl-[40px] pr-[8px] pb-[10px]">
        <Button variant="Primary" size="default" label="Run" onClick={() => { setDecided("Ran"); onRun?.(); }} />
        <Button variant="Secondary" size="default" label="Always run" onClick={() => { setDecided("Always run"); onAlwaysRun?.(); }} />
        <Button variant="Secondary" size="default" label="Cancel" onClick={() => { setDecided("Cancelled"); onCancel?.(); }} />
      </div>
    </div>
  );
}
