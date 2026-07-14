import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SlidesPanel } from "./SlidesPanel";

describe("SlidesPanel spacing contracts", () => {
  it("keeps selected thumbnails inset from the highlight and the list edges", () => {
    const html = renderToStaticMarkup(<SlidesPanel slides={[{ n: 1, selected: true, tint: "#fff" }]} />);
    expect(html).toContain("flex flex-col py-[4px]");
    expect(html).toContain("right-[4px]");
    expect(html).toContain("top-[8px] right-[12px]");
  });
});
