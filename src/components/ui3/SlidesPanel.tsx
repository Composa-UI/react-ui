import { useState } from "react";
import { clsx } from "clsx";
import { ChevronRight, ChevronDown, Plus, PanelLeft, LayoutGrid, Sparkles } from "lucide-react";
import { ScrollArea } from "./Panel";

// ─── Slides left panel ──────────────────────────────────────────────────────────
// Componentized from the study Figma export (`imports/SlidesTemplate`). Theme-aware:
// renders LIGHT by default and DARK under `data-composa-mode="dark"` — colours flow
// through the mode-flipping `c-*` tokens (styles/theme.css). Data-driven: one
// `SlideData` per row drives every state
// (default / group header / sub-slide / stacked / motion / comment / selected).

const INTER = { fontFamily: "Inter, sans-serif" } as const;

export interface SlideData {
  n: number | string;          // number label
  thumb?: string;              // thumbnail image src
  tint?: string;               // solid thumb colour when no image (demo)
  selected?: boolean;
  sub?: boolean;               // indented sub-slide (nested under a group)
  group?: boolean;             // expandable group header — shows a chevron
  expanded?: boolean;          // chevron rotation (open group)
  stacked?: boolean;           // stacked-group visual (offset cards behind)
  motion?: boolean;            // animation applied — badge on thumbnail
  comment?: number;            // comment-pin count (undefined = none)
  onClick?: () => void;
}

// ── Slide thumbnail (+ motion badge) ──────────────────────────────────────────
function SlideThumb({ item }: { item: SlideData }) {
  const dims = item.sub ? "left-[68px] w-[116px] h-[65px]" : "left-[44px] w-[140px] h-[79px]";
  return (
    <div className={clsx("absolute top-[8px] rounded-[5px]", dims)}>
      <div className="absolute inset-0 rounded-[5px] overflow-hidden bg-white">
        {item.thumb
          ? <img alt="" className="absolute inset-0 size-full object-cover" src={item.thumb} />
          : <div className="absolute inset-0" style={{ background: item.tint ?? "#111" }} />}
      </div>
      <div aria-hidden className="absolute inset-0 rounded-[5px] border border-c-border" />
      {item.motion && (
        <div className="absolute bottom-[5px] left-[5px] size-[18px] rounded-[2px] bg-c-bg border border-c-border flex items-center justify-center">
          <Sparkles size={11} className="text-c-text-secondary" />
        </div>
      )}
    </div>
  );
}

// ── Comment pin (speech-bubble + avatar) ──────────────────────────────────────
function CommentPin({ count }: { count: number }) {
  return (
    <div className="absolute right-[12px] top-[4px] size-[24px]">
      <div className="absolute inset-0 bg-c-bg-danger rounded-tl-[12px] rounded-tr-[12px] rounded-br-[12px] rounded-bl-[4px] shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.18),0px_3px_8px_0px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]" />
      <div className="absolute left-[3px] top-[3px] size-[18px] rounded-full border-[0.75px] border-c-bg-danger flex items-center justify-center">
        <span className="text-c-text-on-brand text-[10.5px] leading-[18px]" style={INTER}>{count}</span>
      </div>
    </div>
  );
}

// ── One slide row ─────────────────────────────────────────────────────────────
export function SlideListItem({ item }: { item: SlideData }) {
  const h = item.stacked ? "h-[107px]" : item.sub ? "h-[81px]" : "h-[95px]";
  const numLeft = item.sub ? "left-[36px]" : "left-[12px]";
  return (
    <div className={clsx("relative w-full shrink-0 cursor-pointer", h)} onClick={item.onClick}>
      {/* selection tint */}
      {item.selected && <div className="absolute inset-[0_8px] rounded-[5px] bg-c-bg-selected" />}

      {/* stacked-group cards (peek behind/below the thumbnail) */}
      {item.stacked && (
        <>
          <div
            className="absolute left-[52px] top-[61px] w-[124px] h-[32px] rounded-[4px] shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.18),0px_3px_8px_0px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
            style={{ backgroundImage: "linear-gradient(rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 80%, rgba(0,0,0,0) 97.717%), linear-gradient(90deg, #fff 0%, #fff 100%)" }}
          />
          <div className="absolute left-[58px] top-[73px] w-[112px] h-[26px] rounded-[3px] bg-white shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.3),0px_1px_3px_0px_rgba(0,0,0,0.15)]" />
        </>
      )}

      <SlideThumb item={item} />

      {/* number (+ group chevron) */}
      <div className={clsx("absolute top-[6px] flex flex-col items-center", item.group && "gap-[4px]", numLeft)}>
        <div className="w-[24px] h-[16px] flex items-center justify-center">
          <span
            className={clsx("text-[11px] font-[450] leading-[16px] tracking-[0.055px]", item.selected ? "text-c-text-brand" : "text-c-text-secondary")}
            style={INTER}
          >
            {item.n}
          </span>
        </div>
        {item.group && (
          <ChevronRight size={16} className={clsx("text-c-text transition-transform", item.expanded && "rotate-90")} />
        )}
      </div>

      {item.comment != null && <CommentPin count={item.comment} />}
    </div>
  );
}

