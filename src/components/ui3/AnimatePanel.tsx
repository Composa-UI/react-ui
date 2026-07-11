import { useEffect, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { SlidersHorizontal, Plus, Trash2, MonitorPlay, Clock, ArrowRight, ArrowDown, Type, SquareDashedMousePointer } from "lucide-react";
import { PanelSection, PanelActionBtn, ScrollArea } from "./Panel";
import { Dropdown } from "./Dropdown";
import { ComboInput, NumericInput } from "./Input";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Button } from "./Button";

// ─── Animate panel ──────────────────────────────────────────────────────────────
// The "Animate" tab body. Two always-present sections (Slide transition · Object
// animations). Both use the SHARED `AnimationCard`: a neutral row when collapsed,
// an accent-header card (accent tint + stroke + trash, no chevron, no body bg) when
// expanded. Accent is the `--color-accent` token used at opacity — swap it (or set
// it grey) in styles/accents.css to reskin.

const FONT = "font-[family-name:var(--composa-font-family)]";

type AnimKind = "In" | "Out" | "Action";

export interface ObjectAnimationItem {
  id?: string;
  n: number;
  name: string;
  kind: AnimKind;
  duration: string;
  style?: string;
  buildDuration?: string;
  delivery?: string;
}
export type ObjectAnimationPhase = "build-in" | "action" | "build-out";
export interface ObjectAnimationSequenceSettings { start: "on-click" | "automatically"; delayMs: number; }
export interface ObjectAnimationCallbacks {
  onAdd?: (phase: ObjectAnimationPhase) => void;
  onRemove?: (id: string) => void;
  onDurationChange?: (id: string, durationMs: number) => void;
  onStartChange?: (start: ObjectAnimationSequenceSettings["start"]) => void;
  onDelayChange?: (delayMs: number) => void;
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
      {/* accent header (orange fill) over a gray-bordered card; gray divider to the white body */}
      <div className="h-[32px] flex items-center gap-[8px] pl-[8px] pr-[6px] bg-accent/15 border-b border-c-border">
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
function CompTransitionSection({ value, callbacks, contextKey }: { value?: CompTransitionSettings; callbacks?: CompTransitionCallbacks; contextKey?: string }) {
  const [demo, setDemo] = useState<CompTransitionSettings>({ style: "fade", direction: "right", durationMs: 300, easing: "ease-out" });
  const controlled = value !== undefined;
  const rendered = value ?? demo;
  const [open, setOpen] = useState(rendered.style !== "none");
  useEffect(() => {
    setOpen(rendered.style !== "none");
  }, [contextKey]);
  useEffect(() => { if (value?.style === "none") setOpen(false); }, [value?.style]);
  const update = (patch: Partial<CompTransitionSettings>) => {
    if (!controlled) setDemo(current => ({ ...current, ...patch }));
  };
  const setStyle = (style: CompTransitionStyle) => { update({ style }); callbacks?.onStyleChange?.(style); };
  const directional = rendered.style === "push" || rendered.style === "slide" || rendered.style === "wipe";
  if (rendered.style === "none" && !open) return (
    <PanelSection title="Comp transition" rightActions={<PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Comp transition settings" />}>
      <div className="px-[16px] pt-[3px] pb-[8px]">
        <button onClick={() => setOpen(true)} className="h-[32px] w-full rounded-c-md border border-c-border bg-c-bg flex items-center gap-[8px] px-[8px] hover:bg-c-bg-hover">
          <MonitorPlay size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
          <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>None</span>
        </button>
      </div>
    </PanelSection>
  );
  return (
    <PanelSection title="Comp transition" rightActions={<PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Comp transition settings" />}>
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

function ObjectAnimationsSection({ anims, callbacks, settings = { start: "on-click", delayMs: 0 }, addablePhases = ["build-in", "action", "build-out"] }: {
  anims: ObjectAnimationItem[]; callbacks?: ObjectAnimationCallbacks; settings?: ObjectAnimationSequenceSettings; addablePhases?: ObjectAnimationPhase[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
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
          <PanelActionBtn icon={<SquareDashedMousePointer size={16} strokeWidth={1.5} />} label="Select object" />
          <PopoverMenu align="right" trigger={<PanelActionBtn icon={<Plus size={16} strokeWidth={1.5} />} label="Add animation" />}>
            {addMenu}
          </PopoverMenu>
          <PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Object animation settings" />
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
            return <div key={id}>
              <div className={clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.045px] text-c-text-secondary mb-[2px]")}>{a.n}</div>
              <AnimationCard
                icon={<Type size={14} strokeWidth={1.5} />}
                title={a.name}
                badge={<><KindGlyph kind={a.kind} /><DurationPill duration={a.duration} kind={a.kind} /></>}
                expanded={expanded === id}
                onToggle={() => setExpanded(current => current === id ? null : id)}
                onRemove={() => callbacks?.onRemove?.(id)}
              >
                <div className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>Build in</div>
                <LabeledRow label="Style"><Dropdown value={a.style ?? "—"} fullWidth /></LabeledRow>
                <LabeledRow label="Duration"><NumericInput value={Number.parseFloat(a.buildDuration ?? a.duration) * (a.buildDuration?.includes("ms") ? 1 : 1000)} min={0} suffix="ms" commitOnBlur className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} onChange={durationMs => callbacks?.onDurationChange?.(id, durationMs)} /></LabeledRow>
                <LabeledRow label="Delivery"><Dropdown value={a.delivery ?? "—"} fullWidth /></LabeledRow>
              </AnimationCard>
            </div>;
          })}
          <div className="flex flex-col gap-[8px] pt-[4px] border-t border-c-border">
            <LabeledRow label="Start"><ChoiceDropdown value={settings.start} options={["on-click", "automatically"]} labels={{ "on-click": "On click", automatically: "Automatically" }} onChange={callbacks?.onStartChange} /></LabeledRow>
            <LabeledRow label="Delay"><NumericInput value={settings.delayMs} min={0} suffix="ms" commitOnBlur className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} onChange={callbacks?.onDelayChange} /></LabeledRow>
          </div>
        </div>
      )}
    </PanelSection>
  );
}

export function AnimatePanel({ anims = DEMO_ANIMS, compTransition, compTransitionCallbacks, contextKey, objectAnimationCallbacks, objectAnimationSettings, addablePhases }: {
  anims?: ObjectAnimationItem[]; compTransition?: CompTransitionSettings; compTransitionCallbacks?: CompTransitionCallbacks; contextKey?: string;
  objectAnimationCallbacks?: ObjectAnimationCallbacks; objectAnimationSettings?: ObjectAnimationSequenceSettings; addablePhases?: ObjectAnimationPhase[];
}) {
  return (
    <ScrollArea>
      <CompTransitionSection value={compTransition} callbacks={compTransitionCallbacks} contextKey={contextKey} />
      <ObjectAnimationsSection anims={anims} callbacks={objectAnimationCallbacks} settings={objectAnimationSettings} addablePhases={addablePhases} />
    </ScrollArea>
  );
}
