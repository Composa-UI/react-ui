import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyPanel } from "./PropertyPanel";

/**
 * The export Suffix field is gone (Composa#661).
 *
 * The app stopped reading it, which left a field that still looked editable,
 * still carried a placeholder, and could no longer change an exported filename —
 * the inert-control defect this repo treats as a real bug. Removed rather than
 * disabled: a disabled field still promises the feature exists.
 *
 * Asserts the panel rendered its export row FIRST, so the absence below cannot
 * pass because nothing rendered at all.
 */
const exportSettings = [{ id: "e1", scale: 1, suffix: "", format: "PNG" as const }];

const markup = () =>
  renderToStaticMarkup(
    <PropertyPanel mode="element" exportSettings={exportSettings} />,
  );

describe("export row", () => {
  it("renders the export row it is asserting about", () => {
    // The scale field and the format dropdown both survive, so a missing Suffix
    // is a deliberate removal rather than a panel that failed to render.
    expect(markup()).toContain("PNG");
  });

  it("no longer offers a Suffix field", () => {
    expect(markup()).not.toContain('placeholder="Suffix"');
  });
});
