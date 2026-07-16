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
  arrowUpDownToLine: { pr: 4546, sourceUrl: "https://github.com/lucide-icons/lucide/pull/4546", replacementImport: "ArrowUpDownToLine" },
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

// TODO(lucide-pr-4546): replace with lucide-react ArrowUpDownToLine after upstream merge.
export const ProposedArrowUpDownToLine = createLucideIcon("ProposedArrowUpDownToLine", [
  ["path", { d: "M12 2v6", key: "top-line" }],
  ["path", { d: "m9 5 3 3 3-3", key: "top-arrow" }],
  ["path", { d: "M2 12h20", key: "center-line" }],
  ["path", { d: "M12 22v-6", key: "bottom-line" }],
  ["path", { d: "m9 19 3-3 3 3", key: "bottom-arrow" }],
]);
