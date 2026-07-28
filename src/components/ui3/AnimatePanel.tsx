import { Fragment, useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, MonitorPlay, Clock, ArrowRight, ArrowDown, Type, Play, GripVertical } from "lucide-react";
import { PanelSection, PanelActionBtn, ScrollArea } from "./Panel";
import { Dropdown } from "./Dropdown";
import { ComboInput, NumericInput } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Button } from "./Button";
import { AnimationStylesDialog } from "./AnimationStylesDialog";
import { iconForSemantic } from "./IconSemantics";

// ─── Animate panel ──────────────────────────────────────────────────────────────
// The "Animate" tab body. Two always-present sections (Slide transition · Object
// animations). Both use the SHARED `AnimationCard`: a neutral row when collapsed,
// a selection-header card (the DS selected-content blue `bg-c-bg-selected` — the
// same token the timeline / nav rail / layer list use for selection — over a
// gray-bordered card, no chevron, no body bg) when expanded.

const FONT = "font-[family-name:var(--composa-font-family)]";
const SettingsIcon = iconForSemantic("settings");

type AnimKind = "In" | "Out" | "Action";

export interface ObjectAnimationItem {
  id?: string;
  elementId?: string;
  n: number;
  name: string;
  kind: AnimKind;
  duration: string;
  style?: string;
  buildDuration?: string;
  direction?: "left" | "right" | "up" | "down";
  delivery?: string;
  intensity?: "small" | "medium" | "large";
  /** Exact timeline-selected Animate unit. Takes precedence over element selection when opening cards. */
  focused?: boolean;
  selected?: boolean;
  /** Slide-local start of this action, in ms. Host-supplied (derived from the engine's
   *  order + duration + delay timing). When two actions on the same object both carry a
   *  `startMs`, the combined card DERIVES the signed "delay between" as the start-to-start
   *  offset (`following.startMs - preceding.startMs`) — see motion-mental-model.md. */
  startMs?: number;
}
export type ObjectAnimationPhase = "build-in" | "action" | "build-out";
export interface ObjectAnimationSequenceSettings { start: "on-click" | "automatically"; delayMs: number; }
export interface ObjectAnimationCallbacks {
  onAdd?: (phase: ObjectAnimationPhase) => void;
  onRemove?: (id: string) => void;
  onDurationChange?: (id: string, durationMs: number) => void;
  onStyleChange?: (id: string, style: string) => void;
  onDirectionChange?: (id: string, direction: "left" | "right" | "up" | "down") => void;
  onDeliveryChange?: (id: string, delivery: "all-at-once" | "by-object" | "by-word" | "by-character") => void;
  onIntensityChange?: (id: string, intensity: "small" | "medium" | "large") => void;
  onReorder?: (id: string, targetId: string, placement: "before" | "after" | "with") => void;
  /** Combined-card "delay between" edit. `gapMs` is the signed start-to-start offset the
   *  FOLLOWING action should have relative to the PRECEDING one — negative means overlap
   *  (the following action starts before the preceding one ends). The host maps this to a
   *  start-offset change on `followingId`; the value is NEVER clamped at this layer. */
  onDelayBetweenChange?: (precedingId: string, followingId: string, gapMs: number) => void;
  onStartChange?: (start: ObjectAnimationSequenceSettings["start"]) => void;
  onDelayChange?: (delayMs: number) => void;
  /** Play back every object animation on the current selection. Host-wired to real
   *  playback — the component only renders the trigger (see #179). */
  onPlayAllObjectAnimations?: () => void;
}

export const ACTION_STYLE_OPTIONS = ["move", "opacity", "rotate", "scale", "pulse", "jiggle", "bounce", "shake"] as const;

export type CompTransitionStyle = "none" | "fade" | "push" | "slide" | "wipe";
export type CompTransitionDirection = "left" | "right" | "up" | "down";
export type CompTransitionEasing = "linear" | "ease-in" | "ease-out" | "ease-in-out";
export interface CompTransitionSettings {
  style: CompTransitionStyle;
  direction: CompTransitionDirection;
  durationMs: number;
  easing: CompTransitionEasing;
}
export interface CompTransitionCallbacks {
  onStyleChange?: (value: CompTransitionStyle) => void;
  onDirectionChange?: (value: CompTransitionDirection) => void;
  onDurationChange?: (value: number) => void;
  onEasingChange?: (value: CompTransitionEasing) => void;
  onApplyToAll?: () => void;
}

