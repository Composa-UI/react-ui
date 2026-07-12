import { useState } from "react";
import { PropertyPanel, type ClipSpeed, type ElementEffectSetting, type ElementFillSetting, type ElementLayoutGuideSetting, type ElementLayoutSettings, type ElementSelectionColorSetting, type ElementStrokeSetting, type ElementTypographySettings, type InspectorExportSetting, type ProjectFrameRate, type SlideBackgroundType, type SlideTransitionDirection, type SlideTransitionEasing, type SlideTransitionType } from "./components/ui3/PropertyPanel";
import SlidesTemplate from "./imports/SlidesTemplate";
import { SlidesPanel, type SlideData } from "./components/ui3/SlidesPanel";
import { SlideInspector } from "./components/ui3/SlideInspector";
import { Timeline, type BaseClipBlock } from "./components/ui3/Timeline";
import { LayerList, type LayerNode } from "./components/ui3/LayerList";
import { NavRail } from "./components/ui3/NavRail";
import { CompositionPanel } from "./components/ui3/CompositionPanel";
import { AssetsPanel, type AssetFilter, type AssetItem } from "./components/ui3/AssetsPanel";
import { CreationToolbar } from "./components/ui3/CreationToolbar";
import { Button } from "./components/ui3/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./components/ui3/Dialog";
import { Tooltip, TooltipProvider } from "./components/ui3/Tooltip";
import { ComposaModeProvider } from "./components/ui3/useComposaMode";
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
  const [selectionColors, setSelectionColors] = useState<ElementSelectionColorSetting[]>([
    { id: "selection-brand", color: "#0D99FF", opacity: 100, usageCount: 4 },
    { id: "selection-ink", color: "#1E1E1E", opacity: 80, usageCount: 2 },
  ]);
  const [overlayContractOpen, setOverlayContractOpen] = useState(true);
  const [clipContract, setClipContract] = useState<{ name: string; start: number; duration: number; trimIn: number; trimOut: number; speed: ClipSpeed }>({
    name: "hero-cover", start: 0, duration: 8, trimIn: 10, trimOut: 18, speed: 1,
  });
  const [projectContract, setProjectContract] = useState<{ width: number; height: number; frameRate: ProjectFrameRate; duration: number; playhead: number }>({
    width: 1920, height: 1080, frameRate: 30, duration: 30, playhead: 0,
  });
  const [exportContract, setExportContract] = useState<InspectorExportSetting[]>([
    { id: "export-1", scale: 1, suffix: "", format: "PNG" },
  ]);
  const [clipBlocks, setClipBlocks] = useState<BaseClipBlock[]>([
    { id: "clip-1", name: "hero-cover.mp4", range: [1000, 7000], selected: true, tint: "linear-gradient(135deg,#1f2937,#475569)" },
    { id: "clip-2", name: "product.mp4", range: [8000, 12000], tint: "linear-gradient(135deg,#14532d,#16a34a)" },
  ]);
  const [layerContracts, setLayerContracts] = useState<LayerNode[]>([
    { id: "frame", name: "Hero", type: "frame", children: [{ id: "title", name: "Title", type: "text" }] },
    { id: "image", name: "Cover", type: "image", locked: true },
  ]);
  const [selectedLayerContracts, setSelectedLayerContracts] = useState<string[]>(["title"]);
  const [layerSelectionAnchor, setLayerSelectionAnchor] = useState("title");
  const [elementContract, setElementContract] = useState<{
    typography: ElementTypographySettings; layout: ElementLayoutSettings; fills: ElementFillSetting[]; strokes: ElementStrokeSetting[]; effects: ElementEffectSetting[];
  }>({
    typography: { fontFamily: "Inter", fontWeight: "Medium", fontSize: 48, lineHeight: 58, letterSpacing: 0, align: "left", verticalAlign: "middle" },
    layout: { mode: "vertical", gap: 8, padding: { top: 16, right: 16, bottom: 16, left: 16 }, align: "mc", widthMode: "fixed", heightMode: "hug", clipsContent: true },
    fills: [{ id: "fill-1", color: "#1e1e1e", opacity: 100, visible: true }],
    strokes: [{ id: "stroke-1", color: "#0d99ff", opacity: 100, visible: true, weight: 1, align: "inside" }],
    effects: [{ id: "effect-1", type: "Drop shadow", visible: true }],
  });
  const [contractAssets, setContractAssets] = useState<AssetItem[]>([
    { id: "asset-image", name: "cover.png", kind: "image", tint: "linear-gradient(135deg,#7c5cff,#ff6ac1)", inUseCount: 3 },
    { id: "asset-video", name: "intro.mp4", kind: "video", tint: "linear-gradient(135deg,#111827,#374151)", duration: "0:24" },
    { id: "asset-upload", name: "b-roll.mp4", kind: "video", status: "uploading", progress: 62 },
    { id: "asset-error", name: "damaged.png", kind: "image", status: "error", errorMessage: "Upload failed" },
  ]);
  const [slideContract, setSlideContract] = useState<{
    name: string; start: number; duration: number; skipped: boolean;
    backgroundType: SlideBackgroundType; backgroundColor: string; backgroundOpacity: number;
    transitionType: SlideTransitionType; transitionDirection: SlideTransitionDirection; transitionDuration: number; transitionEasing: SlideTransitionEasing;
    guides: ElementLayoutGuideSetting[];
  }>({
    name: "Opening title", start: 0, duration: 5, skipped: false,
    backgroundType: "solid", backgroundColor: "#1e1e1e", backgroundOpacity: 100,
    transitionType: "push", transitionDirection: "right", transitionDuration: 500,
    transitionEasing: "ease-in-out",
    guides: [{ id: "guide-1", type: "Grid", visible: true, size: 8 }],
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
          layoutGuides={slideContract.guides}
          onAddLayoutGuide={() => setSlideContract(value => ({ ...value, guides: [...value.guides, { id: `guide-${Date.now()}`, type: "Columns", visible: true, size: 8 }] }))}
          onUpdateLayoutGuide={(id, patch) => setSlideContract(value => ({ ...value, guides: value.guides.map(guide => guide.id === id ? { ...guide, ...patch } : guide) }))}
          onRemoveLayoutGuide={id => setSlideContract(value => ({ ...value, guides: value.guides.filter(guide => guide.id !== id) }))}
          selectionColors={selectionColors}
          onUpdateSelectionColor={(id, patch) => setSelectionColors(value => value.map(color => color.id === id ? { ...color, ...patch } : color))}
          onSelectAllUsingColor={id => console.info("Select all using color", id)}
          onDuplicateSlide={() => console.info("Duplicate slide")}
          onDeleteSlide={() => console.info("Delete slide")}
        />
      </div>
    );
  }

  if (view === "selection-colors-empty") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: "#e6e6e6" }}>
      <PropertyPanel multiSelect selectionColors={[]} />
    </div>;
  }

  if (view === "overlay-theme-contract") {
    return (
      <TooltipProvider>
        <div data-composa-mode="dark" className="h-screen w-screen grid place-items-center bg-c-bg text-c-text">
          <ComposaModeProvider>
          <div className="flex items-center gap-[8px]">
            <Tooltip label="Dark portal tooltip" delayDuration={0}>
              <Button label="Hover for tooltip" variant="Secondary" />
            </Tooltip>
            <Button label="Open modal" onClick={() => setOverlayContractOpen(true)} />
          </div>
          <Modal open={overlayContractOpen} onClose={() => setOverlayContractOpen(false)} width={320}>
            <ModalHeader title="Dark portal contract" onClose={() => setOverlayContractOpen(false)} />
            <ModalBody padding scrollable={false}>Portal content inherits the active Composa mode.</ModalBody>
            <ModalFooter><Button label="Done" onClick={() => setOverlayContractOpen(false)} /></ModalFooter>
          </Modal>
          </ComposaModeProvider>
        </div>
      </TooltipProvider>
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
        onDropFiles={files => console.info("Dropped", files.map(file => file.name))}
        onInsert={id => console.info("Insert on slide", id)} onAddToTimeline={id => console.info("Add to timeline", id)}
        onRename={(id, name) => setContractAssets(value => value.map(asset => asset.id === id ? { ...asset, name } : asset))}
        onDelete={id => setContractAssets(value => value.filter(asset => asset.id !== id))}
        onRetry={id => setContractAssets(value => value.map(asset => asset.id === id ? { ...asset, status: "uploading", progress: 0, errorMessage: undefined } : asset))}
        onContextMenu={id => console.info("Open asset context menu", id)} />
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

  if (view === "project-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: "#e6e6e6" }}>
      <PropertyPanel mode="project" projectName="Launch video" projectWidth={projectContract.width} projectHeight={projectContract.height}
        projectFrameRate={projectContract.frameRate} projectDuration={projectContract.duration} projectPlayhead={projectContract.playhead}
        onProjectWidthChange={width => setProjectContract(value => ({ ...value, width }))}
        onProjectHeightChange={height => setProjectContract(value => ({ ...value, height }))}
        onProjectFrameRateChange={frameRate => setProjectContract(value => ({ ...value, frameRate }))}
        onProjectDurationChange={duration => setProjectContract(value => ({ ...value, duration }))}
        onProjectPlayheadChange={playhead => setProjectContract(value => ({ ...value, playhead }))} />
    </div>;
  }

  if (view === "export-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: "#e6e6e6" }}>
      <PropertyPanel mode="slide" slideName="Opening title" exportSettings={exportContract} exportTargetName="Opening title"
        onAddExportSetting={() => setExportContract(value => [...value, { id: `export-${value.length + 1}`, scale: 1, suffix: "", format: "PNG" }])}
        onRemoveExportSetting={id => setExportContract(value => value.filter(setting => setting.id !== id))}
        onUpdateExportSetting={(id, patch) => setExportContract(value => value.map(setting => setting.id === id ? { ...setting, ...patch } : setting))}
        onExport={() => console.info("Export still image")} />
    </div>;
  }

  if (view === "base-clips-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "#e6e6e6" }}>
      <Timeline mode="master" height={220} baseClips={clipBlocks}
        onClipSelect={id => setClipBlocks(value => value.map(clip => ({ ...clip, selected: clip.id === id })))}
        onClipMove={(id, startMs) => setClipBlocks(value => value.map(clip => clip.id === id ? { ...clip, range: [startMs, startMs + clip.range[1] - clip.range[0]] } : clip))}
        onClipTrim={(id, edge, timeMs) => setClipBlocks(value => value.map(clip => clip.id === id ? { ...clip, range: edge === "start" ? [timeMs, clip.range[1]] : [clip.range[0], timeMs] } : clip))} />
    </div>;
  }

  if (view === "layers-contract") {
    const updateLayer = (id: string, patch: Partial<LayerNode>, nodes: LayerNode[]): LayerNode[] => nodes.map(node => node.id === id ? { ...node, ...patch } : { ...node, children: node.children ? updateLayer(id, patch, node.children) : undefined });
    return <div style={{ height: "100vh", width: "100vw", display: "flex", background: "#e6e6e6" }}>
      <LayerList layers={layerContracts} selectedIds={selectedLayerContracts}
        onSelectionChange={(id, modifiers) => {
          const order = [...(modifiers.visibleOrder ?? ["frame", "title", "image"])];
          const anchor = order.includes(layerSelectionAnchor) ? layerSelectionAnchor : id;
          setSelectedLayerContracts(value => modifiers.range
            ? order.slice(Math.min(order.indexOf(anchor), order.indexOf(id)), Math.max(order.indexOf(anchor), order.indexOf(id)) + 1)
            : modifiers.toggle ? value.includes(id) ? value.filter(item => item !== id) : [...value, id] : [id]);
          if (!modifiers.range) setLayerSelectionAnchor(id);
        }}
        onVisibilityChange={(id, visible) => setLayerContracts(value => updateLayer(id, { hidden: !visible }, value))}
        onLockChange={(id, locked) => setLayerContracts(value => updateLayer(id, { locked }, value))}
        onRenameRequest={id => console.info("Rename layer", id)} onContextMenu={id => console.info("Layer menu", id)}
        onReorder={(sourceId, targetId, position) => console.info("Reorder", sourceId, targetId, position)}
        onReparent={(sourceId, parentId) => console.info("Reparent", sourceId, parentId)} />
      <div style={{ flex: 1 }} />
    </div>;
  }

  if (view === "element-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", gap: 20, justifyContent: "flex-end", background: "#e6e6e6" }}>
      <PropertyPanel elementType="text" typography={elementContract.typography} onTypographyChange={patch => setElementContract(value => ({ ...value, typography: { ...value.typography, ...patch } }))}
        fills={elementContract.fills} onUpdateFill={(id, patch) => setElementContract(value => ({ ...value, fills: value.fills.map(item => item.id === id ? { ...item, ...patch } : item) }))}
        strokes={elementContract.strokes} onUpdateStroke={(id, patch) => setElementContract(value => ({ ...value, strokes: value.strokes.map(item => item.id === id ? { ...item, ...patch } : item) }))}
        effects={elementContract.effects} onUpdateEffect={(id, patch) => setElementContract(value => ({ ...value, effects: value.effects.map(item => item.id === id ? { ...item, ...patch } : item) }))} />
      <PropertyPanel elementType="frame-auto" layout={elementContract.layout} onLayoutChange={patch => setElementContract(value => ({ ...value, layout: { ...value.layout, ...patch } }))}
      />
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
