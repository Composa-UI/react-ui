import {
  AlignCenter,
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  AudioLines,
  Circle,
  Droplet,
  LayoutGrid,
  Component,
  Frame,
  Grip,
  Image as ImageIcon,
  Minus,
  PanelBottomDashed,
  PanelLeftDashed,
  PanelRightDashed,
  PanelTopDashed,
  Settings2,
  Shrink,
  Square,
  SquareDashed,
  SquarePlay,
  Sun,
  Type,
  type LucideIcon,
} from "lucide-react";
import {
  ProposedAngle,
  ProposedArrowUpDownToLine,
  ProposedGapHorizontal,
  ProposedGapVertical,
  ProposedLayoutFreeform,
  ProposedLayoutHorizontal,
  ProposedLayoutHorizontalBottom,
  ProposedLayoutHorizontalCenter,
  ProposedLayoutHorizontalTop,
  ProposedLayoutPanelLeftCheck,
  ProposedLayoutPanelLeftPlus,
  ProposedLayoutVertical,
  ProposedLayoutVerticalCenter,
  ProposedLayoutVerticalLeft,
  ProposedLayoutVerticalRight,
  ProposedLayoutWrap,
  ProposedLetterSpacing,
  ProposedLineHeight,
  ProposedOpacity,
  ProposedPanelLeftRightDashed,
  ProposedPanelTopBottomDashed,
  ProposedRouteArrowRight,
  ProposedScanSquare,
} from "../../icons/proposed-lucide";

export type ComposaIconSemantic =
  | "frame"
  | "group-compatibility"
  | "text"
  | "component"
  | "image"
  | "line"
  | "ellipse"
  | "shape"
  | "auto-layout-frame"
  | "auto-layout-add"
  | "layout-freeform"
  | "layout-horizontal"
  | "layout-vertical"
  | "layout-wrap"
  | "gap-horizontal"
  | "gap-vertical"
  | "padding-top"
  | "padding-right"
  | "padding-bottom"
  | "padding-left"
  | "padding-horizontal"
  | "padding-vertical"
  | "align-left"
  | "align-center-x"
  | "align-right"
  | "align-top"
  | "align-center-y"
  | "align-bottom"
  | "distribute-horizontal"
  | "distribute-vertical"
  | "tidy-up"
  | "text-align-left"
  | "text-align-center-x"
  | "text-align-right"
  | "text-align-top"
  | "text-align-center"
  | "text-align-bottom"
  | "letter-spacing"
  | "line-height"
  | "resize-to-fit"
  | "absolute-position"
  | "automatic-positioning"
  | "rotation"
  | "opacity"
  | "effect-blur"
  | "effect-spread"
  | "blend-mode"
  | "fill-video"
  | "media-video"
  | "media-audio"
  | "sizing-fixed"
  | "sizing-hug"
  | "sizing-fill"
  | "auto-layout-horizontal-top"
  | "auto-layout-horizontal-center"
  | "auto-layout-horizontal-bottom"
  | "auto-layout-vertical-left"
  | "auto-layout-vertical-center"
  | "auto-layout-vertical-right"
  | "layout-grid"
  | "settings";

