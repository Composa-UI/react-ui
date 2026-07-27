import { iconForSemantic, type ComposaIconSemantic } from "./IconSemantics";

export type AutoLayoutSpacingIconProps =
  | { kind: "gap"; axis: "horizontal" | "vertical"; size?: number }
  | { kind: "padding"; axis: "horizontal" | "vertical"; size?: number }
  | { kind: "padding"; edge: "top" | "right" | "bottom" | "left"; size?: number };

/**
 * Canonical Inspector/canvas spacing icon seam.
 *
 * Keep every Gap and Padding numeric editor on this component so a later icon
 * fidelity pass changes Inspector and its on-canvas editor together.
 */
export function AutoLayoutSpacingIcon(props: AutoLayoutSpacingIconProps) {
  const semantic = ("edge" in props
    ? `padding-${props.edge}`
    : `${props.kind}-${props.axis}`) as ComposaIconSemantic;
  const Icon = iconForSemantic(semantic);
  return <Icon
    aria-hidden
    data-icon-semantic={semantic}
    size={props.size ?? 14}
    strokeWidth={1.5}
  />;
}
