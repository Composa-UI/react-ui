import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  ArrowDownToLine,
  ArrowUpToLine,
  Blend,
  Component,
  Frame,
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
  ProposedOpacity,
  ProposedPanelLeftRightDashed,
  ProposedPanelTopBottomDashed,
  ProposedScanSquare,
} from "../../icons/proposed-lucide";

export type ComposaIconSemantic =
  | "frame"
  | "group-compatibility"
  | "text"
  | "component"
  | "image"
  | "line"
  | "shape"
  | "auto-layout-frame"
  | "auto-layout-add"
  | "layout-freeform"
  | "layout-horizontal"
  | "layout-vertical"
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
  | "text-align-top"
  | "text-align-center"
  | "text-align-bottom"
  | "resize-to-fit"
  | "absolute-position"
  | "rotation"
  | "opacity"
  | "blend-mode"
  | "fill-video"
  | "sizing-fixed"
  | "sizing-hug"
  | "sizing-fill"
  | "auto-layout-horizontal-top"
  | "auto-layout-horizontal-center"
  | "auto-layout-horizontal-bottom"
  | "auto-layout-vertical-left"
  | "auto-layout-vertical-center"
  | "auto-layout-vertical-right"
  | "settings";

export const composaIconSemantics = {
  frame: Frame,
  "group-compatibility": SquareDashed,
  text: Type,
  component: Component,
  image: ImageIcon,
  line: Minus,
  shape: Square,
  "auto-layout-frame": ProposedLayoutPanelLeftCheck,
  "auto-layout-add": ProposedLayoutPanelLeftPlus,
  "layout-freeform": ProposedLayoutFreeform,
  "layout-horizontal": ProposedLayoutHorizontal,
  "layout-vertical": ProposedLayoutVertical,
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
  "text-align-top": ArrowUpToLine,
  "text-align-center": ProposedArrowUpDownToLine,
  "text-align-bottom": ArrowDownToLine,
  "resize-to-fit": Shrink,
  "absolute-position": ProposedScanSquare,
  rotation: ProposedAngle,
  opacity: ProposedOpacity,
  "blend-mode": Blend,
  "fill-video": SquarePlay,
  "sizing-fixed": Square,
  "sizing-hug": Shrink,
  "sizing-fill": Frame,
  "auto-layout-horizontal-top": ProposedLayoutHorizontalTop,
  "auto-layout-horizontal-center": ProposedLayoutHorizontalCenter,
  "auto-layout-horizontal-bottom": ProposedLayoutHorizontalBottom,
  "auto-layout-vertical-left": ProposedLayoutVerticalLeft,
  "auto-layout-vertical-center": ProposedLayoutVerticalCenter,
  "auto-layout-vertical-right": ProposedLayoutVerticalRight,
  settings: Settings2,
} as const satisfies Record<ComposaIconSemantic, LucideIcon>;

export function iconForSemantic(semantic: ComposaIconSemantic): LucideIcon {
  return composaIconSemantics[semantic];
}
