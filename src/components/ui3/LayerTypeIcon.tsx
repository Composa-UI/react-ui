import { Columns3, Component, Folder, Grid2X2, Hash, Image as ImageIcon, Minus, Rows3, Square, Type } from "lucide-react";
import { clsx } from "clsx";

export type LayerIconType = "frame" | "group" | "text" | "component" | "instance" | "image" | "shape" | "line";
export type LayerAutoLayoutMode = "none" | "horizontal" | "vertical" | "wrap";

export interface LayerTypeIconProps {
  type: LayerIconType;
  autoLayoutMode?: LayerAutoLayoutMode;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** Canonical element-type icon shared by Layers and the element timeline. */
export function LayerTypeIcon({ type, autoLayoutMode = "none", size = 16, strokeWidth = 1.5, className }: LayerTypeIconProps) {
  const Icon = type === "frame" && autoLayoutMode === "horizontal" ? Columns3
    : type === "frame" && autoLayoutMode === "vertical" ? Rows3
    : type === "frame" && autoLayoutMode === "wrap" ? Grid2X2
    : type === "frame" ? Hash
    : type === "group" ? Folder
    : type === "text" ? Type
    : type === "component" || type === "instance" ? Component
    : type === "image" ? ImageIcon
    : type === "line" ? Minus
    : Square;
  return <Icon data-layer-icon-type={type} data-auto-layout-mode={autoLayoutMode} size={size} strokeWidth={strokeWidth}
    className={clsx("shrink-0", (type === "component" || type === "instance") && "text-accent-component", className)} />;
}
