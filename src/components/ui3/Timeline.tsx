import { useState } from "react";
import { clsx } from "clsx";
import { Play, Diamond, Repeat, PanelBottomClose, PanelLeftClose, Hash, Square, Type, Minus, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Timeline ───────────────────────────────────────────────────────────────────
// Horizontal keyframe timeline (After-Effects / Figma-Slides style), componentized
// from the Figma export (node 2212-1693). Light theme. Data-driven: tracks → layer
// row + property lanes; keyframes/bars are positioned along a shared ms→px scale.
// The active accent (playhead, keyframes, zoom fill) is Figma blue #0d99ff.

const FONT = "font-[family-name:var(--composa-font-family)]";
const LEFT_W = 297;       // track-list width
const PX_PER_MS = 0.106;  // ~106px / 1000ms
const ROW_LAYER = 28;
const ROW_PROP = 24;
const BLUE = "#0d99ff";

const ms = (t: number) => t * PX_PER_MS;

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

// ── keyframe lane (bar + diamonds + connecting line) ──────────────────────────────
function Lane({ prop, height }: { prop: PropTrack; height: number }) {
  const kfs = prop.keyframes;
  const first = kfs.length ? Math.min(...kfs) : 0;
  const last = kfs.length ? Math.max(...kfs) : 0;
  return (
    <div className="flex-1 relative" style={{ height }}>
      {prop.bar && (
        <div
          className="absolute top-1/2 -translate-y-1/2 h-[10px] rounded-[3px] bg-c-bg-secondary group/bar"
          style={{ left: ms(prop.bar[0]), width: ms(prop.bar[1] - prop.bar[0]) }}
        >
          {/* trim handles (edge-drag to trim start/end) */}
          <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-[3px] bg-c-border cursor-ew-resize" />
          <span className="absolute right-0 top-0 h-full w-[3px] rounded-r-[3px] bg-c-border cursor-ew-resize" />
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
              className="absolute top-1/2 -translate-y-1/2 h-[10px] rounded-[3px] bg-c-bg-secondary"
              style={{ left: ms(track.bar[0]), width: ms(track.bar[1] - track.bar[0]) }}
            >
              <span className="absolute left-0 top-0 h-full w-[3px] rounded-l-[3px] bg-c-border cursor-ew-resize" />
              <span className="absolute right-0 top-0 h-full w-[3px] rounded-r-[3px] bg-c-border cursor-ew-resize" />
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

// ── transport toolbar ─────────────────────────────────────────────────────────────
function Transport({ current, duration }: { current: number; duration: number }) {
  const fmt = (n: number) => String(Math.round(n)).padStart(5, "0");
  const IconBtn = ({ children, label }: { children: React.ReactNode; label: string }) => (
    <button aria-label={label} className="size-[24px] rounded-c-md flex items-center justify-center text-c-icon hover:bg-c-bg-hover">{children}</button>
  );
  return (
    <div className="shrink-0 flex items-center gap-[8px] px-[8px] border-r border-c-border" style={{ width: LEFT_W }}>
      <IconBtn label="Play"><Play size={16} fill="currentColor" strokeWidth={0} /></IconBtn>
      <IconBtn label="Add keyframe"><Diamond size={16} strokeWidth={1.5} /></IconBtn>
      <div className="w-[8px]" />
      {/* time group */}
      <div className="flex items-center h-[24px] rounded-c-md overflow-hidden">
        <div className="w-[42px] h-full bg-c-bg-secondary flex items-center justify-end pr-[6px]">
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text tabular-nums")}>{fmt(current)}</span>
        </div>
        <div className="w-[46px] h-full bg-c-bg-secondary flex items-center justify-end pr-[6px] ml-px">
          <span className={clsx(FONT, "text-[11px] font-[450] text-c-text-secondary tabular-nums")}>{fmt(duration)}</span>
        </div>
        <div className="size-[24px] bg-c-bg-secondary ml-px flex items-center justify-center">
          <span className={clsx(FONT, "text-[11px] text-c-text-secondary")}>ms</span>
        </div>
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

// ── ruler ─────────────────────────────────────────────────────────────────────────
function Ruler({ maxMs }: { maxMs: number }) {
  const ticks: number[] = [];
  for (let t = 1000; t <= maxMs; t += 1000) ticks.push(t);
  return (
    <div className="flex-1 relative overflow-hidden">
      {ticks.map(t => (
        <span key={t} className={clsx(FONT, "absolute top-1/2 -translate-y-1/2 text-[11px] text-c-text-secondary tabular-nums")} style={{ left: ms(t) }}>{t}</span>
      ))}
    </div>
  );
}

export function Timeline({ tracks = DEMO_TRACKS, height = 320, duration = 10000 }: { tracks?: Track[]; height?: number; duration?: number }) {
  const [playhead, setPlayhead] = useState(300);
  const maxMs = duration;

  // Measure the element the pointer events live on (the ruler container), so the
  // scrub origin can't desync from a separate ref.
  const scrub = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    setPlayhead(Math.min(duration, Math.max(0, Math.round((e.clientX - r.left) / PX_PER_MS))));
  };
  const [drag, setDrag] = useState(false);

  return (
    <div className="flex flex-col bg-c-bg border-t border-c-border overflow-hidden" style={{ height }}>
      {/* header: transport | ruler | zoom */}
      <div className="flex h-[40px] shrink-0 border-b border-c-border">
        <Transport current={playhead} duration={duration} />
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
          <Ruler maxMs={maxMs} />
          {/* playhead handle */}
          <div className="absolute top-0 -translate-x-1/2 pointer-events-none" style={{ left: ms(playhead) }}>
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
        {tracks.map((t, i) => <TrackRows key={i} track={t} />)}
        {/* playhead line spanning the body */}
        <div className="absolute top-0 bottom-0 w-px pointer-events-none" style={{ left: LEFT_W + ms(playhead), backgroundColor: BLUE }} />
      </div>
    </div>
  );
}
