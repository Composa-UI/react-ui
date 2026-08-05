import { useState } from "react";
import cropPlaygroundMedia from "./imports/SlidesTemplate/9bf3285fa6c14222923aa8fcd4bf31f6e40807d9.png";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PropertyPanel, type ClipSpeed, type ElementEffectSetting, type ElementFillSetting, type ElementLayoutGuideSetting, type ElementLayoutSettings, type ElementSelectionColorSetting, type ElementStrokeSetting, type ElementTypographySettings, type InspectorExportSetting, type ProjectFrameRate, type SlideBackgroundType, type SlideTransitionDirection, type SlideTransitionEasing, type SlideTransitionType } from "./components/ui3/PropertyPanel";
import { AnimatePanel, type ObjectAnimationItem } from "./components/ui3/AnimatePanel";
import SlidesTemplate from "./imports/SlidesTemplate";
import { SlidesPanel, type SlideData } from "./components/ui3/SlidesPanel";
import { SlideInspector } from "./components/ui3/SlideInspector";
import { Timeline, type BaseClipBlock, type MasterLane, type MasterLaneControlState, type TimelineEasingPreset, type TimelineViewport, type Track } from "./components/ui3/Timeline";
import type { EasingApplyScope, EasingPreset, CubicBezier } from "./components/ui3/easing";
import { LayerList, type LayerNode } from "./components/ui3/LayerList";
import { NavRail } from "./components/ui3/NavRail";
import { CompositionPanel } from "./components/ui3/CompositionPanel";
import { AssetsPanel, type AssetFilter, type AssetItem } from "./components/ui3/AssetsPanel";
import { CreationToolbar } from "./components/ui3/CreationToolbar";
import { CanvasCropOverlay, CropToolbar, type CropAspect } from "./components/ui3/CropToolbar";
import { Button } from "./components/ui3/Button";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "./components/ui3/Dialog";
import { TeamDialog, type TeamMember, type TeamTab, type TeamRole } from "./components/ui3/TeamDialog";
import { DeleteConfirmDialog } from "./components/ui3/DeleteConfirmDialog";
import { ImageAdjustDialog } from "./components/ui3/ImageAdjustDialog";
import { Tooltip, TooltipProvider } from "./components/ui3/Tooltip";
import { ComposaModeProvider } from "./components/ui3/useComposaMode";
import { SegmentedControl } from "./components/ui3/SegmentedControl";
import { Dial } from "./components/ui3/Dial";
import { ColorInput, NumericInput, NumericPairInput } from "./components/ui3/Input";
import { ColorWheel } from "./components/ui3/ColorWheel";
import { AlignmentControl, type AlignmentValue } from "./components/ui3/AlignmentControl";
import { LayerTypeIcon, type LayerAutoLayoutMode, type LayerIconType } from "./components/ui3/LayerTypeIcon";
import { AnchoredInspectorOverlay } from "./components/ui3/AnchoredInspectorOverlay";
import { InspectorDialog } from "./components/ui3/InspectorDialog";
import { ExportDialog, type ExportSettingsValue } from "./components/ui3/ExportDialog";
import { FontPickerDialog, type FontEntry } from "./components/ui3/FontPickerDialog";
import { Menu, MenuRow, PopoverMenu } from "./components/ui3/Menu";
import { AgentPanel, type AgentConversation, type AgentConversationSummary } from "./components/ui3/AgentPanel";
import { UserBubble } from "./components/ui3/UserBubble";
import { AiResponse } from "./components/ui3/AiResponse";
import { WorkedLabel } from "./components/ui3/WorkedLabel";
import { RatingBar } from "./components/ui3/RatingBar";
import { ModelPicker } from "./components/ui3/ModelPicker";
import { UndoCard } from "./components/ui3/UndoCard";
import { MultiChoiceCard } from "./components/ui3/MultiChoiceCard";
import { GitHubToolResultCard } from "./components/ui3/GitHubToolResultCard";
import { GitHubPermissionCard } from "./components/ui3/GitHubPermissionCard";
import { ShareModal, type SharePerson } from "./components/ui3/ShareModal";
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
  { label: "Text", type: "text" },
  { label: "Image", type: "image", tone: "secondary", state: "disabled" },
  { label: "Shape", type: "shape" },
  { label: "Line", type: "line" },
  { label: "Ellipse", type: "ellipse" },
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

// Composa-App/Composa#410: the narrowest inspector surface that previously made
// the Small / Medium / Large segmented control unreadable. The action remains
// controlled so selecting a dropdown item must round-trip into the trigger.
function Issue410IntensityDropdownFixture({ mode }: { mode: "light" | "dark" }) {
  const [intensity, setIntensity] = useState<"small" | "medium" | "large">("medium");
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="w-[240px] overflow-visible rounded-c-lg bg-c-bg text-c-text shadow-c-200" data-issue-410-narrow-inspector>
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} 240px inspector</h2>
      </header>
      <AnimatePanel
        selectionType="element"
        anims={[{ id: `issue-410-${mode}`, n: 1, name: "Quarterly review", kind: "Action", duration: "0.6s", style: "pulse", intensity, selected: true }]}
        objectAnimationCallbacks={{ onIntensityChange: (_id, value) => setIntensity(value) }}
      />
    </section>
  );
}