const DEMO_ANIMS: ObjectAnimationItem[] = [
  { n: 1, name: "Motto", kind: "In",     duration: "0.6s", style: "Drift & Scale", buildDuration: "600ms", delivery: "By object" },
  { n: 2, name: "Body",  kind: "Out",    duration: "0.6s" },
  { n: 3, name: "Body",  kind: "Action", duration: "0.6s" },
];

// label (fixed) + control (fluid)
function LabeledRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-[8px]">
      <span className={clsx(FONT, "w-[52px] shrink-0 text-[11px] font-[450] leading-[16px] text-c-text-secondary")}>{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function KindGlyph({ kind }: { kind: AnimKind }) {
  const Icon = kind === "Action" ? ArrowDown : ArrowRight;
  return <Icon size={12} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />;
}

// ── Shared expandable animation card ──────────────────────────────────────────────
function AnimationCard({ icon, title, badge, expanded, selected = false, onToggle, onRemove, children }: {
  icon: ReactNode; title: string; badge?: ReactNode;
  expanded: boolean; selected?: boolean; onToggle: () => void; onRemove?: () => void; children?: ReactNode;
}) {
  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        aria-expanded={false}
        className={clsx(
          "h-[32px] w-full rounded-c-md border border-c-border flex items-center gap-[8px] px-[8px]",
          selected ? "bg-c-bg-selected hover:bg-c-bg-selected" : "bg-c-bg hover:bg-c-bg-hover",
        )}
      >
        <span className="shrink-0 flex text-c-icon">{icon}</span>
        <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] text-c-text text-left truncate")}>{title}</span>
        {badge}
      </button>
    );
  }
  return (
    <div className="rounded-c-md border border-c-border overflow-hidden">
      {/* selection header: the DS selected-content blue (bg-c-bg-selected, same as
          timeline / nav rail / layer list) over a gray-bordered card */}
      <div className="h-[32px] flex items-center gap-[8px] pl-[8px] pr-[6px] bg-c-bg-selected border-b border-c-border">
        <button onClick={onToggle} aria-expanded className="flex-1 min-w-0 flex items-center gap-[8px] h-full">
          <span className="shrink-0 flex text-c-icon">{icon}</span>
          <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] text-c-text text-left truncate")}>{title}</span>
        </button>
        {onRemove && (
          <button onClick={onRemove} aria-label="Remove" className="shrink-0 flex size-[24px] items-center justify-center rounded-c-sm text-c-icon hover:bg-black/10">
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>
      {children && <div className="flex flex-col gap-[8px] p-[8px]">{children}</div>}
    </div>
  );
}

const STYLE_LABELS: Record<CompTransitionStyle, string> = { none: "None", fade: "Fade", push: "Push", slide: "Slide", wipe: "Wipe" };
const DIRECTION_LABELS: Record<CompTransitionDirection, string> = { left: "Left", right: "Right", up: "Up", down: "Down" };
const EASING_LABELS: Record<CompTransitionEasing, string> = { linear: "Linear", "ease-in": "Ease in", "ease-out": "Ease out", "ease-in-out": "Ease in out" };

function ChoiceDropdown<T extends string>({ ariaLabel, value, options, labels, onChange }: { ariaLabel?: string; value: T; options: readonly T[]; labels: Record<T, string>; onChange?: (value: T) => void }) {
  return <PopoverMenu align="right" className="w-full" trigger={<Dropdown ariaLabel={ariaLabel} value={labels[value]} fullWidth />}>
    {close => <Menu minWidth={160}>{options.map(option => <MenuRow key={option} type="checkmark" selectionRole="radio" checked={option === value} label={labels[option]} onClick={() => { onChange?.(option); close(); }} />)}</Menu>}
  </PopoverMenu>;
}

