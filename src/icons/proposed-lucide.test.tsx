import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ProposedAngle,
  ProposedArrowUpDownToLine,
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

  it("does not register the non-V1 layout-grid capability", () => {
    expect(JSON.stringify(proposedLucideMetadata)).not.toMatch(/layout.?grid/i);
  });
});
