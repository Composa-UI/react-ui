import { forwardRef, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { ScrollArea } from "./Panel";

// Figma "animate" glyph (icon.24.animate.small → svgPaths.p75f4980 in the
// `imports/SlidesTemplate` study export). Drawn in a 24×24 viewBox.
const ANIMATE_GLYPH =
  "M15 8C17.2091 8 19 9.79086 19 12C19 14.2091 17.2091 16 15 16C12.7909 16 11 14.2091 11 12C11 9.79086 12.7909 8 15 8ZM10.5 14.5C10.7761 14.5 11 14.7239 11 15C11 15.2761 10.7761 15.5 10.5 15.5H7.5C7.22386 15.5 7 15.2761 7 15C7 14.7239 7.22386 14.5 7.5 14.5H10.5ZM15 9C13.3431 9 12 10.3431 12 12C12 13.6569 13.3431 15 15 15C16.6569 15 18 13.6569 18 12C18 10.3431 16.6569 9 15 9ZM9.5 12.5C9.77614 12.5 10 12.7239 10 13C10 13.2761 9.77614 13.5 9.5 13.5H5.5C5.22386 13.5 5 13.2761 5 13C5 12.7239 5.22386 12.5 5.5 12.5H9.5ZM9.5 10.5C9.77614 10.5 10 10.7239 10 11C10 11.2761 9.77614 11.5 9.5 11.5H5.5C5.22386 11.5 5 11.2761 5 11C5 10.7239 5.22386 10.5 5.5 10.5H9.5ZM10.5 8.5C10.7761 8.5 11 8.72386 11 9C11 9.27614 10.7761 9.5 10.5 9.5H7.5C7.22386 9.5 7 9.27614 7 9C7 8.72386 7.22386 8.5 7.5 8.5H10.5Z";

// ─── Slides left panel ──────────────────────────────────────────────────────────
// Componentized from the study Figma export (`imports/SlidesTemplate`). Theme-aware:
// renders LIGHT by default and DARK under `data-composa-mode="dark"` — colours flow
// through the mode-flipping `c-*` tokens (styles/theme.css).
//
// Presentational + COMPOSABLE. Two ways to use it:
//   • Standalone/demo: pass `slides={SlideData[]}` and the panel maps its own rows.
//   • Consumer-composed: pass `children` (a list of <SlideRow>) so the consumer
//     owns behavior (selection modifiers, rename, drag-reorder, context menus)
//     while the kit owns the row/panel styling. The editor uses this path.
// The row's rich content is injected via slots: `thumbNode` (a live canvas
// thumbnail) and `nameNode` (e.g. an inline rename input). `SlideRow` forwards
// `...rest` to its root so a consumer can attach a context-menu trigger, drag
// handlers, `data-*` hooks, and event handlers.

const INTER = { fontFamily: "Inter, sans-serif" } as const;

export interface SlideData {
  n: number | string;          // number label
  thumb?: string;              // thumbnail image src
  tint?: string;               // solid thumb colour when no image (demo)
  thumbNode?: ReactNode;       // live thumbnail slot (takes precedence over thumb/tint)
  name?: string;               // slide name caption
  nameNode?: ReactNode;        // overrides the name caption (e.g. a rename input)
  range?: string;              // time-range caption (e.g. "0:00 – 0:1.4 · 1.4s")
  selected?: boolean;
  skipped?: boolean;           // dimmed + strikethrough name (excluded from playback)
  sub?: boolean;               // indented sub-slide (nested under a group)
  group?: boolean;             // expandable group header — shows a chevron
  expanded?: boolean;          // chevron rotation (open group)
  stacked?: boolean;           // stacked-group visual (offset cards behind)
  motion?: boolean;            // animation applied — badge on thumbnail
  comment?: number;            // comment-pin count (undefined = none)
  dropBefore?: boolean;        // drag-reorder drop indicator above the row
  dropAfter?: boolean;         // drag-reorder drop indicator below the row
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

// ── Slide thumbnail (+ motion badge) ──────────────────────────────────────────
// RESPONSIVE: the thumbnail fills the available width between a left number-gutter
// offset and a 12px right inset — matching the 12px left inset before the number
// gutter so the gaps read symmetrically. Its height is driven by the slide-canvas
// aspect ratio (~140/79) rather than a fixed width. Sub-slides carry a deeper left inset.
const THUMB_RATIO = 140 / 79; // slide canvas ratio
function SlideThumb({ item }: { item: SlideData }) {
  const gutter = item.sub ? "left-[68px]" : "left-[44px]";
  return (
    <div className={clsx("absolute top-[8px] right-[12px] rounded-[5px]", gutter)} style={{ aspectRatio: THUMB_RATIO }}>
      <div className="absolute inset-0 rounded-[5px] overflow-hidden bg-white">
        {item.thumbNode
          ? item.thumbNode
          : item.thumb
            ? <img alt="" className="absolute inset-0 size-full object-cover" src={item.thumb} />
            : <div className="absolute inset-0" style={{ background: item.tint ?? "#111" }} />}
      </div>
      <div aria-hidden className="absolute inset-0 rounded-[5px] border border-c-border" />
      {/* motion badge — Figma icon.24.animate.small: 18px rounded chip, bottom-left,
          with the animate glyph (24-viewBox path inset −3px to sit centred in 18px). */}
      {item.motion && (
        <div className="absolute bottom-[5px] left-[5px] size-[18px] rounded-[2px] bg-c-bg border border-c-border">
          <svg
            className="absolute inset-[-3px] size-[24px] text-c-icon-secondary"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d={ANIMATE_GLYPH} fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ── One slide row (composable shell) ──────────────────────────────────────────
// forwardRef + `...rest` spread so a consumer (the editor) can wrap it in a
// context-menu trigger / attach drag + data-* + event handlers on the root.
export const SlideRow = forwardRef<
  HTMLDivElement,
  { item: SlideData } & React.HTMLAttributes<HTMLDivElement>
>(function SlideRow({ item, className, ...rest }, ref) {
  const numLeft = item.sub ? "left-[36px]" : "left-[12px]";
  // Row height tracks the responsive thumbnail. An in-flow spacer uses the same
  // left-gutter + 12px-right margins, so it fills the remaining width; aspect-ratio
  // then sets its height, and the row grows/shrinks with the panel width. Vertical
  // margins reserve the 8px above/below the thumb (+12px for stacked peek cards),
  // plus room for the name + range captions below.
  const spacerLeft = item.sub ? 68 : 44;
  const spacerBottom = item.stacked ? 20 : 8; // 8, plus 12 for the stacked cards
  const hasCaption = item.name != null || item.nameNode != null || item.range != null;
  return (
    <div
      ref={ref}
      className={clsx("group relative w-full shrink-0 cursor-pointer select-none", className)}
      onClick={item.onClick}
      onDoubleClick={item.onDoubleClick}
      {...rest}
    >
      {/* drag-reorder drop indicators */}
      {item.dropBefore && <div aria-hidden className="absolute left-[8px] right-[8px] top-0 h-[2px] rounded-full bg-c-border-selected-strong" />}
      {item.dropAfter && <div aria-hidden className="absolute left-[8px] right-[8px] bottom-0 h-[2px] rounded-full bg-c-border-selected-strong" />}

      {/* height spacer — invisible box matching the thumbnail width + aspect ratio */}
      <div aria-hidden className="invisible" style={{ aspectRatio: THUMB_RATIO, marginLeft: spacerLeft, marginRight: 12, marginTop: 8, marginBottom: spacerBottom }} />

      {/* selection tint — deliberately does NOT match the thumbnail's right inset;
          it sits a few px further out so the tint is visible as a margin/frame
          around the thumbnail rather than the two edges coinciding (touching) */}
      {item.selected && <div className="absolute inset-y-0 left-[8px] right-[8px] rounded-[5px] bg-c-bg-selected" />}
      {!item.selected && <div className="absolute inset-y-[2px] left-[8px] right-[8px] rounded-[5px] bg-c-bg-hover opacity-0 group-hover:opacity-100" />}

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

      <div className={clsx(item.skipped && "opacity-50")}>
        <SlideThumb item={item} />
      </div>

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

      {/* name + range captions (below the thumbnail) */}
      {hasCaption && (
        <div className="relative flex flex-col gap-[1px] pb-[6px] pr-[12px]" style={{ paddingLeft: spacerLeft }}>
          {item.nameNode
            ? item.nameNode
            : item.name != null && (
                <span
                  className={clsx(
                    "text-[11px] font-[450] leading-[16px] tracking-[0.055px] truncate",
                    item.selected ? "text-c-text" : "text-c-text",
                    item.skipped && "line-through opacity-60",
                  )}
                  style={INTER}
                >
                  {item.name}
                </span>
              )}
          {item.range != null && (
            <span className="text-[10px] font-[450] leading-[14px] tracking-[0.05px] tabular-nums text-c-text-secondary truncate" style={INTER}>
              {item.range}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

// ── One slide row (self-mapping form for the standalone `slides` prop) ─────────
export function SlideListItem({ item }: { item: SlideData }) {
  return <SlideRow item={item} />;
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export interface SlidesPanelProps {
  /** Standalone/demo data — ignored when `children` is provided. */
  slides?: SlideData[];
  /** Consumer-composed rows (a list of <SlideRow>). Takes precedence over slides. */
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  /** "New slide" button handler. */
  onAddSlide?: () => void;
}

export function SlidesPanel({ slides, children, title = "Product review", subtitle = "native", onAddSlide }: SlidesPanelProps) {
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
        <button
          type="button"
          onClick={onAddSlide}
          className="relative w-full h-[24px] rounded-[6px] border border-c-border bg-c-bg flex items-center justify-center gap-[2px] hover:bg-c-bg-hover"
        >
          <span className="text-c-text text-[11px] font-[450] leading-[16px] tracking-[0.055px]" style={INTER}>New slide</span>
          <ChevronDown size={12} className="text-c-text" />
          <Plus size={16} className="text-c-text absolute right-[4px] top-1/2 -translate-y-1/2" />
        </button>
      </div>

      {/* Slide list — overlay scrollbar (theme-aware thumb) */}
      <ScrollArea>
        <div className="flex flex-col">
          {children ?? slides?.map((s, i) => <SlideListItem key={i} item={s} />)}
        </div>
      </ScrollArea>
    </div>
  );
}
