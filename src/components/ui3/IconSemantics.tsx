import {
  ArrowDownToLine,
  ArrowUpToLine,
  Component,
  Frame,
  Image as ImageIcon,
  Minus,
  Scan,
  Settings2,
  Shrink,
  Square,
  SquareDashed,
  Type,
  type LucideIcon,
} from "lucide-react";
import {
  ProposedArrowUpDownToLine,
  ProposedGapHorizontal,
  ProposedGapVertical,
  ProposedLayoutFreeform,
  ProposedLayoutHorizontal,
  ProposedLayoutPanelLeftCheck,
  ProposedLayoutPanelLeftPlus,
  ProposedLayoutVertical,
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
  | "text-align-top"
  | "text-align-center"
  | "text-align-bottom"
  | "resize-to-fit"
  | "absolute-position"
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
  "text-align-top": ArrowUpToLine,
  "text-align-center": ProposedArrowUpDownToLine,
  "text-align-bottom": ArrowDownToLine,
  "resize-to-fit": Shrink,
  "absolute-position": Scan,
  settings: Settings2,
} as const satisfies Record<ComposaIconSemantic, LucideIcon>;

export function iconForSemantic(semantic: ComposaIconSemantic): LucideIcon {
  return composaIconSemantics[semantic];
}
