import { clsx } from "clsx";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { ChevronRight, ChevronDown, Plus, Pencil, Copy, Trash2, LayoutTemplate } from "lucide-react";
import { ScrollArea } from "./Panel";
import { Menu, MenuRow } from "./Menu";

// Figma "animate" glyph (icon.24.animate.small → svgPaths.p75f4980 in the
// `imports/SlidesTemplate` study export). Drawn in a 24×24 viewBox.
const ANIMATE_GLYPH =
  "M15 8C17.2091 8 19 9.79086 19 12C19 14.2091 17.2091 16 15 16C12.7909 16 11 14.2091 11 12C11 9.79086 12.7909 8 15 8ZM10.5 14.5C10.7761 14.5 11 14.7239 11 15C11 15.2761 10.7761 15.5 10.5 15.5H7.5C7.22386 15.5 7 15.2761 7 15C7 14.7239 7.22386 14.5 7.5 14.5H10.5ZM15 9C13.3431 9 12 10.3431 12 12C12 13.6569 13.3431 15 15 15C16.6569 15 18 13.6569 18 12C18 10.3431 16.6569 9 15 9ZM9.5 12.5C9.77614 12.5 10 12.7239 10 13C10 13.2761 9.77614 13.5 9.5 13.5H5.5C5.22386 13.5 5 13.2761 5 13C5 12.7239 5.22386 12.5 5.5 12.5H9.5ZM9.5 10.5C9.77614 10.5 10 10.7239 10 11C10 11.2761 9.77614 11.5 9.5 11.5H5.5C5.22386 11.5 5 11.2761 5 11C5 10.7239 5.22386 10.5 5.5 10.5H9.5ZM10.5 8.5C10.7761 8.5 11 8.72386 11 9C11 9.27614 10.7761 9.5 10.5 9.5H7.5C7.22386 9.5 7 9.27614 7 9C7 8.72386 7.22386 8.5 7.5 8.5H10.5Z";

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
  /** Evaluated thumbnail supplied by the app while the composition is being
   * previewed. Presentation stays in the DS; frame evaluation stays app-owned. */
  previewThumb?: string;
  tint?: string;               // solid thumb colour when no image (demo)
  selected?: boolean;
  /** Slide currently rendered in the canvas, even when another editor surface owns selection. */
  inView?: boolean;
  sub?: boolean;               // indented sub-slide (nested under a group)
  group?: boolean;             // expandable group header — shows a chevron
  expanded?: boolean;          // chevron rotation (open group)
  stacked?: boolean;           // stacked-group visual (offset cards behind)
  motion?: boolean;            // animation applied — badge on thumbnail
  /** Starts/stops app-owned evaluated thumbnail playback on hover or keyboard focus. */
  onPreviewChange?: (previewing: boolean) => void;
  comment?: number;            // comment-pin count (undefined = none)
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

export function slideItemKeyboardAction(key: string): "rename" | "activate" | "navigate" {
  if (key === "Enter") return "rename";
  if (key === " ") return "activate";
  return "navigate";
}

// ── Slide thumbnail (+ motion badge) ──────────────────────────────────────────
// RESPONSIVE: the fixed left-panel SLOT fills the available width between a left
// number-gutter offset and a 12px right inset — matching the 12px left inset before
// the number gutter so the gaps read symmetrically. Its height is driven by the
// SLOT_RATIO (~140/79); that height is the "available thumbnail height" the row
// reserves and stays constant regardless of the project aspect ratio (#482).
// The inner thumbnail then honors the selected project ratio: it keeps the slot
// height, derives its width from the ratio, and centers within the slot (and the
// selected-row background). Sub-slides carry a deeper left inset.
const SLOT_RATIO = 140 / 79; // fixed left-panel slot ratio → reserves the available height
export const THUMB_RATIO = SLOT_RATIO; // back-compat alias (slot ratio)
export function CompositionMotionBadge({ className }: { className?: string }) {
  return (
    <div data-composa-motion-present className={clsx("size-[18px] rounded-[2px] bg-c-bg border border-c-border", className)}>
      <svg
        className="absolute inset-[-3px] size-[24px] text-c-icon-secondary"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path d={ANIMATE_GLYPH} fill="currentColor" />
      </svg>
    </div>
  );
}

