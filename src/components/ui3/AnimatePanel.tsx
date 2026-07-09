import { useState } from "react";
import { clsx } from "clsx";
import { SlidersHorizontal, Plus, Trash2, MonitorPlay, Clock, ArrowRight, ArrowDown, Type, SquareDashedMousePointer, ChevronDown } from "lucide-react";
import { PanelSection, PanelActionBtn, ScrollArea } from "./Panel";
import { Dropdown } from "./Dropdown";
import { Menu, MenuRow, PopoverMenu } from "./Menu";
import { Button } from "./Button";

// ─── Animate panel ──────────────────────────────────────────────────────────────
// The "Animate" tab body of the inspector. Light theme, same design language as the
// property panel — composed almost entirely from existing primitives. Two sections:
// Slide transition (applied → editable Style/Easing/Duration) and Object animations
// (a numbered list; each entry expands to its Build-in Style/Duration/Delivery).
// The active animation uses the Composa peach accent (tokenize later).

const FONT = "font-[family-name:var(--composa-font-family)]";
const ACCENT_BG = "bg-[#ffdfcc]";
const ACCENT_BORDER = "border-[#ffbb9e]";
const subLabel = clsx(FONT, "text-[9px] font-[450] leading-[14px] tracking-[0.045px] text-c-text-secondary");

type AnimKind = "In" | "Out" | "Action";

interface ObjAnim {
  n: number;
  name: string;
  kind: AnimKind;
  duration: string;          // collapsed-row duration, e.g. "0.6s"
  style?: string;            // build-in style, e.g. "Drift & Scale"
  buildDuration?: string;    // build-in duration, e.g. "600ms"
  delivery?: string;         // e.g. "By object"
}

const DEMO_ANIMS: ObjAnim[] = [
  { n: 1, name: "Motto", kind: "In",     duration: "0.6s", style: "Drift & Scale", buildDuration: "600ms", delivery: "By object" },
  { n: 2, name: "Body",  kind: "Out",    duration: "0.6s" },
  { n: 3, name: "Body",  kind: "Action", duration: "0.6s" },
];

// label (fixed) + control (fluid) — the animate panel's field row
function LabeledRow({ label, children }: { label: string; children: React.ReactNode }) {
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

// ── Slide transition — neutral expand/collapse card (per spec: inline, tinted, no
// trash; contains Style/Easing/Duration/Start/Delay + Apply-to-all) ────────────────
function SlideTransitionSection() {
  const [applied, setApplied] = useState(true);
  const [open, setOpen] = useState(true);
  return (
    <PanelSection
      title="Slide transition"
      rightActions={<PanelActionBtn icon={<SlidersHorizontal size={16} strokeWidth={1.5} />} label="Slide transition settings" />}
    >
      <div className="px-[16px] pt-[3px] pb-[8px]">
        {!applied ? (
          <button
            onClick={() => setApplied(true)}
            className="h-[32px] w-full rounded-c-md border border-c-border bg-c-bg flex items-center gap-[8px] px-[8px] hover:bg-c-bg-hover"
          >
            <MonitorPlay size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
            <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>None</span>
          </button>
        ) : (
          <div className={clsx("rounded-c-md border border-c-border overflow-hidden", open && "bg-c-bg-secondary")}>
            {/* header row — click to expand/collapse (no trash, no accent) */}
            <button onClick={() => setOpen(o => !o)} aria-expanded={open} className="h-[32px] w-full flex items-center gap-[8px] px-[8px] bg-c-bg">
              <MonitorPlay size={16} strokeWidth={1.5} className="text-c-icon shrink-0" />
              <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] text-c-text text-left truncate")}>Smart animate</span>
              {!open && <span className={clsx(FONT, "text-[9px] text-c-text-secondary")}>300ms</span>}
              <ChevronDown size={14} strokeWidth={1.5} className={clsx("text-c-icon-secondary shrink-0 transition-transform", open && "rotate-180")} />
            </button>
            {open && (
              <div className="flex flex-col gap-[8px] px-[8px] py-[8px] border-t border-c-border">
                <LabeledRow label="Style"><Dropdown value="Smart animate" fullWidth /></LabeledRow>
                <LabeledRow label="Easing"><Dropdown value="Ease out" fullWidth /></LabeledRow>
                <LabeledRow label="Duration"><Dropdown value="300ms" fullWidth leadingIcon={<Clock size={16} strokeWidth={1.5} />} /></LabeledRow>
                <LabeledRow label="Start"><Dropdown value="On click" fullWidth /></LabeledRow>
                <LabeledRow label="Delay"><Dropdown value="0ms" fullWidth leadingIcon={<Clock size={16} strokeWidth={1.5} />} /></LabeledRow>
                <Button label="Apply to all slides" variant="Secondary" size="wide" />
              </div>
            )}
          </div>
        )}
      </div>
    </PanelSection>
  );
}

