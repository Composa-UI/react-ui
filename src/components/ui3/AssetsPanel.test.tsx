import { renderToStaticMarkup } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { AssetsPanel, type AssetItem, type AssetFilter } from "./AssetsPanel";
import { Button } from "./Button";
import { PopoverMenu } from "./Menu";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const AUDIO_TINT = "linear-gradient(135deg,#312e81,#6d28d9)";

const ASSETS: AssetItem[] = [
  { id: "img1", name: "hero-cover.png", kind: "image", tint: "linear-gradient(135deg,#7c5cff,#ff6ac1)" },
  { id: "vid1", name: "intro-clip.mp4", kind: "video", tint: "linear-gradient(135deg,#111827,#374151)", duration: "0:24" },
  { id: "aud1", name: "score.mp3", kind: "audio", tint: AUDIO_TINT, duration: "1:12" },
];

describe("AssetsPanel — audio thumbnail is a waveform, not a colour", () => {
  it("gives every resting thumbnail a visible token-backed boundary", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="all" />);
    const thumbnails = html.match(/<div[^>]*data-asset-thumbnail="[^"]+"[^>]*>/g) ?? [];
    expect(thumbnails).toHaveLength(3);
    thumbnails.forEach(tag => {
      expect(tag).toContain("ring-c-border");
      expect(tag).not.toContain("ring-c-border-translucent");
    });
  });

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
  it("uses the canonical media semantics in the filter menu (#749)", () => {
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<AssetsPanel assets={ASSETS} filter="all" />); });
    const filter = renderer!.root.findAllByType(PopoverMenu)
      .find(popover => popover.props.trigger?.props?.ariaLabel === "Filter by type");
    expect(filter).toBeTruthy();
    const menu = renderToStaticMarkup(filter!.props.children(() => undefined));
    expect(menu).toContain('data-icon-semantic="media-video"');
    expect(menu).toContain('data-icon-semantic="media-audio"');
    act(() => renderer!.unmount());
  });

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

  it("is a borderless, label-only trigger matching the canvas-size control (#460)", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="images" />);
    const triggerTag = html.match(/<button[^>]*aria-label="Filter by type"[^>]*>/)?.[0] ?? "";
    expect(triggerTag).not.toBe("");
    // Borderless: stroke={false} omits the ring-1 ring-inset border entirely.
    expect(triggerTag).not.toContain("ring-1");
    // Label-only: no leading kind icon slot in the trigger, so the Volume2/Film/
    // Image glyph does not paint alongside the label (menu rows still carry icons).
    expect(triggerTag).not.toContain("bg-c-bg-secondary");
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


describe("AssetsPanel — filtered empty imports (owner ledger row45)", () => {
  it.each([
    ["all", "No assets yet", "Upload media"],
    ["images", "No images yet", "Upload images"],
    ["videos", "No videos yet", "Upload video"],
    ["audio", "No audio yet", "Upload audio"],
  ] as const)("offers an import action for empty %s", (filter, message, label) => {
    for (const assets of [[], ASSETS.filter(asset => filter === "audio" ? asset.kind !== "audio" : filter === "videos" ? asset.kind !== "video" : filter === "images" ? asset.kind !== "image" : false)]) {
      const onUpload = vi.fn();
      let renderer: ReturnType<typeof create>;
      act(() => { renderer = create(<AssetsPanel assets={assets} filter={filter} onUpload={onUpload} />); });
      const html = renderToStaticMarkup(<AssetsPanel assets={assets} filter={filter} onUpload={onUpload} />);
      expect(html).toContain(message);
      const button = renderer!.root.findAllByType(Button).find(node => node.props.label === label);
      expect(button).toBeTruthy();
      act(() => button!.props.onClick());
      expect(onUpload).toHaveBeenCalledTimes(1);
      act(() => renderer!.unmount());
    }
  });

  it("distinguishes a failed name search from an empty type", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} filter="audio" query="absent" onUpload={() => {}} />);
    expect(html).toContain("No matching assets");
    expect(html).not.toContain("No audio yet");
    expect(html).not.toContain("Upload audio");
  });

  it("does not offer a dead empty-state action without an upload capability", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={[]} filter="audio" />);
    expect(html).toContain("No audio yet");
    expect(html).not.toContain("Upload audio");
  });
});
