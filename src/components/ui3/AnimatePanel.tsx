import { useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { SlidersHorizontal, Plus, Trash2, MonitorPlay, Clock, ArrowRight, ArrowDown, Type, SquareDashedMousePointer } from "lucide-react";
import { PanelSection, PanelActionBtn, ScrollArea } from "./Panel";
import { Dropdown } from "./Dropdown";
import { ComboInput } from "./Input";
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

interface ObjAnim {
  n: number;
  name: string;
  kind: AnimKind;
  duration: string;
  style?: string;
  buildDuration?: string;
  delivery?: string;
}

const DEMO_ANIMS: ObjAnim[] = [
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
    <div className="rounded-c-md border border-accent/70 overflow-hidden">
      {/* accent header — click to collapse; trash to remove */}
      <div className="h-[32px] flex items-center gap-[8px] pl-[8px] pr-[6px] bg-accent/15">
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

// ── Slide transition ──────────────────────────────────────────────────────────────
function SlideTransitionSection() {
  const [applied, setApplied] = useState(true);
  const [open, setOpen] = useState(true);
  if (!applied) {
    return (
      <PanelSection title="Composition transition" rightActions={<PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Composition transition settings" />}>
        <div className="px-[16px] pt-[3px] pb-[8px]">
          <button onClick={() => setApplied(true)} className="h-[32px] w-full rounded-c-md border border-c-border bg-c-bg flex items-center gap-[8px] px-[8px] hover:bg-c-bg-hover">
            <MonitorPlay size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
            <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>None</span>
          </button>
        </div>
      </PanelSection>
    );
  }
  return (
    <PanelSection title="Composition transition" rightActions={<PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Composition transition settings" />}>
      <div className="px-[16px] pt-[3px] pb-[8px]">
        <AnimationCard
          icon={<MonitorPlay size={16} strokeWidth={1.5} />}
          title="Smart animate"
          badge={<span className={clsx(FONT, "text-[9px] text-c-text-secondary")}>300ms</span>}
          expanded={open}
          onToggle={() => setOpen(o => !o)}
          onRemove={() => setApplied(false)}
        >
          <LabeledRow label="Style"><Dropdown value="Smart animate" fullWidth /></LabeledRow>
          <LabeledRow label="Easing"><Dropdown value="Ease out" fullWidth /></LabeledRow>
          <LabeledRow label="Duration"><ComboInput value="300ms" className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} /></LabeledRow>
          <LabeledRow label="Start"><Dropdown value="On click" fullWidth /></LabeledRow>
          <LabeledRow label="Delay"><ComboInput value="0ms" className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} /></LabeledRow>
          <Button label="Apply to all slides" variant="Secondary" size="wide" />
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

function ObjectAnimationsSection({ anims }: { anims: ObjAnim[] }) {
  const [expanded, setExpanded] = useState<number | null>(anims.length ? 0 : null);
  const addMenu = (close: () => void) => (
    <Menu minWidth={140}>
      {["Build in", "Action", "Build out"].map(l => <MenuRow key={l} type="simple" label={l} onClick={close} />)}
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
          {anims.map((a, i) => (
            <div key={i}>
              <div className={clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.045px] text-c-text-secondary mb-[2px]")}>{a.n}</div>
              <AnimationCard
                icon={<Type size={14} strokeWidth={1.5} />}
                title={a.name}
                badge={<><KindGlyph kind={a.kind} /><DurationPill duration={a.duration} kind={a.kind} /></>}
                expanded={expanded === i}
                onToggle={() => setExpanded(e => e === i ? null : i)}
                onRemove={() => {}}
              >
                <div className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>Build in</div>
                <LabeledRow label="Style"><Dropdown value={a.style ?? "—"} fullWidth /></LabeledRow>
                <LabeledRow label="Duration"><ComboInput value={a.buildDuration ?? "—"} className="w-full" iconLead={<Clock size={16} strokeWidth={1.5} />} /></LabeledRow>
                <LabeledRow label="Delivery"><Dropdown value={a.delivery ?? "—"} fullWidth /></LabeledRow>
              </AnimationCard>
            </div>
          ))}
        </div>
      )}
    </PanelSection>
  );
}

export function AnimatePanel({ anims = DEMO_ANIMS }: { anims?: ObjAnim[] }) {
  return (
    <ScrollArea>
      <SlideTransitionSection />
      <ObjectAnimationsSection anims={anims} />
    </ScrollArea>
  );
}