export const composaIconSemantics = {
  frame: Frame,
  "group-compatibility": SquareDashed,
  text: Type,
  component: Component,
  image: ImageIcon,
  line: Minus,
  // Every primitive draws its own outline, so a layer row reads as the object it
  // points at (Composa#661). An ellipse used to fall through to `shape`/Square.
  ellipse: Circle,
  // `shape` stays the rectangle/fallback glyph for primitives with no dedicated
  // outline yet.
  shape: Square,
  "auto-layout-frame": ProposedLayoutPanelLeftCheck,
  "auto-layout-add": ProposedLayoutPanelLeftPlus,
  "layout-freeform": ProposedLayoutFreeform,
  "layout-horizontal": ProposedLayoutHorizontal,
  "layout-vertical": ProposedLayoutVertical,
  // Wrap stays a multi-line auto-layout modifier on Horizontal, while Grid is a
  // distinct Flow mode. Wrap owns its bespoke flow glyph; Grid owns the official
  // Lucide LayoutGrid glyph. They must remain visibly and semantically distinct.
  "layout-wrap": ProposedLayoutWrap,
  "gap-horizontal": ProposedGapHorizontal,
  "gap-vertical": ProposedGapVertical,
  "padding-top": PanelTopDashed,
  "padding-right": PanelRightDashed,
  "padding-bottom": PanelBottomDashed,
  "padding-left": PanelLeftDashed,
  "padding-horizontal": ProposedPanelLeftRightDashed,
  "padding-vertical": ProposedPanelTopBottomDashed,
  "align-left": AlignStartVertical,
  "align-center-x": AlignCenterVertical,
  "align-right": AlignEndVertical,
  "align-top": AlignStartHorizontal,
  "align-center-y": AlignCenterHorizontal,
  "align-bottom": AlignEndHorizontal,
  "distribute-horizontal": AlignHorizontalDistributeCenter,
  "distribute-vertical": AlignVerticalDistributeCenter,
  "tidy-up": LayoutGrid,
  // Typography horizontal text-alignment (align text within its box).
  // Paragraph glyphs with horizontal text lines — distinct from the
  // object-align box glyphs (align-*) and the vertical text-align group below.
  // Named with the `-x` axis suffix (mirroring `align-center-x`) so the
  // horizontal center does not collide with the vertical `text-align-center`.
  "text-align-left": AlignLeft,
  "text-align-center-x": AlignCenter,
  "text-align-right": AlignRight,
  "text-align-top": ArrowUpToLine,
  "text-align-center": ProposedArrowUpDownToLine,
  "text-align-bottom": ArrowDownToLine,
  "letter-spacing": ProposedLetterSpacing,
  "line-height": ProposedLineHeight,
  "resize-to-fit": Shrink,
  "absolute-position": ProposedScanSquare,
  "automatic-positioning": ProposedRouteArrowRight,
  rotation: ProposedAngle,
  opacity: ProposedOpacity,
  // Effect blur/spread were shipped as literal text glyphs (⊞ / ☼) rather than
  // icons, which read as mojibake next to the Lucide leads on every other numeric
  // field (#661). The owner picked these two Lucide names; as with layout-wrap and
  // blend-mode the semantic name carries the meaning, the glyph is the owner's.
  "effect-blur": Grip,
  "effect-spread": Sun,
  // Blend mode reads as a droplet per owner ask — the semantic name stays
  // "blend-mode" (its meaning), the glyph is Droplet (mirrors layout-wrap → grid).
  "blend-mode": Droplet,
  "fill-video": SquarePlay,
  // The master timeline track headers define the media-type glyph identity.
  // Consumers resolve through these semantics so size/stroke may adapt without
  // silently swapping Video or Audio to a different symbol (#749).
  "media-video": SquarePlay,
  "media-audio": AudioLines,
  "sizing-fixed": Square,
  "sizing-hug": Shrink,
  "sizing-fill": Frame,
  "auto-layout-horizontal-top": ProposedLayoutHorizontalTop,
  "auto-layout-horizontal-center": ProposedLayoutHorizontalCenter,
  "auto-layout-horizontal-bottom": ProposedLayoutHorizontalBottom,
  "auto-layout-vertical-left": ProposedLayoutVerticalLeft,
  "auto-layout-vertical-center": ProposedLayoutVerticalCenter,
  "auto-layout-vertical-right": ProposedLayoutVerticalRight,
  // Grid is a distinct 2D layout mode (grid-and-wrap-spec §3), separate from the
  // wrapped-flow `layout-wrap` glyph above.
  "layout-grid": LayoutGrid,
  settings: Settings2,
} as const satisfies Record<ComposaIconSemantic, LucideIcon>;

export function iconForSemantic(semantic: ComposaIconSemantic): LucideIcon {
  return composaIconSemantics[semantic];
}
