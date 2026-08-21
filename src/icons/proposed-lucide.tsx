import { createLucideIcon } from "lucide-react";

export interface ProposedLucideMetadata {
  pr: number;
  sourceUrl: `https://github.com/lucide-icons/lucide/pull/${number}`;
  replacementImport: string;
}

export const proposedLucideMetadata = {
  layoutHorizontal: { pr: 4541, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4541", replacementImport: "LayoutHorizontal" },
  layoutVertical: { pr: 4541, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4541", replacementImport: "LayoutVertical" },
  layoutPanelLeftCheck: { pr: 4542, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4542", replacementImport: "LayoutPanelLeftCheck" },
  layoutPanelLeftPlus: { pr: 4542, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4542", replacementImport: "LayoutPanelLeftPlus" },
  layoutFreeform: { pr: 4543, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4543", replacementImport: "LayoutFreeform" },
  gapHorizontal: { pr: 4544, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4544", replacementImport: "GapHorizontal" },
  gapVertical: { pr: 4544, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4544", replacementImport: "GapVertical" },
  angle: { pr: 4545, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4545", replacementImport: "Angle" },
  opacity: { pr: 4549, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4549", replacementImport: "Opacity" },
  arrowUpDownToLine: { pr: 4546, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4546", replacementImport: "ArrowUpDownToLine" },
  layoutHorizontalBottom: { pr: 4548, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4548", replacementImport: "LayoutHorizontalBottom" },
  layoutHorizontalCenter: { pr: 4548, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4548", replacementImport: "LayoutHorizontalCenter" },
  layoutHorizontalTop: { pr: 4548, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4548", replacementImport: "LayoutHorizontalTop" },
  layoutVerticalCenter: { pr: 4548, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4548", replacementImport: "LayoutVerticalCenter" },
  layoutVerticalLeft: { pr: 4548, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4548", replacementImport: "LayoutVerticalLeft" },
  layoutVerticalRight: { pr: 4548, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4548", replacementImport: "LayoutVerticalRight" },
  scanSquare: { pr: 4550, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4550", replacementImport: "ScanSquare" },
  letterSpacing: { pr: 3038, sourceUrl: "https://github.com/lucide-icons/lucide/pull/3038", replacementImport: "LetterSpacing" },
  lineHeight: { pr: 3039, sourceUrl: "https://github.com/lucide-icons/lucide/pull/3039", replacementImport: "LineHeight" },
  squareText: { pr: 4609, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4609", replacementImport: "SquareText" },
  textMargins: { pr: 4610, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4610", replacementImport: "TextMargins" },
  diamondCircle: { pr: 4615, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4615", replacementImport: "DiamondCircle" },
} as const satisfies Record<string, ProposedLucideMetadata>;

// TODO(lucide-pr-4541): replace with lucide-react LayoutHorizontal after upstream merge.
export const ProposedLayoutHorizontal = createLucideIcon("ProposedLayoutHorizontal", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "top-left" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "top-right" }],
  ["path", { d: "M3 18h18", key: "line" }],
  ["path", { d: "m18 21 3-3-3-3", key: "arrow" }],
]);

// TODO(lucide-pr-4541): replace with lucide-react LayoutVertical after upstream merge.
export const ProposedLayoutVertical = createLucideIcon("ProposedLayoutVertical", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "top" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "bottom" }],
  ["path", { d: "M18 3v18", key: "line" }],
  ["path", { d: "m21 18-3 3-3-3", key: "arrow" }],
]);

// TODO(lucide-pr-4542): replace with lucide-react LayoutPanelLeftCheck after upstream merge.
export const ProposedLayoutPanelLeftCheck = createLucideIcon("ProposedLayoutPanelLeftCheck", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "panel" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "cell" }],
  ["path", { d: "m15 19 2 2 4-4", key: "check" }],
]);

// TODO(lucide-pr-4542): replace with lucide-react LayoutPanelLeftPlus after upstream merge.
export const ProposedLayoutPanelLeftPlus = createLucideIcon("ProposedLayoutPanelLeftPlus", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "panel" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "cell" }],
  ["path", { d: "M15 18h6", key: "horizontal" }],
  ["path", { d: "M18 15v6", key: "vertical" }],
]);

// TODO(lucide-pr-4543): replace with lucide-react LayoutFreeform after upstream merge.
export const ProposedLayoutFreeform = createLucideIcon("ProposedLayoutFreeform", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "top-left" }],
  ["rect", { width: "7", height: "7", x: "14", y: "4", rx: "1", key: "top-right" }],
  ["rect", { width: "7", height: "7", x: "4", y: "14", rx: "1", key: "bottom-left" }],
]);

// Composa-local, no upstream proposal yet — hence absent from `proposedLucideMetadata`,
// which requires a real lucide PR number.
//
// Wrap previously borrowed the Lucide `LayoutGrid` glyph (#86 / #459). The
// grid-and-wrap spec calls that borrow a stand-in for the absence of a real grid
// ("#86 borrowed the `layout-grid` glyph for the wrap cell — a label papering over
// the absence of both a real two-gap wrap *and* a real grid") and folds "the #86
// glyph choice" into the grid work. Now that Grid is a first-class Flow segment
// wearing Lucide LayoutGrid, Wrap gets its own glyph, drawn
// from the same 7×7-rect family as ProposedLayoutHorizontal/Vertical/Freeform so
// the Flow row still reads as one set: a first line of two cells, then the flow
// wrapping back to the start of the next line.
export const ProposedLayoutWrap = createLucideIcon("ProposedLayoutWrap", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "first" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "second" }],
  ["path", { d: "M21 14v1a2 2 0 0 1-2 2H6", key: "wrap" }],
  ["path", { d: "m9 14-3 3 3 3", key: "arrow" }],
]);

// TODO(lucide-pr-4544): replace with lucide-react GapHorizontal after upstream merge.
export const ProposedGapHorizontal = createLucideIcon("ProposedGapHorizontal", [
  ["path", { d: "M12 2v2", key: "dash-1" }],
  ["path", { d: "M12 8v2", key: "dash-2" }],
  ["path", { d: "M12 14v2", key: "dash-3" }],
  ["path", { d: "M12 20v2", key: "dash-4" }],
  ["path", { d: "M21 3h-3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3", key: "right" }],
  ["path", { d: "M3 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H3", key: "left" }],
]);

// TODO(lucide-pr-4544): replace with lucide-react GapVertical after upstream merge.
export const ProposedGapVertical = createLucideIcon("ProposedGapVertical", [
  ["path", { d: "M2 12h2", key: "dash-1" }],
  ["path", { d: "M8 12h2", key: "dash-2" }],
  ["path", { d: "M14 12h2", key: "dash-3" }],
  ["path", { d: "M20 12h2", key: "dash-4" }],
  ["path", { d: "M3 21v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3", key: "bottom" }],
  ["path", { d: "M3 3v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V3", key: "top" }],
]);

// TODO(lucide-pr-4545): replace with lucide-react Angle after upstream merge.
export const ProposedAngle = createLucideIcon("ProposedAngle", [
  ["path", { d: "M3 3v16a2 2 0 0 0 2 2h16", key: "corner" }],
  ["path", { d: "M3 11a10 10 0 0 1 10 10", key: "arc" }],
]);

// TODO(lucide-pr-4549): replace with lucide-react Opacity after upstream merge.
export const ProposedOpacity = createLucideIcon("ProposedOpacity", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "frame" }],
  ["path", { d: "M16 8h.01", key: "dot-1" }],
  ["path", { d: "M12 12h.01", key: "dot-2" }],
  ["path", { d: "M16 12h.01", key: "dot-3" }],
  ["path", { d: "M8 16h.01", key: "dot-4" }],
  ["path", { d: "M12 16h.01", key: "dot-5" }],
  ["path", { d: "M16 16h.01", key: "dot-6" }],
]);

