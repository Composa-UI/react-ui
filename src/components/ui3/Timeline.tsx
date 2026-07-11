import { useState } from "react";
import { clsx } from "clsx";
import { Play, Diamond, Repeat, PanelBottomClose, PanelLeftClose, Hash, Square, Type, Minus, Eye, EyeOff, ChevronLeft, ChevronRight, ChevronLeft as ChevronLeftBack, Film } from "lucide-react";

// ─── Timeline ───────────────────────────────────────────────────────────────────
// Polymorphic timeline region (Composa editor spec: docs/composa/specs/timeline.md).
// Two views sharing one playhead:
//   • mode="slide"  (default) — slide-local element-animation timeline
//     (After-Effects / Figma-Slides style): transport + ms-ruler + track list +
//     keyframe lanes. Componentized from the Figma export (node 2212-1693).
//   • mode="master" — full-project strip: seconds-ruler + a single "Slides" track of
//     horizontal slide BLOCKS in order + a "Base video" placeholder row + transport.
// Data-driven: tracks/blocks/keyframes/bars are positioned along a shared time→px
// scale. The active accent (playhead, keyframes, zoom fill) is Figma blue #0d99ff.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LEFT_W = 297;       // track-list width
const PX_PER_MS = 0.106;  // ~106px / 1000ms  (slide-local view: ms scale)
const PX_PER_S = 106;     // 106px / 1s      (master view: seconds scale)
const ROW_LAYER = 28;
const ROW_PROP = 28;      // raised from 24 → contains the 20px bar with 4px above/below
const ROW_BLOCK = 32;     // master-view slide/video block-track row height (compact — contains 20px bar)
const BLUE = "#0d99ff";

const ms = (t: number) => t * PX_PER_MS;
const sec = (t: number) => (t / 1000) * PX_PER_S; // ms input → px on the seconds scale

export type TimelineMode = "master" | "slide";

export type TrackType = "group" | "frame" | "text" | "line";
export interface PropTrack {
  name: string;
  keyframes: number[];         // times in ms
  bar?: [number, number];      // duration bar [start,end] ms
  hidden?: boolean;            // greyed + eye-off
  accent?: boolean;            // purple-selected track
}
export interface Track {
  name: string;
  type: TrackType;
  bar?: [number, number];
  props: PropTrack[];
}

// master-view slide block — a slide's [start,end] range (ms) on the project timeline
export interface SlideBlock {
  id: string;
  name: string;
  range: [number, number];     // [start,end] ms on the master timeline
  active?: boolean;            // canvas focus — visually distinct
}

const TYPE_ICON: Record<TrackType, typeof Hash> = { group: Hash, frame: Square, text: Type, line: Minus };

const DEMO_TRACKS: Track[] = [
  { name: "Top Buttons", type: "group", bar: [2600, 8000], props: [
    { name: "Opacity", bar: [2600, 8000], keyframes: [2600, 5000, 7800, 8600] },
  ] },
  { name: "Sheet", type: "frame", bar: [1900, 8000], props: [
    { name: "Position", hidden: true, keyframes: [1900] },
    { name: "Position", hidden: true, keyframes: [3000] },
    { name: "Opacity", bar: [3500, 8000], keyframes: [5000, 7800, 8100] },
  ] },
  { name: "time highlight", type: "line", bar: [2600, 8600], props: [
    { name: "Opacity", bar: [2600, 8600], keyframes: [2600, 5000, 7800, 8600] },
  ] },
  { name: "date highlight", type: "line", bar: [2600, 8600], props: [
    { name: "Opacity", bar: [2600, 8600], keyframes: [2600] },
  ] },
  { name: "Control + highlight indicator", type: "group", bar: [2600, 7400], props: [
    { name: "Opacity", keyframes: [2600, 5000, 7400, 7800] },
  ] },
];

const DEMO_BLOCKS: SlideBlock[] = [
  { id: "intro", name: "Intro", range: [0, 4000] },
  { id: "overview", name: "Overview of the quarter", range: [4000, 9000], active: true },
  { id: "metrics", name: "Metrics deep dive", range: [9000, 16000] },
  { id: "outro", name: "Outro", range: [16000, 20000] },
];

