import { useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { Plus, Trash2, MonitorPlay, Clock, ArrowRight, ArrowDown, Type, Play, GripVertical } from "lucide-react";
import { PanelSection, PanelActionBtn, ScrollArea } from "./Panel";
import { Dropdown } from "./Dropdown";
import { ComboInput, NumericInput } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Button } from "./Button";
import { SegmentedControl } from "./SegmentedControl";
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
  selected?: boolean;
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
  onStartChange?: (start: ObjectAnimationSequenceSettings["start"]) => void;
  onDelayChange?: (delayMs: number) => void;
  /** Play back every object animation on the current selection. Host-wired to real
   *  playback — the component only renders the trigger (see #179). */
  onPlayAllObjectAnimations?: () => void;
}

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
function AnimationCard({ icon, title, badge, expanded, onToggle, onRemove, children }: {
  icon: ReactNode; title: string; badge?: ReactNode;
  expanded: boolean; onToggle: () => void; onRemove?: () => void; children?: ReactNode;
}) {
  if (!expanded) {
    return (
      <button
        onClick={onToggle}
        aria-expanded={false}
        className="h-[32px] w-full rounded-c-md border border-c-border bg-c-bg flex items-center gap-[8px] px-[8px] hover:bg-c-bg-hover"
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

function ChoiceDropdown<T extends string>({ value, options, labels, onChange }: { value: T; options: readonly T[]; labels: Record<T, string>; onChange?: (value: T) => void }) {
  return <PopoverMenu align="right" className="w-full" trigger={<Dropdown value={labels[value]} fullWidth />}>
    {close => <Menu minWidth={160}>{options.map(option => <MenuRow key={option} type="checkmark" checked={option === value} label={labels[option]} onClick={() => { onChange?.(option); close(); }} />)}</Menu>}
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

function ObjectAnimationsSection({ anims, callbacks, settings = { start: "on-click", delayMs: 0 }, addablePhases = ["build-in", "action", "build-out"], contextKey, selectionType, animationDelay = false }: {
  anims: ObjectAnimationItem[]; callbacks?: ObjectAnimationCallbacks; settings?: ObjectAnimationSequenceSettings; addablePhases?: ObjectAnimationPhase[]; contextKey?: string; selectionType?: "slide" | "element"; animationDelay?: boolean;
}) {
  // When an element is selected, default-expand that element's own animation card
  // (the one flagged `selected`). For a slide selection nothing is auto-expanded —
  // the Comp transition card is the focus there.
  const selectedIndex = anims.findIndex(a => a.selected);
  const defaultExpandedId = selectionType === "element" && selectedIndex >= 0
    ? (anims[selectedIndex].id ?? String(selectedIndex))
    : null;
  const [expanded, setExpanded] = useState<string | null>(defaultExpandedId);
  useEffect(() => { setExpanded(defaultExpandedId); }, [contextKey, selectionType, defaultExpandedId]);
  const [dragged, setDragged] = useState<string | null>(null);
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
              same way as "+" (Add animation) — disabled when there are no animations to
              play. Host wires `onPlayAllObjectAnimations` to real playback. */}
          <PanelActionBtn icon={<Play size={16} strokeWidth={1.5} />} label="Play all animations" disabled={anims.length === 0} onClick={callbacks?.onPlayAllObjectAnimations} />
          <PopoverMenu align="right" trigger={<PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add animation" disabled={addablePhases.length === 0} />}>
            {addMenu}
          </PopoverMenu>
          {/* #222: settings ("starts automatically" + delay) gated behind the
              `animationDelay` capability (default OFF) — not rendered when off. */}
          {animationDelay && <PanelActionBtn icon={<SettingsIcon data-icon-semantic="settings" size={16} strokeWidth={1.5} />} label="Object animation settings" />}
        </>
      }
    >
      {anims.length === 0 ? (
        <p className={clsx(FONT, "px-[16px] pt-[3px] pb-[8px] text-[11px] leading-[16px] text-c-text-secondary")}>
          Select an object on the slide, then click the add button to animate it.
        </p>
      ) : (
        <div className="px-[16px] pt-[3px] pb-[8px] flex flex-col gap-[8px]">
          {anims.map((a, i) => {
            const id = a.id ?? String(i);
            const phase = a.kind === "In" ? "build-in" : a.kind === "Out" ? "build-out" : "action";
            const phaseLabel = phase === "build-in" ? "Build in" : phase === "build-out" ? "Build out" : "Action";
            const styleOptions = phase === "build-in" ? ["fade-in", "move-in", "slide-in", "wipe-in"] : phase === "build-out" ? ["fade-out", "move-out", "slide-out", "wipe-out"] : ["pulse", "jiggle", "bounce", "shake"];
            const directional = !!a.style && /^(move|slide|wipe)-/.test(a.style);
            const styleLabels = Object.fromEntries(styleOptions.map(style => [style, style.split("-").map(word => word[0].toUpperCase() + word.slice(1)).join(" ")])) as Record<string, string>;
            const deliveryLabels = { "all-at-once": "All at once", "by-object": "By object", "by-word": "By word", "by-character": "By character" };
            const deliveryValue = Object.entries(deliveryLabels).find(([, label]) => label === a.delivery)?.[0] as keyof typeof deliveryLabels | undefined;
            return <div key={id} className="group relative min-w-0 flex flex-col gap-[2px]"
              onDragOver={event => { if (dragged && dragged !== id) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }}
              onDrop={event => {
                event.preventDefault();
                if (!dragged || dragged === id) return;
                const rect = event.currentTarget.getBoundingClientRect();
                const placement = event.clientX > rect.left + rect.width * 0.72 ? "with" : event.clientY < rect.top + rect.height / 2 ? "before" : "after";
                callbacks?.onReorder?.(dragged, id, placement);
                setDragged(null);
              }}>
              {/* Drag handle — the reorder control. Rendered as a hover-revealed overlay
                  in the panel's own left padding (negative offset) so it reserves NO
                  horizontal space: the number + card sit FLUSH at the container's left
                  edge at rest, and the grip appears on hover without shifting the card. */}
              <button type="button" draggable={!!callbacks?.onReorder} aria-label={`Drag ${a.name} animation`} className="hidden group-hover:flex absolute -left-[16px] top-[26px] size-[16px] items-center justify-center cursor-grab text-c-icon-secondary"
                onDragStart={event => { setDragged(id); event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragged(null)}>
                <GripVertical size={14} />
              </button>
              {/* Build-order number sits ON TOP of the card, aligned with the card's
                  left edge, so the card can take the full available width. */}
              <div className={clsx(FONT, "h-[16px] flex items-center pl-[2px] text-[9px] font-[450] leading-[14px] tracking-[0.045px] text-c-text-secondary")}>{a.n}</div>
              <AnimationCard
                  icon={<Type size={14} strokeWidth={1.5} />}
                  title={a.name}
                  badge={<><KindGlyph kind={a.kind} /><DurationPill duration={a.duration} kind={a.kind} /></>}
                  expanded={expanded === id}
                  onToggle={() => setExpanded(current => current === id ? null : id)}
                  onRemove={() => callbacks?.onRemove?.(id)}
                >
                  <div className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>{phaseLabel}</div>
                  <LabeledRow label="Style"><ChoiceDropdown value={a.style ?? styleOptions[0]} options={styleOptions} labels={styleLabels} onChange={style => callbacks?.onStyleChange?.(id, style)} /></LabeledRow>
                  <LabeledRow label="Duration"><NumericInput value={Number.parseFloat(a.buildDuration ?? a.duration) * (a.buildDuration?.includes("ms") ? 1 : 1000)} min={0} suffix="ms" commitOnBlur className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} onChange={durationMs => callbacks?.onDurationChange?.(id, durationMs)} /></LabeledRow>
                  {directional && <LabeledRow label="Direction"><ChoiceDropdown value={a.direction ?? "left"} options={["left", "right", "up", "down"]} labels={{ left: phase === "build-out" ? "To left" : "From left", right: phase === "build-out" ? "To right" : "From right", up: phase === "build-out" ? "To top" : "From top", down: phase === "build-out" ? "To bottom" : "From bottom" }} onChange={direction => callbacks?.onDirectionChange?.(id, direction)} /></LabeledRow>}
                  {deliveryValue && <LabeledRow label="Delivery"><ChoiceDropdown value={deliveryValue} options={["all-at-once", "by-object", "by-word", "by-character"]} labels={deliveryLabels} onChange={delivery => callbacks?.onDeliveryChange?.(id, delivery)} /></LabeledRow>}
                  {phase === "action" && <LabeledRow label="Intensity"><SegmentedControl className="w-full" value={a.intensity ?? "medium"} segments={[{ value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" }]} onChange={value => callbacks?.onIntensityChange?.(id, value as "small" | "medium" | "large")} /></LabeledRow>}
                </AnimationCard>
            </div>;
          })}
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
