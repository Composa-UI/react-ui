import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PropertyPanel, type ClipSpeed, type ElementEffectSetting, type ElementFillSetting, type ElementLayoutGuideSetting, type ElementLayoutSettings, type ElementSelectionColorSetting, type ElementStrokeSetting, type ElementTypographySettings, type InspectorExportSetting, type ProjectFrameRate, type SlideBackgroundType, type SlideTransitionDirection, type SlideTransitionEasing, type SlideTransitionType } from "./components/ui3/PropertyPanel";
import SlidesTemplate from "./imports/SlidesTemplate";
import { SlidesPanel, type SlideData } from "./components/ui3/SlidesPanel";
import { SlideInspector } from "./components/ui3/SlideInspector";
import { Timeline, type BaseClipBlock, type TimelineEasingPreset, type TimelineViewport, type Track } from "./components/ui3/Timeline";
import type { EasingApplyScope, EasingPreset, CubicBezier } from "./components/ui3/easing";
import { LayerList, type LayerNode } from "./components/ui3/LayerList";
import { NavRail } from "./components/ui3/NavRail";
import { CompositionPanel } from "./components/ui3/CompositionPanel";
import { AssetsPanel, type AssetFilter, type AssetItem } from "./components/ui3/AssetsPanel";
import { CreationToolbar } from "./components/ui3/CreationToolbar";
import { Button } from "./components/ui3/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./components/ui3/Dialog";
import { Tooltip, TooltipProvider } from "./components/ui3/Tooltip";
import { ComposaModeProvider } from "./components/ui3/useComposaMode";
import { SegmentedControl } from "./components/ui3/SegmentedControl";
import { AlignmentControl, type AlignmentValue } from "./components/ui3/AlignmentControl";
import { LayerTypeIcon, type LayerAutoLayoutMode, type LayerIconType } from "./components/ui3/LayerTypeIcon";
import { AnchoredInspectorOverlay } from "./components/ui3/AnchoredInspectorOverlay";
import { InspectorDialog } from "./components/ui3/InspectorDialog";
import { Menu, MenuRow, PopoverMenu } from "./components/ui3/Menu";
import { AgentPanel, type AgentConversation, type AgentConversationSummary } from "./components/ui3/AgentPanel";
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

function Issue66FixtureCard({ mode }: { mode: "light" | "dark" }) {
  const [flow, setFlow] = useState("horizontal");
  const [alignment, setAlignment] = useState<AlignmentValue>("mc");
  const [viewport, setViewport] = useState<TimelineViewport>({ startMs: 0, endMs: 3_000 });
  const fixtureTracks: Track[] = Array.from({ length: 8 }, (_, index) => ({
    id: `${mode}-track-${index}`,
    name: `Layer ${index + 1}`,
    type: index % 2 ? "text" : "frame",
    depth: index % 3 === 0 ? 0 : 1,
    expanded: false,
    props: [],
  }));

  return (
    <section
      data-composa-mode={mode === "dark" ? "dark" : undefined}
      className="min-w-0 rounded-c-lg bg-c-bg text-c-text shadow-c-200 overflow-hidden"
    >
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} shared anatomy</h2>
      </header>
      <div className="p-[16px] grid gap-[16px]">
        <div className="grid gap-[6px]">
          <span className="text-[9px] text-c-text-secondary">Flow · 160px constrained</span>
          <SegmentedControl
            ariaLabel={`${mode} flow`}
            className="w-[160px]"
            value={flow}
            onChange={setFlow}
            segments={[
              { value: "vertical", label: "Vertical" },
              { value: "horizontal", label: "Horizontal" },
              { value: "wrap", label: "Wrap" },
            ]}
          />
        </div>
        <div className="grid gap-[6px]">
          <span className="text-[9px] text-c-text-secondary">Alignment · shared segmented surface</span>
          <AlignmentControl
            ariaLabel={`${mode} alignment`}
            value={alignment}
            onChange={setAlignment}
          />
        </div>
      </div>
      <Timeline height={160} duration={6_000} tracks={fixtureTracks} viewport={viewport} onViewportChange={setViewport} />
    </section>
  );
}

