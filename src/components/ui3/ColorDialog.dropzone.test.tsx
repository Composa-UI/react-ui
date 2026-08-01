import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ColorDialog } from "./ColorDialog";

// InspectorDialog is a Radix popover and does not render its children in a bare
// renderer — the same mock the sibling suite uses, for the same reason. Without
// it every assertion here would pass vacuously against an empty tree.
vi.mock("./InspectorDialog", () => ({
  InspectorDialog: ({ trigger, children }: { trigger: ReactElement; children: ReactNode }) => (
    <div>{trigger}{children}</div>
  ),
}));

/**
 * The drop zone is its OWN fill type, not a replacement for Video. They are
 * different things: Video fills a shape with a FILE, a drop zone is a window
 * onto a timeline TRACK. Replacing one with the other would delete a real
 * capability to make room for a different one.
 */
const html = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(<ColorDialog open onClose={() => undefined} trigger={<button>Color</button>} {...props} />);

const enabled = {
  capabilities: { dropZone: true },
  onSelectDropZoneSource: () => undefined,
  dropZoneSources: [{ id: "video", label: "Video track" }],
};

describe("drop zone fill type", () => {
  it("renders the dialog at all — this guards every negative assertion below", () => {
    // The first version of this file asserted absence against an empty tree and
    // passed while proving nothing.
    expect(html()).toContain('aria-label="Image"');
  });

  it("is offered when the host can service it", () => {
    expect(html(enabled)).toContain('aria-label="Drop zone"');
  });

  it("is NOT offered when the host cannot — no control that does nothing", () => {
    expect(html({ capabilities: { dropZone: true } })).not.toContain('aria-label="Drop zone"');
    expect(html({ onSelectDropZoneSource: () => undefined })).not.toContain('aria-label="Drop zone"');
  });

  it("does not displace the Video fill type", () => {
    const markup = html({
      ...enabled,
      capabilities: { dropZone: true, videoFill: true },
      onChooseVideo: () => undefined,
    });
    expect(markup).toContain('aria-label="Video"');
    expect(markup).toContain('aria-label="Drop zone"');
  });

  it("asks for a source when the zone is empty", () => {
    expect(html({ ...enabled, fillType: "drop-zone" })).toContain("Select source");
  });

  it("names the bound track instead, once one is chosen", () => {
    const markup = html({ ...enabled, fillType: "drop-zone", dropZoneSourceId: "video" });
    expect(markup).toContain("Video track");
    expect(markup).not.toContain("Select source");
  });
});

describe("controls that do nothing are not shown", () => {
  it("no longer offers Blend mode or contrast checking", () => {
    // Both rendered with no onClick at all. Removed rather than disabled: a
    // disabled control still promises the feature exists somewhere.
    const markup = html();
    expect(markup).not.toContain('aria-label="Blend mode"');
    expect(markup).not.toContain('aria-label="Check color contrast"');
  });
});