// ── Composition transition ───────────────────────────────────────────────────────
function CompTransitionSection({ value, callbacks, contextKey, selectionType, animationDelay = false }: { value?: CompTransitionSettings; callbacks?: CompTransitionCallbacks; contextKey?: string; selectionType?: "slide" | "element"; animationDelay?: boolean }) {
  // #222: the settings ("starts automatically" + delay) affordance is gated behind the
  // `animationDelay` capability (default OFF). When off, the settings icon is not rendered.
  const settingsAction = animationDelay
    ? <PanelActionBtn icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />} label="Comp transition settings" />
    : undefined;
  const [demo, setDemo] = useState<CompTransitionSettings>({ style: "fade", direction: "right", durationMs: 300, easing: "ease-out" });
  const controlled = value !== undefined;
  const rendered = value ?? demo;
  // Comp transition is a slide-scoped property. It is the default-expanded/focused
  // card only when a SLIDE is selected. When an element is selected it still reflects
  // the slide's real transition, but stays collapsed (never the focused card).
  const shouldOpen = selectionType !== "element" && rendered.style !== "none";
  const [open, setOpen] = useState(shouldOpen);
  useEffect(() => {
    setOpen(shouldOpen);
  }, [contextKey, selectionType]);
  useEffect(() => { if (value?.style === "none") setOpen(false); }, [value?.style]);
  const update = (patch: Partial<CompTransitionSettings>) => {
    if (!controlled) setDemo(current => ({ ...current, ...patch }));
  };
  const setStyle = (style: CompTransitionStyle) => { update({ style }); callbacks?.onStyleChange?.(style); };
  const directional = rendered.style === "push" || rendered.style === "slide" || rendered.style === "wipe";
  if (rendered.style === "none" && !open) return (
    <PanelSection title="Comp transition" rightActions={settingsAction}>
      <div className="px-[16px] pt-[3px] pb-[8px]">
        <button onClick={() => setOpen(true)} className="h-[32px] w-full rounded-c-md border border-c-border bg-c-bg flex items-center gap-[8px] px-[8px] hover:bg-c-bg-hover">
          <MonitorPlay size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
          <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>None</span>
        </button>
      </div>
    </PanelSection>
  );
  return (
    <PanelSection title="Comp transition" rightActions={settingsAction}>
      <div className="px-[16px] pt-[3px] pb-[8px]">
        <AnimationCard
          icon={<MonitorPlay size={16} strokeWidth={1.5} />}
          title={STYLE_LABELS[rendered.style]}
          badge={rendered.style === "none" ? undefined : <span className={clsx(FONT, "text-[9px] text-c-text-secondary")}>{rendered.durationMs}ms</span>}
          expanded={open}
          onToggle={() => setOpen(o => !o)}
          onRemove={rendered.style === "none" ? undefined : () => { setStyle("none"); setOpen(false); }}
        >
          <LabeledRow label="Style"><ChoiceDropdown value={rendered.style} options={["none", "fade", "push", "slide", "wipe"]} labels={STYLE_LABELS} onChange={setStyle} /></LabeledRow>
          {rendered.style !== "none" && <>
            {directional && <LabeledRow label="Direction"><ChoiceDropdown value={rendered.direction} options={["left", "right", "up", "down"]} labels={DIRECTION_LABELS} onChange={direction => { update({ direction }); callbacks?.onDirectionChange?.(direction); }} /></LabeledRow>}
            <LabeledRow label="Easing"><ChoiceDropdown value={rendered.easing} options={["linear", "ease-in", "ease-out", "ease-in-out"]} labels={EASING_LABELS} onChange={easing => { update({ easing }); callbacks?.onEasingChange?.(easing); }} /></LabeledRow>
            <LabeledRow label="Duration"><NumericInput value={rendered.durationMs} min={0} suffix="ms" className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} commitOnBlur onChange={durationMs => { update({ durationMs }); callbacks?.onDurationChange?.(durationMs); }} /></LabeledRow>
            <Button label="Apply to all compositions" variant="Secondary" size="wide" onClick={callbacks?.onApplyToAll} />
          </>}
        </AnimationCard>
      </div>
    </PanelSection>
  );
}

// ── Object animations ─────────────────────────────────────────────────────────────
function DurationPill({ duration, kind }: { duration: string; kind: AnimKind }) {
  return (
    <div className="flex items-center rounded-c-sm bg-c-bg-secondary overflow-hidden shrink-0">
      <span className={clsx(FONT, "px-[6px] py-[1px] text-[9px] leading-[14px] text-c-text-secondary")}>{duration}</span>
      <span className={clsx(FONT, "px-[6px] py-[1px] text-[9px] leading-[14px] text-c-text border-l border-c-border")}>{kind}</span>
    </div>
  );
}