// Ordered animation blocks fixture (iteration-2 RP-10 · RP-11 · RP-12): sequenced presets
// render as their own numbered blocks — no connector line, no "delay between" field. The
// ordinals come from the engine's `order`, forwarded as `n`. Expand a card to reach the
// Easing row every preset now carries; picking "Custom…" routes to the host, which opens
// the existing EasingInspectorSection.
// `?view=animation-blocks` (append `&focus=1` for the single-action highlight).
function AnimationBlocksFixture({ mode }: { mode: "light" | "dark" }) {
  const params = new URLSearchParams(window.location.search);
  const focus = params.get("focus") === "1";
  const [easingById, setEasingById] = useState<Record<string, EasingPreset>>({});
  const [customFor, setCustomFor] = useState<string | null>(null);
  const anims: ObjectAnimationItem[] = ([
    // Two actions on ONE object: they are blocks 1 and 2 like everything else in the list.
    { id: "p1", elementId: "logo", n: 1, name: "Logo", kind: "Action", duration: "1.2s", buildDuration: "1200ms", style: "pulse", selected: true, focused: false },
    { id: "p2", elementId: "logo", n: 2, name: "Logo", kind: "Action", duration: "0.8s", buildDuration: "800ms", style: "pulse", selected: true, focused: focus },
    { id: "q1", elementId: "title", n: 3, name: "Title", kind: "Action", duration: "0.6s", buildDuration: "600ms", style: "jiggle", selected: true },
    { id: "r1", elementId: "caption", n: 4, name: "Caption", kind: "In", duration: "0.4s", buildDuration: "400ms", style: "fade-in", selected: true },
  ] as ObjectAnimationItem[]).map(anim => ({ ...anim, easing: easingById[anim.id!] }));
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="w-[280px] overflow-visible rounded-c-lg bg-c-bg text-c-text shadow-c-200">
      <header className="h-[40px] px-[16px] flex items-center border-b border-c-border">
        <h2 className="text-[11px] font-[550]">{mode === "dark" ? "Dark" : "Light"} · animation blocks{customFor ? ` · custom easing: ${customFor}` : ""}</h2>
      </header>
      <AnimatePanel
        selectionType="element"
        anims={anims}
        compTransition={{ style: "none", direction: "right", durationMs: 300, easing: "ease-out" }}
        objectAnimationCallbacks={{
          onEasingChange: (id, preset) => { setEasingById(current => ({ ...current, [id]: preset })); setCustomFor(null); },
          onCustomEasingRequest: id => setCustomFor(id),
          onReorder: () => {},
        }}
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

// Composa#211: Agent as a left-rail destination. When "Agent" is selected in the
// NavRail, the left column swaps to this panel (the right panel stays the
// inspector) — no right-side Inspector/Agent tablist.
function EditorAgentColumn() {
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [active, setActive] = useState<AgentConversation | null>(null);
  const [context, setContext] = useState<{ id: string; label: string; kind: "frame" } | null>({ id: "hero", label: "Hero section", kind: "frame" });
  const filtered = ISSUE_75_CONVERSATIONS.filter(item => `${item.title} ${item.preview}`.toLowerCase().includes(search.toLowerCase()));
  return (
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
  );
}

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

const CHAT_LEAF_CHOICES = [
  { letter: "A", label: "Message bubbles & layout" },
  { letter: "B", label: "Input area & suggestions" },
  { letter: "C", label: "Typography & spacing" },
  { letter: "D", label: "Add a custom response" },
];

// Fidelity harness for the "Stateful left chat panel" import — every leaf
// component rendered in a 280px chat-width column so the DS build can be
// gh-imaged against the raw Figma Make export side by side.
function ChatLeafFixture({ mode }: { mode: "light" | "dark" }) {
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="min-w-0">
      <div className="w-[280px] mx-auto rounded-c-lg bg-c-bg ring-1 ring-inset ring-c-border-translucent shadow-c-200 overflow-hidden">
        <div className="h-[40px] px-[16px] flex items-center border-b border-c-border">
          <h2 className="text-[11px] font-[550] text-c-text font-[family-name:var(--composa-font-family)]">{mode === "dark" ? "Dark" : "Light"} · chat leaf components</h2>
        </div>
        <div className="p-[16px] flex flex-col gap-[16px]">
          <UserBubble text="Hola friend" />
          <UserBubble text="What easing should I use for this element?" chip={{ type: "element", label: "Container (Editor Study)", kind: "frame" }} />
          <UserBubble text="Are you connected to my github?" chip={{ type: "github" }} />

          <div className="flex flex-col gap-[8px]">
            <WorkedLabel seconds="2s" />
            <AiResponse>
              {"Hola! How can I help you today? Whether it's designing something new or tweaking a layout — just let me know!"}
            </AiResponse>
          </div>

          <div className="flex flex-col gap-[8px]">
            <WorkedLabel seconds="16s" steps={["Checking GitHub connection...", "Fetching authenticated user via get_me...", "Verifying token scopes..."]} />
            <GitHubToolResultCard toolName="get_me" />
            <AiResponse>
              {"Yes, I'm connected to your GitHub! You're authenticated as "}
              <strong className="font-[650]">Samuel Alake</strong>
              {" (@samuelalake)."}
            </AiResponse>
          </div>

          <div className="flex flex-col gap-[8px]">
            <WorkedLabel seconds="3s" />
            <GitHubPermissionCard toolName="list_issues" />
          </div>

          <div className="flex flex-col gap-[8px]">
            <AiResponse>{"Just showing you what one of these interactive cards looks like!"}</AiResponse>
            <MultiChoiceCard question="What part of the chat design system are you most interested in studying?" choices={CHAT_LEAF_CHOICES} />
          </div>

          <div className="flex flex-col gap-[8px]">
            <AiResponse>{"Here's your reference card. How does that look?"}</AiResponse>
            <UndoCard />
          </div>

          <WorkedLabel thinking />

          <div className="flex items-center justify-between rounded-c-lg bg-c-bg-secondary px-[8px] py-[6px]">
            <ModelPicker />
            <RatingBar className="mt-0 w-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}

const INTEGRATION_THREAD: AgentConversation = {
  id: "chat",
  title: "Continue conversation",
  visibility: "private",
  messages: [
    { id: "u1", type: "user", content: "Are you connected to my github?" },
    { id: "w1", type: "work", content: "Checked the GitHub connection and token scopes.", status: "complete", durationMs: 16_000, steps: ["Checking GitHub connection...", "Fetching authenticated user via get_me...", "Verifying token scopes..."] },
    { id: "a1", type: "agent", content: "Yes, I'm connected to your GitHub! You're authenticated as **Samuel Alake** (@samuelalake).", status: "complete" },
    { id: "u2", type: "user", content: "What easing should I use for this element?", context: { id: "c", label: "Container (Editor Study)", kind: "frame" } },
    { id: "a2", type: "agent", content: "For the **Ellipse**, I'd go with **Ease in & out** — a natural acceleration then a smooth stop.", status: "complete" },
    { id: "act", type: "action", title: "Reference card", description: "Here's your reference card. How does it look?", status: "ready" },
  ],
};

function ChatIntegrationColumn({ initial }: { initial: "history" | "new" | "chat" }) {
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState("");
  const [active, setActive] = useState<AgentConversation | null>(
    initial === "chat" ? INTEGRATION_THREAD
      : initial === "new" ? { id: "new", title: "New chat", visibility: "private", messages: [] }
      : null,
  );
  const [expanded, setExpanded] = useState<string[]>(["w1"]);
  const filtered = ISSUE_75_CONVERSATIONS.filter(item => `${item.title} ${item.preview}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <AgentPanel
      conversations={filtered}
      activeConversation={active}
      search={search}
      composerValue={composer}
      context={active?.id === "chat" ? { id: "c", label: "Container (Editor Study)", kind: "frame" } : null}
      expandedWorkMessageIds={expanded}
      onSearchChange={setSearch}
      onNewConversation={() => setActive({ id: "new", title: "New chat", visibility: "private", messages: [] })}
      onOpenConversation={() => setActive(INTEGRATION_THREAD)}
      onBack={() => setActive(null)}
      onComposerChange={setComposer}
      onSubmit={() => setComposer("")}
      onEscape={() => undefined}
      onToggleWorkMessage={id => setExpanded(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id])}
      onSelectContext={() => undefined}
      onDismissContext={() => undefined}
      onConversationOptions={() => undefined}
      onModelClick={() => undefined}
      onAttachmentRequest={() => undefined}
      onImageRequest={() => undefined}
    />
  );
}

function ChatIntegrationFixture({ mode }: { mode: "light" | "dark" }) {
  const states: Array<"history" | "new" | "chat"> = ["history", "new", "chat"];
  return (
    <section data-composa-mode={mode === "dark" ? "dark" : undefined} className="grid grid-cols-3 gap-[16px]">
      {states.map(initial => (
        <div key={initial} className="h-[620px] flex justify-center overflow-hidden rounded-c-lg bg-c-bg-secondary shadow-c-200">
          <ChatIntegrationColumn initial={initial} />
        </div>
      ))}
    </section>
  );
}

// Composa#288 — DS container dialogs. Renders one dialog per ?d= value on a
// neutral canvas so each can be gh-imaged against its Figma node (light + dark
// via ?theme=dark). d ∈ team-settings | team-members | team-members-empty |
// delete | image-adjust.
const DIALOG_288_MEMBERS: TeamMember[] = [
  { id: "1", name: "Peace Aghaeze", email: "peace4aghaeze@gmail.com", avatarColor: "blue", initial: "P", role: "can edit" },
  { id: "2", name: "Precious Aghaeze", email: "aghaeze.precious@philander.edu", avatarColor: "purple", initial: "P", role: "can edit" },
  { id: "3", name: "Samuel", email: "harlahke@gmail.com", avatarSrc: thumb3, role: "Owner", isYou: true },
  { id: "4", name: "Sam Davis Omekara", email: "omekara.samdavis@philander.edu", avatarColor: "grey", initial: "S", role: "can edit", pending: true },
];

function Dialog288Fixture() {
  const params = new URLSearchParams(window.location.search);
  const d = params.get("d") ?? "team-settings";
  const dark = params.get("theme") === "dark";
  const [tab, setTab] = useState<TeamTab>(d === "team-settings" ? "settings" : "members");
  const [members, setMembers] = useState<TeamMember[]>(DIALOG_288_MEMBERS);
  const [zoomKey] = useState(0);
  const noop = () => undefined;

  const onChangeRole = (id: string, role: TeamRole) =>
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, role } : m)));
  const onRemove = (id: string) => setMembers(prev => prev.filter(m => m.id !== id));

  return (
    <div
      {...(dark ? { "data-composa-mode": "dark" } : {})}
      style={{ height: "100vh", width: "100vw", background: dark ? "#1e1e1e" : "#d9d9d9" }}
    >
      {(d === "team-settings" || d === "team-members") && (
        <TeamDialog
          open
          onClose={noop}
          tab={tab}
          onTabChange={setTab}
          teamName={d === "team-members" ? "Hackathons" : "Just me"}
          teamIconSrc={d === "team-members" ? thumb2 : undefined}
          members={members}
          onChangeMemberRole={onChangeRole}
          onRemoveMember={onRemove}
          onChangeName={noop}
          onAddDescription={noop}
        />
      )}

      {d === "team-members-empty" && (
        <TeamDialog
          open
          onClose={noop}
          tab="members"
          teamName="Just me"
          members={[{ id: "me", name: "Samuel", email: "harlahke@gmail.com", avatarSrc: thumb3, role: "Owner", isYou: true }]}
        />
      )}

      {d === "delete" && (
        <DeleteConfirmDialog
          open
          onClose={noop}
          onConfirm={noop}
          title="Delete team?"
          message='Are you sure you want to delete "Just me"? This action cannot be undone.'
          confirmLabel="Delete team"
        />
      )}

      {d === "image-adjust" && (
        <ImageAdjustDialog key={zoomKey} open onClose={noop} src={thumb0} shape="circle" onSave={noop} />
      )}
    </div>
  );
}

// Composa#289 — rebuilt share dialog (Figma node 288-5750). The Modal portals to
// document.body, so variants can't be gridded (a portal escapes any cell). Instead
// one modal renders per query param: ?view=share-289&variant=project|team&theme=light|dark&roster=owner|invited
function Share289Fixture() {
  const params = new URLSearchParams(window.location.search);
  const variant = (params.get("variant") ?? "project") as "project" | "team";
  const dark = params.get("theme") === "dark";
  const roster = params.get("roster") ?? (variant === "team" ? "invited" : "owner");
  const exportAvailable = params.get("export") === "1";

  // Owner-only roster matches the Figma node exactly.
  const ownerOnly: SharePerson[] = [
    { id: "you", name: "Samuel", you: true, owner: true, color: "purple", initial: "S" },
  ];
  // Demos the reused RoleMenu on invited (non-owner) people.
  const withInvited: SharePerson[] = [
    ...ownerOnly,
    { id: "alan", name: "Alan Anabelle", access: "can edit", color: "blue", initial: "A" },
    { id: "bobby", name: "Bobby Bucalini", access: "can view", color: "green", initial: "B" },
  ];

  return (
    <div {...(dark ? { "data-composa-mode": "dark" } : {})} className="min-h-screen bg-c-bg-secondary">
      <ShareModal
        open
        onClose={() => undefined}
        variant={variant}
        people={roster === "invited" ? withInvited : ownerOnly}
        onExport={exportAvailable ? () => undefined : undefined}
      />
    </div>
  );
}

// Slides / Comp panel fixture — light + dark, with the header inline-rename and the
// per-slide actions menu (Rename / Duplicate / Delete) wired so both are exercisable.
function SlidesFixture() {
  const [lightName, setLightName] = useState("Product review");
  const [darkName, setDarkName] = useState("Product review");
  const wire = (name: string, setName: (n: string) => void) => ({
    title: name,
    onTitleChange: setName,
    onTitleMenu: () => console.info("comp menu"),
    onRenameRequest: (i: number) => console.info("rename slide", i),
    onSlideDuplicate: (i: number) => console.info("duplicate slide", i),
    onSlideDelete: (i: number) => console.info("delete slide", i),
  });
  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", gap: 24, padding: 24, boxSizing: "border-box", background: "#e6e6e6" }}>
      <div style={{ height: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
        <SlidesPanel slides={DEMO_SLIDES} {...wire(lightName, setLightName)} />
      </div>
      <div data-composa-mode="dark" style={{ height: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
        <SlidesPanel slides={DEMO_SLIDES} {...wire(darkName, setDarkName)} />
      </div>
      <div style={{ flex: 1 }} />
      <SlideInspector />
    </div>
  );
}

// ?view=dial — rotary knob for the audio inspector. A row of dials at different
// values in light + dark, plus a labelled "De-hum" group (Frequency / Harmonics
// / Sharpness / Depth) matching the Sequence audio-inspector study.
// Interactions: vertical drag on the knob, AND horizontal drag-scrub across the
// value field under it (same ew-resize idiom as the position/scale/size inputs;
// a plain click focuses the field for typing).
function DialFixture({ mode }: { mode: "light" | "dark" }) {
  const [dehum, setDehum] = useState({ frequency: 60, harmonics: 4, sharpness: 35, depth: 72 });
  const [reverb, setReverb] = useState(50);
  const [loudness, setLoudness] = useState(85);
  const [solo, setSolo] = useState(0);

  return (
    <section
      data-composa-mode={mode === "dark" ? "dark" : undefined}
      className="flex flex-col gap-[28px] rounded-c-lg bg-c-bg text-c-text shadow-c-400 p-[28px]"
    >
      <div className={`text-c-text-secondary text-[11px] leading-[16px] ${FONT_PLAY}`}>{mode} · dial</div>

      {/* Row of standalone dials at different values + sizes. */}
      <div className="flex items-end gap-[28px]">
        <Dial label="Empty" value={solo} min={0} max={100} onChange={setSolo} suffix="%" />
        <Dial label="Reverb" value={reverb} min={0} max={100} onChange={setReverb} suffix="%" size="large" />
        <Dial label="Loudness" value={loudness} min={0} max={100} defaultValue={100} onChange={setLoudness} suffix="dB" />
        <Dial label="Small" value={30} min={0} max={100} onChange={() => {}} size="small" />
        <Dial label="Disabled" value={40} min={0} max={100} disabled onChange={() => {}} />
      </div>

      {/* Labelled De-hum group. */}
      <div className="flex flex-col gap-[10px]">
        <div className={`text-c-text text-[11px] leading-[16px] ${FONT_PLAY}`}>De-hum</div>
        <div className="flex items-end gap-[24px] rounded-c-md bg-c-bg-secondary p-[16px]">
          <Dial label="Frequency" value={dehum.frequency} min={20} max={200} step={1} suffix="Hz"
            onChange={v => setDehum(d => ({ ...d, frequency: v }))} />
          <Dial label="Harmonics" value={dehum.harmonics} min={0} max={10} step={1}
            onChange={v => setDehum(d => ({ ...d, harmonics: v }))} />
          <Dial label="Sharpness" value={dehum.sharpness} min={0} max={100} suffix="%"
            onChange={v => setDehum(d => ({ ...d, sharpness: v }))} />
          <Dial label="Depth" value={dehum.depth} min={0} max={100} suffix="%"
            onChange={v => setDehum(d => ({ ...d, depth: v }))} />
        </div>
      </div>
    </section>
  );
}

const FONT_PLAY = "font-[family-name:var(--composa-font-family)] font-[450]";

// ?view=issue-207 — exact base-control contract at the normal and minimum
// inspector widths. The actions are deliberately separate boxes, so this fixture
// can measure their geometry and focus/pressed ownership in a real browser.
function Issue207ControlsFixture({ mode, width }: { mode: "light" | "dark"; width: number }) {
  const [singleArmed, setSingleArmed] = useState(true);
  const [pairArmed, setPairArmed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [colorArmed, setColorArmed] = useState(true);
  const [opacityArmed, setOpacityArmed] = useState(false);
  const [position, setPosition] = useState({ x: 240, y: 160 });
  return <section data-composa-mode={mode === "dark" ? "dark" : undefined}
    data-composa-issue-207-fixture={`${mode}-${width}`}
    className="flex flex-col gap-[12px] rounded-c-lg bg-c-bg text-c-text shadow-c-200 p-[16px]"
    style={{ width }}>
    <header className="text-[11px] font-[550] leading-[16px]">{mode} · {width}px inspector</header>
    <div className="grid gap-[6px]">
      <span className="text-[9px] text-c-text-secondary">Numeric · armed</span>
      <NumericInput ariaLabel={`${mode} numeric`} value={42} suffix="px" keyframe={{ active: singleArmed, onToggle: () => setSingleArmed(value => !value) }} />
    </div>
    <div className="grid gap-[6px]">
      <span className="text-[9px] text-c-text-secondary">Pair · two trailing actions</span>
      <NumericPairInput
        a={{ ariaLabel: `${mode} X`, iconLead: "X", value: position.x, onChange: x => setPosition(value => ({ ...value, x })) }}
        b={{ ariaLabel: `${mode} Y`, iconLead: "Y", value: position.y, onChange: y => setPosition(value => ({ ...value, y })) }}
        keyframe={{ active: pairArmed, onToggle: () => setPairArmed(value => !value) }}
        trailing={<button type="button" aria-label={`${mode} aspect ratio lock`} aria-pressed={locked} onClick={() => setLocked(value => !value)}>⌘</button>}
      />
    </div>
    <div className="grid gap-[6px]">
      <span className="text-[9px] text-c-text-secondary">Color · two keyframe actions</span>
      <ColorInput fullWidth ariaLabel={`${mode} color`} color="#0D99FF" opacity={80}
        colorKeyframe={{ active: colorArmed, onToggle: () => setColorArmed(value => !value) }}
        opacityKeyframe={width > 200 ? { active: opacityArmed, onToggle: () => setOpacityArmed(value => !value) } : undefined} />
    </div>
    <div className="grid gap-[6px]">
      <span className="text-[9px] text-c-text-secondary">Disabled mixed numeric</span>
      <NumericInput ariaLabel={`${mode} disabled mixed`} value={0} mixed disabled keyframe={{ active: true, onToggle: () => undefined }} />
    </div>
  </section>;
}

export default function Playground() {
  // ?view=slides = componentized SlidesPanel; ?view=slides-raw = the raw Figma export
  // (side-by-side fidelity check); default = property-panel fidelity set.
  const view = new URLSearchParams(window.location.search).get("view");
  const [nav, setNav] = useState("composition");
  const [cropAspect, setCropAspect] = useState<CropAspect>("free");
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
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
  const exportQuery = new URLSearchParams(window.location.search);
  const exportContractMode = exportQuery.get("exportMode") === "frame" ? "frame" : "static";
  const exportContractFormat = exportQuery.get("format") === "JPG" ? "JPG" : "PNG";
  const [exportContract, setExportContract] = useState<InspectorExportSetting[]>([
    { id: "export-1", scale: 1, suffix: "", format: exportContractFormat },
  ]);
  // Controlled master-lane header state, so the mute toggle can be driven and its
  // effect on the lane's bars actually seen.
  const [laneControls, setLaneControls] = useState<Partial<Record<MasterLane, MasterLaneControlState>>>({});
  const toggleLane = (lane: MasterLane, key: keyof MasterLaneControlState) =>
    setLaneControls(current => ({ ...current, [lane]: { ...current[lane], [key]: !(current[lane]?.[key] ?? (key === "visible")) } }));
  const [clipBlocks, setClipBlocks] = useState<BaseClipBlock[]>([
    // clip-1 carries audio peaks (the strip renders); clip-2 is silent (it must not).
    { id: "clip-1", name: "hero-cover.mp4", range: [1000, 7000], selected: true, tint: "linear-gradient(135deg,#1f2937,#475569)",
      waveform: [0.2, 0.6, 0.9, 0.4, 0.7, 1, 0.3, 0.5, 0.8, 0.2, 0.6, 0.4] },
    { id: "clip-2", name: "product.mp4", range: [8000, 12000], tint: "linear-gradient(135deg,#14532d,#16a34a)" },
  ]);
  const [layerContracts, setLayerContracts] = useState<LayerNode[]>([
    { id: "frame", name: "Hero", type: "frame", children: [{ id: "title", name: "Title", type: "text" }] },
    { id: "image", name: "Cover", type: "image", locked: true },
  ]);
  const [selectedLayerContracts, setSelectedLayerContracts] = useState<string[]>(["title"]);
  const [layerSelectionAnchor, setLayerSelectionAnchor] = useState("title");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDialogValue, setExportDialogValue] = useState<ExportSettingsValue>({
    suffix: "", colorProfile: "sRGB (same as file)", imageResampling: "Detailed", ignoreOverlappingLayers: true,
  });
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [fontPickerValue, setFontPickerValue] = useState("Inter");
  const [elementContract, setElementContract] = useState<{
    typography: ElementTypographySettings; layout: ElementLayoutSettings; fills: ElementFillSetting[]; strokes: ElementStrokeSetting[]; effects: ElementEffectSetting[];
  }>({
    typography: { fontFamily: "Inter", fontWeight: "Medium", fontSize: 48, lineHeight: 58, letterSpacing: 0, align: "left", verticalAlign: "middle" },
    layout: { mode: "vertical", gap: 8, padding: { top: 16, right: 16, bottom: 16, left: 16 }, align: "mc", widthMode: "fill", heightMode: "hug", minWidth: 240, maxHeight: 720, availableWidthModes: ["fixed", "fill"], availableHeightModes: ["fixed", "hug"], clipsContent: true, positioning: "auto", positioningApplicable: true },
    fills: [{ id: "fill-1", color: "#1e1e1e", opacity: 100, visible: true }],
    strokes: [{ id: "stroke-1", color: "#0d99ff", opacity: 100, visible: true, weight: 1, align: "inside", style: "solid", join: "miter", cap: "none" }],
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

  if (view === "issue-575-multiplayer") {
    // #575 verify: the full multiplayer cluster (Present + Preview + Share +
    // account) inside the real 240px inspector column, in the states that made
    // the text-first version overflow. Each card is exactly 240px wide with a
    // 1px overflow tell-tale border so any horizontal spill is visible.
    const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
      <div style={{ width: 240 }}>
        <div style={{ font: "12px system-ui", marginBottom: 8 }}>{title}</div>
        <div style={{ width: 240, outline: "1px solid #f00", overflow: "hidden" }}>{children}</div>
      </div>
    );
    return (
      <div style={{ minHeight: "100vh", display: "flex", gap: 24, justifyContent: "center", alignItems: "flex-start", background: "#e6e6e6", padding: 24 }}>
        <Card title="Present gated (primary disabled, chevron still opens menu)">
          <PropertyPanel mode="project" onShare={() => console.info("share")} accountInitial="S" accountColor="purple" />
        </Card>
        <Card title="Present ready + Preview available + Share beside">
          <PropertyPanel mode="project"
            onPreviewToggle={() => console.info("present")}
            onPreviewOpen={() => console.info("preview")}
            previewAvailable
            onShare={() => console.info("share")}
            accountInitial="S" accountColor="purple" />
        </Card>
        <Card title="Presenting (Pause) + presence">
          <PropertyPanel mode="project"
            previewPlaying
            onPreviewToggle={() => console.info("present")}
            onPreviewOpen={() => console.info("preview")}
            previewAvailable
            onShare={() => console.info("share")}
            presenceControlsEnabled
            onAccountMenu={() => console.info("account")}
            onPresenceMenu={() => console.info("presence")}
            accountInitial="S" accountColor="purple" />
        </Card>
      </div>
    );
  }

  if (view === "dialogs-288") {
    return <Dialog288Fixture />;
  }

  if (view === "share-289") {
    return <Share289Fixture />;
  }

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

  if (view === "issue-410-intensity-dropdown") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px] items-start">
        <Issue410IntensityDropdownFixture mode="light" />
        <Issue410IntensityDropdownFixture mode="dark" />
      </main>
    );
  }

  if (view === "animation-blocks") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px] items-start">
        <AnimationBlocksFixture mode="light" />
        <AnimationBlocksFixture mode="dark" />
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

  if (view === "chat-leaf") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] grid grid-cols-2 gap-[24px] items-start">
        <ChatLeafFixture mode="light" />
        <ChatLeafFixture mode="dark" />
      </main>
    );
  }

  if (view === "chat-integration") {
    return (
      <main className="min-h-screen bg-c-bg-secondary p-[24px] flex flex-col gap-[24px]">
        <ChatIntegrationFixture mode="light" />
        <ChatIntegrationFixture mode="dark" />
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

  // Composa#411 — compact light/dark visual contract for object → preset/property
  // hierarchy. `?view=timeline-hierarchy&theme=dark` exercises the dark tokens.
  if (view === "timeline-hierarchy") {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    const hierarchyTracks: Track[] = [{
      id: "hero", name: "Quarterly review", type: "text", selectionState: "selected", expanded: contractTimelineExpanded, props: [
        { id: "position", name: "Position", keyframes: [{ id: "position-0", timeMs: 500 }] },
        { id: "opacity", name: "Opacity", value: 86, keyframes: [{ id: "opacity-0", timeMs: 1_200, selected: true }] },
      ], bars: [
        { id: "pulse", label: "Pulse", timeRange: [200, 900], selected: true },
        { id: "rotate", label: "Rotate", timeRange: [1_100, 1_800] },
      ],
    }];
    return <div data-composa-mode={dark ? "dark" : undefined} className="h-screen w-screen flex flex-col justify-end bg-c-bg text-c-text">
      <Timeline height={240} duration={2_000} tracks={hierarchyTracks} playhead={contractPlayhead}
        onPlayheadChange={setContractPlayhead} onTrackExpandedChange={(_id, expanded) => setContractTimelineExpanded(expanded)}
        onPresetSelect={() => undefined} onPresetBarChange={() => undefined} />
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

  if (view === "issue-179-play") {
    const issue179Anims = [
      { id: "a1", n: 1, name: "Title", kind: "In" as const, duration: "0.6s", style: "fade-in", buildDuration: "600ms" },
      { id: "a2", n: 2, name: "Subtitle", kind: "In" as const, duration: "0.4s", style: "slide-in", buildDuration: "400ms", direction: "left" as const, selected: true },
      { id: "a3", n: 3, name: "Body", kind: "Action" as const, duration: "0.5s", style: "pulse" },
    ];
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", gap: 24, justifyContent: "center", alignItems: "flex-start", background: "#e6e6e6", padding: 24 }}>
        {/* Element selected WITH animations → Play (first action) is enabled. */}
        <div style={{ width: 280 }}>
          <div style={{ font: "12px system-ui", marginBottom: 8 }}>Element w/ animations → Play enabled</div>
          <PropertyPanel
            elementType="text"
            slideId="slide-1"
            slideTransitionType="none"
            objectAnimations={issue179Anims}
            objectAnimationCallbacks={{ onPlayAllObjectAnimations: () => console.info("Play all object animations") }}
          />
        </div>
        {/* No animations / no selection → Play is disabled (mirrors the "+" gate). */}
        <div style={{ width: 280 }}>
          <div style={{ font: "12px system-ui", marginBottom: 8 }}>No animations → Play disabled</div>
          <PropertyPanel
            elementType="text"
            slideId="slide-2"
            slideTransitionType="none"
            objectAnimations={[]}
            objectAnimationCallbacks={{ onPlayAllObjectAnimations: () => console.info("Play all object animations") }}
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

  if (view === "color-wheel") {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    return <div data-composa-mode={dark ? "dark" : undefined} style={{ height: "100vh", width: "100vw", display: "flex", gap: 48, alignItems: "center", justifyContent: "center", background: dark ? "#1e1e1e" : "#e6e6e6" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <ColorWheel ariaLabel="Shadows color wheel" defaultHue={210} defaultSaturation={0.35} />
        <span style={{ fontSize: 11 }}>Shadows</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <ColorWheel ariaLabel="Midtones color wheel" size={160} />
        <span style={{ fontSize: 11 }}>Midtones</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <ColorWheel ariaLabel="Highlights color wheel" defaultHue={40} defaultSaturation={0.6} />
        <span style={{ fontSize: 11 }}>Highlights</span>
      </div>
    </div>;
  }

  if (view === "audio-clip-contract") {
    return <div style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: "#e6e6e6" }}>
      <PropertyPanel mode="audio-clip" audioClipName="voiceover" audioVolume={100}
        onAudioClipNameChange={name => console.info("rename audio clip", name)}
        onAudioVolumeChange={value => console.info("audio volume", value)}
        onReplaceAudio={() => console.info("Replace audio")} onDeleteAudioClip={() => console.info("Delete audio clip")} />
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
      <PropertyPanel mode="slide" slideName="Opening title" exportSettings={exportContract} exportMode={exportContractMode}
        projectFrameRate={30} exportTargetName="Opening title"
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

  if (view === "issue-499-type-anchor") {
    // #499 — reproduce the REAL app-like context: a full-width workspace that is
    // the overlay collision boundary (`data-composa-overlay-boundary`), a fluid
    // canvas region on the left, and the element PropertyPanel docked hard-right
    // at its native width — mirroring ComposaApp's `.composa-workspace` +
    // `.composa-inspector`. The prior offset fix passed against a fixture where
    // the text panel was NOT at the viewport edge; here it is, so the Type
    // Settings dialog's clearance to the LEFT of the inspector is measurable.
    const params = new URLSearchParams(window.location.search);
    const dark = params.get("theme") === "dark";
    // Optional inspector-width override. The panel's real width is 240px; a
    // different value proves the dialog tracks the inspector's ACTUAL left edge
    // rather than a hard-coded width assumption baked into a trigger offset.
    const widthOverride = Number(params.get("w"));
    return (
      <div
        data-composa-mode={dark ? "dark" : undefined}
        data-composa-overlay-boundary
        data-issue-499-workspace
        style={{ height: "100vh", width: "100vw", display: "flex", background: dark ? "#1e1e1e" : "#e6e6e6" }}
      >
        {Number.isFinite(widthOverride) && widthOverride > 0 && (
          <style>{`.composa-inspector{width:${widthOverride}px !important;}`}</style>
        )}
        <div data-issue-499-canvas style={{ flex: 1, minWidth: 0 }} />
        <PropertyPanel className="composa-inspector" elementType="text"
          typography={elementContract.typography}
          strokes={elementContract.strokes}
          effects={elementContract.effects} />
      </div>
    );
  }

  if (view === "export-dialog-anchor" || view === "fontpicker-dialog-anchor") {
    // Mirrors the #499 app-like context (full-width overlay boundary + fluid
    // canvas + inspector docked hard-right) so a new dialog's clearance to the
    // LEFT of the inspector is measurable. The trigger sits in the inspector's
    // far-right action gutter; the panel carries BOTH `.composa-inspector` (the
    // e2e locator) and `data-composa-inspector-surface` (the anchor edge), so the
    // surface-anchored dialog must land clear of the panel at ANY width.
    const params = new URLSearchParams(window.location.search);
    const dark = params.get("theme") === "dark";
    const widthOverride = Number(params.get("w"));
    const isExport = view === "export-dialog-anchor";
    const fonts: FontEntry[] = [
      { name: "Inter", stack: "'Inter', sans-serif" },
      { name: "Inria Serif", stack: "'Inria Serif', serif" },
      { name: "Roboto", stack: "'Roboto', sans-serif" },
      { name: "Playfair Display", stack: "'Playfair Display', serif" },
      { name: "Space Grotesk", stack: "'Space Grotesk', sans-serif" },
      { name: "DM Serif Display", stack: "'DM Serif Display', serif" },
      { name: "Lato", stack: "'Lato', sans-serif" },
      { name: "Poppins", stack: "'Poppins', sans-serif" },
      { name: "Merriweather", stack: "'Merriweather', serif" },
      { name: "Source Serif 4", stack: "'Source Serif 4', serif" },
    ];
    return (
      <div
        data-composa-mode={dark ? "dark" : undefined}
        data-composa-overlay-boundary
        style={{ height: "100vh", width: "100vw", display: "flex", background: dark ? "#1e1e1e" : "#e6e6e6" }}
      >
        {Number.isFinite(widthOverride) && widthOverride > 0 && (
          <style>{`.composa-inspector{width:${widthOverride}px !important;}`}</style>
        )}
        <div style={{ flex: 1, minWidth: 0 }} />
        <div
          data-composa-inspector-surface
          className="composa-inspector"
          style={{ width: 240, flexShrink: 0, height: "100%", display: "flex", flexDirection: "column", background: dark ? "#2c2c2c" : "#ffffff", borderLeft: "1px solid rgba(0,0,0,0.1)" }}
        >
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 8 }}>
            {/* 24px action slot at the panel's far-right gutter — the InspectorDialog
                trigger span is `w-full`, so this box makes the trigger a real
                far-right action button (mirroring the inspector's action gutter). */}
            <div style={{ width: 24, height: 24 }}>
            {isExport ? (
              <ExportDialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                value={exportDialogValue}
                onChange={patch => setExportDialogValue(value => ({ ...value, ...patch }))}
                trigger={
                  <button
                    type="button"
                    aria-label="Export"
                    onClick={() => setExportDialogOpen(open => !open)}
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5 }}
                  >
                    ⇧
                  </button>
                }
              />
            ) : (
              <FontPickerDialog
                open={fontPickerOpen}
                onClose={() => setFontPickerOpen(false)}
                fonts={fonts}
                value={fontPickerValue}
                onSelect={name => { setFontPickerValue(name); setFontPickerOpen(false); }}
                trigger={
                  <button
                    type="button"
                    aria-label="Fonts"
                    onClick={() => setFontPickerOpen(open => !open)}
                    style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5 }}
                  >
                    Aa
                  </button>
                }
              />
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === "issue-490-fill-rows") {
    // #490 — multi-item Fill/Stroke/Effects stacks so the reorder grip renders
    // (grip only shows with >1 item), for measuring row-anatomy alignment of
    // grip · swatch · fields · eye · minus.
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    return <div data-composa-mode={dark ? "dark" : undefined} style={{ height: "100vh", width: "100vw", display: "flex", justifyContent: "flex-end", background: dark ? "#1e1e1e" : "#e6e6e6" }}>
      <PropertyPanel elementType="shape" />
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

  if (view === "issue-193-dimensions-order") {
    const baseLayout: ElementLayoutSettings = {
      mode: "vertical", gap: 12, padding: { top: 16, right: 16, bottom: 16, left: 16 },
      align: "mc", widthMode: "fixed", heightMode: "hug", clipsContent: false,
    };
    const gridLayout: ElementLayoutSettings = {
      ...baseLayout,
      mode: "grid",
      grid: {
        rows: [{ id: "row-1", mode: "fixed", size: 100 }],
        columns: [{ id: "column-1", mode: "fixed", size: 100 }],
        rowGap: 10, columnGap: 10,
        justifyItems: "start", alignItems: "start", justifyContent: "start", alignContent: "start",
      },
    };
    return <div className="h-screen w-screen flex items-start justify-center gap-[24px] bg-c-bg-secondary p-[24px]">
      <section data-issue-193-mode="linear"><PropertyPanel elementType="frame-auto" layout={baseLayout} /></section>
      <section data-issue-193-mode="grid"><PropertyPanel elementType="frame-grid" layout={gridLayout} /></section>
    </div>;
  }

  if (view === "crop-contract") {
    const dark = new URLSearchParams(window.location.search).get("theme") === "dark";
    return <div data-composa-mode={dark ? "dark" : undefined} className="flex min-h-screen items-center justify-center bg-c-bg-secondary p-[48px]">
      <div className="relative h-[520px] w-[820px] overflow-hidden rounded-c-lg bg-c-bg shadow-lg">
        <img src={cropPlaygroundMedia} alt="Crop playground media" className="absolute inset-0 size-full object-cover" style={{ transform: `translate(${cropOffset.x}px, ${cropOffset.y}px) scale(1.15)` }} />
        <CanvasCropOverlay style={{ left: 120, top: 90, width: 580, height: 326 }} onMove={(x, y) => setCropOffset(current => ({ x: current.x + x, y: current.y + y }))} />
        <div className="absolute inset-x-0 bottom-[72px] flex justify-center"><CropToolbar aspect={cropAspect} onAspectChange={setCropAspect} onResizeToFit={() => setCropOffset({ x: 0, y: 0 })} onDone={() => undefined} /></div>
        <div className="absolute inset-x-0 bottom-[16px] flex justify-center"><CreationToolbar /></div>
      </div>
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
          {nav === "composition" ? <CompositionPanel /> : nav === "assets" ? <AssetsPanel /> : <EditorAgentColumn />}
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
    // Lane + collapse callbacks are wired so those controls render LIVE rather than
    // permanently inert — otherwise the playground can't demo their tooltips
    // (Composa#628: an unwired control suppresses its tooltip by design).
    const noop = () => undefined;
    return (
      <div style={{ height: "100vh", width: "100vw", background: "#e6e6e6", padding: 24, boxSizing: "border-box" }}>
        <Timeline height={360} mode={view === "timeline-master" ? "master" : "slide"}
          baseClips={clipBlocks} laneControls={laneControls}
          onLaneAdd={noop}
          onLaneVisibilityToggle={lane => toggleLane(lane, "visible")}
          onLaneSoloToggle={lane => toggleLane(lane, "solo")}
          onLaneMuteToggle={lane => toggleLane(lane, "muted")}
          onLaneLockToggle={lane => toggleLane(lane, "locked")}
          onTimelineCollapsedChange={noop} />
      </div>
    );
  }

  if (view === "slides") {
    return <SlidesFixture />;
  }

  if (view === "dial") {
    return (
      <div style={{ minHeight: "100vh", width: "100vw", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", padding: 24, boxSizing: "border-box", background: "#e6e6e6" }}>
        <DialFixture mode="light" />
        <DialFixture mode="dark" />
      </div>
    );
  }

  if (view === "issue-207") {
    return <div style={{ minHeight: "100vh", width: "100vw", display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start", padding: 24, boxSizing: "border-box", background: "#e6e6e6" }}>
      <Issue207ControlsFixture mode="light" width={240} />
      <Issue207ControlsFixture mode="light" width={200} />
      <Issue207ControlsFixture mode="dark" width={240} />
    </div>;
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
