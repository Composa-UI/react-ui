import { useRef, useState, useCallback } from "react";
import { SidePanel, SIDE_PANEL_DEFAULT_WIDTH } from "./SidePanel";
import { clsx } from "clsx";
import { SlidesPanel, type SlideData } from "./SlidesPanel";
import { LayerList, type LayerListProps, type LayerNode } from "./LayerList";

// ─── Composition panel ────────────────────────────────────────────────────────
// The default left-rail content (app-shell.md → "Composition view"). A vertical
// SPLIT: SlidesPanel on top (~40%), LayerList on the bottom (~60%), separated by a
// DRAGGABLE horizontal divider that adjusts the relative heights (pointer drag).
// 240px wide, full height, theme-aware (renders LIGHT by default, DARK under
// `data-composa-mode="dark"`). Presentational: slide/layer data + the current split
// are controllable; the editor wires real data and persists the ratio.

const MIN_PX = 80;          // spec: each panel min 80px

export interface CompositionPanelProps {
  slides?: SlideData[];
  /** Project canvas aspect ratio (width / height) for slide thumbnails (#482). */
  slideAspectRatio?: number;
  layers?: LayerNode[];
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  layerScopeId?: LayerListProps["scopeId"];
  expandedLayerIds?: LayerListProps["expandedIds"];
  defaultExpandedLayerIds?: LayerListProps["defaultExpandedIds"];
  onExpandedLayerIdsChange?: LayerListProps["onExpandedIdsChange"];
  focusedLayerId?: LayerListProps["focusedId"];
  defaultFocusedLayerId?: LayerListProps["defaultFocusedId"];
  onFocusedLayerIdChange?: LayerListProps["onFocusedIdChange"];
  renamingLayerId?: LayerListProps["renamingId"];
  onLayerSelectionChange?: LayerListProps["onSelectionChange"];
  onLayerVisibilityChange?: LayerListProps["onVisibilityChange"];
  onLayerLockChange?: LayerListProps["onLockChange"];
  onLayerRenameRequest?: LayerListProps["onRenameRequest"];
  onLayerRenameCommit?: LayerListProps["onRenameCommit"];
  onLayerRenameCancel?: LayerListProps["onRenameCancel"];
  onLayerContextMenu?: LayerListProps["onContextMenu"];
  onLayerReorder?: LayerListProps["onReorder"];
  onLayerReparent?: LayerListProps["onReparent"];
  onNewSlide?: () => void;
  onNewSlideMenu?: () => void;
  onSlideRenameRequest?: (index: number) => void;
  onSlideDuplicate?: (index: number) => void;
  onSlidePublishTemplate?: (index: number) => void;
  onSlideDelete?: (index: number) => void;
  /** Commit an inline rename of the project (Slides header title). */
  onCompRename?: (name: string) => void;
  /** Open the project options menu (Slides header title chevron). */
  onCompMenu?: (trigger: HTMLButtonElement) => void;
  slidesTitle?: string;
  slidesSubtitle?: string;
  layersTitle?: string;
  /** Top (slides) share of the split, 0–1. Default ~0.4 per spec. */
  split?: number;
  /** Uncontrolled default when `split` is not provided. */
  defaultSplit?: number;
  onSplitChange?: (split: number) => void;
  /** Panel width in px (controlled). */
  width?: number;
  /** Uncontrolled default when `width` is not provided. Default 240px. */
  defaultWidth?: number;
  onWidthChange?: (width: number) => void;
  className?: string;
}

