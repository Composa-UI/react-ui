import { renderToStaticMarkup } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { SlideListItem, SlidesPanel } from "./SlidesPanel";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("SlidesPanel spacing contracts", () => {
  it("keeps selected thumbnails inset from the highlight and the list edges", () => {
    const html = renderToStaticMarkup(<SlidesPanel slides={[{ n: 1, selected: true, tint: "#fff" }]} />);
    expect(html).toContain("flex flex-col py-[4px]");
    expect(html).toContain("right-[4px]");
    expect(html).toContain("top-[8px] right-[12px]");
  });
});

describe("SlideListItem preview intent", () => {
  it("stays active when focus leaves while the pointer remains inside", () => {
    const onPreviewChange = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<SlideListItem item={{ n: 1, onPreviewChange }} />); });
    const row = renderer!.root.findByProps({ role: "option" });

    act(() => row.props.onMouseEnter());
    act(() => row.props.onFocusCapture());
    act(() => row.props.onBlurCapture());
    expect(onPreviewChange.mock.calls).toEqual([[true]]);
    act(() => row.props.onMouseLeave());
    expect(onPreviewChange.mock.calls).toEqual([[true], [false]]);
    act(() => renderer!.unmount());
  });

  it("stays active when the pointer leaves while keyboard focus remains", () => {
    const onPreviewChange = vi.fn();
    let renderer: ReturnType<typeof create>;
    act(() => { renderer = create(<SlideListItem item={{ n: 1, onPreviewChange }} />); });
    const row = renderer!.root.findByProps({ role: "option" });

    act(() => row.props.onFocusCapture());
    act(() => row.props.onMouseEnter());
    act(() => row.props.onMouseLeave());
    expect(onPreviewChange.mock.calls).toEqual([[true]]);
    act(() => row.props.onBlurCapture());
    expect(onPreviewChange.mock.calls).toEqual([[true], [false]]);
    act(() => renderer!.unmount());
  });
});