// ── One object-animation entry ────────────────────────────────────────────────────
function AnimEntry({ anim, expanded, onToggle }: { anim: ObjAnim; expanded: boolean; onToggle: () => void }) {
  return (
    <div>
      <div className={clsx(subLabel, "mb-[2px]")}>{anim.n}</div>
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className={clsx(
          "h-[32px] w-full rounded-c-md border flex items-center gap-[6px] px-[8px]",
          expanded ? clsx(ACCENT_BG, ACCENT_BORDER) : "bg-c-bg border-c-border hover:bg-c-bg-hover",
        )}
      >
        <Type size={14} strokeWidth={1.5} className="text-c-icon shrink-0" />
        <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] text-c-text text-left truncate")}>{anim.name}</span>
        {expanded ? (
          <Trash2 size={14} strokeWidth={1.5} className="text-c-icon shrink-0" />
        ) : (
          <>
            <KindGlyph kind={anim.kind} />
            {/* duration + phase as one segmented pill (fidelity — Figma 2211-704) */}
            <div className="flex items-center rounded-c-sm bg-c-bg-secondary overflow-hidden shrink-0">
              <span className={clsx(FONT, "px-[6px] py-[1px] text-[9px] leading-[14px] text-c-text-secondary")}>{anim.duration}</span>
              <span className={clsx(FONT, "px-[6px] py-[1px] text-[9px] leading-[14px] text-c-text border-l border-c-border")}>{anim.kind}</span>
            </div>
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-[8px] flex flex-col gap-[8px]">
          <div className={clsx(FONT, "text-[11px] font-[550] leading-[16px] text-c-text")}>Build in</div>
          <LabeledRow label="Style"><Dropdown value={anim.style ?? "—"} fullWidth /></LabeledRow>
          <LabeledRow label="Duration"><Dropdown value={anim.buildDuration ?? "—"} fullWidth leadingIcon={<Clock size={16} strokeWidth={1.5} />} /></LabeledRow>
          <LabeledRow label="Delivery"><Dropdown value={anim.delivery ?? "—"} fullWidth /></LabeledRow>
        </div>
      )}
    </div>
  );
}

// ── Object animations ─────────────────────────────────────────────────────────────
function ObjectAnimationsSection({ anims }: { anims: ObjAnim[] }) {
  const [expanded, setExpanded] = useState<number | null>(anims.length ? 0 : null);
  const addMenu = (close: () => void) => (
    <Menu minWidth={140}>
      {["Build in", "Action", "Build out"].map(l => (
        <MenuRow key={l} type="simple" label={l} onClick={close} />
      ))}
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
            <AnimEntry key={i} anim={a} expanded={expanded === i} onToggle={() => setExpanded(e => e === i ? null : i)} />
          ))}
        </div>
      )}
    </PanelSection>
  );
}

// ── Panel body (Animate tab) ──────────────────────────────────────────────────────
export function AnimatePanel({ anims = DEMO_ANIMS }: { anims?: ObjAnim[] }) {
  return (
    <ScrollArea>
      <SlideTransitionSection />
      <ObjectAnimationsSection anims={anims} />
    </ScrollArea>
  );
}
