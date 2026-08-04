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
  ProposedLetterSpacing,
  ProposedLineHeight,
  ProposedOpacity,
  ProposedScanSquare,
  ProposedSquareText,
  ProposedTextMargins,
  proposedLucideMetadata,
} from "./proposed-lucide";

const icons = [
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
];

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
    expect(records).toHaveLength(icons.length);
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

  it("keeps Grid out of the proposed-icon registry because official Lucide owns it", () => {
    expect(JSON.stringify(proposedLucideMetadata)).not.toMatch(/layout.?grid/i);
  });
});