// ── Combined card (multiple actions on ONE object) ─────────────────────────────────
// When an object carries more than one action, its per-action cards render as normal
// action cards (NOT boxed in a heavy container) and a thin VERTICAL CONNECTOR LINE
// links them — that line is what now communicates "these are the same object" (owner
// feedback: the container grouping felt too heavy; no bordered box, no group header /
// "N actions" label). When a "delay between" is present the connector breaks around the
// Between control (line from the preceding card → Between → line into the following
// card); with no delay the line is continuous. N same-object cards each labelled "1" was
// the bug this replaces. Objects with a single action (or no shared elementId) render
// unchanged (a plain card, no connector).
interface AnimationRowRef { item: ObjectAnimationItem; index: number; }
type AnimationUnit =
  | { kind: "single"; row: AnimationRowRef }
  | { kind: "combined"; elementId: string; rows: AnimationRowRef[] };

export function buildAnimationUnits(anims: ObjectAnimationItem[]): AnimationUnit[] {
  const counts = new Map<string, number>();
  for (const item of anims) if (item.elementId) counts.set(item.elementId, (counts.get(item.elementId) ?? 0) + 1);
  const combinedByElement = new Map<string, Extract<AnimationUnit, { kind: "combined" }>>();
  const units: AnimationUnit[] = [];
  anims.forEach((item, index) => {
    const row: AnimationRowRef = { item, index };
    const elementId = item.elementId;
    if (elementId && (counts.get(elementId) ?? 0) >= 2) {
      let unit = combinedByElement.get(elementId);
      if (!unit) { unit = { kind: "combined", elementId, rows: [] }; combinedByElement.set(elementId, unit); units.push(unit); }
      unit.rows.push(row);
    } else {
      units.push({ kind: "single", row });
    }
  });
  return units;
}

/** The signed start-to-start "delay between" two consecutive actions in a combined card.
 *  gap=0 fire together · gap>0 stagger · gap<0 overlap. Never clamped — `min` is left unset
 *  so the numeric field accepts negatives (motion-mental-model.md: "Gap is measured
 *  start-to-start (locked)"). Owner refinement: no leading label — a compact, value-hugging
 *  field centered in the connector gap, reading like `600ms between` (trailing text). */
function DelayBetweenRow({ precedingId, followingId, gapMs, onChange }: {
  precedingId: string; followingId: string; gapMs: number;
  onChange?: ObjectAnimationCallbacks["onDelayBetweenChange"];
}) {
  // FieldShell is `w-full`, so the compact width is imposed by a fixed-width wrapper
  // (the field fills it) and the whole thing is centered in the connector gap.
  return (
    <div data-delay-between-preceding={precedingId} data-delay-between-following={followingId} className="flex justify-center">
      <div className="w-[124px]">
        <NumericInput ariaLabel="Delay between" value={gapMs} suffix="ms between" commitOnBlur
          iconLead={<Clock size={16} strokeWidth={1.5} />}
          onChange={ms => onChange?.(precedingId, followingId, ms)} />
      </div>
    </div>
  );
}

/** A vertical segment of the connector line, using the DS border token. Centered on the
 *  card column so it reads as a single line running through the stack. */
function ConnectorSegment({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("w-px self-center bg-c-border", className)} />;
}

/** Sequential index for a UNIT in the object-animations list. A unit is either a
 *  standalone action OR a whole combined card, so a combined card carries exactly ONE
 *  number for the entire card (NOT one per action-row inside it) — the fix for #78's
 *  over-correction that dropped all numbers. Small muted label sitting on top of the
 *  unit, matching the pre-#78 placement but promoted from the row level to the unit
 *  level. `pl-[2px]` keeps it aligned to the card's left edge so the card can still take
 *  the full available width. */
function UnitNumberLabel({ n }: { n: number }) {
  return (
    <div data-animation-unit-number={n} className={clsx(FONT, "h-[16px] flex items-center pl-[2px] text-[9px] font-[450] leading-[14px] tracking-[0.045px] text-c-text-secondary")}>{n}</div>
  );
}