const ISSUE_67_ICON_ROWS: { label: string; type: LayerIconType; autoLayoutMode?: LayerAutoLayoutMode; tone?: "primary" | "secondary"; state?: "selected" | "disabled" }[] = [
  { label: "Plain frame", type: "frame" },
  { label: "Horizontal auto layout", type: "frame", autoLayoutMode: "horizontal", state: "selected" },
  { label: "Vertical auto layout", type: "frame", autoLayoutMode: "vertical" },
  { label: "Wrap auto layout", type: "frame", autoLayoutMode: "wrap" },
  { label: "Text", type: "text" },
  { label: "Image", type: "image", tone: "secondary", state: "disabled" },
  { label: "Shape", type: "shape" },
  { label: "Compatibility group", type: "group" },
];

function Issue67IconMatrix({ mode }: { mode: "light" | "dark" }) {
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="rounded-c-lg overflow-hidden bg-c-bg text-c-text shadow-c-200">
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} icon semantics</h2>
      </header>
      <div className="p-[12px] grid gap-[2px]">
        {ISSUE_67_ICON_ROWS.map(row => <div key={row.label} data-icon-fixture-state={row.state ?? "default"}
          className={`h-[32px] px-[8px] flex items-center gap-[8px] rounded-c-sm ${row.state === "selected" ? "bg-c-bg-selected" : ""} ${row.state === "disabled" ? "opacity-45" : ""}`}>
          <LayerTypeIcon type={row.type} autoLayoutMode={row.autoLayoutMode} tone={row.tone} />
          <span className="text-[11px]">{row.label}</span>
        </div>)}
      </div>
    </section>
  );
}

const ISSUE_70_LAYERS: LayerNode[] = [
  { id: "hero", name: "Hero frame", type: "frame", autoLayoutMode: "vertical", children: [
    { id: "title", name: "Title", type: "text" },
    { id: "artwork", name: "Artwork", type: "image" },
  ] },
  { id: "footer", name: "Footer", type: "shape" },
];

const ISSUE_70_TRACKS: Track[] = [
  { id: "hero", name: "Hero frame", type: "frame", autoLayoutMode: "vertical", selectionState: "selected", props: [] },
  { id: "title", name: "Title", type: "text", depth: 1, selectionState: "descendant", props: [] },
  { id: "artwork", name: "Artwork", type: "image", depth: 1, selectionState: "descendant", props: [] },
  { id: "footer", name: "Footer", type: "shape", props: [] },
];

function Issue70RowStateFixture({ mode }: { mode: "light" | "dark" }) {
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="min-w-0 overflow-hidden rounded-c-lg bg-c-bg text-c-text shadow-c-200">
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} row-state projection</h2>
      </header>
      <div className="h-[170px] flex bg-c-bg">
        <LayerList layers={ISSUE_70_LAYERS} selectedIds={["hero"]} expandedIds={["hero"]} />
        <div className="flex-1 p-[16px] text-[9px] leading-[14px] text-c-text-secondary">
          Selected parent/self uses emphasized blue. Descendants stay de-emphasized until hover promotes the hovered row.
        </div>
      </div>
      <Timeline height={170} duration={4_000} tracks={ISSUE_70_TRACKS} onTrackSelect={() => undefined} />
    </section>
  );
}

