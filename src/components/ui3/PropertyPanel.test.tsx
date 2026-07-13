import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PropertyPanel } from "./PropertyPanel";

describe("Video Clip inspector semantics", () => {
  it("exposes opt-in landmarks and precisely named controls", () => {
    const html = renderToStaticMarkup(<PropertyPanel mode="video-clip" clipStart={2} clipDuration={3}
      clipTrimIn={0} clipTrimOut={3} clipSpeed={1} />);

    expect(html.match(/role="region"/g)).toHaveLength(4);
    for (const title of ["Source", "Timeline", "Trim", "Playback"]) expect(html).toContain(`>${title}</span>`);
    for (const name of ["Start", "End", "Duration", "Trim in", "Trim out", "Volume"]) {
      expect(html).toContain(`aria-label="${name}"`);
    }
    const speedTrigger = html.match(/<button[^>]*aria-label="Speed: 1×"[^>]*>/)?.[0];
    expect(speedTrigger).toBeTruthy();
    expect(speedTrigger).toContain('aria-haspopup="menu"');
    expect(speedTrigger).toContain('aria-expanded="false"');
    expect(html).toMatch(/aria-label="Volume"[^>]*disabled=""/);
  });
});
