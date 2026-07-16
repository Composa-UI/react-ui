import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AlignmentControl } from "./AlignmentControl";
import { SegmentedControl } from "./SegmentedControl";

describe("Segmented control anatomy", () => {
  it("uses background contrast for selection without internal separator strokes", () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        ariaLabel="Flow"
        segments={[
          { value: "vertical", label: "Vertical" },
          { value: "horizontal", label: "Horizontal" },
        ]}
        value="horizontal"
        onChange={() => undefined}
      />,
    );

    expect(html).toContain('data-composa-segmented-surface="true"');
    expect(html).toContain('data-state="selected"');
    expect(html).toContain("bg-c-bg text-c-text");
    expect(html).toContain("focus-visible:ring-c-border-selected-strong");
    expect(html).not.toContain("ring-c-border-translucent");
    expect(html).not.toMatch(/\bborder-[lr]\b/);
  });

  it("exports the canonical 3x3 alignment value contract on the shared surface", () => {
    const html = renderToStaticMarkup(
      <AlignmentControl value="br" onChange={() => undefined} />,
    );

    expect(html).toContain('data-composa-component="AlignmentControl"');
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/role="radio"/g)).toHaveLength(9);
    expect(html).toMatch(/data-state="selected"[^>]*aria-checked="true" aria-label="Bottom right"/);
    expect(html).toContain("grid-cols-3");
  });
});