function Issue77AnchoredOverlayFixture({ mode, collisionProbe = false }: { mode: "light" | "dark"; collisionProbe?: boolean }) {
  const [open, setOpen] = useState(false);
  const [nestedOpen, setNestedOpen] = useState(false);
  const [menuChosen, setMenuChosen] = useState(false);
  const [compatibilityOpen, setCompatibilityOpen] = useState(false);
  return (
    <section data-composa-mode={mode} data-composa-overlay-boundary
      className="relative h-[360px] min-w-0 overflow-hidden rounded-c-lg bg-c-bg-secondary text-c-text shadow-c-200">
      <div data-issue-77-clipped-inspector={mode} className="absolute inset-y-0 right-0 w-[240px] overflow-hidden border-l border-c-border bg-c-bg">
        <header className="h-[40px] flex items-center border-b border-c-border px-[16px] text-[11px] font-[550]">
          {mode === "dark" ? "Dark" : "Light"} clipped inspector
        </header>
        <div className="h-full overflow-hidden p-[12px] grid content-start gap-[12px]">
          <div className="flex items-center justify-between gap-[8px]">
            <span className="text-[11px]">Stroke settings</span>
            <AnchoredInspectorOverlay open={open} onClose={() => { setNestedOpen(false); setOpen(false); }} ariaLabel={`${mode} anchored inspector overlay`}
              side={collisionProbe ? "right" : "left"}
              blockOutsideDismiss={nestedOpen}
              trigger={<button type="button" aria-label={`Open ${mode} anchored overlay`} onClick={() => setOpen(true)}
                className="h-[24px] rounded-c-sm bg-c-bg-secondary px-[8px] text-[11px] hover:bg-c-bg-hover">Open</button>}>
              <div className="flex h-[40px] items-center border-b border-c-border px-[12px] text-[11px] font-[550]">Anchored settings</div>
              <div className="grid gap-[8px] p-[12px]">
                <label className="grid gap-[4px] text-[9px] text-c-text-secondary">
                  Name
                  <input autoFocus aria-label={`${mode} overlay name`} defaultValue="Inside"
                    className="h-[24px] rounded-c-sm bg-c-bg-secondary px-[8px] text-[11px] text-c-text outline-none focus:ring-1 focus:ring-c-border-selected" />
                </label>
                <PopoverMenu trigger={<button type="button" aria-label={`Open ${mode} overlay menu`}
                  className="h-[24px] w-full rounded-c-sm bg-c-bg-secondary px-[8px] text-[11px]">Overlay menu</button>}>
                  {close => <Menu><MenuRow label={`${mode} overlay menu choice`} onClick={() => { setMenuChosen(true); close(); }} /></Menu>}
                </PopoverMenu>
                <span role="status" className="text-[9px] text-c-text-secondary">{menuChosen ? `${mode} overlay menu chosen` : ""}</span>
                <button type="button" aria-label={`Open ${mode} nested picker`}
                  onPointerDown={() => setNestedOpen(true)} onClick={() => setNestedOpen(true)}
                  className="h-[24px] rounded-c-sm bg-c-bg-secondary px-[8px] text-[11px]">Nested picker</button>
                <DialogPrimitive.Root open={nestedOpen} onOpenChange={setNestedOpen}>
                  <DialogPrimitive.Portal>
                    <DialogPrimitive.Content aria-label={`${mode} nested picker`} data-composa-mode={mode}
                      className="fixed left-1/2 top-1/2 z-[80] grid w-[160px] -translate-x-1/2 -translate-y-1/2 gap-[8px] rounded-c-lg bg-c-bg p-[12px] text-c-text shadow-c-500 outline-none">
                    <button type="button" aria-label={`${mode} nested choice`}
                      className="h-[24px] rounded-c-sm bg-c-bg-selected px-[8px] text-[11px]">Choice</button>
                    </DialogPrimitive.Content>
                  </DialogPrimitive.Portal>
                </DialogPrimitive.Root>
                <button type="button" onClick={() => setOpen(false)}
                  className="h-[24px] rounded-c-sm bg-c-bg-selected px-[8px] text-[11px]">Done</button>
                {collisionProbe && <div aria-hidden className="h-[420px]" />}
              </div>
            </AnchoredInspectorOverlay>
          </div>
          <InspectorDialog open={compatibilityOpen} onClose={() => setCompatibilityOpen(false)}
            ariaLabel={`${mode} inspector dialog compatibility`}
            trigger={<button type="button" aria-label={`Open ${mode} inspector dialog compatibility`}
              onClick={() => setCompatibilityOpen(true)}
              className="h-[24px] w-full rounded-c-sm bg-c-bg-secondary px-[8px] text-[11px]">Compatibility dialog</button>}>
            <div className="grid gap-[8px] p-[12px]">
              <button type="button" aria-label={`${mode} compatibility action`}
                className="h-[24px] rounded-c-sm bg-c-bg-selected px-[8px] text-[11px]">Action</button>
            </div>
          </InspectorDialog>
        </div>
      </div>
      <div className="absolute bottom-[12px] left-[12px] max-w-[180px] text-[9px] leading-[14px] text-c-text-secondary">
        The inspector clips its own contents. The overlay portals outside it and flips or shifts inside the viewport.
      </div>
    </section>
  );
}

