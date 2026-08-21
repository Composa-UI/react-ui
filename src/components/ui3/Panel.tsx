import { useState, useRef, useEffect, useId, type DragEvent, type MutableRefObject, type ReactNode } from "react";
import { clsx } from "clsx";
import { ChevronDown, Eye, EyeOff, Minus } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { suppressNativeDragImage } from "./dragImage";

// ─── ScrollArea ───────────────────────────────────────────────────────────────
// Native scrollbar is fully hidden (takes NO width — content is full-bleed); a thin
// overlay thumb sits ON the panel, driven by JS and revealed on hover/scroll.
// (Mirrors the study panel's `.composa-editing-inspector-scroll(bar)`.)
export function ScrollArea({ children, className, contentClassName, thumbClassName = "bg-c-icon-secondary", onScroll, viewportRef }: { children?: ReactNode; className?: string; contentClassName?: string; thumbClassName?: string; onScroll?: (scrollTop: number) => void; viewportRef?: MutableRefObject<HTMLDivElement | null> }) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);
  const [active, setActive] = useState(false);

  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) { setThumb(null); return; }
    const h = Math.max(24, (clientHeight / scrollHeight) * clientHeight);
    const top = (scrollTop / (scrollHeight - clientHeight)) * (clientHeight - h);
    setThumb({ top, height: h });
  };

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (contentRef.current) ro.observe(contentRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      className="relative flex-1 min-h-0 flex flex-col"
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <div
        data-composa-scroll-viewport
        ref={node => { ref.current = node; if (viewportRef) viewportRef.current = node; }}
        onScroll={e => { measure(); setActive(true); onScroll?.(e.currentTarget.scrollTop); }}
        // Fill via flex (not `h-full`): a percentage height only resolves under a
        // definite-height ancestor (editor panels sit under an h-screen chain), but a
        // modal card sizes via max-height on a content-sized element — indefinite —
        // so `h-full` would collapse and the viewport would grow to full content
        // height and never scroll. `flex-1 min-h-0` fills the flex-resolved root
        // height in both cases.
        className={clsx("flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      >
        <div ref={contentRef} data-composa-scroll-content className={clsx("min-h-full", contentClassName)}>
          {children}
        </div>
      </div>
      {thumb && (
        <div
          data-composa-scroll-thumb
          className={clsx("absolute right-[2px] w-[6px] rounded-full pointer-events-none transition-opacity duration-200", thumbClassName)}
          style={{ top: thumb.top, height: thumb.height, opacity: active ? 0.45 : 0 }}
        />
      )}
    </div>
  );
}

// ─── Panel surface ────────────────────────────────────────────────────────────
// 290px wide. mode-adaptive (bg-c-bg). Right sidebar chrome.

// Widened from 240 (Composa#661): at 240 the two-column field rows truncated
// most numeric values, so a value like "758.46" read as "758…". +50px gives each
// column enough room to show a full value plus its unit.
export const PANEL_W = 290;

const FONT     = "font-[family-name:var(--composa-font-family)]";
const SUBLABEL = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.05em] text-c-text-secondary");
const TITLE    = clsx(FONT, "text-[11px] font-[550] leading-[16px] tracking-[0.055px] text-c-text");

// ─── Panel container ──────────────────────────────────────────────────────────

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={clsx(
        "flex flex-col bg-c-bg ring-1 ring-inset ring-c-border-translucent",
        className,
      )}
      style={{ width: PANEL_W }}
    >
      {children}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
// 40px header (title left + right-actions). Border-bottom separates sections.
// Collapsible via chevron. `defaultOpen` controls initial state.

interface PanelSectionProps {
  title: string;
  children?: ReactNode;
  rightActions?: ReactNode;
  /** Opt into a named region landmark without changing the section's visual anatomy. */
  landmark?: boolean;
  defaultOpen?: boolean;
  collapsible?: boolean;
  muted?: boolean;   // empty stackable section — grey the header text/icons
  onHeaderClick?: () => void;  // makes the title clickable (e.g. Selection Colors collapse toggle)
}

