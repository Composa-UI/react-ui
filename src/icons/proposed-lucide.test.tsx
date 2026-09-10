import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ProposedAngle,
  ProposedArrowUpDownToLine,
  ProposedDiamondCircle,
  ProposedGapHorizontal,
  ProposedGapVertical,
  ProposedLayoutFreeform,
  ProposedLayoutHorizontal,
  ProposedLayoutPanelLeftCheck,
  ProposedLayoutPanelLeftPlus,
  ProposedLayoutVertical,
  ProposedLayoutHorizontalBottom,
  ProposedLayoutHorizontalCenter,
  ProposedLayoutHorizontalTop,
  ProposedLayoutVerticalCenter,
  ProposedLayoutVerticalLeft,
  ProposedLayoutVerticalRight,
  ProposedLayoutWrap,
  ProposedLetterSpacing,
  ProposedLineHeight,
  ProposedOpacity,
  ProposedRotateCwDiamond,
  ProposedRouteArrowRight,
  ProposedScanSquare,
  ProposedSquareText,
  ProposedTextMargins,
  proposedLucideMetadata,
} from "./proposed-lucide";

// Icons that DO have a lucide-icons/lucide PR behind them, and therefore a
// `proposedLucideMetadata` record. The registry test counts against this list.
const upstreamProposedIcons = [
  ProposedLayoutHorizontal,
  ProposedLayoutVertical,
  ProposedLayoutPanelLeftCheck,
  ProposedLayoutPanelLeftPlus,
  ProposedLayoutFreeform,
  ProposedGapHorizontal,
  ProposedGapVertical,
  ProposedAngle,
  ProposedOpacity,
  ProposedArrowUpDownToLine,
  ProposedLayoutHorizontalBottom,
  ProposedLayoutHorizontalCenter,
  ProposedLayoutHorizontalTop,
  ProposedLayoutVerticalCenter,
  ProposedLayoutVerticalLeft,
  ProposedLayoutVerticalRight,
  ProposedScanSquare,
  ProposedLetterSpacing,
  ProposedLineHeight,
  ProposedSquareText,
  ProposedTextMargins,
  ProposedDiamondCircle,
  ProposedRouteArrowRight,
];

// Composa-local glyphs with no lucide-icons/lucide PR — deliberately absent from
// `proposedLucideMetadata`. ProposedRotateCwDiamond's proposal is on the owner's
// fork (samuelalake/lucide#1), which the metadata `sourceUrl` template rejects.
// They still have to honour the Lucide SVG contract, so the contract test covers
// both lists.
const composaLocalIcons = [ProposedLayoutWrap, ProposedRotateCwDiamond];

const icons = [...upstreamProposedIcons, ...composaLocalIcons];

describe("proposed Lucide icon boundary", () => {
  it.each(icons)("keeps the Lucide SVG contract and forwards consumer props", Icon => {
    const html = renderToStaticMarkup(<Icon size={18} strokeWidth={1.5} className="semantic-icon" data-probe="forwarded" />);
    expect(html).toContain('width="18"');
    expect(html).toContain('height="18"');
    expect(html).toContain('viewBox="0 0 24 24"');
    expect(html).toContain('fill="none"');
    expect(html).toContain('stroke="currentColor"');
    expect(html).toContain('stroke-width="1.5"');
    expect(html).toContain('class="lucide');
    expect(html).toContain("semantic-icon");
    expect(html).toContain('data-probe="forwarded"');
  });

  it("keeps one searchable upstream replacement record per proposed icon", () => {
    const records = Object.values(proposedLucideMetadata);
    expect(records).toHaveLength(upstreamProposedIcons.length);
    expect(new Set(records.map(record => `${record.pr}:${record.replacementImport}`)).size).toBe(records.length);
    for (const record of records) {
      expect(record.sourceUrl).toBe(`https://github.com/lucide-icons/lucide/pull/${record.pr}`);
      expect(record.replacementImport).toMatch(/^[A-Z][A-Za-z]+$/);
    }
  });

  // The class name alone can't tell a diamond-circle from a plain circle, so pin the
  // geometry against icons/diamond-circle.svg on lucide#4615 verbatim. When that PR
  // merges and this shim is deleted, this expectation goes with it.
  it("vendors lucide#4615 diamond-circle geometry, not a bare circle", () => {
    const html = renderToStaticMarkup(<ProposedDiamondCircle />);
    expect(html).toContain(
      'd="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41L13.7 2.71a2.41 2.41 0 0 0-3.41 0z"',
    );
    expect(html).toContain('<circle cx="12" cy="12" r="4">');
  });

  it("vendors lucide#4729 route-arrow-right geometry for automatic positioning", () => {
    const html = renderToStaticMarkup(<ProposedRouteArrowRight />);
    expect(html).toContain('d="M3 5H17.5a3.5 3.5 0 0 1 0 7H6.5a3.5 3.5 0 0 0 0 7H21"');
    expect(html).toContain('d="m18 16 3 3-3 3"');
  });

  // A rotate-cw arc alone is indistinguishable from lucide-react's own RotateCw, so
  // pin all three subpaths of samuelalake/lucide#1's rotate-cw-diamond verbatim.
  // When that proposal lands upstream and this shim is deleted, so is this test.
  it("vendors samuelalake/lucide#1 rotate-cw-diamond geometry, not a bare RotateCw", () => {
    const html = renderToStaticMarkup(<ProposedRotateCwDiamond />);
    expect(html).toContain('d="M6 7a7 7 0 0 1 11.5-1.5"');
    expect(html).toContain('d="M18 2v4h-4"');
    expect(html).toContain(
      'd="M6.699 14.531a1.374 1.374 0 0 0 0 1.944l4.326 4.326a1.374 1.374 0 0 0 1.944 0l4.326 -4.326a1.374 1.374 0 0 0 0 -1.944l-4.326 -4.326a1.374 1.374 0 0 0 -1.944 0Z"',
    );
  });

  it("keeps the fork-proposed rotate glyph out of the upstream registry", () => {
    expect(JSON.stringify(proposedLucideMetadata)).not.toMatch(/rotate.?cw.?diamond/i);
  });

  it("keeps Grid out of the proposed-icon registry because official Lucide owns it", () => {
    expect(JSON.stringify(proposedLucideMetadata)).not.toMatch(/layout.?grid/i);
  });
});
