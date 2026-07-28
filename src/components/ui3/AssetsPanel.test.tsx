import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssetsPanel, type AssetItem, type AssetFilter } from "./AssetsPanel";

const AUDIO_TINT = "linear-gradient(135deg,#312e81,#6d28d9)";

const ASSETS: AssetItem[] = [
  { id: "img1", name: "hero-cover.png", kind: "image", tint: "linear-gradient(135deg,#7c5cff,#ff6ac1)" },
  { id: "vid1", name: "intro-clip.mp4", kind: "video", tint: "linear-gradient(135deg,#111827,#374151)", duration: "0:24" },
  { id: "aud1", name: "score.mp3", kind: "audio", tint: AUDIO_TINT, duration: "1:12" },
];

describe("AssetsPanel — audio thumbnail is a waveform, not a colour", () => {
  it("draws an SVG waveform for an audio card instead of a solid tint", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="audio" />);
    // The Waveform is the only stretched svg (preserveAspectRatio="none").
    expect(html).toContain('preserveAspectRatio="none"');
    // The audio tint must NOT be painted as the card background any more.
    expect(html).not.toContain(AUDIO_TINT);
  });

  it("still shows the AUD badge and duration on the audio card", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="audio" />);
    expect(html).toContain("AUD");
    expect(html).toContain("1:12");
  });

  it("keeps the tint swatch for image/video cards (no waveform)", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="images" />);
    expect(html).not.toContain('preserveAspectRatio="none"');
    expect(html).toContain("linear-gradient(135deg,#7c5cff,#ff6ac1)");
  });
});

describe("AssetsPanel — type filter is a dropdown, not a segmented control", () => {
  it("renders a single dropdown trigger, not four segmented buttons", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="all" />);
    expect(html).toContain('aria-label="Filter by type"');
    // A segmented control would paint all four option labels at once; the
    // dropdown (menu closed) shows only the active one.
    expect(html).toContain(">All</span>");
    expect(html).not.toContain(">Images</span>");
    expect(html).not.toContain(">Videos</span>");
    expect(html).not.toContain(">Audio</span>");
  });

  it("reflects every kind (all · images · videos · audio) as the dropdown value", () => {
    const labels: Record<AssetFilter, string> = {
      all: "All",
      images: "Images",
      videos: "Videos",
      audio: "Audio",
    };
    (Object.keys(labels) as AssetFilter[]).forEach((filter) => {
      const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter={filter} />);
      expect(html).toContain(`>${labels[filter]}</span>`);
    });
  });
});

describe("AssetsPanel — filtering", () => {
  it("shows only audio cards when the audio filter is active", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="audio" />);
    expect(html).toContain("score.mp3");
    expect(html).not.toContain("hero-cover.png");
    expect(html).not.toContain("intro-clip.mp4");
  });
});
