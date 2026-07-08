import { useState } from "react";
import { clsx } from "clsx";
import { ChevronDown, Play, Contrast, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "./Panel";

// ─── Slide inspector (right panel) ──────────────────────────────────────────────
// Componentized from the study export (`imports/SlidesTemplate` → SlidesSidebarRight).
// Figma-dark surface; colours flow through the `slides-*` tokens (styles/slides.css,
// shared with SlidesPanel). Sections: multiplayer/tabs header · slide title ·
// Template style · Background.

const INTER = { fontFamily: "Inter, sans-serif" } as const;

// ── Multiplayer + tabs header ──────────────────────────────────────────────────
function HeaderDual() {
  const [tab, setTab] = useState<"design" | "prototype">("design");
  return (
    <div className="shrink-0 w-full bg-slides-bg border-b border-slides-border flex flex-col gap-[8px] p-[8px]">
      {/* Multiplayer row */}
      <div className="flex items-center justify-between pl-[4px] w-full">
        <button className="flex items-center gap-[2px]">
          <span className="size-[24px] rounded-full bg-slides-avatar flex items-center justify-center">
            <span className="text-[13px] text-black/90 leading-[22px]" style={INTER}>W</span>
          </span>
          <ChevronDown size={11} className="text-white shrink-0" />
        </button>
        <div className="flex items-center gap-[8px]">
          {/* Play / present split */}
          <div className="flex gap-px items-stretch rounded-[5px] overflow-hidden w-[41px] h-[32px]">
            <button className="flex-1 flex items-center justify-center hover:bg-white/10">
              <Play size={14} fill="white" strokeWidth={0} className="text-white" />
            </button>
            <button className="w-[16px] flex items-center justify-center hover:bg-white/10">
              <ChevronDown size={11} className="text-white" />
            </button>
          </div>
          {/* Share */}
          <button className="h-[32px] px-[12px] rounded-[5px] bg-slides-accent flex items-center hover:brightness-95">
            <span className="text-[11px] text-white font-[450] leading-[16px]" style={INTER}>Share</span>
          </button>
        </div>
      </div>
      {/* Tab row */}
      <div className="flex items-center justify-between w-full">
        <div className="flex gap-[4px]">
          {(["design", "prototype"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx("h-[24px] px-[8px] rounded-[5px] flex items-center", tab === t ? "bg-slides-surface" : "bg-slides-bg")}
            >
              <span className={clsx("text-[11px] leading-[16px] capitalize", tab === t ? "font-[550] text-white" : "font-[450] text-white/70")} style={INTER}>{t}</span>
            </button>
          ))}
        </div>
        {/* Zoom */}
        <button className="h-[24px] w-[60px] rounded-[5px] bg-slides-bg relative flex items-center pl-[4px]">
          <span className="text-[11px] text-white leading-[16px]" style={INTER}>100%</span>
          <ChevronDown size={11} className="text-white absolute right-0 top-1/2 -translate-y-1/2" />
        </button>
      </div>
    </div>
  );
}

// ── Slide title bar ──────────────────────────────────────────────────────────
function SlideTitle({ title = "Slide 1" }: { title?: string }) {
  return (
    <div className="shrink-0 w-full h-[48px] bg-slides-bg border-b border-slides-border flex items-center justify-between pl-[16px] pr-[8px]">
      <span className="text-[13px] font-[550] text-white leading-[22px] tracking-[-0.0325px]" style={INTER}>{title}</span>
      <button className="p-[4px] flex"><Contrast size={16} className="text-white" /></button>
    </div>
  );
}

// ── Section shell (dark) ───────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="shrink-0 w-full bg-slides-bg border-b border-slides-border flex flex-col pb-[12px]">
      <div className="h-[40px] flex items-center px-[16px]">
        <span className="text-[11px] font-[550] text-white leading-[16px] tracking-[0.055px]" style={INTER}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Template style ─────────────────────────────────────────────────────────────
function TemplateStyleSection() {
  return (
    <Section title="Template style">
      <div className="px-[16px]">
        <button className="w-full h-[48px] rounded-[5px] border border-slides-border flex items-center pl-[7px] pr-[3px] gap-[8px] hover:bg-white/5">
          {/* 3-colour preview swatch */}
          <span className="size-[32px] rounded-[2.667px] border-[1.333px] border-white/10 overflow-hidden relative bg-white shrink-0">
            <span className="absolute inset-y-0 left-0 w-[10.67px] bg-[#e95000]" />
            <span className="absolute inset-y-0 left-[10.67px] w-[10.67px] bg-[#ffcd00]" />
            <span className="absolute inset-y-0 left-[21.33px] w-[10.67px] bg-[#100f10]" />
          </span>
          <span className="flex flex-col gap-[2px] items-start min-w-0 flex-1">
            <span className="text-[11px] font-[550] text-white leading-[16px]" style={INTER}>Radicle</span>
            <span className="text-[11px] text-white/70 leading-[16px] truncate w-full text-left" style={INTER}>Whyte Inktrap, Inter</span>
          </span>
          <ChevronDown size={16} className="text-white shrink-0" />
        </button>
      </div>
    </Section>
  );
}

// ── Background ─────────────────────────────────────────────────────────────────
function FillTypeIcon({ type, active }: { type: "solid" | "gradient" | "image"; active: boolean }) {
  const c = active ? "text-white" : "text-white/70";
  if (type === "solid") return <span className={clsx("size-[12px] rounded-[2px] bg-current", c)} />;
  if (type === "gradient") return <span className="size-[12px] rounded-[2px]" style={{ background: "linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.15) 100%)" }} />;
  return <ImageIcon size={13} className={c} />;
}

function BackgroundSection() {
  const [fill, setFill] = useState<"solid" | "gradient" | "image">("solid");
  return (
    <Section title="Background">
      {/* fill-type segmented */}
      <div className="px-[16px] py-[4px]">
        <div className="flex bg-slides-surface rounded-[5px] overflow-hidden">
          {(["solid", "gradient", "image"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFill(t)}
              className={clsx("flex-1 h-[24px] flex items-center justify-center rounded-[5px]", fill === t ? "bg-slides-bg border border-slides-border" : "bg-slides-surface")}
            >
              <FillTypeIcon type={t} active={fill === t} />
            </button>
          ))}
        </div>
      </div>
      {/* colour chit */}
      <div className="px-[16px] py-[4px]">
        <button className="w-full h-[24px] rounded-[5px] border border-slides-border flex items-center pr-[4px] hover:bg-white/5">
          <span className="size-[24px] flex items-center justify-center shrink-0">
            <span className="size-[14px] rounded-[2px] bg-slides-chit border border-white/10" />
          </span>
          <span className="flex-1 min-w-0 text-left text-[11px] text-white leading-[16px] truncate" style={INTER}>Color 1</span>
          <ChevronDown size={16} className="text-white shrink-0" />
        </button>
      </div>
    </Section>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
export function SlideInspector() {
  return (
    <div className="w-[240px] shrink-0 h-full flex flex-col bg-slides-bg border-l border-slides-hairline overflow-hidden">
      <HeaderDual />
      <SlideTitle />
      <ScrollArea thumbClassName="bg-white">
        <TemplateStyleSection />
        <BackgroundSection />
      </ScrollArea>
    </div>
  );
}