const ISSUE_72_DURATION_TRACKS: Track[] = [
  { id: "selected-duration", name: "Selected duration", type: "frame", bar: [1_500, 4_200], selectionState: "selected", props: [] },
  { id: "neutral-duration", name: "Neutral duration", type: "text", bar: [2_400, 4_700], props: [] },
  { id: "clipped-start", name: "Continues before", type: "shape", bar: [0, 2_200], props: [] },
  { id: "clipped-end", name: "Continues after", type: "image", bar: [4_300, 7_000], props: [] },
];

function Issue72DurationBarFixture({ mode }: { mode: "light" | "dark" }) {
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="min-w-0 overflow-hidden rounded-c-lg bg-c-bg text-c-text shadow-c-200">
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} parent duration bars</h2>
      </header>
      <Timeline
        height={210}
        duration={8_000}
        viewport={{ startMs: 1_000, endMs: 6_000 }}
        tracks={ISSUE_72_DURATION_TRACKS}
        onTrackSelect={() => undefined}
      />
    </section>
  );
}

const ISSUE_72_EASING_KEYFRAMES: Array<{ id: string; timeMs: number; easing: TimelineEasingPreset; easingSelected?: boolean }> = [
  { id: "linear", timeMs: 500, easing: "linear" },
  { id: "ease-in", timeMs: 1_500, easing: "ease-in" },
  { id: "ease-out", timeMs: 2_500, easing: "ease-out" },
  { id: "ease-in-out", timeMs: 3_500, easing: "ease-in-out" },
  { id: "custom", timeMs: 4_500, easing: "custom" },
  { id: "end", timeMs: 5_500, easing: "linear" },
];

function Issue72EasingFixture({ mode }: { mode: "light" | "dark" }) {
  const [keyframes, setKeyframes] = useState(ISSUE_72_EASING_KEYFRAMES);
  const tracks: Track[] = [{
    id: `${mode}-motion`,
    name: "Motion",
    type: "frame",
    expanded: true,
    props: [{
      id: "opacity",
      name: "Opacity",
      keyframes,
    }],
  }];
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="min-w-0 overflow-hidden rounded-c-lg bg-c-bg text-c-text shadow-c-200">
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} easing segments</h2>
      </header>
      <Timeline
        height={210}
        duration={6_000}
        tracks={tracks}
        onEasingSegmentSelect={target => setKeyframes(value => value.map(keyframe => ({ ...keyframe, easingSelected: keyframe.id === target.keyframeId })))}
        onEasingPresetChange={(target, easing) => setKeyframes(value => value.map(keyframe => keyframe.id === target.keyframeId ? { ...keyframe, easing } : keyframe))}
        onPropertyAddKeyframe={(_trackId, _propertyId, timeMs) => setKeyframes(value => [
          ...value.filter(keyframe => keyframe.timeMs !== timeMs),
          { id: `added-${timeMs}`, timeMs, easing: "linear" as const },
        ].sort((left, right) => left.timeMs - right.timeMs))}
      />
    </section>
  );
}

