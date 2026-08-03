import { act, create, type ReactTestInstance, type ReactTestRenderer } from "react-test-renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AssetsPanel, type AssetItem, videoScrubTimeSeconds } from "./AssetsPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ASSETS: AssetItem[] = [
  {
    id: "video-a",
    name: "A.mp4",
    kind: "video",
    thumb: "blob:poster-a",
    duration: "0:10",
    videoPreview: { src: "blob:video-a", durationMs: 10_000 },
  },
  {
    id: "video-b",
    name: "B.mp4",
    kind: "video",
    thumb: "blob:poster-b",
    duration: "0:20",
    videoPreview: { src: "blob:video-b", durationMs: 20_000 },
  },
  { id: "image", name: "Still.png", kind: "image", thumb: "blob:image" },
];

function thumbnail(root: ReactTestInstance, id: string) {
  return root.find(node => node.props["data-asset-thumbnail"] === id);
}

function previews(root: ReactTestInstance) {
  return root.findAll(node => node.type === "video" && node.props["data-asset-scrub-preview"]);
}

describe("AssetsPanel — video hover scrub preview", () => {
  it("maps pointer position across the thumbnail and clamps both ends", () => {
    expect(videoScrubTimeSeconds(-50, 0, 100, 10)).toBe(0);
    expect(videoScrubTimeSeconds(50, 0, 100, 10)).toBeCloseTo(4.9995, 4);
    expect(videoScrubTimeSeconds(150, 0, 100, 10)).toBeCloseTo(9.999, 4);
    expect(videoScrubTimeSeconds(50, 0, 0, 10)).toBe(0);
    expect(videoScrubTimeSeconds(50, 0, 100, Number.NaN)).toBe(0);
  });

  it("mounts only the active hovered video decoder and restores the poster on leave", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<AssetsPanel assets={ASSETS} />); });
    expect(previews(renderer!.root)).toHaveLength(0);

    act(() => thumbnail(renderer!.root, "video-a").props.onPointerEnter({ pointerType: "mouse" }));
    expect(previews(renderer!.root)).toHaveLength(1);
    expect(previews(renderer!.root)[0].props.src).toBe("blob:video-a");
    expect(previews(renderer!.root)[0].props.muted).toBe(true);

    act(() => thumbnail(renderer!.root, "video-b").props.onPointerEnter({ pointerType: "pen" }));
    expect(previews(renderer!.root)).toHaveLength(1);
    expect(previews(renderer!.root)[0].props.src).toBe("blob:video-b");

    act(() => thumbnail(renderer!.root, "video-b").props.onPointerLeave());
    expect(previews(renderer!.root)).toHaveLength(0);
    expect(renderer!.root.findAll(node => node.type === "img" && node.props.src === "blob:poster-b")).toHaveLength(1);
    act(() => renderer!.unmount());
  });

  it("keeps touch and non-video thumbnails on the static fallback", () => {
    let renderer: ReactTestRenderer;
    act(() => { renderer = create(<AssetsPanel assets={ASSETS} />); });
    act(() => thumbnail(renderer!.root, "video-a").props.onPointerEnter({ pointerType: "touch" }));
    act(() => thumbnail(renderer!.root, "image").props.onPointerEnter({ pointerType: "mouse" }));
    expect(previews(renderer!.root)).toHaveLength(0);
    act(() => renderer!.unmount());
  });

  it("describes skimming without replacing the idle poster or insert button", () => {
    const html = renderToStaticMarkup(<AssetsPanel assets={ASSETS} />);
    expect(html).toContain("Move the pointer horizontally over this thumbnail to preview the video.");
    expect(html).toContain('src="blob:poster-a"');
    expect(html).not.toContain("data-asset-scrub-preview");
    expect(html).toContain('aria-label="Add to timeline"');
  });
});