function CombinedAnimationCard({ elementId, rows, renderRow, onDelayBetweenChange }: {
  elementId: string;
  rows: AnimationRowRef[];
  renderRow: (item: ObjectAnimationItem, index: number, tintOverride?: boolean) => ReactNode;
  onDelayBetweenChange?: ObjectAnimationCallbacks["onDelayBetweenChange"];
}) {
  // Two-tier selection: an object selection lights EVERY row (no focused sibling); a
  // single-action (focused) selection lights ONLY that row. A lit sibling next to a
  // focused row reads as "also selected" and is wrong — so focus suppresses sibling tint.
  // No container box or header now — the connector line alone carries the grouping, so
  // the wrapper is a bare flex column (crucially, no `overflow-hidden`: that used to clip
  // the hover-revealed reorder drag handle sitting at `-left-[16px]`).
  const groupFocused = rows.some(row => row.item.focused);
  const groupSelected = rows.some(row => row.item.selected);
  const rowId = (row: AnimationRowRef) => row.item.id ?? String(row.index);
  return (
    <div
      data-combined-card-element-id={elementId}
      data-animation-card-state={groupFocused ? "focused" : groupSelected ? "selected" : "neutral"}
      className="flex flex-col"
    >
      {rows.map((row, k) => {
        const tint = groupFocused ? !!row.item.focused : !!row.item.selected;
        const preceding = rows[k - 1];
        const hasGap = k > 0 && preceding !== undefined
          && Number.isFinite(preceding.item.startMs) && Number.isFinite(row.item.startMs);
        const gapMs = hasGap ? (row.item.startMs! - preceding!.item.startMs!) : 0;
        return (
          <Fragment key={rowId(row)}>
            {k > 0 && (
              hasGap
                // Delay present: the line runs FLUSH out of the preceding card's bottom
                // edge, meets the Between control cleanly (line → control → line, all
                // touching), then continues FLUSH into the following card's top edge. No
                // vertical padding on the wrapper — a gap there would detach the line from
                // the cards, so the two rows would stop reading as one connected unit.
                ? (
                  <div data-combined-connector="gap" className="flex flex-col">
                    <ConnectorSegment className="h-[10px]" />
                    <DelayBetweenRow
                      precedingId={rowId(preceding!)}
                      followingId={rowId(row)}
                      gapMs={gapMs}
                      onChange={onDelayBetweenChange}
                    />
                    <ConnectorSegment className="h-[10px]" />
                  </div>
                )
                // No delay: one continuous line that TOUCHES both cards — flush to the
                // preceding card's bottom edge and the following card's top edge (no
                // padding gap), so the pair reads as a single connected unit.
                : (
                  <div data-combined-connector="continuous" className="flex justify-center">
                    <ConnectorSegment className="h-[16px]" />
                  </div>
                )
            )}
            {renderRow(row.item, row.index, tint)}
          </Fragment>
        );
      })}
    </div>
  );
}