function Issue72EasingInspectorFixture({ mode }: { mode: "light" | "dark" }) {
  const [preset, setPreset] = useState<EasingPreset>(mode === "dark" ? "spring" : "custom");
  const [controlPoints, setControlPoints] = useState<CubicBezier | undefined>(mode === "dark" ? [0.175, 0.885, 0.32, 1.275] : [0.2, -0.1, 0.75, 1.15]);
  const [scope, setScope] = useState<EasingApplyScope>("segment");
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="min-w-0 flex justify-center rounded-c-lg bg-c-bg-secondary p-[24px]">
      <PropertyPanel
        easingContext="segment"
        easing={{ preset, controlPoints, editable: true }}
        easingApplyScope={scope}
        onEasingChange={next => { setPreset(next.preset); setControlPoints(next.controlPoints); }}
        onEasingApplyScopeChange={setScope}
      />
    </section>
  );
}

const ISSUE_75_CONVERSATIONS: AgentConversationSummary[] = [
  { id: "detail", title: "Detail property panel", visibility: "private", updatedAt: Date.now() - 24 * 60 * 60 * 1000, preview: "Review the property hierarchy.", timeGroup: "yesterday" },
  { id: "motion", title: "Develop video motion", visibility: "private", updatedAt: Date.now() - 12 * 24 * 60 * 60 * 1000, preview: "Explain the current animation.", timeGroup: "earlier" },
];

const ISSUE_75_THREAD: AgentConversation = {
  id: "detail",
  title: "Detail property panel",
  visibility: "private",
  messages: [
    { id: "user", type: "user", content: "Review this selection.", context: { id: "hero", label: "Hero section", kind: "frame" } },
    { id: "work", type: "work", content: "Inspected 3 text layers and one image.", status: "complete", durationMs: 4_000 },
    { id: "agent", type: "agent", content: "The hierarchy is sound. The image can remain inside the auto-layout frame.", status: "complete" },
    { id: "action", type: "action", title: "Media result", description: "Action buttons appear only when a host supplies real callbacks.", status: "ready" },
    { id: "error", type: "error", content: "No provider is connected in this presentation fixture.", severity: "warning" },
  ],
};