export function PanelSection({
  title,
  children,
  rightActions,
  landmark = false,
  muted = false,
  onHeaderClick,
}: PanelSectionProps) {
  const titleId = useId();
  // Figma UI3 sections do not collapse via a chevron. The header names the section;
  // presence-dependent sections appear/disappear by content, not by expand/collapse.
  return (
    <div role={landmark ? "region" : undefined} aria-labelledby={landmark ? titleId : undefined}
      className={clsx("border-b border-c-border group", muted && "text-c-text-secondary")}>
      {/* 40px header */}
      <div className="flex items-center h-[40px] px-[16px]">
        {onHeaderClick ? (
          <button id={landmark ? titleId : undefined} onClick={onHeaderClick} className={clsx(TITLE, "flex-1 text-left cursor-pointer", muted && "!text-c-text-secondary")}>{title}</button>
        ) : (
          <span id={landmark ? titleId : undefined} className={clsx(TITLE, "flex-1", muted && "!text-c-text-secondary")}>{title}</span>
        )}
        {rightActions && (
          <div className="flex items-center gap-[4px] shrink-0">
            {rightActions}
          </div>
        )}
      </div>

      {children && <div className="pb-[4px]">{children}</div>}
    </div>
  );
}

// ─── PanelFieldRow ────────────────────────────────────────────────────────────
// 48px tall: 3px gap + 9px sub-label + 10px gap + 24px control + 4px gap.
// Sub-label spans full row. Content is split into left (104px) / right (104px).

interface PanelFieldRowProps {
  label?: string;
  left?: ReactNode;
  right?: ReactNode;
  /** Optional action pinned to far right (chain-link, settings, etc.) */
  rightAction?: ReactNode;
  /**
   * Reserve the 24px right-action column even when empty. Default true keeps the
   * element PropertyPanel's aligned right gutter. The project/slide/clip panels
   * pass false so their fields go edge-to-edge (full width).
   */
  reserveRightSlot?: boolean;
}

/**
 * A field row that holds a segmented control. The trailing 24px slot is NOT a
 * prop here: a segmented control that runs edge-to-edge leaves nowhere to hang
 * the per-row icon that the flow/wrap and text-resizing rows need, and it drops
 * out of line with the inspector's right gutter. Owner feedback on that has
 * recurred (Composa#661 item 6), so the rule is enforced by the type — this row
 * cannot be asked to give the slot up — rather than by remembering not to write
 * `reserveRightSlot={false}` at each call site.
 */
export type PanelSegmentedRowProps = Omit<PanelFieldRowProps, "reserveRightSlot">;

export function PanelSegmentedRow(props: PanelSegmentedRowProps) {
  return <PanelFieldRow {...props} reserveRightSlot />;
}

export function PanelFieldRow({ label, left, right, rightAction, reserveRightSlot = true }: PanelFieldRowProps) {
  return (
    <div className="h-[48px] flex flex-col justify-center pt-[3px] pb-[4px]">
      {label && (
        <span className={clsx(SUBLABEL, "px-[16px] mb-[3px]")}>{label}</span>
      )}
      {/* 16dp left · fluid primitives (equal split, grow with panel) · 8dp gaps · optional right-action slot */}
      <div className="flex items-center pl-[16px] pr-[16px] gap-[8px] min-h-[24px]">
        {left  && <div className="flex-1 min-w-0">{left}</div>}
        {right && <div className="flex-1 min-w-0">{right}</div>}
        {(rightAction || reserveRightSlot) && (
          <div className="shrink-0 flex items-center justify-end min-w-[24px]">{rightAction}</div>
        )}
      </div>
    </div>
  );
}

// ─── PanelFullRow ─────────────────────────────────────────────────────────────
// Single full-width content row (32px) with optional label and right action.

interface PanelFullRowProps {
  label?: string;
  children: ReactNode;
  rightAction?: ReactNode;
  height?: number;
}

export function PanelFullRow({
  label,
  children,
  rightAction,
  height = 32,
}: PanelFullRowProps) {
  return (
    <div
      className="flex items-center px-[16px] gap-[8px]"
      style={{ height }}
    >
      {label && <span className={clsx(SUBLABEL, "shrink-0 w-[80px]")}>{label}</span>}
      <div className="flex-1 min-w-0">{children}</div>
      {rightAction && <div className="shrink-0">{rightAction}</div>}
    </div>
  );
}

// ─── PanelRow ─────────────────────────────────────────────────────────────────
// Simple 32px row for label + value (e.g. element type, blend mode).

interface PanelRowProps {
  label?: string;
  children?: ReactNode;
  className?: string;
}

export function PanelRow({ label, children, className }: PanelRowProps) {
  return (
    <div className={clsx("flex items-center h-[32px] px-[16px] gap-[8px]", className)}>
      {label && <span className={clsx(FONT, "text-[11px] font-[550] text-c-text shrink-0")}>{label}</span>}
      {children}
    </div>
  );
}

