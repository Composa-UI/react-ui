import { useEffect, useState, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, MonitorPlay, Clock, Type, Play, GripVertical } from "lucide-react";
import { PanelSection, PanelActionBtn, ScrollArea } from "./Panel";
import { Dropdown } from "./Dropdown";
import { ComboInput, NumericInput } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Button } from "./Button";
import { AnimationStylesDialog } from "./AnimationStylesDialog";
import { iconForSemantic } from "./IconSemantics";
import { EASING_PRESETS, easingPresetLabel, type EasingPreset, type NamedEasingPreset } from "./easing";

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
  /** Scheduled start in composition-local milliseconds, used by the connector between sequence ranks. */
  startMs?: number;
  style?: string;
  buildDuration?: string;
  direction?: "left" | "right" | "up" | "down";
  delivery?: string;
  intensity?: "small" | "medium" | "large";
  /** Exact timeline-selected Animate unit. Takes precedence over element selection when opening cards. */
  focused?: boolean;
  selected?: boolean;
  /** Timing curve this preset runs on. Host-supplied; when absent the card falls back to
   *  the engine's per-phase default (build-in → ease-out · action → linear · build-out →
   *  ease-in, `engine/easing-presets.ts` OBJECT_ANIMATION_PHASE_EASING) so the row reads
   *  the curve the preset actually runs on rather than a made-up one. */
  easing?: EasingPreset;
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
  /** Start-to-start offset within a shared sequence rank; only the target changes. */
  onStartOffsetChange?: (referenceId: string, targetId: string, offsetMs: number) => void;
  onDelayBetweenChange?: (precedingId: string, followingId: string, delayMs: number) => void;
  /** A house easing preset picked on the card. Every preset card offers this, not only the
   *  bounce-style actions (iteration-2 RP-10).
   *  REQUIRED to see the control: the Easing row renders only when this is supplied, so an
   *  unwired host shows no Easing row rather than one that silently discards the pick. */
  onEasingChange?: (id: string, preset: NamedEasingPreset) => void;
  /** "Custom…" — the host opens the EXISTING custom-easing editor (`EasingInspectorSection`)
   *  scoped to this animation. The card deliberately does NOT nest a second curve editor;
   *  there is one custom-easing surface in the product and this is a route into it.
   *  REQUIRED to see the row: "Custom…" renders only when this is supplied. It is a route
   *  into a host surface, so a host that does not own that surface must not advertise it
   *  (iteration-3: "clicking on the custom menu option does nothing"). */
  onCustomEasingRequest?: (id: string) => void;
  onStartChange?: (start: ObjectAnimationSequenceSettings["start"]) => void;
  onDelayChange?: (delayMs: number) => void;
  /** Play back every object animation on the current selection. Host-wired to real
   *  playback — the component only renders the trigger (see #179). */
  onPlayAllObjectAnimations?: () => void;
}

export const ACTION_STYLE_OPTIONS = ["move", "opacity", "rotate", "scale", "pulse", "jiggle", "bounce", "shake"] as const;

export type CompTransitionStyle = "none" | "fade" | "push" | "slide" | "wipe";
export type CompTransitionDirection = "left" | "right" | "up" | "down";
export type CompTransitionEasing = EasingPreset;
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
  onEasingChange?: (value: NamedEasingPreset) => void;
  /** Route Custom into the host-owned canonical Easing inspector. */
  onCustomEasingRequest?: () => void;
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
function ChoiceDropdown<T extends string>({ ariaLabel, value, options, labels, onChange }: { ariaLabel?: string; value: T; options: readonly T[]; labels: Record<T, string>; onChange?: (value: T) => void }) {
  return <PopoverMenu align="right" className="w-full" trigger={<Dropdown ariaLabel={ariaLabel} value={labels[value]} fullWidth />}>
    {close => <Menu>{options.map(option => <MenuRow key={option} type="checkmark" selectionRole="radio" checked={option === value} label={labels[option]} onClick={() => { onChange?.(option); close(); }} />)}</Menu>}
  </PopoverMenu>;
}