function SlideThumb({ item, aspectRatio = SLOT_RATIO }: { item: SlideData; aspectRatio?: number }) {
  const gutter = item.sub ? "left-[68px]" : "left-[44px]";
  const ratio = aspectRatio > 0 ? aspectRatio : SLOT_RATIO;
  return (
    <div className={clsx("absolute top-[8px] right-[12px]", gutter)} style={{ aspectRatio: SLOT_RATIO }}>
      {/* Center the project-ratio thumbnail within the fixed slot. Height is
          preserved (fills the slot); width = height × project ratio, clamped to
          the slot width so ultra-wide ratios never overflow the panel. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-full max-w-full rounded-[5px]" style={{ aspectRatio: ratio }}>
          <div className="absolute inset-0 rounded-[5px] overflow-hidden bg-white">
            {(item.previewThumb ?? item.thumb)
              ? <img alt="" className="absolute inset-0 size-full object-cover" src={item.previewThumb ?? item.thumb} />
              : <div className="absolute inset-0" style={{ background: item.tint ?? "#111" }} />}
          </div>
          <div aria-hidden className="absolute inset-0 rounded-[5px] border border-c-border" />
          {/* motion badge — Figma icon.24.animate.small: 18px rounded chip, bottom-left,
              with the animate glyph (24-viewBox path inset −3px to sit centred in 18px). */}
          {item.motion && (
            <CompositionMotionBadge className="absolute bottom-[5px] left-[5px]" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── One slide row ─────────────────────────────────────────────────────────────
export function SlideListItem({ item, aspectRatio, tabIndex = 0, onNavigate, onRenameRequest, onMenuRequest, onFocus, itemRef }: { item: SlideData; aspectRatio?: number; tabIndex?: number; onNavigate?: (event: KeyboardEvent<HTMLDivElement>) => void; onRenameRequest?: () => void; onMenuRequest?: (event: { clientX: number; clientY: number }) => void; onFocus?: () => void; itemRef?: (node: HTMLDivElement | null) => void }) {
  const numLeft = item.sub ? "left-[36px]" : "left-[12px]";
  // Row height tracks the responsive thumbnail. An in-flow spacer uses the same
  // left-gutter + 12px-right margins, so it fills the remaining width; aspect-ratio
  // then sets its height, and the row grows/shrinks with the panel width. Vertical
  // margins reserve the 8px above/below the thumb (+12px for stacked peek cards).
  const spacerLeft = item.sub ? 68 : 44;
  const spacerBottom = item.stacked ? 20 : 8; // 8, plus 12 for the stacked cards
  return (
    <div className="group/slide relative w-full shrink-0 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-c-border-selected"
      ref={itemRef} role="option" tabIndex={tabIndex} aria-selected={item.selected} data-in-view={item.inView || undefined} aria-label={`Composition ${item.n}`}
      onFocus={onFocus}
      onFocusCapture={() => item.onPreviewChange?.(true)}
      onBlurCapture={() => item.onPreviewChange?.(false)}
      onMouseEnter={() => item.onPreviewChange?.(true)}
      onMouseLeave={() => item.onPreviewChange?.(false)}
      onClick={item.onClick}
      onContextMenu={onMenuRequest ? event => { event.preventDefault(); onMenuRequest({ clientX: event.clientX, clientY: event.clientY }); } : undefined}
      onKeyDown={event => {
        const action = slideItemKeyboardAction(event.key);
        if (action === "rename") { event.preventDefault(); onRenameRequest?.(); }
        else if (action === "activate") { event.preventDefault(); item.onClick?.(event as unknown as MouseEvent<HTMLDivElement>); }
        else onNavigate?.(event);
      }}>
      {/* height spacer — invisible box matching the fixed slot width + slot ratio.
          Uses SLOT_RATIO (not the project ratio) so the reserved row height — the
          available thumbnail height — stays constant across aspect ratios (#482). */}
      <div aria-hidden className="invisible" style={{ aspectRatio: SLOT_RATIO, marginLeft: spacerLeft, marginRight: 12, marginTop: 8, marginBottom: spacerBottom }} />

      {/* The thumbnail sits 8px inside the selection tint on both its top and
          right edges. The list adds a small outer inset above and below rows. */}
      {(item.selected || item.inView) && <div data-slide-highlight={item.selected ? "selected" : "in-view"} className={clsx(
        "absolute inset-y-0 left-[8px] right-[4px] rounded-[5px]",
        item.selected ? "bg-c-bg-selected" : "bg-c-bg-selected/50",
      )} />}

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

      <SlideThumb item={item} aspectRatio={aspectRatio} />

      {/* number (+ group chevron) */}
      <div className={clsx("absolute top-[6px] flex flex-col items-center", item.group && "gap-[4px]", numLeft)}>
        <div className="w-[24px] h-[16px] flex items-center justify-center">
          <span
            className={clsx("text-[11px] font-[450] leading-[16px] tracking-[0.055px]", item.selected || item.inView ? "text-c-text-brand" : "text-c-text-secondary")}
            style={INTER}
          >
            {item.n}
          </span>
        </div>
        {item.group && (
          <ChevronRight size={16} className={clsx("text-c-text transition-transform", item.expanded && "rotate-90")} />
        )}
      </div>
      {/* No hover ⋯ affordance: the slide actions live on right-click only
          (Composa#661). The chip used to float over the thumbnail on hover and
          obscure the artwork it was attached to; `onContextMenu` above opens the
          same Rename/Duplicate/Delete menu at the cursor, matching the assets
          and layer panels' context-menu convention. */}
    </div>
  );
}

// ── Editable composition title ────────────────────────────────────────────────
// Inline-rename combo (mirrors the DS ComboInput split + the LayerList inline
// rename): the name reads as a button at rest and swaps to a bordered input on
// click / Enter; a trailing chevron opens the composition menu. Enter (or blur)
// commits, Escape cancels. Controlled name in, committed name out.
function EditableProjectTitle({ title, onCommit, onMenu }: {
  title: string;
  onCommit?: (name: string) => void;
  onMenu?: (trigger: HTMLButtonElement) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const startEdit = () => { setDraft(title); setEditing(true); };
  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== title) onCommit?.(next);
  };
  const cancel = () => { setEditing(false); setDraft(title); };

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label="Project name"
        value={draft}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === "Enter") { event.preventDefault(); commit(); }
          else if (event.key === "Escape") { event.preventDefault(); cancel(); }
        }}
        className="flex-1 min-w-0 h-[24px] rounded-c-sm border border-c-border-selected bg-c-bg px-[6px] text-c-text text-[13px] font-[550] leading-[22px] tracking-[-0.0325px] outline-none"
        style={INTER}
      />
    );
  }
  return (
    <div className="flex-1 min-w-0 flex items-center gap-[2px]">
      <button
        type="button"
        onClick={startEdit}
        aria-label={`Rename project ${title}`}
        className="min-w-0 flex items-center h-[24px] px-[4px] -mx-[4px] rounded-c-sm hover:bg-c-bg-hover"
      >
        <span className="text-c-text text-[13px] font-[550] leading-[22px] tracking-[-0.0325px] truncate" style={INTER}>{title}</span>
      </button>
      <button
        type="button"
        onClick={event => onMenu?.(event.currentTarget)}
        aria-label="Project options"
        className="shrink-0 flex items-center justify-center size-[20px] rounded-c-sm text-c-text hover:bg-c-bg-hover"
      >
        <ChevronDown size={11} />
      </button>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function SlidesPanel({ slides, aspectRatio, title = "Product review", subtitle: _subtitle = "", onNewSlide, onNewSlideMenu, onRenameRequest, onTitleChange, onTitleMenu, onSlideDuplicate, onSlidePublishTemplate, onSlideDelete }: {
  slides: SlideData[];
  /** Project canvas aspect ratio (width / height). Slide thumbnails honor it while
   *  the reserved slot height stays constant. Defaults to the ~16:9 slot ratio. */
  aspectRatio?: number;
  title?: string;
  /** @deprecated The fixed 40px DS header no longer renders a subtitle line. */
  subtitle?: string;
  onNewSlide?: () => void;
  onNewSlideMenu?: () => void;
  onRenameRequest?: (index: number) => void;
  /** Commit an inline rename of the project (header title). */
  onTitleChange?: (name: string) => void;
  /** Open the project options menu (header title chevron). */
  onTitleMenu?: (trigger: HTMLButtonElement) => void;
  /** Slide-item menu actions. Duplicate/Delete semantics are not yet pinned. */
  onSlideDuplicate?: (index: number) => void;
  /** Publish the selected composition into the app-owned project template catalogue. */
  onSlidePublishTemplate?: (index: number) => void;
  onSlideDelete?: (index: number) => void;
}) {
  const initialFocus = Math.max(0, slides.findIndex(slide => slide.selected));
  const [focusIndex, setFocusIndex] = useState(initialFocus);
  const [menu, setMenu] = useState<{ index: number; x: number; y: number } | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const hasItemMenu = Boolean(onRenameRequest || onSlideDuplicate || onSlidePublishTemplate || onSlideDelete);
  const navigate = (index: number, event: KeyboardEvent<HTMLDivElement>) => {
    let next = index;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = Math.min(slides.length - 1, index + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = Math.max(0, index - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = slides.length - 1;
    else return;
    event.preventDefault();
    setFocusIndex(next);
    itemRefs.current[next]?.focus();
  };
  return (
    <div className="w-[200px] shrink-0 h-full flex flex-col bg-c-bg overflow-hidden border-r border-c-border">
      {/* Header — fixed 40px to match the DS panel-header standard (LayerList /
          PanelSection). Holds the inline-rename composition title combo. */}
      <div className="shrink-0 h-[40px] flex items-center px-[16px]">
        <EditableProjectTitle title={title} onCommit={onTitleChange} onMenu={onTitleMenu} />
      </div>

      {/* New composition (split: label + chevron on the left, plus on the right) */}
      <div className="shrink-0 p-[8px] border-t border-b border-c-border">
        <div className="w-full h-[24px] rounded-[6px] border border-c-border bg-c-bg flex items-stretch overflow-hidden">
          <button onClick={onNewSlideMenu} aria-label="New comp options" className="relative flex-1 flex items-center justify-center gap-[2px] hover:bg-c-bg-hover">
            <span className="text-c-text text-[11px] font-[450] leading-[16px] tracking-[0.055px]" style={INTER}>New comp</span>
            <ChevronDown size={12} className="text-c-text" />
          </button>
          <button onClick={onNewSlide} aria-label="Add comp" className="w-[24px] flex items-center justify-center border-l border-c-border hover:bg-c-bg-hover">
            <Plus size={16} className="text-c-text" />
          </button>
        </div>
      </div>

      {/* Slide list — overlay scrollbar (theme-aware thumb) */}
      <ScrollArea>
        <div className="flex flex-col py-[4px]" role="listbox" aria-label="Compositions">
          {slides.map((s, i) => <SlideListItem key={i} item={s} aspectRatio={aspectRatio} tabIndex={i === focusIndex ? 0 : -1}
            itemRef={node => { itemRefs.current[i] = node; }} onFocus={() => setFocusIndex(i)} onNavigate={event => navigate(i, event)}
            onRenameRequest={() => onRenameRequest?.(i)}
            onMenuRequest={hasItemMenu ? event => setMenu({ index: i, x: event.clientX, y: event.clientY }) : undefined} />)}
        </div>
      </ScrollArea>

      {/* Slide actions menu — anchored at the cursor / ⋯ click (mirrors the
          AssetsPanel context menu). Backdrop closes it. */}
      {menu && (
        <>
          <button type="button" aria-label="Close menu" className="fixed inset-0 z-40 cursor-default" onClick={() => setMenu(null)} />
          <div className="fixed z-50" style={{ left: menu.x, top: menu.y }}>
            <Menu>
              <MenuRow label="Rename" leading={<Pencil size={14} />} onClick={() => { onRenameRequest?.(menu.index); setMenu(null); }} />
              <MenuRow label="Duplicate" leading={<Copy size={14} />} onClick={() => { onSlideDuplicate?.(menu.index); setMenu(null); }} />
              {onSlidePublishTemplate && <MenuRow label="Publish as template" leading={<LayoutTemplate size={14} />} onClick={() => { onSlidePublishTemplate(menu.index); setMenu(null); }} />}
              <MenuRow type="divider" />
              <MenuRow label="Delete" leading={<Trash2 size={14} />} destructive onClick={() => { onSlideDelete?.(menu.index); setMenu(null); }} />
            </Menu>
          </div>
        </>
      )}
    </div>
  );
}
