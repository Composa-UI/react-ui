import type { ReactNode } from "react";
import { clsx } from "clsx";
import { CircleUserRound, Github } from "lucide-react";
import { iconForSemantic, type ComposaIconSemantic } from "./IconSemantics";
import type { LayerIconType } from "./LayerTypeIcon";

const FONT = "font-[family-name:var(--composa-font-family)]";

// ─── ElementChip ──────────────────────────────────────────────────────────────
// Blue selection chip shown above a user bubble for a canvas object the message
// is about. The icon is pulled from the SAME layer-list mapping the LayerList
// uses (`iconForSemantic`) so a frame reads as a frame, text as text, etc.
// (Composa#218 — chip icon === layer-list icon for every type.)

function semanticForLayerType(type: LayerIconType): ComposaIconSemantic {
  return type === "frame" ? "frame"
    : type === "group" ? "group-compatibility"
    : type === "text" ? "text"
    : type === "component" || type === "instance" ? "component"
    : type === "image" ? "image"
    : type === "line" ? "line"
    : "shape";
}

export function ElementChip({ label, kind = "frame" }: { label: string; kind?: LayerIconType }) {
  const Icon = iconForSemantic(semanticForLayerType(kind));
  return (
    <div className="h-[20px] max-w-[157px] shrink-0 flex items-center gap-[2px] rounded-c-md bg-c-bg-selected pl-[2px] pr-[5px] overflow-hidden">
      <span className="size-[16px] shrink-0 flex items-center justify-center text-c-text-brand">
        <Icon size={13} strokeWidth={1.5} data-icon-semantic={semanticForLayerType(kind)} />
      </span>
      <p className={clsx(FONT, "truncate text-[12px] leading-[16px] font-[450] text-c-text-brand")}>{label}</p>
    </div>
  );
}

// ─── GitHubChip ─────────────────────────────────────────────────────────────
// White/bordered connector chip shown above a user bubble for @GitHub context.

export function GitHubChip() {
  return (
    <div className="h-[24px] shrink-0 flex items-center gap-[4px] rounded-c-md bg-c-bg px-[5px] py-[2px] ring-1 ring-inset ring-c-border">
      <Github size={14} strokeWidth={1.5} className="shrink-0 text-c-icon" />
      <p className={clsx(FONT, "whitespace-nowrap text-[11px] leading-[16px] font-[450] tracking-[0.055px] text-c-text")}>GitHub</p>
    </div>
  );
}

// ─── UserBubble ─────────────────────────────────────────────────────────────
// Right-aligned user message: an optional context chip floats above the bubble;
// a 24px avatar sits to the right. Chip type "element" = blue canvas-selection
// chip, "github" = the @GitHub connector chip.

export type UserBubbleChip =
  | { type: "element"; label: string; kind?: LayerIconType }
  | { type: "github" };

export interface UserBubbleProps {
  text: string;
  chip?: UserBubbleChip;
  /** Custom avatar node. Defaults to a neutral user glyph in a DS surface circle. */
  avatar?: ReactNode;
  className?: string;
}

export function UserBubble({ text, chip, avatar, className }: UserBubbleProps) {
  return (
    <div className={clsx("flex items-end justify-end gap-[8px]", className)}>
      <div className="flex flex-col items-end gap-[8px]">
        {chip?.type === "element" && <ElementChip label={chip.label} kind={chip.kind} />}
        {chip?.type === "github" && <GitHubChip />}
        <div className={clsx(FONT, "max-w-[192px] rounded-[16px] bg-c-bg-secondary px-[12px] py-[9px] text-[13px] leading-[20px] font-[450] tracking-[-0.032px] text-c-text whitespace-pre-wrap break-words")}>
          {text}
        </div>
      </div>
      <span className="size-[24px] shrink-0 overflow-hidden rounded-full bg-c-bg-secondary flex items-center justify-center text-c-icon">
        {avatar ?? <CircleUserRound size={15} strokeWidth={1.5} />}
      </span>
    </div>
  );
}