// ── View toggle (list / grid) ─────────────────────────────────────────────────
function ViewToggle({ view, onChange }: { view: "list" | "grid"; onChange: (v: "list" | "grid") => void }) {
  const Tab = ({ v, children }: { v: "list" | "grid"; children: React.ReactNode }) => (
    <button
      onClick={() => onChange(v)}
      className={clsx(
        "flex-1 h-[24px] flex items-center justify-center rounded-[5px] transition-colors",
        view === v ? "bg-c-bg shadow-sm" : "bg-transparent",
      )}
    >
      {children}
    </button>
  );
  return (
    <div className="flex bg-c-bg-secondary rounded-[5px] w-[88px] overflow-hidden">
      <Tab v="list"><PanelLeft size={16} className={view === "list" ? "text-c-text" : "text-c-text-secondary"} /></Tab>
      <Tab v="grid"><LayoutGrid size={16} className={view === "grid" ? "text-c-text" : "text-c-text-secondary"} /></Tab>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function SlidesPanel({ slides, title = "Product review", subtitle = "native" }: {
  slides: SlideData[];
  title?: string;
  subtitle?: string;
}) {
  const [view, setView] = useState<"list" | "grid">("list");
  return (
    <div className="w-[200px] shrink-0 h-full flex flex-col bg-c-bg overflow-hidden border-r border-c-border">
      {/* Header */}
      <div className="shrink-0 flex flex-col pt-[8px] pb-[12px] px-[8px]">
        <div className="flex items-center justify-between w-full">
          {/* app menu */}
          <button className="flex items-center pr-[4px] rounded-[5px] hover:bg-c-bg-hover">
            <span className="p-[4px] flex"><FigmaGlyph /></span>
            <ChevronDown size={11} className="text-c-text" />
          </button>
          <ViewToggle view={view} onChange={setView} />
        </div>
        {/* title + subtitle */}
        <div className="flex flex-col px-[8px] pt-[4px]">
          <div className="flex gap-[4px] items-center h-[24px]">
            <span className="text-c-text text-[13px] font-[550] leading-[22px] tracking-[-0.0325px] truncate" style={INTER}>{title}</span>
            <ChevronDown size={11} className="text-c-text shrink-0" />
          </div>
          <span className="text-c-text-secondary text-[11px] font-[450] leading-[16px] tracking-[0.055px]" style={INTER}>{subtitle}</span>
        </div>
      </div>

      {/* New slide (split: label + chevron on the left, plus on the right) */}
      <div className="shrink-0 p-[8px] border-t border-b border-c-border">
        <button className="relative w-full h-[24px] rounded-[6px] border border-c-border bg-c-bg flex items-center justify-center gap-[2px] hover:bg-c-bg-hover">
          <span className="text-c-text text-[11px] font-[450] leading-[16px] tracking-[0.055px]" style={INTER}>New slide</span>
          <ChevronDown size={12} className="text-c-text" />
          <Plus size={16} className="text-c-text absolute right-[4px] top-1/2 -translate-y-1/2" />
        </button>
      </div>

      {/* Slide list — overlay scrollbar (theme-aware thumb) */}
      <ScrollArea>
        <div className="flex flex-col">
          {slides.map((s, i) => <SlideListItem key={i} item={s} />)}
        </div>
      </ScrollArea>
    </div>
  );
}

// Figma-style app menu mark (original glyph, not a lifted asset)
function FigmaGlyph() {
  return (
    <svg width="11" height="16" viewBox="0 0 11 16" fill="none">
      <path d="M3.5 16a2.5 2.5 0 0 0 2.5-2.5V11H3.5a2.5 2.5 0 1 0 0 5Z" fill="#0ACF83" />
      <path d="M1 8.5A2.5 2.5 0 0 1 3.5 6H6v5H3.5A2.5 2.5 0 0 1 1 8.5Z" fill="#A259FF" />
      <path d="M1 3.5A2.5 2.5 0 0 1 3.5 1H6v5H3.5A2.5 2.5 0 0 1 1 3.5Z" fill="#F24E1E" />
      <path d="M6 1h2.5a2.5 2.5 0 1 1 0 5H6V1Z" fill="#FF7262" />
      <path d="M11 8.5A2.5 2.5 0 1 1 6 8.5a2.5 2.5 0 0 1 5 0Z" fill="#1ABCFE" />
    </svg>
  );
}