// ─── IconButtonRow ────────────────────────────────────────────────────────────
// Horizontally connected icon-only buttons. Two variants:
//   action  — no persistent active state (align, rotate, flip)
//   select  — one button always active (flow direction, text alignment)
// Buttons are bg-c-bg-secondary, connected with 1px gap, outer rounded ends.

export interface IconBtn {
  icon: ReactNode;
  label: string;
  value?: string;
  /** Independent pressed/toggle state. When defined the button reflects its own
   *  on/off (selected bg + `aria-pressed`), decoupled from the group's single
   *  `value` — used for rows of independent toggles (e.g. lane vis/solo/mute/lock). */
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Hover tooltip for these icon-only actions. Defaults to `label`: the buttons
   *  carry no visible text, so a sighted user had no way to learn what a glyph
   *  does (Composa#661). Pass an explicit string only to say something the
   *  aria-label does not already say. */
  tooltip?: string;
}

interface IconButtonRowProps {
  buttons: IconBtn[];
  value?: string;
  onChange?: (value: string) => void;
  /** Total width the group should fill (ignored when fill=true) */
  width?: number;
  /** Fluid — fill the container, buttons grow equally (respects the row layout system) */
  fill?: boolean;
}

export function IconButtonRow({
  buttons,
  value,
  onChange,
  width = 104,
  fill = false,
}: IconButtonRowProps) {
  const btnW = Math.floor((width - (buttons.length - 1)) / buttons.length);

  return (
    <div data-composa-icon-button-row className={clsx("flex items-center", fill && "w-full")} style={{ gap: 1 }}>
      {buttons.map((btn, i) => {
        const isFirst = i === 0;
        const isLast  = i === buttons.length - 1;
        // A button either carries its own toggle state (`active`, independent) or
        // participates in the group's single-select `value`. Independent toggles
        // also advertise `aria-pressed`; single-select buttons stay unpressed.
        const isActive = btn.active ?? (value !== undefined && btn.value === value);
        // "On" for an INDEPENDENT toggle gets a brand glyph as well as a brand
        // ground. A group `value` row (the inspector's align / rotate / text-align
        // controls) is a segmented CHOICE rather than a toggle that is on, and the
        // owner's row is about the timeline track header, so those glyphs stay
        // `text-c-icon` — see the className below.
        const isToggledOn = btn.active === true;

        const button = (
          <button
            aria-label={btn.label}
            aria-pressed={btn.active === undefined ? undefined : btn.active}
            disabled={btn.disabled}
            onClick={() => {
              btn.onClick?.();
              if (btn.value) onChange?.(btn.value);
            }}
            className={clsx(
              "flex items-center justify-center h-[24px]",
              fill ? "flex-1 min-w-0" : "shrink-0",
              "transition-colors",
              isActive ? "bg-c-bg-selected" : "bg-c-bg-secondary hover:bg-c-bg-hover",
              // A toggled-on button gets the de-emphasised brand ground AND a
              // brand-coloured glyph. The row kept `text-c-icon` (near-black) on the
              // selected ground, so the timeline lane header's vis/solo/mute/lock
              // toggles read as "on" from their background alone — owner feedback
              // row #48, "they have purple deemphasized background when selected,
              // thats good but the icons themselves need to be the active purple".
              // `#6b4fd1` is the product violet (`--color-text-brand`), not the
              // canvas selection blue of DEC-079. It is the same ground/glyph pair
              // `PanelActionBtn`'s `selected` variant already uses below, so the two
              // icon-button primitives now describe "on" the same way, and
              // brand-ramp.test.ts already pins that pair at AA.
              isToggledOn ? "text-c-text-brand" : "text-c-icon",
              isFirst && !isLast && "rounded-l-c-md",
              isLast  && !isFirst && "rounded-r-c-md",
              !isFirst && !isLast && "rounded-none",
              isFirst && isLast && "rounded-c-md",
              btn.disabled && "opacity-30 cursor-not-allowed",
            )}
            style={fill ? undefined : { width: btnW }}
          >
            {btn.icon}
          </button>
        );

        // Every button in this row is icon-only, so the hint always renders; the
        // aria-label is the fallback text rather than an opt-in extra.
        return <Tooltip key={btn.label} label={btn.tooltip ?? btn.label} disabled={btn.disabled}>{button}</Tooltip>;
      })}
    </div>
  );
}

// ─── Panel action button ───────────────────────────────────────────────────────
// Small 24px icon button used as section/row right-actions.

interface PanelActionBtnProps {
  icon: ReactNode;
  label: string;
  active?: boolean;     // pressed/open — neutral grey
  selected?: boolean;   // toggle "on" — accent (selected) color variant
  disabled?: boolean;
  onClick?: () => void;
  /** Explanatory hover label. Defaults to `label` — this button is always
   *  icon-only, so without a tooltip the glyph is unexplained (Composa#661). */
  tooltip?: string;
}

export function PanelActionBtn({ icon, label, active, selected, disabled = false, onClick, tooltip }: PanelActionBtnProps) {
  const button = (
    <button
      aria-label={label}
      aria-pressed={selected === undefined ? undefined : selected}
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "flex items-center justify-center size-[24px] rounded-c-md transition-colors",
        disabled ? "text-c-icon opacity-30 cursor-not-allowed"
          : selected ? "bg-c-bg-selected text-c-text-brand"
          : active ? "bg-c-bg-secondary text-c-icon"
          : "text-c-icon hover:bg-c-bg-hover",
      )}
    >
      {icon}
    </button>
  );
  return <Tooltip label={tooltip ?? label} disabled={disabled}>{button}</Tooltip>;
}