// ── keyframe lane (bar + diamonds + connecting line) ──────────────────────────────
function Lane({ prop, height }: { prop: PropTrack; height: number }) {
  const kfs = prop.keyframes;
  const first = kfs.length ? Math.min(...kfs) : 0;
  const last = kfs.length ? Math.max(...kfs) : 0;
  return (
    <div className="flex-1 relative" style={{ height }}>
      {prop.bar && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] bg-c-bg-secondary"
          style={{ left: ms(prop.bar[0]), width: ms(prop.bar[1] - prop.bar[0]) }}
        >
          {/* trim handles (edge-drag to trim start/end) — inset + wider to read as grips */}
          <span className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
          <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
        </div>
      )}
      {kfs.length > 1 && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-px"
          style={{ left: ms(first), width: ms(last - first), backgroundColor: prop.accent ? "#8638e5" : "rgba(0,0,0,0.25)" }}
        />
      )}
      {kfs.map((t, i) => (
        <div
          key={i}
          className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px]"
          style={{ left: ms(t), backgroundColor: prop.accent ? "#8638e5" : BLUE }}
        />
      ))}
    </div>
  );
}

// ── one track (layer row + its property rows) ─────────────────────────────────────
function TrackRows({ track }: { track: Track }) {
  const Icon = TYPE_ICON[track.type];
  return (
    <>
      {/* layer row */}
      <div className="flex" style={{ height: ROW_LAYER }}>
        <div className="shrink-0 flex items-center gap-[8px] pl-[8px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
          <Icon size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text truncate")}>{track.name}</span>
        </div>
        <div className="flex-1 relative" style={{ height: ROW_LAYER }}>
          {track.bar && (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] bg-c-bg-secondary"
              style={{ left: ms(track.bar[0]), width: ms(track.bar[1] - track.bar[0]) }}
            >
              <span className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
              <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
            </div>
          )}
        </div>
      </div>
      {/* property rows */}
      {track.props.map((p, i) => (
        <div key={i} className={clsx("flex", p.hidden && "opacity-40")} style={{ height: ROW_PROP }}>
          <div className="group/prop shrink-0 flex items-center gap-[6px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W, paddingLeft: 48 }}>
            <span className={clsx(FONT, "flex-1 min-w-0 text-[11px] font-[450] truncate", p.accent ? "text-[#8638e5]" : "text-c-text-secondary")}>{p.name}</span>
            {/* keyframe stepper */}
            <ChevronLeft size={14} strokeWidth={1.5} className="text-c-icon-secondary opacity-0 group-hover/prop:opacity-100 shrink-0" />
            <Diamond size={12} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
            <ChevronRight size={14} strokeWidth={1.5} className="text-c-icon-secondary opacity-0 group-hover/prop:opacity-100 shrink-0" />
            {p.hidden ? <EyeOff size={14} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" /> : <Eye size={14} strokeWidth={1.5} className="text-c-icon-secondary opacity-0 group-hover/prop:opacity-100 shrink-0" />}
          </div>
          <Lane prop={p} height={ROW_PROP} />
        </div>
      ))}
    </>
  );
}

// ── shared transport toolbar (identical across master + slide) ──────────────────────
// Layout, Play/Stop icons, timecode group, and loop are the SAME in both modes.
// Mode-specific: the keyframe (diamond) add button is slide-only — keyframes only exist
// in the slide-animation timeline. Timecode is shown in ms (slide) or seconds (master).
function Transport({ current, duration, mode }: { current: number; duration: number; mode: TimelineMode }) {
  const slide = mode === "slide";
  const fmt = slide
    ? (n: number) => String(Math.round(n)).padStart(5, "0")
    : (n: number) => (n / 1000).toFixed(2) + "s";
  const tcW = slide ? 42 : 54; // timecode cell width — ms strings are narrower than "4.20s"
  const IconBtn = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <button aria-label={label} className="size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover">{children}</button>
  );
  return (
    <div className="shrink-0 flex items-center gap-[8px] px-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
      {/* shared transport controls */}
      <IconBtn label="Play"><Play size={16} strokeWidth={1.5} /></IconBtn>
      <IconBtn label="Stop"><Square size={14} strokeWidth={1.5} /></IconBtn>
      {/* keyframe add — slide-only (keyframes live in the slide-animation timeline) */}
      {slide && <IconBtn label="Add keyframe"><Diamond size={16} strokeWidth={1.5} /></IconBtn>}
      <div className="w-[8px]" />
      {/* time group */}
      <div className="flex items-center h-[24px] rounded-c-md overflow-hidden">
        <div className="h-full bg-c-bg-secondary flex items-center justify-end pr-[6px]" style={{ width: tcW }}>
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text tabular-nums")}>{fmt(current)}</span>
        </div>
        <div className="h-full bg-c-bg-secondary flex items-center justify-end pr-[6px] ml-px" style={{ width: tcW }}>
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary tabular-nums")}>{fmt(duration)}</span>
        </div>
        {slide && (
          <div className="size-[24px] bg-c-bg-secondary ml-px flex items-center justify-center">
            <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>ms</span>
          </div>
        )}
        <button aria-label="Loop" className="size-[24px] bg-c-bg-secondary ml-px flex items-center justify-center text-c-icon hover:bg-c-bg-hover">
          <Repeat size={14} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex-1" />
      <button aria-label="Collapse track list" className="size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover">
        <PanelLeftClose size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ── ruler (slide-local view — milliseconds) ────────────────────────────────────────
function Ruler({ maxMs }: { maxMs: number }) {
  const ticks: number[] = [];
  for (let t = 1000; t <= maxMs; t += 1000) ticks.push(t);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ticks.map(t => (
        <span key={t} className={clsx(FONT, "absolute top-1/2 -translate-y-1/2 text-[11px] text-c-text-secondary tabular-nums")} style={{ left: ms(t) }}>{t}</span>
      ))}
    </div>
  );
}

