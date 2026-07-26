import { MoveHorizontal, MoveVertical } from "lucide-react";
import type { ReactNode } from "react";

export type AutoLayoutSpacingIconProps =
  | { kind: "gap"; axis: "horizontal" | "vertical"; size?: number }
  | { kind: "padding"; axis: "horizontal" | "vertical"; size?: number }
  | { kind: "padding"; edge: "top" | "right" | "bottom" | "left"; size?: number };

const paddingEdgeGlyph: Record<"top" | "right" | "bottom" | "left", ReactNode> = {
  top: "↑",
  right: "→",
  bottom: "↓",
  left: "←",
};

/**
 * Canonical Inspector/canvas spacing icon seam.
 *
 * Keep every Gap and Padding numeric editor on this component so a later icon
 * fidelity pass changes Inspector and its on-canvas editor together.
 */
export function AutoLayoutSpacingIcon(props: AutoLayoutSpacingIconProps) {
  if ("edge" in props) {
    return <span
      aria-hidden
      data-icon-semantic={`padding-${props.edge}`}
      style={{ fontSize: props.size }}
    >{paddingEdgeGlyph[props.edge]}</span>;
  }
  const Icon = props.axis === "vertical" ? MoveVertical : MoveHorizontal;
  return <Icon
    aria-hidden
    data-icon-semantic={`${props.kind}-${props.axis}`}
    size={props.size ?? 14}
    strokeWidth={1.5}
  />;
}