// ─── Reorderable stack entry ─────────────────────────────────────────────────
// Drag-to-reorder wrapper shared by the stackable inspector sections (Fill ·
// Stroke · Effects). Before this, those sections were draggable but painted NO
// drop indicator: the only feedback was the grip's grab cursor, so you could not
// tell where an entry would land (Composa#661 item 7). The layer list already
// answers that with a 2px insertion line (LayerList's `dropZone`); this
// primitive gives every stackable section the same affordance from one place.

export type PanelEntryDropZone = "before" | "after";

/**
 * Pointer position → which side of the row the entry will be inserted on.
 * The layer list splits its rows into thirds because its middle third means
 * "drop inside"; a stackable entry cannot contain another entry, so the whole
 * row splits in half.
 */
export function panelEntryDropZone(clientY: number, rect: { top: number; height: number }): PanelEntryDropZone {
  if (!(rect.height > 0)) return "before";
  return clientY - rect.top < rect.height / 2 ? "before" : "after";
}

/**
 * Translates a before/after drop into the `targetId` the existing two-argument
 * `onReorder(id, targetId)` contract needs to land the entry in that exact gap.
 *
 * Hosts implement that contract as "remove `id`, re-insert at `targetId`'s
 * original index", which lands the entry AFTER the target when dragging down
 * and BEFORE it when dragging up. Dropping on the far half of a row therefore
 * has to name the neighbouring row instead, otherwise the insertion line would
 * promise a gap the drop does not honour. Returns null for a no-op drop (the
 * entry is already in that gap), so an idle drag cannot push a history entry.
 */
export function panelEntryReorderTarget(
  ids: readonly string[],
  sourceId: string,
  targetId: string,
  zone: PanelEntryDropZone,
): string | null {
  const source = ids.indexOf(sourceId);
  const target = ids.indexOf(targetId);
  if (source < 0 || target < 0 || source === target) return null;
  // The gap index the line was drawn at, in the ORIGINAL list.
  const gap = zone === "before" ? target : target + 1;
  if (gap === source || gap === source + 1) return null; // already there
  return ids[source < gap ? gap - 1 : gap] ?? null;
}

interface PanelReorderableEntryProps {
  /** Identity of this entry within `ids` — what gets emitted as the drag source. */
  id: string;
  /** The stack's ids in render order; drives the before/after → targetId mapping. */
  ids: readonly string[];
  onReorder?: (id: string, targetId: string) => void;
  children: ReactNode;
  className?: string;
}