function TransitionEasingChoice({ value, callbacks }: { value: CompTransitionEasing; callbacks?: CompTransitionCallbacks }) {
  return (
    <PopoverMenu align="right" className="w-full" trigger={<Dropdown ariaLabel="Transition easing" value={easingPresetLabel(value)} fullWidth />}>
      {close => <Menu>
        {EASING_PRESETS.map(preset => <MenuRow key={preset.value} type="checkmark" selectionRole="radio"
          checked={value === preset.value} label={preset.label}
          onClick={() => { callbacks?.onEasingChange?.(preset.value); close(); }} />)}
        {callbacks?.onCustomEasingRequest && <MenuRow type="divider" />}
        {callbacks?.onCustomEasingRequest && <MenuRow type="checkmark" selectionRole="radio" checked={value === "custom"} label="Custom…"
          onClick={() => { callbacks.onCustomEasingRequest?.(); close(); }} />}
      </Menu>}
    </PopoverMenu>
  );
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
            <LabeledRow label="Easing"><TransitionEasingChoice value={rendered.easing} callbacks={callbacks} /></LabeledRow>
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

// ── Per-card easing (RP-10) ────────────────────────────────────────────────────────
// Easing is a property of EVERY preset card, not just the bounce action. The card offers
// the house set (`EASING_PRESETS`) and routes "Custom…" back to the host, which opens the
// one custom-easing editor the product already has (`EasingInspectorSection`). Nesting a
// second curve editor inside a 32px-row card would fork that surface.

/** Curve a preset runs on when the host supplies none. Mirrors the engine's
 *  OBJECT_ANIMATION_PHASE_EASING (engine/easing-presets.ts) so an unwired card shows the
 *  curve the animation actually plays with instead of a placeholder. */
const PHASE_DEFAULT_EASING: Record<ObjectAnimationPhase, EasingPreset> = {
  "build-in": "ease-out",
  action: "linear",
  "build-out": "ease-in",
};

// iteration-3: "Easing is nice but clicking on the custom menu option does nothing."
// Both halves of this control render only when the host has actually wired them.
// A menu row that closes the menu and changes nothing is the bug being fixed, and a
// component cannot fix it by disabling the row — a greyed control still promises a
// capability. So the rule here is one rule, applied to both halves: RENDER WHAT THE
// HOST WIRED.
//
//   no `onEasingChange`        → no Easing row at all
//   no `onCustomEasingRequest` → preset rows only, no "Custom…"
//
// This is deliberately not a deletion. The contract, the row and the tests stay, so the
// day a host owns a per-animation curve the control lights up with no change here. As of
// this commit no host wires either one (composa's InspectorPanel objectAnimationCallbacks
// supplies neither), because the engine has nowhere to store a per-animation easing —
// `ObjectAnimation` has no `easing` field and the curve is read from a per-phase constant.
// Until that field exists the honest thing for this package to show is nothing.
function EasingChoice({ id, value, callbacks }: { id: string; value: EasingPreset; callbacks?: ObjectAnimationCallbacks }) {
  const onCustom = callbacks?.onCustomEasingRequest;
  return (
    <PopoverMenu align="right" className="w-full" trigger={
      <Dropdown ariaLabel="Easing" aria-haspopup="menu" value={easingPresetLabel(value)} fullWidth />
    }>
      {close => <Menu>
        {EASING_PRESETS.map(preset => <MenuRow key={preset.value} type="checkmark" selectionRole="radio"
          checked={value === preset.value} label={preset.label}
          onClick={() => { callbacks?.onEasingChange?.(id, preset.value); close(); }} />)}
        {onCustom && <MenuRow type="divider" />}
        {onCustom && <MenuRow type="checkmark" selectionRole="radio" checked={value === "custom"} label="Custom…"
          onClick={() => { onCustom(id); close(); }} />}
      </Menu>}
    </PopoverMenu>
  );
}

// ── Sequence ranks ────────────────────────────────────────────────────────────────
// The engine's `ObjectAnimation.order` is the one grouping truth: distinct ranks are
// sequential, while cards sharing a rank are simultaneous. A shared rank uses one
// sequence number; it is not a bordered container. Dragging onto its `With` target
// means simultaneous, while the explicit
// plus-spaces between ranks create standalone sequential ranks.

/** The block's ordinal. Small muted label sitting on top of the card, outside the card's
 *  own `group` box so it never shifts the flush-left card or the hover-revealed drag
 *  handle. `pl-[2px]` keeps it aligned to the card's left edge. */
function BlockNumberLabel({ n }: { n: number }) {
  return (
    <div data-animation-block-number={n} className={clsx(FONT, "h-[16px] flex items-center pl-[2px] text-[9px] font-[450] leading-[14px] tracking-[0.045px] text-c-text-secondary")}>{n}</div>
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
  useEffect(() => {
    if (!dragged || typeof window === "undefined") return;
    const cancelPointerDrag = () => { setDragged(null); setDropTarget(null); };
    window.addEventListener("pointerup", cancelPointerDrag);
    window.addEventListener("pointercancel", cancelPointerDrag);
    return () => {
      window.removeEventListener("pointerup", cancelPointerDrag);
      window.removeEventListener("pointercancel", cancelPointerDrag);
    };
  }, [dragged]);
  const phaseOptions: Array<{ value: ObjectAnimationPhase; label: string }> = [
    { value: "build-in", label: "Build in" }, { value: "action", label: "Action" }, { value: "build-out", label: "Build out" },
  ];
  const addMenu = (close: () => void) => (
    <Menu>
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
            // Two-tier selection is independent from sequence grouping:
            // an object selection lights every row belonging to that object, but focusing
            // ONE action lights only that row — a lit sibling beside the focused row reads
            // as "also selected" and is wrong.
            const focusedElementIds = new Set(anims.flatMap(a => a.focused && a.elementId ? [a.elementId] : []));
            const sequenceGroups = anims.reduce<Array<{ rank: number; rows: Array<{ animation: ObjectAnimationItem; index: number; id: string }> }>>((groups, animation, index) => {
              const row = { animation, index, id: animation.id ?? String(index) };
              const group = groups.find(candidate => candidate.rank === animation.n);
              if (group) group.rows.push(row);
              else groups.push({ rank: animation.n, rows: [row] });
              return groups;
            }, []).sort((left, right) => left.rank - right.rank);

            const finishDrop = (targetId: string, placement: "before" | "after" | "with") => {
              if (!dragged || dragged === targetId) return;
              callbacks?.onReorder?.(dragged, targetId, placement);
              setDropTarget(null);
              setDragged(null);
            };
            const targetHandlers = (targetId: string, placement: "before" | "after" | "with") => ({
              onPointerEnter: (event: ReactPointerEvent<HTMLDivElement>) => {
                if (!dragged || dragged === targetId || event.buttons !== 1) return;
                setDropTarget({ targetId, placement });
              },
              onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => {
                if (!dragged || dragged === targetId || event.buttons !== 1) return;
                if (dropTarget?.targetId !== targetId || dropTarget.placement !== placement) setDropTarget({ targetId, placement });
              },
              onPointerUpCapture: (event: ReactPointerEvent<HTMLDivElement>) => {
                if (!dragged || dragged === targetId) return;
                event.preventDefault();
                event.stopPropagation();
                finishDrop(targetId, placement);
              },
              onDragEnter: (event: ReactDragEvent<HTMLDivElement>) => {
                if (!dragged || dragged === targetId) return;
                event.preventDefault();
                event.stopPropagation();
                setDropTarget({ targetId, placement });
              },
              onDragOver: (event: ReactDragEvent<HTMLDivElement>) => {
                if (!dragged || dragged === targetId) return;
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                if (dropTarget?.targetId !== targetId || dropTarget.placement !== placement) setDropTarget({ targetId, placement });
              },
              onDrop: (event: ReactDragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.stopPropagation();
                finishDrop(targetId, placement);
              },
            });
            const insertionSpace = (key: string, targetId: string, placement: "before" | "after", label: string) => {
              if (!dragged || dragged === targetId) return null;
              const active = dropTarget?.targetId === targetId && dropTarget.placement === placement;
              return (
                <div
                  key={key}
                  role="button"
                  aria-label={label}
                  data-animation-sequence-space={key}
                  data-animation-sequence-target={placement}
                  data-animation-sequence-target-for={targetId}
                  className="relative flex h-[20px] items-start justify-center"
                  {...targetHandlers(targetId, placement)}
                >
                  <span aria-hidden className={clsx("absolute inset-x-0 top-0 border-t border-dashed", active ? "border-c-border-selected" : "border-c-border")} />
                </div>
              );
            };
            // Per-action row renderer.
            const renderActionRow = (a: ObjectAnimationItem, i: number) => {
            const id = a.id ?? String(i);
            const siblingOfFocused = !a.focused && !!a.elementId && focusedElementIds.has(a.elementId);
            const tinted = !!a.focused || (!siblingOfFocused && !!a.selected);
            const phase = a.kind === "In" ? "build-in" : a.kind === "Out" ? "build-out" : "action";
            const phaseLabel = phase === "build-in" ? "Build in" : phase === "build-out" ? "Build out" : "Action";
            const styleOptions = phase === "build-in" ? ["fade-in", "move-in", "slide-in", "wipe-in"] : phase === "build-out" ? ["fade-out", "move-out", "slide-out", "wipe-out"] : ACTION_STYLE_OPTIONS;
            const directional = !!a.style && (/^(move|slide|wipe)-/.test(a.style) || (phase === "action" && a.style === "move"));
            const styleLabels = Object.fromEntries(styleOptions.map(style => [style, style.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")])) as Record<string, string>;
            const selectedStyle = a.style ?? styleOptions[0];
            const selectedStyleLabel = styleLabels[selectedStyle]
              ?? `${selectedStyle.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")} (unsupported)`;
            const deliveryLabels = { "all-at-once": "All at once", "by-object": "By object", "by-word": "By word", "by-character": "By character" };
            const deliveryValue = Object.entries(deliveryLabels).find(([, label]) => label === a.delivery)?.[0] as keyof typeof deliveryLabels | undefined;
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
              <button type="button" draggable={!!callbacks?.onReorder} aria-label={`Drag ${a.name} animation`} className={clsx(dragged === id ? "flex cursor-grabbing" : "hidden group-hover:flex cursor-grab", "absolute -left-[16px] top-[8px] size-[16px] items-center justify-center text-c-icon-secondary")}
                onPointerDown={event => {
                  if (!callbacks?.onReorder || event.button !== 0) return;
                  event.preventDefault();
                  event.stopPropagation();
                  setDragged(id);
                  setDropTarget(null);
                }}
                onDragStart={event => {
                  setDragged(id);
                  setDropTarget(null);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", id);
                }}
                onDragEnd={() => { setDragged(null); setDropTarget(null); }}>
                <GripVertical size={14} />
              </button>
              {/* RP-11: no phase arrow in the collapsed badge. Not every parametric has a
                  direction, so the arrow promised a reading the card cannot always keep;
                  the DurationPill's In/Out/Action text carries the phase on its own. */}
              <AnimationCard
                  icon={<Type size={14} strokeWidth={1.5} />}
                  title={a.name}
                  badge={<DurationPill duration={a.duration} kind={a.kind} />}
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
                      value={selectedStyle}
                      onSelect={style => { callbacks?.onStyleChange?.(id, style); setActiveStyleDialog(null); }}
                      trigger={<Dropdown
                        ariaLabel={`Style: ${selectedStyleLabel}`}
                        aria-haspopup="dialog"
                        value={selectedStyleLabel}
                        state={activeStyleDialog === id ? "active" : "default"}
                        fullWidth
                        onClick={() => setActiveStyleDialog(current => current === id ? null : id)}
                      />}
                    />
                  </LabeledRow>
                  <LabeledRow label="Duration"><NumericInput value={Number.parseFloat(a.buildDuration ?? a.duration) * (a.buildDuration?.includes("ms") ? 1 : 1000)} min={0} suffix="ms" commitOnBlur className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} onChange={durationMs => callbacks?.onDurationChange?.(id, durationMs)} /></LabeledRow>
                  {callbacks?.onEasingChange && <LabeledRow label="Easing"><EasingChoice id={id} value={a.easing ?? PHASE_DEFAULT_EASING[phase]} callbacks={callbacks} /></LabeledRow>}
                  {directional && <LabeledRow label="Direction"><ChoiceDropdown value={a.direction ?? "left"} options={["left", "right", "up", "down"]} labels={{ left: phase === "build-out" ? "To left" : "From left", right: phase === "build-out" ? "To right" : "From right", up: phase === "build-out" ? "To top" : "From top", down: phase === "build-out" ? "To bottom" : "From bottom" }} onChange={direction => callbacks?.onDirectionChange?.(id, direction)} /></LabeledRow>}
                  {deliveryValue && <LabeledRow label="Delivery"><ChoiceDropdown value={deliveryValue} options={["all-at-once", "by-object", "by-word", "by-character"]} labels={deliveryLabels} onChange={delivery => callbacks?.onDeliveryChange?.(id, delivery)} /></LabeledRow>}
                  {phase === "action" && <LabeledRow label="Intensity"><ChoiceDropdown ariaLabel="Intensity" value={a.intensity ?? "medium"} options={["small", "medium", "large"]} labels={{ small: "Small", medium: "Medium", large: "Large" }} onChange={intensity => callbacks?.onIntensityChange?.(id, intensity)} /></LabeledRow>}
                </AnimationCard>
            </div>;
            };
            const firstStationaryGroup = sequenceGroups.find(group => group.rows.some(row => row.id !== dragged));
            const firstTarget = firstStationaryGroup?.rows.find(row => row.id !== dragged)?.id;
            return <>
              {firstTarget && firstStationaryGroup && insertionSpace(`before-${firstStationaryGroup.rank}`, firstTarget, "before", `Insert animation before sequence ${firstStationaryGroup.rank}`)}
              {sequenceGroups.map((group, groupIndex) => {
                const shared = group.rows.length > 1;
                // Rejoining the rank the source already belongs to is visually a
                // no-op and must not dispatch a reorder (which may normalize timing).
                const groupContainsDragged = group.rows.some(row => row.id === dragged);
                const withTargetId = groupContainsDragged ? undefined : group.rows[0]?.id;
                const next = sequenceGroups[groupIndex + 1];
                const groupOnlyDragged = group.rows.every(row => row.id === dragged);
                const nextTargetId = next?.rows.find(row => row.id !== dragged)?.id;
                const afterTargetId = groupOnlyDragged || (next && !nextTargetId)
                  ? undefined
                  : nextTargetId ?? group.rows.find(row => row.id !== dragged)?.id;
                const afterPlacement = next ? "before" as const : "after" as const;
                const withActive = !!withTargetId && dropTarget?.targetId === withTargetId && dropTarget.placement === "with";
                return (
                  <div
                    key={group.rank}
                    data-animation-sequence-rank={group.rank}
                    data-animation-sequence-group-drop={withTargetId ? "with" : undefined}
                    className="flex flex-col"
                    {...(withTargetId ? targetHandlers(withTargetId, "with") : {})}
                  >
                    <BlockNumberLabel n={group.rank} />
                    <div
                      data-animation-shared-rank={shared ? group.rank : undefined}
                      className="relative flex flex-col gap-[4px]"
                    >
                      {dragged && withTargetId && (
                        <div
                          role="button"
                          aria-label={`Play animation with sequence ${group.rank}`}
                          data-animation-sequence-group-target={group.rank}
                          data-animation-sequence-target="with"
                          data-animation-sequence-target-for={withTargetId}
                          className={clsx(
                            FONT,
                            "relative flex h-[24px] items-center justify-center rounded-c-sm border text-[10px] font-[450] leading-[14px]",
                            withActive ? "border-c-border-selected bg-c-bg-selected text-c-text" : "border-c-border bg-c-bg text-c-text-secondary",
                          )}
                          {...targetHandlers(withTargetId, "with")}
                        >
                          With
                          {withActive && <span aria-hidden data-animation-sequence-drop-indicator="with" className="pointer-events-none absolute inset-[2px] rounded-c-xs border border-c-border-selected" />}
                        </div>
                      )}
                      {group.rows.map((row, rowIndex) => <div key={row.id}>
                        {rowIndex > 0 && !dragged && callbacks?.onStartOffsetChange && (
                          <div data-animation-start-offset={row.id} className="flex items-center gap-[8px] py-[6px]">
                            <span className={clsx(FONT, "text-[11px] text-c-text-secondary shrink-0")}>Start after</span>
                            <NumericInput ariaLabel={`Start ${row.animation.name} (${rowIndex + 1}) after ${group.rows[0].animation.name} (1) starts`}
                              value={Math.max(0, (row.animation.startMs ?? 0) - (group.rows[0].animation.startMs ?? 0))}
                              min={0} suffix="ms" commitOnBlur className="min-w-0 flex-1"
                              onChange={offset => callbacks.onStartOffsetChange?.(group.rows[0].id, row.id, offset)} />
                          </div>
                        )}
                        {renderActionRow(row.animation, row.index)}
                      </div>)}
                    </div>
                    {afterTargetId && insertionSpace(
                      `after-${group.rank}`,
                      afterTargetId,
                      afterPlacement,
                      next ? `Insert animation between sequence ${group.rank} and ${next.rank}` : `Insert animation after sequence ${group.rank}`,
                    )}

                  </div>
                );
              })}
            </>;
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
