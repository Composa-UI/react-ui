import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Waveform } from "./Waveform";

describe("Waveform", () => {
  it("is deterministic — the same seed draws the same bars", () => {
    const a = renderToStaticMarkup(<Waveform seed="score.mp3" />);
    const b = renderToStaticMarkup(<Waveform seed="score.mp3" />);
    expect(a).toBe(b);
  });

  it("varies by seed", () => {
    const a = renderToStaticMarkup(<Waveform seed="score.mp3" />);
    const b = renderToStaticMarkup(<Waveform seed="voiceover.wav" />);
    expect(a).not.toBe(b);
  });

  it("renders one bar rect per requested bar", () => {
    const html = renderToStaticMarkup(<Waveform seed="x" bars={12} />);
    expect((html.match(/<rect/g) ?? []).length).toBe(12);
  });

  it("stretches to its container (preserveAspectRatio=none) and is aria-hidden", () => {
    const html = renderToStaticMarkup(<Waveform seed="x" />);
    expect(html).toContain('preserveAspectRatio="none"');
    expect(html).toContain('aria-hidden="true"');
  });

  it("honours explicit peaks over the seed", () => {
    const html = renderToStaticMarkup(<Waveform peaks={[0.5, 1, 0.25]} />);
    expect((html.match(/<rect/g) ?? []).length).toBe(3);
  });
});