/** Combined-axis variants of Lucide's Panel*Dashed family. */
export const ProposedPanelLeftRightDashed = createLucideIcon("ProposedPanelLeftRightDashed", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "frame" }],
  ["path", { d: "M9 3v2", key: "left-1" }],
  ["path", { d: "M9 9v1", key: "left-2" }],
  ["path", { d: "M9 14v1", key: "left-3" }],
  ["path", { d: "M9 19v2", key: "left-4" }],
  ["path", { d: "M15 3v2", key: "right-1" }],
  ["path", { d: "M15 9v1", key: "right-2" }],
  ["path", { d: "M15 14v1", key: "right-3" }],
  ["path", { d: "M15 19v2", key: "right-4" }],
]);

export const ProposedPanelTopBottomDashed = createLucideIcon("ProposedPanelTopBottomDashed", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "frame" }],
  ["path", { d: "M3 9h2", key: "top-1" }],
  ["path", { d: "M9 9h1", key: "top-2" }],
  ["path", { d: "M14 9h1", key: "top-3" }],
  ["path", { d: "M19 9h2", key: "top-4" }],
  ["path", { d: "M3 15h2", key: "bottom-1" }],
  ["path", { d: "M9 15h1", key: "bottom-2" }],
  ["path", { d: "M14 15h1", key: "bottom-3" }],
  ["path", { d: "M19 15h2", key: "bottom-4" }],
]);

