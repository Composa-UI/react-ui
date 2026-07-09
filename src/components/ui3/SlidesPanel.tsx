import { clsx } from "clsx";
import { ChevronRight, ChevronDown, Plus, Sparkles } from "lucide-react";
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
// RESPONSIVE: the thumbnail fills the available width between a left number-gutter
// offset and an 8px right inset; its height is driven by the slide-canvas aspect
// ratio (~140/79) rather than a fixed width. Sub-slides carry a deeper left inset.
const THUMB_RATIO = 140 / 79; // slide canvas ratio
function SlideThumb({ item }: { item: SlideData }) {
  const gutter = item.sub ? "left-[68px]" : "left-[44px]";
  return (
    <div className={clsx("absolute top-[8px] right-[8px] rounded-[5px]", gutter)} style={{ aspectRatio: THUMB_RATIO }}>
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

// ── One slide row ─────────────────────────────────────────────────────────────
export function SlideListItem({ item }: { item: SlideData }) {
  const numLeft = item.sub ? "left-[36px]" : "left-[12px]";
  // Row height tracks the responsive thumbnail. An in-flow spacer uses the same
  // left-gutter + 8px-right margins, so it fills the remaining width; aspect-ratio
  // then sets its height, and the row grows/shrinks with the panel width. Vertical
  // margins reserve the 8px above/below the thumb (+12px for stacked peek cards).
  const spacerLeft = item.sub ? 68 : 44;
  const spacerBottom = item.stacked ? 20 : 8; // 8, plus 12 for the stacked cards
  return (
    <div className="relative w-full shrink-0 cursor-pointer" onClick={item.onClick}>
      {/* height spacer — invisible box matching the thumbnail width + aspect ratio */}
      <div aria-hidden className="invisible" style={{ aspectRatio: THUMB_RATIO, marginLeft: spacerLeft, marginRight: 8, marginTop: 8, marginBottom: spacerBottom }} />

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
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function SlidesPanel({ slides, title = "Product review", subtitle = "native" }: {
  slides: SlideData[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="w-[200px] shrink-0 h-full flex flex-col bg-c-bg overflow-hidden border-r border-c-border">
      {/* Header — title + subtitle only */}
      <div className="shrink-0 flex flex-col pt-[8px] pb-[12px] px-[8px]">
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