// ── ruler (master view — seconds) ──────────────────────────────────────────────────
function SecondRuler({ maxMs }: { maxMs: number }) {
  // interval scales loosely with total duration so labels don't crowd
  const totalS = maxMs / 1000;
  const step = totalS > 60 ? 10 : totalS > 20 ? 5 : 1;
  const ticks: number[] = [];
  for (let s = 0; s <= totalS; s += step) ticks.push(s);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {ticks.map(s => (
        <span key={s} className={clsx(FONT, "absolute top-1/2 -translate-y-1/2 text-[11px] text-c-text-secondary tabular-nums")} style={{ left: s * PX_PER_S }}>{s}s</span>
      ))}
    </div>
  );
}

// ── master track rows: "Slides" block track + "Base video" placeholder ──────────────
function BlockTrack({ blocks, onSelect, onOpen }: { blocks: SlideBlock[]; onSelect?: (id: string) => void; onOpen?: (id: string) => void }) {
  return (
    <div className="flex" style={{ height: ROW_BLOCK }}>
      {/* left label */}
      <div className="shrink-0 flex items-center gap-[8px] pl-[8px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
        <Film size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0" />
        <span className={clsx(FONT, "text-[11px] font-[450] text-c-text truncate")}>Slides</span>
      </div>
      {/* block lane */}
      <div className="flex-1 relative" style={{ height: ROW_BLOCK }}>
        {blocks.map((b, i) => {
          const left = sec(b.range[0]);
          const width = sec(b.range[1] - b.range[0]);
          return (
            <div
              key={b.id}
              onClick={() => onSelect?.(b.id)}
              onDoubleClick={() => onOpen?.(b.id)}
              className={clsx(
                "absolute top-1/2 -translate-y-1/2 h-[20px] rounded-[4px] flex items-center px-[10px] overflow-hidden border",
                b.active
                  ? "bg-[#0d99ff]/20 border-[#0d99ff]"
                  : "bg-c-bg-secondary border-c-border",
              )}
              style={{ left, width }}
            >
              {/* trim handles (edge-drag to trim start/end) */}
              <span className="absolute left-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
              <span className="absolute right-[6px] top-1/2 -translate-y-1/2 h-[12px] w-[2px] rounded-full bg-c-icon-secondary cursor-ew-resize" />
              <span className={clsx(FONT, "text-[11px] font-[450] truncate", b.active ? "text-c-text" : "text-c-text-secondary")}>{b.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BaseVideoTrack() {
  return (
    <div className="flex" style={{ height: ROW_BLOCK }}>
      <div className="shrink-0 flex items-center gap-[8px] pl-[8px] pr-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
        <Film size={16} strokeWidth={1.5} className="text-c-icon-secondary shrink-0 opacity-60" />
        <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary truncate")}>Base video</span>
      </div>
      {/* empty placeholder lane (v1 stub) */}
      <div className="flex-1 relative" style={{ height: ROW_BLOCK }} aria-label="Base video track (empty)" />
    </div>
  );
}

export function Timeline({
  mode = "slide",
  tracks = DEMO_TRACKS,
  blocks = DEMO_BLOCKS,
  height = 320,
  duration = mode === "master" ? 20000 : 10000,
  playhead: controlledPlayhead,
  defaultPlayhead = 300,
  onPlayheadChange,
  onBlockSelect,
  onBlockOpen,
  onBack,
}: {
  mode?: TimelineMode;
  tracks?: Track[];
  blocks?: SlideBlock[];
  height?: number;
  duration?: number;
  playhead?: number;
  defaultPlayhead?: number;
  onPlayheadChange?: (timeMs: number) => void;
  onBlockSelect?: (id: string) => void;
  onBlockOpen?: (id: string) => void;
  onBack?: () => void;
}) {
  const master = mode === "master";
  const [internalPlayhead, setInternalPlayhead] = useState(defaultPlayhead);
  const playhead = controlledPlayhead ?? internalPlayhead;
  const setPlayhead = (timeMs: number) => {
    if (controlledPlayhead === undefined) setInternalPlayhead(timeMs);
    onPlayheadChange?.(timeMs);
  };
  const maxMs = duration;
  const toPx = master ? sec : ms;                 // shared time→px scale per view
  const pxPer = master ? PX_PER_S / 1000 : PX_PER_MS;

  // Measure the element the pointer events live on (the ruler container), so the
  // scrub origin can't desync from a separate ref.
  const scrub = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPlayhead(Math.min(duration, Math.max(0, Math.round((e.clientX - r.left) / pxPer))));
  };
  const [drag, setDrag] = useState(false);

  return (
    <div className="flex flex-col bg-c-bg border-t border-c-border overflow-hidden" style={{ height }}>
      {/* header: transport | ruler | zoom */}
      <div className="flex h-[40px] shrink-0 border-b border-c-border">
        <Transport current={playhead} duration={duration} mode={mode} />
        <div
          className="flex-1 relative cursor-ew-resize"
          role="slider"
          aria-label="Playhead"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={playhead}
          onPointerDown={e => { setDrag(true); scrub(e); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }}
          onPointerMove={e => drag && scrub(e)}
          onPointerUp={() => setDrag(false)}
        >
          {master ? <SecondRuler maxMs={maxMs} /> : <Ruler maxMs={maxMs} />}
          {/* playhead handle */}
          <div className="absolute top-[4px] -translate-x-1/2 pointer-events-none" style={{ left: toPx(playhead) }}>
            <svg width="12" height="10" viewBox="0 0 12 10"><path d="M0 0h12v4l-6 6-6-6V0Z" fill={BLUE} /></svg>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-[8px] px-[12px] border-l border-c-border">
          {/* zoom slider */}
          <div className="relative w-[91px] h-[6px] rounded-full bg-c-bg-secondary">
            <div className="absolute left-0 top-0 h-[6px] w-[12px] rounded-full" style={{ backgroundColor: BLUE }} />
            <div className="absolute size-[12px] rounded-full bg-white shadow-[0px_1px_3px_rgba(0,0,0,0.2)] top-1/2 -translate-y-1/2" style={{ left: 6 }} />
          </div>
          <button aria-label="Collapse timeline" className="size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover">
            <PanelBottomClose size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* body */}
      <div className="flex-1 overflow-y-auto relative">
        {master ? (
          <>
            <BlockTrack blocks={blocks} onSelect={onBlockSelect} onOpen={onBlockOpen} />
            <BaseVideoTrack />
          </>
        ) : (
          <>
            {/* ← Project back affordance — slide-local view (you drilled INTO a slide) */}
            <div className="flex items-center" style={{ height: ROW_LAYER }}>
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to project"
                className={clsx(FONT, "shrink-0 flex items-center gap-[4px] pl-[8px] pr-[8px] h-full border-r border-c-border text-[11px] font-[450] text-c-text-secondary hover:text-c-text")}
                style={{ width: LEFT_W }}
              >
                <ChevronLeftBack size={14} strokeWidth={1.5} className="shrink-0" />
                <span>Project</span>
              </button>
            </div>
            {tracks.map((t, i) => <TrackRows key={i} track={t} />)}
          </>
        )}
        {/* shared playhead line spanning the body */}
        <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: LEFT_W + toPx(playhead), backgroundColor: BLUE }} />
      </div>
    </div>
  );
}
