import { useState } from "react";
import { PropertyPanel, type ClipSpeed, type SlideBackgroundType, type SlideTransitionDirection, type SlideTransitionEasing, type SlideTransitionType } from "./components/ui3/PropertyPanel";
import SlidesTemplate from "./imports/SlidesTemplate";
import { SlidesPanel, type SlideData } from "./components/ui3/SlidesPanel";
import { SlideInspector } from "./components/ui3/SlideInspector";
import { Timeline } from "./components/ui3/Timeline";
import { LayerList } from "./components/ui3/LayerList";
import { NavRail } from "./components/ui3/NavRail";
import { CompositionPanel } from "./components/ui3/CompositionPanel";
import { AssetsPanel, type AssetFilter, type AssetItem } from "./components/ui3/AssetsPanel";
import { CreationToolbar } from "./components/ui3/CreationToolbar";
import thumb0 from "./imports/SlidesTemplate/9bf3285fa6c14222923aa8fcd4bf31f6e40807d9.png";
import thumb1 from "./imports/SlidesTemplate/201951eb24dd285dd0794f4e790b8175c012bf20.png";
import thumb2 from "./imports/SlidesTemplate/4f36d4cb9f77c2e380641dd47deb24943efa0b8a.png";
import thumb3 from "./imports/SlidesTemplate/16da0f3d572c4e81a81819ed074b78b9021856c1.png";
import thumb4 from "./imports/SlidesTemplate/fb3c95b27b7857955e04f62e905c22514cca029c.png";
import thumb5 from "./imports/SlidesTemplate/6c2145074f835f12139b4a2a5e3bd8475c1fe34a.png";

const DEMO_SLIDES: SlideData[] = [
  { n: 1,  thumb: thumb0, selected: true },
  { n: 2,  thumb: thumb1, group: true, expanded: true },
  { n: 3,  thumb: thumb2, sub: true, comment: 3 },
  { n: 4,  thumb: thumb3, sub: true, motion: true },
  { n: 5,  thumb: thumb4, group: true, expanded: true, stacked: true, motion: true },
  { n: 10, thumb: thumb5 },
  { n: 11, thumb: thumb1 },
  { n: 12, thumb: thumb2 },
  { n: 13, thumb: thumb3 },
];

