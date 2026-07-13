import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SplitButton } from "./SplitButton";

describe("SplitButton semantics", () => {
  it("puts controlled action and menu names on the existing button anatomy", () => {
    const html = renderToStaticMarkup(<SplitButton icon={<span>icon</span>} actionLabel="Pause preview" menuLabel="Preview options" />);

    expect(html).toContain('aria-label="Pause preview"');
    expect(html).toContain('aria-label="Preview options"');
    expect(html.match(/type="button"/g)).toHaveLength(2);
  });
});