// TODO(lucide-pr-4546): replace with lucide-react ArrowUpDownToLine after upstream merge.
export const ProposedArrowUpDownToLine = createLucideIcon("ProposedArrowUpDownToLine", [
  ["path", { d: "M12 2v6", key: "top-line" }],
  ["path", { d: "m9 5 3 3 3-3", key: "top-arrow" }],
  ["path", { d: "M2 12h20", key: "center-line" }],
  ["path", { d: "M12 22v-6", key: "bottom-line" }],
  ["path", { d: "m9 19 3-3 3 3", key: "bottom-arrow" }],
]);

// TODO(lucide-pr-4548): replace with lucide-react LayoutHorizontalBottom after upstream merge.
export const ProposedLayoutHorizontalBottom = createLucideIcon("ProposedLayoutHorizontalBottom", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "primary" }],
  ["rect", { width: "7", height: "10", x: "14", y: "11", rx: "1", key: "secondary" }],
]);

// TODO(lucide-pr-4548): replace with lucide-react LayoutHorizontalCenter after upstream merge.
export const ProposedLayoutHorizontalCenter = createLucideIcon("ProposedLayoutHorizontalCenter", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "primary" }],
  ["rect", { width: "7", height: "10", x: "14", y: "7", rx: "1", key: "secondary" }],
]);

// TODO(lucide-pr-4548): replace with lucide-react LayoutHorizontalTop after upstream merge.
export const ProposedLayoutHorizontalTop = createLucideIcon("ProposedLayoutHorizontalTop", [
  ["rect", { width: "7", height: "18", x: "3", y: "3", rx: "1", key: "primary" }],
  ["rect", { width: "7", height: "10", x: "14", y: "3", rx: "1", key: "secondary" }],
]);

// TODO(lucide-pr-4548): replace with lucide-react LayoutVerticalCenter after upstream merge.
export const ProposedLayoutVerticalCenter = createLucideIcon("ProposedLayoutVerticalCenter", [
  ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1", key: "primary" }],
  ["rect", { width: "10", height: "7", x: "7", y: "14", rx: "1", key: "secondary" }],
]);

// TODO(lucide-pr-4548): replace with lucide-react LayoutVerticalLeft after upstream merge.
export const ProposedLayoutVerticalLeft = createLucideIcon("ProposedLayoutVerticalLeft", [
  ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1", key: "primary" }],
  ["rect", { width: "10", height: "7", x: "3", y: "14", rx: "1", key: "secondary" }],
]);

// TODO(lucide-pr-4548): replace with lucide-react LayoutVerticalRight after upstream merge.
export const ProposedLayoutVerticalRight = createLucideIcon("ProposedLayoutVerticalRight", [
  ["rect", { width: "18", height: "7", x: "3", y: "3", rx: "1", key: "primary" }],
  ["rect", { width: "10", height: "7", x: "11", y: "14", rx: "1", key: "secondary" }],
]);

// TODO(lucide-pr-4550): replace with lucide-react ScanSquare after upstream merge.
export const ProposedScanSquare = createLucideIcon("ProposedScanSquare", [
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "top-left" }],
  ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "top-right" }],
  ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "bottom-right" }],
  ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "bottom-left" }],
  ["rect", { width: "8", height: "8", x: "8", y: "8", rx: "1", key: "square" }],
]);

// TODO(lucide-pr-3038): replace with lucide-react LetterSpacing after upstream merge.
// Owner-proposed large-A variant (a-arrow-up family): two vertical bars + capital A.
export const ProposedLetterSpacing = createLucideIcon("ProposedLetterSpacing", [
  ["path", { d: "M3 2v20", key: "bar-left" }],
  ["path", { d: "M21 2v20", key: "bar-right" }],
  ["path", { d: "m7.5 17 4.039-9.69a.5.5 0 0 1 .923 0L16.5 17", key: "a-stroke" }],
  ["path", { d: "M8.804 14h6.392", key: "a-bar" }],
]);

