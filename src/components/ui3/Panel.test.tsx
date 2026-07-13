import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PanelSection } from "./Panel";

describe("PanelSection landmarks", () => {
  it("opts into a region named by the existing visible title", () => {
    const html = renderToStaticMarkup(<PanelSection title="Timeline" landmark><span>Content</span></PanelSection>);
    const labelledBy = html.match(/role="region" aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`id="${labelledBy}"`);
    expect(html).toContain(">Timeline</span>");
  });

  it("stays non-landmark by default and supports a clickable label source", () => {
    expect(renderToStaticMarkup(<PanelSection title="Layout" />)).not.toContain('role="region"');
    const html = renderToStaticMarkup(<PanelSection title="Selection colors" landmark onHeaderClick={() => undefined} />);
    const labelledBy = html.match(/role="region" aria-labelledby="([^"]+)"/)?.[1];
    expect(labelledBy).toBeTruthy();
    expect(html).toContain(`<button id="${labelledBy}"`);
  });
});
