import { clsx } from "clsx";
import { iconForSemantic, type ComposaIconSemantic } from "./IconSemantics";

export type LayerIconType = "frame" | "group" | "text" | "component" | "instance" | "image" | "video" | "shape" | "line" | "ellipse";
export type LayerAutoLayoutMode = "none" | "horizontal" | "vertical" | "grid";
/**
 * Counter-axis alignment of an auto-layout frame, in the engine's own vocabulary
 * (`layout.counterAlign`). Counter-axis and not primary: the six registered
 * `auto-layout-*` glyphs vary the SECONDARY rect across the counter axis
 * (proposed-lucide.tsx — horizontal moves it top/centre/bottom, vertical moves it
 * left/centre/right) and hold the primary axis fixed, so counter alignment is the
 * only thing this icon set can honestly draw.
 */
export type LayerAutoLayoutAlign = "start" | "center" | "end";

const AUTO_LAYOUT_SEMANTIC = {
  horizontal: { start: "auto-layout-horizontal-top", center: "auto-layout-horizontal-center", end: "auto-layout-horizontal-bottom" },
  vertical: { start: "auto-layout-vertical-left", center: "auto-layout-vertical-center", end: "auto-layout-vertical-right" },
} as const satisfies Record<"horizontal" | "vertical", Record<LayerAutoLayoutAlign, ComposaIconSemantic>>;

export interface LayerTypeIconProps {
  type: LayerIconType;
  autoLayoutMode?: LayerAutoLayoutMode;
  autoLayoutAlign?: LayerAutoLayoutAlign;
  size?: number;
  strokeWidth?: number;
  tone?: "primary" | "secondary";
  className?: string;
}

/** Canonical element-type icon shared by Layers and the element timeline. */
export function LayerTypeIcon({ type, autoLayoutMode = "none", autoLayoutAlign = "start", size = 16, strokeWidth = 1.5, tone = "primary", className }: LayerTypeIconProps) {
  // The glyph used to be pinned to `-center` for every auto-layout frame, so the
  // row never moved when the owner changed alignment (Composa#661). Default is
  // `start` and not `center` because that is what a frame actually has until
  // someone changes it (engine defaults.ts: `counterAlign: "start"`) — a caller
  // that cannot supply alignment then renders the untouched-frame icon rather
  // than a state no frame is in by default.
  const semantic: ComposaIconSemantic = type === "frame" && (autoLayoutMode === "horizontal" || autoLayoutMode === "vertical") ? AUTO_LAYOUT_SEMANTIC[autoLayoutMode][autoLayoutAlign]
    : type === "frame" && autoLayoutMode === "grid" ? "layout-grid"
    : type === "frame" ? "frame"
    : type === "group" ? "group-compatibility"
    : type === "text" ? "text"
    : type === "component" || type === "instance" ? "component"
    : type === "image" ? "image"
    : type === "video" ? "media-video"
    : type === "line" ? "line"
    : type === "ellipse" ? "ellipse"
    : "shape";
  const Icon = iconForSemantic(semantic);
  return <Icon data-icon-semantic={semantic} data-layer-icon-type={type} data-auto-layout-mode={autoLayoutMode} data-auto-layout-align={autoLayoutAlign} size={size} strokeWidth={strokeWidth}
    className={clsx("shrink-0", type === "component" || type === "instance" ? "text-accent-component" : tone === "secondary" ? "text-c-icon-secondary" : "text-c-icon", className)} />;
}