// TODO(lucide-pr-4609): replace with lucide-react SquareText after upstream merge.
// Text-resizing "fixed size" glyph (owner ask): a solid square with three text
// lines — the fully bounded text box.
export const ProposedSquareText = createLucideIcon("ProposedSquareText", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "frame" }],
  ["path", { d: "M7 8h8", key: "line-1" }],
  ["path", { d: "M7 12h10", key: "line-2" }],
  ["path", { d: "M7 16h6", key: "line-3" }],
]);

// TODO(lucide-pr-4610): replace with lucide-react TextMargins after upstream merge.
// Text-resizing "auto height" glyph (owner ask): text bounded left and right by
// two vertical rules — fixed width, height flows.
export const ProposedTextMargins = createLucideIcon("ProposedTextMargins", [
  ["path", { d: "M3 3v18", key: "left" }],
  ["path", { d: "M21 3v18", key: "right" }],
  ["path", { d: "M7 8h8", key: "line-1" }],
  ["path", { d: "M7 12h10", key: "line-2" }],
  ["path", { d: "M7 16h6", key: "line-3" }],
]);

// TODO(lucide-pr-4615): replace with lucide-react DiamondCircle after upstream merge.
// Auto-keyframe / record glyph (owner ask): the `diamond-*` family outline with a
// centred circle — the keyframe diamond carrying the record dot. Geometry is copied
// verbatim from icons/diamond-circle.svg on the upstream PR branch, so the swap to
// the real import is a pure import change.
export const ProposedDiamondCircle = createLucideIcon("ProposedDiamondCircle", [
  ["path", { d: "M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z", key: "diamond" }],
  ["circle", { cx: "12", cy: "12", r: "4", key: "circle" }],
]);

// TODO(lucide-pr-3039): replace with lucide-react LineHeight after upstream merge.
// Owner-proposed large-A variant (a-arrow-up family): two horizontal bars + capital A.
export const ProposedLineHeight = createLucideIcon("ProposedLineHeight", [
  ["path", { d: "M2 3h20", key: "bar-top" }],
  ["path", { d: "M2 21h20", key: "bar-bottom" }],
  ["path", { d: "m7.5 17 4.039-9.69a.5.5 0 0 1 .923 0L16.5 17", key: "a-stroke" }],
  ["path", { d: "M8.804 14h6.392", key: "a-bar" }],
]);

// Composa-local. The owner's proposal lives on HIS FORK of Lucide —
// https://github.com/samuelalake/lucide/pull/1, "feat(icons): add rotate-cw-diamond"
// — not on lucide-icons/lucide, so there is no `lucide-react` export to import and
// no upstream PR number to record. That is why this icon is absent from
// `proposedLucideMetadata`, whose `sourceUrl` is typed to
// `https://github.com/lucide-icons/lucide/pull/{number}`; the same reasoning already
// keeps `ProposedLayoutWrap` out of that registry.
//
// Swap plan: if that PR is retargeted to lucide-icons/lucide and merges, add a
// `rotateCwDiamond` record to `proposedLucideMetadata`, then delete this shim and
// `import { RotateCwDiamond } from "lucide-react"` instead.
//
// Geometry is copied verbatim from the PR's rotate-cw-diamond glyph (24x24 viewBox,
// fill none, stroke currentColor, width 2, round caps and joins) so that swap is a
// pure import change: the `rotate-cw` arc and arrowhead above Lucide's own `diamond`
// body, scaled down to leave a gap under the arrow.
export const ProposedRotateCwDiamond = createLucideIcon("ProposedRotateCwDiamond", [
  ["path", { d: "M6 7a7 7 0 0 1 11.5-1.5", key: "arc" }],
  ["path", { d: "M18 2v4h-4", key: "arrowhead" }],
  ["path", { d: "M6.699 14.531a1.374 1.374 0 0 0 0 1.944l4.326 4.326a1.374 1.374 0 0 0 1.944 0l4.326 -4.326a1.374 1.374 0 0 0 0 -1.944l-4.326 -4.326a1.374 1.374 0 0 0 -1.944 0Z", key: "diamond" }],
]);