function Issue75AgentPanelFixture({ mode, thread }: { mode: "light" | "dark"; thread: boolean }) {
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [active, setActive] = useState<AgentConversation | null>(thread ? ISSUE_75_THREAD : null);
  const [context, setContext] = useState<{ id: string; label: string; kind: "frame" } | null>({ id: "hero", label: "Hero section", kind: "frame" });
  const filtered = ISSUE_75_CONVERSATIONS.filter(item => `${item.title} ${item.preview}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <section data-composa-mode={mode} className="h-[620px] flex justify-end overflow-hidden rounded-c-lg bg-c-bg-secondary shadow-c-200">
      <AgentPanel
        conversations={filtered}
        activeConversation={active}
        search={search}
        composerValue={composer}
        context={active ? context : null}
        onSearchChange={setSearch}
        onNewConversation={() => setActive({ id: "new", title: "New chat", visibility: "private", messages: [] })}
        onOpenConversation={() => setActive(ISSUE_75_THREAD)}
        onBack={() => setActive(null)}
        onComposerChange={setComposer}
        onSubmit={() => setComposer("")}
        onEscape={() => composer ? setComposer("") : setActive(null)}
        onDismissContext={() => setContext(null)}
        onSelectContext={() => undefined}
      />
    </section>
  );
}

export default function Playground() {
  // ?view=slides = componentized SlidesPanel; ?view=slides-raw = the raw Figma export
  // (side-by-side fidelity check); default = property-panel fidelity set.
  const view = new URLSearchParams(window.location.search).get("view");
  const [nav, setNav] = useState("composition");
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("2b");
  const [contractPlayhead, setContractPlayhead] = useState(300);
  const [contractPlaying, setContractPlaying] = useState(false);
  const [contractLoop, setContractLoop] = useState(false);
  const [contractTimelineViewport, setContractTimelineViewport] = useState<TimelineViewport>({ startMs: 0, endMs: 4_000 });
  const [contractTimelineExpanded, setContractTimelineExpanded] = useState(true);
  const [contractTimelineKeyIds, setContractTimelineKeyIds] = useState<string[]>(["hero-opacity-0", "hero-x-0"]);
  const [durationBarTracks, setDurationBarTracks] = useState<Track[]>([
    { id: "hero-duration", name: "Hero", type: "frame", bar: [1_000, 4_000], props: [] },
    { id: "locked-duration", name: "Locked title", type: "text", bar: [1_500, 3_500], durationBarEditable: false, props: [] },
  ]);
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
    layout: { mode: "vertical", gap: 8, padding: { top: 16, right: 16, bottom: 16, left: 16 }, align: "mc", widthMode: "fill", heightMode: "hug", minWidth: 240, maxHeight: 720, availableWidthModes: ["fixed", "fill"], availableHeightModes: ["fixed", "hug"], clipsContent: true, positioning: "auto", positioningApplicable: true },
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
  const contractTimelineTracks: Track[] = [
    { id: "hero", name: "Hero frame", type: "frame", depth: 0, expanded: contractTimelineExpanded, props: [
      { id: "opacity", name: "Opacity", keyframes: [
        { id: "hero-opacity-0", timeMs: 500, selected: contractTimelineKeyIds.includes("hero-opacity-0") },
        { id: "hero-opacity-1", timeMs: 2_200, selected: contractTimelineKeyIds.includes("hero-opacity-1") },
      ] },
      { id: "x", name: "Position X", keyframes: [
        { id: "hero-x-0", timeMs: 500, selected: contractTimelineKeyIds.includes("hero-x-0") },
        { id: "hero-x-1", timeMs: 3_200, selected: contractTimelineKeyIds.includes("hero-x-1") },
      ] },
    ] },
    { id: "caption", name: "Caption", type: "text", depth: 1, expanded: true, props: [
      { id: "caption-opacity", name: "Opacity", keyframes: [{ id: "caption-opacity-0", timeMs: 1_100, selected: contractTimelineKeyIds.includes("caption-opacity-0") }] },
    ] },
  ];

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

  if (view === "issue-66-fixtures") {
    return (
      <main className="min-h-screen bg-[#d9d9d9] p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue66FixtureCard mode="light" />
        <Issue66FixtureCard mode="dark" />
      </main>
    );
  }

  if (view === "issue-67-icons") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue67IconMatrix mode="light" />
        <Issue67IconMatrix mode="dark" />
      </main>
    );
  }

  if (view === "issue-70-row-states") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue70RowStateFixture mode="light" />
        <Issue70RowStateFixture mode="dark" />
      </main>
    );
  }

  if (view === "issue-77-anchored-overlay") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue77AnchoredOverlayFixture mode="light" />
        <Issue77AnchoredOverlayFixture mode="dark" collisionProbe />
      </main>
    );
  }

  if (view === "issue-72-duration-bars") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue72DurationBarFixture mode="light" />
        <Issue72DurationBarFixture mode="dark" />
      </main>
    );
  }

  if (view === "issue-72-easing-segments") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue72EasingFixture mode="light" />
        <Issue72EasingFixture mode="dark" />
      </main>
    );
  }

  if (view === "issue-72-easing-inspector") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue72EasingInspectorFixture mode="light" />
        <Issue72EasingInspectorFixture mode="dark" />
      </main>
    );
  }

  if (view === "issue-75-agent-panel") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px]">
        <Issue75AgentPanelFixture mode="light" thread={false} />
        <Issue75AgentPanelFixture mode="dark" thread />
      </main>
    );
  }

  if (view === "timeline-viewport") {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    return <div data-composa-mode={dark ? "dark" : undefined} className="h-screen w-screen flex flex-col justify-end bg-c-bg text-c-text">
      <Timeline height={220} duration={6_000} tracks={contractTimelineTracks} playhead={contractPlayhead} onPlayheadChange={setContractPlayhead}
        viewport={contractTimelineViewport} onViewportChange={setContractTimelineViewport}
        onTrackExpandedChange={(id, expanded) => id === "hero" && setContractTimelineExpanded(expanded)}
        onAggregateKeyframeSelect={(target, additive) => setContractTimelineKeyIds(value => additive ? [...new Set([...value, ...target.keyframeIds])] : target.keyframeIds)}
        onKeyframeSelect={(target, additive) => setContractTimelineKeyIds(value => additive ? [...new Set([...value, target.keyframeId])] : [target.keyframeId])} />
    </div>;
  }

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

  if (view === "issue-174-animate") {
    const issue174Anims = [
      { id: "a1", n: 1, name: "Title", kind: "In" as const, duration: "0.6s", style: "fade-in", buildDuration: "600ms" },
      { id: "a2", n: 2, name: "Subtitle", kind: "In" as const, duration: "0.4s", style: "slide-in", buildDuration: "400ms", direction: "left" as const, selected: true },
      { id: "a3", n: 3, name: "Body", kind: "Action" as const, duration: "0.5s", style: "pulse" },
    ];
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", gap: 24, justifyContent: "center", alignItems: "flex-start", background: "#e6e6e6", padding: 24 }}>
        {/* Slide selected — real transition (push) → Comp transition card expanded by default */}
        <div style={{ width: 280 }}>
          <div style={{ font: "12px system-ui", marginBottom: 8 }}>Slide selected (transition = push)</div>
          <PropertyPanel
            mode="slide"
            slideName="Opening title"
            slideId="slide-1"
            slideTransitionType="push"
            slideTransitionDirection="right"
            slideTransitionDuration={500}
            slideTransitionEasing="ease-in-out"
            objectAnimations={issue174Anims}
          />
        </div>
        {/* Element selected — slide has NO transition → Comp transition must reflect None
            (no phantom Fade), and the selected element's object-animation card expands. */}
        <div style={{ width: 280 }}>
          <div style={{ font: "12px system-ui", marginBottom: 8 }}>Text element selected (slide transition = none)</div>
          <PropertyPanel
            elementType="text"
            slideId="slide-1"
            slideTransitionType="none"
            objectAnimations={issue174Anims}
          />
        </div>
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

  if (view === "timeline-duration-contract") {
    return <div data-composa-mode="dark" style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column", justifyContent: "flex-end", background: "#2c2c2c" }}>
      <Timeline height={220} duration={6_000} tracks={durationBarTracks}
        onDurationBarChange={({ trackId, startMs, endMs }) => setDurationBarTracks(current => current.map(track =>
          track.id === trackId ? { ...track, bar: [startMs, endMs] } : track))}
      />
    </div>;
  }

  if (view === "element-contract") {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    return <div data-composa-mode={dark ? "dark" : undefined} style={{ height: "100vh", width: "100vw", display: "flex", gap: 20, justifyContent: "flex-end", background: dark ? "#1e1e1e" : "#e6e6e6" }}>
      <PropertyPanel elementType="text" typography={elementContract.typography} onTypographyChange={patch => setElementContract(value => ({ ...value, typography: { ...value.typography, ...patch } }))}
        fills={elementContract.fills} onUpdateFill={(id, patch) => setElementContract(value => ({ ...value, fills: value.fills.map(item => item.id === id ? { ...item, ...patch } : item) }))}
        strokes={elementContract.strokes} onUpdateStroke={(id, patch) => setElementContract(value => ({ ...value, strokes: value.strokes.map(item => item.id === id ? { ...item, ...patch } : item) }))}
        effects={elementContract.effects} onUpdateEffect={(id, patch) => setElementContract(value => ({ ...value, effects: value.effects.map(item => item.id === id ? { ...item, ...patch } : item) }))} />
      <PropertyPanel elementType="frame-auto" capabilities={{ variables: false }} layout={elementContract.layout} onLayoutChange={patch => setElementContract(value => ({ ...value, layout: { ...value.layout, ...patch } }))}
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
          <NavRail active={nav} onSelect={setNav} onBackToFiles={() => window.alert("Back to Files (app wires editor → /projects)")} />
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