function ObjectAnimationsSection({ anims, callbacks, settings = { start: "on-click", delayMs: 0 }, addablePhases = ["build-in", "action", "build-out"], contextKey, selectionType, animationDelay = false }: {
  anims: ObjectAnimationItem[]; callbacks?: ObjectAnimationCallbacks; settings?: ObjectAnimationSequenceSettings; addablePhases?: ObjectAnimationPhase[]; contextKey?: string; selectionType?: "slide" | "element"; animationDelay?: boolean;
}) {
  // Object selection is deliberately broader than Animate-unit focus. Every card
  // belonging to the selected object receives the selected tint, but selection
  // alone never chooses one card to expand. Only an exact timeline preset-bar
  // selection (`focused`) opens its matching card.
  const focusedIndex = anims.findIndex(a => a.focused);
  const defaultExpandedId = selectionType === "element" && focusedIndex >= 0
    ? (anims[focusedIndex].id ?? String(focusedIndex))
    : null;
  const [expanded, setExpanded] = useState<string | null>(defaultExpandedId);
  // Single open-dialog key → sibling-dialog exclusivity: opening one row's Style
  // dialog closes any other. Reset when the selection context changes so a stale
  // anchored dialog never survives a new selection.
  const [activeStyleDialog, setActiveStyleDialog] = useState<string | null>(null);
  useEffect(() => { setExpanded(defaultExpandedId); setActiveStyleDialog(null); }, [contextKey, selectionType, defaultExpandedId]);
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ targetId: string; placement: "before" | "after" | "with" } | null>(null);
  const phaseOptions: Array<{ value: ObjectAnimationPhase; label: string }> = [
    { value: "build-in", label: "Build in" }, { value: "action", label: "Action" }, { value: "build-out", label: "Build out" },
  ];
  const addMenu = (close: () => void) => (
    <Menu minWidth={140}>
      {phaseOptions.map(option => <MenuRow key={option.value} type="simple" label={option.label} disabled={!addablePhases.includes(option.value)} onClick={() => { callbacks?.onAdd?.(option.value); close(); }} />)}
    </Menu>
  );
  return (
    <PanelSection
      title="Object animations"
      rightActions={
        <>
          {/* #179: plays back all object animations on the current selection. Gated the
              same way as Add Action — disabled when there are no animations to
              play. Host wires `onPlayAllObjectAnimations` to real playback. */}
          <PanelActionBtn icon={<Play size={16} strokeWidth={1.5} />} label="Play all animations" disabled={anims.length === 0} onClick={callbacks?.onPlayAllObjectAnimations} />
          {/* #222: settings ("starts automatically" + delay) gated behind the
              `animationDelay` capability (default OFF) — not rendered when off. */}
          {animationDelay && <PanelActionBtn icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />} label="Object animation settings" />}
        </>
      }
    >
      {/* Composa#387: one persistent, topmost authoring control. It opens the
          existing phase menu so Build In / Action / Build Out semantics remain
          unchanged, while every authored card stacks beneath the same control. */}
      <div className="px-[16px] pt-[3px] pb-[8px]">
        <PopoverMenu
          align="right"
          className="w-full"
          trigger={
            <Button
              label="Add Action"
              variant="Secondary"
              size="wide"
              iconLead="left"
              icon={<Plus size={14} strokeWidth={1.5} />}
              disabled={addablePhases.length === 0}
              className="w-full"
            />
          }
        >
          {addMenu}
        </PopoverMenu>
      </div>
      {anims.length === 0 ? (
        <p className={clsx(FONT, "px-[16px] pb-[8px] text-[11px] leading-[16px] text-c-text-secondary")}>
          Select an object on the slide, then click the add button to animate it.
        </p>
      ) : (
        <div className="px-[16px] pb-[8px] flex flex-col gap-[8px]">
          {(() => {
            // Per-action row renderer. `tintOverride` lets a combined card impose the
            // two-tier highlight (object → all rows; focused action → only that row),
            // while standalone rows fall back to the item's own `selected` flag.
            const renderActionRow = (a: ObjectAnimationItem, i: number, tintOverride?: boolean) => {
            const id = a.id ?? String(i);
            const tinted = tintOverride ?? !!a.selected;
            const phase = a.kind === "In" ? "build-in" : a.kind === "Out" ? "build-out" : "action";
            const phaseLabel = phase === "build-in" ? "Build in" : phase === "build-out" ? "Build out" : "Action";
            const styleOptions = phase === "build-in" ? ["fade-in", "move-in", "slide-in", "wipe-in"] : phase === "build-out" ? ["fade-out", "move-out", "slide-out", "wipe-out"] : ACTION_STYLE_OPTIONS;
            const directional = !!a.style && (/^(move|slide|wipe)-/.test(a.style) || (phase === "action" && a.style === "move"));
            const styleLabels = Object.fromEntries(styleOptions.map(style => [style, style.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")])) as Record<string, string>;
            const deliveryLabels = { "all-at-once": "All at once", "by-object": "By object", "by-word": "By word", "by-character": "By character" };
            const deliveryValue = Object.entries(deliveryLabels).find(([, label]) => label === a.delivery)?.[0] as keyof typeof deliveryLabels | undefined;
            const sequenceTarget = (placement: "before" | "with" | "after") => {
              const active = dropTarget?.targetId === id && dropTarget.placement === placement;
              const label = placement[0].toUpperCase() + placement.slice(1);
              return (
                <div
                  key={placement}
                  data-animation-sequence-target={placement}
                  data-animation-sequence-target-for={id}
                  className={clsx(
                    FONT,
                    "relative flex h-[24px] flex-1 items-center justify-center rounded-c-sm border text-[10px] font-[450] leading-[14px]",
                    active
                      ? "border-c-border-selected bg-c-bg-selected text-c-text"
                      : "border-c-border bg-c-bg-secondary text-c-text-secondary",
                  )}
                  onDragEnter={event => {
                    if (!dragged || dragged === id) return;
                    event.preventDefault();
                    event.stopPropagation();
                    setDropTarget({ targetId: id, placement });
                  }}
                  onDragOver={event => {
                    if (!dragged || dragged === id) return;
                    event.preventDefault();
                    event.stopPropagation();
                    event.dataTransfer.dropEffect = "move";
                    if (!active) setDropTarget({ targetId: id, placement });
                  }}
                  onDrop={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!dragged || dragged === id) return;
                    callbacks?.onReorder?.(dragged, id, placement);
                    setDropTarget(null);
                    setDragged(null);
                  }}
                >
                  {label}
                  {active && (
                    <span
                      aria-hidden
                      data-animation-sequence-drop-indicator={placement}
                      className={clsx(
                        "pointer-events-none absolute bg-c-border-selected",
                        placement === "before" && "-top-[3px] left-[3px] right-[3px] h-[2px]",
                        placement === "after" && "-bottom-[3px] left-[3px] right-[3px] h-[2px]",
                        placement === "with" && "inset-[2px] rounded-c-xs border border-c-border-selected bg-transparent",
                      )}
                    />
                  )}
                </div>
              );
            };
            return <div
              key={id}
              data-animation-card-id={id}
              data-animation-element-id={a.elementId}
              data-animation-card-state={a.focused ? "focused" : tinted ? "selected" : "neutral"}
              className="group relative min-w-0 flex flex-col gap-[2px]"
            >
              {/* Drag handle — the reorder control. Rendered as a hover-revealed overlay
                  in the panel's own left padding (negative offset) so it reserves NO
                  horizontal space: the card sits FLUSH at the container's left edge at
                  rest, and the grip appears on hover (vertically centered on the 32px card)
                  without shifting the card. Owner refinement: no build-order number label. */}
              <button type="button" draggable={!!callbacks?.onReorder} aria-label={`Drag ${a.name} animation`} className="hidden group-hover:flex absolute -left-[16px] top-[8px] size-[16px] items-center justify-center cursor-grab text-c-icon-secondary"
                onDragStart={event => {
                  setDragged(id);
                  setDropTarget(null);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", id);
                }}
                onDragEnd={() => { setDragged(null); setDropTarget(null); }}>
                <GripVertical size={14} />
              </button>
              {dragged && dragged !== id && (
                <div
                  role="group"
                  aria-label={`Place animation relative to ${a.name}`}
                  data-animation-sequence-targets={id}
                  className="flex gap-[4px] rounded-c-md border border-c-border bg-c-bg p-[4px]"
                >
                  {sequenceTarget("before")}
                  {sequenceTarget("with")}
                  {sequenceTarget("after")}
                </div>
              )}
              <AnimationCard
                  icon={<Type size={14} strokeWidth={1.5} />}
                  title={a.name}
                  badge={<><KindGlyph kind={a.kind} /><DurationPill duration={a.duration} kind={a.kind} /></>}
                  expanded={expanded === id}
                  selected={tinted}
                  onToggle={() => { setExpanded(current => current === id ? null : id); setActiveStyleDialog(null); }}
                  onRemove={() => callbacks?.onRemove?.(id)}
                >
                  <div className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{phaseLabel}</div>
                  <LabeledRow label="Style">
                    <AnimationStylesDialog
                      open={activeStyleDialog === id}
                      onClose={() => setActiveStyleDialog(null)}
                      title={`${phaseLabel} styles`}
                      groups={[{ label: phase === "action" ? "Emphasis" : "Basic", options: styleOptions.map(style => ({ value: style, label: styleLabels[style] })) }]}
                      value={a.style ?? styleOptions[0]}
                      onSelect={style => { callbacks?.onStyleChange?.(id, style); setActiveStyleDialog(null); }}
                      trigger={<Dropdown
                        ariaLabel={`Style: ${styleLabels[a.style ?? styleOptions[0]]}`}
                        aria-haspopup="dialog"
                        value={styleLabels[a.style ?? styleOptions[0]]}
                        state={activeStyleDialog === id ? "active" : "default"}
                        fullWidth
                        onClick={() => setActiveStyleDialog(current => current === id ? null : id)}
                      />}
                    />
                  </LabeledRow>
                  <LabeledRow label="Duration"><NumericInput value={Number.parseFloat(a.buildDuration ?? a.duration) * (a.buildDuration?.includes("ms") ? 1 : 1000)} min={0} suffix="ms" commitOnBlur className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} onChange={durationMs => callbacks?.onDurationChange?.(id, durationMs)} /></LabeledRow>
                  {directional && <LabeledRow label="Direction"><ChoiceDropdown value={a.direction ?? "left"} options={["left", "right", "up", "down"]} labels={{ left: phase === "build-out" ? "To left" : "From left", right: phase === "build-out" ? "To right" : "From right", up: phase === "build-out" ? "To top" : "From top", down: phase === "build-out" ? "To bottom" : "From bottom" }} onChange={direction => callbacks?.onDirectionChange?.(id, direction)} /></LabeledRow>}
                  {deliveryValue && <LabeledRow label="Delivery"><ChoiceDropdown value={deliveryValue} options={["all-at-once", "by-object", "by-word", "by-character"]} labels={deliveryLabels} onChange={delivery => callbacks?.onDeliveryChange?.(id, delivery)} /></LabeledRow>}
                  {phase === "action" && <LabeledRow label="Intensity"><ChoiceDropdown ariaLabel="Intensity" value={a.intensity ?? "medium"} options={["small", "medium", "large"]} labels={{ small: "Small", medium: "Medium", large: "Large" }} onChange={intensity => callbacks?.onIntensityChange?.(id, intensity)} /></LabeledRow>}
                </AnimationCard>
            </div>;
            };
            // Group each object's actions into ONE combined card; single-action objects
            // (or rows with no shared elementId) render standalone, exactly as before.
            // Each UNIT (a standalone action OR a whole combined card) carries a single
            // sequential number: a combined card is ONE number, not one per row. The label
            // sits on top of the unit, outside the card's own `group` box so it never
            // shifts the flush-left card or the hover-revealed drag handle.
            return buildAnimationUnits(anims).map((unit, unitIndex) => {
              const unitNumber = unitIndex + 1;
              const key = unit.kind === "combined"
                ? `combined:${unit.elementId}`
                : (unit.row.item.id ?? String(unit.row.index));
              return (
                <div key={key} data-animation-unit={unitNumber} className="flex flex-col">
                  <UnitNumberLabel n={unitNumber} />
                  {unit.kind === "combined"
                    ? <CombinedAnimationCard
                        elementId={unit.elementId}
                        rows={unit.rows}
                        renderRow={renderActionRow}
                        onDelayBetweenChange={callbacks?.onDelayBetweenChange}
                      />
                    : renderActionRow(unit.row.item, unit.row.index)}
                </div>
              );
            });
          })()}
          {/* #222: the "starts automatically" + delay authoring block is gated behind the
              `animationDelay` capability (default OFF). When off it is not rendered, so no
              dangling start/delay state is shown; the delay is removed from the default path. */}
          {animationDelay && (
            <div className="flex flex-col gap-[8px] pt-[4px] border-t border-c-border">
              <LabeledRow label="Start"><ChoiceDropdown value={settings.start} options={["on-click", "automatically"]} labels={{ "on-click": "On click", automatically: "Automatically" }} onChange={callbacks?.onStartChange} /></LabeledRow>
              <LabeledRow label="Delay"><NumericInput value={settings.delayMs} min={0} suffix="ms" commitOnBlur className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} onChange={callbacks?.onDelayChange} /></LabeledRow>
            </div>
          )}
        </div>
      )}
    </PanelSection>
  );
}

