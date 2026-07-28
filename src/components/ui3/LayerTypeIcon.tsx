import { clsx } from "clsx";
import { iconForSemantic, type ComposaIconSemantic } from "./IconSemantics";

export type LayerIconType = "frame" | "group" | "text" | "component" | "instance" | "image" | "shape" | "line";
export type LayerAutoLayoutMode = "none" | "horizontal" | "vertical" | "grid";

export interface LayerTypeIconProps {
  type: LayerIconType;
  autoLayoutMode?: LayerAutoLayoutMode;
  size?: number;
  strokeWidth?: number;
  tone?: "primary" | "secondary";
  className?: string;
}

/** Canonical element-type icon shared by Layers and the element timeline. */
export function LayerTypeIcon({ type, autoLayoutMode = "none", size = 16, strokeWidth = 1.5, tone = "primary", className }: LayerTypeIconProps) {
  const semantic: ComposaIconSemantic = type === "frame" && autoLayoutMode === "horizontal" ? "auto-layout-horizontal-center"
    : type === "frame" && autoLayoutMode === "vertical" ? "auto-layout-vertical-center"
    : type === "frame" && autoLayoutMode === "grid" ? "layout-grid"
    : type === "frame" ? "frame"
    : type === "group" ? "group-compatibility"
    : type === "text" ? "text"
    : type === "component" || type === "instance" ? "component"
    : type === "image" ? "image"
    : type === "line" ? "line"
    : "shape";
  const Icon = iconForSemantic(semantic);
  return <Icon data-icon-semantic={semantic} data-layer-icon-type={type} data-auto-layout-mode={autoLayoutMode} size={size} strokeWidth={strokeWidth}
    className={clsx("shrink-0", type === "component" || type === "instance" ? "text-accent-component" : tone === "secondary" ? "text-c-icon-secondary" : "text-c-icon", className)} />;
}