export function PanelReorderableEntry({ id, ids, onReorder, children, className }: PanelReorderableEntryProps) {
  const [zone, setZone] = useState<PanelEntryDropZone | null>(null);
  const enabled = !!onReorder && ids.length > 1;
  // `dataTransfer` cannot be read during dragover, so the row that started the
  // drag remembers it locally — that is all we need to keep the source row from
  // drawing an insertion line against itself.
  const isSource = useRef(false);
  const zoneAt = (event: DragEvent<HTMLDivElement>) =>
    panelEntryDropZone(event.clientY, event.currentTarget.getBoundingClientRect());

  return (
    <div
      className={clsx("relative", className)}
      draggable={enabled}
      onDragStart={event => {
        isSource.current = true;
        event.dataTransfer.setData("text/plain", id);
        event.dataTransfer.effectAllowed = "move";
        // No translucent snapshot of the row under the cursor — the insertion
        // line below is the drop feedback the owner wants (iteration-3).
        suppressNativeDragImage(event);
      }}
      onDragEnd={() => { isSource.current = false; setZone(null); }}
      onDragOver={event => {
        if (!enabled || isSource.current) return;
        event.preventDefault();
        setZone(zoneAt(event));
      }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setZone(null); }}
      onDrop={event => {
        if (!enabled) return;
        event.preventDefault();
        const placement = zoneAt(event);
        setZone(null);
        const source = event.dataTransfer.getData("text/plain");
        const target = source ? panelEntryReorderTarget(ids, source, id, placement) : null;
        if (target) onReorder?.(source, target);
      }}
    >
      {zone && (
        <span
          aria-hidden
          data-composa-reorder-indicator={zone}
          // Same 2px accent insertion line the layer list paints, inset to the
          // panel's 16px gutter so the two surfaces read as one convention.
          className={clsx("pointer-events-none absolute left-[8px] right-[16px] h-[2px] bg-c-border-selected z-10", zone === "before" ? "top-0" : "bottom-0")}
        />
      )}
      {children}
    </div>
  );
}

// ─── Panel drag-handle entry anatomy ─────────────────────────────────────────
// Used for stackable sections: Fill · Stroke · Effects · Export.
// DragHandle · [content] · EyeToggle · RemoveButton

interface PanelEntryProps {
  children: ReactNode;
  onRemove?: () => void;
  onToggleVisible?: () => void;
  visible?: boolean;
  /** Whether to show the drag handle on the left */
  draggable?: boolean;
  hideLabel?: string;
  showLabel?: string;
  removeLabel?: string;
}

export function PanelEntry({
  children,
  onRemove,
  onToggleVisible,
  visible = true,
  draggable = true,
  hideLabel = "Hide",
  showLabel = "Show",
  removeLabel = "Remove",
}: PanelEntryProps) {
  return (
    // Canonical stackable-entry anatomy shared by Fill · Stroke · Effects · Export:
    // no left inset, a 16px grip column flush to the panel edge, fluid content,
    // then an 8px-padded action cluster (eye + remove) and a 16px right gutter.
    // `group/row` is the named group the grip and any hover-reveal affordances key
    // off, matching the Fill/Stroke rows so the whole file shares one convention.
    <div className="flex items-center h-[32px] pr-[16px] group/row">
      {/* Drag handle — the 16px column is always reserved so content alignment stays
          fixed; the grip glyph and grab cursor appear only when `draggable`, i.e. a
          stack with more than one reorderable item. */}
      <span className={clsx(
        "shrink-0 flex items-center justify-center size-[16px]",
        draggable && "opacity-0 group-hover/row:opacity-40 cursor-grab text-c-icon",
      )}>
        {draggable && (
          <svg width="6" height="10" viewBox="0 0 6 10" fill="none">
            <circle cx="1.5" cy="2" r="1" fill="currentColor" />
            <circle cx="4.5" cy="2" r="1" fill="currentColor" />
            <circle cx="1.5" cy="5" r="1" fill="currentColor" />
            <circle cx="4.5" cy="5" r="1" fill="currentColor" />
            <circle cx="1.5" cy="8" r="1" fill="currentColor" />
            <circle cx="4.5" cy="8" r="1" fill="currentColor" />
          </svg>
        )}
      </span>

      {/* Content — flex items-center so a dialog trigger wrapped in an inline-flex
          span (Effects dropdown, etc.) is centred on the row baseline rather than
          top-aligned by its line-box strut, matching the grip/eye/minus (#490). */}
      <div className="flex-1 min-w-0 flex items-center">{children}</div>

      {/* Action cluster — eye + remove rendered through the shared PanelActionBtn so
          every stackable section uses ONE visibility/remove control: identical 24px
          hit target, rounded-c-md corner, 16px lucide glyph, and always-visible
          remove. This replaces the bespoke rounded-c-sm / 14px-minus / hover-only
          remove buttons the Effects row used, reconciling it with Fill/Stroke (#460). */}
      <div className="shrink-0 flex items-center gap-[4px] pl-[8px]">
        <PanelActionBtn
          icon={visible ? <Eye size={16} strokeWidth={1.5} /> : <EyeOff size={16} strokeWidth={1.5} />}
          label={visible ? hideLabel : showLabel}
          onClick={onToggleVisible}
        />
        <PanelActionBtn
          icon={<Minus size={16} strokeWidth={1.5} />}
          label={removeLabel}
          onClick={onRemove}
        />
      </div>
    </div>
  );
}