export default function Playground() {
  // ?view=slides = componentized SlidesPanel; ?view=slides-raw = the raw Figma export
  // (side-by-side fidelity check); default = property-panel fidelity set.
  const view = new URLSearchParams(window.location.search).get("view");
  const [nav, setNav] = useState("composition");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("2b");
  const [contractPlayhead, setContractPlayhead] = useState(300);
  const [contractPlaying, setContractPlaying] = useState(false);
  const [contractLoop, setContractLoop] = useState(false);
  const [contractX, setContractX] = useState(270);
  const [assetQuery, setAssetQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState<AssetFilter>("all");
  const [assetSelection, setAssetSelection] = useState<string | null>("asset-image");
  const [clipContract, setClipContract] = useState<{ name: string; start: number; duration: number; trimIn: number; trimOut: number; speed: ClipSpeed }>({
    name: "hero-cover", start: 0, duration: 8, trimIn: 10, trimOut: 18, speed: 1,
  });
  const contractAssets: AssetItem[] = [
    { id: "asset-image", name: "cover.png", kind: "image", tint: "linear-gradient(135deg,#7c5cff,#ff6ac1)" },
    { id: "asset-video", name: "intro.mp4", kind: "video", tint: "linear-gradient(135deg,#111827,#374151)", duration: "0:24" },
  ];
  const [slideContract, setSlideContract] = useState<{
    name: string; start: number; duration: number; skipped: boolean;
    backgroundType: SlideBackgroundType; backgroundColor: string; backgroundOpacity: number;
    transitionType: SlideTransitionType; transitionDirection: SlideTransitionDirection; transitionDuration: number; transitionEasing: SlideTransitionEasing;
  }>({
    name: "Opening title", start: 0, duration: 5, skipped: false,
    backgroundType: "solid", backgroundColor: "#1e1e1e", backgroundOpacity: 100,
    transitionType: "push", transitionDirection: "right", transitionDuration: 500,
    transitionEasing: "ease-in-out",
  });

  if (view === "slide-contract") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: "#e6e6e6" }}>
        <PropertyPanel
          mode="slide"
          slideName={slideContract.name}
          onSlideNameChange={name => setSlideContract(value => ({ ...value, name }))}
          slideStart={slideContract.start}
          slideDuration={slideContract.duration}
          onSlideStartChange={start => setSlideContract(value => ({ ...value, start }))}
          onSlideDurationChange={duration => setSlideContract(value => ({ ...value, duration }))}
          slideSkipped={slideContract.skipped}
          onSlideSkippedChange={skipped => setSlideContract(value => ({ ...value, skipped }))}
          slideBackgroundType={slideContract.backgroundType}
          slideBackgroundColor={slideContract.backgroundColor}
          slideBackgroundOpacity={slideContract.backgroundOpacity}
          onSlideBackgroundTypeChange={backgroundType => setSlideContract(value => ({ ...value, backgroundType }))}
          onSlideBackgroundColorChange={backgroundColor => setSlideContract(value => ({ ...value, backgroundColor }))}
          onSlideBackgroundOpacityChange={backgroundOpacity => setSlideContract(value => ({ ...value, backgroundOpacity }))}
          slideTransitionType={slideContract.transitionType}
          slideTransitionDirection={slideContract.transitionDirection}
          slideTransitionDuration={slideContract.transitionDuration}
          slideTransitionEasing={slideContract.transitionEasing}
          onSlideTransitionTypeChange={transitionType => setSlideContract(value => ({ ...value, transitionType }))}
          onSlideTransitionDirectionChange={transitionDirection => setSlideContract(value => ({ ...value, transitionDirection }))}
          onSlideTransitionDurationChange={transitionDuration => setSlideContract(value => ({ ...value, transitionDuration }))}
          onSlideTransitionEasingChange={transitionEasing => setSlideContract(value => ({ ...value, transitionEasing }))}
          onDuplicateSlide={() => console.info("Duplicate slide")}
          onDeleteSlide={() => console.info("Delete slide")}
        />
      </div>
    );
  }

  if (view === "controlled-contracts") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: "#e6e6e6" }}>
        <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          <LayerList selectedId={selectedLayerId} onSelectionChange={setSelectedLayerId} />
          <div style={{ flex: 1, display: "grid", placeItems: "center", font: "11px Inter, sans-serif" }}>
            Controlled layer: {selectedLayerId ?? "none"} · X: {contractX} · playhead: {contractPlayhead}ms
          </div>
          <PropertyPanel elementType="text" x={contractX} onXChange={setContractX} />
        </div>
        <Timeline height={220} playhead={contractPlayhead} onPlayheadChange={setContractPlayhead}
          playing={contractPlaying} onPlayingChange={setContractPlaying} loop={contractLoop} onLoopChange={setContractLoop}
          onStop={() => setContractPlayhead(0)} onAddKeyframe={timeMs => console.info("Add keyframe", timeMs)} />
      </div>
    );
  }

  if (view === "assets-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#e6e6e6" }}>
      <AssetsPanel assets={contractAssets} query={assetQuery} onQueryChange={setAssetQuery} filter={assetFilter} onFilterChange={setAssetFilter}
        selectedId={assetSelection} onSelect={setAssetSelection} onUpload={() => console.info("Upload")}
        onDropFiles={files => console.info("Dropped", files.map(file => file.name))} />
      <div style={{ flex: 1 }} />
    </div>;
  }

  if (view === "clip-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: "#e6e6e6" }}>
      <PropertyPanel mode="video-clip" clipName={clipContract.name} onClipNameChange={name => setClipContract(value => ({ ...value, name }))}
        clipSourceFile="hero-cover.mp4" clipSourceResolution="1920 × 1080" clipSourceDuration="1:24.00"
        clipStart={clipContract.start} clipDuration={clipContract.duration}
        onClipStartChange={start => setClipContract(value => ({ ...value, start }))}
        onClipDurationChange={duration => setClipContract(value => ({ ...value, duration }))}
        clipTrimIn={clipContract.trimIn} clipTrimOut={clipContract.trimOut}
        onClipTrimInChange={trimIn => setClipContract(value => ({ ...value, trimIn }))}
        onClipTrimOutChange={trimOut => setClipContract(value => ({ ...value, trimOut }))}
        clipSpeed={clipContract.speed} onClipSpeedChange={speed => setClipContract(value => ({ ...value, speed }))}
        onReplaceClip={() => console.info("Replace video")} onDeleteClip={() => console.info("Delete clip")} />
    </div>;
  }

  if (view === "slides-raw") {
    return (
      <div style={{ height: "100vh", width: "100vw" }}>
        <SlidesTemplate />
      </div>
    );
  }

  if (view === "editor" || view === "editor-dark") {
    // Full reskinned design-mode editor shell: nav rail · layers · canvas · inspector · timeline
    const dark = view === "editor-dark";
    return (
      <div
        {...(dark ? { "data-composa-mode": "dark" } : {})}
        style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", background: dark ? "#1e1e1e" : "#e6e6e6" }}
      >
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <NavRail active={nav} onSelect={setNav} />
          {nav === "composition" ? <CompositionPanel /> : nav === "assets" ? <AssetsPanel /> : (
            <div className="w-[240px] shrink-0 h-full flex items-center justify-center bg-c-bg border-r border-c-border">
              <span className="text-[11px] text-c-text-secondary font-[family-name:var(--composa-font-family)]">Agent — coming soon</span>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "70%", aspectRatio: "16/9", background: dark ? "#2c2c2c" : "#fff", borderRadius: 6, boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
            {/* creation toolbar floats over the canvas */}
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)" }}>
              <CreationToolbar />
            </div>
          </div>
          <PropertyPanel elementType="frame" />
        </div>
        {/* timeline is full-bleed (docked), no card wrapper */}
        <Timeline height={220} />
      </div>
    );
  }

  if (view === "inspector-modes") {
    return (
      <div style={{ display: "flex", gap: 20, padding: 24, height: "100%", background: "#e6e6e6", boxSizing: "border-box", overflowX: "auto" }}>
        <div style={{ height: "96%", flex: "0 0 auto" }}>
          <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>mode=project</div>
          <PropertyPanel mode="project" />
        </div>
        <div style={{ height: "96%", flex: "0 0 auto" }}>
          <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>mode=slide</div>
          <PropertyPanel mode="slide" />
        </div>
        <div style={{ height: "96%", flex: "0 0 auto" }}>
          <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>mode=video-clip</div>
          <PropertyPanel mode="video-clip" />
        </div>
      </div>
    );
  }

  if (view === "layers") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#e6e6e6" }}>
        <NavRail />
        <LayerList />
        <div style={{ flex: 1 }} />
      </div>
    );
  }

  if (view === "timeline" || view === "timeline-master") {
    return (
      <div style={{ height: "100vh", width: "100vw", background: "#e6e6e6", padding: 24, boxSizing: "border-box" }}>
        <Timeline height={360} mode={view === "timeline-master" ? "master" : "slide"} />
      </div>
    );
  }

  if (view === "slides") {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#1e1e1e" }}>
        <SlidesPanel slides={DEMO_SLIDES} />
        <div style={{ flex: 1 }} />
        <SlideInspector />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 20, padding: 24, height: "100%", background: "#e6e6e6", boxSizing: "border-box", overflowX: "auto" }}>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>component (§5.1)</div>
        <PropertyPanel elementType="component" />
      </div>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>frame (§5.6)</div>
        <PropertyPanel elementType="frame" />
      </div>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>frame-auto (auto layout — alignment + gap)</div>
        <PropertyPanel elementType="frame-auto" />
      </div>
      <div style={{ height: "96%", flex: "0 0 auto" }}>
        <div style={{ font: "600 11px system-ui", marginBottom: 6, color: "#555" }}>multiSelect (§5.8 — ColorInput)</div>
        <PropertyPanel multiSelect />
      </div>
    </div>
  );
}