export function CompositionPanel({
  slides = DEMO_SLIDES,
  slideAspectRatio,
  layers,
  selectedLayerId,
  selectedLayerIds,
  layerScopeId,
  expandedLayerIds,
  defaultExpandedLayerIds,
  onExpandedLayerIdsChange,
  focusedLayerId,
  defaultFocusedLayerId,
  onFocusedLayerIdChange,
  renamingLayerId,
  onLayerSelectionChange,
  onLayerVisibilityChange,
  onLayerLockChange,
  onLayerRenameRequest,
  onLayerRenameCommit,
  onLayerRenameCancel,
  onLayerContextMenu,
  onLayerReorder,
  onLayerReparent,
  onNewSlide,
  onNewSlideMenu,
  onSlideRenameRequest,
  onSlideDuplicate,
  onSlidePublishTemplate,
  onSlideDelete,
  onCompRename,
  onCompMenu,
  slidesTitle,
  slidesSubtitle,
  layersTitle,
  split: controlledSplit,
  defaultSplit = 0.4,
  onSplitChange,
  width: controlledWidth,
  defaultWidth = SIDE_PANEL_DEFAULT_WIDTH,
  onWidthChange,
  className,
}: CompositionPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalSplit, setInternalSplit] = useState(defaultSplit);
  const split = controlledSplit ?? internalSplit;
  const [dragging, setDragging] = useState(false);


  const setSplit = useCallback(
    (next: number) => {
      if (controlledSplit == null) setInternalSplit(next);
      onSplitChange?.(next);
    },
    [controlledSplit, onSplitChange],
  );

  // ── Vertical split resize — invisible hit area on the TOP EDGE of the layers panel.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = containerRef.current;
      if (!el) return;
      setDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const move = (ev: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const usable = rect.height;
        if (usable <= 0) return;
        const raw = ev.clientY - rect.top;
        // clamp so both panels keep their 80px minimum
        const clamped = Math.min(Math.max(raw, MIN_PX), usable - MIN_PX);
        setSplit(clamped / usable);
      };
      const up = () => {
        setDragging(false);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [setSplit],
  );

  // Keyboard nudge for accessibility (2% per arrow press).
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowUp") { e.preventDefault(); setSplit(Math.max(0, split - 0.02)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setSplit(Math.min(1, split + 0.02)); }
    },
    [split, setSplit],
  );

  // ── Width resize — invisible hit area on the RIGHT EDGE of the panel.
  return (
    <SidePanel className={className} width={controlledWidth} defaultWidth={defaultWidth} onWidthChange={onWidthChange}>
      {/* The vertical split measures against this box, which spans the panel's
          full height — SidePanel owns the outer element and the width handle. */}
      <div ref={containerRef} className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
      {/* Top — Slides (min 80px). `[&>*]:!w-full` stretches the child to the column
          width; `[&>*]:!border-r-0` drops its own right border (the container owns it). */}
      <div className="min-h-[80px] overflow-hidden [&>*]:!w-full [&>*]:!border-r-0" style={{ flexBasis: `calc(${split} * 100%)`, flexGrow: 0, flexShrink: 1 }}>
        <SlidesPanel slides={slides} aspectRatio={slideAspectRatio} title={slidesTitle} subtitle={slidesSubtitle} onNewSlide={onNewSlide} onNewSlideMenu={onNewSlideMenu} onRenameRequest={onSlideRenameRequest} onSlideDuplicate={onSlideDuplicate} onSlidePublishTemplate={onSlidePublishTemplate} onSlideDelete={onSlideDelete} onTitleChange={onCompRename} onTitleMenu={onCompMenu} />
      </div>

      {/* Bottom — Layers (min 80px, fills the rest). Same stretch/border overrides. */}
      <div className="relative flex-1 min-h-[80px] overflow-hidden [&>*]:!w-full [&>*]:!border-r-0">
        {/* Split resize affordance — thin invisible hit area on the TOP EDGE of the
            layers panel. No visible handle; only a ns-resize cursor on hover. */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize slides and layers"
          aria-valuenow={Math.round(split * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onKeyDown={onKeyDown}
          className="absolute top-0 inset-x-0 h-[4px] z-10 cursor-ns-resize select-none outline-none -translate-y-1/2 focus-visible:bg-c-border-selected/40"
        />
          <LayerList layers={layers} title={layersTitle} scopeId={layerScopeId} selectedId={selectedLayerId} selectedIds={selectedLayerIds} onSelectionChange={onLayerSelectionChange}
            expandedIds={expandedLayerIds} defaultExpandedIds={defaultExpandedLayerIds} onExpandedIdsChange={onExpandedLayerIdsChange}
            focusedId={focusedLayerId} defaultFocusedId={defaultFocusedLayerId} onFocusedIdChange={onFocusedLayerIdChange} renamingId={renamingLayerId}
            onVisibilityChange={onLayerVisibilityChange} onLockChange={onLayerLockChange}
            onRenameRequest={onLayerRenameRequest} onRenameCommit={onLayerRenameCommit} onRenameCancel={onLayerRenameCancel} onContextMenu={onLayerContextMenu}
            onReorder={onLayerReorder} onReparent={onLayerReparent} />
      </div>

      </div>
    </SidePanel>
  );
}

// ── Demo data so the panel renders standalone ────────────────────────────────
const DEMO_SLIDES: SlideData[] = [
  { n: 1, tint: "#4f46e5" },
  { n: 2, tint: "#0ea5e9", selected: true },
  { n: 3, tint: "#f59e0b", motion: true },
  { n: 4, tint: "#10b981", group: true, expanded: true },
  { n: "4.1", tint: "#34d399", sub: true },
  { n: "4.2", tint: "#6ee7b7", sub: true, comment: 2 },
  { n: 5, tint: "#ef4444", stacked: true },
  { n: 6, tint: "#8b5cf6" },
];