export function AnimatePanel({ anims = DEMO_ANIMS, compTransition, compTransitionCallbacks, contextKey, selectionType, objectAnimationCallbacks, objectAnimationSettings, addablePhases, animationDelay = false }: {
  anims?: ObjectAnimationItem[]; compTransition?: CompTransitionSettings; compTransitionCallbacks?: CompTransitionCallbacks; contextKey?: string; selectionType?: "slide" | "element";
  objectAnimationCallbacks?: ObjectAnimationCallbacks; objectAnimationSettings?: ObjectAnimationSequenceSettings; addablePhases?: ObjectAnimationPhase[];
  /** #222: host-owned capability gating the animation "starts automatically" + delay
   *  authoring (and its settings icon). Default OFF — the delay is removed from the
   *  default path and recoverable by flipping this flag on. */
  animationDelay?: boolean;
}) {
  return (
    <ScrollArea>
      <CompTransitionSection value={compTransition} callbacks={compTransitionCallbacks} contextKey={contextKey} selectionType={selectionType} animationDelay={animationDelay} />
      <ObjectAnimationsSection anims={anims} callbacks={objectAnimationCallbacks} settings={objectAnimationSettings} addablePhases={addablePhases} contextKey={contextKey} selectionType={selectionType} animationDelay={animationDelay} />
    </ScrollArea>
  );
}
